# DECISION_CASES

## Case 1: Conservative posture
- Target: BTC 30%, ETH 20%, Stablecoins 50%.
- Stress preset: Risk-Off.
- Decision focus: minimize drawdown and preserve liquidity.
- What to watch: Top1 concentration, stablecoin floor, downside delta.

## Case 2: Balanced posture
- Target: BTC 40%, ETH 30%, Stablecoins 20%, Others 10%.
- Stress preset: Liquidity Squeeze.
- Decision focus: avoid concentration while retaining upside participation.
- What to watch: drift, trade filter, attribution 7d contributors.

## Case 3: Aggressive posture
- Target: BTC 45%, ETH 35%, Others 15%, Stablecoins 5%.
- Stress preset: Crypto Rally + custom downside override.
- Decision focus: upside capture with explicit downside visibility.
- What to watch: scenario delta, top loss drivers, volatility contribution.

## Notes
- Outputs are decision-support signals, not trading instructions.
- All cases should be re-evaluated after market refresh.

## Case 4: News-driven risk adjustment
- Trigger: news module flips to `stale/partial` with defensive regime hint.
- Workflow: review AI key risks -> open Stress preset `Risk-Off` -> compare 24h/7d attribution.
- Decision focus: reduce over-concentration before macro event windows.
- What to watch: confidence drop, repeated affected assets, and mismatch vs macro regime.
