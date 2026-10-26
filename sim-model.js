(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ALEModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const SI_LATTICE_A = 5.431; // Å, room-temperature reference geometry
  const SI_ATOMIC_VOLUME = Math.pow(SI_LATTICE_A, 3) / 8;
  const SI_100_SITE_AREA = Math.pow(SI_LATTICE_A, 2) / 2;
  const ENERGY_FACTORS = Object.freeze({ 20: 0.35, 50: 0.68, 100: 1 });
  // Normalized, uncalibrated adsorption saturation. These are demonstration-only
  // parameters, NOT measured Cl sticking coefficients or radical fluxes.
  const ADSORPTION_SATURATION_FRACTION = 0.98;
  const ADSORPTION_RATE_INDEX_PER_S = 0.44;

  function estimateCoveragePct(exposureTimeS, radicalFluxIndex) {
    const timeS = clamp(exposureTimeS, 0, 20);
    const fluxIndex = clamp(radicalFluxIndex, 0, 1);
    if (!(timeS > 0 && fluxIndex > 0)) return 0;
    return 100 * ADSORPTION_SATURATION_FRACTION *
      (1 - Math.exp(-ADSORPTION_RATE_INDEX_PER_S * fluxIndex * timeS));
  }


  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, Number(value)));
  }

  function mulberry32(seed) {
    return function () {
      let t = seed += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  class ConceptualPlasmaModel {
    evaluate(sourcePowerW) {
      const power = clamp(sourcePowerW, 0, 600);
      const sourceOn = power > 0;
      // Dimensionless placeholders only. Replace these adapters with calibrated
      // OES/QMS/IEDF or flux data; they are not physical flux predictions.
      const normalizedCommand = sourceOn ? power / 600 : 0;
      return {
        sourcePowerW: power,
        sourceOn,
        radicalFluxIndex: normalizedCommand,
        ionFluxIndex: normalizedCommand,
        calibration: 'conceptual-placeholder'
      };
    }
  }

  class ALEEngine {
    constructor(options = {}) {
      this.cols = options.cols || 8;
      this.rows = options.rows || 8;
      this.layers = options.layers || 20;
      this.maxCycles = options.maxCycles || 100;
      this.plasmaModel = options.plasmaModel || new ConceptualPlasmaModel();
      this.reset();
    }

    reset() {
      this.atoms = [];
      this.history = [];
      this.totalRemoved = 0;
      this.cumulativeDepthA = 0;
      this.currentCycle = 0;
      this.nextId = 1;
      for (let layer = 0; layer < this.layers; layer += 1) {
        for (let row = 0; row < this.rows; row += 1) {
          for (let col = 0; col < this.cols; col += 1) {
            this.atoms.push({
              id: this.nextId++, col, row, layer,
              x: (col - (this.cols - 1) / 2) * 42 + (layer % 2) * 10,
              y: (row - (this.rows - 1) / 2) * 42 + (layer % 2) * 10,
              z: layer * 34,
              active: true,
              adsorbed: false,
              modified: false,
              removedCycle: null
            });
          }
        }
      }
      return this.snapshot();
    }

    getSurfaceAtoms() {
      const topByColumn = new Map();
      for (const atom of this.atoms) {
        if (!atom.active) continue;
        const key = `${atom.col}:${atom.row}`;
        const top = topByColumn.get(key);
        if (!top || atom.layer < top.layer) topByColumn.set(key, atom);
      }
      return Array.from(topByColumn.values());
    }

    prepareCycle(input) {
      const cycle = Math.floor(clamp(input.cycle, 1, Number.MAX_SAFE_INTEGER));
      const exposureTimeS = clamp(input.exposureTimeS ?? 5, 0, 20);
      const ionEnergyEv = ENERGY_FACTORS[input.ionEnergyEv] ? Number(input.ionEnergyEv) : 50;
      const plasma = this.plasmaModel.evaluate(input.sourcePowerW);
      const modeledCoveragePct = estimateCoveragePct(exposureTimeS, plasma.radicalFluxIndex);
      // Quantization into the finite 8x8 surface lattice yields the displayed coverage.
      const coveragePct = modeledCoveragePct;
      const surface = this.getSurfaceAtoms();
      surface.forEach(atom => { atom.adsorbed = false; atom.modified = false; });

      if (!plasma.sourceOn || surface.length === 0) {
        return { cycle, plasma, coveragePct: 0, modeledCoveragePct: 0, exposureTimeS, ionEnergyEv, adsorbedIds: [], modifiedIds: [], removalIds: [] };
      }

      const rng = mulberry32(0xA1E000 + cycle * 4099 + Math.round(coveragePct) * 31 + ionEnergyEv * 7 + Math.round(plasma.sourcePowerW));
      const shuffled = surface.slice().sort(() => rng() - 0.5);
      const adsorbCount = Math.min(surface.length, Math.round(surface.length * coveragePct / 100));
      const adsorbed = shuffled.slice(0, adsorbCount);
      const actualCoveragePct = surface.length ? adsorbed.length / surface.length * 100 : 0;
      adsorbed.forEach(atom => { atom.adsorbed = true; atom.modified = true; });

      // Conceptual event selector: source power supplies independent, normalized
      // radical/ion availability; ion energy remains a separate activation input.
      // The output is explicitly not a calibrated etch-rate prediction.
      const conceptualYield = ENERGY_FACTORS[ionEnergyEv] * plasma.ionFluxIndex;
      const removalCount = Math.min(
        adsorbed.length,
        Math.max(0, Math.round(adsorbed.length * 0.16 * conceptualYield))
      );
      const removalIds = adsorbed
        .slice()
        .sort((a, b) => ((a.col + a.row + cycle) % 5) - ((b.col + b.row + cycle) % 5) || a.id - b.id)
        .slice(0, removalCount)
        .map(atom => atom.id);

      return {
        cycle, plasma, coveragePct: actualCoveragePct, modeledCoveragePct, exposureTimeS, ionEnergyEv,
        adsorbedIds: adsorbed.map(atom => atom.id),
        modifiedIds: adsorbed.map(atom => atom.id),
        removalIds
      };
    }

    completeCycle(plan) {
      const removalSet = new Set(plan.removalIds);
      for (const atom of this.atoms) {
        if (removalSet.has(atom.id) && atom.active) {
          atom.active = false;
          atom.adsorbed = false;
          atom.modified = false;
          atom.removedCycle = plan.cycle;
        } else if (atom.active) {
          atom.adsorbed = false;
          atom.modified = false;
        }
      }

      const removed = plan.removalIds.length;
      const modeledAreaA2 = this.cols * this.rows * SI_100_SITE_AREA;
      const epcA = removed * SI_ATOMIC_VOLUME / modeledAreaA2;
      this.totalRemoved += removed;
      this.cumulativeDepthA += epcA;
      this.currentCycle = plan.cycle;
      const result = {
        cycle: plan.cycle,
        coveragePct: plan.coveragePct,
        exposureTimeS: plan.exposureTimeS,
        sourcePowerW: plan.plasma.sourcePowerW,
        ionEnergyEv: plan.ionEnergyEv,
        modifiedAtoms: plan.modifiedIds.length,
        removedAtoms: removed,
        totalRemovedAtoms: this.totalRemoved,
        epcA,
        cumulativeDepthA: this.cumulativeDepthA,
        surfaceAtoms: this.getSurfaceAtoms().length,
        modelType: plan.plasma.calibration
      };
      this.history.push(result);
      return result;
    }

    snapshot() {
      return {
        currentCycle: this.currentCycle,
        totalRemoved: this.totalRemoved,
        cumulativeDepthA: this.cumulativeDepthA,
        activeAtoms: this.atoms.filter(atom => atom.active).length,
        surfaceAtoms: this.getSurfaceAtoms().length,
        history: this.history.slice()
      };
    }
  }

  return {
    ALEEngine,
    ConceptualPlasmaModel,
    estimateCoveragePct,
    constants: { SI_LATTICE_A, SI_ATOMIC_VOLUME, SI_100_SITE_AREA, ENERGY_FACTORS, ADSORPTION_SATURATION_FRACTION, ADSORPTION_RATE_INDEX_PER_S },
    clamp
  };
});
