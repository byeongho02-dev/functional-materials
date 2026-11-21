(function () {
  'use strict';
  const root=document.getElementById('mofLearning');
  const M=window.MOFModel;
  const L=window.MOFLearning;
  if(!root||!M||root.dataset.initialized==='true')return;
  root.dataset.initialized='true';
  const $=id=>root.querySelector('#'+id);
  let state={...M.defaults(),representation:"atoms",showPores:true,polyhedra:true,hydrogen:false,focus:"framework",explode:0};
  const coreOrder=[0,2,1],advancedOrder=[3,4,5,6,7,8];
  let currentModel=null;
  const media=window.matchMedia?window.matchMedia('(prefers-reduced-motion: reduce)'):null;
  let reduced=!!media?.matches,visible=true,raf=0,lastTime=0,lastDraw=0,dirty=true,drawing=false,forcePaint=false;
  let yaw=-.55,pitch=.35,zoom=1,drag=null,renderer=null,threeScene=null,camera=null;
  let sceneObjects=new Map(),labelObjects=new Map(),placedLabels=[];
  const shared={};
  const viewport=$('viewport'),canvas=$('mofCanvas'),fallback=$('fallbackScene');
  const status=text=>{$('labStatus').textContent=text;};
  function active(){return !document.hidden&&visible;}
  function invalidate(force=false){
    dirty=true;if(force===true)forcePaint=true;
    // A deliberate paused-view change paints once, even after a viewport observer transition.
    if(force===true&&!state.playing&&!drawing&&!document.hidden){
      if(raf){cancelAnimationFrame(raf);raf=0;}drawing=true;
      try{render();dirty=false;forcePaint=false;}finally{drawing=false;}
      return;
    }
    if(!document.hidden&&(visible||forcePaint)&&!raf&&!drawing)raf=requestAnimationFrame(frame);
  }
  function baseScale(){
    const aspect=Math.max(.7,(viewport.clientWidth||800)/(viewport.clientHeight||460));
    if(currentModel?.atomic){
      const [x,y,z]=currentModel.extent,cy=Math.abs(Math.cos(yaw)),sy=Math.abs(Math.sin(yaw));
      const width=x*cy+z*sy,height=y*Math.abs(Math.cos(pitch))+(x*sy+z*cy)*Math.abs(Math.sin(pitch));
      return Math.max(1.1,height*1.1,width*1.1/aspect);
    }
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
    shared.sphere=new T.SphereGeometry(1,24,16);
    shared.bar=new T.CylinderGeometry(1,1,1,12);
    shared.cloud=new T.SphereGeometry(1,20,12);
    shared.tetrahedron=new T.TetrahedronGeometry(1);
    shared.box=new T.BoxGeometry(1,1,1);
    shared.materials=new Map();shared.axis=new T.Vector3(0,1,0);shared.v1=new T.Vector3();shared.v2=new T.Vector3();shared.delta=new T.Vector3();shared.transform=new T.Object3D();shared.raycaster=new T.Raycaster();shared.pointer=new T.Vector2();
  }
  function material(p){
    const key=[p.color,p.opacity,!!p.glow,p.kind==='cloud'].join(':');
    if(!shared.materials.has(key)){
      const T=window.THREE,transparent=p.opacity<1;
      const mat=p.kind==='cloud'||p.glow?new T.MeshBasicMaterial({color:p.color,transparent,opacity:p.opacity,depthWrite:!transparent}):new T.MeshStandardMaterial({color:p.color,metalness:p.atom==='Zn'?.22:.06,roughness:.28,emissive:p.color,emissiveIntensity:.035,transparent,opacity:p.opacity,depthWrite:!transparent});
      shared.materials.set(key,mat);
    }
    return shared.materials.get(key);
  }
  function initRenderer(){
    try{
      if(!window.THREE)throw new Error('Three.js unavailable');
      const T=window.THREE;
      renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'default'});
      renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
      renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
      threeScene=new T.Scene();camera=new T.OrthographicCamera(-6,6,6,-6,.1,100);setMaterials();
      const ambient=new T.HemisphereLight('#d3edff','#14223b',2.1);threeScene.add(ambient);
      for(const [color,intensity,pos]of [['#ffffff',3.2,[5,7,5]],['#75cdff',1.4,[-6,1,3]],['#c6a3ff',2,[-2,4,-6]]]){const light=new T.DirectionalLight(color,intensity);light.position.fromArray(pos);threeScene.add(light);}
      viewport.dataset.renderer='webgl';
    }catch(_){renderer=null;canvas.hidden=true;fallback.hidden=false;fallback.removeAttribute('hidden');$('renderMode').hidden=false;viewport.dataset.renderer='svg';}
  }
  function drawThree(model){
    const T=window.THREE,w=Math.max(1,viewport.clientWidth||800),h=Math.max(1,viewport.clientHeight||460),scale=baseScale()/zoom;
    const aspect=w/h;camera.left=-scale*aspect;camera.right=scale*aspect;camera.top=scale;camera.bottom=-scale;camera.updateProjectionMatrix();
    camera.position.set(20*Math.cos(pitch)*Math.sin(-yaw),20*Math.sin(pitch),20*Math.cos(pitch)*Math.cos(yaw));camera.lookAt(0,0,0);
    if(canvas.width!==Math.round(w*renderer.getPixelRatio())||canvas.height!==Math.round(h*renderer.getPixelRatio()))renderer.setSize(w,h,false);
    const groups=new Map();
    for(const p of model.parts){const key=[p.kind,p.color,p.opacity,!!p.glow].join(':');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(p);}
    for(const obj of sceneObjects.values())obj.visible=false;
    for(const [key,items]of groups){
      let mesh=sceneObjects.get(key);
      if(!mesh||mesh.instanceMatrix.count<items.length){
        if(mesh){threeScene.remove(mesh);mesh.dispose?.();}
        const count=2**Math.ceil(Math.log2(Math.max(1,items.length)));
        mesh=new T.InstancedMesh(shared[items[0].kind],material(items[0]),count);mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.frustumCulled=false;sceneObjects.set(key,mesh);threeScene.add(mesh);
      }
      mesh.visible=true;mesh.count=items.length;mesh.userData.parts=items;
      for(let i=0;i<items.length;i++){
        const p=items[i],o=shared.transform;o.quaternion.identity();
        if(p.kind==='bar'){
          shared.v1.fromArray(p.a);shared.v2.fromArray(p.b);shared.delta.subVectors(shared.v2,shared.v1);const length=shared.delta.length();
          o.position.copy(shared.v1).add(shared.v2).multiplyScalar(.5);o.scale.set(p.r,length,p.r);o.quaternion.setFromUnitVectors(shared.axis,shared.delta.normalize());
        }else{o.position.fromArray(p.p);if(p.size)o.scale.fromArray(p.size);else o.scale.setScalar(p.r);if(p.rotation)o.rotation.set(...p.rotation);}
        o.updateMatrix();mesh.setMatrixAt(i,o.matrix);
      }
      mesh.instanceMatrix.needsUpdate=true;mesh.boundingSphere=null;mesh.boundingBox=null;
    }
    renderer.render(threeScene,camera);viewport.dataset.drawCalls=String(renderer.info?.render?.calls||0);
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
    const defs=svgEl('defs',{}),tone=(hex,k)=>'#'+[1,3,5].map(i=>Math.min(255,Math.round(parseInt(hex.slice(i,i+2),16)*k)).toString(16).padStart(2,'0')).join('');
    for(const color of new Set(model.parts.filter(p=>p.kind==='sphere').map(p=>p.color))){const gradient=svgEl('radialGradient',{id:'mof-light-'+color.slice(1),cx:'32%',cy:'25%',r:'75%'});gradient.append(svgEl('stop',{offset:0,'stop-color':tone(color,1.4)}),svgEl('stop',{offset:.35,'stop-color':color}),svgEl('stop',{offset:1,'stop-color':tone(color,.45)}));defs.append(gradient);}frag.append(defs);
    const sorted=model.parts.map(p=>({p,z:projection(p.kind==='bar'?p.a:p.p)[2]})).sort((a,b)=>a.z-b.z);
    for(const {p}of sorted){
      const attrs={fill:p.color,opacity:p.opacity};
      if(p.kind==='sphere'){const [x,y]=projection(p.p);frag.append(svgEl('circle',{...attrs,fill:'url(#mof-light-'+p.color.slice(1)+')',cx:x,cy:y,r:p.r*factor,stroke:p.color,'stroke-width':.5}));}
      else if(p.kind==='cloud'){const [x,y]=projection(p.p);frag.append(svgEl('ellipse',{...attrs,cx:x,cy:y,rx:p.size[0]*factor,ry:p.size[1]*factor}));}
      else if(p.kind==='tetrahedron'){const vs=[[1,1,1],[1,-1,-1],[-1,1,-1],[-1,-1,1]].map(v=>projection(p.p.map((x,j)=>x+v[j]*p.r*(p.orientation||1)/Math.sqrt(3))));for(const ids of [[0,1,2],[0,2,3],[0,3,1],[1,2,3]])frag.append(svgEl('polygon',{...attrs,points:ids.map(i=>vs[i].slice(0,2).join(',')).join(' ')}));}
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
    const model=state.chapter<3&&window.MOFMolecular?window.MOFMolecular.scene(state,state.phase):M.scene(state,state.phase);currentModel=model;$('modelName').textContent=model.name;placedLabels=[];
    $('componentReadout').textContent=model.readout||'조작한 변수에 따라 골격과 기공의 변화를 비교하세요.';viewport.dataset.atomCount=String(model.parts.filter(p=>p.atom).length);
    $('molecularControls').hidden=state.chapter>=3||state.chapter===1;$('componentChoices').hidden=state.chapter===1;
    $('molecularOptions').hidden=state.chapter>=3;$('explodeModel').closest('label').hidden=state.chapter===1||state.chapter===2&&state.step<3;
    for(const b of root.querySelectorAll('[data-focus]'))b.setAttribute('aria-pressed',String(state.focus===b.dataset.focus));
    for(const b of root.querySelectorAll('[data-representation]'))b.setAttribute('aria-pressed',String(state.representation===b.dataset.representation));
    const atomicColors=window.MOFMolecular?.colors;
    const colorSet=new Set(model.parts.map(p=>p.color)),legendColors={node:model.atomic?atomicColors.Zn:M.colors.blue,linker:model.atomic?atomicColors.C:M.colors.green,pore:M.colors.yellow,second:M.colors.purple,gas:M.colors.orange,oxygen:atomicColors?.O,hydrogen:atomicColors?.H};
    const isAtoms=model.atomic&&model.parts.some(p=>p.atom);
    root.querySelector('[data-legend="node"]').lastChild.nodeValue=isAtoms?'Zn · 금속':'금속 마디';
    root.querySelector('[data-legend="linker"]').lastChild.nodeValue=isAtoms?'C · 링커의 탄소':'링커 · 연결재';
    for(const li of root.querySelectorAll('[data-legend]'))li.hidden=!colorSet.has(legendColors[li.dataset.legend]);
    const ids=new Set(model.labels.map(l=>l.id));for(const [id,el]of labelObjects)if(!ids.has(id)){el.remove();labelObjects.delete(id);}
    if(renderer)drawThree(model);else drawFallback(model);
  }
  function frame(now){
    raf=0;if(document.hidden||(!visible&&!forcePaint)){lastTime=0;return;}
    forcePaint=false;
    drawing=true;
    const dt=lastTime?Math.min((now-lastTime)/1000,.1):0;lastTime=now;
    if(state.playing&&visible){state.phase+=dt*state.speed/4.5;if(state.phase>=1){if(state.step<M.chapters[state.chapter].scenes.length-1){state.phase=0;state.step++;updateScene();}else{state.phase=1;state.playing=false;updateScene();status('이 단계의 애니메이션이 끝났습니다.');}}const count=M.chapters[state.chapter].scenes.length,p=Math.round((state.step+state.phase)/count*100);$('sceneProgress').value=p;$('progressValue').textContent=p+'%';dirty=true;}
    if(dirty&&(!state.playing||!lastDraw||now-lastDraw>=1000/30)){render();dirty=false;lastDraw=now;}drawing=false;forcePaint=false;
    if(state.playing&&active())raf=requestAnimationFrame(frame);else lastTime=0;
  }
  function result(label,value,note='',compact=false){return `<div class="result"><small>${label}</small><b${compact?' class="compact"':''}>${value}</b><span>${note}</span></div>`;}
  function range(id,label,min,max,step,value,note=''){return `<label class="field" for="${id}"><span class="field-title">${label}<output id="${id}Value"></output></span><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}"></label>${note?'<p class="control-note">'+note+'</p>':''}`;}
  function controls(){
    const c=state.chapter;let html='';
    $('interactionCard').hidden=false;
    $('controlTitle').textContent=c<3?'이해의 핵심':'직접 바꿔 보기';
    if(c===0)html='<dl class="core-facts"><div><dt>마디</dt><dd>금속 이온 또는 클러스터(원자들의 묶음)로 된 연결부</dd></div><div><dt>링커</dt><dd>두 마디 이상을 연결하는 유기 분자</dd></div><div><dt>기공</dt><dd>골격 사이에 남는, 분자가 접근할 수 있는 빈 공간</dd></div></dl>';
    if(c===1)html='<dl class="core-facts"><div><dt>전자쌍 제공</dt><dd>카복실레이트 산소 · 루이스 염기</dd></div><div><dt>전자쌍 받음</dt><dd>Zn²⁺ · 루이스 산</dd></div><div><dt>결합의 결과</dt><dd>전자쌍을 공유하며 더 안정한 결합 상태 형성</dd></div></dl>';
    if(c===2)html='<p class="composition-formula">Zn₄O(BDC)₃ <span>MOF-5 · IRMOF-1</span></p><dl class="core-facts"><div><dt>Zn₄O 마디</dt><dd>중심 산소와 아연 네 개가 이룬 클러스터 기반</dd></div><div><dt>BDC 링커</dt><dd>벤젠 고리 + 양끝 카복실레이트</dd></div><div><dt>6개 연결</dt><dd>마디 전체가 여섯 방향으로 이웃과 연결</dd></div></dl>';
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
  function renderLearning(){
    if(!L)return;
    const lesson=L.lessons[state.chapter];
    $('lessonAnalogy').textContent=lesson.analogy;$('analogyBoundary').textContent='비유의 범위 · '+lesson.boundary;
    $('experimentDetails').innerHTML=lesson.experiment.reduce((html,text,i)=>i%2===0?html+`<div><dt>${text}</dt><dd>${lesson.experiment[i+1]}</dd></div>`:html,'');
    $('experimentGuide').hidden=state.chapter<3;$('experimentGuide').open=[3,4,5,7].includes(state.chapter);
    $('quantityGuide').hidden=![3,4,6,7].includes(state.chapter);$('quantityGuide').open=false;
    $('practicalNote').textContent=lesson.practical||'';$('practicalNote').hidden=!lesson.practical;
  }
  function updateScene(announce=false){
    const scenes=M.chapters[state.chapter].scenes,entry=scenes[state.step];
    $('sceneCount').textContent=`장면 ${state.step+1} / ${scenes.length}`;$('sceneTitle').textContent=entry[0];$('sceneWhy').textContent=entry[1];$('sceneReason').textContent=M.chapters[state.chapter].reasons[state.step];
    $('previousScene').disabled=state.step===0;$('nextScene').disabled=state.step===scenes.length-1;
    $('playScene').textContent=state.playing?'일시정지':'과정 재생';$('playScene').setAttribute('aria-pressed',String(state.playing));
    const p=Math.round((state.step+state.phase)/scenes.length*100);$('sceneProgress').value=p;$('progressValue').textContent=p+'%';
    if(announce)status(`장면 ${state.step+1}. ${entry[0]}. ${entry[1]}`);invalidate(true);
  }
  function selectChapter(index,announce=true){
    state.chapter=M.clamp(index,0,M.chapters.length-1);state.step=0;state.phase=0;state.playing=false;lastTime=0;
    const c=M.chapters[state.chapter];
    const coreIndex=coreOrder.indexOf(state.chapter);
    $('chapterKicker').textContent=coreIndex>=0?`기초 ${coreIndex+1} / 3`:`심화 ${advancedOrder.indexOf(state.chapter)+1} / 6`; $('chapterTitle').textContent=c.title;$('chapterKey').textContent=c.key;
    $('storyTitle').textContent=c.storyTitle;$('storyBridge').textContent=c.bridge;$('storyBridgeLabel').textContent=state.chapter===1?'처음의 질문으로 돌아오면':state.chapter===8?'이야기를 마치며':'다음 이야기로';$('storyContinue').hidden=state.chapter!==1;
    $('chapterExplanation').innerHTML=c.explanation;$('chapterNote').textContent=c.note;$('chapterNote').hidden=!c.note;$('chapterTheory').innerHTML=c.theory;$('chapterCaution').textContent=c.caution;$('theoryDetails').open=false;
    for(const b of root.querySelectorAll('[data-chapter]')){if(Number(b.dataset.chapter)===state.chapter)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');}
    const order=coreIndex>=0?coreOrder:advancedOrder,position=order.indexOf(state.chapter);
    $('previousChapter').disabled=position===0;$('nextChapter').disabled=position===order.length-1;$('nextChapter').textContent=state.chapter===0?'다음 · 두 부품의 이야기':state.chapter===2?'다음 · 결합의 이야기':coreIndex===2?'기초 이야기 완료':'다음 이야기';$('chapterPosition').textContent=coreIndex>=0?`기초 ${coreIndex+1} / 3`:`심화 ${position+1} / 6`;
    if(coreIndex<0)$('advancedTopics').open=true;state.focus='framework';state.explode=0;$('explodeModel').value='0';view('home');
    controls();renderLearning();updateScene();
    if(announce)status(`${state.chapter+1}단계. ${c.title}. ${c.key}`);
  }
  function changeStep(delta){state.step=M.clamp(state.step+delta,0,M.chapters[state.chapter].scenes.length-1);state.phase=1;state.playing=false;updateScene(true);}
  function view(action){
    if(action==='left')yaw-=.18;if(action==='right')yaw+=.18;if(action==='up')pitch=M.clamp(pitch+.15,-1.1,1.1);
    if(action==='in')zoom=M.clamp(zoom*1.15,.6,2.1);if(action==='out')zoom=M.clamp(zoom/1.15,.6,2.1);
    if(action==='home'){yaw=-.55;pitch=.35;zoom=1;}invalidate(true);
  }
  function inputEvent(e){
    const el=e.target,id=el.id;
    if(id==='explodeModel'){state.explode=Number(el.value);state.focus='framework';invalidate(true);return;}
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
    results();invalidate(true);
  }
  root.addEventListener('input',inputEvent);
  root.addEventListener('change',e=>{
    const el=e.target;
    if(el.id==='showHydrogen'){state.hydrogen=el.checked;invalidate(true);return;}
    if(el.id==='showPolyhedra'){state.polyhedra=el.checked;invalidate(true);return;}
    if(el.id==='showPores'){state.showPores=el.checked;invalidate(true);return;}
    if(el.id==='compareStructures')state.compare=el.checked;
    else if(el.id==='interpenetration'){state.interpenetrate=el.checked;if(el.checked){state.step=1;state.phase=0;state.playing=!reduced;updateScene();}}
    else if(el.id==='internalSurface'){state.internal=el.checked;if(el.checked&&state.step===0){state.step=1;state.phase=1;updateScene();}}
    else if(el.id==='showLabels'){invalidate(true);return;}else return;
    results();invalidate(true);status('구조와 결과를 갱신했습니다.');
  });
  root.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b||!root.contains(b)||b.disabled)return;
    if(b.dataset.chapter!==undefined){selectChapter(Number(b.dataset.chapter));return;}
    if(b.dataset.focus){state.focus=b.dataset.focus;if(state.focus==='pore'){state.showPores=true;$('showPores').checked=true;}if(['node','linker'].includes(state.focus))state.representation='atoms';state.explode=0;$('explodeModel').value='0';invalidate(true);status('구성요소 보기를 바꿨습니다.');return;}
    if(b.dataset.representation){state.representation=b.dataset.representation;if(state.representation==='topology')state.focus='framework';invalidate(true);return;}
    if(b.dataset.view){view(b.dataset.view);return;}
    if(b.dataset.rings){state.rings=Number(b.dataset.rings);const wasOpen=$('chapterControls').querySelector('details')?.open;controls();$('chapterControls').querySelector('details').open=!!wasOpen;invalidate(true);status(M.family(state.rings).name+' 구조를 선택했습니다.');return;}
    if(b.dataset.species){state.species=b.dataset.species;controls();$('gasOptions').open=true;invalidate(true);status('기체 '+state.species+'의 단일 성분 점유율을 표시합니다.');return;}
    if(b.dataset.application!==undefined){state.application=Number(b.dataset.application);controls();invalidate(true);return;}
    if(b.id==='previousScene')changeStep(-1);
    if(b.id==='nextScene')changeStep(1);
    if(b.id==='previousChapter'){const order=coreOrder.includes(state.chapter)?coreOrder:advancedOrder;selectChapter(order[order.indexOf(state.chapter)-1]);}
    if(b.id==='nextChapter'){const order=coreOrder.includes(state.chapter)?coreOrder:advancedOrder;selectChapter(order[order.indexOf(state.chapter)+1]);}
    if(b.id==='resetScene'){
      const chapter=state.chapter,speed=state.speed;state={...M.defaults(chapter),representation:'atoms',showPores:true,polyhedra:true,hydrogen:false,focus:'framework',explode:0};$('showHydrogen').checked=false;$('showPolyhedra').checked=true;$('showPores').checked=true;state.speed=speed;view('home');selectChapter(chapter,false);status('현재 단계의 변수와 시점을 처음 상태로 되돌렸습니다.');
    }
    if(b.id==='playScene'){
      visible=true;
      if(!state.playing&&state.step===M.chapters[state.chapter].scenes.length-1&&state.phase>=1){state.step=0;state.phase=0;}
      if(!state.playing&&state.phase>=1)state.phase=0;
      state.playing=!state.playing;lastTime=0;updateScene();status(state.playing?'애니메이션 재생':'애니메이션 일시정지');
    }
  });
  viewport.addEventListener('keydown',e=>{
    const map={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down','+':'in','=':'in','-':'out',Home:'home'};
    if(e.target!==viewport)return;
    if(e.key===' '){e.preventDefault();$('playScene').click();return;}
    if(map[e.key]){e.preventDefault();if(e.key==='ArrowDown'){pitch=M.clamp(pitch-.15,-1.1,1.1);invalidate(true);}else view(map[e.key]);}
  });
  viewport.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,id:e.pointerId};viewport.setPointerCapture?.(e.pointerId);});
  viewport.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;yaw+=(e.clientX-drag.x)*.008;pitch=M.clamp(pitch+(e.clientY-drag.y)*.006,-1.1,1.1);drag.x=e.clientX;drag.y=e.clientY;invalidate(true);});
  const stopDrag=()=>{drag=null;};
  viewport.addEventListener('pointerup',e=>{
    if(drag&&renderer&&state.chapter!==1&&state.chapter<3&&Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)<6){
      const rect=viewport.getBoundingClientRect();shared.pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);shared.raycaster.setFromCamera(shared.pointer,camera);
      const hit=shared.raycaster.intersectObjects([...sceneObjects.values()].filter(o=>o.visible)).find(h=>h.object.userData.parts[h.instanceId]?.component==='node'||h.object.userData.parts[h.instanceId]?.component==='linker');
      if(hit){state.focus=hit.object.userData.parts[hit.instanceId].component;state.explode=0;$('explodeModel').value='0';invalidate(true);}
    }stopDrag();
  });viewport.addEventListener('pointercancel',stopDrag);viewport.addEventListener('lostpointercapture',stopDrag);
  viewport.addEventListener('wheel',e=>{if(e.ctrlKey)return;e.preventDefault();view(e.deltaY<0?'in':'out');},{passive:false});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();if(renderer){renderer=null;canvas.hidden=true;fallback.hidden=false;fallback.removeAttribute('hidden');$('renderMode').hidden=false;viewport.dataset.renderer='svg';invalidate(true);}});
  function suspend(){if(raf){cancelAnimationFrame(raf);raf=0;}lastTime=0;if(!document.hidden&&forcePaint)raf=requestAnimationFrame(frame);}
  document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend();else invalidate(true);});
  if(window.IntersectionObserver)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)invalidate(true);else suspend();},{rootMargin:'120px'}).observe($('mofLab'));
  if(window.ResizeObserver)new ResizeObserver(invalidate).observe(viewport);else window.addEventListener('resize',invalidate);
  const motionChange=e=>{reduced=e.matches;if(reduced){state.playing=false;updateScene();}$('motionNotice').textContent=reduced?'동작 줄이기 설정 적용 · 수동 조작 가능':'';};
  media?.addEventListener?.('change',motionChange);motionChange({matches:reduced});
  window.addEventListener('pagehide',()=>{suspend();state.playing=false;});
  window.addEventListener('pageshow',()=>{lastTime=0;updateScene();});
  $('chapterNav').innerHTML=coreOrder.map((i,n)=>`<button type="button" data-chapter="${i}"><span class="step-number">${['MOF란?','무엇으로?','왜 결합할까?'][n]}</span><strong>${['빈 공간을 가진 결정','금속 마디와 유기 링커','전자쌍을 공유하는 결합'][n]}</strong></button>`).join('');
  $('advancedChapterNav').innerHTML=advancedOrder.map(i=>`<button type="button" data-chapter="${i}">${M.chapters[i].short}</button>`).join('');
  $('storyContinue').addEventListener('click',()=>{$('advancedTopics').open=true;});
  if(L)$('additionalReferences').innerHTML=L.references.slice(2).map(ref=>`<li id="ref-${ref.id}">${ref.title}. <cite>${ref.journal}</cite>. <a href="${ref.url}" target="_blank" rel="noopener noreferrer">학술 원문</a></li>`).join('');
  initRenderer();selectChapter(0,false);
})();
