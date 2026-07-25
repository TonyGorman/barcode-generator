import { expect, test } from '@playwright/test';
import { SHORT_CODE_PREFIXES } from './testConstants';

test.describe('Label Generator regressions - Back/FOS Labels flow', () => {

  test('Back tab shows validation message for missing values', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('tab', { name: 'FOS/Bak Labels' }).click();
    await page.getByRole('button', { name: 'Generate Labels' }).click();

    await expect(page.getByRole('alert')).toContainText('Please enter start bay, end bay, and select an end shelf.');
  });

  test('Back/FOS tab short code type selector generates Front Of Store compact codes', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('tab', { name: 'FOS/Bak Labels' }).click();
    await page.getByRole('radio', { name: 'FOS' }).click();

    const visibleInputs = page.getByRole('textbox');
    await visibleInputs.nth(0).fill('1');
    await visibleInputs.nth(1).fill('1');
    await page.getByRole('combobox', { name: 'End Shelf' }).selectOption('B');
    await page.getByRole('button', { name: 'Generate Labels' }).click();

    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByText(`${SHORT_CODE_PREFIXES[1]}01A`, { exact: true }).first()).toBeVisible();
    await expect(page.getByText(`${SHORT_CODE_PREFIXES[1]}01B`, { exact: true }).first()).toBeVisible();
  });

  test('Back/FOS tab supports all configured compact short code prefixes', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'FOS/Bak Labels' }).click();

    const visibleInputs = page.getByRole('textbox');
    await visibleInputs.nth(0).fill('1');
    await visibleInputs.nth(1).fill('1');
    await page.getByRole('combobox', { name: 'End Shelf' }).selectOption('A');

    for (const prefix of SHORT_CODE_PREFIXES) {
      await page.getByRole('radio', { name: prefix }).click();
      await page.getByRole('button', { name: 'Generate Labels' }).click();
      await expect(page.getByRole('alert')).toHaveCount(0);
      await expect(page.getByText(`${prefix}01A`, { exact: true }).first()).toBeVisible();
    }
  });

  test('Back/FOS tab generates complete shelf ranges for a bay', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'FOS/Bak Labels' }).click();
    await page.getByRole('radio', { name: 'BAK' }).click();

    const visibleInputs = page.getByRole('textbox');
    await visibleInputs.nth(0).fill('1');
    await visibleInputs.nth(1).fill('1');
    await page.getByRole('combobox', { name: 'Start Shelf' }).selectOption('A');
    await page.getByRole('combobox', { name: 'End Shelf' }).selectOption('C');
    await page.getByRole('button', { name: 'Generate Labels' }).click();

    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByText('BAK01A', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('BAK01B', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('BAK01C', { exact: true }).first()).toBeVisible();
  });

  test('Back/FOS focuses first invalid field and links it to inline error text', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'FOS/Bak Labels' }).click();
    await page.getByRole('button', { name: 'Generate Labels' }).click();

    const firstInput = page.getByRole('textbox').first();
    await expect(firstInput).toBeFocused();
    const describedBy = await firstInput.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    await expect(page.locator(`#${describedBy}`)).toBeVisible();
    await expect(page.getByRole('alert')).toContainText('Please enter start bay, end bay, and select an end shelf.');
  });
});
