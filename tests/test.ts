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

test('schema selector list is not empty and has expected schema', async ({ page }) => {
	await page.goto('/profile-generator');
	const optionsCount = await page.locator('#schemaSelector').count();
	expect(optionsCount).toBeGreaterThan(0);
	await page.locator('#schemaSelector').selectOption('organizations_schema-v1.0.0');
	await expect(page.locator('#schemaSelector')).toHaveValue('organizations_schema-v1.0.0');
});

// test('can create a profile preview with the organizations schema', async ({ page }) => {
// 	await page.goto('/profile-generator');
// 	await page.locator('#schemaSelector').selectOption('organizations_schema-v1.0.0');
// 	await page.getByRole('button', { name: 'Select' }).click();
// 	await page.getByLabel('Group/Project/Organization').fill('Some Org');
// 	await page.getByLabel('Nickname').fill('SO');
// 	await page.getByLabel('Primary URL: The unique').fill('https://some.org');
// 	await page.locator('input[name="tags\\[0\\]"]').fill('test1');
// 	await page.getByRole('button', { name: '+' }).first().click();
// 	await page.locator('input[name="tags\\[1\\]"]').fill('test2');
// 	await page.getByLabel('Latitude').fill('51.5074');
// 	await page.getByLabel('Longitude').fill('0.1278');
// 	await page.getByRole('button', { name: 'Validate' }).click();

// 	const expectedData = {
// 		linked_schemas: ['organizations_schema-v1.0.0'],
// 		name: 'Some Org',
// 		nickname: 'SO',
// 		primary_url: 'https://some.org',
// 		tags: ['test1', 'test2'],
// 		geolocation: {
// 			lat: 51.5074,
// 			lon: 0.1278
// 		}
// 	};

// 	await expect(page.locator('pre')).toHaveText(JSON.stringify(expectedData, null, 2));
// });
