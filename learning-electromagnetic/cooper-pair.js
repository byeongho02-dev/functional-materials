/* Qualitative BCS learning scenes. No microscopic solver, fitted data, or external dependencies. */
(function (global) {
  'use strict';
  const TAU = 2 * Math.PI;
  const DURATION = 8;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const smooth = v => { const x = clamp(v, 0, 1); return x * x * (3 - 2 * x); };
  const steps = Object.freeze([
    {
      title: '전자끼리는 원래 반발해요',
      key: '격자가 만드는 유효 인력이 생겨도, 전자 사이의 직접적인 쿨롱 반발이 사라지는 것은 아닙니다.',
      short: '같은 음전하를 가진 두 전자는 서로 밀어냅니다. 쿠퍼쌍을 이해하려면 이 반발과 경쟁하는 다른 상호작용을 함께 봐야 해요.',
      legend: '시안 원: 전자 · 주황 화살표: 직접 쿨롱 반발',
      caption: '입자 크기·거리·힘의 크기는 실제 값이 아닌 개념 표현입니다.',
      theory: [
        '전자는 같은 음전하이므로 직접적인 쿨롱 상호작용은 반발입니다. 금속 안에서는 다른 전자들의 반응으로 차폐되지만, 반발 자체가 없어지는 것은 아닙니다.',
        '전통적인 BCS에서는 전자–격자 상호작용이 제공하는 인력 성분과 차폐된 쿨롱 반발을 함께 고려합니다. 화면의 화살표는 힘의 방향을 구분하는 표시이며 실제 힘을 계산한 벡터가 아닙니다.'
      ]
    },
    {
      title: '격자는 전자보다 느리게 반응해요',
      key: '무거운 이온의 지연 반응 때문에 전자가 지나간 뒤에도 격자 변형과 진동의 영향이 남을 수 있습니다.',
      short: '움직이는 전자가 주변 양이온 격자에 힘을 줍니다. 이온은 전자보다 무거워 늦게 움직이고, 전자가 지나간 뒤에도 진동이 남는 모습을 관찰해보세요.',
      legend: '시안 원: 이동 전자 · 보라 +: 이온 · 빈 점선 원: 평형 위치',
      caption: '이온 변위는 보이도록 과장했습니다. 전자는 왼쪽에서 오른쪽으로 지나갑니다.',
      theory: [
        '전도전자는 격자의 양이온 및 전자 분포와 상호작용합니다. 이 상호작용으로 이온이 평형 위치에서 조금 변위될 수 있습니다. 무거운 이온의 운동은 전자의 운동보다 느려, 격자 반응에는 시간 지연과 잔류 진동이 생길 수 있습니다.',
        '여기서는 전자가 지나간 뒤 시작되는 감쇠 진동으로 지연 반응을 보여줍니다. 실제 이온 변위, 진동수, 전자의 속도나 유효 인력을 계산하는 분자동역학 모형은 아닙니다. 이온이 한곳에 계속 쌓인다고 읽으면 안 됩니다.'
      ]
    },
    {
      title: '격자가 두 전자의 상호작용을 매개해요',
      key: '포논 매개 유효 인력은 특정 에너지·운동량 영역에서 쿨롱 반발과 경쟁하는 상호작용 성분입니다.',
      short: '한 전자가 격자 진동에 영향을 주고, 다른 전자가 그 진동과 상호작용합니다. 양자역학에서는 이를 가상 포논 교환으로 표현할 수 있어요.',
      legend: '주황: 직접 반발 · 보라 점선 파형: 격자 매개 인력의 개념 경로',
      caption: '점선은 상호작용 경로입니다. 실제 입자의 궤적이나 두 전자를 잇는 고무줄이 아닙니다.',
      theory: [
        '포논은 격자 진동의 양자입니다. 전자 두 개 사이에서 새로 만들어진 작은 물체나 고무줄이 아닙니다. 전자–포논 결합을 통해 한 전자가 격자에 준 영향이 다른 전자와 연결될 수 있고, 양자역학에서는 가상 포논 교환으로 기술할 수 있습니다.',
        '이 과정은 특정 에너지·운동량 영역에서 유효한 인력 성분을 제공합니다. 차폐된 쿨롱 반발과 경쟁한 결과, 쌍을 이루는 채널에서 순수한 인력 효과가 가능해집니다. 포논이 존재한다는 사실만으로 모든 금속이 초전도체가 되는 것은 아닙니다.',
        '앞 단계의 이온 변위는 지연 반응을 이해하기 위한 고전적 비유입니다. 이 단계에서는 그 직관에서 양자역학적 상호작용의 표현으로 넘어갑니다. “양이온이 쌓여 두 전자를 자석처럼 끌어당긴다”는 그림은 정확한 미시적 계산이 아닙니다.'
      ]
    },
    {
      title: '넓게 겹치는 쿠퍼쌍 상태가 가능해져요',
      key: '쿠퍼쌍은 상관된 두 전자의 양자 상태이며, 공간적으로 밀착한 작은 분자일 필요가 없습니다.',
      short: '페르미면 부근에서 약한 유효 인력이 있으면, 상관된 쌍 상태가 에너지적으로 유리할 수 있습니다. 넓은 구름은 두 전자가 작은 공처럼 붙어 움직인다는 오해를 피하기 위한 표현이에요.',
      legend: '겹치는 구름: 넓게 퍼진 쌍 상태의 개념 표현 · 라벨: 운동량·스핀',
      caption: '(k, ↑), (−k, ↓)는 전통적인 등방성 s-wave BCS의 대표적 쌍입니다. 구름은 실제 계산한 확률밀도가 아닙니다.',
      theory: [
        '페르미면은 낮은 온도에서 전자가 채운 상태와 비어 있는 상태를 구분하는 운동량 공간의 경계입니다. 그 부근의 전자들은 약한 유효 인력에도 상관된 쌍 상태를 형성하는 것이 에너지적으로 유리할 수 있습니다.',
        '전통적인 등방성 s-wave BCS의 무전류 정지 평형에서 대표적인 쌍은 서로 반대 운동량과 반대 스핀을 갖는 (k, ↑), (−k, ↓)입니다. 이 표기는 전자가 공간에서 그려진 화살표를 따라 달린다는 뜻이 아닙니다.',
        '약결합 BCS의 쿠퍼쌍은 많은 격자 간격에 걸쳐 퍼지고 서로 넓게 겹칠 수 있습니다. 두 전자가 밀착해 구르는 작은 분자로 그리면 잘못된 직관을 줄 수 있습니다. 여기의 구름은 쌍의 공간적 상관을 설명하는 정성적 도해입니다.',
        '쌍의 형성만으로 거시적 위상 결맞음까지 자동으로 보장되지는 않습니다. 다음 단계에서는 쌍이 존재하는 그림을 유지하면서 공간 영역 사이의 위상 관계를 따로 비교합니다.'
      ]
    },
    {
      title: '쌍 형성과 거시적 위상 결맞음은 달라요',
      key: '쌍이 존재하는 것과 넓은 공간에서 응축 상태의 위상 관계가 유지되는 것은 서로 다른 조건입니다.',
      short: '화살표는 각 공간 영역의 응축 질서변수의 위상입니다. 결맞음과 무질서를 바꾸고, 위상을 조금씩 비틀어보세요. 매끄러운 기울기가 있어도 위상 관계는 유지될 수 있어요.',
      legend: '원: 공간 영역 · 화살표: 응축 질서변수의 지역 위상 · 선: 영역 사이의 관계',
      caption: '위상 화살표는 전자·쿠퍼쌍의 이동 방향이나 고전적 진동 방향이 아닙니다.',
      theory: [
        '거시적 초전도 질서는 복소 질서변수 Ψ(r) = |Ψ(r)| exp(iφ(r))로 표현할 수 있습니다. |Ψ|는 질서의 크기, φ는 위상을 나타냅니다. 많은 쌍이 하나의 응축 상태를 이루면 넓은 공간에 걸친 위상 관계가 유지됩니다.',
        '이것은 모든 전자나 쌍이 한 줄로 같은 방향으로 이동하거나, 고전적인 진동의 시점이 모두 같다는 뜻이 아닙니다. 그림의 화살표는 추상적인 질서변수의 지역 위상을 읽는 표기입니다.',
        '정지 평형 상태의 단순한 그림에서는 위상이 거의 일정할 수 있습니다. 초전류에서는 위상 기울기와 전자기 벡터 퍼텐셜 A가 함께 관계합니다. 따라서 모든 화살표가 반드시 같은 숫자를 가리켜야만 전류가 흐른다고 설명하면 안 됩니다.',
        '이 도해는 A = 0으로 놓은 열린 국소 구간을 비교합니다. 결맞음 모드에서 매끄러운 위상 기울기를 주는 것과, 영역 사이의 위상 관계를 무질서하게 만드는 것을 구분하세요. 쌍 형성만으로 항상 초전도 상태가 보장되는 것은 아닙니다.'
      ],
      formula: 'Ψ(r) = |Ψ(r)| exp(iφ(r))'
    },
    {
      title: '에너지 갭과 위상 강성을 따로 봐요',
      key: '에너지 갭은 준입자 들뜸과, 위상 강성은 공간적 위상 변형의 에너지 비용과 관련됩니다. 둘은 같은 물리량이 아닙니다.',
      short: '위쪽에서는 갭이 있는 준입자 에너지 곡선과 없는 곡선을 비교합니다. 아래에서는 위상을 비틀어 비용이 커지는 모습을 보세요. 두 조작은 개념을 분리해 비교하기 위한 독립 도해입니다.',
      legend: '위: BCS 준입자 에너지 E 대 ξ · 아래: 위상 변형과 상대 비용',
      caption: '상태밀도 그래프가 아닙니다. 축은 임의 기준 에너지로 정규화한 모식도이며 실제 물리 단위를 적용하지 않습니다.',
      theory: [
        '균일한 등방성 s-wave BCS의 준입자 분산은 E_k = √(ξ_k² + |Δ|²)입니다. ξ_k는 화학 퍼텐셜 μ(저온에서 페르미 에너지에 가까움)를 기준으로 한 정상 상태의 에너지이며, Δ는 갭입니다. 최소 준입자 들뜸 에너지가 생겨 낮은 온도에서 열적 준입자 들뜸이 억제됩니다.',
        '균일한 약결합 BCS의 T = 0 근사에서는 2Δ(0) ≈ 3.52 k_B T_c입니다. 이 숫자는 모든 초전도체에 보편적인 상수가 아니며, 기존 YBCO의 92 K로 여기의 갭을 계산하지 않습니다. 두 준입자를 만드는 에너지 척도 2Δ와 단일 준입자 최소 에너지 Δ도 구분하세요.',
        '위상 강성 ρ_s는 공간적 위상 변화를 만드는 데 드는 에너지 비용의 척도입니다. 작은 변형에서는 비용이 게이지 불변 위상 기울기의 제곱에 비례하며 위상 요동에 저항합니다. 이는 질서를 변형하는 에너지 비용이며, 정상 금속의 줄열 손실과 같은 뜻은 아닙니다. 쌍의 존재나 갭만으로 위상 질서까지 보장되지는 않습니다.',
        '여기의 상대 비용은 1 − cos(이웃 위상차)의 평균으로 나타낸 정성적 비교이며 실제 J, Tc, 초전도 확률을 예측하지 않습니다. 전자기장이 있을 때는 위상차에서 벡터 퍼텐셜의 선적분에 해당하는 항도 함께 고려해야 합니다.'
      ],
      formula: 'E_k = √(ξ_k² + |Δ|²)\n2Δ(0) ≈ 3.52 k_B T_c  (약결합·등방 s-wave, T = 0)\nF_phase ∝ ρ_s |∇φ − q A/ℏ|²  (쌍의 전하 q = −2e)'
    },
    {
      title: '임계 조건 안에서 지속 전류가 가능해요',
      key: '적절한 온도·자기장·전류 조건에서 응축 상태의 집단 양자 성질로 직류 저항 0과 지속 전류가 가능합니다.',
      short: '고리의 움직이는 표시는 전류가 계속 유지되는 모습을 뜻합니다. 위상 관계를 무질서하게 하거나 임계 조건을 벗어난 경우와 비교해보세요.',
      legend: '고리 화살표: 전류 방향 · 움직이는 표시: 전류 지속의 개념 표현',
      caption: '입자나 쿠퍼쌍의 실제 궤적이 아닙니다. 5단계의 지역 위상 화살표와도 다른 표시입니다.',
      theory: [
        '초전도 응축 상태는 집단적인 양자 상태입니다. 적절한 온도·자기장·전류 조건에서 직류 전류가 일반 금속처럼 지속해서 에너지를 열로 소산하지 않고 흐를 수 있습니다.',
        '“충돌이 전혀 없다”, “모든 전자가 쿠퍼쌍이고 모든 산란이 사라진다”, “쌍이 단단한 공처럼 격자를 통과한다”는 설명은 정확하지 않습니다. 열적 준입자, 결함, 위상 미끄러짐이나 소용돌이 운동에 의한 손실과 임계 조건을 함께 고려해야 합니다.',
        '이 고리는 지속 전류를 설명하는 정성적 그림입니다. 5·6단계는 A = 0인 열린 국소 구간의 위상 비교이고, 실제 닫힌 고리의 전류는 위상 감김·자속·벡터 퍼텐셜과 관련됩니다. 이 그림은 고리의 플럭소이드 양자화나 실제 전류를 계산하지 않습니다.',
        '조건을 벗어나면 줄어드는 표시도 손실이 생길 수 있음을 비교하는 임의의 연출이며 실제 저항이나 감쇠 시간을 예측하지 않습니다. 기존 마이스너·자속 고정의 3D 장면과 별개의 BCS 원리 학습 예시입니다.'
      ]
    }
  ].map(step => Object.freeze(step)));

  function quasiparticleEnergy(xi, gap) { return Math.hypot(xi, Math.abs(gap)); }
  function linkCost(left, right, gaugeLink = 0) { return 1 - Math.cos(right - left - gaugeLink); }
  function phaseCost(phases, gaugeLinks = []) {
    if (phases.length < 2) return 0;
    return phases.slice(1).reduce((sum, phase, i) => sum + linkCost(phases[i], phase, gaugeLinks[i] || 0), 0) / (phases.length - 1);
  }
  function phaseAngles(coherent, twistDeg, time = 0) {
    const seed = [.3, 2.4, -.8, 1.6, -2.1, .7, -1.5, 2.8];
    return seed.map((angle, i) => coherent ? i * twistDeg * Math.PI / 180 : angle + .24 * Math.sin(time * .8 + i * 1.9));
  }
  function ionOffset(progress, column, row) {
    const passed = progress - .72 * column / 7 - .08;
    if (passed <= 0) return 0;
    const towardTrack = row < 2 ? 1 : -1;
    return towardTrack * 17 * Math.exp(-3.2 * passed) * Math.sin(20 * passed);
  }
  function createState() { return { step: 0, elapsed: 0, playing: false, singleScene: false, speed: 1, coherent: true, twist: 0, mediated: true, showGap: true, withinLimits: true }; }
  function update(state, action) {
    switch (action.type) {
      case 'reset': return createState();
      case 'step': return { ...state, step: clamp(Math.round(action.value), 0, 6), elapsed: 0, playing: false, singleScene: false };
      case 'play': return { ...state, step: state.step === 6 && state.elapsed >= DURATION ? 0 : state.step, elapsed: state.elapsed >= DURATION ? 0 : state.elapsed, playing: !state.playing, singleScene: false };
      case 'lattice': return { ...state, step: 1, elapsed: 0, playing: true, singleScene: true };
      case 'seek': return { ...state, elapsed: clamp(Number(action.value), 0, 1) * DURATION, playing: false };
      case 'speed': return { ...state, speed: clamp(Number(action.value), .5, 2) };
      case 'coherent': return { ...state, coherent: Boolean(action.value) };
      case 'twist': return { ...state, twist: clamp(Number(action.value), -45, 45) };
      case 'mediated': return { ...state, mediated: Boolean(action.value) };
      case 'gap': return { ...state, showGap: Boolean(action.value) };
      case 'limits': return { ...state, withinLimits: Boolean(action.value) };
      default: return state;
    }
  }
  function advance(state, seconds) {
    if (!state.playing || !Number.isFinite(seconds) || seconds <= 0) return state;
    let next = { ...state, elapsed: state.elapsed + seconds * state.speed };
    while (next.elapsed >= DURATION) {
      if (next.singleScene || next.step === 6) return { ...next, elapsed: DURATION, playing: false };
      next.elapsed -= DURATION; next.step++;
    }
    return next;
  }
  const model = Object.freeze({ steps, DURATION, quasiparticleEnergy, linkCost, phaseCost, phaseAngles, ionOffset, createState, update, advance });
  if (typeof module !== 'undefined' && module.exports) module.exports = model;
  if (typeof document === 'undefined') return;
  const root = document.getElementById('materialsLab');
  const lab = root?.querySelector('#cooper-lab');
  if (!lab || lab.dataset.cpReady === 'true') return;
  const $ = selector => lab.querySelector(selector);
  const $$ = selector => Array.from(lab.querySelectorAll(selector));
  const required = ['cp-scene', 'cp-svg', 'cp-play', 'cp-prev', 'cp-next', 'cp-reset', 'cp-lattice', 'cp-step-title', 'cp-step-number', 'cp-key-sentence', 'cp-short', 'cp-legend', 'cp-caption', 'cp-svg-title', 'cp-svg-desc', 'cp-theory', 'cp-theory-body', 'cp-speed', 'cp-progress', 'cp-progress-value', 'cp-twist', 'cp-twist-value', 'cp-mediated', 'cp-gap', 'cp-limits', 'cp-mediated-controls', 'cp-phase-controls', 'cp-twist-controls', 'cp-gap-controls', 'cp-limit-controls', 'cp-phase-status', 'cp-ring-status', 'cp-status', 'cp-motion-note'];
  if (required.some(id => !$('#' + id)) || !$('.cp-stage')) return;
  lab.dataset.cpReady = 'true';
  let state = createState(), raf = null, lastTime = 0, lastPaint = 0;
  let width = 640, height = 400, inViewport = true, theoryStep = -1;
  const media = global.matchMedia?.('(prefers-reduced-motion: reduce)');
  let reduced = media?.matches || false;
  const hasRAF = typeof global.requestAnimationFrame === 'function';
  const panel = lab.closest('#panel-super');
  const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const n = value => Number(value).toFixed(2);
  function text(x, y, value, cls = 'cp-label', anchor = 'start') {
    const available = Math.max(35, anchor === 'middle' ? 2 * Math.min(x - 10, width - x - 10) : anchor === 'end' ? x - 10 : width - x - 10);
    const lines = []; let current = '', measured = 0;
    for (const character of String(value)) {
      const charWidth = /[\u2e80-\uffff]/.test(character) ? 14 : 8;
      if (measured + charWidth > available && current) { lines.push(current); current = ''; measured = 0; }
      current += character; measured += charWidth;
    }
    lines.push(current);
    const top = Math.min(y, height - 12 - (lines.length - 1) * 19);
    return `<text x="${n(x)}" y="${n(top)}" class="${cls}" text-anchor="${anchor}">` + lines.map((line, i) => `<tspan x="${n(x)}" dy="${i ? 19 : 0}">${escape(line)}</tspan>`).join('') + '</text>';
  }
  const circle = (x, y, radius, cls, more = '') => `<circle cx="${n(x)}" cy="${n(y)}" r="${n(radius)}" class="${cls}" ${more}/>`;
  const path = (d, cls, more = '') => `<path d="${d}" class="${cls}" ${more}/>`;
  function arrow(x1, y1, x2, y2, cls = 'cp-force', marker = 'cp-arrow-amber') {
    return `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" class="${cls}" marker-end="url(#${marker})"/>`;
  }
  function electron(x, y) { return circle(x, y, 12, 'cp-electron') + text(x, y + 4, '−', 'cp-charge', 'middle'); }
  function phaseRow(y, count, time, small = false) {
    const angles = phaseAngles(state.coherent, state.twist, time).slice(0, count);
    const left = 30, spacing = (width - 60) / (count - 1), radius = small ? 10 : Math.min(22, spacing * .32);
    let markup = '';
    angles.forEach((angle, i) => {
      const x = left + spacing * i;
      if (i) markup += `<line x1="${n(x - spacing + radius)}" y1="${y}" x2="${n(x - radius)}" y2="${y}" class="${state.coherent ? 'cp-connection' : 'cp-unordered-link'}"/>`;
      markup += circle(x, y, radius, 'cp-domain');
      markup += arrow(x, y, x + radius * .83 * Math.cos(angle), y - radius * .83 * Math.sin(angle), state.coherent ? 'cp-phase-arrow' : 'cp-unordered-arrow', state.coherent ? 'cp-arrow-cyan' : 'cp-arrow-purple');
      if (!small) markup += text(x, y + radius + 21, '영역 ' + (i + 1), 'cp-tiny', 'middle');
    });
    return markup;
  }
  function drawRepulsion(p) {
    const separation = (width * .12) + smooth(p) * width * .23;
    const center = width / 2, y = height * .48;
    return text(center, 44, '같은 음전하 → 서로 반발', 'cp-label', 'middle') + electron(center - separation, y) + electron(center + separation, y)
      + arrow(center - separation - 17, y, Math.max(5, center - separation - 54), y)
      + arrow(center + separation + 17, y, Math.min(width - 5, center + separation + 54), y)
      + path(`M${center - separation + 17},${y}H${center + separation - 17}`, 'cp-repulsion-link')
      + text(center, height - 58, '직접 쿨롱 반발은 계속 존재합니다', 'cp-note', 'middle');
  }
  function drawLattice(p) {
    const electronX = 22 + clamp(p / .72, 0, 1) * (width - 44), track = height * .46;
    let markup = text(width / 2, 30, '전자 이동 후에도 격자는 늦게 반응', 'cp-label', 'middle');
    for (let c = 0; c < 8; c++) for (let r = 0; r < 4; r++) {
      const x = 30 + c * (width - 60) / 7;
      const y = 85 + r * (height - 160) / 3;
      const offset = ionOffset(p, c, r);
      markup += circle(x, y, 9, 'cp-equilibrium') + circle(x, y + offset, 8.5, 'cp-ion') + text(x, y + offset + 4, '+', 'cp-ion-sign', 'middle');
      if (Math.abs(offset) > 2) markup += path(`M${x},${y}V${y + offset}`, 'cp-displacement');
    }
    markup += electron(electronX, track) + arrow(electronX - 15, track - 25, Math.min(width - 14, electronX + 32), track - 25, 'cp-phase-arrow', 'cp-arrow-cyan');
    return markup + text(width / 2, height - 24, '빈 원: 평형 위치 · +: 느리게 움직이는 이온', 'cp-note', 'middle');
  }
  function drawMediation(p) {
    const left = width * .16, right = width * .84;
    let markup = text(width / 2, 35, '반발과 격자 매개 성분을 구분', 'cp-label', 'middle');
    markup += electron(left, 105) + electron(right, 105);
    markup += arrow(left - 13, 105, Math.max(8, left - 45), 105) + arrow(right + 13, 105, Math.min(width - 8, right + 45), 105);
    markup += text(width / 2, 142, '주황: 직접 쿨롱 반발', 'cp-note', 'middle');
    const stage=p<.28?0:p<.62?1:2;
    [left,width/2,right].forEach((x,i)=>{
      markup+=circle(x,178,5,'cp-curve-cursor','opacity="'+(stage===i?1:.2)+'"');
      markup+=text(x,200,['전자 ①','격자 응답','전자 ②'][i],'cp-tiny','middle');
    });

    if (state.mediated) {
      let d = '';
      for (let i = 0; i <= 60; i++) {
        const x = left + (right - left) * i / 60 * clamp((p-.18)/.7,0,1);
        const y = 221 + Math.sin(i / 60 * TAU * 3 - p * TAU * 2) * 14;
        d += `${i ? 'L' : 'M'}${n(x)},${n(y)} `;
      }
      markup += path(d, 'cp-phonon-path');
      markup += arrow(left + 15, 260, left + 50, 260, 'cp-attraction', 'cp-arrow-purple') + arrow(right - 15, 260, right - 50, 260, 'cp-attraction', 'cp-arrow-purple');
      markup += text(width / 2, 304, '보라: 격자 매개 유효 인력 성분', 'cp-note', 'middle');
    } else markup += text(width / 2, 225, '격자 매개 경로 표시를 껐습니다', 'cp-note', 'middle');
    return markup + text(width / 2, height - 28, '파형은 가상 포논 교환의 개념 표현', 'cp-note', 'middle');
  }
  function drawPair(p) {
    const y = height * .5, rx = Math.min(width * .32, 180), ry = height * .23;
    const opacity = .12 + .65 * smooth(p);
    return text(width / 2, 32, '공간적으로 넓게 겹치는 상관 상태', 'cp-label', 'middle')
      + `<ellipse cx="${width * .43}" cy="${y}" rx="${rx * (.6 + .4 * smooth(p))}" ry="${ry}" fill="url(#cp-cloud-a)" opacity="${opacity}"/>`
      + `<ellipse cx="${width * .57}" cy="${y}" rx="${rx * (.6 + .4 * smooth(p))}" ry="${ry}" fill="url(#cp-cloud-b)" opacity="${opacity}"/>`
      + text(width * .28, y - 18, '(k, ↑)', 'cp-state-label', 'middle')
      + text(width * .72, y + 24, '(−k, ↓)', 'cp-state-label', 'middle')
      + text(width / 2, height - 69, '운동량·스핀 표기 ≠ 공간 궤적', 'cp-note', 'middle')
      + text(width / 2, height - 42, '쌍 형성만으로 위상 결맞음까지 보장되지는 않음', 'cp-tiny', 'middle');
  }
  function drawCoherence(time) {
    const count = width < 420 ? 4 : 8;
    let markup = text(width / 2, 36, state.coherent ? '위상 관계 유지 · 매끄러운 기울기도 가능' : '위상 무질서 · 쌍의 존재와 별개로 비교', 'cp-label', 'middle');
    markup += text(width / 2, 87, '쌍 상관은 두 경우 모두 있다고 가정', 'cp-note', 'middle');
    markup += phaseRow(143, count, time);
    markup += phaseRow(252, count, time + (state.coherent ? 0 : 2.2));
    markup += text(width / 2, height - 58, '화살표 = 지역 질서변수의 위상', 'cp-note', 'middle');
    return markup + text(width / 2, height - 31, '전자나 쌍의 이동 방향이 아닙니다', 'cp-note', 'middle');
  }
  function drawStability(p) {
    const left = 44, right = width - 24, top = 46, bottom = 187;
    const xmap = xi => left + (xi + 2.5) / 5 * (right - left);
    const ymap = energy => bottom - energy / 3 * (bottom - top);
    const gap = state.showGap ? 1 : 0;
    let markup = text(width / 2, 24, '① 에너지 갭', 'cp-label', 'middle');
    markup += `<rect x="${left}" y="${ymap(gap)}" width="${right - left}" height="${bottom - ymap(gap)}" class="cp-gap-shade"/>`;
    markup += path(`M${left},${top}V${bottom}H${right}`, 'cp-axis');
    for (const tick of [-2, 0, 2]) markup += text(xmap(tick), bottom + 19, String(tick), 'cp-tiny', 'middle');
    markup += text(left - 12, bottom + 4, '0', 'cp-tiny', 'end') + text(left - 12, ymap(1) + 4, '1', 'cp-tiny', 'end');
    markup += text(right, bottom + 39, 'ξ / 기준 에너지', 'cp-tiny', 'end') + text(left, top - 7, 'E / 기준 에너지', 'cp-tiny');
    let d = '';
    for (let i = 0; i <= 70; i++) {
      const xi = -2.5 + i / 70 * 5;
      d += `${i ? 'L' : 'M'}${n(xmap(xi))},${n(ymap(quasiparticleEnergy(xi, gap)))} `;
    }
    markup += path(d, 'cp-energy-curve');
    if (gap) markup += text(width / 2 + 14, ymap(.55), 'Δ', 'cp-label');
    const xi = -2 + p * 4;
    markup += circle(xmap(xi), ymap(quasiparticleEnergy(xi, gap)), 4, 'cp-curve-cursor');
    markup += text(width / 2, 251, '② 위상 강성', 'cp-label', 'middle');
    markup += phaseRow(282, width < 420 ? 4 : 8, 0, true);
    const cost = phaseCost(phaseAngles(state.coherent, state.twist, 0).slice(0, width < 420 ? 4 : 8));
    markup += text(28, 322, '같은 강성에서 비틀기 비용', 'cp-note');
    markup += `<rect x="28" y="337" width="${width - 56}" height="8" rx="4" class="cp-cost-track"/>`;
    markup += `<rect x="28" y="337" width="${(width - 56) * clamp(cost / 2, 0, 1)}" height="8" rx="4" class="cp-cost-bar"/>`;
    return markup + text(width / 2, height - 20, '물리 단위 없음 · 점은 곡선을 읽는 표시', 'cp-tiny', 'middle');
  }
  function drawCurrent(p) {
    const cx = width / 2, cy = height * .51, rx = Math.min(width * .35, 180), ry = Math.min(height * .23, 85);
    const persistent = state.withinLimits && state.coherent;
    const strength = persistent ? 1 : Math.exp(-p * 4);
    let markup = text(cx, 36, persistent ? '임계 조건 안 · 위상 관계 유지' : '지속 전류의 조건 불충족', 'cp-label', 'middle');
    markup += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" class="cp-ring"/>`;
    for (let i = 0; i < 5; i++) {
      const angle = (p * (persistent ? 2 : .5) + i / 5) * TAU;
      markup += circle(cx + rx * Math.cos(angle), cy + ry * Math.sin(angle), 5, 'cp-current-mark', `opacity="${n(strength)}"`);
    }
    if (persistent) markup += arrow(cx - 20, cy - ry, cx + 20, cy - ry, 'cp-phase-arrow', 'cp-arrow-cyan');
    markup += text(cx, cy + 4, persistent ? '지속 전류' : '손실 가능', 'cp-label', 'middle');
    markup += text(cx, height - 60, '움직이는 표시는 전류 지속의 모식도', 'cp-note', 'middle');
    return markup + text(cx, height - 31, '실제 전자쌍의 궤적이나 전류 계산이 아닙니다', 'cp-tiny', 'middle');
  }
  function renderScene() {
    const p = clamp(state.elapsed / DURATION, 0, 1);
    const drawers = [drawRepulsion, drawLattice, drawMediation, drawPair, () => drawCoherence(state.elapsed), drawStability, drawCurrent];
    $('#cp-scene').innerHTML = drawers[state.step](p);
    $('#cp-progress').value = String(Math.round(p * 100));
    $('#cp-progress-value').textContent = Math.round(p * 100) + '%';
  }
  function renderInfo(announce = true) {
    const step = steps[state.step];
    $('#cp-step-number').textContent = String(state.step + 1).padStart(2, '0') + ' / 07';
    $('#cp-step-title').textContent = step.title;
    $('#cp-key-sentence').textContent = step.key;
    $('#cp-short').textContent = step.short;
    $('#cp-legend').textContent = step.legend;
    $('#cp-caption').textContent = step.caption;
    $('#cp-svg-title').textContent = step.title;
    $('#cp-svg-desc').textContent = step.short + ' ' + step.caption;
    if (theoryStep !== state.step) { theoryStep = state.step; $('#cp-theory-body').innerHTML = step.theory.map(paragraph => '<p>' + escape(paragraph) + '</p>').join('') + (step.formula ? '<pre class="cp-formula">' + escape(step.formula) + '</pre>' : ''); }
    $('#cp-prev').disabled = state.step === 0;
    $('#cp-next').disabled = state.step === 6;
    $('#cp-play').textContent = state.playing ? '일시정지' : state.step === 6 && state.elapsed >= DURATION ? '다시 자동재생' : '자동재생';
    $('#cp-play').setAttribute('aria-pressed', String(state.playing));
    $('#cp-speed').value = String(state.speed);
    $('#cp-twist').value = String(state.twist);
    $('#cp-twist').disabled = !state.coherent;
    $('#cp-twist-value').textContent = (state.twist > 0 ? '+' : '') + state.twist + '°';
    $('#cp-mediated').checked = state.mediated;
    $('#cp-gap').checked = state.showGap;
    $('#cp-limits').checked = state.withinLimits;
    $$('[data-cp-coherence]').forEach(button => button.setAttribute('aria-pressed', String((button.dataset.cpCoherence === 'yes') === state.coherent)));
    $$('[data-cp-step]').forEach(button => {
      const selected = Number(button.dataset.cpStep) === state.step;
      if (selected) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current');
    });
    $('#cp-mediated-controls').hidden = state.step !== 2;
    $('#cp-phase-controls').hidden = state.step < 4;
    $('#cp-twist-controls').hidden = state.step !== 4 && state.step !== 5;
    $('#cp-gap-controls').hidden = state.step !== 5;
    $('#cp-limit-controls').hidden = state.step !== 6;
    $('#cp-phase-status').textContent = state.coherent ? '결맞음: 영역 사이의 위상 관계를 유지합니다.' : '위상 무질서: 쌍 상관과 구분합니다. 매끄러운 비틀기는 결맞음 모드에서 비교하세요.';
    $('#cp-ring-status').textContent = state.withinLimits && state.coherent ? '온도·자기장·전류의 임계 조건과 위상 질서가 유지된다고 가정합니다.' : '임계 조건 또는 위상 질서가 충족되지 않아 지속 전류를 가정할 수 없습니다.';
    if (announce) $('#cp-status').textContent = `${state.step + 1}단계. ${step.title}. ${state.playing ? '재생 중' : '일시정지'}`;
  }
  function visible() {
    if (document.hidden || panel?.hidden) return false;
    const rect=$('.cp-stage').getBoundingClientRect();
    return rect.width>0&&rect.height>0&&global.innerHeight>0?rect.bottom>0&&rect.top<global.innerHeight:inViewport;
  }
  function cancel() {
    if (raf !== null) global.cancelAnimationFrame?.(raf);
    raf = null; lastTime = 0; lastPaint = 0;
  }
  function schedule() {
    if (hasRAF && state.playing && visible() && raf === null) raf = global.requestAnimationFrame(tick);
  }
  function tick(now) {
    raf = null;
    if (!state.playing || !visible()) { lastTime = 0; return; }
    // Browsers suspend background rAF; skip all SVG work and elapsed time while hidden.
    if (document.hidden) { lastTime = 0; schedule(); return; }
    if (!lastTime) lastTime = now;
    if (now - lastPaint < 42) { schedule(); return; }
    const previousStep = state.step, wasPlaying = state.playing;
    state = advance(state, Math.min((now - lastTime) / 1000, .12));
    lastTime = now; lastPaint = now;
    if (previousStep !== state.step || wasPlaying !== state.playing) renderInfo();
    renderScene(); schedule();
  }
  function dispatch(action) {
    cancel(); state = update(state, action);
    if (action.type === 'step' || action.type === 'reset' || action.type === 'lattice') $('#cp-theory').open = false;
    renderInfo(); renderScene(); schedule();
  }
  function resize() {
    const rect = $('.cp-stage').getBoundingClientRect();
    if (rect.width > 0) width = clamp(Math.round(rect.width), 220, 1100);
    if (rect.height > 0) height = Math.max(400, Math.round(rect.height));
    $('#cp-svg').setAttribute('viewBox', `0 0 ${width} ${height}`);
    renderScene();
  }
  $('#cp-prev').addEventListener('click', () => dispatch({ type: 'step', value: state.step - 1 }));
  $('#cp-next').addEventListener('click', () => dispatch({ type: 'step', value: state.step + 1 }));
  $('#cp-play').addEventListener('click', () => dispatch({ type: 'play' }));
  $('#cp-reset').addEventListener('click', () => dispatch({ type: 'reset' }));
  $('#cp-lattice').addEventListener('click', () => dispatch({ type: 'lattice' }));
  $('#cp-speed').addEventListener('change', event => dispatch({ type: 'speed', value: event.target.value }));
  $('#cp-progress').addEventListener('input', event => dispatch({ type: 'seek', value: Number(event.target.value) / 100 }));
  $('#cp-twist').addEventListener('input', event => dispatch({ type: 'twist', value: event.target.value }));
  $('#cp-mediated').addEventListener('change', event => dispatch({ type: 'mediated', value: event.target.checked }));
  $('#cp-gap').addEventListener('change', event => dispatch({ type: 'gap', value: event.target.checked }));
  $('#cp-limits').addEventListener('change', event => dispatch({ type: 'limits', value: event.target.checked }));
  $$('[data-cp-coherence]').forEach(button => button.addEventListener('click', () => dispatch({ type: 'coherent', value: button.dataset.cpCoherence === 'yes' })));
  $$('[data-cp-step]').forEach(button => {
    button.addEventListener('click', () => dispatch({ type: 'step', value: Number(button.dataset.cpStep) }));
    button.addEventListener('keydown', event => {
      const focusedStep = Number(button.dataset.cpStep);
      const next = event.key === 'ArrowRight' ? Math.min(6, focusedStep + 1) : event.key === 'ArrowLeft' ? Math.max(0, focusedStep - 1) : event.key === 'Home' ? 0 : event.key === 'End' ? 6 : null;
      if (next === null) return;
      event.preventDefault(); dispatch({ type: 'step', value: next }); $('[data-cp-step="' + next + '"]').focus();
    });
  });
  if (typeof global.MutationObserver === 'function' && panel) {
    new global.MutationObserver(() => { cancel(); if (!panel.hidden) resize(); schedule(); }).observe(panel, { attributes: true, attributeFilter: ['hidden'] });
  }
  if (typeof global.IntersectionObserver === 'function') {
    new global.IntersectionObserver(entries => { inViewport = entries.some(entry => entry.isIntersecting); cancel(); schedule(); }, { rootMargin: '100px' }).observe($('.cp-stage'));
  }
  if (typeof global.ResizeObserver === 'function') new global.ResizeObserver(resize).observe($('.cp-stage'));
  $('#cp-motion-note').textContent = reduced ? '동작 줄이기 설정에 따라 정지 상태로 시작합니다. 단계·진행 슬라이더를 직접 조작하거나 원할 때 재생하세요.' : '정지 상태로 시작합니다. 자동재생하거나 단계·진행 슬라이더를 직접 조작해보세요.';
  document.addEventListener('visibilitychange', () => { cancel(); schedule(); });
  global.addEventListener?.('scroll', () => { if (!visible()) cancel(); else schedule(); }, {passive:true});
  global.addEventListener?.('pagehide', () => { cancel(); state={...state,playing:false}; });
  global.addEventListener?.('pageshow', () => { cancel(); renderInfo(false); resize(); });
  media?.addEventListener?.('change', event => {
    reduced=event.matches;
    if(reduced){cancel();state={...state,playing:false};renderInfo(false);}
    $('#cp-motion-note').textContent=reduced?'동작 줄이기 적용 · 단계와 진행 막대로 비교하세요. 원하면 직접 재생할 수 있습니다.':'정지 상태로 시작합니다. 단계와 진행 막대로 비교하거나 직접 재생하세요.';
  });
  if (!hasRAF) { $('#cp-play').disabled = true; $('#cp-lattice').disabled = true; }
  renderInfo(false); resize();
})(globalThis);

