import { NextResponse } from "next/server";
import OpenAI from "openai";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

function safeJson(text: string) {
  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleaned);
}

export async function POST() {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY in Vercel environment." },
        { status: 500 }
      );
    }

    const prompt = `
Generate 5 ethical SaaS/AI micro-product opportunities.

Do not copy proprietary products.
Do not suggest spam or illegal tactics.
Focus on freelancers, agencies, creators, ecommerce, local businesses, and small teams.

Return valid JSON only:
[
  {
    "title": "...",
    "audience": "...",
    "pain": "...",
    "product_angle": "...",
    "monetization": "...",
    "acquisition_channels": ["...", "..."],
    "build_complexity": 1,
    "revenue_potential": 1,
    "speed_to_mvp": 1,
    "originality_score": 1,
    "total_score": 1
  }
]
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    });

    const raw = completion.choices[0]?.message?.content || "[]";
    const ideas = safeJson(raw);

    const inserted = [];

    for (const idea of ideas) {
      const buildComplexity = Number(idea.build_complexity || 50);
      const revenuePotential = Number(idea.revenue_potential || 50);
      const speedToMvp = Number(idea.speed_to_mvp || 50);
      const originalityScore = Number(idea.originality_score || 50);

      let totalScore =
        (revenuePotential + speedToMvp + originalityScore + 70) / 4;

      if (buildComplexity > 70) totalScore -= 10;

      const { data, error } = await supabase
        .from("abos_opportunities")
        .insert({
          title: idea.title,
          audience: idea.audience,
          pain: idea.pain,
          product_angle: idea.product_angle,
          monetization: idea.monetization,
          acquisition_channels: idea.acquisition_channels || [],
          build_complexity: buildComplexity,
          revenue_potential: revenuePotential,
          speed_to_mvp: speedToMvp,
          originality_score: originalityScore,
          total_score: Math.round(Number(idea.total_score || totalScore)),
          score: Math.round(Number(idea.total_score || totalScore)),
          source: "ai_scan"
        })
        .select()
        .single();

      if (error) throw error;
      inserted.push(data);
    }

    return NextResponse.json({ opportunities: inserted });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to scan market." },
      { status: 500 }
    );
  }
}
