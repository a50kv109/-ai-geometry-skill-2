# TSL-06 Comprehensive Agent Research Guide (Spectral Module V2)

## 1. Overview & Architectural Scope
The Spectral Geometric Passport module (`src/experimental/spectral/`) is an **experimental research and verification instrument**. It is **strictly isolated** from the public AI Geometry Skill v1.0.0 runtime and `HeadlessGeometrySession`.

- **Core Rule**: *"Spectral passport is a derived descriptor, not a geometric ground truth."*
- Spectral similarity does not guarantee geometric identity or vertex recovery without geometric landmark coordinates.

---

## 2. Mathematical Definition & Conventions (`FourierV2`)

### 2.1 Forward DFT (Complex Passport)
Given a contour of $N$ points represented as complex numbers $z[n] = x[n] + i \cdot y[n]$ for $n = 0, \dots, N-1$:
$$Z[k] = \frac{1}{N} \sum_{n=0}^{N-1} (x[n] + i y[n]) e^{-i \frac{2\pi k n}{N}}$$

- **Normalization**: Divided by $N$ in the forward transform so that $Z[0]$ represents the centroid (average coordinates).
- **Frequency Index Range ($k$)**: Ranges from $-\lfloor N/2 \rfloor$ to $\lceil N/2 \rceil - 1$ (two-sided spectrum).
  - $k = 0$: Centroid / DC component.
  - $k > 0$: Positive frequency components (counter-clockwise rotational harmonics).
  - $k < 0$: Negative frequency components (clockwise rotational harmonics).

### 2.2 Reconstruction & Error Metrics
Reconstructed points $\hat{z}[n]$ using a truncated spectrum of harmonics $|k| \le H$:
$$\hat{z}[n] = \sum_{|k| \le H} Z[k] e^{i \frac{2\pi k n}{N}}$$

- **RMS Error**: Root Mean Square distance between original points $z[n]$ and reconstructed points $\hat{z}[n]$.
- **Max Error**: Maximum Euclidean distance across all sample points $n$.
- **Note**: These metrics measure **discrete sample reconstruction fidelity**, not universal continuous shape equivalence or topological correctness.

---

## 3. Tool Usage & CLI Interface

### 3.1 Input Format (`task.json`)
The CLI expects a JSON file containing a `contour` array and an integer `harmonics` count:
```json
{
  "contour": [
    {"x": 1.0, "y": 0.0},
    {"x": 0.707, "y": 0.707},
    {"x": 0.0, "y": 1.0}
  ],
  "harmonics": 2
}
```
- **Validation Rules**:
  - `contour` must be an array of at least 2 points.
  - `x` and `y` must be finite numbers.
  - `harmonics` must be a non-negative integer $\le \lfloor N/2 \rfloor$.

### 3.2 Running the CLI
```bash
npx tsx src/experimental/spectral/cli_research.ts src/experimental/spectral/task.json
```

### 3.3 Expected JSON Output
```json
{
  "status": "success",
  "sampleCount": 8,
  "harmonicsRequested": 2,
  "harmonicsUsed": 5,
  "rmsError": 0.051234,
  "maxError": 0.123456,
  "coefficientCount": 5,
  "note": "Metrics (rmsError, maxError) measure discrete sample reconstruction fidelity, not universal geometric shape equivalence."
}
```

---

## 4. Running Spectral Tests
To execute the comprehensive validation suite for FourierV2:
```bash
npm run test:spectral
```
