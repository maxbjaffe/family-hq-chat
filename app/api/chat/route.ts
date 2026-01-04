import { NextRequest, NextResponse } from "next/server";
import { fetchAllFamilyData } from "@/lib/notion";
import { generateResponseStream, ChatMessage } from "@/lib/claude";
import { logChatEvent } from "@/lib/analytics";

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { message, history } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Fetch all family data from Notion (with caching)
    const notionStartTime = Date.now();
    const formattedData = await fetchAllFamilyData();
    const cachedNotion = Date.now() - notionStartTime < 50; // If < 50ms, it was cached

    // Build conversation history (limit to last 10 messages to control token usage)
    const conversationHistory: ChatMessage[] = [
      ...(Array.isArray(history) ? history.slice(-9) : []),
      { role: "user", content: message },
    ];

    // Create a streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of generateResponseStream(
            formattedData,
            conversationHistory
          )) {
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();

          // Log analytics after stream completes (fire and forget)
          const responseTime = Date.now() - startTime;
          logChatEvent({
            query: message,
            response_time_ms: responseTime,
            user_agent: request.headers.get("user-agent") || undefined,
            cached_notion: cachedNotion,
          }).catch(() => {});
        } catch (error) {
          console.error("Streaming error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
