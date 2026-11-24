'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const H=require('../learning-hydrogen/model.js'),M=require('../learning-mof/model.js');
const {arrayFactor}=require('../learning-electromagnetic/explore.js');
test('molecular vessels conserve six H2 molecules without a metal lattice or hydride uptake',()=>{
  for(const method of ['compressed','liquid'])for(const phase of [0,.25,.5,1]){
    const s=H.scene({...H.defaults(),method,phase});
    assert.equal(s.parts.filter(p=>p.element==='H').length,12);assert.equal(s.parts.filter(p=>p.element==='M').length,0);
    assert.equal(s.parts.filter(p=>p.bondType==='H-H').length,6);assert.equal(s.stored,0);assert.equal(s.hydride,0);
    for(const p of s.parts)for(const v of [p.p,p.a,p.b,p.scale,p.size].filter(Boolean))assert.ok(v.every(Number.isFinite));
    assert.equal(s.parts.some(p=>p.id==='outer-jacket'),method==='liquid');
    assert.equal(H.advance({...H.defaults(),method,playing:true},.1).method,method);
  }
});
test('a blocked dissociation site retains a molecular pair outside with continuous trajectories',()=>{
  for(let n=0;n<=400;n++){
    const s=H.scene({...H.defaults(),chapter:7,impurity:true,coordinate:n/100});
    const blocked=s.parts.filter(p=>p.element==='H'&&p.pair===0);assert.equal(blocked.length,2);assert.ok(blocked.every(p=>p.p[0]>=2.2-1e-10));
    assert.ok(s.parts.find(p=>p.id==='HH-0'));assert.equal(s.parts.filter(p=>p.element==='H').length,12);
    if(n===400)assert.equal(s.stored,10);
  }
  assert.equal(H.respond({...H.defaults(),pressure:.2,step:3,phase:1}).branch,'desorption');
  assert.equal(H.respond({...H.defaults(),pressure:4}).branch,'absorption');
});
test('adsorption tracers keep identities and positions across diffusion, uptake and equilibrium exchange',()=>{
  for(const pressure of [0,.01,.1,1,5])for(const temperature of [.6,1,1.8])for(const species of ['A','B'])for(const size of [.2,1,1.4]){
    const state={...M.defaults(7),pressure,temperature,species,size};
    for(let step=0;step<2;step++){
      const a=M.adsorptionPose(state,step,1).positions,b=M.adsorptionPose(state,step+1,0).positions;
      assert.equal(a.length,b.length);assert.ok(a.every((p,i)=>Math.hypot(...p.map((v,j)=>v-b[i][j]))<1e-10));
    }
    for(const t of [0,.25,.45,.5,.55,.75,1]){
      const pose=M.adsorptionPose(state,2,t);assert.equal(pose.positions.length,pressure>0?12:0);assert.ok(pose.positions.every(p=>p.every(Number.isFinite)));
      const nearby=M.adsorptionPose(state,2,Math.min(1,t+.00001));assert.ok(pose.positions.every((p,i)=>Math.hypot(...p.map((v,j)=>v-nearby.positions[i][j]))<.002));
    }
  }
  const s={...M.defaults(7)},start=M.adsorptionPose(s,2,0),end=M.adsorptionPose(s,2,1);
  assert.ok(start.target>0&&start.target<12);assert.ok(Math.hypot(...end.positions[start.target].map((v,i)=>v-start.positions[0][i]))<1e-10);
  assert.notDeepEqual(end.positions[0],start.positions[0]);assert.equal(end.coverage,start.coverage);
});
test('ideal finite-array interference peaks when propagation and imposed phase increments compensate',()=>{
  for(const wavelength of [400,600,800])for(const pitch of [120,300,600])for(const phase of [-120,-60,0,60,120]){
    const sine=wavelength*phase/(360*pitch);
    for(const angle of [-90,-45,0,45,90]){const r=arrayFactor(wavelength,pitch,phase,angle);assert.ok(r.intensity>=0&&r.intensity<=1);assert.equal(r.phases.length,9);assert.ok(Math.abs(r.intensity-arrayFactor(wavelength,pitch,-phase,-angle).intensity)<1e-12);}
    if(Math.abs(sine)<=1)assert.ok(Math.abs(arrayFactor(wavelength,pitch,phase,Math.asin(sine)*180/Math.PI).intensity-1)<1e-12);
  }
  assert.ok(arrayFactor(600,300,60,0).intensity<.1);
});
