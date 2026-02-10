# Macro Metrics Definition

## Purpose
This module provides market-regime decision support, not trade execution advice.

## Regime Score (0-100)
- `>=67`: Risk-On
- `34-66`: Balanced
- `<=33`: Defensive

## Factor Weights
- Trend: 25%
- Breadth: 20%
- Volatility: 20%
- Concentration: 15%
- Liquidity: 20%

## Data Quality Labels
- `fresh`: latest points are recent and complete
- `delayed`: recent data available but timestamp lag exists
- `stale`: outdated data
- `partial`: one or more key series/factors missing

## Confidence
Confidence starts from 1.0 and is reduced by:
- data quality penalty
- missing field penalties

## Notes
- Scores are heuristic and intended for comparative context.
- The module never emits buy/sell instructions.
