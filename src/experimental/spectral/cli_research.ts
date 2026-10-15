// src/experimental/spectral/cli_research.ts
import { computeSpectralPassportV2, computeMaxReconstructionError } from './FourierV2';
import { Point2D } from '../../kernel/types';
import * as fs from 'fs';

function runResearchTask() {
    const args = process.argv.slice(2);
    if (args.length !== 1) {
        console.error(JSON.stringify({ status: "error", message: "Usage: npx tsx src/experimental/spectral/cli_research.ts <input_json_path>" }, null, 2));
        process.exit(1);
    }

    let inputData: any;
    try {
        const fileContent = fs.readFileSync(args[0], 'utf-8');
        inputData = JSON.parse(fileContent);
    } catch (err: any) {
        console.error(JSON.stringify({ status: "error", message: `Failed to read or parse JSON input: ${err.message}` }, null, 2));
        process.exit(1);
    }

    if (!inputData || !Array.isArray(inputData.contour)) {
        console.error(JSON.stringify({ status: "error", message: "Invalid input: 'contour' must be an array of Point2D objects." }, null, 2));
        process.exit(1);
    }

    const contour: Point2D[] = inputData.contour;
    if (contour.length < 2) {
        console.error(JSON.stringify({ status: "error", message: "Invalid input: 'contour' must contain at least 2 points." }, null, 2));
        process.exit(1);
    }

    for (let i = 0; i < contour.length; i++) {
        const p = contour[i];
        if (!p || typeof p.x !== 'number' || !Number.isFinite(p.x) || typeof p.y !== 'number' || !Number.isFinite(p.y)) {
            console.error(JSON.stringify({ status: "error", message: `Invalid point at index ${i}: coordinates must be finite numbers.` }, null, 2));
            process.exit(1);
        }
    }

    const harmonics = inputData.harmonics;
    if (typeof harmonics !== 'number' || !Number.isInteger(harmonics) || harmonics < 0) {
        console.error(JSON.stringify({ status: "error", message: "Invalid input: 'harmonics' must be a non-negative integer." }, null, 2));
        process.exit(1);
    }

    const maxPossibleHarmonics = Math.floor(contour.length / 2);
    if (harmonics > maxPossibleHarmonics) {
        console.error(JSON.stringify({ status: "error", message: `Invalid input: 'harmonics' (${harmonics}) exceeds max possible for N=${contour.length} (max ${maxPossibleHarmonics}).` }, null, 2));
        process.exit(1);
    }

    try {
        const passport = computeSpectralPassportV2(contour, harmonics);
        const truncatedCoefficients = passport.coefficients;
        const maxError = computeMaxReconstructionError(contour, truncatedCoefficients);

        const result = {
            status: "success",
            sampleCount: contour.length,
            harmonicsRequested: harmonics,
            harmonicsUsed: truncatedCoefficients.length,
            rmsError: passport.reconstructionError,
            maxError: maxError,
            coefficientCount: truncatedCoefficients.length,
            note: "Metrics (rmsError, maxError) measure discrete sample reconstruction fidelity, not universal geometric shape equivalence."
        };

        console.log(JSON.stringify(result, null, 2));
    } catch (err: any) {
        console.error(JSON.stringify({ status: "error", message: `Computation failed: ${err.message}` }, null, 2));
        process.exit(1);
    }
}

runResearchTask();
