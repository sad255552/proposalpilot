# Marketing Launch

## Purpose
Create an ethical launch plan for the selected MVP that reaches the target user, tests positioning, and produces measurable demand signals.

## Inputs
- `mvp_plan`: Product name, promise, target user, core features, and offer.
- `opportunity`: Pain, target market, differentiation, channels, and risks.
- `constraints`: Budget, allowed channels, brand voice, compliance rules, and launch timebox.
- `proof`: Existing examples, testimonials, demos, screenshots, metrics, or lack of proof.

## Output JSON Schema
```json
{
  "marketing_plan": {
    "positioning": "string",
    "offer": "string",
    "channels": ["string"],
    "launch_posts": ["string"],
    "cold_email": "string",
    "marketing_prompt": "string"
  }
}
```

## Decision Rules
- Position around a concrete pain, audience, and measurable outcome.
- Use channels where the target user can be reached without deception or spam.
- If proof is missing, use transparent language such as beta, pilot, or early access.
- Include one primary offer and one clear call to action.
- Make launch copy specific, short, and testable.

## Examples
```json
{
  "marketing_plan": {
    "positioning": "For freelancers who lose deals after sending proposals, FollowPilot keeps follow-up consistent without turning them into CRM operators.",
    "offer": "Join the beta and get the first month for $19 if it helps recover one stalled proposal.",
    "channels": ["X", "freelancer communities", "cold email"],
    "launch_posts": ["Freelancers: how many proposals go quiet after the first send? I am testing a tiny follow-up autopilot built for that exact gap."],
    "cold_email": "Subject: quick question about proposal follow-up\n\nHi {{name}}, I noticed you offer {{service}}. I am testing a small tool that helps freelancers follow up after proposals without managing a full CRM. Open to a 10-minute look?",
    "marketing_prompt": "Write launch copy for FollowPilot focused on stalled proposals, honest beta status, and a single signup CTA."
  }
}
```

## Safety Constraints
- Do not fabricate testimonials, customer counts, revenue, endorsements, urgency, or scarcity.
- Do not recommend mass unsolicited messaging, evasion of platform rules, or manipulative targeting.
- Do not make regulated performance claims without evidence and review.
- Respect opt-outs and channel norms.

## How ABOS APIs Should Use It
- `/api/abos/run` should use this skill to generate `marketing_plan`.
- Marketing tasks should be created from launch posts, outreach, and channel setup.
- `/api/abos/report` should flag missing traffic or channel execution as launch risks.
