// src/experimental/spectral/FourierV2.ts
import { Point2D } from '../../kernel/types';

export interface SpectralPassportV2 {
  // Complex coefficients for k from -N/2 to N/2 - 1
  coefficients: { real: number; imag: number; freq: number }[];
  reconstructionError: number;
}

export function computeComplexDFT(contour: Point2D[]): { real: number; imag: number; freq: number }[] {
  const N = contour.length;
  const results = [];

  for (let k = -Math.floor(N / 2); k < Math.ceil(N / 2); k++) {
    let real = 0;
    let imag = 0;
    for (let n = 0; n < N; n++) {
      const angle = (2 * Math.PI * k * n) / N;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      
      // z[n] = contour[n].x + i * contour[n].y
      // Z[k] = sum z[n] * (cos - i*sin)
      // real = sum(x[n]*cos + y[n]*sin)
      // imag = sum(y[n]*cos - x[n]*sin)
      
      real += contour[n].x * cos + contour[n].y * sin;
      imag += contour[n].y * cos - contour[n].x * sin;
    }
    results.push({ real: real / N, imag: imag / N, freq: k });
  }
  return results;
}

export function computeSpectralPassportV2(
  contour: Point2D[],
  harmonics: number // Number of harmonics to keep on each side
): SpectralPassportV2 {
  const N = contour.length;
  const fullSpectrum = computeComplexDFT(contour);
  
  // Filter to keeping k in [-harmonics, harmonics]
  const spectrum = fullSpectrum.filter(c => Math.abs(c.freq) <= harmonics);

  // Reconstruction
  const reconstructionError = computeReconstructionError(contour, spectrum);

  return { coefficients: spectrum, reconstructionError };
}

function computeReconstructionError(contour: Point2D[], spectrum: { real: number; imag: number; freq: number }[]): number {
  const N = contour.length;
  const recon = contour.map((_, n) => {
    let x = 0;
    let y = 0;
    for (const coeff of spectrum) {
      const angle = (2 * Math.PI * coeff.freq * n) / N;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      
      // z_recon = sum Z[k] * exp(i * angle)
      // z_recon = (real + i*imag) * (cos + i*sin)
      // x_recon = real*cos - imag*sin
      // y_recon = real*sin + imag*cos
      
      x += coeff.real * cos - coeff.imag * sin;
      y += coeff.real * sin + coeff.imag * cos;
    }
    return { x, y };
  });

  const mse = contour.reduce((sum, p, i) => {
    const dx = p.x - recon[i].x;
    const dy = p.y - recon[i].y;
    return sum + (dx * dx + dy * dy);
  }, 0) / N;
  
  return Math.sqrt(mse);
}

export function computeMaxReconstructionError(contour: Point2D[], spectrum: { real: number; imag: number; freq: number }[]): number {
  const N = contour.length;
  const recon = contour.map((_, n) => {
    let x = 0;
    let y = 0;
    for (const coeff of spectrum) {
      const angle = (2 * Math.PI * coeff.freq * n) / N;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      x += coeff.real * cos - coeff.imag * sin;
      y += coeff.real * sin + coeff.imag * cos;
    }
    return { x, y };
  });

  let maxErr = 0;
  for (let i = 0; i < N; i++) {
    const dx = contour[i].x - recon[i].x;
    const dy = contour[i].y - recon[i].y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > maxErr) maxErr = dist;
  }
  
  return maxErr;
}
