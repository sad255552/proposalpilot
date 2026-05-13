# Experiment Decision

## Purpose
Convert experiment metrics into a clear kill, improve, scale, or continue decision. The decision should be grounded in predefined thresholds and avoid optimistic interpretation of weak data.

## Inputs
- `experiment`: Name, hypothesis, offer, channel, status, and launch date.
- `metrics`: Visitors, signups, paid customers, revenue, spend, conversion rates, and qualitative feedback.
- `thresholds`: Minimum traffic, signup rate, paid conversion, revenue, and timebox.
- `context`: Known tracking issues, seasonality, channel quality, and implementation notes.

## Output JSON Schema
```json
{
  "decision": "kill | improve | scale | continue",
  "confidence": "low | medium | high",
  "reason": "string",
  "metric_snapshot": {
    "visitors": 0,
    "signups": 0,
    "paid": 0,
    "revenue": 0,
    "spend": 0
  },
  "rules_triggered": ["string"],
  "next_actions": ["string"]
}
```

## Decision Rules
- `continue` when minimum sample size or timebox has not been reached and there is no safety issue.
- `kill` when traffic is sufficient and both signup and paid conversion miss the minimum thresholds.
- `improve` when there is meaningful interest but a specific bottleneck is visible, such as weak paid conversion after strong signup intent.
- `scale` only when paid conversion, revenue, and acquisition quality meet or exceed thresholds.
- Downgrade confidence when tracking is incomplete, channel quality is uncertain, or sample size is small.

## Examples
```json
{
  "decision": "improve",
  "confidence": "medium",
  "reason": "Signup rate cleared the threshold, but paid conversion is below target.",
  "metric_snapshot": {
    "visitors": 420,
    "signups": 48,
    "paid": 1,
    "revenue": 19,
    "spend": 0
  },
  "rules_triggered": ["signup_interest_present", "paid_conversion_weak"],
  "next_actions": ["Add proof to pricing section", "Test a lower-friction trial offer"]
}
```

## Safety Constraints
- Do not hide poor results or relabel failed experiments as wins.
- Do not recommend increasing spend without conversion evidence.
- Do not use sensitive attributes to decide targeting or exclusion.
- Do not continue experiments that create legal, security, or user-trust risk.

## How ABOS APIs Should Use It
- `/api/abos/decide` should apply this skill to every active experiment.
- `/api/abos/run` should include decision thresholds in generated metrics.
- `/api/abos/report` should summarize the latest triggered decision rules and next actions.
