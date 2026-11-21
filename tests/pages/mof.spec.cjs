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

for(const [width,height]of [[1440,1000],[390,844]]){
  test('MOF explanation practice and experiment guidance at '+width+'x'+height,async({page})=>{
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.setViewportSize({width,height});
    await page.goto('/learning-mof/index.html');
    await expect(page.locator('#lessonAnalogy')).not.toBeEmpty();
    await expect(page.locator('#analogyBoundary')).toContainText('비유의 범위');
    await expect(page.locator('#lessonSources a')).toHaveCount(2);
    await page.locator('#checkAnswer').click();
    await expect(page.locator('#quizFeedback')).toContainText('먼저 답');
    await page.locator('#knowledge-0').check();await page.locator('#checkAnswer').click();
    await expect(page.locator('#quizFeedback')).toHaveAttribute('data-correct','false');
    await page.locator('#knowledge-0').focus();await page.keyboard.press('ArrowDown');
    await expect(page.locator('#knowledge-1')).toBeChecked();
    await page.locator('#checkAnswer').focus();await page.keyboard.press('Enter');
    await expect(page.locator('#quizFeedback')).toHaveAttribute('data-correct','true');
    await page.locator('#selfReflection > summary').click();
    await page.locator('#selfExplanation').fill('금속 마디와 유기 링커가 반복 연결되어 그 사이에 기공이 생깁니다.');
    await page.locator('[data-chapter="2"]').click();
    await expect(page.locator('#quizFeedback')).toBeEmpty();
    await page.locator('[data-chapter="0"]').click();
    await expect(page.locator('#quizFeedback')).toHaveAttribute('data-correct','true');
    await page.locator('#selfReflection > summary').click();
    await expect(page.locator('#selfExplanation')).toHaveValue(/금속 마디와 유기 링커/);
    await page.screenshot({path:'preview/fab-v092/mof-practice-'+width+'.png',fullPage:true});

    await page.locator('#advancedTopics > summary').click();
    await page.locator('[data-chapter="3"]').click();
    await page.locator('[data-rings="3"]').click();
    await expect(page.locator('#modelName')).toContainText('IRMOF-16');
    await expect(page.locator('#experimentDetails')).toContainText('측정 길이가 아닙니다');
    await page.locator('#quantityGuide > summary').click();
    await expect(page.locator('#quantityGuide table')).toBeVisible();
    await page.locator('[data-chapter="5"]').click();
    await page.locator('#interpenetration').check();
    await expect(page.locator('#modelName')).toContainText('두 독립 망');
    await expect(page.locator('#experimentDetails')).toContainText('두 망을 잇는 결합은 만들지 않습니다');
    await expect(page.locator('#practicalNote')).toContainText('가수분해');
    await page.screenshot({path:'preview/fab-v092/mof-interpenetration-'+width+'.png',fullPage:true});

    await page.locator('[data-chapter="7"]').click();
    await expect(page.locator('#chapterExplanation')).toContainText('물리흡착');
    await expect(page.locator('#experimentDetails')).toContainText('무차원 교육 모형');
    await page.locator('#gasPressure').focus();await page.keyboard.press('Home');
    await expect(page.locator('#liveResults')).toContainText('0.0%');
    await page.locator('#gasPressure').press('End');
    await page.locator('#gasOptions > summary').click();
    await page.locator('#gasSize').focus();await page.keyboard.press('End');
    await expect(page.locator('#liveResults')).toContainText('제한');
    await page.locator('#gasSize').press('Home');
    await expect(page.locator('#liveResults')).toContainText('가능');
    await page.locator('#gasTemperature').focus();await page.keyboard.press('End');
    await expect(page.locator('#gasAdvancedResults')).toContainText('혼합 기체의 선택도');
    await page.screenshot({path:'preview/fab-v092/mof-adsorption-'+width+'.png',fullPage:true});

    await page.locator('[data-chapter="8"]').click();
    await page.locator('[data-application="4"]').click();
    await expect(page.locator('#applicationWhy')).toContainText('빛이나 전기적 응답');
    await expect(page.locator('#practicalNote')).toContainText('재생 에너지');
    await page.locator('[data-chapter="0"]').click();
    await page.locator('[data-focus="node"]').click();
    await expect(page.locator('#viewport')).toHaveAttribute('data-atom-count','23');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    if(width===390){
      await page.setViewportSize({width:320,height:740});
      for(const chapter of [0,2,1,3,4,5,6,7,8]){
        await page.locator('[data-chapter="'+chapter+'"]').click();
        await expect(page.locator('#quizQuestion')).not.toBeEmpty();
        expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      }
    }
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
