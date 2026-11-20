/* Original educational Zn4O/BDC geometry; not crystallographic CIF coordinates. */
(function(scope,factory){
  'use strict';
  if(typeof module==='object'&&module.exports)module.exports=factory;
  else scope.MOFMolecular=factory(scope.MOFModel);
})(typeof window==='object'?window:globalThis,function(M){
  'use strict';
  const C={Zn:'#68baff',O:'#ff8eaa',C:'#69e3a8',H:'#e9f1ff',bond:'#a4c6d4',electron:'#ecfcff',cloud:'#6ddffc',pore:'#f5d77a'};
  const V=[[1,1,1],[1,-1,-1],[-1,1,-1],[-1,-1,1]];
  const directions=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
  const add=(a,b)=>a.map((v,i)=>v+b[i]);
  const mul=(a,k)=>a.map(v=>v*k);
  const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
  const unit=a=>mul(a,1/(Math.hypot(...a)||1));
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  function basis(a,b,orientation=1){const u=unit(b.map((v,i)=>v-a[i]));const vertex=V.map(v=>mul(v,orientation)).find(v=>v.reduce((sum,x,i)=>sum+x*u[i],0)>.9);const v=vertex?unit(vertex.map((x,i)=>x-u[i])):unit(cross(u,[0,1,1]));return {u,v};}
  function create(s){
    const parts=[],labels=[],t=M.clamp(s.phase,0,1);
    function atom(id,p,element,component,r){parts.push({id,kind:'sphere',p,r:r||({Zn:.19,O:.125,C:.105,H:.065}[element]),color:C[element],opacity:1,atom:element,component});}
    function rod(id,a,b,color=C.bond,r=.038,component='linker',opacity=1){if(Math.hypot(...a.map((v,i)=>v-b[i]))>1e-6)parts.push({id,kind:'bar',a,b,r,color,opacity,component});}
    function chemicalBond(id,a,b,e1,e2,component='linker',r=.038){const mid=mix(a,b,.5);rod(id+'a',a,mid,C[e1],r,component);rod(id+'b',mid,b,C[e2],r,component);}
    function text(id,p,value){labels.push({id,p,text:value});}
    function cloud(id,p,size,color=C.cloud,opacity=.14,component='bond'){parts.push({id,kind:'cloud',p,size,color,opacity,component});}
    function core(id,center,scale=1,orientation=1){
      atom(id+'-O',center,'O','node',.14*scale);
      const zinc=V.map(v=>add(center,mul(v,.35*scale*orientation)));
      zinc.forEach((p,i)=>{atom(id+'-Zn'+i,p,'Zn','node',.19*scale);chemicalBond(id+'-core'+i,center,p,'O','Zn','node',.047*scale);});
      if(s.polyhedra)parts.push({id:id+'-envelope',kind:'tetrahedron',p:center,r:.67*scale,color:C.Zn,opacity:.1,component:'node',orientation,rotation:orientation===-1?[Math.PI/2,0,0]:[0,0,0]});
      return zinc;
    }
    function cap(id,center,direction,scale=1,orientation=1){
      const u=direction,matching=V.map(v=>mul(v,orientation)).filter(v=>v.reduce((sum,x,i)=>sum+x*u[i],0)>.9);
      const carbon=add(center,mul(u,1.32*scale));atom(id+'-C',carbon,'C','linker',.105*scale);
      matching.forEach((v,i)=>{
        const off=v.map((x,j)=>u[j]?u[j]*.86:x*.23);
        const oxygen=add(center,mul(off,scale));atom(id+'-O'+i,oxygen,'O','linker',.125*scale);
        chemicalBond(id+'-CO'+i,carbon,oxygen,'C','O','linker',.039*scale);
        chemicalBond(id+'-ZnO'+i,add(center,mul(v,.35*scale)),oxygen,'Zn','O','node',.043*scale);
      });return carbon;
    }
    function linker(id,a,b,{includeCaps=true,scale=1,orientations=[1,1]}={}){
      const {u,v}=basis(a,b,orientations[0]),center=mix(a,b,.5);
      const carbon=[];for(let i=0;i<6;i++){const angle=i*Math.PI/3;const p=add(center,add(mul(u,Math.cos(angle)*.58*scale),mul(v,Math.sin(angle)*.58*scale)));carbon.push(p);atom(id+'-ringC'+i,p,'C','linker',.105*scale);}
      for(let i=0;i<6;i++){
        chemicalBond(id+'-ringBond'+i,carbon[i],carbon[(i+1)%6],'C','C','linker',.038*scale);
        if(i%2===0){const a2=mix(carbon[i],center,.16),b2=mix(carbon[(i+1)%6],center,.16);rod(id+'-aromatic'+i,a2,b2,C.C,.018*scale);}
      }
      if(s.hydrogen)for(const i of [1,2,4,5]){const h=add(center,mul(carbon[i].map((x,j)=>x-center[j]),1.52));atom(id+'-H'+i,h,'H','linker',.065*scale);chemicalBond(id+'-CH'+i,carbon[i],h,'C','H','linker',.025*scale);}
      let left,right;
      if(includeCaps){left=cap(id+'-left',a,u,scale,orientations[0]);right=cap(id+'-right',b,mul(u,-1),scale,orientations[1]);}
      else{
        left=add(a,mul(u,1.32*scale));right=add(b,mul(u,-1.32*scale));
        for(const [end,carbonP,sign]of [['left',left,-1],['right',right,1]]){
          atom(id+'-'+end+'-C',carbonP,'C','linker',.105*scale);
          for(const j of [-1,1]){const oxygen=add(carbonP,add(mul(u,.46*sign*scale),mul(v,.325*j*scale)));atom(id+'-'+end+'-O'+j,oxygen,'O','linker',.125*scale);chemicalBond(id+'-'+end+'-CO'+j,carbonP,oxygen,'C','O','linker',.039*scale);}
        }
      }
      chemicalBond(id+'-endL',left,carbon[3],'C','C','linker',.039*scale);chemicalBond(id+'-endR',carbon[0],right,'C','C','linker',.039*scale);
    }
    function isolatedNode(center=[0,0,0],scale=1){core('node',center,scale);directions.forEach((d,i)=>cap('cap'+i,center,d,scale));text('node-name',[center[0],center[1]+1.8*scale,center[2]],'금속 마디 · Zn₄O 기반');}
    function pore(L=4.8){
      const g=M.network(1,L*.82,[0,0,0],'pore');
      for(const e of g.edges)for(let j=0;j<5;j++)rod(e.id+'dash'+j,mix(e.a,e.b,j/5),mix(e.a,e.b,(j+.52)/5),C.pore,.016,'pore',.75);
      cloud('void',[0,0,0],[L*.30,L*.30,L*.30],C.pore,.035,'pore');
    }
    function framework(L=4.8,partial=1){
      const graph=M.network(1,L,[0,0,0],'crystal');
      const exploded=M.clamp(s.explode||0,0,1);
      const centerScale=1+exploded*.4;
      const orientations=new Map(graph.nodes.map(n=>[n.id,Math.round(n.p.reduce((sum,v)=>sum+v/L+.5,0))%2?-1:1]));
      for(const n of graph.nodes){const center=mul(n.p,centerScale);if(s.representation==='topology')parts.push({id:n.id,kind:'sphere',p:center,r:.29,color:C.Zn,opacity:1,component:'node'});else core(n.id,center,1,orientations.get(n.id));}
      graph.edges.slice(0,Math.ceil(graph.edges.length*partial)).forEach(e=>{
        const a=mul(e.a,centerScale),b=mul(e.b,centerScale);
        if(s.representation==='topology'){rod(e.id,a,b,C.C,.068);return;}
        if(exploded>0){const offset=mul(unit(mix(e.a,e.b,.5)),exploded*1.5);linker(e.id,add(e.a,offset),add(e.b,offset),{includeCaps:false});}
        else linker(e.id,a,b,{orientations:[orientations.get(e.from),orientations.get(e.to)]});
      });
      if(s.showPores)pore(L*centerScale);
      return graph;
    }
    return {parts,labels,t,atom,rod,chemicalBond,text,cloud,core,cap,linker,isolatedNode,pore,framework};
  }
  function scene(state,phase=0){
    const s={representation:'atoms',showPores:true,polyhedra:true,hydrogen:false,focus:'framework',explode:0,...state,phase};
    const g=create(s),{parts,labels,t}=g;let name='',readout='';
    if(s.chapter===1){
      name='전자쌍 공유 · Zn–O 배위 결합';
      const shift=s.step===0?1:s.step===1?1-t:0;
      const zn=[-2,0,0],donor=[-.8+shift,0,0];
      g.atom('acceptor',zn,'Zn','bond',.34);
      const ligandA=[donor[0]-.86,0,-.23],ligandB=[ligandA[0]+4.8,0,-.23];
      // A local carboxylate and its benzene spacer; complete electron density is not calculated.
      g.linker('donorBDC',ligandA,ligandB,{includeCaps:false});
      const explicitO=[ligandA[0]+.86,.23,-.23];
      const oxygenPart=parts.find(p=>p.id==='donorBDC-left-O-1');
      const oxygen=oxygenPart?oxygenPart.p:explicitO;
      if(s.step<2)for(let i=0;i<5;i++)g.rod('interaction'+i,mix(zn,oxygen,i/5),mix(zn,oxygen,(i+.45)/5),C.cloud,.018,'bond',.65);
      else g.chemicalBond('coordination',zn,oxygen,'Zn','O','bond',.07);
      const pairStart=add(oxygen,[-.25,0,.13]);
      const pair=s.step===2?mix(pairStart,mix(zn,oxygen,.62),t):pairStart;
      g.atom('electron-1',add(pair,[0,.09,.02]),'H','bond',.055);g.atom('electron-2',add(pair,[0,-.09,.02]),'H','bond',.055);
      parts.filter(p=>p.id.startsWith('electron-')).forEach(p=>{delete p.atom;p.glow=true;p.color=C.electron;});
      if(s.step===2){const center=mix(zn,oxygen,.55);g.cloud('shared-density',center,[Math.hypot(...oxygen.map((v,i)=>v-zn[i]))*.38,.29,.29]);}
      else g.cloud('lone-pair',pairStart,[.21,.24,.20],C.cloud,.12);
      g.text('metal-label',[-2,-.85,0],'Zn²⁺ · 전자쌍을 받는 쪽');g.text('oxygen-label',add(oxygen,[.2,.8,0]),'O · 전자쌍을 제공하는 쪽');
      readout=s.step===2?'전자쌍이 Zn–O 결합 영역에 공유됩니다. 흰 점과 구름은 전자 궤적이 아닌 개념 표시입니다.':'산소의 비공유 전자쌍과 Zn²⁺가 상호작용합니다. 점 두 개는 전자쌍을 뜻합니다.';
    }else if(s.focus==='node'){
      name='금속 마디 확대 · Zn₄O(COO)₆ 기반 SBU';g.isolatedNode();
      readout='분홍 중심 O와 파란 Zn 네 개가 Zn₄O 중심을 이룹니다. 주변 카복실레이트가 여섯 방향의 연결 부위를 만듭니다.';
    }else if(s.focus==='linker'){
      name='유기 링커 확대 · BDC²⁻';g.linker('isolatedBDC',[-2.4,0,0],[2.4,0,0],{includeCaps:false});
      g.text('benzene',[0,1.15,0],'벤젠 고리 · 간격을 유지');g.text('carboxylate',[-1.45,-1,0],'카복실레이트 · 결합 말단');
      readout='BDC는 벤젠 고리와 양끝 카복실레이트로 이루어집니다. 초록은 C, 분홍은 O이며 수소는 선택해 표시할 수 있습니다.';
    }else if(s.chapter===2){
      name='MOF-5 · 구성요소에서 반복 골격까지';
      if(s.step===0){g.isolatedNode([-2.35,0,0],.82);g.linker('componentBDC',[.05,0,0],[4.85,0,0],{includeCaps:false,scale:.82});g.text('linker-name',[2.5,1.3,0],'유기 링커 · BDC');}
      if(s.step===1){g.isolatedNode();name='금속 마디 · 중심 O + 네 Zn';}
      if(s.step===2){g.linker('componentBDC',[-2.4,0,0],[2.4,0,0],{includeCaps:false});g.text('spacer',[0,1.2,0],'벤젠 고리');g.text('donor-end',[-1.5,-1,0],'카복실레이트 O');name='유기 링커 · 벤젠 고리와 결합 말단';}
      if(s.step>=3){g.framework(4.8,s.step===3?.5:1);if(s.step===4||s.step===5&&t<1){for(let i=0;i<10;i++){const exit=s.step===5?t:0;parts.push({id:'solvent-'+i,kind:'sphere',p:[Math.sin(i*2.3)*1.2+exit*2.8,Math.cos(i*1.9)*1.2+exit*2,Math.sin(i*.9)*1.3],r:.14*(1-exit),color:'#94a9bd',opacity:.65,component:'solvent'});}}}
      readout=['MOF-5는 Zn₄O 기반 금속 마디와 BDC 링커가 연결된 재료입니다. 부품을 따로 보면 각 역할이 보입니다.','중심 O 하나와 Zn 네 개가 마디의 중심입니다. Zn₄O는 벌크 산화아연 ZnO와 다른 구성 단위입니다.','단단한 벤젠 고리는 간격을 유지하고, 양끝 산소는 이웃 금속 마디에 배위합니다.','마디 전체의 여섯 연결 방향이 반복됩니다. 단일 Zn 이온의 배위수가 여섯이라는 뜻은 아닙니다.','반복되는 입체 연결망 사이에 기공이 남습니다. 회색 입자는 기공 속 용매를 뜻합니다.','용매만 빠져나가면 이미 있던 기공에 다른 분자가 접근할 수 있습니다. 골격에 구멍을 뚫는 과정이 아닙니다.'][s.step];
    }else{
      name=s.representation==='topology'?'MOF-5 · 연결 관계 보기':'MOF-5 · 원자와 결합으로 보는 열린 골격';g.framework();
      if(s.focus==='pore')g.text('pore-label',[0,.2,0],'기공 · 골격 사이의 빈 공간');
      else{g.text('node-label',[-2.4,3.2,0],'금속 마디');g.text('linker-label',[.2,-2.5,2.4],'유기 링커');}
      if(s.step===1&&s.focus==='framework')g.text('connection-label',[0,3.1,0],'금속 마디 + BDC 연결재');
      if(s.step===2)for(let i=0;i<7;i++)parts.push({id:'guest-'+i,kind:'sphere',p:[Math.sin(i*2.4)*1.1,Math.cos(i*2.4)*1.1,Math.sin(i)*1.15],r:.12,color:M.colors.orange,opacity:1,component:'gas'});
      readout=s.focus==='pore'?'노란 윤곽은 기공의 위치를 표시합니다. 골격 사이의 빈 공간이며 고체 벽이나 실측 기공 경계가 아닙니다.':'MOF는 금속 마디와 유기 링커가 배위 결합으로 반복 연결된 다공성 결정 재료입니다. 화면은 그 연결망의 일부입니다.';
    }
    if(s.explode>0&&s.chapter!==1&&s.focus==='framework')readout='부품의 역할을 보기 위해 위치를 벌린 모습입니다. 실제 분해 반응이나 합성 경로를 재현하지 않습니다.';
    let extent=[.8,.8,.8];for(const p of parts){for(const pos of [p.p,p.a,p.b].filter(Boolean))extent=extent.map((v,i)=>Math.max(v,Math.abs(pos[i])+(p.r||0)));}
    return {parts,labels,name,readout,extent,atomic:true};
  }
  return {scene,colors:C};
});
