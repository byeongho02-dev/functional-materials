import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createChamber, COMPONENTS } from './chamber.js';
import { CameraRig, VIEWS } from './cameras.js';
import { ProcessClock, SITES, STAGES, sampleParticles } from './process.js';
import { SoftwareRenderer } from './software.js';
import { SurfaceView } from './surface.js';

const $ = id => document.getElementById(id);
const viewport = $('viewport');
const clock = new ProcessClock();
const chamber = createChamber();
const scene = new THREE.Scene();
scene.add(chamber.root);
const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 80);
camera.position.set(...VIEWS.orbit.position);
const target = new THREE.Vector3(...VIEWS.orbit.target);
let renderer;
let controls;
let rig;
let mode = 'webgl';
let selectedPart = 'liner';
let selectedSite = 'S01';
let budget = 240;
let dirty = true;
let pmrem;
let environment;
let canvas;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

function attachControls() {
  controls = new OrbitControls(camera, canvas);
  controls.target.copy(target);
  controls.enableDamping = true;
  controls.dampingFactor = 0.09;
  controls.minDistance = 3.2;
  controls.maxDistance = 21;
  controls.maxPolarAngle = Math.PI * 0.88;
  controls.addEventListener('start', () => rig?.cancel());
  controls.addEventListener('change', () => { dirty = true; });
  rig = new CameraRig(camera, controls.target);
}
function activateSoftware() {
  mode = 'software';
  if (controls) { target.copy(controls.target); controls.dispose(); }
  if (renderer?.isWebGLRenderer) renderer.dispose();
  canvas?.remove();
  canvas = document.createElement('canvas');
  canvas.setAttribute('aria-label', '소프트웨어 3D 챔버');
  viewport.prepend(canvas);
  renderer = new SoftwareRenderer(canvas);
  $('renderer-mode').textContent = 'SOFTWARE 3D';
  $('fallback-note').hidden = false;
  attachControls();
  resize();
  dirty = true;
}
canvas = document.createElement('canvas');
canvas.setAttribute('aria-label', 'Three.js 3D 챔버');
viewport.prepend(canvas);
try {
  const gl = new URLSearchParams(location.search).has('software') ? null : canvas.getContext('webgl2', { antialias: true, alpha: true, powerPreference: 'high-performance' });
  if (!gl) throw new Error('WebGL2 unavailable');
  renderer = new THREE.WebGLRenderer({ canvas, context: gl, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.localClippingEnabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  environment = pmrem.fromScene(room, 0.04);
  scene.environment = environment.texture;
  room.dispose();
  pmrem.dispose();
  $('renderer-mode').textContent = `THREE.JS r${THREE.REVISION} / WEBGL`;
  attachControls();
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); activateSoftware(); }, { once: true });
} catch {
  activateSoftware();
}

scene.environmentIntensity = 0.7;
scene.add(new THREE.HemisphereLight('#d5edff', '#26333c', 0.8));
const keyLight = new THREE.DirectionalLight('#edf6ff', 2.1);
keyLight.position.set(2, 7, 5); scene.add(keyLight);
const rimLight = new THREE.DirectionalLight('#8cc6e4', 1.4);
rimLight.position.set(-5, 3, -3); scene.add(rimLight);
const warmLight = new THREE.DirectionalLight('#eec4a2', 1.0);
warmLight.position.set(5, 1, -2); scene.add(warmLight);
const grid = new THREE.GridHelper(12, 24, '#536d7a', '#344a58');
grid.position.y = -2.12; grid.material.transparent = true; grid.material.opacity = 0.17; scene.add(grid);
const glow = new THREE.Mesh(new THREE.SphereGeometry(1.75, 28, 18), new THREE.MeshBasicMaterial({ color: '#94cee9', transparent: true, opacity: 0.027, side: THREE.BackSide, depthWrite: false }));
glow.position.y = 1.2; glow.scale.y = 0.48; glow.renderOrder = 2; glow.userData.softwareSkip = true; scene.add(glow);
const sheath = new THREE.Mesh(new THREE.CylinderGeometry(1.47, 1.47, 0.045, 64), new THREE.MeshBasicMaterial({ color: '#e6af7e', transparent: true, opacity: 0.075, depthWrite: false }));
sheath.position.y = 0.5; sheath.renderOrder = 3; sheath.userData.softwareSkip = true; scene.add(sheath);

