const { test, expect } = require('@playwright/test');

for (const [width, height] of [[1440, 900], [390, 844]]) {
  test('homepage opens the published ICP page and preserves learning at ' + width + '×' + height, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const errors = [], external = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (/^https?:/.test(request.url()) && !request.url().startsWith('http://127.0.0.1:4174/')) external.push(request.url()); });
    await page.goto('/');
    await expect(page.locator('.feature.ale h2')).toHaveText('ICP ALE Simulator V0.9.2');
    await expect(page.locator('.navlinks a[href="ale-v092-fab.html"]')).toBeVisible();
    await expect(page.locator('.legacy-action')).toHaveAttribute('href', 'ale.html');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: 'preview/fab-v092/homepage-' + width + 'x' + height + '.png', fullPage: true });
    await page.locator('.feature.ale .action').click();
    await expect(page).toHaveURL(/\/ale-v092-fab\.html$/);
    await page.waitForFunction(() => window.__fab?.ready);
    await expect(page.locator('#renderer-mode')).toContainText('WEBGL');
    expect(await page.evaluate(() => window.__fab.chamber.parts.size)).toBe(12);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('link', { name: 'Functional Materials 홈' }).click();
    await page.locator('#nav-learning').click();
    await expect(page.locator('#themeGrid')).toBeVisible();
    await expect(page.locator('#themeGrid .theme')).toHaveCount(6);
    await expect(page.locator('#themeGrid a[href="learning-mof/index.html"]')).toHaveCount(1);
    await page.locator('a[href="#theme-sma"]').click();
    await expect(page.locator('#smaEntry')).toBeVisible();
    await expect(page.locator('#smaEntry .action')).toHaveAttribute('href', 'learning-lecture3.html#chapter-1');
    const legacy = await page.request.get('/ale.html');
    expect(legacy.status()).toBe(200);
    expect(await legacy.text()).toContain('ALE Simulator V0.6.4');

    await page.locator('#nav-learning').click();
    await page.locator('#themeGrid a[href="learning-mof/index.html"]').click();
    await expect(page).toHaveURL(/\/learning-mof\/index\.html$/);
    await expect(page.locator('#mofLearning')).toHaveAttribute('data-initialized', 'true');
    await expect(page.locator('#chapterTitle')).toHaveText('MOF란 무엇인가요?');
    await expect(page.locator('.explanation-column #sceneReason')).not.toBeEmpty();
    await page.waitForFunction(() => document.querySelector('#objectLabels')?.children.length > 0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: 'preview/fab-v092/mof-learning-' + width + 'x' + height + '.png', fullPage: true });
    expect(errors).toEqual([]); expect(external).toEqual([]);
  });
}

test('the published static entry retains the no-WebGL software fallback', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    const get = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) { return /webgl/i.test(type) ? null : get.call(this, type, ...args); };
  });
  await page.goto('/ale-v092-fab.html');
  await page.waitForFunction(() => window.__fab?.ready);
  await expect(page.locator('#renderer-mode')).toHaveText('SOFTWARE 3D');
  await expect(page.locator('#fallback-note')).toBeVisible();
  await page.locator('#play').click();
  await page.locator('[data-view="front"]').click();
  await page.waitForFunction(() => window.__fab.rig.transition === null);
  await page.locator('#cutaway').uncheck();
  expect(await page.evaluate(() => window.__fab.chamber.state.cutaway)).toBe(false);
  expect(errors).toEqual([]);
});
