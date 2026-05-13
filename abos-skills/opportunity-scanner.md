# Opportunity Scanner

## Purpose
Find and rank original SaaS opportunities from market signals, user pain, workflow gaps, and monetizable urgency. The scanner should produce opportunities that can be tested quickly without copying proprietary products or depending on unverifiable claims.

## Inputs
- `market_signals`: Array of trends, complaints, communities, search themes, or customer requests.
- `constraints`: Budget, build capacity, legal limits, audience access, and timebox.
- `existing_assets`: Current code, distribution channels, domain expertise, integrations, and data.
- `excluded_areas`: Markets, tactics, or product categories ABOS must avoid.

## Output JSON Schema
```json
{
  "opportunities": [
    {
      "title": "string",
      "target_user": "string",
      "pain": "string",
      "proposed_solution": "string",
      "why_now": "string",
      "differentiation": "string",
      "monetization": "string",
      "channels": ["string"],
      "risks": ["string"],
      "validation_test": "string",
      "score": 0
    }
  ]
}
```

## Decision Rules
- Score from 0 to 100 using pain intensity, reachable audience, speed to MVP, willingness to pay, defensibility, and safety.
- Prefer opportunities with a clear buyer, repeatable workflow, and measurable outcome.
- Reject ideas that require scraping private data, impersonation, regulated advice without review, or copying a competitor's proprietary workflow.
- If evidence is weak, mark the risk and lower the score instead of inventing support.
- Select a diverse set across audiences and channels unless the input explicitly narrows the market.

## Examples
```json
{
  "opportunities": [
    {
      "title": "Proposal Follow-Up Autopilot for Freelancers",
      "target_user": "Solo service providers sending custom proposals",
      "pain": "Prospects go quiet after receiving proposals and manual follow-up is inconsistent.",
      "proposed_solution": "A small tool that schedules polite follow-ups and tracks proposal engagement.",
      "why_now": "More independent operators are selling high-ticket services remotely.",
      "differentiation": "Focused on post-proposal recovery instead of broad CRM management.",
      "monetization": "$19/month subscription",
      "channels": ["freelancer communities", "cold email", "creator partnerships"],
      "risks": ["Email deliverability", "crowded CRM category"],
      "validation_test": "Landing page plus 30 direct outreach messages to proposal-heavy freelancers.",
      "score": 82
    }
  ]
}
```

## Safety Constraints
- Do not recommend deception, spam, fake scarcity, fabricated testimonials, or fake traction.
- Do not target vulnerable users with exploitative offers.
- Do not advise collection of sensitive personal data unless essential and consent-based.
- Include uncertainty when evidence is incomplete.

## How ABOS APIs Should Use It
- `/api/abos/scan` should use this skill to generate and score opportunities before storage.
- `/api/abos/run` should use the highest-scoring safe opportunity as the planning input.
- Store enough rationale to audit why an opportunity was selected or rejected.
