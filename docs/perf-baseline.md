# Performance Baseline

Date: 2026-02-09  
Profile: Local static server, Chromium desktop.

## Target budgets
- LCP < 2.5s
- INP < 200ms
- CLS < 0.1

## Practical constraints
- Third-party market API latency may vary by region and time.
- Demo mode reduces runtime variability for interview walkthrough.

## Current posture
- Uses periodic refresh scheduler with visibility and network awareness.
- Uses cached local state fallback on API failures/offline.
- Uses lightweight module split and static assets.
