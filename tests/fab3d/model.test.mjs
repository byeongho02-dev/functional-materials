import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Box3, PerspectiveCamera, Vector3 } from 'three';
import { createChamber, COMPONENTS } from '../../src/fab3d/chamber.js';
import { CameraRig, VIEWS } from '../../src/fab3d/cameras.js';
import { ProcessClock, SITES, STAGES, EVENT_TYPES, makeSurfaceEvents, sampleParticles } from '../../src/fab3d/process.js';

test('all twelve independent chamber components contain real, finite 3D geometry', () => {
  const chamber = createChamber();
  assert.equal(COMPONENTS.length, 12);
  for (const part of COMPONENTS) {
    const group = chamber.parts.get(part.id);
    let triangles = 0;
    group.traverse(node => { if (node.isMesh) triangles += (node.geometry.index?.count || node.geometry.attributes.position.count) / 3; });
    assert.ok(triangles > 0, part.id);
    const size = new Box3().setFromObject(group).getSize(new Vector3());
    assert.ok([size.x, size.y, size.z].every(value => Number.isFinite(value) && value > 0), part.id);
  }
  const waferSize = new Box3().setFromObject(chamber.parts.get('wafer')).getSize(new Vector3());
  assert.ok(Math.abs(waferSize.x - 2.9) < 0.01, 'wafer reference diameter');
  chamber.setVisible('liner', false);
  assert.equal(chamber.parts.get('liner').visible, false);
  assert.equal(chamber.parts.get('body').visible, true);
  chamber.setExploded(1);
  assert.ok(chamber.parts.get('coil').position.y > chamber.parts.get('window').position.y);
  chamber.dispose();
});

test('cutaway clips shells and transparency disables their depth writes', () => {
  const chamber = createChamber();
  const shell = chamber.parts.get('body').children.find(node => node.userData.cutaway);
  assert.equal(shell.material.clippingPlanes.length, 1);
  chamber.setCutaway(false);
  assert.equal(shell.material.clippingPlanes.length, 0);
  chamber.setTransparent(true);
  assert.equal(shell.material.depthWrite, false);
  assert.ok(shell.material.opacity < 0.25);
  chamber.setTransparent(false);
  assert.equal(shell.material.depthWrite, true);
  assert.equal(shell.material.opacity, 1);
  chamber.dispose();
});

test('four camera presets interpolate smoothly and arrive at their documented targets', () => {
  const camera = new PerspectiveCamera();
  camera.position.set(7, 4, 9);
  const target = new Vector3();
  const rig = new CameraRig(camera, target);
  assert.equal(Object.keys(VIEWS).length, 4);
  for (const name of Object.keys(VIEWS)) {
    const start = camera.position.clone();
    rig.setView(name);
    assert.ok(camera.position.equals(start));
    rig.update(0.375);
    assert.ok(camera.position.distanceTo(new Vector3(...VIEWS[name].position)) > 0);
    rig.update(0.375);
    assert.ok(camera.position.distanceTo(new Vector3(...VIEWS[name].position)) < 1e-8);
    assert.ok(target.distanceTo(new Vector3(...VIEWS[name].target)) < 1e-8);
  }
});

test('four ALE stages have contiguous boundaries on one clock', () => {
  const clock = new ProcessClock();
  assert.deepEqual(STAGES.map(stage => stage.id), ['adsorption', 'purge-1', 'activation', 'purge-2']);
  for (let i = 0; i < 4; i++) { clock.seekStage(i); assert.equal(clock.stageIndex, i); }
  clock.playing = false;
  const time = clock.time;
  clock.tick(2);
  assert.equal(clock.time, time);
});

test('all arrival → adsorption → activation → removal → exhaust events retain exact cycle/site identity', () => {
  const clock = new ProcessClock();
  clock.tick(11.9);
  for (const site of SITES) {
    const events = clock.siteState(site.id).events;
    assert.deepEqual(events.map(event => event.type), EVENT_TYPES);
    assert.ok(events.every(event => event.status === 'applied' && event.siteId === site.id && event.cycle === 1));
    assert.ok(events.every((event, i) => i === 0 || event.at > events[i - 1].at));
  }
  assert.equal(clock.snapshot().removed, SITES.length);
  clock.tick(0.2);
  assert.equal(clock.cycle, 2);
  assert.equal(clock.completedRemovals, SITES.length);
  assert.ok(clock.events.every(event => event.id.startsWith('C2-')));
});

test('plasma OFF prevents generated species, adsorption, activation and removal', () => {
  const clock = new ProcessClock();
  clock.setPower({ plasmaOn: false });
  clock.tick(11.9);
  assert.ok(clock.events.every(event => event.status === 'skipped'));
  assert.equal(clock.snapshot().removed, 0);
  assert.equal(sampleParticles(clock, 800).length, 0);
});

test('bias OFF preserves Cl adsorption and prevents directed impacts and removal', () => {
  const clock = new ProcessClock();
  clock.setPower({ biasOn: false });
  clock.tick(11.9);
  assert.ok(SITES.every(site => clock.siteState(site.id).adsorbed));
  assert.ok(SITES.every(site => !clock.siteState(site.id).activated && !clock.siteState(site.id).removed));
  assert.equal(clock.plasmaOn, true);
});

test('power changes apply prospectively; blocked events cannot be replayed by toggling power', () => {
  const clock = new ProcessClock();
  clock.tick(3);
  clock.setPower({ plasmaOn: false });
  clock.tick(6);
  clock.setPower({ plasmaOn: true });
  clock.tick(2.5);
  assert.ok(SITES.every(site => clock.siteState(site.id).adsorbed && !clock.siteState(site.id).removed));
});

test('particle samples are bounded, causal, site-linked and independent of the event outcome', () => {
  const clock = new ProcessClock();
  const cases = [{ at: 1.1, kind: 'cl' }, { at: 6.9, kind: 'ion' }, { at: 9.6, kind: 'product' }];
  for (const { at, kind } of cases) {
    clock.advanceTo(at);
    const events = JSON.stringify(clock.events);
    assert.equal(sampleParticles(clock, 0).length, 0);
    for (const budget of [80, 240, 800]) {
      const particles = sampleParticles(clock, budget);
      assert.ok(particles.length > 0 && particles.length <= budget);
      assert.ok(particles.some(p => p.kind === kind));
      for (const particle of particles) {
        const event = clock.events.find(e => e.id === particle.eventId);
        assert.equal(event.siteId, particle.siteId);
        assert.ok([particle.x, particle.y, particle.z].every(Number.isFinite));
      }
    }
    assert.equal(JSON.stringify(clock.events), events);
  }
});

test('event outcomes are independent of frame cadence', () => {
  const fast = new ProcessClock(); const slow = new ProcessClock();
  for (let i = 0; i < 1190; i++) fast.tick(0.01);
  slow.tick(11.9);
  assert.deepEqual(fast.events, slow.events);
  assert.equal(new Set(makeSurfaceEvents(3).map(e => e.id)).size, 16 * 6);
});

test('preview UI excludes measurement/calibration panels and external CDN assets', () => {
  const html = readFileSync(new URL('../../ale-v092-fab-preview.html', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /\b(?:OES|IEDF|QMS|CSV)\b|diagnostic|cdn\./i);
  assert.match(html, /OEM/);
  assert.match(html, /다른 스케일/);
  assert.match(html, /실측 치수가 아닙니다/);
});
