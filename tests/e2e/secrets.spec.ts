import { test, expect } from '@playwright/test';

test.describe('Secrets Vault', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    // Ensure we land on the secrets tab
    await expect(page.getByRole('heading', { name: /secrets vault/i })).toBeVisible();
  });

  test('displays existing secrets in the vault', async ({ page }) => {
    // The seed data should have secrets visible
    await expect(page.getByTestId('secrets-table')).toBeVisible();
    const rows = page.getByTestId('secret-row');
    await expect(rows.first()).toBeVisible();
  });

  test('creates a new secret and shows it in the list', async ({ page }) => {
    // Open the "Add Secret" form
    await page.getByRole('button', { name: /add secret/i }).click();

    // Fill in the secret form
    const uniqueKey = `E2E_TEST_KEY_${Date.now()}`;
    await page.getByLabel(/key name/i).fill(uniqueKey);
    await page.getByLabel(/value/i).fill('e2e-secret-value-123');
    await page.getByLabel(/description/i).fill('Created by Playwright E2E test');

    // Submit
    await page.getByRole('button', { name: /create secret/i }).click();

    // Verify it appears in the list
    await expect(page.getByText(uniqueKey)).toBeVisible();

    // Verify toast notification
    await expect(page.getByText(/successfully created/i)).toBeVisible();
  });

  test('deletes a secret and confirms removal', async ({ page }) => {
    // Create one we know about
    await page.getByRole('button', { name: /add secret/i }).click();
    const uniqueKey = `E2E_DELETE_KEY_${Date.now()}`;
    await page.getByLabel(/key name/i).fill(uniqueKey);
    await page.getByLabel(/value/i).fill('to-be-deleted');
    await page.getByRole('button', { name: /create secret/i }).click();
    await expect(page.getByText(uniqueKey)).toBeVisible();

    // Find the row and delete it
    const row = page.locator(`[data-testid="secret-row"]`).filter({ hasText: uniqueKey });
    await row.getByRole('button', { name: /delete/i }).click();

    // Confirm deletion dialog
    await page.getByRole('button', { name: /confirm/i }).click();

    // Verify it's gone
    await expect(page.getByText(uniqueKey)).not.toBeVisible();
    await expect(page.getByText(/deleted/i)).toBeVisible();
  });

  test('filters secrets by environment', async ({ page }) => {
    // Switch to development environment
    await page.getByRole('button', { name: /dev/i }).click();
    await expect(page.getByText(/development/i)).toBeVisible();

    // Switch to production
    await page.getByRole('button', { name: /production/i }).click();
    await expect(page.getByText(/production/i)).toBeVisible();
  });
});
