import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const COMPONENTS = Object.freeze([
  { id: 'body', name: 'Aluminum body', ko: '알루미늄 챔버', material: 'Aluminum · vacuum boundary', note: '진공 경계를 이루는 금속 본체. 전면 절개로 내부 구조를 확인합니다.', anchor: [2.48, 1.2, 0], offset: [-0.3, 0, 0] },
  { id: 'liner', name: 'Removable liner', ko: '탈착식 라이너', material: 'Ceramic · replaceable shield', note: '챔버 벽을 보호하는 교체형 라이너. 본체와 분리해 교체하는 내부 보호 구조입니다.', anchor: [-2.19, 1.3, 0], offset: [0, 0.4, 0] },
  { id: 'coil', name: 'Planar RF coil', ko: '평면 유도 코일', material: 'Copper · inductive source', note: 'quartz window 위의 평면 나선 코일. 웨이퍼 바이어스와 별도의 에너지원입니다.', anchor: [0.85, 2.77, 0.9], offset: [0, 1.1, 0] },
  { id: 'window', name: 'Quartz window', ko: '유전체 윈도', material: 'Quartz · dielectric interface', note: '플라즈마 공간과 외부 코일 사이의 유전체 창입니다.', anchor: [1.6, 2.43, 0.7], offset: [0, 0.68, 0] },
  { id: 'gas', name: 'Gas-feed manifold', ko: '가스 분배 매니폴드', material: 'Metal · conceptual feed path', note: '가스를 상부 둘레로 공급하는 범용 개념 경로입니다. 분포는 가정값입니다.', anchor: [-1.6, 1.99, 0.6], offset: [0, 0.25, 0] },
  { id: 'esc', name: 'ESC assembly', ko: '정전 척 어셈블리', material: 'Ceramic / metal · wafer support', note: '웨이퍼 지지대와 절연층을 분리해 표현한 정전 척입니다.', anchor: [-0.85, 0.13, 0.9], offset: [0, -0.35, 0] },
  { id: 'focus', name: 'Focus ring', ko: '포커스 링', material: 'Ceramic · edge region', note: '웨이퍼 외곽의 경계 구조를 나타내는 별도 링입니다.', anchor: [1.58, 0.38, 0.5], offset: [0, 0.2, 0] },
  { id: 'wafer', name: '200 mm wafer', ko: '기준 웨이퍼', material: 'Silicon · nominal Ø 200 mm', note: '200 mm는 웨이퍼 직경의 시각화 기준입니다. 다른 부품의 실측 치수를 뜻하지 않습니다.', anchor: [0, 0.445, 0.9], offset: [0, 0.42, 0] },
  { id: 'slit', name: 'Transfer slit port', ko: '웨이퍼 이송 포트', material: 'Metal · open transfer passage', note: '본체의 슬롯과 연결된 사각 중공 이송 통로입니다.', anchor: [-3.0, 0.48, 0], offset: [-0.65, 0, 0] },
  { id: 'exhaust', name: 'Exhaust annulus', ko: '환형 배기부', material: 'Metal · peripheral exhaust', note: '척 주변의 환형 공간에서 하부 배기 경로로 이어집니다.', anchor: [1.9, -0.2, 0.8], offset: [0, -0.4, 0] },
  { id: 'pump', name: 'Throttle / pumping line', ko: '스로틀 · 펌핑 라인', material: 'Metal · conceptual outlet', note: '환형 배기부와 연결된 스로틀 밸브 및 하부 펌핑 라인입니다.', anchor: [3.2, -0.7, 0], offset: [0.4, -0.2, 0] },
  { id: 'bias', name: 'RF bias feed', ko: 'RF 바이어스 피드', material: 'Copper / dielectric · independent feed', note: 'ESC 아래에서 연결되는 독립 RF 바이어스 경로입니다.', anchor: [-1.1, -1.14, 0.6], offset: [0, -0.4, 0.2] },
]);

function ringGeometry(inner, outer, low, high, start = 0, length = Math.PI * 2) {
  return new THREE.LatheGeometry([
    new THREE.Vector2(inner, low), new THREE.Vector2(outer, low),
    new THREE.Vector2(outer, high), new THREE.Vector2(inner, high), new THREE.Vector2(inner, low),
  ], 96, start, length);
}

