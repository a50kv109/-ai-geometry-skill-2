# AI Geometry Skill — TSL-01 Spectral Integration Passport Hierarchy

This document defines the structured passport hierarchy for the TSL-01 spectral analysis capability integrated into the AI Geometry Skill.

## 1. Skill Capability Passport (SCP)
- **ID**: `SCP-TSL-01`
- **Capabilities**: Geometric object passport request, directed contour traversal, spectral passport calculation, spectral passport comparison.
- **Status**: Experimental (Sandbox only).

## 2. Canonical Geometry Object Passport (CGOP)
- **Reference**: Link to SSOT canonical object ID.
- **Data**: Vertices, sides, angles, area, circumcircle parameters.

## 3. Experiment Run Passport (ERP)
- **ID**: UUID.
- **Data**: Traversal direction, starting vertex, harmonic count, sampling method, normalization method, algorithm version.

## 4. Result and Evidence Passport (REP)
- **ID**: UUID.
- **Links**: ERP ID, CGOP ID.
- **Data**: Fourier amplitudes, phases, reconstruction error, verification checks, limitations.
