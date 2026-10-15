// scripts/tsl-02-hybrid-experiment.ts
import { createFactMapFromHost } from '../src/kernel/hostAdapter';
import { computeFourierSpectralPassport, HybridPassport, Landmark } from '../src/experimental/spectral/Fourier';
import { Point2D } from '../src/kernel/types';

const TRIANGLES = {
  A: { A: 0, B: 80/360, C: 200/360 }, // Acute
  B: { A: 0, B: 90/360, C: 180/360 }, // Right
  C: { A: 0, B: 20/360, C: 160/360 }, // Obtuse
};

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

for (const [type, ptsU] of Object.entries(TRIANGLES)) {
  console.log(`\n--- Experiment: Triangle ${type} ---`);
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

  const passportSpectral = computeFourierSpectralPassport(contour, 16);

  // Mode A: Spectrum-only
  console.log(`  Mode A (Spectrum-only):`);
  const reconA = reconstruct(passportSpectral.fftX, passportSpectral.fftY, 16, N);
  console.log(`    Contour RMS Error: ${passportSpectral.reconstructionError.toFixed(4)}`);
  
  // Mode B: Spectrum + Landmarks (Landmarks are t values [0, 1) )
  console.log(`  Mode B (Spectrum + Landmarks):`);
  const landmarks: Landmark[] = [
    { id: 'vertex_A', t: 0.0, coordinates: canonical[0] },
    { id: 'vertex_B', t: 1/3, coordinates: canonical[1] },
    { id: 'vertex_C', t: 2/3, coordinates: canonical[2] }
  ];
  const hybridB: HybridPassport = {
    spectral: passportSpectral,
    landmarks: landmarks,
    metadata: { 
      id: `TSL-02-${type}`, 
      sampleCount: N, 
      harmonics: 16, 
      traversal: 'linear',
      canonicalObject: `canonical_triangle_${type}`,
      spectralAnalysisRun: `run_${Date.now()}`,
      parameterization: 't_0_to_1',
      algorithmVersion: '1.0.0',
      isAuthoritative: true
    }
  };
  
  // Reconstruction in Mode B uses landmarks
  const reconB = reconstruct(hybridB.spectral.fftX, hybridB.spectral.fftY, 16, N);
  const recoveredVerticesB = hybridB.landmarks!.map(l => {
    return l.coordinates || reconB[Math.round(l.t * N) % N];
  });
  console.log(`    Recovered Vertices:`, recoveredVerticesB.map(v => `(${v.x.toFixed(2)}, ${v.y.toFixed(2)})`));
  console.log(`    Original Vertices:`, canonical.map(v => `(${v.x.toFixed(2)}, ${v.y.toFixed(2)})`));

  // Mode C: Full Canonical
  console.log(`  Mode C (Full Canonical Reference):`);
  const hybridC: HybridPassport = {
    ...hybridB,
    canonicalReference: `canonical_triangle_${type}`
  };
  console.log(`    Canonical Reference: ${hybridC.canonicalReference}`);
}
