import { NextRequest, NextResponse } from "next/server";
import { fetchPeopleAndProviders, formatPeopleForContext } from "@/lib/notion";
import { generateResponse, ChatMessage } from "@/lib/claude";

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Fetch data from Notion
    const people = await fetchPeopleAndProviders();
    const formattedData = formatPeopleForContext(people);

    // Build conversation history (limit to last 10 messages to control token usage)
    const conversationHistory: ChatMessage[] = [
      ...(Array.isArray(history) ? history.slice(-9) : []),
      { role: "user", content: message },
    ];

    // Generate response with Claude
    const response = await generateResponse(formattedData, conversationHistory);

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
