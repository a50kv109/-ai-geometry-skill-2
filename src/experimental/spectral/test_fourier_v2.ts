// src/experimental/spectral/test_fourier_v2.ts
import { computeComplexDFT, computeSpectralPassportV2 } from './FourierV2';
import { Point2D } from '../../kernel/types';

function assert(condition: boolean, message: string) {
    if (!condition) {
        throw new Error(`Assertion Failed: ${message}`);
    }
}

function runTests() {
    const N = 64;
    console.log("Running TSL-04C: FourierV2 Independent Validation");

    // --- 1. Independent Mathematical Checks ---
    console.log("-> Testing constant signal...");
    const constantSignal = Array.from({ length: N }, () => ({ x: 1, y: 0 }));
    const dftConstant = computeComplexDFT(constantSignal);
    const z0 = dftConstant.find(c => c.freq === 0);
    assert(Math.abs(z0!.real - 1) < 1e-6 && Math.abs(z0!.imag) < 1e-6, "Constant signal Z[0] != 1");
    assert(dftConstant.filter(c => c.freq !== 0).every(c => Math.abs(c.real) < 1e-6 && Math.abs(c.imag) < 1e-6), "Constant signal Z[k!=0] != 0");

    console.log("-> Testing complex exponential (pos freq)...");
    const k0 = 2;
    const posExpSignal = Array.from({ length: N }, (_, n) => {
        const angle = (2 * Math.PI * k0 * n) / N;
        return { x: Math.cos(angle), y: Math.sin(angle) };
    });
    const dftPosExp = computeComplexDFT(posExpSignal);
    const zk0 = dftPosExp.find(c => c.freq === k0);
    assert(Math.abs(zk0!.real - 1) < 1e-6 && Math.abs(zk0!.imag) < 1e-6, "Pos Exp Z[k0] != 1");
    assert(dftPosExp.filter(c => c.freq !== k0).every(c => Math.abs(c.real) < 1e-6 && Math.abs(c.imag) < 1e-6), "Pos Exp Z[k!=k0] != 0");

    // --- 2. Geometric Transformations ---
    console.log("-> Testing geometric transformations...");
    const circle = Array.from({ length: N }, (_, i) => ({
        x: Math.cos((2 * Math.PI * i) / N),
        y: Math.sin((2 * Math.PI * i) / N)
    }));

    // Rotation (should only affect phases, not reconstruction error)
    const rotatedCircle = circle.map(p => ({ x: -p.y, y: p.x })); // 90 deg rotation
    const passportCircle = computeSpectralPassportV2(circle, 2);
    const passportRotated = computeSpectralPassportV2(rotatedCircle, 2);
    assert(Math.abs(passportCircle.reconstructionError - passportRotated.reconstructionError) < 1e-6, "Rotation failed invariance");

    // Reversed Traversal (should be invariant in reconstruction error)
    const reversedCircle = [...circle].reverse();
    const passportReversed = computeSpectralPassportV2(reversedCircle, 2);
    assert(Math.abs(passportCircle.reconstructionError - passportReversed.reconstructionError) < 1e-6, "Reverse failed invariance");

    // --- 3. Truncation ---
    console.log("-> Testing truncation effects...");
    const triangle = Array.from({ length: N }, (_, i) => {
        const angle = (2 * Math.PI * i) / N;
        const x = Math.cos(angle);
        const y = Math.sin(angle);
        // Simple approximation
        return { x: x > 0.5 ? 1 : (x < -0.5 ? -1 : 0), y: y > 0.5 ? 1 : (y < -0.5 ? -1 : 0) };
    });
    const fullPassport = computeSpectralPassportV2(triangle, N / 2);
    const truncPassport = computeSpectralPassportV2(triangle, 2);
    console.log(`Triangle Error (Full): ${fullPassport.reconstructionError.toFixed(6)}`);
    console.log(`Triangle Error (Truncated h=2): ${truncPassport.reconstructionError.toFixed(6)}`);
    assert(truncPassport.reconstructionError >= fullPassport.reconstructionError, "Truncation error lower than full error");

    console.log("All tests passed!");
}

try {
    runTests();
} catch (e) {
    console.error(e);
    process.exit(1);
}
