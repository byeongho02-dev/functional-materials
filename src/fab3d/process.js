// A deterministic teaching event model. No plasma or transport solver is used.
export const STAGES = Object.freeze([
  { id: 'adsorption', title: '표면 흡착', en: 'Chlorination', start: 0, end: 4, description: 'Cl 계열 입자가 입사하고 Si 표면의 같은 site에 흡착합니다.' },
  { id: 'purge-1', title: '1차 퍼지', en: 'Purge I', start: 4, end: 6, description: '기상 잔류종을 비우고 표면의 흡착 상태를 유지합니다.' },
  { id: 'activation', title: '활성화 · 제거', en: 'Activation', start: 6, end: 10, description: '바이어스로 유도된 Ar⁺ 입사가 흡착 site를 활성화하고 제거합니다.' },
  { id: 'purge-2', title: '2차 퍼지', en: 'Purge II', start: 10, end: 12, description: '같은 site에서 생성된 제거종이 배기 경로로 이동합니다.' },
]);
export const CYCLE_DURATION = 12;
export const EVENT_TYPES = ['arrival', 'adsorption', 'ion-arrival', 'activation', 'removal', 'exhaust'];
export const SITES = Object.freeze(Array.from({ length: 16 }, (_, i) => {
  const angle = i * Math.PI * (3 - Math.sqrt(5));
  const radius = Math.sqrt((i + 0.5) / 16) * 1.24;
  return Object.freeze({ id: `S${String(i + 1).padStart(2, '0')}`, x: Math.cos(angle) * radius, z: Math.sin(angle) * radius });
}));

export function makeSurfaceEvents(cycle = 1) {
  return SITES.flatMap((site, i) => {
    const offset = i / SITES.length;
    const times = [0.25 + offset * 1.3, 1.15 + offset * 1.3, 6.2 + offset * 1.15, 6.85 + offset * 1.15, 7.5 + offset * 1.15, 10.45 + offset * 0.9];
    return EVENT_TYPES.map((type, j) => ({
      id: `C${cycle}-${site.id}-${type}`, cycle, siteId: site.id, type, at: times[j],
      species: j < 2 ? 'Cl-containing' : j < 4 ? 'Ar+' : 'SiClx', status: 'pending',
    }));
  }).sort((a, b) => a.at - b.at);
}

export class ProcessClock {
  constructor() {
    this.plasmaOn = true;
    this.biasOn = true;
    this.playing = true;
    this.speed = 1;
    this.reset();
  }
  reset() {
    this.time = 0;
    this.cycle = 1;
    this.elapsed = 0;
    this.completedRemovals = 0;
    this.events = makeSurfaceEvents(this.cycle);
  }
  get stageIndex() { return STAGES.findIndex(stage => this.time >= stage.start && this.time < stage.end); }
  get stage() { return STAGES[Math.max(0, this.stageIndex)]; }
  setPower({ plasmaOn = this.plasmaOn, biasOn = this.biasOn }) {
    this.plasmaOn = Boolean(plasmaOn);
    this.biasOn = Boolean(biasOn);
  }
  // Stage selection explicitly replays this cycle with the current power settings.
  seekStage(index) {
    if (!Number.isInteger(index) || !STAGES[index]) throw new RangeError('Unknown ALE stage');
    this.time = 0;
    this.events = makeSurfaceEvents(this.cycle);
    this.advanceTo(STAGES[index].start + 0.01);
  }
  advanceTo(target) {
    for (const event of this.events) {
      if (event.status !== 'pending' || event.at > target) continue;
      const previous = this.events.find(candidate => candidate.siteId === event.siteId && EVENT_TYPES.indexOf(candidate.type) === EVENT_TYPES.indexOf(event.type) - 1);
      const powered = event.type === 'exhaust' || (this.plasmaOn && (!['ion-arrival', 'activation', 'removal'].includes(event.type) || this.biasOn));
      event.status = powered && (!previous || previous.status === 'applied') ? 'applied' : 'skipped';
    }
    this.time = target;
  }
  tick(seconds) {
    if (!this.playing || !Number.isFinite(seconds) || seconds <= 0) return;
    let remaining = seconds * this.speed;
    this.elapsed += remaining;
    while (remaining > 1e-9) {
      const step = Math.min(remaining, CYCLE_DURATION - this.time);
      this.advanceTo(this.time + step);
      remaining -= step;
      if (this.time >= CYCLE_DURATION - 1e-9) {
        this.completedRemovals += this.events.filter(event => event.type === 'removal' && event.status === 'applied').length;
        this.cycle += 1;
        this.time = 0;
        this.events = makeSurfaceEvents(this.cycle);
      }
    }
  }
  siteState(siteId) {
    const events = this.events.filter(event => event.siteId === siteId);
    const done = type => events.find(event => event.type === type)?.status === 'applied';
    return {
      siteId, events, arrived: done('arrival'), adsorbed: done('adsorption'),
      activated: done('activation'), removed: done('removal'), exhausted: done('exhaust'),
    };
  }
  snapshot() {
    const sites = SITES.map(site => ({ ...site, ...this.siteState(site.id) }));
    return { time: this.time, cycle: this.cycle, stage: this.stage.id, plasmaOn: this.plasmaOn, biasOn: this.biasOn,
      sites, events: this.events.map(event => ({ ...event })), removed: sites.filter(site => site.removed).length };
  }
}

