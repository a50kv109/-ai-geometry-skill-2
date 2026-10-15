# AI Geometry Skill — Hybrid Spectral-Geometric Passport (TSL-01/TSL-02)

## Overview

The AI Geometry Skill has been extended to support experimental spectral analysis of 2D geometric configurations. This capability is designated as **TSL-01 (Triangle Spectral Lab)** and its verification/reconstruction methodology as **TSL-02 (Hybrid Spectral-Geometric Passport)**.

This hybrid approach bridges high-level spectral analysis (contour shape descriptor) with precise geometric identity preservation (vertex landmarks).

## Hybrid Passport Architecture

The **Hybrid Spectral-Geometric Passport** is defined as:
`HybridPassport = SpectralPassport + Landmark[] + PassportMetadata`

### 1. SpectralPassport (Derived Shape Descriptor)
A Fourier-based representation of the contour traversal:
- `amplitudes`: Array of harmonic magnitudes.
- `phases`: Array of harmonic phases.
- `reconstructionError`: RMS error of the spectral contour approximation.

### 2. Landmark[] (Identity-Preserving Geometric Data)
Precise reference points (vertices or specific landmarks) linked to the canonical object:
- `id`: Landmark identifier.
- `t`: Parameterization index along the contour traversal.
- `coordinates`: Optional precise `Point2D` (required for exact vertex recovery).

### 3. PassportMetadata (Provenance & Trust)
Enforces traceability and authoritativeness:
- `id`: Unique passport ID.
- `sampleCount` / `harmonics`: Analysis parameters.
- `canonicalObject`: Link to SSOT canonical object ID.
- `spectralAnalysisRun`: Analysis trace identifier.
- `algorithmVersion`: Implementation version.
- `isAuthoritative`: Flag for Zero-Trust verification.

## Integration & Boundary

The integration adheres strictly to the existing AI Geometry Skill epistemic and architectural boundaries:
- **Separation**: The spectral passport is an *experimental shape descriptor* and does not replace the canonical geometric SSOT.
- **Verification**: Exact vertex reconstruction is achieved exclusively through the inclusion of coordinate-bearing landmarks, not through spectral approximation alone.
- **Zero-Trust**: All analysis results in a `HybridPassport` must be treated as untrusted hypotheses by receiving agents, subjected to local independent verification against the canonical geometry kernel.

*Reference Implementation*: `src/experimental/spectral/Fourier.ts` and `scripts/tsl-02-hybrid-experiment.ts`.
