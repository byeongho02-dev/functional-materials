(function(g){
  'use strict';
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,Number(x)||0));
  const lerp=(a,b,t)=>a+(b-a)*t;
  const colors={metal:'#75b9e7',electron:'#80e4ed',proton:'#ee839c',neutron:'#b8c8df',oxygen:'#fa9a83',carbon:'#a2c7ce',ion:'#b89bfa',bone:'#e8d5b6',load:'#ffb779',phase:'#bc9aff',green:'#82dfb5',edge:'#476580'};
  function builder(){const parts=[],labels=[];let n=0;
    const ball=(p,r,color,info,id,scale)=>parts.push({id:id||'p'+n++,kind:'sphere',p,r,color,info,scale,opacity:1});
    const bar=(a,b,r,color,info,id,opacity=1)=>parts.push({id:id||'p'+n++,kind:'bar',a,b,r,color,info,opacity});
    const box=(p,size,color,info,id,opacity=1)=>parts.push({id:id||'p'+n++,kind:'box',p,size,color,info,opacity});
    const path=(points,r,color,info,id)=>{const group=id||'path'+n++;for(let i=1;i<points.length;i++){bar(points[i-1],points[i],r,color,info,group+'-'+i);parts[parts.length-1].group=group;}};
    const arrow=(a,b,color)=>{bar(a,b,.035,color);const d=b.map((v,i)=>v-a[i]),l=Math.hypot(...d)||1,u=d.map(v=>v/l),side=Math.abs(u[1])<.9?[0,1,0]:[1,0,0];bar(b,b.map((v,i)=>v-u[i]*.27+side[i]*.13),.025,color);bar(b,b.map((v,i)=>v-u[i]*.27-side[i]*.13),.025,color);};
    const tag=(text,p)=>labels.push({text,p,id:'label'+labels.length});
    return {parts,labels,ball,bar,box,path,arrow,tag};
  }
  function lattice(b,{n=3,spacing=.8,origin=[-1,-1,-1],type='metal',shear=0,cut=false,highlight=false}={}){
    const sites=[];
    for(let x=0;x<n;x++)for(let y=0;y<n;y++)for(let z=0;z<n;z++){
      if(cut&&z>=(n-1)/2)continue;
      const p=[origin[0]+x*spacing+shear*(y-(n-1)/2),origin[1]+y*spacing,origin[2]+z*spacing],even=(x+y+z)%2===0;
      const label=type==='ionic'?(even?'Na⁺ · 양이온':'Cl⁻ · 음이온'):'금속 원자 · 격자 자리';
      b.ball(p,type==='ionic'?(even?.16:.24):.19,type==='ionic'?(even?colors.metal:colors.ion):colors.metal,{label,detail:type==='ionic'?'3차원에서 반대 전하의 이웃과 상호작용합니다. 선은 가까운 이웃 안내입니다.':'금속 결합은 이 원자 사이 막대 하나가 아니라 비편재화된 전자와 양이온 골격의 집단 상호작용입니다.'},'lattice-'+x+'-'+y+'-'+z);sites.push({p,x,y,z});
    }
    for(const a of sites)for(const c of sites)if(c.x+c.y+c.z===a.x+a.y+a.z+1&&Math.abs(a.x-c.x)+Math.abs(a.y-c.y)+Math.abs(a.z-c.z)===1)b.bar(a.p,c.p,.018,colors.edge,null,null,.7);
    return sites;
  }
  function wire(b,{offset=[0,0,0],bend=0,stretch=1,color=colors.metal,r=.09}={}){
    const points=Array.from({length:49},(_,i)=>{const t=i/48*2-1;return [offset[0]+t*2.1*stretch,offset[1]+bend*(1-t*t)*1.4,offset[2]+Math.sin(t*Math.PI)*bend*.15];});
    b.path(points,r,color,{label:'시편의 거시적 형상',detail:'곡선은 관찰을 위한 형상입니다. 변형률이나 복원력을 실제 합금의 성능으로 계산하지 않습니다.'},'wire-'+offset.join('-'));return points;
  }
  function coil(b,{x=0,y=0,z=0,length=3,turns=7,radius=.4,color=colors.metal,id='coil'}={}){
    b.path(Array.from({length:145},(_,i)=>{const t=i/144,a=t*turns*2*Math.PI;return [x+radius*Math.cos(a),y+(t-.5)*length,z+radius*Math.sin(a)];}),.055,color,{label:id==='coil'?'SMA 코일':'편향 스프링',detail:'코일 길이는 상분율·편향 장치·구속 조건의 관계를 보여 주는 정성적 형상입니다.'},id);
  }
  function specimen(b,{strain=0,neck=0,fracture=false,x=0,color=colors.metal}={}){
    const length=3*(1+strain),r=.35*(1-neck*.72);
    b.bar([x,-length/2,0],[x,length/2,0],r,color,{label:'인장 시험편',detail:'목 줄어듦과 파단은 개념적인 형상 변화이며 실제 재료의 파괴 해석이 아닙니다.'},'specimen');
    if(fracture){b.parts.pop();b.bar([x,-length/2-.15,0],[x,-.14,0],r,color);b.bar([x,.14,0],[x,length/2+.15,0],r,color);}
    for(const sign of [-1,1]){b.box([x,sign*(length/2+.32),0],[1,.55,.75],'#54728b',{label:'시험기 그립',detail:'시편 양끝을 잡고 축 방향으로 하중을 전달합니다.'});b.arrow([x,sign*(length/2+.6),0],[x,sign*(length/2+1.05),0],colors.load);}
  }
  const api={clamp,lerp,colors,builder,lattice,wire,coil,specimen};
  if(typeof module==='object'&&module.exports)module.exports=api;else g.LearningGeometry=api;
})(typeof window==='object'?window:globalThis);
