(function(g){
  'use strict';
  const c=(x,a,b)=>Math.max(a,Math.min(b,Number(x)||0)),NA=6.02214076e23;
  const elements={H:{z:1,n:0,shell:[1],config:'1s¹'},C:{z:6,n:6,shell:[2,4],config:'1s² 2s² 2p²'},O:{z:8,n:8,shell:[2,6],config:'1s² 2s² 2p⁴'},Na:{z:11,n:12,shell:[2,8,1],config:'1s² 2s² 2p⁶ 3s¹'},Cl:{z:17,n:18,shell:[2,8,7],config:'1s² 2s² 2p⁶ 3s² 3p⁵'},Si:{z:14,n:14,shell:[2,8,4],config:'1s² 2s² 2p⁶ 3s² 3p²'}};
  const molarMass={H:1.008,C:12.01,O:16,Na:22.99,Cl:35.45,Si:28.09};
  function defaults(){return {chapter:0,step:0,phase:0,playing:false,element:'Si',mode:'metal',sensor:'thermistor',kind:'NTC',temperature:.5,light:.5,bias:'reverse',mol:1,nucleus:true,electrons:true,cutaway:false,transparent:false,diameter:1,pairDistance:1.35,selection:null};}
  function gasResistance(u){u=c(u,0,3);return u<1?1+u*1.5:u<2?2.5:2.5-(u-2)*1.5;}
  function derive(s){const e=elements[s.element]||elements.Si,t=c(s.temperature,0,1),u=c((s.step+s.phase)*(s.sensor==='gas'?.75:1),0,3);
    const resistance=s.sensor==='gas'?gasResistance(u):s.kind==='PTC'?1+2*t:Math.exp(-2*t);
    return {element:e,NA,entities:c(s.mol,0,2)*NA,mass:c(s.mol,0,2)*(molarMass[s.element]||28.09),molarMass:molarMass[s.element]||28.09,valence:e.shell.at(-1),resistance,barrier:s.bias==='forward'?.3:s.bias==='reverse'?1.4:.8,photoSignal:c(s.light,0,1),u};
  }
  function advance(s,dt){if(!s.playing)return s;const o={...s,phase:s.phase+c(dt,0,.1)/2.6};if(o.phase>=1){o.phase=0;if(o.step<3)o.step++;else{o.phase=1;o.playing=false;}}return o;}
  const api={elements,molarMass,NA,gasResistance,defaults,derive,advance};if(typeof module==='object'&&module.exports)module.exports=api;else(g.LearningModels||(g.LearningModels={}))[1]=api;
})(typeof window==='object'?window:globalThis);
