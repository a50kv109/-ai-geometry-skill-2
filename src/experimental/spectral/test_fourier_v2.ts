// src/experimental/spectral/test_fourier_v2.ts
import { computeComplexDFT, computeSpectralPassportV2, computeMaxReconstructionError } from './FourierV2';
import { Point2D } from '../../kernel/types';

function assert(condition: boolean, message: string) {
    if (!condition) {
        throw new Error(`Assertion Failed: ${message}`);
    }
}

function runTests() {
    const N = 64;
    console.log("Running TSL-06: FourierV2 Comprehensive Verification Suite");

    // --- 1. Constant Signal ---
    console.log("-> Testing constant signal...");
    const constantSignal = Array.from({ length: N }, () => ({ x: 1, y: 0 }));
    const dftConstant = computeComplexDFT(constantSignal);
    const z0 = dftConstant.find(c => c.freq === 0);
    assert(z0 !== undefined, "Z[0] coefficient exists");
    assert(Math.abs(z0!.real - 1) < 1e-6 && Math.abs(z0!.imag) < 1e-6, "Constant signal Z[0] != 1");
    assert(dftConstant.filter(c => c.freq !== 0).every(c => Math.abs(c.real) < 1e-6 && Math.abs(c.imag) < 1e-6), "Constant signal Z[k!=0] != 0");

    // --- 2. Single Complex Exponential ---
    console.log("-> Testing single complex exponential...");
    const k0 = 2;
    const posExpSignal = Array.from({ length: N }, (_, n) => {
        const angle = (2 * Math.PI * k0 * n) / N;
        return { x: Math.cos(angle), y: Math.sin(angle) };
    });
    const dftPosExp = computeComplexDFT(posExpSignal);
    const zk0 = dftPosExp.find(c => c.freq === k0);
    assert(zk0 !== undefined, `Z[${k0}] coefficient exists`);
    assert(Math.abs(zk0!.real - 1) < 1e-6 && Math.abs(zk0!.imag) < 1e-6, `Pos Exp Z[${k0}] != 1`);
    assert(dftPosExp.filter(c => c.freq !== k0).every(c => Math.abs(c.real) < 1e-6 && Math.abs(c.imag) < 1e-6), "Pos Exp other frequencies != 0");

    // --- 3. Full-Spectrum Reconstruction ---
    console.log("-> Testing full-spectrum reconstruction...");
    const circle = Array.from({ length: N }, (_, i) => ({
        x: Math.cos((2 * Math.PI * i) / N),
        y: Math.sin((2 * Math.PI * i) / N)
    }));
    const fullPassport = computeSpectralPassportV2(circle, Math.floor(N / 2));
    assert(fullPassport.reconstructionError < 1e-5, `Full spectrum reconstruction error too high: ${fullPassport.reconstructionError}`);
    const maxErrFull = computeMaxReconstructionError(circle, fullPassport.coefficients);
    assert(maxErrFull < 1e-5, `Full spectrum max error too high: ${maxErrFull}`);

    // --- 4. Truncation ---
    console.log("-> Testing truncation effects...");
    const multiHarmonicSignal = Array.from({ length: N }, (_, i) => {
        const angle = (2 * Math.PI * i) / N;
        return {
            x: Math.cos(angle) + 0.5 * Math.cos(5 * angle),
            y: Math.sin(angle) - 0.5 * Math.sin(5 * angle)
        };
    });
    const fullPassportMulti = computeSpectralPassportV2(multiHarmonicSignal, Math.floor(N / 2));
    const truncPassport = computeSpectralPassportV2(multiHarmonicSignal, 1); // filters out freq 5
    assert(truncPassport.reconstructionError >= fullPassportMulti.reconstructionError - 1e-12, "Truncation error should be >= full error");
    console.log(`Multi-harmonic Error (Full): ${fullPassportMulti.reconstructionError.toFixed(6)}`);
    console.log(`Multi-harmonic Error (Truncated h=1): ${truncPassport.reconstructionError.toFixed(6)}`);

    // --- 5. Rotation and Translation ---
    console.log("-> Testing rotation and translation invariance / sensitivity...");
    const passportCircle = computeSpectralPassportV2(circle, 2);
    // Rotation by 45 degrees
    const rotatedCircle = circle.map(p => ({
        x: p.x * Math.cos(Math.PI / 4) - p.y * Math.sin(Math.PI / 4),
        y: p.x * Math.sin(Math.PI / 4) + p.y * Math.cos(Math.PI / 4)
    }));
    const passportRotated = computeSpectralPassportV2(rotatedCircle, 2);
    assert(Math.abs(passportCircle.reconstructionError - passportRotated.reconstructionError) < 1e-5, "Rotation failed reconstruction error invariance");

    // Translation by (5, -3) -> Z[0] should change, but higher frequencies should remain invariant in amplitude
    const translatedCircle = circle.map(p => ({ x: p.x + 5, y: p.y - 3 }));
    const passportTranslated = computeSpectralPassportV2(translatedCircle, 2);
    const z0Trans = passportTranslated.coefficients.find(c => c.freq === 0);
    assert(z0Trans !== undefined, "Z[0] exists for translated circle");
    assert(Math.abs(z0Trans!.real - 5) < 1e-5 && Math.abs(z0Trans!.imag - (-3)) < 1e-5, "Translation shift reflected in Z[0]");

    // --- 6. Reversed Traversal ---
    console.log("-> Testing reversed traversal...");
    const reversedCircle = [...circle].reverse();
    const passportReversed = computeSpectralPassportV2(reversedCircle, 2);
    assert(Math.abs(passportCircle.reconstructionError - passportReversed.reconstructionError) < 1e-5, "Reverse traversal failed reconstruction error invariance");

    // --- 7. Boundary / Minimum N Cases ---
    console.log("-> Testing boundary cases (N=2)...");
    const minContour = [{ x: 0, y: 0 }, { x: 1, y: 1 }];
    const minPassport = computeSpectralPassportV2(minContour, 1);
    assert(minPassport.reconstructionError < 1e-5, "Min contour N=2 reconstruction failed");

    console.log("All FourierV2 comprehensive tests passed successfully!");
}

try {
    runTests();
} catch (e) {
    console.error(e);
    process.exit(1);
}
