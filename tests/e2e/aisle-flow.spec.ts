import { expect, test } from '@playwright/test';
import { selectMiniVariant } from './e2eHelpers';

const fillSingleLeftBayAisleInputs = async (
  page: import('@playwright/test').Page,
  endShelf: string,
): Promise<void> => {
  const visibleInputs = page.getByRole('textbox');
  await visibleInputs.nth(0).fill('1');
  await visibleInputs.nth(1).fill('1');
  await visibleInputs.nth(2).fill('1');
  await visibleInputs.nth(3).fill('1');
  await page.getByRole('combobox', { name: 'End Shelf' }).selectOption(endShelf);
};

test.describe('Label Generator regressions - Aisle Labels flow', () => {

  test('Aisle Labels generation updates the summary and invokes print', async ({ page }) => {
    await page.addInitScript(() => {
      (window as typeof window & { __printCalls?: number }).__printCalls = 0;
      window.print = () => {
        (window as typeof window & { __printCalls?: number }).__printCalls = ((window as typeof window & { __printCalls?: number }).__printCalls ?? 0) + 1;
      };
    });

    await page.goto('/');

    await page.getByRole('tab', { name: 'Aisle Labels' }).click();

    await fillSingleLeftBayAisleInputs(page, 'A');

    await expect(page.getByText('Total labels: 1')).toBeVisible();

    await page.getByRole('button', { name: 'Generate Labels' }).click();
    await expect(page.getByRole('button', { name: 'Print Labels' })).toBeVisible();

    await page.getByRole('button', { name: 'Print Labels' }).click();
    await expect.poll(async () => page.evaluate(() => (window as typeof window & { __printCalls?: number }).__printCalls ?? 0)).toBe(1);
  });

  test('Mini SEL default route renders three-row layout for aisle values', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('tab', { name: 'Aisle Labels' }).click();

    await fillSingleLeftBayAisleInputs(page, 'A');

    await page.getByRole('button', { name: 'Generate Labels' }).click();
    await expect(page.getByRole('button', { name: 'Print Labels' })).toBeVisible();

    const firstLabelTile = page.locator('[class*="labelBox"]').first();
    await expect(firstLabelTile.getByText('01', { exact: true })).toBeVisible();
    await expect(firstLabelTile.getByText('L01', { exact: true })).toBeVisible();
    await expect(firstLabelTile.getByText('A', { exact: true })).toBeVisible();
    await expect(firstLabelTile.getByText('01 L01 A', { exact: true })).toHaveCount(0);
  });

  test('Mini SEL shelf-emphasis layout renders shelf and full spaced value lines', async ({ page }) => {
    await page.goto('/');
    await selectMiniVariant(page, 'mini-shelf-emphasis');

    await page.getByRole('tab', { name: 'Aisle Labels' }).click();

    await fillSingleLeftBayAisleInputs(page, 'A');

    await page.getByRole('button', { name: 'Generate Labels' }).click();
    await expect(page.getByRole('button', { name: 'Print Labels' })).toBeVisible();

    const firstLabelTile = page.locator('[class*="labelBox"]').first();
    await expect(firstLabelTile.getByText('A', { exact: true })).toBeVisible();
    await expect(firstLabelTile.getByText('01 L01 A', { exact: true })).toBeVisible();
  });

  test('Mini variant selection persists across reload', async ({ page }) => {
    await page.goto('/');
    await selectMiniVariant(page, 'mini-shelf-emphasis');

    await page.reload();

    await expect(page.getByLabel('Mini Variant')).toHaveValue('mini-shelf-emphasis');
  });

  test('Aisle Labels default Start Shelf to A when omitted', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Aisle Labels' }).click();

    await fillSingleLeftBayAisleInputs(page, 'C');

    await expect(page.getByText('Total labels: 3')).toBeVisible();
    await expect(page.locator('[class*="summaryRow"]').filter({ hasText: 'Shelves:' })).toContainText('A – C');

    await page.getByRole('button', { name: 'Generate Labels' }).click();
    await expect(page.getByText('01L01A', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('01L01B', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('01L01C', { exact: true }).first()).toBeVisible();
  });

  test('Aisle Labels enforce aisle, side, and shelf ordering validation', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Aisle Labels' }).click();

    const visibleInputs = page.getByRole('textbox');
    await visibleInputs.nth(0).fill('2');
    await visibleInputs.nth(1).fill('1');
    await visibleInputs.nth(2).fill('1');
    await visibleInputs.nth(3).fill('1');
    await page.getByRole('combobox', { name: 'End Shelf' }).selectOption('A');
    await page.getByRole('button', { name: 'Generate Labels' }).click();
    await expect(page.getByRole('alert')).toContainText('Aisle start cannot be greater than aisle end.');

    await visibleInputs.nth(0).fill('1');
    await visibleInputs.nth(1).fill('1');
    await visibleInputs.nth(2).fill('2');
    await visibleInputs.nth(3).fill('1');
    await page.getByRole('button', { name: 'Generate Labels' }).click();
    await expect(page.getByRole('alert')).toContainText('Side range start cannot be greater than side range end.');

    await visibleInputs.nth(2).fill('1');
    await visibleInputs.nth(3).fill('1');
    await page.getByRole('combobox', { name: 'Start Shelf' }).selectOption('C');
    await page.getByRole('combobox', { name: 'End Shelf' }).selectOption('B');
    await page.getByRole('button', { name: 'Generate Labels' }).click();
    await expect(page.getByRole('alert')).toContainText('Start shelf must come before or equal to end shelf.');
  });

  test('Aisle Labels block incomplete side ranges', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Aisle Labels' }).click();

    const visibleInputs = page.getByRole('textbox');
    await visibleInputs.nth(0).fill('1');
    await visibleInputs.nth(1).fill('1');
    await visibleInputs.nth(2).fill('1');
    await page.getByRole('combobox', { name: 'End Shelf' }).selectOption('A');
    await page.getByRole('button', { name: 'Generate Labels' }).click();

    await expect(page.getByRole('alert')).toContainText('Enter both start and end bay values for each selected side.');
  });

  test('Aisle Labels generate expected totals and code boundaries across multiple sides', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Aisle Labels' }).click();

    const visibleInputs = page.getByRole('textbox');
    await visibleInputs.nth(0).fill('1');
    await visibleInputs.nth(1).fill('2');
    await visibleInputs.nth(2).fill('1');
    await visibleInputs.nth(3).fill('2');
    await visibleInputs.nth(4).fill('1');
    await visibleInputs.nth(5).fill('1');
    await page.getByRole('combobox', { name: 'Start Shelf' }).selectOption('A');
    await page.getByRole('combobox', { name: 'End Shelf' }).selectOption('B');

    await expect(page.getByText('Total labels: 12')).toBeVisible();

    await page.getByRole('button', { name: 'Generate Labels' }).click();
    await expect(page.getByText('01L01A', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('02R01B', { exact: true }).first()).toBeVisible();
  });

  test('Generated labels are scoped to active tab content', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('tab', { name: 'Specific Labels' }).click();
    await page.getByPlaceholder('Enter labels').fill('BAK01A');
    await page.getByRole('button', { name: 'Generate Labels' }).click();
    const specificPanel = page.locator('[role="tabpanel"]:not([hidden])');
    await expect(specificPanel.getByText('BAK01A', { exact: true }).first()).toBeVisible();

    await page.getByRole('tab', { name: 'Aisle Labels' }).click();
    await expect(page.getByRole('button', { name: 'Print Labels' })).toHaveCount(0);
    const aislePanel = page.locator('[role="tabpanel"]:not([hidden])');
    await expect(aislePanel.getByText('BAK01A', { exact: true })).toHaveCount(0);

    const visibleInputs = page.getByRole('textbox');
    await visibleInputs.nth(0).fill('2');
    await visibleInputs.nth(1).fill('2');
    await visibleInputs.nth(2).fill('1');
    await visibleInputs.nth(3).fill('1');
    await page.getByRole('combobox', { name: 'End Shelf' }).selectOption('A');
    await page.getByRole('button', { name: 'Generate Labels' }).click();

    await expect(aislePanel.getByText('02L01A', { exact: true }).first()).toBeVisible();
    await expect(aislePanel.getByText('BAK01A', { exact: true })).toHaveCount(0);
  });
});
