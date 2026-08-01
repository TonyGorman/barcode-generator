import { expect, test } from '@playwright/test'

test.describe('Label Generator regressions - tabs accessibility', () => {
  test('loads and shows primary tabs', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('tab')).toHaveCount(3)
    await expect(page.getByRole('tab', { name: 'Specific Labels' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Aisle Labels' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'FOS/Bak Labels' })).toBeVisible()
  })

  test('supports keyboard navigation across tabs', async ({ page }) => {
    await page.goto('/')

    const specificTab = page.getByRole('tab', { name: 'Specific Labels' })
    const aisleTab = page.getByRole('tab', { name: 'Aisle Labels' })
    const backTab = page.getByRole('tab', { name: 'FOS/Bak Labels' })

    await specificTab.focus()
    await page.keyboard.press('ArrowRight')
    await expect(aisleTab).toHaveAttribute('aria-selected', 'true')

    await page.keyboard.press('ArrowRight')
    await expect(backTab).toHaveAttribute('aria-selected', 'true')

    await page.keyboard.press('Home')
    await expect(specificTab).toHaveAttribute('aria-selected', 'true')
  })

  test('Large SEL mode is available from both Aisle and Specific Labels tabs', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('tab', { name: 'Aisle Labels' }).click()
    await expect(page.getByRole('radio', { name: 'Large SEL' })).toBeVisible()
    await expect(page.getByRole('radio', { name: 'Mini SEL' })).toBeVisible()

    await page.getByRole('tab', { name: 'Specific Labels' }).click()
    await expect(page.getByRole('radio', { name: 'Large SEL' })).toBeVisible()
    await expect(page.getByRole('radio', { name: 'Mini SEL' })).toBeVisible()
  })

  test('exposes skip link on keyboard focus and jumps to main content', async ({ page }) => {
    await page.goto('/')

    const skipLink = page.getByRole('link', { name: 'Skip to main content' })

    await page.keyboard.press('Tab')
    await expect(skipLink).toBeFocused()

    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#main-content$/)
  })

  test('moves focus to first invalid field on failed specific-form submit', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('button', { name: 'Generate Labels' }).click()

    const labelsInput = page.getByPlaceholder('Enter labels')
    await expect(labelsInput).toBeFocused()
    await expect(page.getByRole('alert')).toContainText('Enter at least one label value.')
  })
})
