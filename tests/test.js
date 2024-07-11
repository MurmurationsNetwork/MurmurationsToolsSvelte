import { expect, test } from '@playwright/test';

test('home page has expected page title', async ({ page }) => {
	await page.goto('/');
	await expect(page).toHaveTitle('Murmurations Tools');
});

test('home page has expected site logo text', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('#site-logo')).toBeVisible();
	/*
	The viewport size is not taken into account by Playwright when displaying
	content controlled by Tailwind breakpoints, so it is necessary to test the
	contents for all viewport sizes are displayed together in the DOM (e.g.,
	"Tools" up to the `md` breakpoint and "Murmurations Tools" after the `md`
	breakpoint, so "ToolsMurmurations Tools").
	*/
	await expect(page.locator('#site-logo')).toHaveText('ToolsMurmurations Tools');
});

test('home page has expected h1 content', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('h1')).toBeVisible();
	await expect(page.locator('h1')).toHaveText('Welcome to Murmurations Tools');
});

test('clicking links loads correct pages', async ({ page }) => {
	await page.goto('/');
	await page.locator('#login').click();
	await expect(page).toHaveURL(/\/login/);
	await page.locator('#profile-generator').click();
	await expect(page).toHaveURL(/\/profile-generator/);
	await page.locator('#batch-importer').click();
	await expect(page).toHaveURL(/\/batch-importer/);
	await page.locator('#index-explorer').click();
	await expect(page).toHaveURL(/\/index-explorer/);
	await page.locator('#index-updater').click();
	await expect(page).toHaveURL(/\/index-updater/);
	await page.locator('#site-logo').click();
	await expect(page).toHaveURL(/\//);
});
