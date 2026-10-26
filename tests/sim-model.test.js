const assert = require('node:assert/strict');
const { ALEEngine, ConceptualPlasmaModel, estimateCoveragePct, constants } = require('../sim-model.js');

function runCycles(count, input = {}) {
  const engine = new ALEEngine();
  for (let cycle = 1; cycle <= count; cycle += 1) {
    const plan = engine.prepareCycle({
      cycle, sourcePowerW: 300, ionEnergyEv: 50, exposureTimeS: 5, ...input
    });
    engine.completeCycle(plan);
  }
  return engine;
}

{
  const plasma = new ConceptualPlasmaModel();
  assert.deepEqual(plasma.evaluate(0), {
    sourcePowerW: 0, sourceOn: false, radicalFluxIndex: 0,
    ionFluxIndex: 0, calibration: 'conceptual-placeholder'
  });
  assert.equal(plasma.evaluate(300).ionFluxIndex, 0.5);
  assert.equal(plasma.evaluate(600).radicalFluxIndex, 1);
}

{
  const values = [0, 1, 5, 10, 20].map(time => estimateCoveragePct(time, 0.5));
  assert.equal(values[0], 0, 'zero exposure gives zero coverage');
  assert.ok(values.every((v, i) => !i || v > values[i - 1]),
    'increasing exposure approaches saturation');
  assert.ok(values.at(-1) < 100, 'adsorption must remain bounded');
  assert.equal(estimateCoveragePct(20, 0), 0, 'zero radical flux gives zero adsorption');
  assert.ok(estimateCoveragePct(10, 1) > estimateCoveragePct(10, 0.5),
    'greater normalized flux increases modeled coverage');
}

{
  const engine = new ALEEngine();
  const exposures = [0, 1, 5, 10, 20];
  let last = -1;
  for (const exposureTimeS of exposures) {
    const plan = engine.prepareCycle({
      cycle: 1, sourcePowerW: 300, ionEnergyEv: 50, exposureTimeS
    });
    assert.ok(plan.coveragePct >= last, 'adsorption increases with exposure');
    assert.ok(plan.adsorbedIds.length >= 0);
    assert.equal(plan.exposureTimeS, exposureTimeS);
    last = plan.coveragePct;
  }
}

for (const count of [1, 10, 50, 100]) {
  const engine = runCycles(count);
  assert.equal(engine.history.length, count, count + '-cycle history');
  assert.equal(engine.currentCycle, count, count + '-cycle counter');
  assert.equal(engine.history.at(-1).totalRemovedAtoms, engine.totalRemoved,
    count + '-cycle removal total');
  assert.ok(engine.cumulativeDepthA >= 0, count + '-cycle cumulative depth');
  assert.equal(engine.atoms.filter(atom => !atom.active).length, engine.totalRemoved,
    count + '-cycle atom/render sync');
}

for (const input of [
  { sourcePowerW: 0, exposureTimeS: 20 },
  { sourcePowerW: 300, exposureTimeS: 0 }
]) {
  const engine = runCycles(10, { ...input, ionEnergyEv: 100 });
  assert.equal(engine.totalRemoved, 0, 'no Cl adsorption means no modeled etch');
  assert.equal(engine.cumulativeDepthA, 0, 'no adsorption yields zero depth');
  assert.ok(engine.history.every(row => row.coveragePct === 0),
    'no adsorption yields zero surface coverage');
}

{
  const low = new ALEEngine();
  const high = new ALEEngine();
  const lowPlan = low.prepareCycle({
    cycle: 1, sourcePowerW: 300, ionEnergyEv: 20, exposureTimeS: 10
  });
  const highPlan = high.prepareCycle({
    cycle: 1, sourcePowerW: 300, ionEnergyEv: 100, exposureTimeS: 10
  });
  assert.equal(lowPlan.plasma.ionFluxIndex, highPlan.plasma.ionFluxIndex,
    'ion energy does not alter source-power flux index');
  assert.ok(highPlan.removalIds.length >= lowPlan.removalIds.length,
    'ion energy is an independent activation input');
}

{
  const engine = new ALEEngine();
  const plan = engine.prepareCycle({
    cycle: 1, sourcePowerW: 600, ionEnergyEv: 100, exposureTimeS: 20
  });
  const result = engine.completeCycle(plan);
  const expected = result.removedAtoms * constants.SI_ATOMIC_VOLUME /
    (engine.cols * engine.rows * constants.SI_100_SITE_AREA);
  assert.equal(result.epcA, expected,
    'EPC equals removed atomic volume divided by modeled area');
  assert.equal(result.exposureTimeS, 20, 'result records the exposure time');
  assert.ok(engine.getSurfaceAtoms().every(atom => atom.active),
    'new surface contains only active atoms');
}

console.log('ALE exposure-time saturation and model tests passed');
