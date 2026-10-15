// scripts/reconstruct-triangle-experiment.ts
import { createFactMapFromHost } from '../src/kernel/hostAdapter';
import { computeFourierSpectralPassport } from '../src/experimental/spectral/Fourier';
import { Point2D } from '../src/kernel/types';

const TRIANGLES = {
  A: { A: 0, B: 80/360, C: 200/360 }, // Acute
  B: { A: 0, B: 90/360, C: 180/360 }, // Right
  C: { A: 0, B: 20/360, C: 160/360 }, // Obtuse
};

// Reconstruct function
function reconstruct(fftX: number[], fftY: number[], harmonics: number, N: number): Point2D[] {
  const xRecon = new Array(N).fill(0);
  const yRecon = new Array(N).fill(0);
  for (let n = 0; n < N; n++) {
    for (let k = 0; k < harmonics; k++) {
      const angle = (2 * Math.PI * k * n) / N;
      xRecon[n] += (fftX[k] * Math.cos(angle) - fftY[k] * Math.sin(angle));
      yRecon[n] += (fftY[k] * Math.cos(angle) + fftX[k] * Math.sin(angle));
    }
  }
  return xRecon.map((x, i) => ({ x, y: yRecon[i] }));
}

// Vertex recovery: Farthest points from origin
function recoverVertices(contour: Point2D[]): Point2D[] {
    const sorted = contour.map((p, i) => ({p, dist: Math.sqrt(p.x*p.x + p.y*p.y), i}))
        .sort((a, b) => b.dist - a.dist);
    
    // Pick 3 points that are well-separated
    const vertices: Point2D[] = [];
    for (const item of sorted) {
        if (vertices.length === 3) break;
        if (vertices.every(v => Math.hypot(v.x - item.p.x, v.y - item.p.y) > 0.5)) {
            vertices.push(item.p);
        }
    }
    return vertices;
}

for (const [type, ptsU] of Object.entries(TRIANGLES)) {
  console.log(`--- Experiment: Triangle ${type} ---`);
  const facts = createFactMapFromHost({ pointsU: ptsU as any, R: 1 });
  const canonical = [facts.coord_A as any as Point2D, facts.coord_B as any as Point2D, facts.coord_C as any as Point2D];
  
  const N = 64;
  const contour = Array.from({ length: N }, (_, i) => {
    const t = i / N;
    const idx = Math.floor(t * 3);
    const nextIdx = (idx + 1) % 3;
    const localT = (t * 3) % 1;
    return {
      x: canonical[idx].x + (canonical[nextIdx].x - canonical[idx].x) * localT,
      y: canonical[idx].y + (canonical[nextIdx].y - canonical[idx].y) * localT,
    };
  });

  // Full Spectrum (16 harmonics for better reconstruction)
  const passportFull = computeFourierSpectralPassport(contour, 16);
  const reconFull = reconstruct(passportFull.fftX, passportFull.fftY, 16, N);
  const verticesFull = recoverVertices(reconFull);
  
  console.log(`  Full Spectrum (16 harmonics):`);
  console.log(`    Contour RMS Error: ${passportFull.reconstructionError.toFixed(4)}`);
  console.log(`    Recovered Vertices:`, verticesFull.map(v => `(${v.x.toFixed(2)}, ${v.y.toFixed(2)})`));

  // Truncated Spectrum (3 harmonics)
  const passportTrunc = computeFourierSpectralPassport(contour, 3);
  const reconTrunc = reconstruct(passportTrunc.fftX, passportTrunc.fftY, 3, N);
  const verticesTrunc = recoverVertices(reconTrunc);
  
  console.log(`  Truncated Spectrum (3 harmonics):`);
  console.log(`    Contour RMS Error: ${passportTrunc.reconstructionError.toFixed(4)}`);
  console.log(`    Recovered Vertices:`, verticesTrunc.map(v => `(${v.x.toFixed(2)}, ${v.y.toFixed(2)})`));
  console.log(`    Original Vertices:`, canonical.map(v => `(${v.x.toFixed(2)}, ${v.y.toFixed(2)})`));
}
