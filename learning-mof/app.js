(function () {
  'use strict';
  const root=document.getElementById('mofLearning');
  const M=window.MOFModel;
  if(!root||!M||root.dataset.initialized==='true')return;
  root.dataset.initialized='true';
  const $=id=>root.querySelector('#'+id);
  let state=M.defaults();
  const media=window.matchMedia?window.matchMedia('(prefers-reduced-motion: reduce)'):null;
  let reduced=!!media?.matches,visible=true,raf=0,lastTime=0,lastDraw=0,dirty=true,drawing=false;
  let yaw=-.55,pitch=.35,zoom=1,drag=null,renderer=null,threeScene=null,camera=null;
  let sceneObjects=new Map(),labelObjects=new Map(),placedLabels=[];
  const shared={};
  const viewport=$('viewport'),canvas=$('mofCanvas'),fallback=$('fallbackScene');
  const status=text=>{$('labStatus').textContent=text;};
  function active(){return !document.hidden&&visible;}
  function invalidate(){dirty=true;if(active()&&!raf&&!drawing)raf=requestAnimationFrame(frame);}
  function baseScale(){
    const aspect=Math.max(.7,(viewport.clientWidth||800)/(viewport.clientHeight||460));
    if(state.chapter===5)return Math.max(6.6,6.8/aspect);
    if(state.chapter===3&&state.compare)return Math.max(3.6,8/aspect);
    if(state.chapter===1)return Math.max(2.3,3.1/aspect);
    if(state.chapter===2)return state.step>=4?4.6:3.4;
    return Math.max(3.6,4/aspect);
  }
  function projection(p){
    const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
    const x=p[0]*cy+p[2]*sy,z=-p[0]*sy+p[2]*cy,y=p[1]*cp-z*sp;
    const factor=530/(baseScale()*2)*zoom;
    return [400+x*factor,265-y*factor,p[1]*sp+z*cp];
  }
  function setMaterials(){
    const T=window.THREE;
    shared.sphere=new T.SphereGeometry(1,12,8);shared.cylinder=new T.CylinderGeometry(1,1,1,7);shared.box=new T.BoxGeometry(1,1,1);
    shared.materials=new Map();shared.axis=new T.Vector3(0,1,0);shared.v1=new T.Vector3();shared.v2=new T.Vector3();shared.delta=new T.Vector3();
  }
  function material(p){
    const key=p.color+':'+p.opacity;
    if(!shared.materials.has(key))shared.materials.set(key,new window.THREE.MeshBasicMaterial({color:p.color,transparent:p.opacity<1,opacity:p.opacity,depthWrite:p.opacity>=1}));
    return shared.materials.get(key);
  }
  function initRenderer(){
    try{
      if(!window.THREE)throw new Error('Three.js unavailable');
      const T=window.THREE;
      renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'low-power'});
      renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
      threeScene=new T.Scene();camera=new T.OrthographicCamera(-6,6,6,-6,.1,100);setMaterials();
    }catch(_){renderer=null;canvas.hidden=true;fallback.hidden=false;$('renderMode').hidden=false;}
  }
  function drawThree(model){
    const T=window.THREE,w=Math.max(1,viewport.clientWidth||800),h=Math.max(1,viewport.clientHeight||460),scale=baseScale()/zoom;
    const aspect=w/h;camera.left=-scale*aspect;camera.right=scale*aspect;camera.top=scale;camera.bottom=-scale;camera.updateProjectionMatrix();
    camera.position.set(20*Math.cos(pitch)*Math.sin(-yaw),20*Math.sin(pitch),20*Math.cos(pitch)*Math.cos(yaw));camera.lookAt(0,0,0);
    if(canvas.width!==Math.round(w*renderer.getPixelRatio())||canvas.height!==Math.round(h*renderer.getPixelRatio()))renderer.setSize(w,h,false);
    const seen=new Set();
    for(const p of model.parts){
      seen.add(p.id);let object=sceneObjects.get(p.id);
      if(object&&object.userData.kind!==p.kind){threeScene.remove(object);sceneObjects.delete(p.id);object=null;}
      if(!object){object=new T.Mesh(p.kind==='sphere'?shared.sphere:p.kind==='bar'?shared.cylinder:shared.box,material(p));object.userData.kind=p.kind;sceneObjects.set(p.id,object);threeScene.add(object);}
      object.material=material(p);object.visible=true;
      if(p.kind==='bar'){
        shared.v1.fromArray(p.a);shared.v2.fromArray(p.b);shared.delta.subVectors(shared.v2,shared.v1);const length=shared.delta.length();
        object.position.copy(shared.v1).add(shared.v2).multiplyScalar(.5);object.scale.set(p.r,length,p.r);object.quaternion.setFromUnitVectors(shared.axis,shared.delta.normalize());
      }else{object.position.fromArray(p.p);if(p.kind==='sphere')object.scale.setScalar(p.r);else object.scale.fromArray(p.size);}
    }
    // Remove inactive meshes; geometries and material variants are shared for this page's lifetime.
    for(const [id,obj] of sceneObjects)if(!seen.has(id)){threeScene.remove(obj);sceneObjects.delete(id);}
    renderer.render(threeScene,camera);
    for(const l of model.labels){const v=new T.Vector3(...l.p).project(camera);placeLabel(l,(v.x+1)*w/2,(1-v.y)*h/2,v.z>=-1&&v.z<=1);}
  }
  function placeLabel(l,x,y,show=true){
    let el=labelObjects.get(l.id);
    if(!el){el=document.createElement('span');el.className='object-label';$('objectLabels').appendChild(el);labelObjects.set(l.id,el);}
    if(el.textContent!==l.text)el.textContent=l.text;
    el.hidden=!show||!$('showLabels').checked;
    const w=viewport.clientWidth||800,h=viewport.clientHeight||460;
    const width=el.offsetWidth||Math.min(256,w-16,l.text.length*13+16);
    const height=el.offsetHeight||Math.max(28,Math.ceil((l.text.length*13+16)/width)*24);
    x=M.clamp(x,width/2+8,w-width/2-8);y=M.clamp(y,height/2+8,h-height/2-8);
    for(let i=0;i<12;i++){
      const overlap=placedLabels.find(p=>Math.abs(p.x-x)<(p.width+width)/2+6&&Math.abs(p.y-y)<(p.height+height)/2+6);
      if(!overlap)break;
      const down=overlap.y+(overlap.height+height)/2+8;
      y=M.clamp(down+height/2<h-8?down:overlap.y-(overlap.height+height)/2-8,height/2+8,h-height/2-8);
    }
    placedLabels.push({x,y,width,height});el.style.left=x+'px';el.style.top=y+'px';
  }
  function svgEl(name,attrs){const el=document.createElementNS('http://www.w3.org/2000/svg',name);for(const [k,v]of Object.entries(attrs))el.setAttribute(k,String(v));return el;}
  function drawFallback(model){
    const frag=document.createDocumentFragment(),factor=530/(baseScale()*2)*zoom;
    const sorted=model.parts.map(p=>({p,z:projection(p.kind==='bar'?p.a:p.p)[2]})).sort((a,b)=>a.z-b.z);
    for(const {p}of sorted){
      const attrs={fill:p.color,opacity:p.opacity};
      if(p.kind==='sphere'){const [x,y]=projection(p.p);frag.append(svgEl('circle',{...attrs,cx:x,cy:y,r:p.r*factor}));}
      else if(p.kind==='bar'){const a=projection(p.a),b=projection(p.b);frag.append(svgEl('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke:p.color,'stroke-width':Math.max(1.2,p.r*2*factor),'stroke-linecap':'round',opacity:p.opacity}));}
      else{
        const corners=[];for(let x=0;x<2;x++)for(let y=0;y<2;y++)for(let z=0;z<2;z++)corners.push(projection(p.p.map((v,i)=>v+([x,y,z][i]-.5)*p.size[i])));
        for(const indices of [[0,1,3,2],[0,1,5,4],[4,5,7,6],[2,3,7,6],[0,2,6,4],[1,3,7,5]])frag.append(svgEl('polygon',{...attrs,points:indices.map(i=>corners[i].slice(0,2).join(',')).join(' '),stroke:p.color,'stroke-width':1}));
      }
    }
    fallback.replaceChildren(frag);
    // SVG preserves its 800×530 aspect ratio; match the labels to its letterboxed content.
    const w=viewport.clientWidth||800,h=viewport.clientHeight||460,k=Math.min(w/800,h/530),dx=(w-800*k)/2,dy=(h-530*k)/2;
    for(const l of model.labels){const p=projection(l.p);placeLabel(l,dx+p[0]*k,dy+p[1]*k);}
  }
  function render(){
    const model=M.scene(state,state.phase);$('modelName').textContent=model.name;placedLabels=[];
    const colorSet=new Set(model.parts.map(p=>p.color)),legendColors={node:M.colors.blue,linker:M.colors.green,pore:M.colors.yellow,second:M.colors.purple,gas:M.colors.orange};
    for(const li of root.querySelectorAll('[data-legend]'))li.hidden=!colorSet.has(legendColors[li.dataset.legend]);
    const ids=new Set(model.labels.map(l=>l.id));for(const [id,el]of labelObjects)if(!ids.has(id)){el.remove();labelObjects.delete(id);}
    if(renderer)drawThree(model);else drawFallback(model);
  }
  function frame(now){
    raf=0;if(!active()){lastTime=0;return;}
    drawing=true;
    const dt=lastTime?Math.min((now-lastTime)/1000,.1):0;lastTime=now;
    if(state.playing){state.phase+=dt*state.speed/4.5;if(state.phase>=1){if(state.step<M.chapters[state.chapter].scenes.length-1){state.phase=0;state.step++;updateScene();}else{state.phase=1;state.playing=false;updateScene();status('이 단계의 애니메이션이 끝났습니다.');}}const count=M.chapters[state.chapter].scenes.length,p=Math.round((state.step+state.phase)/count*100);$('sceneProgress').value=p;$('progressValue').textContent=p+'%';dirty=true;}
    if(dirty&&(!state.playing||!lastDraw||now-lastDraw>=1000/30)){render();dirty=false;lastDraw=now;}drawing=false;
    if(state.playing)raf=requestAnimationFrame(frame);else lastTime=0;
  }
  function result(label,value,note='',compact=false){return `<div class="result"><small>${label}</small><b${compact?' class="compact"':''}>${value}</b><span>${note}</span></div>`;}
  function range(id,label,min,max,step,value,note=''){return `<label class="field" for="${id}"><span class="field-title">${label}<output id="${id}Value"></output></span><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}"></label>${note?'<p class="control-note">'+note+'</p>':''}`;}
  function controls(){
    const c=state.chapter;let html='';
    $('interactionCard').hidden=c<3;
    if(c===3)html='<div class="choice-group" role="group" aria-label="링커의 벤젠 고리 수">'+M.families.map(f=>`<button type="button" data-rings="${f.rings}" aria-pressed="${state.rings===f.rings}">고리 ${f.rings}개</button>`).join('')+'</div><details class="extra-options"><summary>세 구조 비교하기</summary><label class="check-field"><input id="compareStructures" type="checkbox"'+(state.compare?' checked':'')+'> 같은 배율로 나란히 보기</label><div class="comparison-table">'+M.families.map(f=>`<div><strong>${f.name.replace(' · MOF-5','')}</strong><span>${f.linker}</span><small>고리 ${f.rings}개 · Zn₄O</small></div>`).join('')+'</div></details>';
    if(c===4)html=range('lengthRatio','마디 사이 거리',1,1.8,.01,state.ratio);
    if(c===5)html='<label class="check-field"><input id="interpenetration" type="checkbox"'+(state.interpenetrate?' checked':'')+'> 보라색 두 번째 골격 보기</label>';
    if(c===6)html='<label class="check-field"><input id="internalSurface" type="checkbox"'+(state.internal?' checked':'')+'> 내부 표면 강조</label><div class="court-analogy" aria-label="농구장 약 7개의 면적 비유">'+Array.from({length:7},()=>'<i class="court" aria-hidden="true"></i>').join('')+'</div>';
    if(c===7)html=range('gasPressure','압력 높이기',0,5,.1,state.pressure)+'<details class="extra-options" id="gasOptions"><summary>온도·분자 크기도 바꿔 보기</summary>'+range('gasTemperature','온도 지수',.6,1.8,.05,state.temperature)+range('gasSize','분자 크기 / 입구 폭',.2,1.4,.05,state.size)+'<div class="choice-group" role="group" aria-label="가상 단일 기체의 친화력 선택"><button type="button" data-species="A" aria-pressed="'+(state.species==='A')+'">기체 A · 잘 붙음</button><button type="button" data-species="B" aria-pressed="'+(state.species==='B')+'">기체 B · 덜 붙음</button></div><p class="control-note">같은 조건에서 각각 따로 넣은 가상 기체를 비교합니다. 압력·온도는 물리 단위가 없는 모형값입니다.</p><p id="gasAdvancedResults" class="control-note"></p></details>';
    if(c===8)html='<div class="application-options" role="group" aria-label="MOF 활용 분야">'+M.applications.map((a,i)=>`<button type="button" data-application="${i}" aria-pressed="${state.application===i}">${a.name}</button>`).join('')+'</div><p id="applicationWhy" class="control-note"></p>';
    $('chapterControls').innerHTML=html;results();
  }
  function results(){
    const c=state.chapter;let html='';
    if(c===3){const f=M.family(state.rings);html=result('선택한 구조',f.name,f.linker+' · 고리 '+f.rings+'개',true);}
    if(c===4){const v=M.volume(state.ratio);$('lengthRatioValue').textContent=v.length.toFixed(2)+'배';html=result('길이비',v.length.toFixed(2)+'배','L₂/L₁')+result('기하 공간 부피비',v.volume.toFixed(3)+'배','길이비 × 길이비 × 길이비');}
    if(c===5)html=result('현재 연결망',state.interpenetrate?'2개 · IRMOF-15':'1개 · IRMOF-16',state.interpenetrate?'서로 직접 결합하지 않은 두 골격':'TPDC 링커의 골격 하나',true);
    if(c===6)html=result('MOF-5 1 g의 표면적','농구장 약 7개','문헌의 Langmuir 추정값: 약 2,900 m²/g',true);
    if(c===7){
      const a=M.adsorption(state),b=M.adsorption({...state,species:state.species==='A'?'B':'A'});
      $('gasPressureValue').textContent=Number(state.pressure).toFixed(1);$('gasTemperatureValue').textContent=Number(state.temperature).toFixed(2);$('gasSizeValue').textContent=Number(state.size).toFixed(2);
      html=result('모형의 표면 점유율',(a.coverage*100).toFixed(1)+'%','기체 '+state.species+' · 가상 모형값')+result('입구 통과',a.accessible?'가능':'제한','분자 크기와 입구 폭 비교',true);
      $('gasAdvancedResults').textContent='다른 기체를 단독으로 넣었을 때: '+(b.coverage*100).toFixed(1)+'%. 혼합 기체의 선택도를 뜻하지 않습니다.';
    }
    if(c===8)$('applicationWhy').textContent=M.applications[state.application].why;
    $('liveResults').innerHTML=html;$('liveResults').hidden=!html;
  }
  function updateScene(announce=false){
    const scenes=M.chapters[state.chapter].scenes,entry=scenes[state.step];
    $('sceneCount').textContent=`장면 ${state.step+1} / ${scenes.length}`;$('sceneTitle').textContent=entry[0];$('sceneWhy').textContent=entry[1];$('sceneReason').textContent=M.chapters[state.chapter].reasons[state.step];
    $('previousScene').disabled=state.step===0;$('nextScene').disabled=state.step===scenes.length-1;
    $('playScene').textContent=state.playing?'일시정지':'과정 재생';$('playScene').setAttribute('aria-pressed',String(state.playing));
    const p=Math.round((state.step+state.phase)/scenes.length*100);$('sceneProgress').value=p;$('progressValue').textContent=p+'%';
    if(announce)status(`장면 ${state.step+1}. ${entry[0]}. ${entry[1]}`);invalidate();
  }
  function selectChapter(index,announce=true){
    state.chapter=M.clamp(index,0,M.chapters.length-1);state.step=0;state.phase=0;state.playing=false;lastTime=0;
    const c=M.chapters[state.chapter];
    $('chapterKicker').textContent=`STEP ${String(state.chapter+1).padStart(2,'0')} / 09`;$('chapterTitle').textContent=c.title;$('chapterKey').textContent=c.key;
    $('chapterExplanation').innerHTML=c.explanation;$('tryHint').textContent=c.guide;$('chapterNote').textContent=c.note;$('chapterNote').hidden=!c.note;$('chapterTheory').innerHTML=c.theory;$('chapterCaution').textContent=c.caution;$('theoryDetails').open=false;
    for(const b of $('chapterNav').querySelectorAll('button')){if(Number(b.dataset.chapter)===state.chapter)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');}
    $('previousChapter').disabled=state.chapter===0;$('nextChapter').disabled=state.chapter===8;$('chapterPosition').textContent=`학습 단계 ${state.chapter+1} / 9`;
    controls();updateScene();
    if(announce)status(`${state.chapter+1}단계. ${c.title}. ${c.key}`);
  }
  function changeStep(delta){state.step=M.clamp(state.step+delta,0,M.chapters[state.chapter].scenes.length-1);state.phase=1;state.playing=false;updateScene(true);}
  function view(action){
    if(action==='left')yaw-=.18;if(action==='right')yaw+=.18;if(action==='up')pitch=M.clamp(pitch+.15,-1.1,1.1);
    if(action==='in')zoom=M.clamp(zoom*1.15,.6,2.1);if(action==='out')zoom=M.clamp(zoom/1.15,.6,2.1);
    if(action==='home'){yaw=-.55;pitch=.35;zoom=1;}invalidate();
  }
  function inputEvent(e){
    const el=e.target,id=el.id;
    if(id==='lengthRatio')state.ratio=Number(el.value);
    else if(id==='gasPressure')state.pressure=Number(el.value);
    else if(id==='gasTemperature')state.temperature=Number(el.value);
    else if(id==='gasSize')state.size=Number(el.value);
    else if(id==='sceneProgress'){
      const n=M.chapters[state.chapter].scenes.length,v=Number(el.value)/100*n;
      state.step=Math.min(n-1,Math.floor(v));state.phase=Number(el.value)===100?1:v-state.step;state.playing=false;updateScene(true);return;
    }else if(id==='playSpeed'){state.speed=Number(el.value);return;}
    else return;
    if(state.chapter===7&&!state.playing){state.step=1;state.phase=1;updateScene();}
    results();invalidate();
  }
  root.addEventListener('input',inputEvent);
  root.addEventListener('change',e=>{
    const el=e.target;
    if(el.id==='compareStructures')state.compare=el.checked;
    else if(el.id==='interpenetration'){state.interpenetrate=el.checked;if(el.checked){state.step=1;state.phase=0;state.playing=!reduced;updateScene();}}
    else if(el.id==='internalSurface'){state.internal=el.checked;if(el.checked&&state.step===0){state.step=1;state.phase=1;updateScene();}}
    else if(el.id==='showLabels'){invalidate();return;}else return;
    results();invalidate();status('구조와 결과를 갱신했습니다.');
  });
  root.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b||!root.contains(b)||b.disabled)return;
    if(b.dataset.chapter!==undefined){selectChapter(Number(b.dataset.chapter));return;}
    if(b.dataset.view){view(b.dataset.view);return;}
    if(b.dataset.rings){state.rings=Number(b.dataset.rings);const wasOpen=$('chapterControls').querySelector('details')?.open;controls();$('chapterControls').querySelector('details').open=!!wasOpen;invalidate();status(M.family(state.rings).name+' 구조를 선택했습니다.');return;}
    if(b.dataset.species){state.species=b.dataset.species;controls();$('gasOptions').open=true;invalidate();status('기체 '+state.species+'의 단일 성분 점유율을 표시합니다.');return;}
    if(b.dataset.application!==undefined){state.application=Number(b.dataset.application);controls();invalidate();return;}
    if(b.id==='previousScene')changeStep(-1);
    if(b.id==='nextScene')changeStep(1);
    if(b.id==='previousChapter')selectChapter(state.chapter-1);
    if(b.id==='nextChapter')selectChapter(state.chapter+1);
    if(b.id==='resetScene'){
      const chapter=state.chapter,speed=state.speed;state=M.defaults(chapter);state.speed=speed;view('home');selectChapter(chapter,false);status('현재 단계의 변수와 시점을 처음 상태로 되돌렸습니다.');
    }
    if(b.id==='playScene'){
      if(!state.playing&&state.step===M.chapters[state.chapter].scenes.length-1&&state.phase>=1){state.step=0;state.phase=0;}
      if(!state.playing&&state.phase>=1)state.phase=0;
      state.playing=!state.playing;lastTime=0;updateScene();status(state.playing?'애니메이션 재생':'애니메이션 일시정지');
    }
  });
  viewport.addEventListener('keydown',e=>{
    const map={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down','+':'in','=':'in','-':'out',Home:'home'};
    if(e.target!==viewport)return;
    if(e.key===' '){e.preventDefault();$('playScene').click();return;}
    if(map[e.key]){e.preventDefault();if(e.key==='ArrowDown'){pitch=M.clamp(pitch-.15,-1.1,1.1);invalidate();}else view(map[e.key]);}
  });
  viewport.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={x:e.clientX,y:e.clientY,id:e.pointerId};viewport.setPointerCapture?.(e.pointerId);});
  viewport.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;yaw+=(e.clientX-drag.x)*.008;pitch=M.clamp(pitch+(e.clientY-drag.y)*.006,-1.1,1.1);drag.x=e.clientX;drag.y=e.clientY;invalidate();});
  const stopDrag=()=>{drag=null;};viewport.addEventListener('pointerup',stopDrag);viewport.addEventListener('pointercancel',stopDrag);viewport.addEventListener('lostpointercapture',stopDrag);
  viewport.addEventListener('wheel',e=>{if(e.ctrlKey)return;e.preventDefault();view(e.deltaY<0?'in':'out');},{passive:false});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();if(renderer){renderer=null;canvas.hidden=true;fallback.hidden=false;$('renderMode').hidden=false;invalidate();}});
  function suspend(){if(raf){cancelAnimationFrame(raf);raf=0;}lastTime=0;}
  document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend();else invalidate();});
  if(window.IntersectionObserver)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)invalidate();else suspend();},{rootMargin:'120px'}).observe($('mofLab'));
  if(window.ResizeObserver)new ResizeObserver(invalidate).observe(viewport);else window.addEventListener('resize',invalidate);
  const motionChange=e=>{reduced=e.matches;if(reduced){state.playing=false;updateScene();}$('motionNotice').textContent=reduced?'동작 줄이기 설정 적용 · 수동 조작 가능':'';};
  media?.addEventListener?.('change',motionChange);motionChange({matches:reduced});
  window.addEventListener('pagehide',()=>{suspend();state.playing=false;});
  window.addEventListener('pageshow',()=>{lastTime=0;updateScene();});
  $('chapterNav').innerHTML=M.chapters.map((c,i)=>`<button type="button" data-chapter="${i}"><span class="step-number">STEP ${String(i+1).padStart(2,'0')}</span>${c.short}</button>`).join('');
  initRenderer();selectChapter(0,false);
})();
