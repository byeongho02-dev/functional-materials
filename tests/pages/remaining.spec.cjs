const {test,expect}=require('@playwright/test');
for(const [width,height]of [[1440,1000],[1280,900],[768,1024],[390,844],[360,800]]){
  test('remaining lessons review: causal scenes, controls and layout at '+width,async({page})=>{
    test.setTimeout(240000);const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/404/.test(m.text()))errors.push(m.text());});
    await page.setViewportSize({width,height});await page.emulateMedia({reducedMotion:'reduce'});
    const capture=width===1440||width===390,size=width===1440?'desktop':'mobile';
    const input=async(id,v)=>page.locator('#'+id).evaluate((el,value)=>{el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));},v);
    const fits=async()=>{
      expect(await page.evaluate(()=>document.documentElement.scrollWidth),page.url()).toBeLessThanOrEqual(width);
      expect(await page.locator('button:visible').evaluateAll(es=>es.filter(e=>e.scrollWidth>e.clientWidth+2).map(e=>e.textContent)),page.url()).toEqual([]);
    };
    await page.goto('/learning-hydrogen/index.html');await expect(page.locator('#viewport')).toHaveAttribute('data-renderer','webgl');
    for(let c=0;c<8;c++){
      await page.locator('[data-chapter="'+c+'"]').click();await fits();
      if(c===0){for(const method of ['compressed','liquid','hydride']){await page.locator('[data-method="'+method+'"]').first().click();await expect(page.locator('#sceneModelName')).toContainText(method==='hydride'?'금속수소화물':method==='liquid'?'액체':'압축');if(capture)await page.locator('#hydrogenLab .lab-grid').screenshot({path:'preview/remaining-review/hydrogen/'+size+'/storage-'+method+'.png'});}}
      if(c===7){await page.locator('#impurity').check();await page.locator('[data-step="3"]').click();await expect(page.locator('#viewport')).toHaveAttribute('data-inside-hydrogen','10');await expect(page.locator('#objectLabels')).toContainText('차단');}
      if(capture)await page.locator('#hydrogenLab .lab-grid').screenshot({path:'preview/remaining-review/hydrogen/'+size+'/chapter-'+(c+1)+'.png'});
    }
    await page.goto('/learning-mof/index.html');await expect(page.locator('#viewport')).toHaveAttribute('data-renderer','webgl');
    await page.locator('[data-focus="node"]').click();await expect(page.locator('#sceneTitle')).toContainText('금속 마디');
    await page.locator('[data-focus="linker"]').click();await expect(page.locator('#sceneWhy')).toContainText('카복실레이트');
    await page.locator('#advancedTopics').evaluate(el=>el.open=true);
    for(let c=0;c<9;c++){
      await page.locator('[data-chapter="'+c+'"]').click();await fits();
      if(c===7){
        await page.locator('#gasOptions').evaluate(el=>el.open=true);await input('gasSize',1.3);await expect(page.locator('#entryComparison')).toContainText('통과 제한');await expect(page.locator('#liveResults')).toContainText('0.0%');
        await input('gasSize',.65);await input('gasPressure',1);await page.locator('#nextScene').click();await expect(page.locator('#componentReadout')).toContainText('교환');
        await expect(page.locator('#liveResults')).toContainText('평형 목표');
      }
      if(c===8){await page.locator('[data-application="4"]').click();await expect(page.locator('#componentReadout')).toContainText('신호');}
      if(capture)await page.locator('#mofLab .lab-grid').screenshot({path:'preview/remaining-review/mof/'+size+'/chapter-'+(c+1)+'.png'});
    }
    await page.goto('/learning-electromagnetic/index.html');
    for(const topic of ['emi','meta']){
      await page.locator('#tab-'+topic).click();
      for(let step=0;step<3;step++){await page.locator('[data-explore-topic="'+topic+'"][data-explore-step="'+step+'"]').click();await expect(page.locator('#'+topic+'Canvas')).toHaveAttribute('data-learning-focus',String(step));await fits();}
      const canvas=page.locator('#'+topic+'Canvas');const originalView=await canvas.screenshot();
      await canvas.focus();await page.keyboard.press('ArrowRight');const rotatedView=await canvas.screenshot();expect(rotatedView.equals(originalView),'Keyboard rotation must change the rendered scene').toBe(false);
      await page.keyboard.press('+');await page.keyboard.press('Home');
      if(topic==='meta'){
        await page.locator('#phaseExperiment').evaluate(el=>el.open=true);await page.locator('#matchDirection').click();await expect.poll(async()=>Number(await page.locator('#arrayFactorValue').textContent())).toBeGreaterThan(.999);
        await input('observationAngle',0);await expect.poll(async()=>Number(await page.locator('#arrayFactorValue').textContent())).toBeLessThan(.1);
        await input('metaWavelength',800);await input('metaPitch',120);await input('metaPhase',120);await expect(page.locator('#matchDirection')).toBeDisabled();await expect(page.locator('#arrayFactorLimit')).toContainText('다른 방향');
      }
      await page.locator('#'+topic+'Canvas').scrollIntoViewIfNeeded();
      if(capture)await page.locator('#panel-'+topic).screenshot({path:'preview/remaining-review/electromagnetic/'+size+'/'+topic+'.png'});
    }
    await page.locator('#tab-super').click();await expect(page.locator('#cooper-lab')).toHaveAttribute('data-cp-ready','true');
    const ybco=await page.locator('#superTemperatureOut').textContent();
    for(let step=0;step<7;step++){
      await page.locator('[data-cp-step="'+step+'"]').click();const before=await page.locator('#cp-scene').innerHTML();await input('cp-progress',65);
      if([0,1,2,3,5,6].includes(step))expect(await page.locator('#cp-scene').innerHTML()).not.toBe(before);
      const clippedLabels=await page.locator('#cp-svg').evaluate(svg=>{const r=svg.getBoundingClientRect();return [...svg.querySelectorAll('#cp-scene text')].filter(el=>{const b=el.getBoundingClientRect();return b.left<r.left-2||b.right>r.right+2||b.top<r.top-2||b.bottom>r.bottom+2;}).map(el=>el.textContent);});expect(clippedLabels,'Cooper stage '+step+' at '+width).toEqual([]);
      await page.locator('#cp-theory').evaluate(el=>el.open=true);await expect(page.locator('#cp-theory-body')).not.toBeEmpty();await fits();
      if(step>=4){await page.locator('[data-cp-coherence="no"]').click();if(step<6)await expect(page.locator('#cp-twist')).toBeDisabled();await page.locator('[data-cp-coherence="yes"]').click();if(step<6){await input('cp-twist',30);await expect(page.locator('#cp-twist-value')).toContainText('30');}}
      if(capture)await page.locator('#cooper-lab').screenshot({path:'preview/remaining-review/cooper/'+size+'/step-'+(step+1)+'.png'});
    }
    await expect(page.locator('#superTemperatureOut')).toHaveText(ybco);
    await page.locator('#cp-reset').click();await page.locator('#cp-play').click();await expect.poll(async()=>Number(await page.locator('#cp-progress').inputValue())).toBeGreaterThan(0);await page.locator('#cp-play').click();
    const held=await page.locator('#cp-progress').inputValue();await page.waitForTimeout(200);await expect(page.locator('#cp-progress')).toHaveValue(held);
    await page.locator('#tab-emi').click();await page.locator('#tab-super').click();await expect(page.locator('#superCanvas')).toBeVisible();
    await page.goto('/learning-electromagnetic/index.html#cooper-lab');await expect(page.locator('#panel-super')).toBeVisible();await expect(page.locator('#cooper-lab')).toBeVisible();
    expect(errors).toEqual([]);
  });
}
