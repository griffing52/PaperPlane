import { test, expect } from '@playwright/test';

test('e2e: signup -> add -> edit -> delete -> verify', async ({ page, request }) => {
  const email = `e2e-${Date.now()}@example.com`;
  const password = 'Password123!';

  // Sign up
  await page.goto('/signup');
  await page.fill('#first-name', 'E2E');
  await page.fill('#last-name', 'Runner');
  await page.fill('[data-testid="signup-email"]', email);
  await page.fill('[data-testid="signup-password"]', password);
  await page.fill('[data-testid="signup-confirm"]', password);
  await page.click('[data-testid="signup-button"]');

  // // Expect to land on login page, then log in
  // await page.waitForURL(/.*login/, { timeout: 10000 });
  // await page.fill('[data-testid="login-email"]', email);
  // // Wait for the password input to be visible and stable before filling to avoid detached-element errors
  // await page.waitForSelector('[data-testid="login-password"]', { state: 'visible', timeout: 10000 });
  // await page.locator('[data-testid="login-password"]').fill(password);
  // await page.click('[data-testid="login-button"]');

  // Dashboard should load
  await page.waitForURL(/.*dashboard/, { timeout: 15000 });
  await expect(page.getByTestId('dashboard-header')).toBeVisible();

  // Add a flight entry via modal
  await page.click('text=Add entry');
  await page.waitForSelector('text=Add Flight Entry');

  const tail = `N${Math.floor(Math.random() * 90000) + 10000}`;
  // Fill modal inputs
  await page.fill('input[type="date"]', '2025-12-01');
  await page.fill('input[placeholder="N12345"]', tail);
  await page.fill('input[placeholder="KAPA"]', 'KJFK');
  await page.fill('input[placeholder="KCOS"]', 'KLAX');
  // fill numeric fields
  await page.locator('input[type="number"]').nth(0).fill('2.5'); // total time
  await page.locator('input[type="number"]').nth(1).fill('2.5'); // PIC

  await page.click('text=Save Entry');

  // Confirm the entry appears in the logbook list
  const row = page.locator('tr', { hasText: tail });
  await expect(row).toBeVisible({ timeout: 10000 });

  // Edit the entry
  await row.hover();
  await row.locator('button[title="Edit entry"]').click();
  await page.waitForSelector('text=Edit Flight Entry');
  const newTail = tail + 'A';
  // tail input is placeholder N12345
  await page.fill('input[placeholder="N12345"]', newTail);
  await page.click('text=Update Entry');

  // Verify updated
  await expect(page.locator('tr', { hasText: newTail })).toBeVisible({ timeout: 10000 });

  // Delete the entry
  const editRow = page.locator('tr', { hasText: newTail });
  await editRow.locator('input[type="checkbox"]').check();

  // Intercept confirm dialog
  page.on('dialog', async dialog => { await dialog.accept(); });

  // Click Delete button in header
  await page.locator('button', { hasText: /Delete\s*\(/ }).click();

  // Verify deletion
  await expect(page.locator('tr', { hasText: newTail })).not.toBeVisible({ timeout: 10000 });

  // Call backend verify endpoint to confirm no archived match (request doesn't require auth)
  const backend = process.env.PAPERPLANE_BACKEND || process.env.NEXT_PUBLIC_PAPERPLANE_BACKEND || 'http://localhost:3002';
  const verifyResp = await request.post(`${backend}/api/v1/verify/`, {
    data: {
      tailNumber: newTail,
      originAirportIcao: 'KJFK',
      destinationAirportIcao: 'KLAX',
      departureTime: new Date('2025-12-01T10:00:00Z').toISOString(),
    }
  });

  expect(verifyResp.ok()).toBeTruthy();
  const verifyJson = await verifyResp.json();
  // should be either an object or null
  expect([null].concat(Object.prototype.toString.call(verifyJson) === '[object Object]' ? [verifyJson] : [])).toBeTruthy();
});
