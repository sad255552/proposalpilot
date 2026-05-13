# MVP Builder

## Purpose
Turn a selected opportunity into a small, shippable MVP plan that can validate demand and payment intent quickly. The plan should minimize scope while preserving the core promise.

## Inputs
- `selected_opportunity`: Title, pain, target user, solution, channels, score, and risks.
- `available_stack`: Frameworks, database, payments, AI APIs, hosting, and existing product modules.
- `constraints`: Timebox, budget, engineering capacity, compliance limits, and launch deadline.
- `success_metrics`: Visitor, signup, paid, revenue, and qualitative feedback targets.

## Output JSON Schema
```json
{
  "mvp_plan": {
    "product_name": "string",
    "one_line_promise": "string",
    "target_user": "string",
    "core_features": ["string"],
    "technical_stack": ["string"],
    "build_steps": ["string"],
    "codex_prompt": "string"
  }
}
```

## Decision Rules
- Limit the MVP to the smallest workflow that demonstrates the paid promise.
- Prefer proven local stack components already present in the repo.
- Include payment or strong purchase-intent validation when the business model depends on willingness to pay.
- Defer dashboards, complex onboarding, analytics depth, and broad integrations unless essential to validation.
- Define build steps that can become execution tasks.

## Examples
```json
{
  "mvp_plan": {
    "product_name": "FollowPilot",
    "one_line_promise": "Recover quiet proposal leads with polite automated follow-ups.",
    "target_user": "Freelancers sending custom proposals",
    "core_features": ["Proposal status tracker", "Follow-up sequence generator", "Signup and checkout flow"],
    "technical_stack": ["Next.js", "Supabase", "Stripe", "OpenAI"],
    "build_steps": ["Create landing page", "Add waitlist and checkout intent capture", "Generate follow-up sequence preview"],
    "codex_prompt": "Build a focused Next.js MVP for FollowPilot with landing, signup, and checkout validation."
  }
}
```

## Safety Constraints
- Do not build features that require unauthorized access, private scraping, or deceptive automation.
- Do not overclaim product capabilities that are not implemented.
- Do not ask Codex to store secrets in client code or logs.
- Include compliance review steps for regulated domains.

## How ABOS APIs Should Use It
- `/api/abos/run` should use this skill after opportunity selection to create `mvp_plan`.
- Generated `build_steps` should feed `abos_tasks` with clear build category tasks.
- `codex_prompt` should be specific enough for implementation without requiring hidden context.
