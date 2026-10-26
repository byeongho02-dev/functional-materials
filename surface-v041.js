/* ALE Surface V0.4.1 — visualization of existing ALEEngine state.
 * Representational 7×3 surface patch; emitted atoms are EXACT removalIds from engine.
 * Not a true Si(100) reconstruction, plasma chemistry solver, or MD trajectory.
 */
(function(root){
'use strict';
const TAU=Math.PI*2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const phases=[900,420,900,820];
function label(c,t,x,y,size=12,color='#b8d3e8',align='left',weight=650){
  c.font=weight+' '+size+'px system-ui,sans-serif';c.textAlign=align;c.fillStyle=color;c.fillText(t,x,y);c.textAlign='left';
}
function sphere(c,x,y,r,col,outline='#b6defc76'){
  if(r<=0)return;
  const gradient=c.createRadialGradient(x-r*.42,y-r*.45,0,x,y,r);
  gradient.addColorStop(0,'#f4fbff');
  gradient.addColorStop(.17,col);
  gradient.addColorStop(1,col);
  c.fillStyle=gradient;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();
  c.strokeStyle=outline;c.lineWidth=1;c.stroke();
}
function stroke(c,x1,y1,x2,y2,col,w=2){
  c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();
}
function render(canvas,state,engine,time){
  const c=canvas.getContext('2d'),rect=canvas.getBoundingClientRect(),w=rect.width,h=rect.height;
  if(w<10||h<10)return;
  const dpr=Math.min(2,root.devicePixelRatio||1);
  c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);
  const back=c.createLinearGradient(0,0,0,h);back.addColorStop(0,'#102a43');back.addColorStop(.63,'#091e34');back.addColorStop(1,'#081728');c.fillStyle=back;c.fillRect(0,0,w,h);
  // Very restrained depth grid to leave maximum contrast for the reaction sites.
  c.strokeStyle='#709ecb0b';c.lineWidth=1;
  for(let k=0;k<9;k++){
    const y=h*.33+k*h*.078;c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();
  }
  const phase=state.running?state.phaseIndex:-1;
  const hasPlan=!!state.plan;
  const plan=state.plan||{};
  const remove=new Set(plan.removalIds||[]);
  const modified=new Set(plan.modifiedIds||[]);
  const adsorbed=new Set(plan.adsorbedIds||[]);
  const targets=(plan.removalIds||[]).map(id=>engine.atoms.find(a=>a.id===id)).filter(Boolean);
  const target=targets[0]||(plan.adsorbedIds||[]).map(id=>engine.atoms.find(a=>a.id===id)).find(Boolean)||null;
  const focusCol=target?clamp(target.col,3,4):3;
  const focusRow=target?clamp(target.row,1,6):3;
  const cols=Array.from({length:7},(_,i)=>focusCol-3+i);
  const rows=[focusRow-1,focusRow,focusRow+1];
  const topMap=new Map(engine.getSurfaceAtoms().map(a=>[a.col+':'+a.row,a]));
  const positions=new Map();
  const units=clamp(w/780,.55,1.05)*state.zoom;
  const spacing=clamp(w/10.5,34,57)*clamp(state.zoom,.82,1.23);
  const stepR=clamp(h/12,19,26)*clamp(state.zoom,.9,1.12);
  const stepL=clamp(h/9.8,25,39)*clamp(state.zoom,.9,1.16);
  const yaw=clamp((state.rotationY+.62)*.24,-.45,.45);
  const pitch=clamp((state.rotationX-.73)*.14,-.10,.10);
  const baseX=w*.50;
  const baseY=h*.49;
  function projected(col,row,dep=0,layerOffset=0) {
    const dx=(col-focusCol),dy=(row-focusRow);
    const x=baseX+dx*spacing+dy*spacing*.20+dy*yaw*16;
    const y=baseY+dy*stepR+dx*yaw*13+dep*stepL+layerOffset*stepL*.43+dx*pitch*5;
    return {x,y};
  }
  // Faint slab footprint ties the planes together without hundreds of fake 3D bonds.
  const left=projected(cols[0],rows[0],2.65),right=projected(cols[6],rows[0],2.65);
  const farRight=projected(cols[6],rows[2],2.65),farLeft=projected(cols[0],rows[2],2.65);
  c.fillStyle='#2d57732b';c.strokeStyle='#49789643';c.lineWidth=1.5;
  c.beginPath();c.moveTo(left.x-12,left.y+13);c.lineTo(right.x+12,right.y+13);c.lineTo(farRight.x+12,farRight.y+13);c.lineTo(farLeft.x-12,farLeft.y+13);c.closePath();c.fill();c.stroke();
  label(c,'SURFACE REACTION · LOCAL ATOMIC WINDOW',16,23,10,'#9dc6e5');
  const subtitle=phase===0?'Cl ADSORPTION':phase===1?'MODIFIED SURFACE':phase===2?'Ar⁺ ION ACTIVATION':phase===3?'SiClₓ DESORPTION':state.running?'READY':'Si SURFACE';
  label(c,subtitle,w-16,23,11,phase>=2?'#f1b479':'#8de3c4','right');
  // Approximate lower substrate: only two layers rather than all 20.
  for(let depth=2;depth>=1;depth--){
    for(const row of rows){
      for(const col of cols){
        const top=topMap.get(col+':'+row);
        if(!top)continue;
        const p=projected(col,row,depth,Math.min(2,top.layer));
        if(col<cols[6]){
          const q=projected(col+1,row,depth,Math.min(2,top.layer));
          stroke(c,p.x,p.y,q.x,q.y,'#497aab4e',1.4);
        }
        if(row<rows[2]){
          const q=projected(col,row+1,depth,Math.min(2,top.layer));
          stroke(c,p.x,p.y,q.x,q.y,'#497aab36',1.4);
        }
        sphere(c,p.x,p.y,7.5*units,depth===1?'#356c9f':'#274f78','#75aeec46');
        if(depth===1)positions.set('lower-'+top.id,{atom:top,x:p.x,y:p.y});
      }
    }
  }
  // Surface bonds and visible individual sites.
  for(const row of rows){
    for(const col of cols){
      const atom=topMap.get(col+':'+row);if(!atom)continue;
      const a=projected(col,row,0,Math.min(2,atom.layer));
      positions.set(atom.id,{atom,x:a.x,y:a.y});
      if(col<cols[6]){
        const b=topMap.get((col+1)+':'+row);
        if(b){const p=projected(col+1,row,0,Math.min(2,b.layer));stroke(c,a.x,a.y,p.x,p.y,'#79b1e99c',2.3)}
      }
      if(row<rows[2]){
        const b=topMap.get(col+':'+(row+1));
        if(b){const p=projected(col,row+1,0,Math.min(2,b.layer));stroke(c,a.x,a.y,p.x,p.y,'#83b6e680',2)}
      }
    }
  }
  let firstHit=null;
  state.projectedAtoms=[];
  for(const row of rows){
    for(const col of cols){
      const atom=topMap.get(col+':'+row);if(!atom)continue;
      const loc=positions.get(atom.id),isRemoving=remove.has(atom.id);
      const progress=phase===3?clamp(state.phaseElapsed/phases[3],0,1):0;
      // Ejecting top atoms must be visibly absent from the lattice as phase 4 proceeds.
      if(!(isRemoving&&phase===3&&progress>.12)){
        const color=modified.has(atom.id)&&phase>=0&&phase!==-1?'#a885eb':'#559cea';
        const radius=(isRemoving&&phase===2?15:12)*units;
        if(isRemoving&&phase===2){c.beginPath();c.arc(loc.x,loc.y,22*units,0,TAU);c.strokeStyle='#f5b375ba';c.lineWidth=2;c.stroke();}
        sphere(c,loc.x,loc.y,radius,color,'#c4e6ff85');
      }else{
        sphere(c,loc.x,loc.y+8*progress,6*units,'#254e79','#7890b757');
      }
      state.projectedAtoms.push({atom,x:loc.x,y:loc.y,radius:Math.max(9,16*units)});
      // Surface Cl remains during purge, then leaves with removed species.
      const clOn=adsorbed.has(atom.id)&&phase>=0&&(phase!==3||!isRemoving);
      const fraction=phase===0?(()=>{
        const p=clamp(state.phaseElapsed/(state.adsorptionDurationMs||phases[0]),0,1);
        const estimate=root.ALEModel&&root.ALEModel.estimateCoveragePct;
        if(!estimate||!state.plan)return p;
        const flux=state.plan.plasma.radicalFluxIndex,full=estimate(state.exposureTimeS,flux);
        return full>0?clamp(estimate(state.exposureTimeS*p,flux)/full,0,1):0;
      })():1;
      if(clOn&&((atom.col*17+atom.row*13)%19)/19<=fraction){
        const bondY=loc.y-17*units;
        stroke(c,loc.x,loc.y-9*units,loc.x,bondY,'#72dfb79a',2);
        sphere(c,loc.x,bondY-7*units,6.6*units,'#56d2a1','#c6ffe8b8');
      }else if(phase===0&&modified.has(atom.id)){
        const t=(time*.00032+((atom.col+atom.row)%5)*.17)%1;
        sphere(c,loc.x+(1-t)*16,loc.y-62*units+t*39*units,3.7*units,'#68dba8');
      }
      if(isRemoving&&!firstHit)firstHit=loc;
    }
  }
  const elapsed=state.phaseElapsed||0;
  if(phase===2&&firstHit){
    // Sparse Ar+ trails land at confirmed upcoming removal sites.
    const visibleTargets=targets.map(a=>positions.get(a.id)).filter(Boolean).slice(0,3);
    visibleTargets.forEach((loc,index)=>{
      const flight=(elapsed*.00135+index*.24)%1;
      const x=loc.x+(index-1)*6*units;
      const y=loc.y-130*units+flight*105*units;
      stroke(c,x,y-18*units,x,y+2*units,'#ffbb74',3.2*units);
      sphere(c,x,y,7.3*units,'#ffa65f','#ffe5c38c');
      if(flight>.8){
        c.beginPath();c.arc(loc.x,loc.y,18*units+15*units*(flight-.8)*5,0,TAU);
        c.strokeStyle='rgba(255,183,99,'+(1-(flight-.8)*4)+')';c.lineWidth=2.2;c.stroke();
      }
    });
    const loc=visibleTargets[0];
    if(loc){
      label(c,'Ar⁺ IMPACT',Math.min(w-18,loc.x+14*units),loc.y-105*units,11,'#ffd4a9','right');
      stroke(c,loc.x,loc.y-88*units,loc.x,loc.y-46*units,'#ffc18e6e',1.4);
    }
  }
  if(phase===3&&targets.length){
    const progress=clamp(elapsed/phases[3],0,1);
    targets.map(a=>positions.get(a.id)).filter(Boolean).slice(0,3).forEach((loc,index)=>{
      const p=clamp((progress-index*.12)/.84,0,1);
      if(p<=0)return;
      const y=loc.y-p*155*units,x=loc.x+Math.sin(p*3.1+index)*22*units;
      c.strokeStyle='rgba(255,165,104,'+(1-p)+')';c.lineWidth=3;c.beginPath();
      c.moveTo(loc.x,loc.y-4*units);c.quadraticCurveTo(x+7*units,y+36*units,x,y+9*units);c.stroke();
      sphere(c,x,y,12*units,'#f28b74','#ffe9d5');
      sphere(c,x+13*units,y-12*units,6.8*units,'#66dbaf','#effff1');
      stroke(c,x+6*units,y-5*units,x+10*units,y-8*units,'#f0cebf',2);
      if(index===0)label(c,'SiClₓ ↑',Math.min(w-85,x+22*units),Math.max(37,y-14*units),13,'#ffcb9a');
    });
  }
  if(phase===3&&!targets.length)label(c,'NO MODELED REMOVAL THIS CYCLE',w*.5,h*.30,12,'#e3b69c','center');
  if(phase===-1&&engine.currentCycle>0)label(c,'SURFACE UPDATED AFTER '+engine.currentCycle+' CYCLE'+(engine.currentCycle===1?'':'S'),w*.5,h*.31,11,'#81ddbc','center');
  // Diagnostic but not quantitative: patch location and removed-site count.
  label(c,'7×3 representative surface patch · Si sites from model',15,h-26,10,'#849eb7');
  label(c,'Removal sites: '+(plan.removalIds||[]).length+' (full model)',15,h-10,9,'#6f92ad');
  if(phase===0)label(c,'Cl EXPOSURE '+state.exposureTimeS.toFixed(1)+' s',w-15,h-10,10,'#83e1b5','right');
}
root.ALESurfaceV041={render};
})(window);
