(function(){
  'use strict';
  const root=document.getElementById('hydrogenLearning'),M=window.HydrogenModel,C=window.HydrogenContent;
  if(!root||!M||!C||root.dataset.initialized==='true')return;
  root.dataset.initialized='true';
  const $=id=>root.querySelector('#'+id),viewport=$('viewport'),canvas=$('hydrogenCanvas'),fallback=$('fallbackScene');
  const media=window.matchMedia?window.matchMedia('(prefers-reduced-motion: reduce)'):null;
  let state=M.defaults(),reduced=!!media?.matches,visible=true,raf=0,lastTime=0,lastDraw=0,dirty=true,forcePaint=false,renderer=null,scene=null,camera=null,model=null,drag=null,tween=null,plotKey='';
  let yaw=-.5,pitch=.35,zoom=1;
  const meshes=new Map(),materials=new Map(),labels=new Map(),shared={};
  const text=(id,value)=>{const el=$(id);if(el&&el.textContent!==String(value))el.textContent=String(value);};
  const announce=value=>text('labStatus',value);
  function activateRenderer(){
    try{
      const T=window.THREE;if(!T)throw new Error('No Three');
      renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true});renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));renderer.setClearColor(0,0);
      if('outputColorSpace' in renderer)renderer.outputColorSpace=T.SRGBColorSpace;
      scene=new T.Scene();camera=new T.OrthographicCamera(-5,5,4,-4,.1,100);
      scene.add(new T.HemisphereLight(0xe5f7ff,0x11283f,1.6));
      const key=new T.DirectionalLight(0xffffff,2.2);key.position.set(4,7,6);scene.add(key);
      const fill=new T.DirectionalLight(0x82dfec,1.1);fill.position.set(-6,2,-4);scene.add(fill);
      shared.sphere=new T.SphereGeometry(1,24,16);shared.bar=new T.CylinderGeometry(1,1,1,12);shared.box=new T.BoxGeometry(1,1,1);shared.transform=new T.Object3D();shared.a=new T.Vector3();shared.b=new T.Vector3();shared.d=new T.Vector3();shared.axis=new T.Vector3(0,1,0);
      viewport.dataset.renderer='webgl';
    }catch(_){renderer=null;canvas.hidden=true;fallback.hidden=false;fallback.removeAttribute('hidden');$('renderMode').hidden=false;viewport.dataset.renderer='svg';}
  }
  function scale(){const aspect=(viewport.clientWidth||640)/(viewport.clientHeight||430);return Math.max(3.5,4.7/Math.max(.6,aspect))/zoom;}
  function projection(p){const x=p[0]-.7,y=p[1]-.15,z=p[2],cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);const rx=x*cy+z*sy,rz=-x*sy+z*cy,ry=y*cp-rz*sp;const factor=(viewport.clientHeight||430)/(2*scale());return [(viewport.clientWidth||640)/2+rx*factor,(viewport.clientHeight||430)/2-ry*factor,y*sp+rz*cp];}
  function mat(p){const key=[p.color,!!p.hollow,Math.round(p.opacity*100)].join(':');if(materials.has(key))return materials.get(key);const T=window.THREE;const m=new T.MeshStandardMaterial({color:p.color,roughness:p.element==='M'?.32:.42,metalness:p.element==='M'?.5:.08,transparent:p.opacity<1,opacity:p.opacity,depthWrite:p.opacity>=1,wireframe:!!p.hollow,emissive:p.element==='H'?p.color:0x000000,emissiveIntensity:.13});materials.set(key,m);return m;}
  function drawThree(){
    const T=window.THREE,w=Math.max(1,viewport.clientWidth||640),h=Math.max(1,viewport.clientHeight||430),sc=scale();
    camera.left=-sc*w/h;camera.right=sc*w/h;camera.top=sc;camera.bottom=-sc;camera.updateProjectionMatrix();camera.position.set(.7+20*Math.cos(pitch)*Math.sin(-yaw),.15+20*Math.sin(pitch),20*Math.cos(pitch)*Math.cos(yaw));camera.lookAt(.7,.15,0);
    if(canvas.width!==Math.round(w*renderer.getPixelRatio())||canvas.height!==Math.round(h*renderer.getPixelRatio()))renderer.setSize(w,h,false);
    const groups=new Map();for(const p of model.parts){const key=[p.kind,p.color,!!p.hollow,Math.round(p.opacity*100)].join(':');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(p);}
    for(const mesh of meshes.values())mesh.visible=false;
    for(const [key,parts]of groups){let mesh=meshes.get(key);if(!mesh||mesh.instanceMatrix.count<parts.length){if(mesh){scene.remove(mesh);mesh.dispose?.();}mesh=new T.InstancedMesh(shared[parts[0].kind],mat(parts[0]),2**Math.ceil(Math.log2(Math.max(1,parts.length))));mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);meshes.set(key,mesh);scene.add(mesh);}mesh.count=parts.length;mesh.visible=true;
      parts.forEach((p,i)=>{const o=shared.transform;o.quaternion.identity();if(p.kind==='bar'){shared.a.fromArray(p.a);shared.b.fromArray(p.b);shared.d.subVectors(shared.b,shared.a);o.position.copy(shared.a).add(shared.b).multiplyScalar(.5);o.scale.set(p.r,shared.d.length(),p.r);o.quaternion.setFromUnitVectors(shared.axis,shared.d.normalize());}else{o.position.fromArray(p.p);if(p.size)o.scale.fromArray(p.size);else o.scale.setScalar(p.r);}o.updateMatrix();mesh.setMatrixAt(i,o.matrix);});mesh.instanceMatrix.needsUpdate=true;
    }renderer.render(scene,camera);viewport.dataset.drawCalls=String(renderer.info?.render?.calls||0);
  }
  const ns='http://www.w3.org/2000/svg';
  function svg(tag,attrs={}){const e=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,String(v));return e;}
  function drawFallback(){
    const w=viewport.clientWidth||640,h=viewport.clientHeight||430;fallback.setAttribute('viewBox',`0 0 ${w} ${h}`);const frag=document.createDocumentFragment(),defs=svg('defs');
    for(const color of new Set(model.parts.map(p=>p.color))){const g=svg('radialGradient',{id:'hydrogen-'+color.slice(1),cx:'30%',cy:'25%',r:'75%'});g.append(svg('stop',{offset:0,'stop-color':'#f2fbff'}),svg('stop',{offset:.45,'stop-color':color}),svg('stop',{offset:1,'stop-color':'#17334a'}));defs.append(g);}frag.append(defs);
    const factor=h/(2*scale());const sorted=model.parts.map(p=>({p,z:projection(p.p||M.mix(p.a,p.b,.5))[2]})).sort((a,b)=>a.z-b.z);
    for(const {p}of sorted){if(p.kind==='sphere'){const q=projection(p.p);frag.append(svg('circle',{cx:q[0],cy:q[1],r:p.r*factor,fill:p.hollow?'none':'url(#hydrogen-'+p.color.slice(1)+')',stroke:p.color,'stroke-width':p.hollow?1.2:.5,opacity:p.opacity}));}else if(p.kind==='bar'){const a=projection(p.a),b=projection(p.b);frag.append(svg('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke:p.color,'stroke-width':Math.max(1,p.r*2*factor),'stroke-linecap':'round',opacity:p.opacity}));}else{const pts=[];for(let x=0;x<2;x++)for(let y=0;y<2;y++)for(let z=0;z<2;z++)pts.push(projection(p.p.map((v,i)=>v+([x,y,z][i]-.5)*p.size[i])));for(const ids of [[0,1,3,2],[4,5,7,6],[0,2,6,4],[1,3,7,5]])frag.append(svg('polygon',{points:ids.map(i=>pts[i].slice(0,2).join(',')).join(' '),fill:p.color,opacity:p.opacity,stroke:p.color}));}}
    fallback.replaceChildren(frag);
  }
  function drawLabels(){const ids=new Set(model.labels.map(l=>l.id));for(const [id,el]of labels)if(!ids.has(id)){el.remove();labels.delete(id);}const w=viewport.clientWidth||640,h=viewport.clientHeight||430;for(const l of model.labels){let el=labels.get(l.id);if(!el){el=document.createElement('span');el.className='object-label';labels.set(l.id,el);$('objectLabels').append(el);}el.textContent=l.text;const p=projection(l.p),box=el.getBoundingClientRect(),half=Math.min(w/2-8,(box.width||Math.min(210,l.text.length*8))/2);el.style.left=M.clamp(p[0],half+7,w-half-7)+'px';el.style.top=M.clamp(p[1],20,h-20)+'px';}}
  function currentStep(){if(state.response||state.coordinate!==null){const u=M.coordinate(state),release=state.response?state.response.end<state.response.start:M.drive(state).direction==='release';return release?4:Math.min(3,Math.floor(u));}return state.step;}
  function syncReadout(){
    const step=currentStep(),entry=M.steps[step],u=M.coordinate(state);text('processTitle',entry.name);text('scenePosition',(step+1)+' / 5');
    let observation=entry.observation;if(step===4){observation=u>3?'수소화물 상태에서 H를 내보내는 과정을 시작합니다.':u>2?'원자 H가 격자 내부에서 표면으로 이동합니다.':u>1?'표면에서 H 원자들이 만나 H₂로 재결합합니다.':'재결합한 H₂ 분자가 표면에서 멀어집니다.';}
    text('observation',observation);text('processReason',entry.reason);
    for(const b of root.querySelectorAll('[data-play-toggle]')){b.setAttribute('aria-pressed',String(state.playing));const label=state.playing?'일시정지':'재생';if(b.textContent!==label)b.textContent=label;}$('playScene').setAttribute('aria-pressed',String(state.playing));text('playScene',state.playing?'일시정지':'과정 재생');$('previousStep').disabled=step===0;$('nextStep').disabled=step===4;
    for(const b of root.querySelectorAll('[data-step]')){if(Number(b.dataset.step)===step)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');}
    const progress=Math.round((step===4?4+(1-u/4):u)/5*100);$('sceneProgress').value=progress;text('progressValue',progress+'%');
    for(const [id,value]of [['gasPressureValue',state.pressure.toFixed(2)],['gasTemperatureValue',state.temperature.toFixed(2)],['compositionValue',state.composition.toFixed(2)],['damageValue',['초기','변화 시작','변화 뚜렷'][Math.min(2,Math.round(state.damage*2))]]])text(id,value);
    const d=M.drive(state);text('driveStatus',d.label);if($('driveStatus'))$('driveStatus').dataset.direction=d.direction;
    for(const key of ['alloy','application','branch','method'])for(const b of root.querySelectorAll('[data-'+key+']'))b.setAttribute('aria-pressed',String(state[key]===b.dataset[key]));
    for(const card of root.querySelectorAll('.method-card'))card.setAttribute('aria-current',String(card.dataset.methodCard===state.method));
    if($('alloyDetail')){$('alloyDetail').textContent=C.alloys[state.alloy].text;text('alloyFocus',C.alloys[state.alloy].focus);}
    if($('applicationDetail'))text('applicationDetail',C.applications[state.application].text);
    if(model){text('modelReadout',`그림 속 H 원자 ${model.totalHydrogen}개를 계속 추적합니다(분자에 든 원자 포함). 현재 금속 내부에 표시된 H는 ${model.stored}개입니다. 실제 저장량을 뜻하지 않습니다.`);viewport.dataset.hydrogenCount=String(model.parts.filter(p=>p.element==='H').length);viewport.dataset.insideHydrogen=String(model.stored);viewport.dataset.coordinate=M.coordinate(state).toFixed(3);viewport.dataset.moleculeBonds=String(model.parts.filter(p=>p.bondType==='H-H').length);}
  }
  function drawPlot(){
    if($('chartSection').hidden)return;
    const composition=state.chapter===4?state.composition:(model?model.stored/12:0),key=[state.temperature,composition,state.branch,state.hysteresis,state.pressure,$('pctChart').clientWidth].join('|');if(key===plotKey)return;plotKey=key;
    const chart=$('pctChart'),w=Math.max(260,chart.clientWidth||620),h=290,left=60,right=w-20,top=30,bottom=232,xx=x=>left+x*(right-left),yy=p=>bottom-(Math.log(Math.max(.0001,p))+3.2)/6.2*(bottom-top),frag=document.createDocumentFragment();chart.setAttribute('viewBox',`0 0 ${w} ${h}`);
    const words=(value,x,y,attrs={})=>{const e=svg('text',{x,y,fill:'#c8dfea','font-size':14,...attrs});e.textContent=value;frag.append(e);};
    frag.append(svg('rect',{x:xx(.22),y:top,width:xx(.78)-xx(.22),height:bottom-top,fill:'#bd9aff',opacity:.09}));
    for(const [value,label]of [[.2,'낮음'],[1,'기준'],[4,'높음']]){frag.append(svg('line',{x1:left,y1:yy(value),x2:right,y2:yy(value),stroke:'#2b485e','stroke-dasharray':'3 5'}));words(label,left-8,yy(value)+4,{'text-anchor':'end'});}
    frag.append(svg('path',{d:`M${left} ${top}V${bottom}H${right}`,fill:'none',stroke:'#7799b0','stroke-width':1.5}));
    for(const branch of ['absorption','desorption']){const points=Array.from({length:101},(_,i)=>[xx(i/100),yy(M.pct(i/100,state.temperature,branch,state.hysteresis))]);frag.append(svg('path',{id:'curve-'+branch,d:points.map((p,i)=>(i?'L':'M')+p.map(v=>v.toFixed(2)).join(' ')).join(' '),fill:'none',stroke:branch==='absorption'?'#82dfec':'#ffae69','stroke-width':branch===state.branch?3.2:2,'stroke-dasharray':branch===state.branch?'none':'6 4'}));}
    const pointY=M.pct(composition,state.temperature,state.branch,state.hysteresis);frag.append(svg('circle',{id:'compositionPoint',cx:xx(composition),cy:yy(pointY),r:5.5,fill:'#edf5ff',stroke:'#bd9aff','stroke-width':2}));
    if(state.chapter===3)frag.append(svg('line',{id:'supplyPressure',x1:left,y1:yy(state.pressure),x2:right,y2:yy(state.pressure),stroke:'#f5d77a','stroke-width':2,'stroke-dasharray':'6 5'}));
    words('α',xx(.1),top-10,{'text-anchor':'middle'});words('α + β · 두 상',xx(.5),top-10,{'text-anchor':'middle'});words('β',xx(.9),top-10,{'text-anchor':'middle'});words('수소 함량 · 상대 조성 (a.u.)',(left+right)/2,h-13,{'text-anchor':'middle'});words('0',left,bottom+20,{'text-anchor':'middle'});words('1',right,bottom+20,{'text-anchor':'middle'});words('상대 압력 · 로그 / a.u.',16,(top+bottom)/2,{transform:`rotate(-90 16 ${(top+bottom)/2})`,'text-anchor':'middle'});
    chart.replaceChildren(frag);text('chartCaption',state.chapter===3?'노란 점선은 공급 압력입니다. 온도를 바꾸면 두 개념 곡선의 기준이 이동합니다. 실제 반응 속도·흡수량을 예측하지 않습니다.':'조성 슬라이더는 두 상의 비율과 모식도를 읽는 지수입니다. 흡수·방출 경로의 간격은 실제 합금의 이력 폭이 아닙니다.');
  }
  function draw(){model=M.scene(state);if(state.chapter===4&&!state.compositionMode){state.composition=model.stored/12;if($('composition'))$('composition').value=state.composition;}if(renderer)drawThree();else drawFallback();drawLabels();syncReadout();drawPlot();dirty=false;}
  function fitLayout(){if(document.hidden)return;if((window.innerWidth||0)<=850){viewport.style.removeProperty('height');return;}const shell=viewport.closest('.stage-shell'),side=root.querySelector('.explanation-column'),a=shell.getBoundingClientRect().height,b=side.getBoundingClientRect().height,c=viewport.getBoundingClientRect().height;if(a&&b&&c){const target=Math.round(M.clamp(b-(a-c),300,720));if(Math.abs(target-c)>1)viewport.style.height=target+'px';}}
  function active(){return !document.hidden&&visible;}
  function invalidate(force=false){dirty=true;if(force===true)forcePaint=true;if(force===true&&!state.playing&&!tween&&!document.hidden){draw();forcePaint=false;return;}if(!document.hidden&&(visible||forcePaint)&&!raf)raf=requestAnimationFrame(frame);}
  function frame(now){
    raf=0;if(document.hidden||(!visible&&!forcePaint)){lastTime=0;return;}const dt=lastTime?Math.min((now-lastTime)/1000,.1):0;lastTime=now;
    if(visible&&state.playing){state=M.advance(state,dt);dirty=true;}
    if(visible&&tween){tween.elapsed+=dt;const t=M.smooth(tween.elapsed/.36);yaw=tween.from[0]+(tween.to[0]-tween.from[0])*t;pitch=tween.from[1]+(tween.to[1]-tween.from[1])*t;zoom=tween.from[2]+(tween.to[2]-tween.from[2])*t;dirty=true;if(tween.elapsed>=.36)tween=null;}
    if(dirty&&(!lastDraw||now-lastDraw>=1000/30||!state.playing)){draw();lastDraw=now;}forcePaint=false;if((state.playing||tween)&&active())raf=requestAnimationFrame(frame);else lastTime=0;
  }
  function view(action,instant=false){
    if(action==='in'||action==='out'){tween=null;zoom=M.clamp(zoom*(action==='in'?1.15:1/1.15),.65,1.9);invalidate(true);return;}
    const presets={home:[-.5,.35,1],front:[0,.1,1],side:[-1.05,.22,1.1],top:[-.35,.95,1]};const goal=presets[action];if(!goal)return;
    if(reduced||instant||Math.abs(yaw-goal[0])+Math.abs(pitch-goal[1])+Math.abs(zoom-goal[2])<.01){[yaw,pitch,zoom]=goal;tween=null;}else tween={from:[yaw,pitch,zoom],to:goal,elapsed:0};invalidate(true);
  }
  const range=(id,label,min,max,step,value)=>`<label class="range-field" for="${id}"><span>${label}<output id="${id}Value">${Number(value).toFixed(2)}</output></span><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${value}"></label>`;
  function controls(){let html='';const c=state.chapter;
    if(c===0)html='<h4>서로 다른 저장 상태</h4><p>기체 분자를 그대로 담는 방식과 원자 H를 금속 내부에 저장하는 방식을 비교하세요.</p><div class="choice-group">'+Object.entries(C.methods).map(([id,v])=>`<button type="button" data-method="${id}">${v.name}</button>`).join('')+'</div>';
    if(c===1)html='<h4>저장 위치를 비교해요</h4><div class="choice-group"><button type="button" data-focus="molecule">분자 상태 보기</button><button type="button" data-focus="lattice">금속 내부 보기</button></div><p>흰 선으로 연결된 H₂와, 간극에 있는 개별 H를 구분하세요. MOF의 분자 흡착과 다른 원리입니다.</p>';
    if(c===2)html='<h4>같은 원자를 따라갑니다</h4><p>5개 단계 버튼과 재생으로 흐름을 보세요. H 원자 12개는 분자·표면·내부를 오갈 뿐, 만들어지거나 없어지지 않습니다.</p>';
    if(c===3)html='<h4>평형 기준과 비교하기</h4>'+range('gasPressure','공급 압력 · 상대 지수',.2,4,.02,state.pressure)+range('gasTemperature','온도 · 상대 지수',.6,1.6,.02,state.temperature)+'<p id="driveStatus" class="drive-status" role="status" aria-live="polite"></p><p>숫자는 K·bar가 아닌 무차원 지수입니다. 조절하면 유리한 방향의 과정을 보여 줍니다. 반응 속도는 계산하지 않습니다.</p>';
    if(c===4)html='<h4>곡선과 두 상을 비교하기</h4>'+range('gasTemperature','온도 · 상대 지수',.6,1.6,.02,state.temperature)+range('composition','수소 함량 · 개념 지수',0,1,.01,state.composition)+'<div class="choice-group"><button type="button" data-branch="absorption">흡수 경로</button><button type="button" data-branch="desorption">방출 경로</button></div><label class="check-field"><input id="showHysteresis" type="checkbox"'+(state.hysteresis?' checked':'')+'> 이력 차이 보기</label><p>구간과 압력은 정성적인 가정입니다. 실제 조성이나 저장량의 계산값이 아닙니다.</p>';
    if(c===5)html='<h4>합금별 선택 기준</h4><div class="choice-group">'+Object.entries(C.alloys).map(([id,v])=>`<button type="button" data-alloy="${id}">${v.name}</button>`).join('')+'</div><h4 id="alloyFocus"></h4><p id="alloyDetail"></p><p>위 격자는 공통 원리를 위한 모형입니다. 선택한 합금의 실제 결정구조·성능을 재현하지 않습니다.</p>';
    if(c===6)html='<h4>어디에 쓰는 원리일까요?</h4><div class="choice-group">'+Object.entries(C.applications).map(([id,v])=>`<button type="button" data-application="${id}">${v.name}</button>`).join('')+'</div><p id="applicationDetail"></p><p>일반적인 연료전지차의 고압 기체 탱크를 모두 금속수소화물 탱크라고 설명하지 않습니다.</p>';
    if(c===7)html='<h4>반복 영향의 개념 비교</h4>'+range('damage','균열·미분화 표시',0,1,.05,state.damage)+'<label class="check-field"><input id="impurity" type="checkbox"'+(state.impurity?' checked':'')+'> 표면 자리 차단 보기</label><p>슬라이더는 실제 사이클 수·열화율이 아닙니다. 균열이 반응 면적을 늘릴 수도 있으나 분말·열전달 관리도 필요합니다.</p>';
    $('focusControls').innerHTML=html;
  }
  function selectChapter(index,initial=false){
    state={...state,chapter:M.clamp(index,0,7),step:C.chapters[M.clamp(index,0,7)].initial,method:Number(index)===0?'compressed':'hydride',phase:0,playing:false,response:null,coordinate:null,compositionMode:false};if(state.step===3)state.phase=1;if(state.chapter===4)state.compositionMode=true;
    const c=C.chapters[state.chapter];text('chapterPosition','4강 · '+(state.chapter+1)+' / 8');text('chapterCount',(state.chapter+1)+' / 8');text('chapterTitle',c.title);text('chapterKey',c.key);text('chapterAnalogy',c.analogy);text('analogyBoundary','비유의 범위 · '+c.boundary);$('chapterIntro').innerHTML=c.intro;text('chapterWhy',c.why);text('chapterSummary',c.summary);text('chapterBridge',c.bridge);$('chapterTheory').innerHTML=c.theory;$('theoryDetails').open=false;
    text('lectureScope','현재 주제의 강의 개요 범위: '+c.pages+'쪽. 원본 PDF 직접 대조 전이며, 과학적 보강은 아래 출처를 구분해 사용했습니다.');
    $('chartSection').hidden=![3,4].includes(state.chapter);$('comparisonSection').hidden=state.chapter!==6;$('previousChapter').disabled=state.chapter===0;$('nextChapter').disabled=state.chapter===7;
    for(const b of root.querySelectorAll('[data-chapter]')){if(Number(b.dataset.chapter)===state.chapter)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');}
    controls();plotKey='';lastTime=0;view('home',initial);syncReadout();fitLayout();invalidate(true);if(!initial)announce(c.title);
    const hash='#chapter-'+(state.chapter+1);if(!initial&&location.hash!==hash)history.replaceState(null,'',hash);
  }
  function chooseStep(step,method='hydride'){state={...state,method,step:M.clamp(step,0,4),phase:1,playing:false,response:null,coordinate:null,compositionMode:false};if(state.chapter===3){state.pressure=M.clamp(M.equilibrium(state.temperature)*(state.step===4?.45:1.8),.2,4);if($('gasPressure'))$('gasPressure').value=state.pressure;}lastTime=0;syncReadout();fitLayout();invalidate(true);announce(M.steps[state.step].name);}
  function togglePlay(){
    if(state.playing)state.playing=false;
    else if(state.response)state.playing=true;
    else if(state.chapter===3){const d=M.drive(state);if(d.direction==='equilibrium'){announce('평형 기준 부근입니다. 압력이나 온도를 바꾸어 방향을 비교하세요.');return;}const target=d.direction==='absorb'?4:0;if(Math.abs(M.coordinate(state)-target)<.01)state.coordinate=target===4?0:4;state=M.respond(state);}
    else{state.method='hydride';state.coordinate=null;state.response=null;state.compositionMode=false;if(state.phase>=1)state.phase=0;state.playing=true;}
    lastTime=0;syncReadout();invalidate(true);
  }
  root.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||!root.contains(b)||b.disabled)return;
    if(b.hasAttribute('data-play-toggle')){togglePlay();return;}
    if(b.dataset.chapter!==undefined){selectChapter(Number(b.dataset.chapter));return;}
    if(b.dataset.step!==undefined){chooseStep(Number(b.dataset.step));return;}
    if(b.dataset.view){view(b.dataset.view);return;}
    if(b.dataset.focus){chooseStep(b.dataset.focus==='lattice'?3:0);if(b.dataset.focus==='lattice')state.phase=1;invalidate(true);return;}
    if(b.dataset.alloy){state.alloy=b.dataset.alloy;syncReadout();invalidate(true);announce(C.alloys[state.alloy].name);return;}
    if(b.dataset.application){state.application=b.dataset.application;state.method='hydride';state.step=3;state.phase=1;state.coordinate=null;state.response=null;state.playing=false;syncReadout();invalidate(true);return;}
    if(b.dataset.method){chooseStep(b.dataset.method==='hydride'?3:0,b.dataset.method);return;}
    if(b.dataset.branch){state.branch=b.dataset.branch;plotKey='';syncReadout();invalidate(true);return;}
    if(b.id==='playScene')togglePlay();if(b.id==='previousStep')chooseStep(currentStep()-1);if(b.id==='nextStep')chooseStep(currentStep()+1);
    if(b.id==='previousChapter')selectChapter(state.chapter-1);if(b.id==='nextChapter')selectChapter(state.chapter+1);
    if(b.id==='resetScene'){const chapter=state.chapter;state=M.defaults();state.chapter=chapter;state.step=0;state.phase=0;state.playing=false;controls();$('showSites').checked=true;$('showInteractions').checked=true;$('showHeat').checked=true;$('playSpeed').value='1';view('home',true);syncReadout();plotKey='';invalidate(true);announce('현재 주제의 변수와 과정을 초기화했습니다.');}
  });
  root.addEventListener('input',e=>{const id=e.target.id,value=Number(e.target.value);
    if(id==='gasPressure')state.pressure=value;else if(id==='gasTemperature')state.temperature=value;else if(id==='composition'){state.composition=value;state.compositionMode=true;state.playing=false;state.coordinate=null;state.response=null;}else if(id==='damage')state.damage=value;
    else if(id==='sceneProgress'){const v=value/100*5;state.method='hydride';state.step=Math.min(4,Math.floor(v));state.phase=value===100?1:v-state.step;state.playing=false;state.coordinate=null;state.response=null;state.compositionMode=false;}
    else return;
    if(state.chapter===3&&(id==='gasPressure'||id==='gasTemperature')){state=M.respond(state);if(reduced&&state.response){state.coordinate=state.response.end;state.response=null;state.playing=false;}}
    lastTime=0;plotKey='';syncReadout();invalidate(true);
  });
  root.addEventListener('change',e=>{const el=e.target;if(el.id==='playSpeed')state.speed=Number(el.value);else if(el.id==='showSites')state.sites=el.checked;else if(el.id==='showInteractions')state.interactions=el.checked;else if(el.id==='showHeat')state.heat=el.checked;else if(el.id==='showHysteresis')state.hysteresis=el.checked;else if(el.id==='impurity')state.impurity=el.checked;else return;plotKey='';invalidate(true);});
  viewport.addEventListener('keydown',e=>{if(e.target!==viewport)return;if(e.key===' '){e.preventDefault();togglePlay();return;}const deltas={ArrowLeft:[-.15,0],ArrowRight:[.15,0],ArrowUp:[0,.12],ArrowDown:[0,-.12]};if(deltas[e.key]){e.preventDefault();tween=null;yaw+=deltas[e.key][0];pitch=M.clamp(pitch+deltas[e.key][1],-1.1,1.1);invalidate(true);}else if(['+','=','-','Home'].includes(e.key)){e.preventDefault();view(e.key==='Home'?'home':e.key==='-'?'out':'in',true);}});
  viewport.addEventListener('pointerdown',e=>{if(e.button!==undefined&&e.button!==0)return;tween=null;drag={x:e.clientX,y:e.clientY};viewport.setPointerCapture?.(e.pointerId);});
  viewport.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(e.pointerType==='touch'&&Math.abs(dy)>Math.abs(dx))return;yaw+=dx*.009;pitch=M.clamp(pitch+dy*.007,-1.1,1.1);drag={x:e.clientX,y:e.clientY};invalidate(true);});
  for(const name of ['pointerup','pointercancel','lostpointercapture'])viewport.addEventListener(name,()=>{drag=null;});
  viewport.addEventListener('wheel',e=>{if(e.ctrlKey)return;e.preventDefault();view(e.deltaY<0?'in':'out');},{passive:false});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();renderer=null;canvas.hidden=true;fallback.hidden=false;fallback.removeAttribute('hidden');$('renderMode').hidden=false;viewport.dataset.renderer='svg';invalidate(true);});
  function suspend(){if(raf){cancelAnimationFrame(raf);raf=0;}lastTime=0;}
  document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend();else invalidate(true);});
  if(window.IntersectionObserver)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)invalidate(true);else suspend();},{rootMargin:'80px'}).observe(viewport);
  if(window.ResizeObserver){new ResizeObserver(()=>{plotKey='';invalidate(true);}).observe(viewport);const ro=new ResizeObserver(fitLayout);for(const e of root.querySelectorAll('.explanation-column,.stage-top,.direct-controls,.legend'))ro.observe(e);}
  window.addEventListener('resize',()=>{fitLayout();plotKey='';invalidate(true);});
  const motion=e=>{reduced=e.matches;if(reduced){state.playing=false;tween=null;}text('motionNotice',reduced?'동작 줄이기 적용 · 단계와 슬라이더로 비교할 수 있습니다.':'');syncReadout();invalidate(true);};media?.addEventListener?.('change',motion);
  window.addEventListener('pagehide',()=>{suspend();state.playing=false;tween=null;});window.addEventListener('pageshow',()=>{lastTime=0;syncReadout();invalidate(true);});
  window.addEventListener('hashchange',()=>{const n=location.hash.match(/^#chapter-([1-8])$/);if(n&&Number(n[1])-1!==state.chapter)selectChapter(Number(n[1])-1,true);});
  $('chapterNav').innerHTML=C.chapters.map((c,i)=>`<button type="button" data-chapter="${i}">${i+1}. ${c.short}</button>`).join('');
  $('stepNav').innerHTML=M.steps.map((s,i)=>`<button type="button" data-step="${i}">${s.short}</button>`).join('');
  $('methodCards').innerHTML=Object.entries(C.methods).map(([id,m])=>`<article class="method-card" data-method-card="${id}"><button type="button" data-method="${id}">${m.name}</button><p>${m.benefit}</p><p><strong>함께 볼 점</strong> · ${m.limit}</p></article>`).join('');
  $('referenceList').innerHTML=C.sources.map(s=>`<li><a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.label}</a><br>${s.scope}</li>`).join('');
  activateRenderer();const initial=location.hash.match(/^#chapter-([1-8])$/);selectChapter(initial?Number(initial[1])-1:0,true);motion({matches:reduced});
})();
