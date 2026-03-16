import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getFamilyDataClient } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Suggest missing foods that kids commonly eat
// ---------------------------------------------------------------------------

let anthropicClient: Anthropic | null = null;

function getClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) throw new Error("CLAUDE_API_KEY not configured");
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

export async function GET() {
  try {
    const supabase = getFamilyDataClient();

    // Get all existing food names
    const { data: existing, error } = await supabase
      .from("nutrition_foods")
      .select("name");

    if (error) {
      console.error("[Suggest] Error fetching existing foods:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const existingNames = (existing || []).map((f) => f.name.toLowerCase());

    const client = getClient();

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      temperature: 0.3,
      system: `You suggest common foods that American children ages 4-13 eat regularly. Focus on foods kids actually eat at home, school, and restaurants. Include a mix of healthy and less healthy options to be realistic.

Respond with ONLY valid JSON, no markdown. Format:
{
  "suggestions": [
    { "name": "Food Name", "meal_categories": ["breakfast", "lunch", "dinner", "snack", "drink"] }
  ]
}

Meal categories must be from: breakfast, lunch, dinner, snack, drink. A food can belong to multiple categories.`,
      messages: [
        {
          role: "user",
          content: `Here are the foods already in our database:\n${existingNames.join(", ")}\n\nSuggest 25 common kid foods that are NOT in this list. Think about foods kids eat at school cafeterias, fast food restaurants, family dinners, after-school snacks, birthday parties, and sports events. Include regional favorites, ethnic foods, and seasonal items.`,
        },
      ],
    });

    const responseText =
      response.content[0].type === "text" ? response.content[0].text : "";

    let suggestions: Array<{ name: string; meal_categories: string[] }>;
    try {
      const parsed = JSON.parse(responseText);
      suggestions = parsed.suggestions;
    } catch {
      console.error("[Suggest] Failed to parse response:", responseText);
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    // Filter out any that snuck through as duplicates
    const filtered = suggestions.filter(
      (s) => !existingNames.includes(s.name.toLowerCase())
    );

    return NextResponse.json({ suggestions: filtered });
  } catch (error) {
    console.error("[Suggest] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
