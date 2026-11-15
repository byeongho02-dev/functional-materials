import { SITES } from './process.js';

export class SurfaceView {
  constructor(canvas, onSelect) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.points = [];
    canvas.addEventListener('click', event => {
      const rect = canvas.getBoundingClientRect();
      const point = this.points.map(p => ({ ...p, distance: Math.hypot(p.x - (event.clientX - rect.left), p.y - (event.clientY - rect.top)) })).sort((a, b) => a.distance - b.distance)[0];
      if (point && point.distance < 35) onSelect(point.id);
    });
  }
  draw(clock, selected) {
    const c = this.canvas;
    const w = c.clientWidth;
    const h = c.clientHeight;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    if (c.width !== Math.round(w * ratio) || c.height !== Math.round(h * ratio)) { c.width = Math.round(w * ratio); c.height = Math.round(h * ratio); }
    const ctx = this.ctx;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const project = (x, z) => ({ x: w / 2 + (x - z * 0.65) * w * 0.22, y: h * 0.59 + (x * 0.32 + z * 0.55) * h * 0.25 });
    ctx.beginPath();
    [[-1.5, -1.5], [1.5, -1.5], [1.5, 1.5], [-1.5, 1.5]].map(p => project(...p)).forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    ctx.closePath(); ctx.fillStyle = '#203746'; ctx.fill(); ctx.strokeStyle = '#3d5e6c'; ctx.stroke();
    const sphere = (x, y, radius, color) => {
      const gradient = ctx.createRadialGradient(x - radius * 0.35, y - radius * 0.4, radius * 0.08, x, y, radius);
      gradient.addColorStop(0, color); gradient.addColorStop(1, '#1a2b36');
      ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
    };
    this.points = SITES.map(site => ({ id: site.id, ...project(site.x, site.z) }));
    const sorted = this.points.toSorted((a, b) => a.y - b.y);
    for (const p of sorted) {
      const state = clock.siteState(p.id);
      if (state.removed) {
        ctx.strokeStyle = '#5e4c3a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(p.x, p.y, 5, 2.5, 0, 0, Math.PI * 2); ctx.stroke();
      } else {
        sphere(p.x, p.y, 5.4, state.activated ? '#f0bc82' : '#9daeb9');
        if (state.adsorbed) {
          ctx.strokeStyle = state.activated ? '#dab98d' : '#7ebf9e';
          ctx.beginPath(); ctx.moveTo(p.x, p.y - 3); ctx.lineTo(p.x, p.y - 11); ctx.stroke();
          sphere(p.x, p.y - 12, 4.1, '#a1e7ba');
        } else if (state.arrived) {
          const landing = state.events.find(e => e.type === 'adsorption');
          const arrival = state.events.find(e => e.type === 'arrival');
          const progress = Math.min(1, (clock.time - arrival.at) / (landing.at - arrival.at));
          if (clock.plasmaOn) sphere(p.x, p.y - 12 - 24 * (1 - progress), 3.1, '#a1e7ba');
        }
      }
      if (p.id === selected) {
        ctx.strokeStyle = '#b4e0d0'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(p.x, p.y + 1, 10, 5, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#c4e8dc'; ctx.font = '8px ui-monospace, monospace'; ctx.fillText(p.id, p.x + 10, p.y - 2);
      }
    }
    ctx.fillStyle = '#63808f'; ctx.font = '7px ui-monospace, monospace'; ctx.fillText('Si / Cl  ·  CONCEPTUAL MAGNIFICATION', 9, h - 9);
  }
}
