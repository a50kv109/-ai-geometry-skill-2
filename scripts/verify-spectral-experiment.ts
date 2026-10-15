// scripts/verify-spectral-experiment.ts
import { createFactMapFromHost } from '../src/kernel/hostAdapter';
import { computeFourierSpectralPassport } from '../src/experimental/spectral/Fourier';

const TRIANGLES = {
  A: { A: 0, B: 80/360, C: 200/360 }, // Acute
  B: { A: 0, B: 90/360, C: 180/360 }, // Right
  C: { A: 0, B: 20/360, C: 160/360 }, // Obtuse
};

for (const [type, ptsU] of Object.entries(TRIANGLES)) {
  const facts = createFactMapFromHost({ pointsU: ptsU as any, R: 1 });
  const pts = [facts.coord_A, facts.coord_B, facts.coord_C];
  const contour = Array.from({ length: 64 }, (_, i) => {
    const t = i / 64;
    const idx = Math.floor(t * 3);
    const nextIdx = (idx + 1) % 3;
    const localT = (t * 3) % 1;
    return {
      x: pts[idx].x + (pts[nextIdx].x - pts[idx].x) * localT,
      y: pts[idx].y + (pts[nextIdx].y - pts[idx].y) * localT,
    };
  });
  const passport = computeFourierSpectralPassport(contour, 5);
  console.log(`Triangle ${type} Amplitudes:`, passport.amplitudes.map(a => a.toFixed(3)), "Error:", passport.reconstructionError.toFixed(4));
}

// Circle Verification
const circleContour = Array.from({ length: 64 }, (_, i) => ({
  x: Math.cos((2 * Math.PI * i) / 64),
  y: Math.sin((2 * Math.PI * i) / 64),
}));
const circlePassport = computeFourierSpectralPassport(circleContour, 5);
console.log(`Circle Amplitudes:`, circlePassport.amplitudes.map(a => a.toFixed(3)), "Error:", circlePassport.reconstructionError.toFixed(4));