export function createChamber() {
  const root = new THREE.Group();
  root.name = 'production-style-icp';
  const parts = new Map();
  const clipPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0.08);
  const clipped = [];
  const shells = [];
  const aluminum = new THREE.MeshStandardMaterial({ color: '#a7b6c4', metalness: 0.86, roughness: 0.29 });
  const darkMetal = new THREE.MeshStandardMaterial({ color: '#354658', metalness: 0.8, roughness: 0.31 });
  const ceramic = new THREE.MeshStandardMaterial({ color: '#c2c8c8', metalness: 0.12, roughness: 0.39 });
  const copper = new THREE.MeshStandardMaterial({ color: '#d49968', metalness: 0.86, roughness: 0.24 });
  // PBR dielectric highlights with alpha compositing avoid an extra full-scene
  // refraction pass, especially costly on integrated/software GPUs.
  const quartz = new THREE.MeshPhysicalMaterial({ color: '#b4e1e6', metalness: 0, roughness: 0.12,
    clearcoat: 0.65, ior: 1.46, transparent: true, opacity: 0.25, depthWrite: false });
  const silicon = new THREE.MeshPhysicalMaterial({ color: '#244b67', metalness: 0.72, roughness: 0.19, clearcoat: 1, clearcoatRoughness: 0.15 });

  function part(id) {
    const group = new THREE.Group();
    group.name = id;
    group.userData = { component: id };
    root.add(group);
    parts.set(id, group);
    return group;
  }
  function mesh(group, geometry, material, position = [0, 0, 0], clip = false) {
    const instance = new THREE.Mesh(geometry, material.clone());
    instance.position.set(...position);
    instance.userData.component = group.name;
    instance.userData.cutaway = clip;
    instance.userData.materialKey = material.uuid;
    instance.castShadow = true;
    instance.receiveShadow = true;
    group.add(instance);
    if (clip) { clipped.push(instance.material); shells.push(instance); }
    if (instance.material.transparent) instance.renderOrder = 4;
    return instance;
  }
  function cylinder(group, radius, height, y, mat, x = 0, z = 0) {
    return mesh(group, new THREE.CylinderGeometry(radius, radius, height, 72), mat, [x, y, z]);
  }
  function tube(group, points, radius, mat, segments = 72) {
    return mesh(group, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point))), segments, radius, 10, false), mat);
  }
  function ring(group, inner, outer, low, high, mat, clip = false, start = 0, length = Math.PI * 2) {
    return mesh(group, ringGeometry(inner, outer, low, high, start, length), mat, [0, 0, 0], clip);
  }

  const body = part('body');
  ring(body, 2.34, 2.58, -0.46, 0.24, aluminum, true);
  ring(body, 2.34, 2.58, 0.67, 2.3, aluminum, true);
  // A real aperture in the middle band aligns with the hollow transfer duct (-X).
  ring(body, 2.34, 2.58, 0.24, 0.67, aluminum, true, Math.PI * 1.5 + 0.8, Math.PI * 2 - 1.6);
  for (const [low, high] of [[-0.56, -0.4], [2.24, 2.4]]) {
    ring(body, 2.26, 2.78, low, high, aluminum, true);
    for (let i = 0; i < 20; i++) {
      const angle = i / 20 * Math.PI * 2;
      const bolt = mesh(body, new THREE.CylinderGeometry(0.065, 0.065, 0.07, 6), darkMetal,
        [Math.sin(angle) * 2.65, high + 0.035, Math.cos(angle) * 2.65], true);
      bolt.name = 'flange-bolt';
    }
  }
  cylinder(body, 2.38, 0.22, -0.7, darkMetal);
  cylinder(body, 1.75, 0.2, -1.1, aluminum);
  const liner = part('liner');
  ring(liner, 2.18, 2.29, 0.68, 2.12, ceramic, true);
  ring(liner, 2.18, 2.29, -0.3, 0.23, ceramic, true);
  ring(liner, 2.18, 2.29, 0.23, 0.68, ceramic, true, Math.PI * 1.5 + 0.8, Math.PI * 2 - 1.6);
  ring(liner, 2.05, 2.3, 2.08, 2.17, ceramic, true);

  const coil = part('coil');
  const spiral = [];
  for (let i = 0; i <= 420; i++) {
    const p = i / 420;
    const angle = p * Math.PI * 2 * 4.3;
    const radius = 0.3 + p * 1.9;
    spiral.push([Math.cos(angle) * radius, 2.76, Math.sin(angle) * radius]);
  }
  tube(coil, spiral, 0.062, copper, 420).name = 'continuous-planar-spiral';
  const endAngle = Math.PI * 2 * 0.3;
  const outerLead = [spiral.at(-1), [Math.cos(endAngle) * 2.65, 2.76, Math.sin(endAngle) * 2.65]];
  for (let i = 1; i <= 14; i++) {
    const angle = endAngle + (0.14 - endAngle) * i / 14;
    outerLead.push([Math.cos(angle) * 2.8, 2.76, Math.sin(angle) * 2.8]);
  }
  outerLead.push([3.0, 2.76, 0.4]);
  tube(coil, outerLead, 0.062, copper);
  tube(coil, [[0.3, 2.76, 0], [0.25, 2.95, -0.3], [2.9, 2.95, -0.3]], 0.055, copper);
  mesh(coil, new THREE.BoxGeometry(0.68, 0.35, 1.05), darkMetal, [3.05, 2.83, 0.06]);
  for (let i = 0; i < 4; i++) {
    const angle = i * Math.PI / 2;
    cylinder(coil, 0.09, 0.28, 2.58, ceramic, Math.sin(angle) * 2.25, Math.cos(angle) * 2.25);
  }
  const window = part('window');
  cylinder(window, 2.28, 0.14, 2.43, quartz);
  ring(window, 2.24, 2.36, 2.36, 2.5, darkMetal, true);

  const gas = part('gas');
  const manifold = mesh(gas, new THREE.TorusGeometry(1.97, 0.065, 12, 96), aluminum, [0, 2.0, 0], true);
  manifold.rotation.x = Math.PI / 2;
  for (let i = 0; i < 16; i++) {
    const a = i * Math.PI / 8;
    cylinder(gas, 0.035, 0.2, 1.9, darkMetal, Math.sin(a) * 1.97, Math.cos(a) * 1.97);
  }
  tube(gas, [[0, 2, -1.97], [0, 2.1, -2.6], [0.2, 2.65, -2.85], [0.2, 3.1, -2.85]], 0.07, aluminum);

  const esc = part('esc');
  cylinder(esc, 0.56, 0.94, -0.43, darkMetal);
  cylinder(esc, 1.42, 0.24, 0.08, aluminum);
  cylinder(esc, 1.4, 0.1, 0.25, ceramic);
  cylinder(esc, 1.41, 0.055, 0.328, darkMetal);
  cylinder(esc, 1.42, 0.06, 0.385, ceramic);
  const focus = part('focus');
  ring(focus, 1.46, 1.68, 0.32, 0.45, ceramic);
  ring(focus, 1.67, 1.77, 0.22, 0.37, darkMetal);

  const wafer = part('wafer');
  const shape = new THREE.Shape();
  for (let i = 0; i <= 160; i++) {
    const angle = i / 160 * Math.PI * 2;
    const radius = Math.abs(angle - Math.PI * 1.5) < 0.035 ? 1.4 : 1.45;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    if (i === 0) shape.moveTo(x, z); else shape.lineTo(x, z);
  }
  const disk = mesh(wafer, new THREE.ExtrudeGeometry(shape, { depth: 0.025, bevelEnabled: false }), silicon, [0, 0.45, 0]);
  disk.rotation.x = Math.PI / 2;
  const gridPositions = [];
  for (let d = -1.25; d <= 1.25; d += 0.19) {
    const extent = Math.sqrt(1.43 ** 2 - d ** 2);
    gridPositions.push(d, 0.452, -extent, d, 0.452, extent, -extent, 0.452, d, extent, 0.452, d);
  }
  const grid = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(gridPositions, 3)),
    new THREE.LineBasicMaterial({ color: '#74a3ba', transparent: true, opacity: 0.18, depthWrite: false }));
  wafer.add(grid);

  const slit = part('slit');
  // The conceptual transfer opening is wider than the reference wafer diameter.
  for (const y of [0.22, 0.7]) mesh(slit, new THREE.BoxGeometry(2.1, 0.13, 3.41), aluminum, [-2.7, y, 0]);
  for (const z of [-1.64, 1.64]) mesh(slit, new THREE.BoxGeometry(2.1, 0.36, 0.13), aluminum, [-2.7, 0.46, z]);
  for (const y of [0.15, 0.77]) mesh(slit, new THREE.BoxGeometry(0.12, 0.12, 3.7), darkMetal, [-3.75, y, 0]);
  for (const z of [-1.79, 1.79]) mesh(slit, new THREE.BoxGeometry(0.12, 0.62, 0.12), darkMetal, [-3.75, 0.46, z]);

  const exhaust = part('exhaust');
  ring(exhaust, 1.77, 2.25, -0.33, -0.26, darkMetal);
  ring(exhaust, 2.17, 2.26, -0.25, 0.08, aluminum, true);
  for (let i = 0; i < 28; i++) {
    const angle = i / 28 * Math.PI * 2;
    const spoke = mesh(exhaust, new THREE.BoxGeometry(0.04, 0.07, 0.42), aluminum, [Math.sin(angle) * 1.97, -0.2, Math.cos(angle) * 1.97]);
    spoke.rotation.y = angle;
  }
  const pump = part('pump');
  tube(pump, [[1.96, -0.42, 0], [2.5, -0.64, 0], [3.1, -0.72, 0], [3.5, -1.1, 0], [3.5, -1.9, 0]], 0.26, aluminum);
  for (const x of [2.65, 3.04]) {
    const flange = cylinder(pump, 0.4, 0.085, -0.69, darkMetal, x);
    flange.rotation.z = Math.PI / 2;
  }
  mesh(pump, new THREE.BoxGeometry(0.35, 0.32, 0.55), darkMetal, [2.84, -0.23, 0]);
  cylinder(pump, 0.46, 0.55, -1.72, darkMetal, 3.5);
  const bias = part('bias');
  tube(bias, [[0, -0.75, 0], [0, -1.25, 0], [-0.7, -1.36, 0.35], [-1.6, -1.36, 0.75], [-2.3, -1.1, 0.8]], 0.065, copper);
  cylinder(bias, 0.14, 0.35, -0.95, ceramic);

  // Batch only meshes within an independently removable component and identical
  // material/clipping state. Geometry and component identity remain intact.
  for (const group of parts.values()) {
    const buckets = new Map();
    for (const node of group.children) {
      if (!node.isMesh) continue;
      const key = `${node.userData.materialKey}-${node.userData.cutaway}`;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(node);
    }
    for (const nodes of buckets.values()) {
      if (nodes.length < 2) continue;
      const geometries = nodes.map(node => { node.updateMatrix(); return node.geometry.clone().applyMatrix4(node.matrix); });
      const merged = new THREE.Mesh(mergeGeometries(geometries), nodes[0].material);
      merged.userData = { ...nodes[0].userData };
      merged.castShadow = true; merged.receiveShadow = true;
      for (const node of nodes) {
        group.remove(node); node.geometry.dispose();
        if (node.material !== merged.material) node.material.dispose();
      }
      geometries.forEach(geometry => geometry.dispose());
      group.add(merged);
    }
  }
  clipped.length = 0; shells.length = 0;
  root.traverse(node => { if (node.isMesh && node.userData.cutaway) { clipped.push(node.material); shells.push(node); } });

  let cutaway = true;
  let transparent = false;
  let exploded = 0;
  function setCutaway(value) {
    cutaway = Boolean(value);
    for (const material of clipped) {
      material.clippingPlanes = cutaway ? [clipPlane] : [];
      material.side = THREE.DoubleSide;
      material.needsUpdate = true;
    }
  }
  function setTransparent(value) {
    transparent = Boolean(value);
    for (const shell of shells) {
      shell.material.transparent = transparent;
      shell.material.opacity = transparent ? 0.18 : 1;
      shell.material.depthWrite = !transparent;
      shell.renderOrder = transparent ? 5 : 0;
      shell.material.needsUpdate = true;
    }
  }
  function setExploded(value) {
    exploded = THREE.MathUtils.clamp(Number(value) || 0, 0, 1);
    for (const descriptor of COMPONENTS) parts.get(descriptor.id).position.set(...descriptor.offset.map(v => v * exploded));
  }
  function setVisible(id, visible) { if (parts.has(id)) parts.get(id).visible = Boolean(visible); }
  function anchor(id) {
    const descriptor = COMPONENTS.find(item => item.id === id) || COMPONENTS[0];
    return parts.get(descriptor.id).localToWorld(new THREE.Vector3(...descriptor.anchor));
  }
  setCutaway(true);
  return { root, parts, setCutaway, setTransparent, setExploded, setVisible, anchor,
    get state() { return { cutaway, transparent, exploded }; },
    dispose() { root.traverse(node => { node.geometry?.dispose(); if (node.material) node.material.dispose(); }); },
  };
}