const particleGeometry = new THREE.BufferGeometry();
const particlePositions = new Float32Array(800 * 3);
const particleColors = new Float32Array(800 * 3);
particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3).setUsage(THREE.DynamicDrawUsage));
particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3).setUsage(THREE.DynamicDrawUsage));
const sprite = document.createElement('canvas'); sprite.width = 32; sprite.height = 32;
const spriteContext = sprite.getContext('2d');
const gradient = spriteContext.createRadialGradient(16, 16, 1, 16, 16, 16);
gradient.addColorStop(0, '#fff'); gradient.addColorStop(0.25, '#ffffffd9'); gradient.addColorStop(1, '#ffffff00');
spriteContext.fillStyle = gradient; spriteContext.fillRect(0, 0, 32, 32);
const spriteTexture = new THREE.CanvasTexture(sprite);
const particlesMesh = new THREE.Points(particleGeometry, new THREE.PointsMaterial({ size: 0.078, vertexColors: true,
  map: spriteTexture, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
particlesMesh.frustumCulled = false; particlesMesh.renderOrder = 3; scene.add(particlesMesh);
const siteMarkers = new THREE.InstancedMesh(new THREE.SphereGeometry(0.024, 8, 6), new THREE.MeshBasicMaterial(), SITES.length);
siteMarkers.name = 'surface-sites'; siteMarkers.userData.softwareSkip = true;
siteMarkers.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(siteMarkers);
const markerTransform = new THREE.Object3D();
const markerColor = new THREE.Color();
const colors = { cl: new THREE.Color('#8be1bc'), ion: new THREE.Color('#83bffa'), product: new THREE.Color('#e9ac77') };

function resize() {
  const w = viewport.clientWidth;
  const h = viewport.clientHeight;
  if (!w || !h || !renderer) return;
  camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h, false); dirty = true;
}
new ResizeObserver(resize).observe(viewport);
resize();

function selectPart(id) {
  const part = COMPONENTS.find(item => item.id === id);
  if (!part) return;
  selectedPart = id;
  $('part-title').textContent = part.name;
  $('part-material').textContent = part.material;
  $('part-description').textContent = part.note;
  $('part-label-text').textContent = part.name;
  document.querySelectorAll('.part-row').forEach(row => row.classList.toggle('active', row.dataset.part === id));
  dirty = true;
}
for (const [i, component] of COMPONENTS.entries()) {
  const row = document.createElement('div'); row.className = 'part-row'; row.dataset.part = component.id;
  const input = document.createElement('input'); input.type = 'checkbox'; input.checked = true;
  input.setAttribute('aria-label', `${component.name} 표시`);
  input.addEventListener('change', () => { chamber.setVisible(component.id, input.checked); dirty = true; });
  const button = document.createElement('button'); button.title = component.ko;
  const index = document.createElement('span'); index.className = 'part-index'; index.textContent = String(i + 1).padStart(2, '0');
  button.append(index, document.createTextNode(component.name)); button.addEventListener('click', () => selectPart(component.id));
  row.append(input, button); $('parts-list').append(row);
}
selectPart('liner');

function setView(name) {
  rig.setView(name, reducedMotion);
  if (name === 'front' || name === 'wafer') { $('cutaway').checked = true; chamber.setCutaway(true); }
  document.querySelectorAll('[data-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === name)));
  dirty = true;
}
document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => setView(button.dataset.view)));
$('cutaway').addEventListener('change', event => { chamber.setCutaway(event.target.checked); dirty = true; });
$('transparent').addEventListener('change', event => { chamber.setTransparent(event.target.checked); dirty = true; });
$('explode').addEventListener('input', event => {
  chamber.setExploded(event.target.value / 100); $('explode-value').textContent = `${event.target.value}%`; dirty = true;
});
$('particle-budget').addEventListener('input', event => {
  budget = Number(event.target.value); $('budget-value').textContent = String(budget); $('particle-max').textContent = String(budget); dirty = true;
});
function updatePower() {
  clock.setPower({ plasmaOn: $('plasma').checked, biasOn: $('bias').checked });
  $('source-status').textContent = clock.plasmaOn ? 'ICP SOURCE ON' : 'ICP SOURCE OFF';
  $('source-dot').style.background = clock.plasmaOn ? '' : '#687986';
  $('power-note').textContent = !clock.plasmaOn ? 'Source OFF · 새 입사와 표면 제거가 정지됩니다.' : !clock.biasOn ? 'Bias OFF · 흡착 유지, 방향성 활성화·제거 정지.' : 'Source와 bias는 독립적으로 제어됩니다.';
  dirty = true;
}
$('plasma').addEventListener('change', updatePower);
$('bias').addEventListener('change', updatePower);
function setPlaying(value) {
  clock.playing = value;
  $('play-symbol').textContent = value ? 'Ⅱ' : '▶'; $('play-text').textContent = value ? '일시정지' : '재생';
  $('play').setAttribute('aria-label', value ? '공정 일시정지' : '공정 재생');
}
$('play').addEventListener('click', () => setPlaying(!clock.playing));
$('reset').addEventListener('click', () => { clock.reset(); dirty = true; });
$('speed').addEventListener('change', event => { clock.speed = Number(event.target.value); });
STAGES.forEach((stage, i) => {
  const button = document.createElement('button'); button.className = 'stage-button'; button.dataset.stage = stage.id;
  button.innerHTML = `<span class="stage-number">0${i + 1}</span><b>${stage.title}</b><small>${stage.en}</small><span class="stage-progress"></span>`;
  button.addEventListener('click', () => { clock.seekStage(i); dirty = true; });
  $('stages').append(button);
});
SITES.forEach(site => { const option = document.createElement('option'); option.value = site.id; option.textContent = site.id; $('site').append(option); });
function selectSite(id) { selectedSite = id; $('site').value = id; dirty = true; }
$('site').addEventListener('change', event => selectSite(event.target.value));
const surfaceView = new SurfaceView($('surface'), selectSite);
const eventLabels = { arrival: '입사', adsorption: '표면 흡착', activation: '활성화', removal: '제거', exhaust: '배기' };
for (const [type, label] of Object.entries(eventLabels)) {
  const li = document.createElement('li'); li.dataset.event = type; li.innerHTML = `<span>${label}</span><small>대기</small>`; $('event-list').append(li);
}
viewport.addEventListener('keydown', event => {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '-'].includes(event.key)) return;
  event.preventDefault(); rig.cancel();
  const offset = camera.position.clone().sub(controls.target);
  const spherical = new THREE.Spherical().setFromVector3(offset);
  if (event.key === 'ArrowLeft') spherical.theta -= 0.12;
  if (event.key === 'ArrowRight') spherical.theta += 0.12;
  if (event.key === 'ArrowUp') spherical.phi -= 0.1;
  if (event.key === 'ArrowDown') spherical.phi += 0.1;
  if (event.key === '+') spherical.radius *= 0.9;
  if (event.key === '-') spherical.radius *= 1.1;
  spherical.makeSafe(); spherical.radius = THREE.MathUtils.clamp(spherical.radius, 3.2, 21);
  camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical)); dirty = true;
});

