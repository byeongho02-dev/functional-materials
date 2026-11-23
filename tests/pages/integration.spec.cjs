const {test,expect}=require('@playwright/test');
for(const [width,height]of [[1440,1000],[1280,900],[768,1024],[390,844],[360,800]]){
  test('six themes and existing course interactions at '+width,async({page})=>{
    test.setTimeout(180000);const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width,height});await page.emulateMedia({reducedMotion:'reduce'});
    const fits=async()=>{const overflow=await page.evaluate(()=>({width:innerWidth,documentWidth:document.documentElement.scrollWidth,elements:[...document.querySelectorAll('main *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).slice(0,8).map(e=>e.tagName+'.'+e.classList.toString())}));expect(overflow.documentWidth,JSON.stringify({url:page.url(),...overflow})).toBeLessThanOrEqual(overflow.width);expect(await page.locator('button:visible').evaluateAll(es=>es.filter(e=>e.scrollWidth>e.clientWidth+2).map(e=>e.textContent)),page.url()).toEqual([]);};
    await page.goto('/#learning');await expect(page.locator('#themeGrid .theme')).toHaveCount(6);
    expect(await page.locator('#themeGrid h3').allTextContents()).toEqual(['재료과학 기초와 금속재료','생체재료','형상기억합금','수소저장합금','나노전자재료 및 전자파 차폐','MOF · 금속–유기 골격체']);
    expect(await page.locator('#themeGrid .number').allTextContents()).toEqual(['THEME 01','THEME 02','THEME 03','THEME 04','THEME 05','THEME 06']);await expect(page.locator('#themeCount')).toContainText('6개');await fits();
    await page.locator('#themeGrid a[href="learning-hydrogen/index.html"]').click();await expect(page).toHaveURL(/learning-hydrogen\/index\.html/);await page.goBack();await expect(page.locator('#themeGrid')).toBeVisible();
    await page.goto('/#theme-hydrogen');await expect(page.locator('#hydrogenEntry')).toBeVisible();await expect(page.locator('#hydrogenEntry a')).toHaveAttribute('href','learning-hydrogen/index.html');
    await page.goto('/#theme-antimicrobial');await expect(page.locator('#themeGrid')).toBeVisible();await expect(page.locator('#themeGrid .theme')).toHaveCount(6);
    await page.screenshot({path:'preview/learning-integration/themes-'+width+'.png',fullPage:true});

    // Full 24-unit, 5-size coverage is in lectures.spec.cjs; keep cross-site navigation here.
    for(let n=1;n<=3;n++){
      await page.goto('/learning-lecture'+n+'.html#chapter-3');await expect(page.locator('#chapterNav button')).toHaveCount(8);await expect(page.locator('#viewport')).toHaveAttribute('data-renderer','webgl');await expect(page.locator('#viewport')).toHaveAttribute('data-chapter','2');await fits();
      await page.locator('#chapterNav [data-chapter="7"]').click();await expect(page.locator('#chapterPosition')).toContainText('08 / 08');await fits();
    }

    await page.goto('/learning-electromagnetic/index.html');await expect(page.locator('#panel-emi')).toBeVisible();const thickness=await page.locator('#emiThicknessOut').textContent();await page.locator('#emiThickness').focus();await page.keyboard.press('End');await expect(page.locator('#emiThicknessOut')).not.toHaveText(thickness);await fits();
    await page.locator('#tab-super').click();await expect(page.locator('#panel-super')).toBeVisible();await page.locator('#superTemperature').focus();await page.keyboard.press('End');await fits();
    await page.locator('#tab-meta').click();await expect(page.locator('#panel-meta')).toBeVisible();await page.locator('#metaPhase').focus();await page.keyboard.press('End');await fits();await page.locator('#tab-emi').click();await expect(page.locator('#panel-emi')).toBeVisible();await page.screenshot({path:'preview/learning-integration/electromagnetic-'+width+'.png',fullPage:true});

    await page.goto('/learning-mof/index.html');await expect(page.locator('#viewport')).toHaveAttribute('data-renderer','webgl');await page.locator('[data-focus="node"]').click();await expect(page.locator('#viewport')).toHaveAttribute('data-atom-count','23');await fits();
    await page.goto('/ale-v092-fab.html');await page.waitForFunction(()=>window.__fab?.ready);await expect(page.locator('#renderer-mode')).toContainText('WEBGL');expect(await page.evaluate(()=>window.__fab.chamber.parts.size)).toBe(12);await page.locator('#cutaway').uncheck();expect(await page.evaluate(()=>window.__fab.chamber.state.cutaway)).toBe(false);await fits();
    if(width===768)await page.screenshot({path:'preview/learning-integration/ale-tablet.png',fullPage:true});
    expect(errors).toEqual([]);
  });
}
