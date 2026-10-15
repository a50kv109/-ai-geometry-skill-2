# TSL-05/TSL-06 Research Task: Harmonic Sensitivity & Limitations

## Objective
Analyze the relationship between harmonic count and discrete sample reconstruction error for standardized contours (e.g., circles, polygons), while explicitly accounting for spectral truncation limits.

## Procedure
1. Prepare input contours with sufficient sampling ($N \ge 16$), such as `task_circle.json`.
2. Execute the CLI tool across multiple harmonic thresholds $h \in \{1, 2, 4, 8\}$.
3. Record `rmsError` and `maxError`.
4. Observe that truncation smooths sharp corners and high-frequency details.

## Epistemic Guardrails for Agents
1. **Truncation != Vertex Recovery**: Truncating the Fourier spectrum filters out high frequencies. Sharp vertices (e.g., triangle corners) require high harmonic orders; low-order truncations result in Gibbs-like smoothing and corner rounding.
2. **Landmarks are Independent**: Exact vertex coordinates must be preserved via explicit geometric landmarks (`Landmark.coordinates`), not deduced solely from truncated spectral coefficients.
3. **SSOT Separation**: Experimental spectral passports are secondary descriptors. Final validation of geometric proofs must always run through `HeadlessGeometrySession` and kernel derivation paths.
