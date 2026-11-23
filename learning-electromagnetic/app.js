/* Educational models, deliberately separated from the Three.js presentation. */
(() => {
  'use strict';
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  function calculateEMI(thicknessUm, frequencyGHz, reflectionPct) {
    const mu0 = 4 * Math.PI * 1e-7;
    const conductivity = 1e6;
    const deltaUm = 1e6 / Math.sqrt(Math.PI * frequencyGHz * 1e9 * mu0 * conductivity);
    const R = reflectionPct / 100;
    const T = (1 - R) * Math.exp(-2 * thicknessUm / deltaUm);
    const A = 1 - R - T;
    return { R, A, T, deltaUm, seDb: -10 * Math.log10(T) };
  }
  function calculateSuper(temperatureK) {
    const tc = 92;
    const superconducting = temperatureK < tc;
    return { tc, superconducting, ratio: temperatureK / tc, resistance: superconducting ? 0 : 1 + .003 * (temperatureK - tc) };
  }
  function calculateMeta(wavelengthNm, pitchNm, phaseDeg) {
    const sine = wavelengthNm * phaseDeg / (360 * pitchNm);
    const propagating = Math.abs(sine) <= 1;
    return { sine, propagating, angleDeg: propagating ? Math.asin(sine) * 180 / Math.PI : null };
  }
  globalThis.MaterialsLabModel = Object.freeze({ calculateEMI, calculateSuper, calculateMeta });
  if (typeof document === 'undefined') return;
  const root = document.getElementById('materialsLab');
  if (!root) return;
  const $ = selector => root.querySelector(selector);
  const $$ = selector => Array.from(root.querySelectorAll(selector));
  const topics = ['emi', 'super', 'meta'];
  const scenes = {};
  const results = {};
  const reducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const paused = { emi: reducedMotion, super: reducedMotion, meta: reducedMotion };
  const elapsed = { emi: 0, super: 0, meta: 0 };
  let active = 'emi';
  let previousFrame = 0;
  const palette = { cyan: 0x71dfe5, blue: 0x77b4ff, purple: 0xbd9bff, amber: 0xffc47d };
  const number = id => Number($('#' + id).value);
  const signed = (value, digits) => (value > 0 ? '+' : value < 0 ? '−' : '') + Math.abs(value).toFixed(digits);

  function updateEMI() {
    const thickness = number('emiThickness'), frequency = number('emiFrequency'), reflect = number('emiReflection');
    const result = results.emi = calculateEMI(thickness, frequency, reflect);
    $('#emiThicknessOut').textContent = thickness.toFixed(1) + ' μm';
    $('#emiFrequencyOut').textContent = frequency.toFixed(1) + ' GHz';
    $('#emiReflectionOut').textContent = reflect + '%';
    ['R', 'A', 'T'].forEach(key => {
      const percent = (100 * result[key]).toFixed(1) + '%';
      $('#' + key.toLowerCase() + 'Value').textContent = percent;
      $('#' + key.toLowerCase() + 'Segment').style.width = (100 * result[key]) + '%';
    });
    $('#energyBar').setAttribute('aria-label', `반사 ${(100 * result.R).toFixed(1)}%, 흡수 ${(100 * result.A).toFixed(1)}%, 투과 ${(100 * result.T).toFixed(1)}%`);
    $('#skinValue').textContent = result.deltaUm.toFixed(2) + ' μm';
    $('#seValue').textContent = result.seDb.toFixed(2) + ' dB';
    $('#doubleThickness').disabled = thickness >= 50;
    if (scenes.emi?.update) scenes.emi.update(thickness, frequency, result);
    renderFallback('emi');
  }

  function updateSuper() {
    const temperature = number('superTemperature');
    const mode = $('input[name="fieldMode"]:checked').value;
    const result = results.super = { ...calculateSuper(temperature), mode, temperature };
    $('#superTemperatureOut').textContent = temperature + ' K';
    $('#superState').textContent = result.superconducting ? '초전도 상태' : '정상 상태';
    $('#superState').style.color = result.superconducting ? 'var(--lab-cyan)' : 'var(--lab-amber)';
    $('#superRatio').textContent = result.ratio.toFixed(2);
    $('#superResistance').textContent = result.resistance.toFixed(2);
    $('#superExplanation').textContent = !result.superconducting ? '임계온도 이상입니다. 이 모델에서는 자기장이 내부를 통과하고 저항이 생깁니다.' : mode === 'meissner' ? '약한 외부장을 내부에서 밀어내는 마이스너 효과를 관찰합니다.' : '혼합상을 가정합니다. 일부 자속이 침투하고 결함에 고정된 모습을 표현합니다.';
    $('#superSceneCaption').textContent = !result.superconducting ? 'T ≥ Tc · 정상 상태의 재료를 통과하는 자기장 선' : mode === 'meissner' ? 'T < Tc · 초전도체 바깥으로 휘어지는 자기장 선' : 'T < Tc · 혼합상에서 결함에 고정된 자속(정성 표현)';
    $('#crossTc').innerHTML = result.superconducting ? 'T<sub>c</sub> 위로 올리기' : 'T<sub>c</sub> 아래로 내리기';
    $('#resistanceDot').setAttribute('cx', String(45 + 390 * (temperature - 10) / 130));
    $('#resistanceDot').setAttribute('cy', String(125 - 75 * result.resistance));
    if (scenes.super?.update) scenes.super.update(result);
    renderFallback('super');
  }

  function updateMeta() {
    const wavelength = number('metaWavelength'), pitch = number('metaPitch'), phase = number('metaPhase');
    const result = results.meta = { ...calculateMeta(wavelength, pitch, phase), wavelength, pitch, phase };
    $('#metaWavelengthOut').textContent = wavelength + ' nm';
    $('#metaPitchOut').textContent = pitch + ' nm';
    $('#metaPhaseOut').textContent = signed(phase, 0) + '°';
    $('#metaAngle').textContent = result.propagating ? signed(result.angleDeg, 1) + '°' : '전파 해 없음';
    $('#metaAngle').classList.toggle('invalid', !result.propagating);
    $('#metaSine').textContent = result.sine.toFixed(3);
    $('#metaExplanation').textContent = !result.propagating ? '|sin θ| > 1입니다. 이 위상 구배 식이 지정하는 전파 방향이 존재하지 않습니다. 다른 회절·반사 경로는 생략했습니다.' : phase === 0 ? '위상 구배가 0입니다. 파면은 정면으로 진행합니다.' : (phase > 0 ? '+x' : '−x') + ' 방향으로 기울어진 파면을 관찰합니다.';
    $('#metaSceneCaption').textContent = !result.propagating ? '전파 해 없음 · 지정된 방향의 투과 파면을 표시하지 않습니다' : '인접한 기둥마다 위상차 → ' + (phase === 0 ? '정면으로 진행하는 파면' : '기울어진 투과 파면');
    if (scenes.meta?.update) scenes.meta.update(result);
    renderFallback('meta');
  }

  function remember() {
    const host = globalThis.openai;
    if (!host?.setWidgetState) return;
    const inputs = {};
    $$('.controls input[type="range"]').forEach(input => { inputs[input.id] = input.value; });
    const snapshot = { topic: active, inputs, mode: $('input[name="fieldMode"]:checked').value };
    host.setWidgetState({ modelContent: snapshot, privateContent: null }).catch(() => {});
  }
  function restore(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') return;
    if (snapshot.inputs && typeof snapshot.inputs === 'object') {
      $$('.controls input[type="range"]').forEach(input => {
        const value = Number(snapshot.inputs[input.id]);
        if (Number.isFinite(value)) input.value = String(clamp(value, +input.min, +input.max));
      });
    }
    if (['meissner', 'pinning'].includes(snapshot.mode)) $('input[value="' + snapshot.mode + '"]').checked = true;
    if (topics.includes(snapshot.topic)) active = snapshot.topic;
  }

  function activate(topic, moveFocus = false) {
    active = topic;
    topics.forEach(key => {
      const selected = key === topic;
      const tab = $('#tab-' + key);
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      $('#panel-' + key).hidden = !selected;
    });
    if (moveFocus) $('#tab-' + topic).focus();
    if (!(topic in scenes)) scenes[topic] = createScene(topic === 'super' ? 'superCanvas' : topic + 'Canvas', topic);
    if (topic === 'emi') updateEMI();
    else if (topic === 'super') updateSuper();
    else updateMeta();
    scenes[topic]?.resize?.();
  }

  function material(color, opacity = 1) {
    return new THREE.MeshStandardMaterial({ color, metalness: .25, roughness: .4, transparent: opacity < 1, opacity, side: THREE.DoubleSide });
  }
  function line(points, color, opacity = 1) {
    return new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity }));
  }
  function disposeContents(group) {
    while (group.children.length) {
      const child = group.children[0];
      child.traverse(item => {
        item.geometry?.dispose();
        const materials = Array.isArray(item.material) ? item.material : item.material ? [item.material] : [];
        materials.forEach(m => { m.map?.dispose(); m.dispose(); });
      });
      group.remove(child);
    }
  }
  function arrow(group, from, to, color, length = .28) {
    const origin = new THREE.Vector3(...from);
    const difference = new THREE.Vector3(...to).sub(origin);
    const helper = new THREE.ArrowHelper(difference.clone().normalize(), origin, difference.length(), color, length, length * .45);
    group.add(helper);
    return helper;
  }
  function textSprite(text, color = '#d5e2ef') {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 80;
    const ctx = canvas.getContext('2d');
    ctx.font = '500 28px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = color; ctx.fillText(text, 256, 40);
    const texture = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false, transparent: true }));
    sprite.scale.set(3.8, .594, 1);
    return sprite;
  }

  function createScene(canvasId, topic) {
    const canvas = $('#' + canvasId);
    let renderer;
    try {
      if (!globalThis.THREE) throw new Error('Three.js unavailable');
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2));
      renderer.setClearColor(0x0b1729);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      const scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0x0b1729, 15, 31);
      const camera = new THREE.PerspectiveCamera(40, 1, .1, 80);
      camera.position.set(8, 5.5, 10);
      camera.lookAt(0, .3, 0);
      const group = new THREE.Group(); scene.add(group);
      scene.add(new THREE.HemisphereLight(0xd7f2ff, 0x192d47, 2.2));
      const light = new THREE.DirectionalLight(0xe1f6ff, 2.4); light.position.set(4, 9, 5); scene.add(light);
      const rim = new THREE.DirectionalLight(0x65a5ff, 1.2); rim.position.set(-5, 3, -4); scene.add(rim);
      const grid = new THREE.GridHelper(18, 24, 0x304761, 0x1b3049); grid.position.y = -1.65; group.add(grid);
      const api = { renderer, scene, camera, group, topic, zoom: 1 };
      api.resize = () => {
        const rect = canvas.parentElement.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;
        renderer.setSize(rect.width, rect.height, false);
        camera.aspect = rect.width / rect.height; camera.updateProjectionMatrix();
      };
      api.resetView = () => { group.rotation.set(0, 0, 0); api.zoom = 1; camera.zoom = 1; camera.updateProjectionMatrix(); };
      const observer = new ResizeObserver(api.resize); observer.observe(canvas.parentElement); api.observer = observer;
      let drag = null;
      canvas.addEventListener('pointerdown', event => {
        drag = { x: event.clientX, y: event.clientY };
        canvas.setPointerCapture(event.pointerId);
      });
      canvas.addEventListener('pointermove', event => {
        if (!drag) return;
        group.rotation.y += (event.clientX - drag.x) * .006;
        group.rotation.x = clamp(group.rotation.x + (event.clientY - drag.y) * .004, -.65, .65);
        drag = { x: event.clientX, y: event.clientY };
      });
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => canvas.addEventListener(type, () => { drag = null; }));
      canvas.addEventListener('wheel', event => {
        // A modifier prevents the canvas from trapping ordinary page scrolling.
        if (!event.ctrlKey && !event.shiftKey && !canvas.matches(':hover')) return;
        event.preventDefault();
        api.zoom = clamp(api.zoom * Math.exp(-event.deltaY * .001), .7, 1.7);
        camera.zoom = api.zoom; camera.updateProjectionMatrix();
      }, { passive: false });
      canvas.addEventListener('webglcontextlost', event => {
        event.preventDefault(); api.lost = true; showFallback(topic); renderFallback(topic);
      });
      if (topic === 'emi') buildEMI(api);
      else if (topic === 'super') buildSuper(api);
      else buildMeta(api);
      api.resize();
      return api;
    } catch (error) {
      renderer?.dispose();
      showFallback(topic);
      return { fallback: true };
    }
  }

  function buildEMI(api) {
    const { group } = api;
    const plate = new THREE.Mesh(new THREE.BoxGeometry(1, 3.7, 3.4), material(0x728eaf, .77));
    plate.position.y = .25; group.add(plate);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(plate.geometry), new THREE.LineBasicMaterial({ color: 0xb5d9f1, transparent: true, opacity: .65 }));
    plate.add(edges);
    const label = textSprite('도체 · 두께 과장'); label.position.set(0, 2.55, 0); group.add(label);
    const waves = new THREE.Group(); group.add(waves);
    const arrows = new THREE.Group(); group.add(arrows);
    const energy = new THREE.Group(); group.add(energy);
    const sparks = [];
    for (let i = 0; i < 18; i++) {
      const point = new THREE.Mesh(new THREE.SphereGeometry(.045, 6, 4), material(palette.purple));
      energy.add(point); sparks.push(point);
    }
    const paths = [];
    function addWave(start, end, y, z, color, fraction, direction, frequency) {
      const count = 90;
      const positions = new Float32Array(count * 3);
      const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const wave = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity: fraction > 0 ? .95 : 0 }));
      waves.add(wave);
      paths.push({ start, end, y, z, amplitude: .42 * Math.sqrt(fraction), direction, frequency, positions, geometry, count });
    }
    api.update = (thickness, frequency, result) => {
      plate.scale.x = .18 + thickness * .026;
      disposeContents(waves); disposeContents(arrows); paths.length = 0;
      const edge = plate.scale.x / 2;
      const visualFreq = .7 + Math.sqrt(frequency) * .6;
      [-.9, .9].forEach(z => {
        addWave(-5.6, -edge - .2, .65, z, palette.cyan, 1, 1, visualFreq);
        addWave(-5.6, -edge - .2, -.65, z, palette.blue, result.R, -1, visualFreq);
        addWave(edge + .2, 5.4, .2, z, palette.amber, result.T, 1, visualFreq);
      });
      arrow(arrows, [-4.8, 1.55, 0], [-2.7, 1.55, 0], palette.cyan);
      if (result.R > .001) arrow(arrows, [-2.7, -1.05, 0], [-4.8, -1.05, 0], palette.blue);
      if (result.T > .0001) arrow(arrows, [2.7, 1.1, 0], [4.8, 1.1, 0], palette.amber);
      sparks.forEach(spark => { spark.material.emissive.setHex(palette.purple); spark.material.emissiveIntensity = result.A * .7; spark.visible = result.A > .0001; });
      api.draw(elapsed.emi);
    };
    api.draw = time => {
      paths.forEach(path => {
        for (let i = 0; i < path.count; i++) {
          const x = path.start + (path.end - path.start) * i / (path.count - 1);
          path.positions[i * 3] = x;
          path.positions[i * 3 + 1] = path.y + path.amplitude * Math.sin(x * 4 * path.frequency - time * 3.2 * path.direction);
          path.positions[i * 3 + 2] = path.z;
        }
        path.geometry.attributes.position.needsUpdate = true;
      });
      sparks.forEach((spark, i) => {
        spark.position.set(Math.sin(time * 1.5 + i * 2.3) * plate.scale.x * .38, -.95 + ((i * .137 + time * .11) % 1) * 2.5, Math.sin(i * 3.1 + time * .5) * 1.3);
        spark.scale.setScalar(.7 + .5 * Math.sin(time * 3 + i));
      });
    };
  }

  function buildSuper(api) {
    const { group } = api;
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, .45, 60), material(palette.purple));
    disc.position.y = -.7; group.add(disc);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.96, .025, 8, 60), material(0xd9c7ff));
    ring.rotation.x = Math.PI / 2; ring.position.y = -.46; group.add(ring);
    const magnet = new THREE.Group();
    const north = new THREE.Mesh(new THREE.BoxGeometry(1.3, .33, 1.2), material(0xff8f93)); north.position.y = .165;
    const south = new THREE.Mesh(new THREE.BoxGeometry(1.3, .33, 1.2), material(palette.blue)); south.position.y = -.165;
    magnet.add(north, south); magnet.position.y = 1.5; group.add(magnet);
    const nLabel = textSprite('N / S 자석'); nLabel.position.set(0, 2.6, 0); group.add(nLabel);
    const discLabel = textSprite('제2종 초전도체'); discLabel.position.set(0, -1.42, 2.8); group.add(discLabel);
    const fields = new THREE.Group(); group.add(fields);
    const defects = new THREE.Group(); group.add(defects);
    const particles = new THREE.Group(); group.add(particles);
    const paths = [], dots = [];
    const defectPoints = [[-.9, -.46, -.75], [0, -.46, .35], [.9, -.46, -.5]];
    defectPoints.forEach(position => {
      const defect = new THREE.Mesh(new THREE.SphereGeometry(.095, 10, 8), material(palette.amber));
      defect.position.set(...position); defects.add(defect);
    });
    api.rebuildFieldLines = result => rebuildFieldLines(api, fields, particles, paths, dots, result, defectPoints);
    api.update = result => {
      api.superResult = result;
      disc.material.color.setHex(result.superconducting ? palette.purple : 0x687385);
      disc.material.emissive.setHex(result.superconducting ? 0x26203b : 0x000000);
      defects.visible = result.superconducting && result.mode === 'pinning';
      api.rebuildFieldLines(result);
      api.draw(elapsed.super);
    };
    api.draw = time => {
      const result = api.superResult;
      if (!result) return;
      // Symbolic gap only; no force, field strength, or equilibrium calculation.
      magnet.position.y = result.superconducting ? 1.25 + .025 * Math.sin(time * 1.5) : -.125;
      nLabel.position.y = magnet.position.y + .9;
      dots.forEach((dot, i) => {
        dot.position.copy(paths[i].getPointAt((time * .13 + i * .061) % 1));
      });
    };
  }

  function rebuildFieldLines(api, fields, particles, paths, dots, result, defectPoints) {
    disposeContents(fields); disposeContents(particles); paths.length = 0; dots.length = 0;
    function addCurve(points, color, opacity) {
      const curve = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point)));
      fields.add(line(curve.getPoints(70), color, opacity));
      const dot = new THREE.Mesh(new THREE.SphereGeometry(.043, 7, 5), material(color));
      particles.add(dot); paths.push(curve); dots.push(dot);
      const center = curve.getPointAt(.5), ahead = curve.getPointAt(.54);
      const marker = new THREE.ArrowHelper(ahead.sub(center).normalize(), center, .28, color, .13, .07);
      fields.add(marker);
    }
    for (let i = 0; i < 14; i++) {
      const angle = i / 14 * Math.PI * 2;
      const c = Math.cos(angle), s = Math.sin(angle);
      const radius = 1.05 + (i % 3) * .35;
      if (result.superconducting && result.mode === 'meissner') {
        addCurve([[c * radius, -2, s * radius], [c * 2.5, -1.25, s * 2.5], [c * 2.65, -.65, s * 2.65], [c * 2.35, .15, s * 2.35], [c * radius, 2.35, s * radius]], palette.cyan, .62);
      } else if (!result.superconducting) {
        addCurve([[c * radius, -2, s * radius], [c * radius, -.7, s * radius], [c * radius, .55, s * radius], [c * radius, 2.35, s * radius]], palette.cyan, .5);
      } else {
        addCurve([[c * radius, -2, s * radius], [c * 2.5, -1.25, s * 2.5], [c * 2.65, -.65, s * 2.65], [c * 2.2, .2, s * 2.2], [c * radius, 2.35, s * radius]], palette.cyan, .34);
      }
    }
    if (result.superconducting && result.mode === 'pinning') {
      defectPoints.forEach(([x, y, z]) => addCurve([[x * .8, -2, z * .8], [x, -1, z], [x, y, z], [x, .2, z], [x * .8, 2.4, z * .8]], palette.amber, 1));
      const label = textSprite('결함에 고정된 자속', '#ffc47d'); label.position.set(0, -.2, 3.1); fields.add(label);
    }
  }

  function buildMeta(api) {
    const { group } = api;
    api.camera.position.set(8, 6, 11); api.camera.lookAt(0, .1, 0);
    const substrate = new THREE.Mesh(new THREE.BoxGeometry(7, .15, 3.8), material(0x2b4665, .6));
    substrate.position.y = -.85; group.add(substrate);
    const pillars = new THREE.Group(); group.add(pillars);
    const waves = new THREE.Group(); group.add(waves);
    const directions = new THREE.Group(); group.add(directions);
    const label = textSprite('메타표면 · 나노 기둥 배열'); label.position.set(0, -1.6, 2.7); group.add(label);
    api.update = result => {
      api.metaResult = result;
      buildPillars(pillars, result);
      buildWavefronts(waves, directions, result);
      api.draw(elapsed.meta);
    };
    api.draw = time => {
      const result = api.metaResult;
      if (!result) return;
      waves.children.forEach(wave => {
        const data = wave.userData;
        const travel = (data.index / 4 + time * .14) % 1;
        if (data.incident) {
          wave.position.y = -3.6 + travel * 2.3;
          wave.position.x = 0;
        } else {
          const angle = result.angleDeg * Math.PI / 180;
          const distance = .7 + travel * 3.4;
          wave.position.set(Math.sin(angle) * distance, Math.cos(angle) * distance - .25, 0);
        }
        wave.material.opacity = .12 + Math.sin(travel * Math.PI) * .3;
      });
    };
  }

  function buildPillars(pillars, result) {
    disposeContents(pillars);
    const spacing = .52 + (result.pitch - 120) / 480 * .2;
    for (let i = 0; i < 9; i++) {
      const phase = ((((i - 4) * result.phase) % 360) + 360) % 360;
      const height = .28 + phase / 360 * .7;
      for (let j = 0; j < 4; j++) {
        const color = new THREE.Color().setHSL(.49 + phase / 360 * .27, .6, .6);
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(.15, .15, height, 12), material(color));
        pillar.position.set((i - 4) * spacing, -.775 + height / 2, (j - 1.5) * .8);
        pillars.add(pillar);
      }
    }
  }

  function buildWavefronts(waves, directions, result) {
    disposeContents(waves); disposeContents(directions);
    const width = 5.2;
    function addPlane(index, incident) {
      const shape = new THREE.PlaneGeometry(width, 3.25);
      const plane = new THREE.Mesh(shape, new THREE.MeshBasicMaterial({ color: incident ? palette.cyan : palette.amber, side: THREE.DoubleSide, transparent: true, opacity: .28, depthWrite: false }));
      plane.rotation.x = -Math.PI / 2;
      const wrapper = new THREE.Group();
      // The wavefront is perpendicular to k = (sin(theta), cos(theta), 0).
      if (!incident) wrapper.rotation.z = -result.angleDeg * Math.PI / 180;
      wrapper.add(plane);
      const border = new THREE.LineSegments(new THREE.EdgesGeometry(shape), new THREE.LineBasicMaterial({ color: incident ? palette.cyan : palette.amber, transparent: true, opacity: .65 }));
      border.rotation.x = -Math.PI / 2; wrapper.add(border);
      wrapper.userData = { index, incident };
      // Expose the plane material for the animation without duplicating geometry.
      wrapper.material = plane.material;
      waves.add(wrapper);
    }
    for (let i = 0; i < 4; i++) {
      addPlane(i, true);
      if (result.propagating) addPlane(i, false);
    }
    arrow(directions, [-3.5, -3.3, 0], [-3.5, -.95, 0], palette.cyan);
    if (result.propagating) {
      const angle = result.angleDeg * Math.PI / 180;
      arrow(directions, [0, .2, 0], [Math.sin(angle) * 3.5, .2 + Math.cos(angle) * 3.5, 0], palette.amber);
      const label = textSprite('θ = ' + signed(result.angleDeg, 1) + '°', '#ffc47d');
      label.position.set(Math.sin(angle) * 3.6, .8 + Math.cos(angle) * 3.6, 0); directions.add(label);
    } else {
      const label = textSprite('전파 해 없음', '#ffc47d'); label.position.set(0, 1.5, 0); directions.add(label);
    }
  }

  function showFallback(topic) {
    const panel = $('#panel-' + topic);
    panel.classList.add('render-fallback');
    panel.querySelector('.fallback').hidden = false;
    const label = panel.querySelector('.live-label');
    label.innerHTML = '<i></i>2D 대체 보기 · 3D 미지원';
    panel.querySelector('[data-motion]').disabled = true;
    panel.querySelector('[data-view]').disabled = true;
    panel.querySelector('.scene-legend > small').textContent = '슬라이더와 계산은 계속 사용 가능';
  }
  function renderFallback(topic) {
    const panel = $('#panel-' + topic);
    if (!panel.classList.contains('render-fallback') || !results[topic]) return;
    const result = results[topic];
    let content = '';
    const arrowMark = '<defs><marker id="fallback-arrow-' + topic + '" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10" fill="context-stroke"/></marker></defs>';
    const marker = ' marker-end="url(#fallback-arrow-' + topic + ')"';
    if (topic === 'emi') {
      const width = 18 + number('emiThickness') * .6;
      const x = 250 - width / 2;
      content = `<rect class="fallback-solid" x="${x}" y="55" width="${width}" height="155" rx="3"/><path class="fallback-in" d="M35 95H${x - 10}"${marker}/><path class="fallback-reflect" d="M${x - 10} 155H35"${marker}/><path class="fallback-out" d="M${x + width + 10} 125H465"${marker}/><text x="35" y="78">입사 100%</text><text x="35" y="185">반사 ${(result.R * 100).toFixed(1)}%</text><text x="330" y="110">투과 ${(result.T * 100).toFixed(1)}%</text><text x="250" y="242" text-anchor="middle">흡수 ${(result.A * 100).toFixed(1)}% · 두께 ${number('emiThickness').toFixed(1)} μm</text>`;
    } else if (topic === 'super') {
      content = '<rect class="fallback-super" x="150" y="145" width="200" height="35" rx="15"/><rect class="fallback-solid" x="220" y="70" width="60" height="32" rx="3"/>';
      for (let i = 0; i < 7; i++) {
        const x = 175 + i * 25;
        const bow = result.superconducting ? (x < 250 ? -80 : 80) : 0;
        content += `<path class="fallback-in" d="M${x} 225C${x + bow} 175 ${x + bow} 140 ${x} 25"${marker}/>`;
      }
      if (result.superconducting && result.mode === 'pinning') content += '<path class="fallback-out" d="M230 225V110M270 225V110"/><text x="250" y="258" text-anchor="middle">혼합상 · 고정된 자속</text>';
      else content += `<text x="250" y="258" text-anchor="middle">${result.superconducting ? '약한 자기장 배제' : '정상 상태 · 자기장 통과'}</text>`;
    } else {
      content = '<path class="fallback-solid" d="M90 170H410V180H90Z"/>';
      for (let i = 0; i < 9; i++) {
        const phase = (((i * result.phase) % 360) + 360) % 360;
        const height = 12 + phase / 360 * 28;
        content += `<rect class="fallback-super" x="${105 + i * 34}" y="${170 - height}" width="12" height="${height}"/>`;
      }
      for (let i = 0; i < 3; i++) content += `<path class="fallback-in" d="M110 ${205 + i * 19}H390"/>`;
      if (result.propagating) {
        const angle = result.angleDeg;
        content += `<g transform="translate(250 100) rotate(${angle})"><path class="fallback-out" d="M-90 0H90M-90 -22H90M-90 -44H90M0 15V-65"${marker}/></g><text x="390" y="35" text-anchor="end">θ = ${signed(angle, 1)}°</text>`;
      } else content += '<text x="250" y="75" text-anchor="middle">지정된 방향의 전파 해 없음</text>';
    }
    panel.querySelector('.fallback').innerHTML = '<svg viewBox="0 0 500 280" role="presentation">' + arrowMark + content + '</svg>';
  }

  const updates = { emi: updateEMI, super: updateSuper, meta: updateMeta };
  $$('.lab-tabs button').forEach(tab => {
    tab.addEventListener('click', () => { activate(tab.dataset.topic); remember(); });
    tab.addEventListener('keydown', event => {
      const i = topics.indexOf(active);
      const next = event.key === 'ArrowRight' ? (i + 1) % 3 : event.key === 'ArrowLeft' ? (i + 2) % 3 : event.key === 'Home' ? 0 : event.key === 'End' ? 2 : null;
      if (next === null) return;
      event.preventDefault(); activate(topics[next], true); remember();
    });
  });
  const defaults = { emi: { emiThickness: 8, emiFrequency: 1, emiReflection: 55 }, super: { superTemperature: 65 }, meta: { metaWavelength: 600, metaPitch: 300, metaPhase: 60 } };
  topics.forEach(topic => {
    $('#panel-' + topic).querySelectorAll('.controls input').forEach(input => input.addEventListener('input', () => { updates[topic](); remember(); }));
    $('[data-reset="' + topic + '"]').addEventListener('click', () => {
      Object.entries(defaults[topic]).forEach(([id, value]) => { $('#' + id).value = value; });
      if (topic === 'super') $('input[value="meissner"]').checked = true;
      updates[topic](); remember();
    });
    const motionButton = $('[data-motion="' + topic + '"]');
    motionButton.setAttribute('aria-pressed', String(paused[topic]));
    motionButton.textContent = paused[topic] ? '재생' : '일시정지';
    motionButton.addEventListener('click', () => {
      paused[topic] = !paused[topic];
      motionButton.setAttribute('aria-pressed', String(paused[topic]));
      motionButton.textContent = paused[topic] ? '재생' : '일시정지';
    });
    $('[data-view="' + topic + '"]').addEventListener('click', () => scenes[topic]?.resetView?.());
  });
  $('#doubleThickness').addEventListener('click', () => { $('#emiThickness').value = Math.min(number('emiThickness') * 2, 50); updateEMI(); remember(); });
  $('#crossTc').addEventListener('click', () => { $('#superTemperature').value = results.super.superconducting ? 110 : 65; updateSuper(); remember(); });
  $('#reversePhase').addEventListener('click', () => { $('#metaPhase').value = -number('metaPhase'); updateMeta(); remember(); });

  const explanations = {
    emi: '이 모델에서 R은 독립적으로 지정한 입력입니다. 두께가 증가하면 T가 줄고 A가 커지며 R은 그대로입니다. 실제 R은 재료와 구조에 따라 달라집니다.',
    super: '제2종 초전도체의 혼합상에서는 자속이 일부 침투합니다. 결함이 이 자속을 붙잡는 현상이 자속 고정입니다. 완전한 배제를 표현하는 약한 장의 마이스너 상태와 구분해야 합니다.',
    meta: 'Δφ = 0이면 위상 구배가 0이므로 sin θ = 0, θ = 0°입니다. 위상차의 부호를 바꾸면 조향 방향도 반대가 됩니다.'
  };
  $$('.quiz').forEach(quiz => {
    quiz.querySelectorAll('button').forEach(button => {
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => {
        quiz.querySelectorAll('button').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
        quiz.querySelector('.quiz-feedback').textContent = (button.dataset.answer === 'correct' ? '맞아요. ' : '다시 살펴볼까요? ') + explanations[quiz.dataset.quiz];
      });
    });
  });

  restore(globalThis.openai?.widgetState?.modelContent);
  updateEMI(); updateSuper(); updateMeta();
  activate(active);
  globalThis.addEventListener('openai:set_globals', event => {
    const snapshot = event.detail?.globals?.widgetState?.modelContent;
    if (!snapshot) return;
    restore(snapshot); updateEMI(); updateSuper(); updateMeta(); activate(active);
  });
  function tick(timestamp) {
    requestAnimationFrame(tick);
    if (timestamp - previousFrame < 25) return;
    const dt = previousFrame ? Math.min((timestamp - previousFrame) / 1000, .08) : 0;
    previousFrame = timestamp;
    if (document.hidden) return;
    const api = scenes[active];
    if (!api?.renderer || api.lost) return;
    if (!paused[active]) { elapsed[active] += dt; api.draw?.(elapsed[active]); }
    api.renderer.render(api.scene, api.camera);
  }
  requestAnimationFrame(tick);
})();
