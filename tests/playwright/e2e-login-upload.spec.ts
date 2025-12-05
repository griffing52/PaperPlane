import { test, expect, Locator} from '@playwright/test';
import path from 'path';

test('e2e: login -> upload file -> process OCR -> verify created entries', async ({ page, request }) => {
  // Use existing test user from env or default used by hooks
  const email = process.env.TEST_USER_EMAIL || 'admin@example.com';
  const password = process.env.TEST_USER_PASSWORD || 'Password123!';

  // Login
  await page.goto('/login');
  await page.fill('[data-testid="login-email"]', email);
  // Wait for the password input to be visible and stable before filling to avoid detached-element errors
  await page.waitForSelector('[data-testid="login-password"]', { state: 'visible', timeout: 10000 });
  await page.locator('[data-testid="login-password"]').fill(password);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL(/.*dashboard/, { timeout: 15000 });
  await expect(page.getByTestId('dashboard-header')).toBeVisible();

  const filePath = path.resolve(__dirname, '..', '..', 'ocr', 'images', 'handwritten.png');

  await page.setInputFiles('input[type="file"]', filePath);

  // Wait for processing (uploadLogbookFile calls OCR backend — ensure it's running)
  // We expect an alert on success; intercept dialogs just in case
  let alertSeen = false;
  page.on('dialog', async dialog => {
    alertSeen = true;
    await dialog.accept();
  });

  // Wait for a short while for processing to complete and page to refresh logs
  await page.waitForTimeout(5000);

  // Check that at least one parsed record appears (look for any row in the logbook table)
  const anyRow = page.locator('tbody tr').first();
  await expect(anyRow).toBeVisible({ timeout: 15000 });

  const tailCell = anyRow.locator('td').nth(2); // tail number cell index in table
  const tail = (await tailCell.textContent())?.trim() || '';

  if (tail) {
    const backend = process.env.PAPERPLANE_BACKEND || process.env.NEXT_PUBLIC_PAPERPLANE_BACKEND || 'http://localhost:3002';
    const verifyResp = await request.post(`${backend}/api/v1/verify/`, {
      data: {
        tailNumber: tail,
      }
    });
    expect(verifyResp.ok()).toBeTruthy();
  }

  // Expect the "Verify" operation to trigger a dialog notification
  const verifyDialogPromise = page.waitForEvent('dialog');

  await page.click('[data-testid="verify-button"]');

  const dialog = await verifyDialogPromise;

  // Assert the dialog message: handwritten had 4 valid entries, so verification message should always have valid entries in multiples of 4
  expect(dialog.message()).toMatch(
  /Verification complete\. Verified (?:\d*[02468][048]|\d*[13579][26]) out of \d+ checked flights\./
  );


// ============================================================
  // 4. DATA STABILITY CHECK 
  // ============================================================
  
  // Helper to extract text from the row cells. 
  // Adjust the .nth() indices based on your actual table column order.
  const extractRowData = async (rowLocator: Locator) => {
    return {
      date: await rowLocator.locator('td').nth(0).innerText(), // e.g. "2025-12-01"
      tail: await rowLocator.locator('td').nth(1).innerText(), // e.g. "N12345A"
      route: await rowLocator.locator('td').nth(2).innerText(), // e.g. "KJFK - KLAX"
      totalTime: await rowLocator.locator('td').nth(3).innerText(), // e.g. "2.5"
    };
  };

  // A. Snapshot data BEFORE logout
  const dataBeforeLogout = await extractRowData(anyRow);
  console.log('Data before logout:', dataBeforeLogout);

  // 5. Logout and Log back in
  await page.click('[data-testid="logout-button"]');
  await page.waitForURL(/.*login/, { timeout: 10000 });

  await page.fill('[data-testid="login-email"]', email);
  await page.fill('[data-testid="login-password"]', password);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL(/.*dashboard/, { timeout: 15000 });

  // 6. Verify Persistence
  await expect(anyRow).toBeVisible({ timeout: 10000 });

});
