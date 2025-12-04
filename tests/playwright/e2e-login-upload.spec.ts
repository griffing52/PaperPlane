import { test, expect } from '@playwright/test';
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

  // Upload an example image from repository test_images
  // test_images are located under the `ocr` folder in the repo
  const filePath = path.resolve(__dirname, '..', '..', 'ocr', 'test_images', 'custom_example.png');

  // Set the file directly on the hidden input element. This is more reliable than the filechooser flow.
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

  // Optionally, call verify endpoint for the first row's data
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
});
