// src/experimental/spectral/Fourier.ts
import { Point2D } from '../../kernel/types';

export interface SpectralPassport {
  amplitudes: number[];
  phases: number[];
  reconstructionError: number;
  fftX: number[];
  fftY: number[];
}

export interface Landmark {
  id: string;
  t: number;
  coordinates?: Point2D;
}

export interface PassportMetadata {
  id: string;
  sampleCount: number;
  harmonics: number;
  traversal: string;
  canonicalObject?: string;
  spectralAnalysisRun?: string;
  parameterization?: string;
  algorithmVersion?: string;
  isAuthoritative?: boolean;
}

export interface HybridPassport {
  spectral: SpectralPassport;
  landmarks?: Landmark[];
  metadata: PassportMetadata;
  canonicalReference?: string;
}

export function computeFourierSpectralPassport(
  contour: Point2D[],
  harmonics: number
): SpectralPassport {
  const N = contour.length;
  const fftX = new Array(harmonics).fill(0).map((_, k) => {
    let sum = 0;
    for (let n = 0; n < N; n++) {
      sum += contour[n].x * Math.cos((2 * Math.PI * k * n) / N) + 
             contour[n].y * Math.sin((2 * Math.PI * k * n) / N);
    }
    return sum / N;
  });

  const fftY = new Array(harmonics).fill(0).map((_, k) => {
    let sum = 0;
    for (let n = 0; n < N; n++) {
      sum += contour[n].y * Math.cos((2 * Math.PI * k * n) / N) - 
             contour[n].x * Math.sin((2 * Math.PI * k * n) / N);
    }
    return sum / N;
  });

  const amplitudes = fftX.map((x, k) => Math.sqrt(x * x + fftY[k] * fftY[k]));
  const phases = fftX.map((x, k) => Math.atan2(fftY[k], x));

  // Compute reconstruction error (RMS)
  const xRecon = new Array(N).fill(0);
  const yRecon = new Array(N).fill(0);
  for (let n = 0; n < N; n++) {
    for (let k = 0; k < harmonics; k++) {
      const angle = (2 * Math.PI * k * n) / N;
      xRecon[n] += (fftX[k] * Math.cos(angle) - fftY[k] * Math.sin(angle));
      yRecon[n] += (fftY[k] * Math.cos(angle) + fftX[k] * Math.sin(angle));
    }
  }
  const mse = contour.reduce((sum, p, i) => {
    const dx = p.x - xRecon[i];
    const dy = p.y - yRecon[i];
    return sum + (dx * dx + dy * dy);
  }, 0) / N;
  const reconstructionError = Math.sqrt(mse);

  return { amplitudes, phases, reconstructionError, fftX, fftY };
}