let last = performance.now();
let lastSoftware = 0;
let uiAt = 0;
let fpsAt = last;
let renderedFrames = 0;
let liveParticles = [];
let frameHandle;
document.addEventListener('visibilitychange', () => { last = performance.now(); });
function frame(now) {
  const delta = Math.max(0, (now - last) / 1000); last = now;
  clock.tick(delta);
  if (rig.transition) { rig.update(delta); dirty = true; }
  controls.update();
  const exploded = chamber.state.exploded;
  liveParticles = exploded > 0.01 ? [] : sampleParticles(clock, budget);
  glow.visible = clock.plasmaOn && (clock.stageIndex === 0 || clock.stageIndex === 2) && exploded < 0.01;
  glow.material.opacity = 0.025 + (clock.time % 1) * 0.005;
  sheath.visible = clock.plasmaOn && clock.biasOn && clock.stageIndex === 2 && exploded < 0.01;
  siteMarkers.visible = chamber.parts.get('wafer').visible;
  siteMarkers.position.copy(chamber.parts.get('wafer').position);
  for (const [i, site] of SITES.entries()) {
    const state = clock.siteState(site.id);
    markerColor.set(state.removed ? '#594d42' : state.activated ? '#efbb82' : state.adsorbed ? '#a2e5bd' : '#56788f');
    markerTransform.position.set(site.x, 0.474, site.z);
    markerTransform.scale.setScalar(site.id === selectedSite ? 1.65 : 1); markerTransform.updateMatrix();
    siteMarkers.setMatrixAt(i, markerTransform.matrix); siteMarkers.setColorAt(i, markerColor);
  }
  siteMarkers.instanceMatrix.needsUpdate = true;
  siteMarkers.instanceColor.needsUpdate = true;
  for (let i = 0; i < liveParticles.length; i++) {
    const p = liveParticles[i]; const color = colors[p.kind];
    particlePositions.set([p.x, p.y, p.z], i * 3); particleColors.set([color.r, color.g, color.b], i * 3);
  }
  particleGeometry.setDrawRange(0, liveParticles.length);
  particleGeometry.attributes.position.needsUpdate = true; particleGeometry.attributes.color.needsUpdate = true;
  if (mode === 'webgl' || dirty || (clock.playing && now - lastSoftware > 500)) {
    if (mode === 'software') { renderer.render(scene, camera, liveParticles); lastSoftware = now; } else renderer.render(scene, camera);
    renderedFrames++; dirty = false;
  }
  const partWorld = chamber.anchor(selectedPart).project(camera);
  const label = $('part-label');
  label.hidden = !chamber.parts.get(selectedPart).visible || partWorld.z > 1 || partWorld.z < -1;
  label.style.left = `${THREE.MathUtils.clamp((partWorld.x + 1) * viewport.clientWidth / 2, 8, Math.max(8, viewport.clientWidth - label.offsetWidth - 10))}px`;
  label.style.top = `${THREE.MathUtils.clamp((1 - partWorld.y) * viewport.clientHeight / 2, 55, viewport.clientHeight - 105)}px`;
  if (now - fpsAt > 800) { $('fps').textContent = String(Math.round(renderedFrames * 1000 / (now - fpsAt))); renderedFrames = 0; fpsAt = now; }
  if (now - uiAt > 80) {
    const index = clock.stageIndex;
    const stage = clock.stage;
    const tag = `0${index + 1} / ${stage.en.toUpperCase()}`;
    $('stage-tag').textContent = tag; $('stage-description-label').textContent = tag; $('stage-description').textContent = stage.description;
    $('clock').textContent = clock.time.toFixed(2).padStart(5, '0'); $('cycle').textContent = `CYCLE ${String(clock.cycle).padStart(3, '0')}`;
    $('particle-active').textContent = String(liveParticles.length);
    $('site-key').textContent = `C${clock.cycle} / ${selectedSite} · 같은 ID로 전체 경로 연결`;
    document.querySelectorAll('.stage-button').forEach((button, i) => {
      button.setAttribute('aria-pressed', String(i === index));
      button.querySelector('.stage-progress').style.width = `${i === index ? (clock.time - stage.start) / (stage.end - stage.start) * 100 : 0}%`;
    });
    const state = clock.siteState(selectedSite);
    $('event-list').querySelectorAll('li').forEach(li => {
      const event = state.events.find(event => event.type === li.dataset.event);
      li.className = event.status;
      li.querySelector('small').textContent = event.status === 'applied' ? `${event.at.toFixed(2)} s` : event.status === 'skipped' ? '조건 미충족' : `${event.at.toFixed(2)} s 대기`;
    });
    surfaceView.draw(clock, selectedSite); uiAt = now;
  }
  frameHandle = requestAnimationFrame(frame);
}
window.__fab = { clock, chamber, camera, get rig() { return rig; }, get mode() { return mode; },
  get particles() { return liveParticles; }, get renderer() { return renderer; }, get selectedSite() { return selectedSite; }, ready: true };
frameHandle = requestAnimationFrame(frame);
window.addEventListener('pagehide', () => {
  cancelAnimationFrame(frameHandle); controls.dispose(); renderer.dispose(); chamber.dispose();
  environment?.dispose(); particleGeometry.dispose(); particlesMesh.material.dispose(); spriteTexture.dispose();
  siteMarkers.geometry.dispose(); siteMarkers.material.dispose();
}, { once: true });
