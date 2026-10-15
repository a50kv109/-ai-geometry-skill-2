import { computeFourierSpectralPassport } from './Fourier';
import { Point2D } from '../../kernel/types';

function createCircle(n: number): Point2D[] {
    return Array.from({ length: n }, (_, i) => ({
        x: Math.cos((2 * Math.PI * i) / n),
        y: Math.sin((2 * Math.PI * i) / n),
    }));
}

function createTriangle(n: number): Point2D[] {
    const vertices = [
        { x: 1, y: 0 },
        { x: Math.cos((2 * Math.PI) / 3), y: Math.sin((2 * Math.PI) / 3) },
        { x: Math.cos((4 * Math.PI) / 3), y: Math.sin((4 * Math.PI) / 3) }
    ];
    return Array.from({ length: n }, (_, i) => {
        const t = (i * 3) / n;
        const idx = Math.floor(t);
        const nextIdx = (idx + 1) % 3;
        const localT = t - idx;
        return {
            x: vertices[idx].x + (vertices[nextIdx].x - vertices[idx].x) * localT,
            y: vertices[idx].y + (vertices[nextIdx].y - vertices[idx].y) * localT,
        };
    });
}

function runExperiment() {
    const N = 64;
    const contour = createTriangle(N);
    const h = 8;
    
    console.log("Stability Test (Triangle, Harmonics=8)");
    console.log("Test | RMS Error | Passport Amp 1");
    console.log("-----------------------------------");

    // Baseline
    console.log(`Baseline | ${computeFourierSpectralPassport(contour, h).reconstructionError.toFixed(4)} | ${computeFourierSpectralPassport(contour, h).amplitudes[1].toFixed(2)}`);

    // Rotation (approximate)
    const rotated = contour.map(p => ({ x: p.x * Math.cos(1) - p.y * Math.sin(1), y: p.x * Math.sin(1) + p.y * Math.cos(1) }));
    console.log(`Rotated  | ${computeFourierSpectralPassport(rotated, h).reconstructionError.toFixed(4)} | ${computeFourierSpectralPassport(rotated, h).amplitudes[1].toFixed(2)}`);

    // Reverse
    const reversed = [...contour].reverse();
    console.log(`Reversed | ${computeFourierSpectralPassport(reversed, h).reconstructionError.toFixed(4)} | ${computeFourierSpectralPassport(reversed, h).amplitudes[1].toFixed(2)}`);
}

runExperiment();
