import { test, expect, Locator } from '@playwright/test';

test('e2e: signup -> add -> edit -> delete -> verify', async ({ page, request }) => {
  const email = `e2e-${Date.now()}@example.com`;
  const password = 'Password123!';

  // 1. Sign up
  await page.goto('/signup');
  await page.fill('#first-name', 'E2E');
  await page.fill('#last-name', 'Runner');
  await page.fill('[data-testid="signup-email"]', email);
  await page.fill('[data-testid="signup-password"]', password);
  await page.fill('[data-testid="signup-confirm"]', password);
  await page.click('[data-testid="signup-button"]');

  // Dashboard should load
  await page.waitForURL(/.*dashboard/, { timeout: 15000 });
  await expect(page.getByTestId('dashboard-header')).toBeVisible();

  // 2. Add a flight entry
  await page.click('text=Add entry');
  await page.waitForSelector('text=Add Flight Entry');

  const tail = `N${Math.floor(Math.random() * 90000) + 10000}`;
  
  // Fill modal inputs
  await page.fill('input[type="date"]', '2025-12-01');
  await page.fill('input[placeholder="N12345"]', tail);
  await page.fill('input[placeholder="KAPA"]', 'KJFK');
  await page.fill('input[placeholder="KCOS"]', 'KLAX');
  
  // If no name attr, your .nth approach is fine for now, but brittle:
  if (await page.locator('input[name="totalTime"]').count() === 0) {
      await page.locator('input[type="number"]').nth(0).fill('2.5'); 
      await page.locator('input[type="number"]').nth(1).fill('2.5'); 
  }

  await page.click('text=Save Entry');

  // 3. Edit the entry
  const row = page.locator('tr', { hasText: tail });
  await expect(row).toBeVisible({ timeout: 10000 });
  
  await row.hover();
  await row.locator('button[title="Edit entry"]').click();
  await page.waitForSelector('text=Edit Flight Entry');
  
  const newTail = tail + 'A';
  await page.fill('input[placeholder="N12345"]', newTail);
  await page.click('text=Update Entry');

  // Verify updated row exists
  const targetRow = page.locator('tr', { hasText: newTail });
  await expect(targetRow).toBeVisible({ timeout: 10000 });

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
  const dataBeforeLogout = await extractRowData(targetRow);
  console.log('Data before logout:', dataBeforeLogout);

  // 5. Logout and Log back in
  await page.click('[data-testid="logout-button"]');
  await page.waitForURL(/.*login/, { timeout: 10000 });

  await page.fill('[data-testid="login-email"]', email);
  await page.fill('[data-testid="login-password"]', password);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL(/.*dashboard/, { timeout: 15000 });

  // 6. Verify Persistence
  await expect(targetRow).toBeVisible({ timeout: 10000 });

  // B. Snapshot data AFTER login
  const dataAfterLogin = await extractRowData(targetRow);
  console.log('Data after login:', dataAfterLogin);

  // C. Compare the two objects
  expect(dataAfterLogin).toEqual(dataBeforeLogout);

  // ============================================================

  // 7. Delete the entry
  await targetRow.locator('input[type="checkbox"]').check();
  page.on('dialog', async dialog => { await dialog.accept(); });
  await page.locator('button', { hasText: /Delete\s*\(/ }).click();

  // Verify deletion
  await expect(targetRow).not.toBeVisible({ timeout: 10000 });

  // 8. Backend Verification
  const backend = process.env.PAPERPLANE_BACKEND || 'http://localhost:3002';
  
  const verifyResp = await request.post(`${backend}/api/v1/verify/`, {
    data: {
      tailNumber: newTail,
      originAirportIcao: 'KJFK',
      destinationAirportIcao: 'KLAX',
      departureTime: new Date('2025-12-01T10:00:00Z').toISOString(),
    }
  });

  expect(verifyResp.ok()).toBeTruthy();
});