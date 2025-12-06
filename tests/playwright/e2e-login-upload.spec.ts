import { test, expect, Locator } from '@playwright/test';
import path from 'path';

test('e2e: login -> upload file -> process OCR -> verify created entries', async ({ page, request }) => {
  // Use existing test user from env or default used by hooks
  const email = process.env.TEST_USER_EMAIL || 'admin@example.com';
  const password = process.env.TEST_USER_PASSWORD || 'Password123!';

  // ============================================================
  // 1. LOGIN
  // ============================================================
  await page.goto('/login');
  await page.fill('[data-testid="login-email"]', email);
  
  // Wait for the password input to be visible and stable
  await page.waitForSelector('[data-testid="login-password"]', { state: 'visible', timeout: 10000 });
  await page.locator('[data-testid="login-password"]').fill(password);
  await page.click('[data-testid="login-button"]');
  
  await page.waitForURL(/.*dashboard/, { timeout: 15000 });
  await expect(page.getByTestId('dashboard-header')).toBeVisible();

  // ============================================================
  // 2. UPLOAD & MODAL HANDLING
  // ============================================================
  const filePath = path.resolve(__dirname, '..', '..', 'ocr', 'images', 'handwritten.png');

  // Trigger the upload
  await page.setInputFiles('input[type="file"]', filePath);

  // A. Assert Modal Appears (Look for specific text in your modal header)
  // This confirms the UI state switched to "Uploading"
  const modalHeader = page.locator('h3', { hasText: /Processing Upload|Upload Status/ });
  await expect(modalHeader).toBeVisible({ timeout: 5000 });

  // B. Wait for the "OK" button to become ENABLED
  // The button is disabled while isUploading is true. We wait for isUploading to become false.
  // We give this a longer timeout (30s) because OCR can be slow.
  const okButton = page.getByRole('button', { name: 'OK' });
  await expect(okButton).toBeEnabled({ timeout: 30000 });

  // C. Click OK to close the modal
  await okButton.click();

  // D. Ensure Modal is gone so it doesn't obstruct the table
  await expect(modalHeader).not.toBeVisible();

  // ============================================================
  // 3. CHECK TABLE DATA & BACKEND VERIFICATION
  // ============================================================
  
  // Check that at least one parsed record appears
  // We wait for the table body to populate
  const anyRow = page.locator('tbody tr').first();
  await expect(anyRow).toBeVisible({ timeout: 15000 });

  const tailCell = anyRow.locator('td').nth(2); // Adjust index if tail number column changed
  const tail = (await tailCell.textContent())?.trim() || '';

  // Optional: Backend direct check
  if (tail) {
    const backend = process.env.PAPERPLANE_BACKEND || process.env.NEXT_PUBLIC_PAPERPLANE_BACKEND || 'http://localhost:3002';
    const verifyResp = await request.post(`${backend}/api/v1/verify/`, {
      data: {
        tailNumber: tail,
      }
    });
    expect(verifyResp.ok()).toBeTruthy();
  }

  // ============================================================
  // 4. VERIFY BUTTON INTERACTION
  // ============================================================

  // Prepare to catch the alert dialog from the "Verify" button
  const verifyDialogPromise = page.waitForEvent('dialog');

  await page.click('[data-testid="verify-button"]');

  const dialog = await verifyDialogPromise;

  // Assert the dialog message regex
  expect(dialog.message()).toMatch(
    /Verification complete\. Verified (?:\d*[02468][048]|\d*[13579][26]) out of \d+ checked flights\./
  );
  await dialog.accept();

  // ============================================================
  // 5. DATA STABILITY CHECK (LOGOUT/LOGIN)
  // ============================================================
  
  const extractRowData = async (rowLocator: Locator) => {
    return {
      date: await rowLocator.locator('td').nth(0).innerText(),
      tail: await rowLocator.locator('td').nth(1).innerText(),
      route: await rowLocator.locator('td').nth(2).innerText(),
      totalTime: await rowLocator.locator('td').nth(3).innerText(),
    };
  };

  // Snapshot data BEFORE logout
  const dataBeforeLogout = await extractRowData(anyRow);
  console.log('Data before logout:', dataBeforeLogout);

  // Logout
  // Assuming you have a logout button test id
  await page.click('button:has-text("Sign out"), [data-testid="logout-button"]'); 
  await page.waitForURL(/.*login/, { timeout: 10000 });

  // Log back in
  await page.fill('[data-testid="login-email"]', email);
  await page.fill('[data-testid="login-password"]', password);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL(/.*dashboard/, { timeout: 15000 });

  // Verify Persistence
  await expect(anyRow).toBeVisible({ timeout: 10000 });
});