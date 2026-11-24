(function(g){
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
  function defaults(){return {chapter:0,step:0,phase:0,playing:false,material:'Ti',ratio:3,load:100,strain:.001,young:100,poisson:.3,porosity:20,mode:'ductile',cutaway:false,transparent:false,selection:null};}
  // Linear parallel members: GPa -> N/mm²; dimensions are illustrative inputs.
  function parallel({ratio=3,load=100,implantE=null}={}){const Eb=10,Ab=100,Ai=25,L=100,Ei=implantE===null?Eb*clamp(ratio,.5,12):implantE,kb=Eb*1000*Ab/L,ki=Ei*1000*Ai/L,total=kb+ki,F=clamp(load,0,200);return {Eb,Ei,Ab,Ai,L,kb,ki,boneForce:F*kb/total,implantForce:F*ki/total,delta:F/total,totalForce:F};}
  function elastic(s){const E=clamp(s.young,20,200)*1000,epsilon=clamp(s.strain,0,.002),L0=100,A0=10,nu=.3;return {E,epsilon,L0,A0,nu,stress:E*epsilon,force:E*epsilon*A0,delta:L0*epsilon,area:A0*(1-nu*epsilon)**2};}
  function derive(s){const p=clamp(s.porosity,0,40),removed=Math.round(216*p/100);return {parallel:parallel({ratio:s.ratio,load:s.load,implantE:s.chapter===3?(s.material==='SUS316L'?161:58):null}),elastic:elastic(s),removed,porosity:removed/216*100,full:216,u:clamp((s.step+s.phase)*(s.chapter===5?.75:1),0,3)};}
  function advance(s,dt){if(!s.playing)return s;const o={...s,phase:s.phase+clamp(dt,0,.1)/2.8};if(o.phase>=1){o.phase=0;if(o.step<3)o.step++;else{o.phase=1;o.playing=false;}}return o;}
  const api={defaults,derive,parallel,elastic,advance};if(typeof module==='object'&&module.exports)module.exports=api;else(g.LearningModels||(g.LearningModels={}))[2]=api;
})(typeof window==='object'?window:globalThis);
