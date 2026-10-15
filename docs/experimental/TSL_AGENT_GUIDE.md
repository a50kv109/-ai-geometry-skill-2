# TSL-05 Agent Research Guide

## Overview
This guide provides instructions for using the `FourierV2` spectral analysis tool for research into geometric contour identification.

## Usage
The research tool is a CLI wrapper around `FourierV2`.

### 1. Prepare Input
Create a JSON file (e.g., `task.json`) defining the contour:
```json
{
  "contour": [
    {"x": 0, "y": 0},
    {"x": 10, "y": 0},
    {"x": 5, "y": 8.66}
  ],
  "harmonics": 2
}
```

### 2. Run Analysis
```bash
npx tsx src/experimental/spectral/cli_research.ts task.json
```

## Research Objectives
- Evaluate how `maxError` changes with the number of harmonics for different shapes.
- Determine the minimum number of harmonics required to distinguish between similar geometric forms.
