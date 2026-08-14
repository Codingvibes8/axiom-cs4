import { test, expect } from '@playwright/test';

test.describe('Cmd+K Command Palette', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /secrets vault/i })).toBeVisible();
  });

  test('opens with Ctrl+K keyboard shortcut', async ({ page }) => {
    await page.keyboard.press('Control+k');
    await expect(page.getByTestId('command-palette')).toBeVisible();
    await expect(page.getByPlaceholder(/search secrets/i)).toBeFocused();
  });

  test('opens with Cmd+K on macOS', async ({ page, browserName }) => {
    // Use Meta key for macOS simulation
    await page.keyboard.press('Meta+k');
    await expect(page.getByTestId('command-palette')).toBeVisible();
  });

  test('opens via header search button', async ({ page }) => {
    await page.getByTestId('cmd-k-trigger').click();
    await expect(page.getByTestId('command-palette')).toBeVisible();
  });

  test('closes with Escape key', async ({ page }) => {
    await page.keyboard.press('Control+k');
    await expect(page.getByTestId('command-palette')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByTestId('command-palette')).not.toBeVisible();
  });

  test('closes by clicking the backdrop', async ({ page }) => {
    await page.keyboard.press('Control+k');
    await expect(page.getByTestId('command-palette')).toBeVisible();

    await page.getByTestId('command-palette-backdrop').click({ position: { x: 10, y: 10 } });
    await expect(page.getByTestId('command-palette')).not.toBeVisible();
  });

  test('shows results when searching for a known secret key', async ({ page }) => {
    await page.keyboard.press('Control+k');
    // Seed data includes STRIPE_SECRET_KEY
    await page.getByPlaceholder(/search secrets/i).fill('STRIPE');
    await expect(page.getByTestId('search-result-item').first()).toBeVisible();
    await expect(page.getByText(/stripe/i).first()).toBeVisible();
  });

  test('shows empty state for a nonsense query', async ({ page }) => {
    await page.keyboard.press('Control+k');
    await page.getByPlaceholder(/search secrets/i).fill('XYZZY_NONEXISTENT_12345');
    await expect(page.getByTestId('search-empty-state')).toBeVisible();
  });

  test('navigates results with arrow keys and Enter', async ({ page }) => {
    await page.keyboard.press('Control+k');
    await page.getByPlaceholder(/search secrets/i).fill('API');

    // Wait for results
    await expect(page.getByTestId('search-result-item').first()).toBeVisible();

    // Arrow down to select first, then Enter
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    // Palette should close after selection
    await expect(page.getByTestId('command-palette')).not.toBeVisible();
  });
});
