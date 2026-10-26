(function(root){
  'use strict';
  const TAU=Math.PI*2;
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  function line(c,x1,y1,x2,y2,col,w=2,dash=[]){
    c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.strokeStyle=col;c.lineWidth=w;c.setLineDash(dash);c.stroke();c.setLineDash([]);
  }
  function label(c,text,x,y,col,size=11,align='left'){
    c.font='600 '+size+'px system-ui,sans-serif';c.fillStyle=col;c.textAlign=align;c.fillText(text,x,y);c.textAlign='left';
  }
  function ball(c,x,y,r,col){
    const g=c.createRadialGradient(x-r*.35,y-r*.35,0,x,y,r);
    g.addColorStop(0,'#efffff');g.addColorStop(.27,col);g.addColorStop(1,col);
    c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();
  }
  function render(canvas,state,time){
    if(!canvas)return;
    const rect=canvas.getBoundingClientRect(),w=rect.width,h=rect.height;
    if(w<10||h<10)return;
    const dpr=Math.min(2,root.devicePixelRatio||1),pw=Math.round(w*dpr),ph=Math.round(h*dpr);
    if(canvas.width!==pw||canvas.height!==ph){canvas.width=pw;canvas.height=ph;}
    const c=canvas.getContext('2d');
    c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);
    const bg=c.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#0c1e34');bg.addColorStop(1,'#081523');c.fillStyle=bg;c.fillRect(0,0,w,h);
    const phase=state.running?state.phaseIndex:-1;
    const on=state.sourcePowerW>0,ads=phase===0&&on,act=phase===2&&on,purge=phase===1||phase===3;
    const cx=w*.5,rx=w*.35,top=h*.15,bottom=h*.82;
    c.beginPath();c.moveTo(cx-rx,top);c.lineTo(cx+rx,top);
    c.quadraticCurveTo(cx+rx+15,top,cx+rx+15,top+15);c.lineTo(cx+rx+15,h*.43);
    c.bezierCurveTo(cx+rx+15,h*.60,cx+rx*.62,bottom,cx+rx*.54,bottom);
    c.lineTo(cx-rx*.54,bottom);c.bezierCurveTo(cx-rx*.62,bottom,cx-rx-15,h*.60,cx-rx-15,h*.43);
    c.lineTo(cx-rx-15,top+15);c.quadraticCurveTo(cx-rx-15,top,cx-rx,top);c.closePath();
    const shell=c.createLinearGradient(cx-rx,0,cx+rx,0);shell.addColorStop(0,'#173750');shell.addColorStop(.22,'#102840');shell.addColorStop(.78,'#0c2036');shell.addColorStop(1,'#244766');
    c.fillStyle=shell;c.fill();c.strokeStyle='#76b0d060';c.lineWidth=2;c.stroke();
    // External ICP coil, kept separate from the plasma light region.
    line(c,cx-rx*.51,top-9,cx+rx*.51,top-9,'#6b9cbd',5);
    for(let i=-2;i<=2;i++)line(c,cx+i*rx*.19,top-20,cx+(i+.12)*rx*.19,top-20,'#52c5df',3);
    label(c,'ICP COIL',cx,top-26,'#87bcd9',10,'center');
    if(ads||act){
      const intensity=clamp(state.sourcePowerW/600,.1,1);
      c.save();c.translate(cx,h*.41);c.scale(rx*.86,h*.25);
      const g=c.createRadialGradient(0,0,.01,0,0,1),rgb=ads?'64,216,198':'159,132,252';
      g.addColorStop(0,'rgba('+rgb+','+(.34+intensity*.29)+')');
      g.addColorStop(.58,'rgba('+rgb+','+(.16+intensity*.15)+')');
      g.addColorStop(1,'rgba('+rgb+',0)');
      c.fillStyle=g;c.beginPath();c.arc(0,0,1,0,TAU);c.fill();c.restore();
      const n=Math.floor(14+state.sourcePowerW/25);
      for(let i=0;i<n;i++){
        const t=time*.00017,seed=i*23.17;
        const px=cx+Math.sin(seed+t*(i%4+1))*rx*.74;
        const py=h*(.32+.28*(.5+.5*Math.sin(seed*.47+t*2)));
        ball(c,px,py,i%4===0?2.5:1.6,ads?'#6de5ce':i%3?'#9b96ff':'#a1d7ff');
      }
    }
    const nozzleY=top+h*.105,inL=cx-rx-15,inR=cx+rx+15;
    line(c,inL-25,nozzleY,inL+14,nozzleY,'#55c2dc',3);
    line(c,inR-14,nozzleY,inR+25,nozzleY,'#55c2dc',3);
    if(ads)label(c,'Cl FEED',Math.max(8,inL-24),nozzleY-10,'#79e6c2',9);
    else if(act)label(c,'Ar FEED',Math.min(w-64,inR-34),nozzleY-10,'#f0c095',9);
    else label(c,purge?'PURGE / EXHAUST':'PROCESS GAS',cx,nozzleY,'#8aa9c0',9,'center');
    const waferY=h*.72,half=rx*.59;
    if(act){
      line(c,cx-half,waferY-21,cx+half,waferY-21,'#f9af7377',1.5,[5,4]);
      label(c,'SHEATH',cx,waferY-28,'#f0b589',9,'center');
    }
    c.beginPath();c.ellipse(cx,waferY+12,half*1.17,9,0,0,TAU);c.fillStyle='#07111d';c.fill();
    const wg=c.createLinearGradient(cx-half,0,cx+half,0);
    wg.addColorStop(0,'#297faf');wg.addColorStop(.52,'#88cfff');wg.addColorStop(1,'#285d8e');
    c.beginPath();c.roundRect(cx-half,waferY-5,half*2,19,8);c.fillStyle=wg;c.fill();c.strokeStyle='#a3d7fa';c.lineWidth=1.4;c.stroke();
    c.fillStyle='#1b3553';c.fillRect(cx-half*.32,waferY+15,half*.64,h*.08);
    label(c,'Si(100) WAFER',cx,waferY+40,'#9ecdeb',10,'center');
    if(ads||act){
      const n=act?clamp(Math.round(state.ionEnergyEv/17),2,7):7,col=ads?'#78e8b1':'#ffb66d';
      for(let i=0;i<n;i++){
        const t=(time*.00032+i/n)%1;
        const px=cx+((i+.5)/n-.5)*half*1.7;
        const py=h*.35+(waferY-h*.35-10)*t;
        line(c,px,py-(act?14:7),px,py,col,act?2.4:1.6);ball(c,px,py,act?4.5:3,col);
      }
    }
    if(purge){
      for(let i=0;i<5;i++){
        const t=(time*.00022+i/5)%1;
        ball(c,cx+(i%2?1:-1)*(rx*.18+t*rx*.44),waferY-12-t*h*.20,2.7,'#7bd8c0');
      }
    }
    const ex=cx+rx*.70,ey=h*.88;
    line(c,ex,ey,ex+rx*.25,ey,'#6384a4',3);
    if(purge)label(c,'EXHAUST',ex-rx*.16,ey+15,'#86c6b7',9);
    const desc=!state.running?'READY · PLASMA OFF':ads?'Cl ADSORPTION · PLASMA ON':phase===1?'PURGE · PLASMA OFF':act?'Ar⁺ ACTIVATION · BIAS ON':'FINAL PURGE · PLASMA OFF';
    label(c,desc,10,h-13,ads||act?'#a7f3de':'#94acc0',10);
    label(c,'CONCEPTUAL ICP CUTAWAY',Math.max(10,w-163),h-13,'#7891a8',9);
  }
  root.ALEChamber={render};
})(window);
