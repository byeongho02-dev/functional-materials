/* Ideal phase addition for teaching; no material efficiency or sensor data. */
(function(scope){
  'use strict';
  function arrayFactor(wavelength,pitch,phase,angle,count=9){
    const residual=2*Math.PI*pitch/wavelength*Math.sin(angle*Math.PI/180)-phase*Math.PI/180;
    const phases=Array.from({length:count},(_,i)=>(i-(count-1)/2)*residual);
    const real=phases.reduce((v,p)=>v+Math.cos(p),0)/count;
    const imaginary=phases.reduce((v,p)=>v+Math.sin(p),0)/count;
    return {phases,residual,intensity:Math.min(1,Math.max(0,real*real+imaginary*imaginary))};
  }
  if(typeof module==='object'&&module.exports)module.exports={arrayFactor};
  if(typeof document==='undefined')return;
  const root=document.getElementById('materialsLab');if(!root||root.dataset.exploreReady==='true')return;
  root.dataset.exploreReady='true';
  const $=id=>root.querySelector('#'+id),value=id=>Number($(id).value);
  const focus={emi:2,meta:2};
  const guidance={
    emi:[
      ['표면에서 갈라지는 경로','입사한 전기장이 자유전자를 움직입니다. 이 전하·전류의 반응으로 되돌아가는 파가 생깁니다. 반사율은 이 모형에서 독립 입력입니다.'],
      ['안으로 갈수록 작아지는 진동','청록 점은 전자 반응의 개념 기호입니다. 보라 파의 진폭은 깊이에 따라 감소합니다. 두께를 늘리면 감쇠가 누적되지만, 전자가 판 끝까지 이동하는 것은 아닙니다.'],
      ['에너지의 행방을 함께 보기','반사 R + 흡수 A + 투과 T = 100%입니다. 내부에서 소산된 에너지는 열 등으로 바뀝니다. 보라 점은 열 전달의 정성 기호이며 전자 궤적이 아닙니다.']
    ],
    meta:[
      ['먼저 같은 파면이 들어옵니다','정면 입사를 가정합니다. 기둥을 만나기 전에는 같은 높이의 파면이 나란합니다. 파장은 같은 진동 상태 사이의 거리입니다.'],
      ['이웃마다 다른 진동 위상','시계 바늘은 빛의 국소 전기장 진동 위상입니다. 이웃 바늘의 차이는 설정한 Δφ입니다. 높이·색은 설계 위상의 기호이며, 실제 기둥 형상에서 위상을 계산한 결과가 아닙니다.'],
      ['위상차와 거리 차이가 보상되는 방향','기둥에서 나온 파는 이동 거리 때문에 위상이 더 변합니다. 특정 방향에서는 이 변화가 설계 위상차를 보상해 보강 간섭이 생깁니다. 아래 펼침 실험으로 직접 비교해 보세요.']
    ]
  };
  function select(topic,step){
    focus[topic]=step;
    root.querySelectorAll('[data-explore-topic="'+topic+'"]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.exploreStep)===step)));
    $(topic+'FocusTitle').textContent=guidance[topic][step][0];$(topic+'FocusText').textContent=guidance[topic][step][1];
    root.dispatchEvent(new CustomEvent('materials:focus',{detail:{topic,step}}));
    const panel=$('panel-'+topic);if(panel.classList.contains('render-fallback'))$(topic+'FocusText').textContent+=' 2D 대체 보기에서는 전체 경로를 함께 표시합니다.';
  }
  root.querySelectorAll('[data-explore-topic]').forEach(b=>b.addEventListener('click',()=>select(b.dataset.exploreTopic,Number(b.dataset.exploreStep))));
  function draw(){
    const w=value('metaWavelength'),p=value('metaPitch'),phase=value('metaPhase'),angle=value('observationAngle');
    const result=arrayFactor(w,p,phase,angle),prediction=scope.MaterialsLabModel.calculateMeta(w,p,phase);
    $('observationAngleOut').textContent=angle.toFixed(1)+'°';
    $('arrayFactorValue').textContent=result.intensity.toFixed(3);
    $('arrayFactorNote').textContent=Math.abs(result.residual)<.02?'거리 차이와 설계 위상차가 거의 보상되어 화살표가 나란합니다.':'화살표가 서로 어긋나 일부가 상쇄됩니다. 관찰 방향을 바꾸어 비교하세요.';
    $('matchDirection').disabled=!prediction.propagating;
    $('arrayFactorLimit').textContent=prediction.propagating?'동일 진폭 점파원 9개의 이상적인 배열 인자 |Σ exp(iφ)/9|²입니다. 1은 이 이상 모형의 최대 합이며 실제 투과 효율 100%가 아닙니다.':'기존 위상 구배 식이 지정하는 전파 방향은 없습니다. 그래도 유한 배열에서는 다른 방향의 파가 남을 수 있습니다. 이 도식은 반사·흡수·소자 응답을 계산하지 않습니다.';
    const svg=$('phaseAddition'),width=Math.max(280,Math.round(svg.getBoundingClientRect().width)||600),columns=width<600?5:9,rows=Math.ceil(9/columns),height=rows*100+28;
    svg.setAttribute('viewBox','0 0 '+width+' '+height);svg.style.height=height+'px';
    let markup='<defs><marker id="field-phase-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#ffc47d"/></marker></defs>';
    result.phases.forEach((phase,i)=>{
      const row=Math.floor(i/columns),cols=Math.min(columns,9-row*columns),x=(i%columns+1)*width/(cols+1),y=38+row*100,r=Math.min(21,width/(columns+1)*.32);
      markup+='<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="#142b3f" stroke="#7395ac"/><path d="M'+x+' '+y+'L'+(x+r*.85*Math.cos(phase))+' '+(y-r*.85*Math.sin(phase))+'" stroke="#ffc47d" stroke-width="2" marker-end="url(#field-phase-arrow)"/><text x="'+x+'" y="'+(y+r+23)+'" text-anchor="middle" fill="#e4f1f9" font-size="14">'+(i+1)+'</text>';
    });
    svg.innerHTML=markup;svg.setAttribute('aria-label','관찰각 '+angle.toFixed(1)+'도에서 9개 파의 상대 위상. 정규화 배열 인자 '+result.intensity.toFixed(3));
  }
  $('observationAngle').addEventListener('input',draw);
  $('matchDirection').addEventListener('click',()=>{const r=scope.MaterialsLabModel.calculateMeta(value('metaWavelength'),value('metaPitch'),value('metaPhase'));if(r.propagating){$('observationAngle').value=String(r.angleDeg);draw();}});
  root.addEventListener('materials:update',event=>{const topic=event.detail.topic;if(topic in focus)select(topic,focus[topic]);if(topic==='meta')draw();});
  if(scope.ResizeObserver)new scope.ResizeObserver(draw).observe($('phaseAddition'));
  $('phaseExperiment').addEventListener('toggle',draw);
  select('emi',2);select('meta',2);draw();
})(globalThis);
