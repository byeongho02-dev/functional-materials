const {test,expect}=require('@playwright/test');
const widths=[[1440,1000],[1280,900],[768,1024],[390,844],[360,800]];
for(const [width,height]of widths){
  test('hydrogen lecture, conserved atoms and responsive controls at '+width,async({page})=>{
    test.setTimeout(120000);const errors=[],external=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith('http://127.0.0.1:4174/'))external.push(r.url());});
    await page.setViewportSize({width,height});if(![1440,390].includes(width))await page.emulateMedia({reducedMotion:'reduce'});
    await page.goto('/learning-hydrogen/index.html');
    await expect(page.locator('#hydrogenLearning')).toHaveAttribute('data-initialized','true');
    await expect(page.locator('#viewport')).toHaveAttribute('data-renderer','webgl');
    await expect(page.locator('#chapterNav button')).toHaveCount(8);await expect(page.locator('#stepNav button')).toHaveCount(5);
    await expect(page.locator('#playScene')).toHaveAttribute('aria-pressed','false');await expect(page.locator('#viewport')).toHaveAttribute('data-hydrogen-count','12');
    await expect(page.locator('[data-method="compressed"]').first()).toHaveAttribute('aria-pressed','true');
    const defaultLabels=await page.locator('#objectLabels').innerHTML();await page.locator('#viewport').focus();await page.keyboard.press('ArrowRight');
    await expect.poll(()=>page.locator('#objectLabels').innerHTML()).not.toBe(defaultLabels);
    await page.locator('[data-view="in"]').click();await page.locator('[data-view="home"]').click();
    for(let chapter=0;chapter<8;chapter++){
      await page.locator('[data-chapter="'+chapter+'"]').click();
      await expect(page.locator('#chapterTitle')).not.toBeEmpty();await expect(page.locator('#chapterIntro')).not.toBeEmpty();await expect(page.locator('#chapterSummary')).not.toBeEmpty();
      await expect(page.locator('#viewport')).toHaveAttribute('data-hydrogen-count','12');
      if(chapter===6){await expect(page.locator('[data-method="hydride"]').first()).toHaveAttribute('aria-pressed','true');await expect(page.locator('#viewport')).toHaveAttribute('data-inside-hydrogen','12');}
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      const tiny=await page.locator('button:visible').evaluateAll(es=>es.filter(e=>e.getBoundingClientRect().height<43.5).map(e=>e.textContent));expect(tiny).toEqual([]);const clipped=await page.locator('button:visible').evaluateAll(es=>es.filter(e=>e.scrollWidth>e.clientWidth+2).map(e=>e.textContent));expect(clipped).toEqual([]);
      if(width>850)await expect.poll(()=>page.evaluate(()=>Math.abs(document.querySelector('.stage-shell').getBoundingClientRect().height-document.querySelector('.explanation-column').getBoundingClientRect().height))).toBeLessThanOrEqual(80);
      if(([1440,390].includes(width)&&[0,2,3,4,7].includes(chapter))||(![1440,390].includes(width)&&[0,4].includes(chapter)))await page.screenshot({path:'preview/learning-integration/hydrogen-'+chapter+'-'+width+'.png',fullPage:true});
    }
    await page.locator('[data-chapter="2"]').click();
    for(let step=0;step<5;step++){await page.locator('[data-step="'+step+'"]').click();await expect(page.locator('#viewport')).toHaveAttribute('data-hydrogen-count','12');if(step===1)await expect(page.locator('#viewport')).toHaveAttribute('data-molecule-bonds','0');if(step===3)await expect(page.locator('#viewport')).toHaveAttribute('data-inside-hydrogen','12');if(step===4)await expect(page.locator('#viewport')).toHaveAttribute('data-molecule-bonds','6');}
    await page.locator('#viewOptions > summary').click();await page.locator('#resetScene').click();if(width===1280){await page.setViewportSize({width:1270,height});await page.setViewportSize({width,height});}await page.locator('#viewport').scrollIntoViewIfNeeded();await page.locator('.direct-controls [data-play-toggle]').click();await expect(page.locator('#viewport')).toHaveAttribute('data-scene-visible','true');
    await expect.poll(()=>page.locator('#sceneProgress').inputValue().then(Number)).toBeGreaterThan(0);await page.locator('#playScene').click();await expect(page.locator('#playScene')).toHaveAttribute('aria-pressed','false');
    await page.locator('#sceneProgress').focus();await page.keyboard.press('End');await expect(page.locator('#viewport')).toHaveAttribute('data-coordinate','0.000');await expect(page.locator('#viewport')).toHaveAttribute('data-hydrogen-count','12');
    await page.locator('#showSites').uncheck();await page.locator('#showSites').check();
    await page.locator('[data-chapter="3"]').click();await page.locator('#gasPressure').focus();await page.keyboard.press('End');await page.locator('#gasTemperature').focus();await page.keyboard.press('End');await expect(page.locator('#driveStatus')).toContainText('흡수');
    await page.locator('#gasPressure').focus();await page.keyboard.press('Home');await page.locator('#viewport').scrollIntoViewIfNeeded();await expect(page.locator('#driveStatus')).toContainText('방출');await expect(page.locator('#viewport')).toHaveAttribute('data-coordinate','0.000');
    await page.locator('[data-chapter="4"]').click();const old=await page.locator('#curve-absorption').getAttribute('d');await page.locator('#gasTemperature').focus();await page.keyboard.press('Home');await expect(page.locator('#curve-absorption')).not.toHaveAttribute('d',old);
    await page.locator('#composition').evaluate(el=>{el.value='.5';el.dispatchEvent(new Event('input',{bubbles:true}));});
    expect(await page.locator('#viewport').getAttribute('data-inside-hydrogen').then(Number)).toBeGreaterThan(0);expect(await page.locator('#viewport').getAttribute('data-inside-hydrogen').then(Number)).toBeLessThan(12);
    await page.locator('#showHysteresis').uncheck();expect(await page.locator('#curve-absorption').getAttribute('d')).toBe(await page.locator('#curve-desorption').getAttribute('d'));
    const chart=await page.locator('#pctChart').boundingBox();for(const el of await page.locator('#pctChart text').all()){const b=await el.boundingBox();expect(b.x).toBeGreaterThanOrEqual(chart.x-2);expect(b.x+b.width).toBeLessThanOrEqual(chart.x+chart.width+2);}
    await page.locator('[data-chapter="5"]').click();await page.locator('[data-alloy="mg2ni"]').click();await expect(page.locator('#alloyDetail')).toContainText('Mg');
    await page.locator('[data-chapter="6"]').click();await page.locator('[data-application="thermal"]').click();await expect(page.locator('#applicationDetail')).toContainText('열');await page.locator('[data-method="compressed"]').click();await expect(page.locator('#viewport')).toHaveAttribute('data-inside-hydrogen','0');await expect(page.locator('#objectLabels')).not.toContainText('열 방출');await page.locator('[data-application="stationary"]').click();await expect(page.locator('[data-method="hydride"]')).toHaveAttribute('aria-pressed','true');await expect(page.locator('#viewport')).toHaveAttribute('data-inside-hydrogen','12');await page.locator('[data-method="liquid"]').click();await expect(page.locator('#viewport')).toHaveAttribute('data-inside-hydrogen','0');await page.locator('[data-step="3"]').click();await expect(page.locator('[data-method="hydride"]')).toHaveAttribute('aria-pressed','true');await expect(page.locator('#viewport')).toHaveAttribute('data-inside-hydrogen','12');
    await page.locator('[data-chapter="7"]').click();await page.locator('#damage').focus();await page.keyboard.press('End');await page.locator('#impurity').check();await expect(page.locator('#objectLabels')).toContainText('차단');
    await page.reload();await expect(page.locator('#chapterPosition')).toContainText('8 / 8');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);expect(external).toEqual([]);
    await page.locator('.learning-header a[href="../index.html#learning"]').first().click();await expect(page.locator('#themeGrid .theme')).toHaveCount(6);
  });
}

test('hydrogen no-WebGL fallback, reduced motion and hidden-page suspension',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.emulateMedia({reducedMotion:'reduce'});
  await page.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/i.test(type)?null:get.call(this,type,...args);};});
  await page.goto('/learning-hydrogen/index.html');await expect(page.locator('#viewport')).toHaveAttribute('data-renderer','svg');await expect(page.locator('#fallbackScene')).toBeVisible();await expect(page.locator('#playScene')).toHaveAttribute('aria-pressed','false');
  await page.locator('[data-chapter="3"]').click();await page.locator('#gasPressure').focus();await page.keyboard.press('Home');await expect(page.locator('#viewport')).toHaveAttribute('data-inside-hydrogen','0');await expect(page.locator('#viewport')).toHaveAttribute('data-hydrogen-count','12');
  await page.locator('#viewport').focus();const before=await page.locator('#fallbackScene').innerHTML();await page.keyboard.press('ArrowRight');await expect.poll(()=>page.locator('#fallbackScene').innerHTML()).not.toBe(before);expect(errors).toEqual([]);
});
