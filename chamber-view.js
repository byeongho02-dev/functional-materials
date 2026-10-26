/* ICP schematic rendering for ALE V0.4.1.
 * Reactive feed, glow, sheath, ion flux and exhaust are qualitative visual cues.
 */
(function(root){
  'use strict';
  const TAU=Math.PI*2;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function line(c,x1,y1,x2,y2,color,width=2,dash=[]){
    c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.strokeStyle=color;c.lineWidth=width;c.setLineDash(dash);c.stroke();c.setLineDash([]);
  }
  function txt(c,t,x,y,size=10,color='#b7d1e6',align='left'){
    c.font='650 '+size+'px system-ui,sans-serif';c.fillStyle=color;c.textAlign=align;c.fillText(t,x,y);c.textAlign='left';
  }
  function dot(c,x,y,r,color){
    const g=c.createRadialGradient(x-r*.35,y-r*.4,0,x,y,r);
    g.addColorStop(0,'#fff9ed');g.addColorStop(.18,color);g.addColorStop(1,color);
    c.beginPath();c.arc(x,y,r,0,TAU);c.fillStyle=g;c.fill();
  }
  function flow(c,x1,y1,x2,y2,p,col,width=2){
    const x=x1+(x2-x1)*p, y=y1+(y2-y1)*p;
    line(c,x-(x2-x1)*.045,y-(y2-y1)*.045,x,y,col,width);
    dot(c,x,y,width+1,col);
  }
  function render(canvas,state,time){
    if(!canvas)return;
    const bounds=canvas.getBoundingClientRect();
    const w=bounds.width,h=bounds.height;
    if(w<10||h<10)return;
    const dpr=Math.min(2,root.devicePixelRatio||1);
    const pxW=Math.max(1,Math.round(w*dpr)),pxH=Math.max(1,Math.round(h*dpr));
    if(canvas.width!==pxW||canvas.height!==pxH){canvas.width=pxW;canvas.height=pxH;}
    const c=canvas.getContext('2d');
    c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);
    const bg=c.createLinearGradient(0,0,0,h);
    bg.addColorStop(0,'#0c1b2d');bg.addColorStop(1,'#081625');
    c.fillStyle=bg;c.fillRect(0,0,w,h);
    const ph=state.running?state.phaseIndex:-1;
    const enabled=state.sourcePowerW>0;
    const cl=ph===0&&enabled&&state.exposureTimeS>0;
    const ar=ph===2&&enabled;
    const purge=ph===1||ph===3;
    const t=time*.001;
    const chamberLeft=w*.16,chamberRight=w*.84;
    const top=h*.26,base=h*.82;
    const cx=w*.5,insideWidth=chamberRight-chamberLeft;
    const waferY=h*.73;
    const tiny=w<490;
    const lab=Math.max(8,Math.min(11,w/63));
    // A slight frame shadow gives steel body visual depth without a distracting outline.
    c.shadowColor='#000b18';c.shadowBlur=12;
    c.beginPath();
    c.moveTo(chamberLeft+18,top);c.lineTo(chamberRight-18,top);
    c.quadraticCurveTo(chamberRight,top,chamberRight,top+18);
    c.lineTo(chamberRight,base-37);
    c.quadraticCurveTo(chamberRight,base,chamberRight-38,base);
    c.lineTo(chamberLeft+38,base);
    c.quadraticCurveTo(chamberLeft,base,chamberLeft,base-37);
    c.lineTo(chamberLeft,top+18);c.quadraticCurveTo(chamberLeft,top,chamberLeft+18,top);c.closePath();
    const wall=c.createLinearGradient(chamberLeft,0,chamberRight,0);
    wall.addColorStop(0,'#244a63');wall.addColorStop(.05,'#0e2a42');
    wall.addColorStop(.5,'#0c2237');wall.addColorStop(.94,'#0c2942');wall.addColorStop(1,'#34526b');
    c.fillStyle=wall;c.fill();c.shadowBlur=0;c.lineWidth=2.5;c.strokeStyle='#7eb3d058';c.stroke();
    // Plasma only inside the window, scaled qualitatively by source-power setpoint.
    c.save();c.clip();
    if(cl||ar){
      const power=clamp(state.sourcePowerW/600,.12,1);
      const rad=c.createRadialGradient(cx,h*.46,3,cx,h*.48,insideWidth*.43);
      const v=cl?'75,216,190':'172,132,255';
      rad.addColorStop(0,'rgba('+v+','+(.29+power*.26)+')');
      rad.addColorStop(.45,'rgba('+v+','+(.14+power*.14)+')');
      rad.addColorStop(1,'rgba('+v+',0)');
      c.fillStyle=rad;c.fillRect(chamberLeft,top,insideWidth,base-top);
      // Moving charged species, small and sparse to avoid depicting a static speckled cloud.
      const count=Math.round(12+power*20);
      for(let i=0;i<count;i++){
        const u=i*1.618,tick=t*(.32+(i%5)*.07);
        const x=cx+Math.sin(u*3.72+tick)*(insideWidth*.37);
        const y=top+27+(base-top-83)*(.5+.5*Math.sin(i*3.37+tick*.9));
        c.globalAlpha=.5+.35*(.5+.5*Math.sin(tick+i*4.2));
        dot(c,x,y,i%5===0?2.5:1.5,cl?'#85ecd1':i%4===0?'#e1c5ff':'#b49cff');
      }
      c.globalAlpha=1;
    }
    c.restore();
    // Quartz dome / window line and RF coil distinct from glow.
    const coilY=top-23;
    line(c,chamberLeft+35,top+4,chamberRight-35,top+4,'#91bad078',2.5);
    c.beginPath();c.roundRect(cx-insideWidth*.26,coilY-7,insideWidth*.52,10,4);
    c.fillStyle='#426b8f';c.fill();
    for(let i=-2;i<=2;i++){
      const x=cx+i*insideWidth*.08;
      line(c,x-13,coilY-10,x+13,coilY-10,'#5fe0ed',2.2);
    }
    txt(c,'ICP SOURCE',cx,coilY-17,lab,'#9ac9df','center');
    txt(c,'QUARTZ WINDOW',cx,top+23,lab-1,'#8db5d4','center');
    // Opposing feed nozzles with clear direction.
    const inletY=h*.43;
    line(c,chamberLeft-31,inletY,chamberLeft+18,inletY,'#60b5d7',5);
    line(c,chamberRight-18,inletY,chamberRight+31,inletY,'#60b5d7',5);
    txt(c,cl?'Cl FEED':ar?'Cl OFF':'FEED',chamberLeft-25,inletY-12,lab-1,cl?'#8df3cc':'#82a0b6');
    txt(c,ar?'Ar FEED':purge?'Ar PURGE':'Ar LINE',chamberRight-36,inletY-12,lab-1,ar?'#ffbb8f':'#82a0b6');
    if(cl)for(let i=0;i<4;i++){flow(c,chamberLeft+16,inletY,cx-7,h*.55,(t*.23+i*.25)%1,'#65e2bd',1.9);}
    if(ar)for(let i=0;i<4;i++){flow(c,chamberRight-16,inletY,cx+7,h*.53,(t*.23+i*.25)%1,'#f8bb80',1.9);}
    // Ion sheath and trajectories are restricted to Ar activation.
    const waferHalf=insideWidth*.31;
    if(ar){
      line(c,cx-waferHalf,waferY-22,cx+waferHalf,waferY-22,'#ffc08798',2,[5,5]);
      txt(c,'SHEATH',cx,waferY-27,lab-1,'#ffcea4','center');
      const count=clamp(Math.round(state.ionEnergyEv/17),3,8);
      for(let i=0;i<count;i++){
        const x=cx+((i+.5)/count-.5)*waferHalf*1.7;
        const p=(t*.28+i/count)%1;
        const y=h*.49+(waferY-12-h*.49)*p;
        line(c,x,y-11,x,y+2,'#f9ac72',2.6);
        dot(c,x,y+1,3.4,'#ffbd7c');
      }
    }else if(cl){
      const count=7;
      for(let i=0;i<count;i++){
        const x=cx+((i+.5)/count-.5)*waferHalf*1.7;
        const p=(t*.19+i/count)%1;
        const y=h*.53+(waferY-h*.53-10)*p;
        dot(c,x,y,2.9,'#88f1c8');
      }
    }
    // Silicon wafer, holder, and bias electrode remain visible in all four stages.
    c.beginPath();c.ellipse(cx,waferY+15,waferHalf*1.23,9,0,0,TAU);c.fillStyle='#041421';c.fill();
    const wgrad=c.createLinearGradient(cx-waferHalf,0,cx+waferHalf,0);
    wgrad.addColorStop(0,'#24668f');wgrad.addColorStop(.45,'#82c4ed');wgrad.addColorStop(1,'#27628d');
    c.beginPath();c.roundRect(cx-waferHalf,waferY-7,waferHalf*2,15,7);
    c.fillStyle=wgrad;c.fill();c.strokeStyle='#a8d9ff';c.lineWidth=1.2;c.stroke();
    c.fillStyle='#173853';c.fillRect(cx-waferHalf*.5,waferY+9,waferHalf,h*.07);
    txt(c,'Si(100) WAFER',cx,waferY+29,lab,'#caeeff','center');
    if(ar)txt(c,'BIAS ON',cx,waferY+44,lab-1,'#ffbf83','center');
    // Pumping duct and small tracked exhaust particles for both purge steps.
    const exitX=chamberRight-insideWidth*.08,exitY=base+6;
    line(c,exitX,exitY,exitX+insideWidth*.17,exitY,'#607f9d',4);
    if(purge){
      for(let i=0;i<5;i++){
        const p=(t*.22+i*.2)%1;
        const x=cx+(exitX-cx)*p;
        const y=waferY-10+(exitY-waferY+10)*p;
        dot(c,x,y,2.4,ph===3?'#ffbf8e':'#81e5c6');
      }
      txt(c,'EXHAUST',Math.min(w-10,exitX+insideWidth*.15),exitY-10,lab-1,'#98c8d8','right');
    }
    const status=cl?'Cl EXPOSURE · SURFACE MODIFICATION':ar?'Ar⁺ ACTIVATION · DIRECTIONAL IONS':phaseText(ph,enabled);
    txt(c,status,12,h-14,lab,cl?'#a6f4d2':ar?'#ffd0a4':'#9cb9ce');
    txt(c,'SCHEMATIC · NOT TO SCALE',w-12,h-14,Math.max(8,lab-1),'#6689a5','right');
  }
  function phaseText(ph,enabled){
    if(ph===1)return 'PURGE 1 · UNREACTED GAS OUT';
    if(ph===3)return 'PURGE 2 · BY-PRODUCTS OUT';
    if(!enabled)return 'SOURCE POWER OFF';
    return 'READY · PLASMA OFF';
  }
  root.ALEChamber={render};
})(window);
