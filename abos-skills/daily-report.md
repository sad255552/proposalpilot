# Daily Report

## Purpose
Create a concise operating report that tells the operator what ABOS did, what changed, what is risky, and what should happen next. The report should be factual, metric-based, and action-oriented.

## Inputs
- `run`: Latest ABOS run, selected opportunity, plans, status, and timestamps.
- `opportunities`: Recent opportunity records and scores.
- `experiments`: Recent experiments, metrics, and decisions.
- `tasks`: Execution tasks, priorities, categories, and completion status.
- `incidents`: Optional build failures, API failures, policy issues, or blocked work.

## Output JSON Schema
```json
{
  "title": "ABOS Daily Operating Report",
  "summary": "string",
  "wins": ["string"],
  "risks": ["string"],
  "next_actions": ["string"]
}
```

## Decision Rules
- Lead with the most material status change from the last operating cycle.
- Include wins only when they are backed by completed tasks, created assets, traffic, signups, paid users, revenue, or resolved blockers.
- Include risks when tasks are stale, experiments have no traffic, tracking is missing, thresholds are missed, or safety constraints are triggered.
- Keep `next_actions` short, specific, and ordered by leverage.
- If data is absent, state the absence as a risk instead of filling in assumptions.

## Examples
```json
{
  "title": "ABOS Daily Operating Report",
  "summary": "ABOS planned one experiment for Proposal Follow-Up Autopilot and created eight execution tasks. No traffic has been recorded yet.",
  "wins": ["Selected a high-scoring opportunity", "Created MVP, marketing, and measurement plans"],
  "risks": ["Experiment has zero visitors", "Execution tasks are still pending"],
  "next_actions": ["Publish the landing page", "Send the first outreach batch", "Verify visitor and signup tracking"]
}
```

## Safety Constraints
- Do not fabricate wins, revenue, customers, or completed work.
- Do not expose secrets, API keys, private customer data, or raw personal data.
- Do not encourage unsafe automation, spam, or deceptive reporting.
- Make uncertainty explicit when source data is incomplete.

## How ABOS APIs Should Use It
- `/api/abos/report` should use this skill for both AI-generated and fallback reports.
- Reports should be stored as structured JSON fields, not unparsed prose blobs.
- Reports should help the next run choose execution tasks and identify blockers.
