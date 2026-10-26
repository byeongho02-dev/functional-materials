(() => {
  'use strict';
  const { ALEEngine, ConceptualPlasmaModel, estimateCoveragePct, clamp } = window.ALEModel;
  const $ = selector => document.querySelector(selector);
  const $$ = selector => Array.from(document.querySelectorAll(selector));
  const engine = new ALEEngine({ cols: 8, rows: 8, layers: 20, plasmaModel: new ConceptualPlasmaModel() });
  const state = {
    sourcePowerW: 300, ionEnergyEv: 50, exposureTimeS: 5, adsorptionDurationMs: 1250, totalCycles: 1,
    speedIndex: 1, running: false, paused: false, currentCycle: 0,
    phaseIndex: -1, phaseElapsed: 0, previousTime: 0, plan: null,
    rotationX: 0.73, rotationY: -0.62, zoom: 1, drag: null,
    selectedId: null, projectedAtoms: []
  };
  const phaseNames = ['adsorption', 'purge1', 'bombard', 'removal'];
  const phaseLabels = ['Cl 흡착 · 활성점 접근', 'Purge · 미흡착종 제거', 'Ar⁺ 충돌 · 표면 활성화', 'SiClₓ 이탈 · 생성물 Purge'];
  const baseDurations = [900, 420, 900, 820];
  const speedValues = [0.5, 1, 2, 4];
  const canvas = $('#scene');
  const chamberCanvas = $('#chamberScene');
  const ctx = canvas.getContext('2d');
  let width = 0, height = 0, dpr = 1;
  let lastRenderTime = 0, chamberAnimationTime = 0;

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    width = rect.width; height = rect.height;
    ['#epcChart', '#depthChart', '#coverageChart'].forEach(resizeChart);
  }

  function resizeChart(selector) {
    const chart = $(selector), rect = chart.getBoundingClientRect();
    chart.width = Math.max(1, Math.round(rect.width * dpr));
    chart.height = Math.max(1, Math.round(rect.height * dpr));
  }

  // Presentational status only: the scientific engine and results remain unchanged.
  function updateEnvironmentUI() {
    const phase = state.running ? state.phaseIndex : -1;
    const sourceSet = state.sourcePowerW > 0;
    const clPlasma = sourceSet && phase === 0;
    const arPlasma = sourceSet && phase === 2;
    const badge = $('#plasmaBadge');
    const surface = $('#surfaceModeBadge');
    const sourcePanel = $('#plasmaState');
    badge.classList.toggle('on', clPlasma);
    badge.classList.toggle('ion', arPlasma);
    badge.textContent = clPlasma ? 'Cl SPECIES · PLASMA' : arPlasma ? 'Ar PLASMA · BIAS' : phase === 1 || phase === 3 ? 'PURGE · PLASMA OFF' : 'READY · PLASMA OFF';
    surface.classList.toggle('on', phase === 0 || phase === 1);
    surface.classList.toggle('ion', phase === 2);
    surface.textContent = phase === 0 ? 'Cl ADSORPTION' : phase === 1 ? 'MODIFIED SURFACE' : phase === 2 ? 'Ar⁺ BOMBARDMENT' : phase === 3 ? 'PRODUCT REMOVAL' : 'INITIAL SURFACE';
    sourcePanel.classList.toggle('off', !clPlasma && !arPlasma);
    sourcePanel.querySelector('span').textContent = clPlasma || arPlasma ? 'PLASMA SOURCE ON' : !sourceSet ? 'SOURCE POWER OFF' : phase===1 || phase===3 ? 'PURGE · PLASMA OFF' : 'SOURCE SETPOINT READY';
  }

  function setPower(value) {
    state.sourcePowerW = Math.round(clamp(value, 0, 600));
    $('#sourcePower').value = Math.round(state.sourcePowerW / 10) * 10;
    $('#powerNumber').value = state.sourcePowerW;
    $('#powerOut').textContent = `${state.sourcePowerW} W`;
    $('#rPower').textContent = `${state.sourcePowerW} W`;
    const plasma = engine.plasmaModel.evaluate(state.sourcePowerW);
    const panel = $('#plasmaState');
    panel.classList.toggle('off', !plasma.sourceOn);
    panel.querySelector('span').textContent = plasma.sourceOn ? 'PLASMA SOURCE ON' : 'PLASMA SOURCE OFF';
    panel.querySelector('b').textContent = `정성 플럭스 지수 ${plasma.ionFluxIndex.toFixed(2)}`;
    updateEnvironmentUI();
  }

  function setExposure(value) {
    state.exposureTimeS = clamp(Number.isFinite(Number(value)) ? Number(value) : 5, 0, 20);
    // Compress the physical exposure into a watchable animation of ~0.65–3.05 s.
    state.adsorptionDurationMs = 650 + state.exposureTimeS * 120;
    $('#exposureTime').value = state.exposureTimeS;
    $('#exposureOut').textContent = `${state.exposureTimeS.toFixed(1)} s`;
  }

  function phaseDuration(index) {
    return index === 0 ? state.adsorptionDurationMs : baseDurations[index];
  }

  function renderLiveCoverage() {
    if (!state.plan || state.phaseIndex < 0) return;
    let value = state.plan.coveragePct;
    if (state.phaseIndex === 0) {
      const fraction = Math.min(1, Math.max(0, state.phaseElapsed / state.adsorptionDurationMs));
      const plasma = state.plan.plasma;
      const full = estimateCoveragePct(state.exposureTimeS, plasma.radicalFluxIndex);
      const partial = estimateCoveragePct(state.exposureTimeS * fraction, plasma.radicalFluxIndex);
      value = full > 0 ? state.plan.coveragePct * partial / full : 0;
    }
    $('#mCoverage').innerHTML = `${value.toFixed(1)}<em>%</em>`;
  }

  function setCycles(value) {
    state.totalCycles = Math.round(clamp(value, 1, 100));
    $('#cycles').value = state.totalCycles; $('#cycleNumber').value = state.totalCycles;
    $('#cyclesOut').textContent = `${state.totalCycles} Cycle${state.totalCycles > 1 ? 's' : ''}`;
    $('#cycleTotal').textContent = state.totalCycles;
  }

  function bindControls() {
    $('#sourcePower').addEventListener('input', e => setPower(e.target.value));
    $('#powerNumber').addEventListener('change', e => setPower(e.target.value));
    $('#exposureTime').addEventListener('input', e => setExposure(e.target.value));
    $('#cycles').addEventListener('input', e => setCycles(e.target.value));
    $('#cycleNumber').addEventListener('change', e => setCycles(e.target.value));
    $('#cycleMinus').addEventListener('click', () => setCycles(state.totalCycles - 1));
    $('#cyclePlus').addEventListener('click', () => setCycles(state.totalCycles + 1));
    $('#speed').addEventListener('input', e => { state.speedIndex = +e.target.value; $('#speedOut').textContent = `${speedValues[state.speedIndex]}×`; });
    $$('.energy-buttons button').forEach(button => button.addEventListener('click', () => {
      state.ionEnergyEv = +button.dataset.energy;
      $$('.energy-buttons button').forEach(item => item.classList.toggle('active', item === button));
      $('#energyOut').textContent = `${state.ionEnergyEv} eV`; $('#rEnergy').textContent = `${state.ionEnergyEv} eV`;
    }));
    $('#start').addEventListener('click', startSimulation);
    $('#pause').addEventListener('click', togglePause);
    $('#reset').addEventListener('click', resetSimulation);
    $('#closeAtom').addEventListener('click', () => { state.selectedId = null; $('#atomCard').hidden = true; });
  }

  function lockRecipe(locked) {
    $$('.controls input:not(#speed),.energy-buttons button,#cycleMinus,#cyclePlus').forEach(el => { el.disabled = locked; });
    $('#start').disabled = locked; $('#pause').disabled = !locked;
  }

  function startSimulation() {
    if (state.running) return;
    if (engine.currentCycle > 0) { engine.reset(); drawCharts(); }
    state.running = true; state.paused = false; state.currentCycle = 1; state.phaseIndex = 0;
    state.phaseElapsed = 0; state.previousTime = performance.now();
    state.plan = makePlan(1); lockRecipe(true); updatePhaseUI(); updateMetrics(null);
    $('#runStatus').textContent = 'RUNNING';
  }

  function makePlan(cycle) {
    return engine.prepareCycle({ cycle, sourcePowerW: state.sourcePowerW, ionEnergyEv: state.ionEnergyEv, exposureTimeS: state.exposureTimeS });
  }

  function togglePause() {
    if (!state.running) return;
    state.paused = !state.paused; $('#pause').textContent = state.paused ? '▶' : 'Ⅱ';
    $('#runStatus').textContent = state.paused ? 'PAUSED' : 'RUNNING';
    if (!state.paused) state.previousTime = performance.now();
  }

  function resetSimulation() {
    engine.reset(); Object.assign(state, { running: false, paused: false, currentCycle: 0, phaseIndex: -1, phaseElapsed: 0, plan: null, selectedId: null });
    lockRecipe(false); $('#pause').textContent = 'Ⅱ'; $('#runStatus').textContent = 'READY'; $('#cycleCurrent').textContent = '0';
    $('#stepTitle').textContent = '초기 결정 표면'; $('#cycleProgress').style.width = '0%'; $('#atomCard').hidden = true;
    $('.stepper-track div').forEach(el => el.classList.remove('active', 'done')); updateMetrics(null); drawCharts(); updateEnvironmentUI();
  }

  function finishCycle() {
    const result = engine.completeCycle(state.plan); updateMetrics(result); drawCharts();
    if (state.currentCycle >= state.totalCycles) {
      state.running = false; state.phaseIndex = -1; lockRecipe(false); $('#pause').textContent = 'Ⅱ';
      $('#runStatus').textContent = 'COMPLETE'; $('#stepTitle').textContent = `${state.totalCycles} Cycle 완료`;
      $('#cycleProgress').style.width = '100%'; updateEnvironmentUI(); return;
    }
    state.currentCycle += 1; state.plan = makePlan(state.currentCycle); state.phaseIndex = 0; state.phaseElapsed = 0; updatePhaseUI();
  }

  function tick(now) {
    const frameDelta = lastRenderTime ? Math.min(60, Math.max(0, now-lastRenderTime)) : 0;
    lastRenderTime = now;
    if (state.running && !state.paused) chamberAnimationTime += frameDelta * speedValues[state.speedIndex];
    if (state.running && !state.paused) {
      const delta = Math.min(60, now - state.previousTime) * speedValues[state.speedIndex];
      state.phaseElapsed += delta; state.previousTime = now;
      const duration = phaseDuration(state.phaseIndex);
      if (state.phaseElapsed >= duration) {
        state.phaseElapsed -= duration;
        if (state.phaseIndex === phaseNames.length - 1) finishCycle();
        else { state.phaseIndex += 1; updatePhaseUI(); }
      }
      if (state.running) {
        const overall = ((state.currentCycle - 1) + (state.phaseIndex + Math.min(1, state.phaseElapsed / phaseDuration(state.phaseIndex))) / 4) / state.totalCycles;
        $('#cycleProgress').style.width = `${overall * 100}%`;
        renderLiveCoverage();
      }
    } else state.previousTime = now;
    drawScene();
    if (window.ALEChamber) window.ALEChamber.render(chamberCanvas, state, chamberAnimationTime);
    requestAnimationFrame(tick);
  }

  function updatePhaseUI() {
    $('#cycleCurrent').textContent = state.currentCycle;
    $('#stepTitle').textContent = phaseLabels[state.phaseIndex];
    $$('.stepper-track div').forEach((el, index) => {
      el.classList.toggle('active', index === state.phaseIndex); el.classList.toggle('done', index < state.phaseIndex);
    });
    const adsorbed = state.plan ? state.plan.adsorbedIds.length : 0;
    renderLiveCoverage();
    $('#mModified').innerHTML = `${adsorbed}<em>atoms</em>`;
    updateEnvironmentUI();
  }

  function updateMetrics(result) {
    const snap = engine.snapshot();
    $('#mCoverage').innerHTML = `${result ? result.coveragePct.toFixed(1) : '0.0'}<em>%</em>`;
    $('#mEpc').innerHTML = `${result ? result.epcA.toFixed(3) : '0.000'}<em>Å/cycle</em>`;
    $('#mRemoved').innerHTML = `${result ? result.removedAtoms : 0}<em>atom${result?.removedAtoms === 1 ? '' : 's'}</em>`;
    $('#mTotalRemoved').innerHTML = `${snap.totalRemoved}<em>atoms</em>`;
    $('#mDepth').innerHTML = `${snap.cumulativeDepthA.toFixed(3)}<em>Å</em>`;
    $('#mModified').innerHTML = `${result ? result.modifiedAtoms : 0}<em>atoms</em>`;
  }

  function project(atom, offset = {}) {
    const x = atom.x + (offset.x || 0), y = atom.y + (offset.y || 0), z = atom.z + (offset.z || 0);
    const cy = Math.cos(state.rotationY), sy = Math.sin(state.rotationY), cx = Math.cos(state.rotationX), sx = Math.sin(state.rotationX);
    const x1 = x * cy - z * sy, z1 = x * sy + z * cy, y1 = y * cx - z1 * sx, z2 = y * sx + z1 * cx;
    const sceneFit = Math.min(1, Math.max(.62, height / 360));
    const scale = state.zoom * 510 * sceneFit / (720 + z2);
    return { x: width * .5 + x1 * scale, y: height * .53 + y1 * scale, depth: z2, scale };
  }

  function circle(point, radius, fill, glow = 0) {
    ctx.beginPath(); ctx.arc(point.x, point.y, Math.max(2, radius * point.scale), 0, Math.PI * 2);
    if (glow) { ctx.shadowColor = fill; ctx.shadowBlur = glow; }
    const gradient = ctx.createRadialGradient(point.x - radius * point.scale * .3, point.y - radius * point.scale * .35, 1, point.x, point.y, radius * point.scale);
    gradient.addColorStop(0, '#ffffff'); gradient.addColorStop(.2, fill); gradient.addColorStop(1, `${fill}88`);
    ctx.fillStyle = gradient; ctx.fill(); ctx.shadowBlur = 0; ctx.strokeStyle = '#dff3ff55'; ctx.lineWidth = .8; ctx.stroke();
  }

  function visibleAtoms() {
    const surface = new Map(engine.getSurfaceAtoms().map(atom => [`${atom.col}:${atom.row}`, atom.layer]));
    return engine.atoms.filter(atom => atom.active && atom.layer <= (surface.get(`${atom.col}:${atom.row}`) ?? 0) + 7);
  }

  function drawScene() {
    if (window.ALESurfaceV041) {
      window.ALESurfaceV041.render(canvas, state, engine, chamberAnimationTime);
      return;
    }
    ctx.clearRect(0, 0, width, height);
    const bg = ctx.createRadialGradient(width * .5, height * .43, 10, width * .5, height * .43, Math.max(width, height) * .65);
    bg.addColorStop(0, '#142a47'); bg.addColorStop(1, '#07111e'); ctx.fillStyle = bg; ctx.fillRect(0, 0, width, height);
    drawGrid();
    const atoms = visibleAtoms(), atomMap = new Map(atoms.map(atom => [`${atom.col}:${atom.row}:${atom.layer}`, atom]));
    const objects = []; state.projectedAtoms = [];
    const currentlyRemoving = state.phaseIndex === 3 ? new Set(state.plan?.removalIds || []) : new Set();
    for (const atom of atoms) {
      if (currentlyRemoving.has(atom.id)) continue;
      const point = project(atom); objects.push({ type: 'atom', atom, point });
      const neighbors = [[1,0,0],[0,1,0],[0,0,1]];
      neighbors.forEach(([dc,dr,dl]) => { const other = atomMap.get(`${atom.col+dc}:${atom.row+dr}:${atom.layer+dl}`); if (other) objects.push({ type:'bond', p1:point, p2:project(other), depth:(point.depth+project(other).depth)/2 }); });
    }
    addProcessObjects(objects);
    objects.sort((a,b) => (b.depth ?? b.point?.depth ?? 0) - (a.depth ?? a.point?.depth ?? 0));
    for (const item of objects) {
      if (item.type === 'bond') { ctx.beginPath(); ctx.moveTo(item.p1.x,item.p1.y);ctx.lineTo(item.p2.x,item.p2.y);ctx.strokeStyle='#6785ab3d';ctx.lineWidth=1.5;ctx.stroke(); continue; }
      if (item.type === 'atom') {
        const modified = state.plan?.modifiedIds.includes(item.atom.id) && state.phaseIndex >= 0;
        circle(item.point, modified ? 10.5 : 9, modified ? '#b083ff' : '#638cff', state.selectedId === item.atom.id ? 12 : 0);
        state.projectedAtoms.push({ atom:item.atom, x:item.point.x, y:item.point.y, radius:12*item.point.scale });
      } else circle(item.point, item.radius, item.color, item.glow || 0);
    }
  }

  function drawGrid() {
    ctx.strokeStyle='#26415d44';ctx.lineWidth=1;
    for(let i=-5;i<=5;i++){let a=project({x:i*42,y:-260,z:250}),b=project({x:i*42,y:260,z:250});ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();a=project({x:-260,y:i*42,z:250});b=project({x:260,y:i*42,z:250});ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
  }

  function addProcessObjects(objects) {
    if (!state.plan || state.phaseIndex < 0) return;
    const adsorbedSet = new Set(state.plan.adsorbedIds), removalSet = new Set(state.plan.removalIds);
    const progress = Math.min(1, state.phaseElapsed / baseDurations[state.phaseIndex]);
    for (const atom of engine.atoms) {
      if (!atom.active || !adsorbedSet.has(atom.id)) continue;
      let zOffset = -31, xOffset = 0;
      if (state.phaseIndex === 0) zOffset -= (1-progress) * 145;
      if (state.phaseIndex === 3 && removalSet.has(atom.id)) { zOffset -= progress * 160; xOffset += progress * 65; }
      const point = project(atom,{z:zOffset,x:xOffset}); objects.push({type:'cl',point,radius:7,color:'#5ae0a1',depth:point.depth});
      if (state.phaseIndex === 3 && removalSet.has(atom.id)) { const siPoint=project(atom,{z:-progress*160,x:progress*65});objects.push({type:'removing',point:siPoint,radius:11,color:'#ff6678',glow:10,depth:siPoint.depth-1}); }
    }
    if (state.phaseIndex === 2 && state.plan.plasma.sourceOn) {
      const targets=engine.atoms.filter(a=>a.active&&removalSet.has(a.id));
      targets.slice(0,Math.max(1,Math.min(6,targets.length))).forEach((atom,index)=>{const stagger=Math.max(0,Math.min(1,progress*1.35-index*.08));const point=project(atom,{z:-230+stagger*205,x:(index%2?10:-10)});objects.push({type:'ion',point,radius:11,color:'#ff9a52',glow:16,depth:point.depth});});
    }
  }

  function drawChart(selector, values, color, fixedMax) {
    const canvasEl=$(selector), c=canvasEl.getContext('2d'), w=canvasEl.width/dpr, h=canvasEl.height/dpr;c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);
    c.strokeStyle='#253a5355';c.lineWidth=1;for(let i=1;i<4;i++){c.beginPath();c.moveTo(0,i*h/4);c.lineTo(w,i*h/4);c.stroke();}
    if(!values.length){c.fillStyle='#546a83';c.font='7px sans-serif';c.fillText('Cycle data will appear here',8,h/2);return;}
    const max=fixedMax||Math.max(...values,0.001)*1.15;c.beginPath();values.forEach((v,i)=>{const x=values.length===1?w/2:i/(values.length-1)*(w-8)+4,y=h-6-(v/max)*(h-12);i?c.lineTo(x,y):c.moveTo(x,y);});c.strokeStyle=color;c.lineWidth=2;c.stroke();c.lineTo(w-4,h-5);c.lineTo(4,h-5);c.closePath();c.fillStyle=`${color}18`;c.fill();
  }
  function drawCharts(){drawChart('#epcChart',engine.history.map(x=>x.epcA),'#46d4e8');drawChart('#depthChart',engine.history.map(x=>x.cumulativeDepthA),'#5ae0a1');drawChart('#coverageChart',engine.history.map(x=>x.coveragePct),'#b083ff',100);}

  function bindCanvas() {
    canvas.addEventListener('pointerdown', e => { state.drag={x:e.clientX,y:e.clientY,rx:state.rotationX,ry:state.rotationY,moved:false};canvas.setPointerCapture(e.pointerId);canvas.style.cursor='grabbing'; });
    canvas.addEventListener('pointermove', e => { if(!state.drag)return;const dx=e.clientX-state.drag.x,dy=e.clientY-state.drag.y;if(Math.abs(dx)+Math.abs(dy)>4)state.drag.moved=true;state.rotationY=state.drag.ry+dx*.007;state.rotationX=clamp(state.drag.rx+dy*.007,.2,1.35); });
    canvas.addEventListener('pointerup', e => { if(state.drag&&!state.drag.moved)selectAtom(e);state.drag=null;canvas.style.cursor='grab'; });
    canvas.addEventListener('wheel', e => { e.preventDefault();state.zoom=clamp(state.zoom-e.deltaY*.0008,.62,1.55); },{passive:false});
  }
  function selectAtom(event){const rect=canvas.getBoundingClientRect(),x=event.clientX-rect.left,y=event.clientY-rect.top;let best=null,dist=Infinity;state.projectedAtoms.forEach(p=>{const d=Math.hypot(x-p.x,y-p.y);if(d<Math.max(10,p.radius)&&d<dist){best=p.atom;dist=d;}});if(!best)return;state.selectedId=best.id;$('#atomCard').hidden=false;$('#atomName').textContent=`Si #${best.id}`;$('#atomState').textContent=`${best.modified?'Modified':'Active'} · Layer ${best.layer+1} · Column ${best.col+1},${best.row+1}`;}

  window.addEventListener('resize',()=>{resizeCanvas();drawCharts();});bindControls();bindCanvas();setExposure(5);setPower(300);setCycles(1);resizeCanvas();updateMetrics(null);drawCharts();requestAnimationFrame(tick);
})();
