const assert = require('node:assert/strict');
const { ALEEngine, ConceptualPlasmaModel, constants } = require('../sim-model.js');

function runCycles(count, input = {}) {
  const engine = new ALEEngine();
  for (let cycle = 1; cycle <= count; cycle += 1) {
    const plan = engine.prepareCycle({ cycle, sourcePowerW: 300, ionEnergyEv: 50, coveragePct: 65, ...input });
    engine.completeCycle(plan);
  }
  return engine;
}

{
  const plasma = new ConceptualPlasmaModel();
  assert.deepEqual(plasma.evaluate(0), { sourcePowerW: 0, sourceOn: false, radicalFluxIndex: 0, ionFluxIndex: 0, calibration: 'conceptual-placeholder' });
  assert.equal(plasma.evaluate(300).ionFluxIndex, 0.5);
  assert.equal(plasma.evaluate(600).radicalFluxIndex, 1);
}

for (const count of [1, 10, 50, 100]) {
  const engine = runCycles(count);
  assert.equal(engine.history.length, count, `${count}-cycle history`);
  assert.equal(engine.currentCycle, count, `${count}-cycle counter`);
  assert.equal(engine.history.at(-1).totalRemovedAtoms, engine.totalRemoved, `${count}-cycle removal total`);
  assert.ok(engine.cumulativeDepthA >= 0, `${count}-cycle cumulative depth`);
  assert.equal(engine.atoms.filter(atom => !atom.active).length, engine.totalRemoved, `${count}-cycle atom/render sync`);
}

{
  const engine = runCycles(10, { sourcePowerW: 0, ionEnergyEv: 100, coveragePct: 100 });
  assert.equal(engine.totalRemoved, 0, '0 W removes no atoms');
  assert.equal(engine.cumulativeDepthA, 0, '0 W etch depth is zero');
  assert.ok(engine.history.every(row => row.coveragePct === 0), '0 W coverage is zero');
}

{
  const low = new ALEEngine();
  const high = new ALEEngine();
  const lowPlan = low.prepareCycle({ cycle: 1, sourcePowerW: 300, ionEnergyEv: 20, coveragePct: 100 });
  const highPlan = high.prepareCycle({ cycle: 1, sourcePowerW: 300, ionEnergyEv: 100, coveragePct: 100 });
  assert.equal(lowPlan.plasma.ionFluxIndex, highPlan.plasma.ionFluxIndex, 'ion energy does not alter source-power flux index');
  assert.ok(highPlan.removalIds.length >= lowPlan.removalIds.length, 'energy is an independent activation input');
}

{
  const engine = new ALEEngine();
  const plan = engine.prepareCycle({ cycle: 1, sourcePowerW: 600, ionEnergyEv: 100, coveragePct: 100 });
  const result = engine.completeCycle(plan);
  const expected = result.removedAtoms * constants.SI_ATOMIC_VOLUME / (engine.cols * engine.rows * constants.SI_100_SITE_AREA);
  assert.equal(result.epcA, expected, 'EPC uses removed atomic volume divided by modeled area');
  assert.ok(engine.getSurfaceAtoms().every(atom => atom.active), 'new surface contains only active atoms');
}

console.log('ALE model tests passed');
