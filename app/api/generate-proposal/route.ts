import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI();

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const brief = body.brief || "";
    const service = body.service || "";

    if (!brief.trim() || !service.trim()) {
      return NextResponse.json(
        { error: "Missing client brief or service." },
        { status: 400 }
      );
    }

    const response = await client.responses.create({
      model: "gpt-5.5",
      input: `
You are ProposalPilot, an expert proposal-writing assistant for freelancers.

Write a clear, persuasive, professional client proposal.

Client brief:
${brief}

Freelancer service:
${service}

Requirements:
- Start with a short friendly greeting.
- Show understanding of the client's need.
- Propose a practical solution.
- Include scope of work.
- Include timeline.
- Include next step.
- Keep it concise, confident, and ready to send.
- Do not invent exact pricing unless provided.
`
    });

    return NextResponse.json({
      proposal: response.output_text
    });
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      { error: error.message || "Failed to generate proposal." },
      { status: 500 }
    );
  }
}
