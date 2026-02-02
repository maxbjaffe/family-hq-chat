import { NextResponse } from "next/server";
import { getFamilyDataClient } from "@/lib/supabase";
import Anthropic from "@anthropic-ai/sdk";

// GET - Return stats for pet_content table
export async function GET() {
  try {
    const supabase = getFamilyDataClient();

    // Count facts
    const { count: factsCount, error: factsError } = await supabase
      .from("pet_content")
      .select("*", { count: "exact", head: true })
      .eq("type", "fact");

    if (factsError) {
      console.error("Error counting facts:", factsError);
      return NextResponse.json({ error: factsError.message }, { status: 500 });
    }

    // Count jokes
    const { count: jokesCount, error: jokesError } = await supabase
      .from("pet_content")
      .select("*", { count: "exact", head: true })
      .eq("type", "joke");

    if (jokesError) {
      console.error("Error counting jokes:", jokesError);
      return NextResponse.json({ error: jokesError.message }, { status: 500 });
    }

    return NextResponse.json({
      facts: factsCount ?? 0,
      jokes: jokesCount ?? 0,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Regenerate pet content using Claude API
export async function POST() {
  try {
    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "CLAUDE_API_KEY not configured" },
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    // Generate content using Claude
    const prompt = `Generate a JSON object with exactly:
- 50 fun facts about dogs, especially Golden Labradors (key: "facts", array of strings)
- 50 family-friendly animal jokes (key: "jokes", array of strings)

Requirements:
- Each fact should be 1-2 sentences, educational and engaging for kids
- Each joke should be 1-2 sentences, family-friendly and fun
- Mix in facts about Golden Labs with general dog facts
- Return ONLY valid JSON, no markdown code blocks or explanation

Example format:
{"facts": ["Golden Labradors were originally bred in Newfoundland to help fishermen.", ...], "jokes": ["Why did the dog sit in the shade? Because he didn't want to be a hot dog!", ...]}`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      messages: [{ role: "user", content: prompt }],
    });

    // Extract text from response
    const textContent = response.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json(
        { error: "No text content in Claude response" },
        { status: 500 }
      );
    }

    // Parse the JSON response
    let generatedContent: { facts: string[]; jokes: string[] };
    try {
      generatedContent = JSON.parse(textContent.text.trim());
    } catch {
      console.error("Failed to parse Claude response:", textContent.text);
      return NextResponse.json(
        { error: "Failed to parse Claude response as JSON" },
        { status: 500 }
      );
    }

    // Validate the response structure
    if (!Array.isArray(generatedContent.facts) || !Array.isArray(generatedContent.jokes)) {
      return NextResponse.json(
        { error: "Invalid response structure from Claude" },
        { status: 500 }
      );
    }

    const supabase = getFamilyDataClient();

    // Delete all existing content (use neq to delete all rows)
    const { error: deleteError } = await supabase
      .from("pet_content")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (deleteError) {
      console.error("Error deleting existing content:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Prepare rows for insertion
    const rows = [
      ...generatedContent.facts.map((content) => ({ type: "fact", content })),
      ...generatedContent.jokes.map((content) => ({ type: "joke", content })),
    ];

    // Insert new content
    const { error: insertError } = await supabase
      .from("pet_content")
      .insert(rows);

    if (insertError) {
      console.error("Error inserting content:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      facts: generatedContent.facts.length,
      jokes: generatedContent.jokes.length,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
