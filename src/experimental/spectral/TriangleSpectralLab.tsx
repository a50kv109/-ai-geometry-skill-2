// src/experimental/spectral/TriangleSpectralLab.tsx
import React, { useState, useMemo } from 'react';
import { createFactMapFromHost } from '../../kernel/hostAdapter';
import { Point2D } from '../../kernel/types';
import { computeFourierSpectralPassport } from './Fourier';

const TRIANGLES = {
  A: { A: 0, B: 80/360, C: 200/360 }, // Acute
  B: { A: 0, B: 90/360, C: 180/360 }, // Right
  C: { A: 0, B: 20/360, C: 160/360 }, // Obtuse
};

export function TriangleSpectralLab() {
  const [type, setType] = useState<'A'|'B'|'C'>('A');
  const [s, setS] = useState(0); // Normalized parameter [0, 1)

  const facts = useMemo(() => createFactMapFromHost({ pointsU: TRIANGLES[type], R: 1 }), [type]);

  const contour = useMemo(() => {
    // Piecewise-linear traversal based on vertices A, B, C
    const pts = [facts.coord_A as any as Point2D, facts.coord_B as any as Point2D, facts.coord_C as any as Point2D];
    // Simple discretization for contour
    return Array.from({ length: 64 }, (_, i) => {
      const t = i / 64;
      const idx = Math.floor(t * 3);
      const nextIdx = (idx + 1) % 3;
      const localT = (t * 3) % 1;
      return {
        x: pts[idx].x + (pts[nextIdx].x - pts[idx].x) * localT,
        y: pts[idx].y + (pts[nextIdx].y - pts[idx].y) * localT,
      };
    });
  }, [facts]);

  const passport = useMemo(() => computeFourierSpectralPassport(contour, 16), [contour]);

  return (
    <div className="p-4 border rounded">
      <h2 className="text-xl font-bold">Triangle Spectral Lab (TSL-01)</h2>
      <div className="flex gap-2 my-2">
        {Object.keys(TRIANGLES).map((t) => (
          <button key={t} onClick={() => setType(t as any)} className="px-2 py-1 border">{t}</button>
        ))}
      </div>
      <p>Current Type: {type}</p>
      <input type="range" min="0" max="1" step="0.01" value={s} onChange={(e) => setS(parseFloat(e.target.value))} />
      <div className="mt-4">
        <h3 className="font-bold">Spectral Amplitudes (First 5):</h3>
        {passport.amplitudes.slice(0, 5).map((a, i) => <span key={i}>{a.toFixed(2)} </span>)}
      </div>
    </div>
  );
}
