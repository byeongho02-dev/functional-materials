const { test, expect } = require('@playwright/test');
const path = require('node:path');
const { mkdirSync, writeFileSync } = require('node:fs');

const url = '/ale-v092-fab-preview.html';
const screenshots = path.resolve('preview/fab-v092');
mkdirSync(screenshots, { recursive: true });

async function open(page, suffix = '') {
  const exceptions = [];
  const requests = [];
  page.on('pageerror', error => exceptions.push(error.message));
  page.on('request', request => { if (!/^https?:\/\/(127\.0\.0\.1|localhost):4173\//.test(request.url()) && !request.url().startsWith('data:')) requests.push(request.url()); });
  await page.route('**/*', route => /^https?:\/\/(127\.0\.0\.1|localhost):4173\//.test(route.request().url()) || route.request().url().startsWith('data:') ? route.continue() : route.abort());
  await page.goto(url + suffix);
  await page.waitForFunction(() => window.__fab?.ready);
  await expect(page.locator('#fps')).not.toHaveText('—');
  return { exceptions, requests };
}

async function pause(page) {
  if (await page.evaluate(() => window.__fab.clock.playing)) await page.locator('#play').click();
}

test('built preview loads locally with twelve genuine components and no page exceptions or remote assets', async ({ page }) => {
  const evidence = await open(page);
  await expect(page.locator('#renderer-mode')).toContainText('WEBGL');
  expect(await page.evaluate(() => [...window.__fab.chamber.parts.values()].every(group => group.children.some(child => child.isMesh && child.geometry.attributes.position.count > 0)))).toBe(true);
  await expect(page.locator('.part-row')).toHaveCount(12);
  await expect(page.locator('body')).not.toContainText(/\b(?:OES|IEDF|QMS|CSV)\b|diagnostic/i);
  await expect(page.locator('#particle-budget')).toHaveValue('240');
  await page.locator('#particle-budget').fill('800');
  await expect(page.locator('#budget-value')).toHaveText('800');
  expect(await page.evaluate(() => window.__fab.particles.length)).toBeLessThanOrEqual(800);
  await page.locator('#particle-budget').fill('0');
  await expect.poll(() => page.evaluate(() => window.__fab.particles.length)).toBe(0);
  expect(evidence.exceptions).toEqual([]); expect(evidence.requests).toEqual([]);
});

test('all camera views, drag orbit, cutaway, transparency, separation and part visibility work', async ({ page }) => {
  test.setTimeout(90000);
  const { exceptions } = await open(page); await pause(page);
  for (const view of ['front', 'top', 'wafer', 'orbit']) {
    await page.locator(`[data-view="${view}"]`).click();
    await expect(page.locator(`[data-view="${view}"]`)).toHaveAttribute('aria-pressed', 'true');
    await page.waitForFunction(() => window.__fab.rig.transition === null);
    expect(await page.evaluate(() => [window.__fab.camera.position.x, window.__fab.camera.position.y, window.__fab.camera.position.z].every(Number.isFinite))).toBe(true);
    if (['front', 'top', 'wafer'].includes(view)) await page.screenshot({ path: path.join(screenshots, `camera-${view}-1440x900.png`) });
  }
  await page.locator('#cutaway').uncheck();
  expect(await page.evaluate(() => window.__fab.chamber.state.cutaway)).toBe(false);
  await page.locator('#transparent').check();
  expect(await page.evaluate(() => window.__fab.chamber.parts.get('body').children.filter(node => node.userData.cutaway).every(node => !node.material.depthWrite))).toBe(true);
  await page.locator('#explode').fill('100');
  expect(await page.evaluate(() => window.__fab.chamber.parts.get('coil').position.y)).toBe(1.1);
  await page.screenshot({ path: path.join(screenshots, 'assembly-separated-1440x900.png') });
  await page.getByRole('checkbox', { name: 'Removable liner 표시', exact: true }).uncheck();
  expect(await page.evaluate(() => window.__fab.chamber.parts.get('liner').visible)).toBe(false);
  await page.getByRole('checkbox', { name: 'Removable liner 표시', exact: true }).check();
  await page.locator('#explode').fill('0'); await page.locator('#transparent').uncheck(); await page.locator('#cutaway').check();
  const before = await page.evaluate(() => window.__fab.camera.position.toArray());
  const rect = await page.locator('#viewport').boundingBox();
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
  await page.mouse.down(); await page.mouse.move(rect.x + rect.width / 2 + 80, rect.y + rect.height / 2 + 30, { steps: 8 }); await page.mouse.up();
  expect(await page.evaluate(() => window.__fab.camera.position.toArray())).not.toEqual(before);
  expect(exceptions).toEqual([]);
});

test('four stages and power switches share the same site-linked event history', async ({ page }) => {
  const { exceptions } = await open(page); await pause(page);
  for (const [index, stage] of ['adsorption', 'purge-1', 'activation', 'purge-2'].entries()) {
    await page.locator(`[data-stage="${stage}"]`).click();
    expect(await page.evaluate(() => window.__fab.clock.stageIndex)).toBe(index);
  }
  await page.locator('#site').selectOption('S09');
  await expect(page.locator('#site-key')).toContainText('S09');
  expect(await page.evaluate(() => window.__fab.clock.siteState(window.__fab.selectedSite).events.every(event => event.siteId === 'S09'))).toBe(true);
  await page.locator('#plasma').uncheck(); await page.locator('#reset').click(); await page.locator('[data-stage="purge-2"]').click();
  expect(await page.evaluate(() => window.__fab.clock.snapshot().removed)).toBe(0);
  await expect(page.locator('#source-status')).toHaveText('ICP SOURCE OFF');
  await page.locator('#plasma').check(); await page.locator('#bias').uncheck(); await page.locator('#reset').click(); await page.locator('[data-stage="purge-2"]').click();
  const state = await page.evaluate(() => window.__fab.clock.snapshot());
  expect(state.sites.every(site => site.adsorbed && !site.removed)).toBe(true);
  expect(state.plasmaOn).toBe(true);
  expect(exceptions).toEqual([]);
});

for (const [width, height] of [[1366, 768], [1440, 900], [1280, 720], [390, 844], [360, 800]]) {
  test(`viewport ${width}×${height}: usable layout and browser capture`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const { exceptions } = await open(page); await pause(page);
    await page.locator('[data-stage="purge-1"]').click();
    const geometry = await page.evaluate(() => ({
      width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight, height: innerHeight,
      viewer: document.querySelector('.viewer-panel').getBoundingClientRect().toJSON(),
      controls: document.querySelector('.control-panel').getBoundingClientRect().toJSON(),
      detail: document.querySelector('.detail-panel').getBoundingClientRect().toJSON(),
    }));
    expect(geometry.scrollWidth).toBeLessThanOrEqual(width + 1);
    if (width > 980) { expect(geometry.scrollHeight).toBeLessThanOrEqual(height + 1); expect(geometry.viewer.height).toBeGreaterThan(500); }
    else { expect(geometry.detail.top).toBeGreaterThan(geometry.viewer.bottom - 1); expect(geometry.controls.top).toBeGreaterThan(geometry.detail.bottom - 1); }
    await page.screenshot({ path: path.join(screenshots, `webgl-${width}x${height}.png`), fullPage: width < 641 });
    expect(exceptions).toEqual([]);
  });
}

test('native WebGL unavailability falls back to interactive CPU-projected chamber geometry', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) { return /webgl/i.test(type) ? null : original.call(this, type, ...args); };
  });
  const { exceptions, requests } = await open(page); await pause(page);
  await expect(page.locator('#renderer-mode')).toHaveText('SOFTWARE 3D');
  await expect(page.locator('#fallback-note')).toBeVisible();
  await page.locator('[data-view="front"]').click();
  await page.waitForFunction(() => window.__fab.rig.transition === null);
  await page.locator('#cutaway').uncheck(); await page.locator('#cutaway').check();
  await page.screenshot({ path: path.join(screenshots, 'software-1440x900.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: path.join(screenshots, 'software-390x844.png'), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(exceptions).toEqual([]); expect(requests).toEqual([]);
});

test('WebGL context loss recovers into a usable software chamber', async ({ page }) => {
  const { exceptions } = await open(page); await pause(page);
  await page.evaluate(() => window.__fab.renderer.getContext().getExtension('WEBGL_lose_context').loseContext());
  await expect(page.locator('#renderer-mode')).toHaveText('SOFTWARE 3D');
  await expect(page.locator('#fallback-note')).toBeVisible();
  await page.locator('[data-view="top"]').click();
  await page.waitForFunction(() => window.__fab.rig.transition === null);
  expect(exceptions).toEqual([]);
});

test('records actual render performance at three desktop sizes and 0 / 240 / 800 particle budgets', async ({ page, browser }) => {
  test.setTimeout(120000);
  const { exceptions } = await open(page); await pause(page);
  await page.evaluate(() => { window.__fab.clock.seekStage(0); window.__fab.clock.advanceTo(1.6); });
  const samples = [];
  for (const [width, height] of [[1366, 768], [1440, 900], [1280, 720]]) {
    await page.setViewportSize({ width, height });
    for (const budget of [0, 240, 800]) {
      await page.locator('#particle-budget').fill(String(budget));
      const sample = await page.evaluate(async () => {
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        const started = performance.now();
        const frames = 6;
        await new Promise(resolve => {
          let count = 0;
          const next = () => ++count > frames ? resolve() : requestAnimationFrame(next);
          requestAnimationFrame(next);
        });
        const elapsed = performance.now() - started;
        return { fps: Number((frames * 1000 / elapsed).toFixed(2)), frameMs: Number((elapsed / frames).toFixed(2)),
          activeParticles: window.__fab.particles.length, drawCalls: window.__fab.renderer.info.render.calls,
          triangles: window.__fab.renderer.info.render.triangles };
      });
      expect(sample.activeParticles).toBeLessThanOrEqual(budget);
      expect(sample.fps).toBeGreaterThan(0);
      samples.push({ width, height, budget, ...sample });
    }
  }
  const hardware = await page.evaluate(() => {
    const gl = window.__fab.renderer.getContext();
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    return { renderer: info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
      devicePixelRatio, userAgent: navigator.userAgent, mode: window.__fab.mode };
  });
  writeFileSync(path.join(screenshots, 'performance.json'), JSON.stringify({ browser: browser.version(), hardware,
    note: 'Observed local measurements, not a hardware FPS guarantee. Paused teaching events at t=1.6 s; six rendered intervals per sample.', samples }, null, 2) + '\n');
  expect(exceptions).toEqual([]);
});
