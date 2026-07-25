import { expect, test } from '@playwright/test';
import { SHORT_CODE_PREFIXES } from './testConstants';
import { selectMiniVariant } from './e2eHelpers';

test.describe('Label Generator regressions - Specific Labels flow', () => {

  test('Specific Labels tab shows validation message for empty submission', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('tab', { name: 'Specific Labels' }).click();
    await page.getByRole('button', { name: 'Generate Labels' }).click();

    await expect(page.getByRole('alert')).toContainText('Enter at least one label value.');
  });

  test('Specific Labels accepts compact input and rejects non-compact formats', async ({ page }) => {
    await page.goto('/');

    const compactInput = [
      '01L01A',
      `${SHORT_CODE_PREFIXES[0]}01A`,
    ].join(',');

    await page.getByRole('tab', { name: 'Specific Labels' }).click();
    await page.getByPlaceholder('Enter labels').fill(compactInput);
    await page.getByRole('button', { name: 'Generate Labels' }).click();

    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Print Labels' })).toBeVisible();

    await expect(page.getByText('01L01A', { exact: true }).first()).toBeVisible();
    await expect(page.getByText(`${SHORT_CODE_PREFIXES[0]}01A`, { exact: true }).first()).toBeVisible();

    // Separated and spaced inputs are rejected
    await page.getByPlaceholder('Enter labels').fill('01-L01-A');
    await page.getByRole('button', { name: 'Generate Labels' }).click();
    await expect(page.getByRole('alert')).toHaveCount(1);

    await page.getByPlaceholder('Enter labels').fill('01 L01 A');
    await page.getByRole('button', { name: 'Generate Labels' }).click();
    await expect(page.getByRole('alert')).toHaveCount(1);
  });

  test('Specific Labels accepts both Back and Front Of Store compact short code prefixes', async ({ page }) => {
    await page.goto('/');

    const mixedShortCodeInput = [
      `${SHORT_CODE_PREFIXES[0]}01A`,
      `${SHORT_CODE_PREFIXES[1]}01A`,
    ].join(',');

    await page.getByRole('tab', { name: 'Specific Labels' }).click();
    await page.getByPlaceholder('Enter labels').fill(mixedShortCodeInput);
    await page.getByRole('button', { name: 'Generate Labels' }).click();

    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByText(`${SHORT_CODE_PREFIXES[0]}01A`, { exact: true }).first()).toBeVisible();
    await expect(page.getByText(`${SHORT_CODE_PREFIXES[1]}01A`, { exact: true }).first()).toBeVisible();
  });

  test('Mini shelf-emphasis falls back for special named values', async ({ page }) => {
    await page.goto('/');
    await selectMiniVariant(page, 'mini-shelf-emphasis');

    await page.getByRole('tab', { name: 'Specific Labels' }).click();
    await page.getByPlaceholder('Enter labels').fill('KIOSK,FLORAL');
    await page.getByRole('button', { name: 'Generate Labels' }).click();

    await expect(page.getByRole('button', { name: 'Print Labels' })).toBeVisible();

    const firstLabelTile = page.locator('[class*="labelBox"]').first();
    await expect(firstLabelTile.getByText('KIOSK', { exact: true }).first()).toBeVisible();
    await expect(firstLabelTile.locator('[class*="miniShelfFullValue"]')).toHaveCount(0);
  });

  test('Specific Labels identifies the first invalid code in a mixed batch', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Specific Labels' }).click();
    await page.getByPlaceholder('Enter labels').fill('01L01A,01-L02-A,BAK01A');
    await page.getByRole('button', { name: 'Generate Labels' }).click();

    await expect(page.getByRole('alert')).toContainText("Label '01-L02-A' must not contain spaces or dashes.");
  });

  test('Specific Labels blocks special named values on Large SEL', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Specific Labels' }).click();
    await page.getByRole('radio', { name: 'Large SEL' }).click();
    await page.getByPlaceholder('Enter labels').fill('KIOSK,FLORAL');
    await page.getByRole('button', { name: 'Generate Labels' }).click();

    await expect(page.getByRole('alert')).toContainText('Special label values (such as KIOSK) are not supported on large labels.');
    await expect(page.getByRole('button', { name: 'Print Labels' })).toHaveCount(0);
  });

  test('Specific Labels clears generated output when switching label size mode', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Specific Labels' }).click();
    await page.getByPlaceholder('Enter labels').fill('01L01A');
    await page.getByRole('button', { name: 'Generate Labels' }).click();

    await expect(page.getByRole('button', { name: 'Print Labels' })).toBeVisible();
    await page.getByRole('radio', { name: 'Large SEL' }).click();
    await expect(page.getByRole('button', { name: 'Print Labels' })).toHaveCount(0);
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('Specific Labels paginates when generated labels exceed one preview page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Specific Labels' }).click();

    const pagedLabels = Array.from({ length: 36 }, (_, index) => `01L${String(index + 1).padStart(2, '0')}A`).join(',');
    await page.getByPlaceholder('Enter labels').fill(pagedLabels);
    await page.getByRole('button', { name: 'Generate Labels' }).click();

    await expect(page.getByRole('button', { name: 'Print Labels' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Go to page 1' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Go to page 2' })).toBeVisible();
    const previewPage = page.locator('[class*="previewPage"]').first();
    await expect(previewPage.getByText('01L35A', { exact: true }).first()).toBeVisible();
    await expect(previewPage.getByText('01L36A', { exact: true }).first()).toHaveCount(0);

    await page.getByRole('button', { name: 'Go to page 2' }).click();
    await expect(previewPage.getByText('01L36A', { exact: true }).first()).toBeVisible();
  });
});
