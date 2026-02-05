
import { test, expect } from '@playwright/test';

test.describe('🧩 Challenge Page (Onboarding)', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/challenge');
    });

    test('should load the challenge interface', async ({ page }) => {
        await expect(page).toHaveTitle(/Prove You Are Human/);
        await expect(page.getByText('Fix the Bug')).toBeVisible();
        console.log('DEBUG: Challenge Page Content', (await page.content()).substring(0, 500));
        await expect(page.getByText(/SyntaxError/)).toBeVisible();
    });

    test('should compile Python code and fail with original bug', async ({ page }) => {
        // Click Run without changes
        await page.getByText('Run Code').click();

        // Check for error output
        await expect(page.getByText(/SyntaxError: Missing parentheses/)).toBeVisible();
        await expect(page.getByText('Access Granted')).not.toBeVisible();
    });

    test('should pass validation when syntax is fixed', async ({ page }) => {
        // Fix the code in the textarea
        // Original: print "Hello " + name
        // Fixed:    print("Hello " + name)

        const fixedCode = 'def greet(name):\n    print("Hello " + name)  # Fixed!';

        await page.locator('textarea').fill(fixedCode);

        // Click Run
        await page.getByText('Run Code').click();

        // Verify success state
        await expect(page.getByText('Access Granted')).toBeVisible({ timeout: 10000 });
        await expect(page.getByText('TEST PASSED')).toBeVisible();

        // Verify redirect (optional, might take time)
        // await expect(page).toHaveURL(/signup/, { timeout: 5000 });
    });

});
