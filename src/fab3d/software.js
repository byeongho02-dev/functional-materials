import * as THREE from 'three';

// CPU projection of the same chamber triangles. No WebGL context or raster image.
// Painter ordering and a world-space clipping plane keep the fallback interactive.
export class SoftwareRenderer {
  constructor(canvas) {
    this.domElement = canvas;
    this.context = canvas.getContext('2d');
    this.width = 1;
    this.height = 1;
    this.light = new THREE.Vector3(0.4, 1, 0.7).normalize();
  }
  setSize(width, height) {
    this.width = width;
    this.height = height;
    this.domElement.width = Math.round(width * Math.min(devicePixelRatio || 1, 1.5));
    this.domElement.height = Math.round(height * Math.min(devicePixelRatio || 1, 1.5));
  }
  render(scene, camera, particles = []) {
    const ctx = this.context;
    const w = this.width;
    const h = this.height;
    ctx.setTransform(this.domElement.width / w, 0, 0, this.domElement.height / h, 0, 0);
    ctx.clearRect(0, 0, w, h);
    scene.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    const project = vector => {
      const v = vector.clone().project(camera);
      return [(v.x + 1) * w / 2, (1 - v.y) * h / 2, v.z];
    };
    ctx.strokeStyle = '#789db21a';
    ctx.lineWidth = 0.6;
    for (let d = -5; d <= 5; d += 0.5) {
      for (const pair of [[[d, -2.1, -5], [d, -2.1, 5]], [[-5, -2.1, d], [5, -2.1, d]]]) {
        const a = project(new THREE.Vector3(...pair[0]));
        const b = project(new THREE.Vector3(...pair[1]));
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      }
    }
    const faces = [];
    scene.traverseVisible(node => {
      if (!node.isMesh || node.isInstancedMesh || node.userData.softwareSkip) return;
      const material = node.material;
      if (material.opacity < 0.06) return;
      const attribute = node.geometry.attributes.position;
      if (!attribute) return;
      const index = node.geometry.index;
      const worlds = Array.from({ length: attribute.count }, (_, i) => new THREE.Vector3().fromBufferAttribute(attribute, i).applyMatrix4(node.matrixWorld));
      const count = index ? index.count : attribute.count;
      for (let n = 0; n < count; n += 3) {
        let polygon = [0, 1, 2].map(j => worlds[index ? index.getX(n + j) : n + j]);
        const normal = polygon[1].clone().sub(polygon[0]).cross(polygon[2].clone().sub(polygon[0])).normalize();
        if (material.side !== THREE.DoubleSide && normal.dot(camera.position.clone().sub(polygon[0])) < 0) continue;
        for (const plane of material.clippingPlanes || []) {
          const clipped = [];
          for (let k = 0; k < polygon.length; k++) {
            const a = polygon[k];
            const b = polygon[(k + 1) % polygon.length];
            const da = plane.distanceToPoint(a);
            const db = plane.distanceToPoint(b);
            if (da >= 0) clipped.push(a);
            if ((da < 0) !== (db < 0)) clipped.push(a.clone().lerp(b, da / (da - db)));
          }
          polygon = clipped;
          if (polygon.length < 3) break;
        }
        if (polygon.length < 3) continue;
        const points = polygon.map(project);
        if (points.some(p => p[2] < -1 || p[2] > 1)) continue;
        const color = material.color.clone().multiplyScalar(0.49 + Math.abs(normal.dot(this.light)) * 0.65);
        faces.push({ points, depth: points.reduce((sum, p) => sum + p[2], 0) / points.length,
          color: color.getStyle(), opacity: material.transparent ? material.opacity : 1 });
      }
    });
    faces.sort((a, b) => b.depth - a.depth);
    for (const face of faces) {
      ctx.globalAlpha = face.opacity;
      ctx.fillStyle = face.color;
      ctx.beginPath();
      face.points.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
      ctx.closePath(); ctx.fill();
      if (face.opacity === 1) { ctx.strokeStyle = face.color; ctx.lineWidth = 0.4; ctx.stroke(); }
    }
    ctx.globalAlpha = 1;
    for (const particle of particles) {
      const p = project(new THREE.Vector3(particle.x, particle.y, particle.z));
      ctx.fillStyle = { cl: '#8be1bc', ion: '#83bffa', product: '#e9ac77' }[particle.kind];
      ctx.beginPath(); ctx.arc(p[0], p[1], 1.4, 0, Math.PI * 2); ctx.fill();
    }
  }
  dispose() {}
}
