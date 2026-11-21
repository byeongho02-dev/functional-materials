/* Run: node tests/mof.test.cjs. Optional DOM suite: NODE_PATH=<linkedom installation> node tests/mof.test.cjs */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const base=path.resolve(__dirname,'../learning-mof');
const M=require(path.join(base,'model.js'));
const molecular=require(path.join(base,'molecular.js'))(M);
const L=require(path.join(base,'learning.js'));
let checks=0;
function ok(v,m){assert.ok(v,m);checks++;}
function eq(a,b,m){assert.equal(a,b,m);checks++;}
function near(a,b,m){ok(Math.abs(a-b)<1e-10,m);}
near(M.volume(1.8).volume,5.832,'Requested cubic geometry');
eq(L.lessons.length,9,'All topics retain their learning guidance');
for(const lesson of L.lessons)for(const id of lesson.sources)ok(L.references.some(r=>r.id===id),'Referenced source exists');
eq(M.scene({...M.defaults(7),pressure:0},1).parts.filter(p=>p.id.startsWith('gas-')).length,0,'Zero model pressure has no illustrated gas particles');
const bdc=molecular.scene({...M.defaults(0),focus:'linker',hydrogen:true});
for(const [element,count]of [['C',8],['H',4],['O',4]])eq(bdc.parts.filter(p=>p.atom===element).length,count,'BDC component composition '+element);
const sbu=molecular.scene({...M.defaults(0),focus:'node'});
for(const [element,count]of [['Zn',4],['O',13],['C',6]])eq(sbu.parts.filter(p=>p.atom===element).length,count,'Zn4O(COO)6 component composition '+element);
for(const chapter of [0,1,2])for(let step=0;step<M.chapters[chapter].scenes.length;step++)for(const phase of [0,.5,1]){
  const model=molecular.scene({...M.defaults(chapter),step,explode:.3},phase);
  eq(new Set(model.parts.map(p=>p.id)).size,model.parts.length,'Molecular IDs are unique');
  for(const p of model.parts)for(const v of [p.p,p.a,p.b,p.size].filter(Boolean))ok(v.every(Number.isFinite),'Finite molecular coordinates');
}
near(M.volume(1).volume,1,'Reference volume');
for(let r=1;r<=1.8;r+=.05)ok(M.volume(r).volume>=M.volume(r-.01).volume,'Monotonic cubic volume');
const normal=M.defaults(7);
eq(M.adsorption({...normal,pressure:0}).coverage,0,'Zero pressure');
ok(M.adsorption({...normal,pressure:4}).coverage>M.adsorption(normal).coverage,'Pressure increases model coverage');
ok(M.adsorption({...normal,temperature:1.7}).coverage<M.adsorption(normal).coverage,'Temperature decreases this exothermic model coverage');
ok(M.adsorption({...normal,species:'B'}).coverage<M.adsorption(normal).coverage,'Different single-gas affinities');
eq(M.adsorption({...normal,size:1.05}).coverage,0,'Hard aperture exclusion');
ok(M.adsorption({...normal,size:1}).accessible,'Boundary is inclusive');
for(const p of [0,.2,1,5])for(const t of [.6,1,1.8])for(const species of ['A','B']){const a=M.adsorption({...normal,pressure:p,temperature:t,species});ok(a.coverage>=0&&a.coverage<1,'Finite bounded occupancy');}
function components(graphs){const nodes=new Set(graphs.flatMap(g=>g.nodes.map(n=>n.id))),adj=new Map([...nodes].map(id=>[id,[]]));for(const g of graphs)for(const e of g.edges){ok(adj.has(e.from)&&adj.has(e.to),'All graph endpoints exist');adj.get(e.from).push(e.to);adj.get(e.to).push(e.from);}let count=0;while(nodes.size){count++;const todo=[nodes.values().next().value];while(todo.length){const id=todo.pop();if(!nodes.delete(id))continue;todo.push(...adj.get(id));}}return count;}
const first=M.network(2,2.8,[0,0,0],'first'),second=M.network(2,2.8,[1.4,1.4,1.4],'second');
eq(components([first]),1,'One connected framework');eq(components([first,second]),2,'Two independent interpenetrating graphs');
const atomRadii=[];
for(let chapter=0;chapter<9;chapter++){
  const scenes=[];
  for(let step=0;step<M.chapters[chapter].scenes.length;step++){
    for(const phase of [0,.35,1])for(const rings of [1,3]){
      const s={...M.defaults(chapter),step,rings,interpenetrate:chapter===5&&step>0};const scene=M.scene(s,phase);
      const ids=new Set();for(const p of scene.parts){ok(!ids.has(p.id),'Unique primitive identifiers');ids.add(p.id);const vectors=[p.p,p.a,p.b,p.size].filter(Boolean);for(const v of vectors)ok(v.length===3&&v.every(Number.isFinite),'Finite 3D primitive');}
      if(phase===1&&rings===1)scenes.push(JSON.stringify(scene));
    }
  }
  eq(new Set(scenes).size,M.chapters[chapter].scenes.length,'Every subscene changes graphics or component labels in chapter '+(chapter+1));
}
for(const rings of [1,2,3])atomRadii.push(M.scene({...M.defaults(3),rings,step:1}).parts.find(p=>p.id==='family-0-0-0').r);
eq(new Set(atomRadii).size,1,'Node radius stays fixed across linker families');
const before=M.scene({...M.defaults(2),step:4},1),after=M.scene({...M.defaults(2),step:5},1);
eq(before.parts.filter(p=>p.id.startsWith('solvent')).length,14,'Solvent before activation');
eq(after.parts.filter(p=>p.id.startsWith('solvent')).length,0,'Solvent removed');
assert.deepEqual(before.parts.filter(p=>!p.id.startsWith('solvent')),after.parts,'Activation preserves the framework');checks++;
const html=fs.readFileSync(path.join(base,'index.html'),'utf8'),app=fs.readFileSync(path.join(base,'app.js'),'utf8');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);eq(ids.length,new Set(ids).size,'Unique HTML IDs');
for(const m of html.matchAll(/(?:for|aria-labelledby)="([^"]+)"/g))for(const id of m[1].split(' '))ok(ids.includes(id),'Valid accessibility reference '+id);
const homepage=fs.readFileSync(path.resolve(base,'../index.html'),'utf8');
ok(homepage.includes("t.id==='mof'?'learning-mof/index.html'"),'Homepage direct entry');
let parseHTML;
try{({parseHTML}=require('linkedom'));}catch(_){console.log(checks+' model/structure checks passed. DOM suite skipped: install linkedom externally or set NODE_PATH.');process.exit(0);}
{
  const {window,document}=parseHTML(homepage),location={hash:'#learning'};
  const context=vm.createContext({document,location,window:{scrollTo(){},addEventListener:window.addEventListener.bind(window)}});
  const code=[...homepage.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n');vm.runInContext(code,context);
  eq(document.querySelectorAll('#themeGrid .theme').length,7,'Seven homepage themes');
  eq(document.querySelector('#themeGrid a:last-child').getAttribute('href'),'learning-mof/index.html','MOF direct link');
  for(const [theme,entry]of [['fundamentals','hcpEntry'],['biomaterials','biomatEntry'],['sma','smaEntry'],['nano','nanoEntry']]){location.hash='#theme-'+theme;vm.runInContext('renderRoute()',context);ok(!document.querySelector('#'+entry).classList.contains('hidden'),'Existing theme route '+theme);ok(document.querySelector('#themePending').classList.contains('hidden'));}
  eq(document.querySelectorAll('#homeCards .feature').length,2,'ALE and Materials Learning cards remain');
}
function boot({width=800,reduced=false,three=false}={}){
  const {window,document}=parseHTML(html);Object.defineProperty(document,'hidden',{value:false,writable:true});
  const q=s=>document.querySelector(s),pending=new Map(),intersections=[],mediaListeners=[];let clock=100,next=1,renders=0;
  const viewport=q('#viewport');Object.defineProperty(viewport,'clientWidth',{value:width});Object.defineProperty(viewport,'clientHeight',{value:width<500?350:460});
  Object.defineProperty(q('#playSpeed'),'value',{get(){return (this.querySelector('option[selected]')||this.querySelector('option')).getAttribute('value');},set(v){for(const o of this.querySelectorAll('option')){if(o.getAttribute('value')===String(v))o.setAttribute('selected','');else o.removeAttribute('selected');}}});
  // Linkedom does not implement the native checkbox property; include controls inserted later.
  Object.defineProperty(window.HTMLInputElement.prototype,'checked',{get(){return this.hasAttribute('checked');},set(v){if(v)this.setAttribute('checked','');else this.removeAttribute('checked');},configurable:true});
  const sandbox={console,document,devicePixelRatio:1,matchMedia:()=>({matches:reduced,addEventListener(_,fn){mediaListeners.push(fn);}}),requestAnimationFrame(fn){const id=next++;pending.set(id,fn);return id;},cancelAnimationFrame(id){pending.delete(id);},ResizeObserver:class{observe(){}},IntersectionObserver:class{constructor(fn){this.fn=fn;}observe(){intersections.push(this.fn);}},addEventListener:window.addEventListener.bind(window)};
  sandbox.window=sandbox;const context=vm.createContext(sandbox);
  if(three){
    const vendor=path.resolve(base,'../learning-electromagnetic/vendor/three.min.js');
    vm.runInContext(fs.readFileSync(vendor,'utf8'),context);
    sandbox.THREE.WebGLRenderer=class{constructor({canvas}){this.canvas=canvas;this.ratio=1;}setPixelRatio(v){this.ratio=v;}getPixelRatio(){return this.ratio;}setSize(w,h){this.canvas.width=w*this.ratio;this.canvas.height=h*this.ratio;}render(scene,camera){scene.updateMatrixWorld();camera.updateMatrixWorld();for(const o of scene.children)ok(o.matrixWorld.elements.every(Number.isFinite),'Real Three geometry matrices');renders++;}};
  }
  vm.runInContext(fs.readFileSync(path.join(base,'model.js'),'utf8'),context);vm.runInContext(fs.readFileSync(path.join(base,'molecular.js'),'utf8'),context);vm.runInContext(fs.readFileSync(path.join(base,'learning.js'),'utf8'),context);vm.runInContext(app,context);
  const fire=(s,type='click',extra={})=>{const e=new window.Event(type,{bubbles:true});Object.assign(e,extra);q(s).dispatchEvent(e);};
  const frames=(count=1,ms=100)=>{for(let i=0;i<count;i++){clock+=ms;const batch=[...pending.values()];pending.clear();batch.forEach(fn=>fn(clock));ok(pending.size<=1,'At most one animation frame pending');}};
  const input=(s,v)=>{q(s).value=String(v);fire(s,'input');frames();};const check=(s,v)=>{q(s).checked=v;fire(s,'change');frames();};
  const visual=()=>q('#fallbackScene').innerHTML;
  return {q,fire,frames,input,check,document,window,pending,intersections,mediaListeners,context,visual,get renders(){return renders;}};
}
for(const width of [320,390,800,1280]){
  const u=boot({width}),{q,fire,frames,input,check}=u;frames();eq(q('#mofLearning').dataset.initialized,'true');ok(q('#fallbackScene').innerHTML.includes('circle'),'Functional no-WebGL fallback');
  ok(!q('#viewSettings').open,'Optional view controls start collapsed');ok(!q('#theoryDetails').open,'Full theory starts collapsed');ok(!q('#interactionCard').hidden&&q('#interactionCard').textContent.includes('마디'),'Core vocabulary is visible in the introductory topic');
  ok(q('#sceneWhy').closest('.explanation-column'),'Scene explanation lives beside the model');
  const firstReason=q('#sceneReason').textContent;fire('#nextScene');frames();ok(firstReason!==q('#sceneReason').textContent&&q('#sceneReason').textContent.length>20,'Changing the scene updates its causal explanation');
  eq(q('#chapterNav').querySelectorAll('[data-chapter]').length,3,'Three primary foundation questions');
  ok(q('#lessonAnalogy').textContent.length>20,'Analogy is supplied');ok(q('#analogyBoundary').textContent.includes('비유의 범위'));ok(q('#additionalReferences a'),'References remain in the folded footer');
  const all=[];
  for(let chapter=0;chapter<9;chapter++){fire(`[data-chapter="${chapter}"]`);frames();all.push(u.visual());eq(q(`[data-chapter="${chapter}"]`).getAttribute('aria-current'),'step');ok(q('#chapterKey').textContent.length>15);ok(!q('#understandingCheck')&&!q('#tryHint')&&!q('#lessonSources'),'Removed sections stay absent in every topic');ok(q('#lessonAnalogy').textContent.length>20);ok(!/NaN|Infinity|undefined/.test(u.visual()),'Finite SVG projection');}
  eq(new Set(all).size,9,'Nine distinct chapter scenes');
  fire('[data-chapter="0"]');fire('[data-focus="node"]');frames();ok(q('#modelName').textContent.includes('Zn₄O'),'Node detail view');const nodeView=u.visual();fire('[data-focus="linker"]');frames();ok(q('#modelName').textContent.includes('BDC'));ok(nodeView!==u.visual(),'Component focus changes real geometry');check('#showHydrogen',true);ok(q('[data-legend="hydrogen"]').hidden===false,'Hydrogen toggle changes the model');fire('[data-representation="topology"]');fire('[data-focus="framework"]');frames();const topology=u.visual();fire('[data-representation="atoms"]');frames();ok(topology!==u.visual(),'Molecular and connectivity views differ');
  fire('[data-chapter="3"]');fire('[data-rings="3"]');frames();ok(q('#modelName').textContent.includes('IRMOF-16'));check('#compareStructures',true);ok(q('#objectLabels').textContent.includes('IRMOF-10'));
  fire('[data-chapter="4"]');input('#lengthRatio',1.8);ok(q('#liveResults').textContent.includes('5.832'));const large=u.visual();input('#lengthRatio',1);ok(q('#liveResults').textContent.includes('1.000'));ok(large!==u.visual(),'Slider changes structure');
  fire('[data-chapter="5"]');check('#interpenetration',true);ok(q('#liveResults').textContent.includes('2개'));ok(u.visual().includes(M.colors.purple));check('#interpenetration',false);ok(!u.visual().includes(M.colors.purple));
  fire('[data-chapter="7"]');ok(!q('#gasOptions').open,'Extra gas controls start collapsed');ok(!q('#gasPressure').closest('details'),'Pressure is a primary control');q('#gasOptions').open=true;input('#gasPressure',0);ok(q('#liveResults').textContent.includes('0.0%'));input('#gasPressure',3);const high=q('#liveResults').textContent;input('#gasTemperature',1.8);ok(high!==q('#liveResults').textContent);input('#gasSize',1.2);ok(q('#liveResults').textContent.includes('제한'));fire('[data-species="B"]');frames();ok(q('#modelName').textContent.includes('B'));ok(q('#gasOptions').open,'Changing gas keeps its options open');eq(q('#gasTemperature').value,'1.8','Changing gas preserves the other variables');
  fire('[data-chapter="8"]');fire('[data-application="3"]');frames();ok(q('#applicationWhy').textContent.includes('활성점'));ok(q('#objectLabels').textContent.includes('활성점'));
  fire('[data-chapter="1"]');input('#sceneProgress',50);const middle=u.visual();input('#sceneProgress',65);ok(middle!==u.visual(),'Coordination approach animates');
  fire('#resetScene');frames();fire('#playScene');frames(60);ok(Number(q('#sceneProgress').value)>0,'Playback advances');fire('#playScene');frames();const paused=u.visual();frames(10);eq(paused,u.visual(),'Pause freezes diagram');eq(u.pending.size,0,'Paused animation has no RAF loop');
  fire('#playScene');frames(10);u.document.hidden=true;u.document.dispatchEvent(new u.window.Event('visibilitychange'));const hidden=u.visual();frames(10,10000);eq(u.visual(),hidden,'Hidden page suspends work');eq(u.pending.size,0);
  u.document.hidden=false;u.document.dispatchEvent(new u.window.Event('visibilitychange'));frames(8);ok(u.visual()!==hidden,'Visible page resumes without time jump');
  u.intersections[0]([{isIntersecting:false}]);const offscreen=u.visual();frames(10);eq(u.visual(),offscreen);eq(u.pending.size,0);u.intersections[0]([{isIntersecting:true}]);frames(8);ok(u.visual()!==offscreen);
  fire('#playScene');frames();const beforeView=u.visual();fire('#viewport','keydown',{key:'ArrowRight'});frames();ok(beforeView!==u.visual(),'Keyboard rotates projection');fire('#viewport','keydown',{key:'+'});frames();ok(!/NaN/.test(u.visual()));
  const beforeDrag=u.visual();fire('#viewport','pointerdown',{button:0,pointerId:1,clientX:100,clientY:100});fire('#viewport','pointermove',{pointerId:1,clientX:140,clientY:120});fire('#viewport','pointerup',{pointerId:1});frames();ok(beforeDrag!==u.visual(),'Pointer drag rotates');
  vm.runInContext(app,u.context);fire('#playScene');eq(q('#playScene').getAttribute('aria-pressed'),'true','No double listeners after duplicate init');
  fire('#resetScene');frames();eq(q('#playScene').getAttribute('aria-pressed'),'false');eq(q('#sceneProgress').value,'0');
  console.log('DOM controls, geometry projection, accessibility wiring and animation lifecycle: '+width+' px passed');
}
const reduced=boot({reduced:true});reduced.frames();eq(reduced.q('#playScene').getAttribute('aria-pressed'),'false');eq(reduced.pending.size,0);ok(reduced.q('#motionNotice').textContent.includes('동작 줄이기'));
reduced.fire('#playScene');reduced.frames(10);reduced.mediaListeners[0]({matches:true});reduced.frames();eq(reduced.q('#playScene').getAttribute('aria-pressed'),'false','Changing motion preference pauses');
const end=boot();end.frames();end.input('#playSpeed',2);end.fire('#playScene');end.frames(75);eq(end.q('#sceneProgress').value,'100','Playback reaches the end');eq(end.q('#playScene').getAttribute('aria-pressed'),'false');eq(end.pending.size,0,'End stops the frame loop');end.fire('#playScene');end.frames(4);ok(Number(end.q('#sceneProgress').value)<100,'Replay restarts');
if(fs.existsSync(path.resolve(base,'../learning-electromagnetic/vendor/three.min.js'))){const u=boot({three:true});for(let chapter=0;chapter<9;chapter++){u.fire(`[data-chapter="${chapter}"]`);u.frames();for(let step=1;step<M.chapters[chapter].scenes.length;step++){u.fire('#nextScene');u.frames();}}ok(u.renders>20,'All scenes exercised with real Three geometry and renderer stub');u.fire('#mofCanvas','webglcontextlost');u.frames();ok(!u.q('#fallbackScene').hidden,'Context loss activates SVG fallback');ok(u.visual().includes('circle'));console.log('Real Three geometry/camera path passed; rasterization is not tested.');}
console.log(checks+' assertions passed. DOM widths do not verify browser CSS layout or WebGL rasterization.');
