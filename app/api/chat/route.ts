import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { fetchAllFamilyData } from "@/lib/notion";
import { getSystemPrompt, getClient, ChatMessage } from "@/lib/claude";
import { tools } from "@/lib/tools";
import { executeTool } from "@/lib/tool-executor";
import { logChatEvent } from "@/lib/analytics";

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { message, history, user } = await request.json();

    if (!message || typeof message !== "string") {
      return Response.json({ error: "Message is required" }, { status: 400 });
    }

    // User context for filtering (null = guest/unauthenticated)
    const userContext = user ? {
      id: user.id as string,
      name: user.name as string,
      role: user.role as string,
    } : null;

    // Fetch family data for reference info tool
    const notionStartTime = Date.now();
    const notionData = await fetchAllFamilyData();
    const cachedNotion = Date.now() - notionStartTime < 50;

    // Build conversation history
    const conversationHistory: ChatMessage[] = [
      ...(Array.isArray(history) ? history.slice(-9) : []),
      { role: "user", content: message },
    ];

    // Build initial messages for Claude
    let processedMessages: Anthropic.MessageParam[] = conversationHistory.map(
      (msg, index) => {
        // First message includes context
        if (index === 0 && msg.role === "user") {
          return {
            role: "user" as const,
            content: `FAMILY DATA (for reference lookups):\n${notionData}\n\n---\n\nQUESTION: ${msg.content}`,
          };
        }
        return {
          role: msg.role as "user" | "assistant",
          content: msg.content,
        };
      }
    );

    const anthropic = getClient();
    const systemPrompt = getSystemPrompt();

    // Create SSE stream for agentic responses
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let continueLoop = true;

          while (continueLoop) {
            const response = await anthropic.messages.create({
              model: "claude-sonnet-4-20250514",
              max_tokens: 1500,
              system: systemPrompt,
              tools: tools,
              messages: processedMessages,
            });

            // Process the response
            for (const block of response.content) {
              if (block.type === "text") {
                // Stream text content
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: "text", content: block.text })}\n\n`
                  )
                );
              } else if (block.type === "tool_use") {
                // Notify client about tool call
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: "tool_call", tool: block.name })}\n\n`
                  )
                );

                // Execute tool with user context for filtering
                const result = await executeTool(
                  block.name,
                  block.input as Record<string, unknown>,
                  userContext
                );

                // Notify client about tool result
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: "tool_result", tool: block.name, result })}\n\n`
                  )
                );

                // Add assistant message and tool result to continue conversation
                processedMessages.push({
                  role: "assistant",
                  content: response.content,
                });
                processedMessages.push({
                  role: "user",
                  content: [
                    {
                      type: "tool_result",
                      tool_use_id: block.id,
                      content: JSON.stringify(result),
                    },
                  ],
                });
              }
            }

            // Check if we should continue (tool use requires another round)
            if (response.stop_reason === "tool_use") {
              continueLoop = true;
            } else {
              continueLoop = false;
            }
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();

          // Log analytics (fire and forget)
          const responseTime = Date.now() - startTime;
          logChatEvent({
            query: message,
            response_time_ms: responseTime,
            user_agent: request.headers.get("user-agent") || undefined,
            cached_notion: cachedNotion,
          }).catch(() => {});
        } catch (error) {
          console.error("Chat error:", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", message: String(error) })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json({ error: "Failed to process request" }, { status: 500 });
  }
}
