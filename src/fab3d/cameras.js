import { Vector3 } from 'three';

export const VIEWS = Object.freeze({
  orbit: { position: [7.5, 5.4, 9], target: [0.05, 0.72, 0], cutaway: true },
  front: { position: [0, 1.4, 12.8], target: [0, 0.75, 0], cutaway: true },
  top: { position: [0, 12.5, 0.02], target: [0, 0.8, 0], cutaway: true },
  wafer: { position: [3.1, 3.5, 4.8], target: [0, 0.45, 0], cutaway: true },
});

export class CameraRig {
  constructor(camera, target) { this.camera = camera; this.target = target; this.current = 'orbit'; this.transition = null; }
  setView(name, immediate = false) {
    const view = VIEWS[name];
    if (!view) throw new RangeError('Unknown camera view');
    this.current = name;
    this.transition = { from: this.camera.position.clone(), fromTarget: this.target.clone(),
      to: new Vector3(...view.position), toTarget: new Vector3(...view.target), progress: 0 };
    if (immediate) this.update(1);
  }
  cancel() { this.transition = null; }
  update(delta) {
    if (!this.transition) return;
    const t = this.transition;
    t.progress = Math.min(1, t.progress + delta / 0.75);
    const ease = t.progress * t.progress * (3 - 2 * t.progress);
    this.camera.position.lerpVectors(t.from, t.to, ease);
    this.target.lerpVectors(t.fromTarget, t.toTarget, ease);
    this.camera.lookAt(this.target);
    if (t.progress === 1) this.transition = null;
  }
}