// Every trajectory is indexed by an actual surface event and its site's coordinates.
// A larger particle budget samples the same event paths; it never changes chemistry.
export function sampleParticles(clock, budget = 240) {
  const particles = [];
  const t = clock.time;
  for (const site of SITES) {
    const state = clock.siteState(site.id);
    const event = type => state.events.find(item => item.type === type);
    const cl = event('adsorption');
    const ion = event('activation');
    const out = event('exhaust');
    const paths = [];
    if (clock.plasmaOn && event('arrival').status === 'applied' && cl.status === 'pending') {
      const p = Math.max(0, (t - event('arrival').at) / (cl.at - event('arrival').at));
      paths.push({ kind: 'cl', eventId: cl.id, p, x: site.x * (0.5 + 0.5 * p), y: 1.96 - 1.49 * p, z: site.z * (0.5 + 0.5 * p) });
    }
    if (clock.plasmaOn && clock.biasOn && state.adsorbed && event('ion-arrival').status === 'applied' && ion.status === 'pending') {
      const p = (t - event('ion-arrival').at) / (ion.at - event('ion-arrival').at);
      paths.push({ kind: 'ion', eventId: ion.id, p, x: site.x, y: 1.9 - 1.43 * p, z: site.z });
    }
    if (state.removed && !state.exhausted) {
      const p = Math.max(0, Math.min(1, (t - event('removal').at) / (out.at - event('removal').at)));
      const angle = Math.atan2(site.z, site.x);
      const radial = 1.8 + 0.45 * Math.min(1, p * 2);
      const bend = Math.max(0, (p - 0.5) * 2);
      paths.push({ kind: 'product', eventId: out.id, p, x: (site.x * (1 - p) + Math.cos(angle) * radial * p) * (1 - bend) + 3.3 * bend,
        y: 0.47 - 1.4 * p, z: (site.z * (1 - p) + Math.sin(angle) * radial * p) * (1 - bend) });
    }
    for (const path of paths) {
      const copies = Math.max(1, Math.floor(budget / SITES.length));
      for (let n = 0; n < copies && particles.length < budget; n++) {
        const jitter = n === 0 ? 0 : 0.018 * Math.sqrt(n);
        particles.push({ ...path, siteId: site.id, x: path.x + Math.sin(n * 2.4) * jitter, z: path.z + Math.cos(n * 2.4) * jitter });
      }
    }
  }
  return particles;
}
