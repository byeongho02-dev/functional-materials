'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
let parseHTML;try{({parseHTML}=require('linkedom'));}catch(_){console.log('Optional lecture UI DOM suite unavailable; Chromium verifies actual DOM/CSS/WebGL in Actions.');process.exit(0);}
const root=path.resolve(__dirname,'..');let assertions=0;
for(const width of [360,390,768,1280,1440])for(let course=1;course<=3;course++){
  const {window,document}=parseHTML(fs.readFileSync(path.join(root,'learning-lecture'+course+'.html'),'utf8'));
  Object.defineProperty(window.HTMLInputElement.prototype,'checked',{get(){return this.hasAttribute('checked');},set(v){v?this.setAttribute('checked',''):this.removeAttribute('checked');},configurable:true});
  Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get(){return (this.querySelector('option[selected]')||this.querySelector('option'))?.getAttribute('value')||'';},set(v){for(const o of this.querySelectorAll('option'))o.getAttribute('value')===String(v)?o.setAttribute('selected',''):o.removeAttribute('selected');},configurable:true});
  let engine;class Core{constructor(el,select,tick,wants){this.el=el;this.onSelect=select;this.tick=tick;this.wants=wants;el.dataset.renderer='stub';engine=this;}setModel(model,selected){this.model=model;this.selected=selected;this.el.dataset.parts=model.parts.length;}view(){}request(){}suspend(){}dispose(){this.dead=true;}}
  const location={hash:''},sandbox={document,console,innerWidth:width,innerHeight:900,devicePixelRatio:1,location,history:{replaceState(a,b,hash){location.hash=hash;}},matchMedia:()=>({matches:false,addEventListener(){}}),ResizeObserver:class{observe(){}disconnect(){}},LearningSceneCore:Core,addEventListener:window.addEventListener.bind(window)};sandbox.window=sandbox;const context=vm.createContext(sandbox);
  for(const name of ['learning-shared/geometry.js','learning-scenes/model'+course+'.js','learning-scenes/lecture'+course+'.js','learning-shared/content.js','learning-shared/ui.js'])vm.runInContext(fs.readFileSync(path.join(root,name),'utf8'),context);
  const q=s=>document.querySelector(s),fire=(selector,type='click')=>q(selector).dispatchEvent(new window.Event(type,{bubbles:true}));
  assert.equal(q('#lectureLab').dataset.initialized,'true');assert.equal(q('#chapterNav').children.length,8);assert.equal(engine.wants(),false);
  for(let c=0;c<8;c++){
    fire('[data-chapter="'+c+'"]');assert.equal(q('#viewport').dataset.chapter,String(c));assert.ok(q('#chapterTitle').textContent.length>10);assert.ok(q('#observation').textContent.length>15);assert.ok(q('#mechanism').textContent.length>15);assert.ok(engine.model.parts.length>0);assertions+=6;
    for(let step=0;step<4;step++){fire('[data-step="'+step+'"]');assert.equal(q('#viewport').dataset.step,String(step));assert.ok(!q('#stateLine').textContent.includes('NaN'));assertions+=2;}
    fire('#resetScene');const config=sandbox.LearningCourses[course].controls(sandbox.LearningCourses[course].init({...sandbox.LearningModels[course].defaults(),chapter:c}));
    for(const def of config){const el=q('#input-'+def.id);if(!el||el.disabled)continue;if(el.type==='range'){el.value=String(def.max);fire('#input-'+def.id,'input');}else if(el.type==='checkbox'){el.checked=!el.checked;fire('#input-'+def.id,'change');}else{el.value=def.options.at(-1)[0];fire('#input-'+def.id,'change');}assert.ok(q('#observation').textContent.length>15);assert.ok(engine.model.parts.every(p=>[p.p,p.a,p.b].filter(Boolean).every(v=>v.every(Number.isFinite))));assertions+=2;}
  }
  fire('[data-chapter="2"]');fire('#resetScene');fire('.direct-controls [data-play]');assert.equal(engine.wants(),true);for(let i=0;i<160&&engine.wants();i++)engine.tick(.1);assert.equal(engine.wants(),false);
  vm.runInContext(fs.readFileSync(path.join(root,'learning-shared/ui.js'),'utf8'),context);fire('#resetScene');fire('.direct-controls [data-play]');assert.equal(engine.wants(),true,'Duplicate initialization must not double-toggle');assertions+=3;
  console.log('Lecture '+course+' DOM '+width+' px passed (not a CSS/rasterization test).');
}
console.log(assertions+' optional lecture UI assertions passed.');
