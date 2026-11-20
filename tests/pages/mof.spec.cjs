const {test,expect}=require('@playwright/test');

for(const [width,height]of [[1440,1000],[390,844]]){
  test('MOF foundations and molecular views at '+width+'x'+height,async({page})=>{
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.setViewportSize({width,height});
    await page.goto('/learning-mof/index.html');
    await expect(page.locator('#chapterNav [data-chapter]')).toHaveCount(3);
    await expect(page.locator('#viewport')).toHaveAttribute('data-renderer','webgl');
    await page.waitForFunction(()=>+document.querySelector('#viewport').dataset.atomCount>100);
    await expect(page.locator('#chapterTitle')).toHaveText('MOF란 무엇인가요?');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.screenshot({path:'preview/fab-v092/mof-foundations-'+width+'.png',fullPage:true});

    await page.locator('[data-focus="node"]').click();
    await expect(page.locator('#modelName')).toContainText('Zn₄O(COO)₆');
    await expect(page.locator('#viewport')).toHaveAttribute('data-atom-count','23');
    await page.screenshot({path:'preview/fab-v092/mof-node-'+width+'.png',fullPage:true});
    await page.locator('[data-focus="linker"]').click();
    await expect(page.locator('#modelName')).toContainText('BDC');
    await page.locator('#viewSettings').evaluate(el=>el.open=true);
    await page.locator('#showHydrogen').check();
    await expect(page.locator('#viewport')).toHaveAttribute('data-atom-count','16');
    await page.screenshot({path:'preview/fab-v092/mof-linker-'+width+'.png',fullPage:true});
    await page.locator('[data-representation="topology"]').click();
    await expect(page.locator('#viewport')).toHaveAttribute('data-atom-count','0');
    await page.locator('[data-representation="atoms"]').click();
    await page.waitForFunction(()=>+document.querySelector('#viewport').dataset.atomCount>100);
    expect(await page.locator('#viewport').getAttribute('data-draw-calls').then(Number)).toBeLessThan(35);

    await page.locator('#chapterNav [data-chapter="2"]').click();
    await expect(page.locator('#chapterPosition')).toHaveText('기초 2 / 3');
    await page.locator('#nextChapter').click();
    await expect(page.locator('#chapterPosition')).toHaveText('기초 3 / 3');
    await expect(page.locator('#nextChapter')).toBeDisabled();
    await page.locator('#nextScene').click();await page.locator('#nextScene').click();
    await expect(page.locator('#componentReadout')).toContainText('공유');
    await page.screenshot({path:'preview/fab-v092/mof-coordination-'+width+'.png',fullPage:true});
    await page.locator('#playScene').click();
    await page.waitForFunction(()=>+document.querySelector('#sceneProgress').value>0);
    await page.locator('#playScene').click();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}

test('molecular controls remain usable without WebGL',async({page})=>{
  await page.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/i.test(type)?null:get.call(this,type,...args);};});
  await page.goto('/learning-mof/index.html');
  await expect(page.locator('#fallbackScene')).toBeVisible();
  await expect(page.locator('#viewport')).toHaveAttribute('data-renderer','svg');
  await page.locator('[data-focus="node"]').click();
  await expect(page.locator('#modelName')).toContainText('Zn₄O');
  expect(await page.locator('#fallbackScene circle').count()).toBeGreaterThan(20);
});
