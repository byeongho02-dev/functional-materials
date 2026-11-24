/* Relative teaching model. Not CIF coordinates, fitted kinetics, or a capacity prediction. */
(function(scope){
  'use strict';
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,Number(v)||0));
  const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
  const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
  const colors={metal:'#65b5ff',hydrogen:'#82dfec',bond:'#edf5ff',hydride:'#bd9aff',site:'#68dfa3',guide:'#607e98',heat:'#ffae69'};
  const steps=[
    {name:'H₂가 표면에 접근',short:'접근',observation:'두 H가 연결된 분자가 금속 표면에 다가옵니다.',reason:'수소를 내부에 저장하려면 먼저 표면에서 반응할 수 있어야 합니다.'},
    {name:'표면에서 H₂ 해리',short:'해리',observation:'표면에서 H–H 결합 표시가 사라지고 H 원자 두 개로 나뉩니다.',reason:'적합한 표면 자리가 해리를 돕습니다. H₂ 분자 전체가 원자 간극으로 들어가는 과정이 아닙니다.'},
    {name:'H 원자가 간극으로 이동',short:'내부 이동',observation:'나뉜 H가 금속 원자 사이의 간극에 들어갑니다.',reason:'간극은 원자 사이의 작은 자리입니다. MOF의 큰 기공 표면에 분자가 붙는 것과 구분합니다.'},
    {name:'수소화물 형성',short:'수소화물',observation:'금속–수소 상호작용과 수소화물 영역을 보라색으로 표시합니다.',reason:'적절한 조건에서 수소를 포함한 상이 안정해집니다. 전형적인 형성 반응은 전체적으로 열을 내놓습니다.'},
    {name:'재결합하여 H₂ 방출',short:'방출',observation:'H가 표면으로 나온 뒤 재결합하고 H₂ 분자로 떠납니다.',reason:'공급 압력이 평형 기준보다 낮은 등의 조건에서는 방출 방향이 유리합니다. 탈수소화에는 보통 열 공급이 필요합니다.'}
  ];
  function defaults(){return {chapter:0,step:0,phase:0,playing:false,speed:1,pressure:1.6,temperature:1,composition:.5,branch:'absorption',hysteresis:true,compositionMode:false,sites:true,interactions:true,heat:true,alloy:'tife',application:'stationary',method:'hydride',damage:0,impurity:false,tracePair:true,response:null,coordinate:null};}
  // An arbitrary dimensionless trend with the correct positive dPeq/dT; no real alloy constants.
  function equilibrium(temperature){const t=clamp(temperature,.6,1.6);return Math.exp(1.8*(1-1/t));}
  function drive(s){const peq=equilibrium(s.temperature),ratio=clamp(s.pressure,.2,4)/peq,logRatio=Math.log(ratio);const direction=Math.abs(logRatio)<.07?'equilibrium':logRatio>0?'absorb':'release';return {peq,ratio,direction,label:direction==='absorb'?'흡수 방향이 유리':direction==='release'?'방출 방향이 유리':'평형 기준 부근'};}
  function pct(x,temperature,branch='absorption',hysteresis=true){
    x=clamp(x,0,1);const base=equilibrium(temperature);
    const shape=x<.22?Math.exp(-.0168-1.5*(1-x/.22)):x>.78?Math.exp(.0168+1.5*(x-.78)/.22):Math.exp(.06*(x-.5));
    return base*shape*Math.exp(hysteresis?(branch==='absorption'?.17:-.17):0);
  }
  function coordinate(s){if(s.coordinate!==null&&s.coordinate!==undefined)return clamp(s.coordinate,0,4);return s.step===4?4*(1-clamp(s.phase,0,1)):clamp(s.step,0,3)+clamp(s.phase,0,1);}
  function respond(s){const d=drive(s),start=coordinate(s);return {...s,branch:d.direction==='release'?'desorption':d.direction==='absorb'?'absorption':s.branch,compositionMode:false,coordinate:start,response:d.direction==='equilibrium'?null:{start,end:d.direction==='absorb'?4:0,elapsed:0,duration:Math.max(.8,Math.abs((d.direction==='absorb'?4:0)-start)*1.1)},playing:d.direction!=='equilibrium'&&Math.abs(start-(d.direction==='absorb'?4:0))>.001};}
  function advance(s,dt){
    if(!s.playing)return s;
    dt=clamp(dt,0,.1)*clamp(s.speed,.5,2);let out={...s};
    if(s.method!=='hydride')return {...out,step:0,phase:(out.phase+dt/3.4)%1};
    if(out.response){const r={...out.response,elapsed:out.response.elapsed+dt},p=clamp(r.elapsed/r.duration,0,1);out.coordinate=r.start+(r.end-r.start)*smooth(p);out.response=r;if(p===1){out.playing=false;out.response=null;out.step=r.end===4?3:4;out.phase=1;}return out;}
    out.phase+=dt/3.4;if(out.phase>=1){if(out.step<4){out.step++;out.phase=0;}else{out.phase=1;out.playing=false;}}return out;
  }
  function pairPose(pair,u){
    u=clamp(u,0,4);const row=pair%3,col=Math.floor(pair/3),y=(row-1)*.92,z=(col-.5)*1.3;
    const external=[[4.2,y-.16,z],[4.2,y+.16,z]],near=[[2.2,y-.16,z],[2.2,y+.16,z]],surface=[[1.9,y-.29,z-.08],[1.9,y+.29,z+.08]];
    const sites=[[-.85,-.75,-.75],[-.85,.75,-.75],[.85,-.75,-.75],[.85,.75,-.75],[-.85,-.75,.75],[-.85,.75,.75],[.85,-.75,.75],[.85,.75,.75],[0,-.75,-.75],[0,.75,.75],[0,-.75,.75],[0,.75,-.75]];
    const inside=[sites[pair*2],sites[pair*2+1]];let positions,bond=0;
    if(u<=1){positions=external.map((p,i)=>mix(p,near[i],smooth(u)));bond=1;}
    else if(u<=2){const p=smooth(u-1);positions=near.map((v,i)=>mix(v,surface[i],p));bond=1-smooth((u-1)/.4);}
    else{positions=surface.map((v,i)=>mix(v,inside[i],smooth(u-2)));}
    return {positions,bond,sites:inside};
  }

  function storageScene(s){
    const parts=[],labels=[],liquid=s.method==='liquid',c=colors,center=.35;
    const ball=(id,p,r,color,opacity=1,extra={})=>parts.push({id,kind:'sphere',p,r,color,opacity,...extra});
    const bar=(id,a,b,r,color,opacity=1,extra={})=>parts.push({id,kind:'bar',a,b,r,color,opacity,...extra});
    const box=(id,p,size,color,opacity=1)=>parts.push({id,kind:'box',p,size,color,opacity});
    const ring=(id,y,r,color)=>{for(let i=0;i<32;i++){const a=i/32*Math.PI*2,b=(i+1)/32*Math.PI*2;bar(id+'-'+i,[center+r*Math.cos(a),y,r*Math.sin(a)],[center+r*Math.cos(b),y,r*Math.sin(b)],.024,color,.75);}};
    bar('vessel-shell',[center,-1.75,0],[center,1.75,0],1.3,c.guide,.13);
    for(const y of [-1.75,1.75]){ring('vessel-ring'+y,y,1.3,c.metal);ball('vessel-cap'+y,[center,y,0],1.3,c.guide,.12,{scale:[1,.24,1]});}
    box('valve',[center,2.18,0],[.35,.32,.35],c.guide);bar('valve-stem',[center,1.95,0],[center,2.4,0],.055,c.metal);
    if(liquid){
      bar('outer-jacket',[center,-1.9,0],[center,1.9,0],1.58,c.metal,.055);
      ring('insulation-top',1.9,1.58,c.metal);ring('insulation-bottom',-1.9,1.58,c.metal);
      bar('liquid-region',[center,-1.65,0],[center,-.45,0],1.17,c.hydrogen,.1);
      labels.push({id:'insulation',p:[-1.8,.5,0],text:'외벽과 단열층 · 장치 개념'});
    }
    for(let pair=0;pair<6;pair++){
      const a=pair*2.39996+s.phase*.7,r=liquid?.32+(pair%2)*.18:.65+(pair%2)*.25;
      const y=liquid?-1.4+Math.floor(pair/2)*.32:(pair%3-1)*1.05;
      const p=[center+r*Math.cos(a),y,r*Math.sin(a)],axis=[Math.cos(a+.5)*.12,.08,Math.sin(a+.5)*.12];
      const endpoints=[p.map((v,i)=>v-axis[i]),p.map((v,i)=>v+axis[i])];
      endpoints.forEach((q,j)=>ball('H-'+(pair*2+j),q,.105,c.hydrogen,1,{element:'H',pair,inside:false}));
      bar('HH-'+pair,endpoints[0],endpoints[1],.026,c.bond,1,{bondType:'H-H'});
    }
    labels.push({id:'storage-kind',p:[.35,2.9,0],text:liquid?'액체 수소 · H₂ 분자 유지':'압축 기체 · H₂ 분자 유지'});
    labels.push({id:'storage-scope',p:[.35,-2.5,0],text:'같은 6개 표시 분자 · 실제 밀도·압력 아님'});
    return {parts,labels,stored:0,totalHydrogen:12,hydride:0,pairCoordinates:Array(6).fill(0),name:liquid?'액체 수소 · 단열 용기 개념':'압축 수소 · 기체 용기 개념',u:0,molecular:true};
  }

  function scene(s){
    if(s.method!=='hydride')return storageScene(s);
    const parts=[],labels=[],u=coordinate(s),driving=drive(s),pairCoordinates=[];
    const ball=(id,p,r,color,opacity=1,extra={})=>parts.push({id,kind:'sphere',p,r,color,opacity,...extra});
    const bar=(id,a,b,color,r=.025,opacity=1,extra={})=>parts.push({id,kind:'bar',a,b,r,color,opacity,...extra});
    const box=(id,p,size,color,opacity)=>parts.push({id,kind:'box',p,size,color,opacity});
    const atoms=[];const damage=s.chapter===7?clamp(s.damage,0,1):0;
    for(let x=0;x<3;x++)for(let y=0;y<3;y++)for(let z=0;z<3;z++){
      const p=[(x-1)*1.5,(y-1)*1.5,(z-1)*1.5],split=p[0]>0?damage*.35:p[0]<0?-damage*.35:0;p[0]+=split;
      atoms.push({id:`M-${x}-${y}-${z}`,p});
    }
    let stored=0,hydride=0;
    for(let pair=0;pair<6;pair++){
      const requested=s.chapter===4&&s.compositionMode?4*clamp((s.composition-pair/6)*6,0,1):u;
      const pu=s.chapter===7&&s.impurity&&pair===0?Math.min(requested,1):requested;pairCoordinates.push(pu);hydride+=clamp(pu-3,0,1)/6;
      const pose=pairPose(pair,pu);
      pose.positions.forEach((p,j)=>{const inside=Math.abs(p[0])<1.55&&Math.abs(p[1])<1.55&&Math.abs(p[2])<1.55;if(inside)stored++;ball('H-'+(pair*2+j),p,.105,colors.hydrogen,1,{element:'H',pair,inside});});
      if(s.tracePair&&pair===0)pose.positions.forEach((q,j)=>ball('trace-'+j,q,.16,colors.heat,.65,{hollow:true}));
      if(pose.bond>.001)bar('HH-'+pair,pose.positions[0],pose.positions[1],colors.bond,.026,pose.bond,{bondType:'H-H'});
      if(s.sites)pose.sites.forEach((p,j)=>ball('site-'+pair+'-'+j,p,.14,colors.site,.5,{hollow:true}));
      if(pu>3&&s.interactions){pose.positions.forEach((p,j)=>{const nearest=atoms.reduce((a,b)=>Math.hypot(...a.p.map((v,k)=>v-p[k]))<Math.hypot(...b.p.map((v,k)=>v-p[k]))?a:b);for(let n=0;n<3;n++){bar(`MH-${pair}-${j}-${n}`,mix(nearest.p,p,n/3),mix(nearest.p,p,(n+.55)/3),colors.hydride,.017,.7,{bondType:'M-H'});}});}
    }
    if(s.chapter===4&&s.compositionMode)hydride=clamp((s.composition-.22)/.56,0,1);
    for(const atom of atoms){const rank=(atom.p[0]+1.5)/3*.55+(atom.p[1]+1.5)/3*.25+(atom.p[2]+1.5)/3*.2;const inHydride=hydride>=1||hydride>0&&hydride>rank+.015;ball(atom.id,atom.p,.245,inHydride?colors.hydride:colors.metal,1,{element:'M'});}
    // Lines indicate lattice positions, not pairwise covalent metal bonds.
    for(const a of atoms)for(const b of atoms)if(a.id<b.id){const distance=Math.hypot(...a.p.map((v,i)=>v-b.p[i]));if(Math.abs(distance-1.5)<.01)bar('grid-'+a.id+'-'+b.id,a.p,b.p,colors.guide,.016,.42);}
    if(hydride>.01)box('hydride-region',[0,0,0],[3.2,3.2,3.2],colors.hydride,.045*hydride);
    if(s.heat&&(s.chapter===3||s.chapter===7||s.chapter===6&&s.application==='thermal'&&s.method==='hydride')&&driving.direction!=='equilibrium'){
      const releasing=s.response?s.response.end<s.response.start:s.coordinate!==null?driving.direction==='release':s.step===4;const outward=!releasing,color=outward?colors.heat:colors.hydrogen;
      for(let i=0;i<3;i++){const a=[-1+i*1,2,0],b=[a[0],2.9,0],from=outward?a:b,to=outward?b:a;bar('heat-'+i,from,to,color,.035);bar('heat-wing-a'+i,to,[to[0]-.14,to[1]+(outward?-.22:.22),0],color,.025);bar('heat-wing-b'+i,to,[to[0]+.14,to[1]+(outward?-.22:.22),0],color,.025);}
      labels.push({id:'heat-label',p:[0,3.3,0],text:outward?'형성 시 열 방출':'방출 시 열 흡수'});
    }
    if(s.chapter===7&&s.impurity){for(let i=0;i<1;i++){const p=[1.9,-.92,-.65];bar('blocked-a'+i,[p[0],p[1]-.13,p[2]-.13],[p[0],p[1]+.13,p[2]+.13],colors.heat,.04);bar('blocked-b'+i,[p[0],p[1]-.13,p[2]+.13],[p[0],p[1]+.13,p[2]-.13],colors.heat,.04);}labels.push({id:'blocked',p:[2.5,-1.5,-.65],text:'한 해리 자리 차단 · H₂ 한 쌍 대기'});}
    labels.push({id:'metal',p:[-1.6,1.95,-.3],text:'M · 금속 격자 모식도'});
    if(pairCoordinates.some(v=>v<1.35))labels.push({id:'hydrogen-molecule',p:[3.6,1.75,0],text:'H₂ · 결합된 수소 분자'});
    if(pairCoordinates.some(v=>v>=1.35))labels.push({id:'hydrogen-atom',p:[.3,-2,0],text:'H · 원자 상태의 수소'});
    return {parts,labels,stored,totalHydrogen:12,hydride,pairCoordinates,name:'금속수소화물 · 공통 격자 모식도',u};
  }
  const api={clamp,mix,smooth,colors,steps,defaults,equilibrium,drive,pct,coordinate,respond,advance,pairPose,storageScene,scene};
  if(typeof module==='object'&&module.exports)module.exports=api;else scope.HydrogenModel=api;
})(typeof window==='object'?window:globalThis);
