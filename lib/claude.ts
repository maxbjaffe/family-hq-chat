import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You're Alex and Max's friendly family assistant! You have access to all their family info - doctors, teachers, contacts, etc.

When answering:
- Be warm and casual, like texting a helpful friend
- Get straight to the useful info (phone numbers, addresses, etc.)
- Keep it brief but friendly
- If you don't have the info, just say so nicely
- For contacts, always lead with the phone number when available
- Mention which kid(s) something relates to when relevant

Think quick text message, not formal letter!`;

function getClient() {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    throw new Error("CLAUDE_API_KEY not configured");
  }
  return new Anthropic({ apiKey });
}

export async function generateResponse(
  notionData: string,
  userQuestion: string
): Promise<string> {
  const anthropic = getClient();

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `FAMILY DATA:\n${notionData}\n\n---\n\nQUESTION: ${userQuestion}`,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  return textBlock && "text" in textBlock
    ? textBlock.text
    : "Sorry, I couldn't generate a response.";
}
