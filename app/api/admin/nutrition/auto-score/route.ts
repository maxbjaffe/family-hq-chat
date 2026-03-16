import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getFamilyDataClient } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Auto-score nutrition foods using Claude + USDA guidelines
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

const SCORING_PROMPT = `You are a pediatric nutrition expert scoring foods for a children's nutrition tracker (ages 4-13).

Score each food on 5 axes using a 0-3 integer scale, based on USDA FoodData Central and Dietary Guidelines for Americans:

**Protein (grams per typical kid serving):**
- 0 = <2g | 1 = 2-7g | 2 = 8-15g | 3 = 16g+

**Veggie/Fiber (fiber grams + vegetable content):**
- 0 = <1g fiber, no veggie | 1 = 1-2g or partial veggie | 2 = 2-4g or full serving | 3 = 4g+ and vegetable-forward

**Sugar (added sugars per typical kid serving):**
- 0 = <2g added | 1 = 2-6g | 2 = 7-15g | 3 = 16g+

**Water (hydration contribution):**
- 0 = negligible | 1 = some moisture | 2 = high water content | 3 = primarily hydrating

**Vitamins (micronutrient density — vitamins A, C, iron, calcium):**
- 0 = minimal | 1 = 1-2 notable micronutrients | 2 = good variety | 3 = micronutrient-dense

Also suggest an appropriate emoji for the food.

Respond with ONLY valid JSON, no markdown. Format:
{
  "foods": [
    {
      "name": "Food Name",
      "emoji": "🍎",
      "protein_score": 0,
      "veggie_score": 0,
      "sugar_score": 0,
      "water_score": 0,
      "vitamin_score": 0,
      "reasoning": "Brief explanation of scoring"
    }
  ]
}`;

interface ScoredFood {
  name: string;
  emoji: string;
  protein_score: number;
  veggie_score: number;
  sugar_score: number;
  water_score: number;
  vitamin_score: number;
  reasoning: string;
}

// ---------------------------------------------------------------------------
// POST — Auto-score one or more foods and insert into DB
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { foods } = body as {
      foods: Array<{ name: string; meal_categories: string[] }>;
    };

    if (!foods || !Array.isArray(foods) || foods.length === 0) {
      return NextResponse.json(
        { error: "Provide an array of { name, meal_categories }" },
        { status: 400 }
      );
    }

    if (foods.length > 20) {
      return NextResponse.json(
        { error: "Maximum 20 foods per request" },
        { status: 400 }
      );
    }

    // Build the scoring request
    const foodList = foods
      .map((f, i) => `${i + 1}. ${f.name} (categories: ${f.meal_categories.join(", ")})`)
      .join("\n");

    const client = getClient();

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      temperature: 0,
      system: SCORING_PROMPT,
      messages: [
        {
          role: "user",
          content: `Score these foods for a children's nutrition tracker:\n\n${foodList}`,
        },
      ],
    });

    // Parse Claude's response
    const responseText =
      response.content[0].type === "text" ? response.content[0].text : "";

    let scored: ScoredFood[];
    try {
      const parsed = JSON.parse(responseText);
      scored = parsed.foods;
    } catch {
      console.error("[Auto-score] Failed to parse Claude response:", responseText);
      return NextResponse.json(
        { error: "Failed to parse AI scoring response" },
        { status: 500 }
      );
    }

    // Validate and clamp scores
    const clamp = (n: number) => Math.max(0, Math.min(3, Math.round(n)));

    const results: Array<{
      name: string;
      emoji: string;
      meal_categories: string[];
      protein_score: number;
      veggie_score: number;
      sugar_score: number;
      water_score: number;
      vitamin_score: number;
      reasoning: string;
      id?: string;
    }> = [];

    const supabase = getFamilyDataClient();

    for (let i = 0; i < scored.length; i++) {
      const s = scored[i];
      const original = foods[i];

      const foodData = {
        name: s.name || original.name,
        emoji: s.emoji || "🍽️",
        meal_categories: original.meal_categories,
        protein_score: clamp(s.protein_score),
        veggie_score: clamp(s.veggie_score),
        sugar_score: clamp(s.sugar_score),
        water_score: clamp(s.water_score),
        vitamin_score: clamp(s.vitamin_score),
      };

      const { data, error } = await supabase
        .from("nutrition_foods")
        .insert(foodData)
        .select("id")
        .single();

      if (error) {
        console.error(`[Auto-score] Insert failed for "${foodData.name}":`, error);
        results.push({
          ...foodData,
          reasoning: s.reasoning || "",
          id: undefined,
        });
      } else {
        results.push({
          ...foodData,
          reasoning: s.reasoning || "",
          id: data.id,
        });
      }
    }

    return NextResponse.json({
      scored: results,
      inserted: results.filter((r) => r.id).length,
      failed: results.filter((r) => !r.id).length,
    });
  } catch (error) {
    console.error("[Auto-score] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
