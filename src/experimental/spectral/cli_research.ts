// src/experimental/spectral/cli_research.ts
import { computeSpectralPassportV2, computeMaxReconstructionError } from './FourierV2';
import { Point2D } from '../../kernel/types';
import * as fs from 'fs';

// Helper to read contour from JSON file
// Expected format: { "contour": [{"x": number, "y": number}, ...], "harmonics": number }
function runResearchTask() {
    const args = process.argv.slice(2);
    if (args.length !== 1) {
        console.error("Usage: npx tsx cli_research.ts <input_json_path>");
        process.exit(1);
    }

    const inputData = JSON.parse(fs.readFileSync(args[0], 'utf-8'));
    const contour: Point2D[] = inputData.contour;
    const harmonics = inputData.harmonics;

    const passport = computeSpectralPassportV2(contour);
    
    // Truncate to desired harmonics
    const truncatedCoefficients = passport.coefficients.filter(c => Math.abs(c.freq) <= harmonics);
    
    const maxError = computeMaxReconstructionError(contour, truncatedCoefficients);

    const result = {
        harmonicsUsed: harmonics,
        maxError: maxError
    };

    console.log(JSON.stringify(result, null, 2));
}

runResearchTask();
