const test = require('node:test');
const assert = require('node:assert/strict');
const model = require('../learning-electromagnetic/cooper-pair.js');

test('s-wave quasiparticle spectrum is even, has minimum |delta| and reduces to |xi| without a gap', () => {
  for (const gap of [0, .3, 1, 2]) for (const xi of [-8, -1, 0, .1, 3]) {
    const energy = model.quasiparticleEnergy(xi, gap);
    assert.equal(energy, model.quasiparticleEnergy(-xi, gap));
    assert.ok(energy >= Math.abs(gap));
    assert.ok(Math.abs(energy ** 2 - xi ** 2 - gap ** 2) < 1e-12);
  }
  assert.equal(model.quasiparticleEnergy(0, 1), 1);
  assert.equal(model.quasiparticleEnergy(-2, 0), 2);
});

test('phase energy has global-phase and gauge invariance, but a spatial twist costs energy', () => {
  const uniform = model.phaseAngles(true, 0);
  const twisted = model.phaseAngles(true, 20);
  assert.equal(model.phaseCost(uniform), 0);
  assert.ok(model.phaseCost(twisted) > 0);
  assert.ok(Math.abs(model.phaseCost(twisted) - model.phaseCost(twisted.map(p => p + .73))) < 1e-12);
  const before = model.linkCost(.2, .8, .1);
  const afterGaugeTransform = model.linkCost(.2 + .3, .8 - .7, .1 + (-.7 - .3));
  assert.ok(Math.abs(before - afterGaugeTransform) < 1e-12);
  assert.ok(model.phaseCost(model.phaseAngles(true, 40)) > model.phaseCost(twisted));
  const differences = twisted.slice(1).map((p, i) => p - twisted[i]);
  assert.ok(differences.every(d => Math.abs(d - differences[0]) < 1e-12), 'Smooth gradient retains a fixed relative phase');
});

test('lattice response is delayed and an earlier site responds while a not-yet-passed site remains still', () => {
  assert.equal(model.ionOffset(0, 0, 0), 0);
  assert.equal(model.ionOffset(.05, 0, 0), 0);
  assert.notEqual(model.ionOffset(.2, 0, 0), 0);
  assert.equal(model.ionOffset(.2, 7, 0), 0);
  assert.notEqual(model.ionOffset(.9, 7, 0), 0);
  assert.equal(model.ionOffset(.2, 0, 0), -model.ionOffset(.2, 0, 3));
});

test('replay visits all seven stages, pauses at the end and can restart', () => {
  let state = model.update(model.createState(), { type: 'play' });
  const visited = [state.step];
  for (let i = 0; i < 7; i++) { state = model.advance(state, model.DURATION); visited.push(state.step); }
  assert.deepEqual([...new Set(visited)], [0, 1, 2, 3, 4, 5, 6]);
  assert.equal(state.playing, false);
  assert.equal(state.elapsed, model.DURATION);
  state = model.update(state, { type: 'play' });
  assert.equal(state.step, 0);
  assert.equal(state.elapsed, 0);
  assert.equal(state.playing, true);
});

test('pause freezes time, seek is bounded, speed scales playback, lattice replay stops on its own stage', () => {
  const paused = model.createState();
  assert.deepEqual(model.advance(paused, 100), paused);
  let state = model.update(paused, { type: 'play' });
  state = model.update(state, { type: 'speed', value: 2 });
  assert.equal(model.advance(state, 1).elapsed, 2);
  assert.equal(model.update(state, { type: 'seek', value: 5 }).elapsed, model.DURATION);
  state = model.update(state, { type: 'lattice' });
  state = model.advance(state, 20);
  assert.equal(state.step, 1);
  assert.equal(state.playing, false);
});

test('pair illustration, coherence choice, spectrum comparison and critical-condition choice are independent', () => {
  let state = model.update(model.createState(), { type: 'step', value: 3 });
  state = model.update(state, { type: 'coherent', value: false });
  assert.equal(state.step, 3, 'Pair scene is not removed when phase is disordered');
  const phases = model.phaseAngles(state.coherent, state.twist);
  const costBefore = model.phaseCost(phases);
  state = model.update(state, { type: 'gap', value: false });
  assert.equal(model.phaseCost(phases), costBefore, 'Gap comparison does not define phase stiffness');
  state = model.update(state, { type: 'limits', value: false });
  assert.equal(state.withinLimits, false);
  assert.equal(state.coherent, false);
  assert.deepEqual(model.update(state, { type: 'reset' }), model.createState());
});

test('each step supplies a causal statement, reading, scientific labels and a distinct stage identity', () => {
  assert.equal(model.steps.length, 7);
  assert.equal(new Set(model.steps.map(s => s.title)).size, 7);
  for (const step of model.steps) {
    assert.ok(step.key && step.short && step.caption && step.legend);
    assert.ok(step.theory.length >= 2);
  }
  assert.match(model.steps[4].caption, /이동 방향/);
  assert.match(model.steps[5].caption, /상태밀도/);
  assert.ok(model.steps[5].theory.some(p => p.includes('3.52') && p.includes('보편')));
});

