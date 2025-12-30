import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are a helpful family assistant with access to our family's organized information.

The user will ask questions about family contacts, providers, doctors, teachers, insurance, devices, etc.
Use the provided data to give accurate, concise answers.

Guidelines:
- Be direct and conversational
- Include relevant details (phone, address, notes) without being verbose
- If the information isn't in the data, say so clearly
- For contacts, always include phone number if available
- Reference which family member something relates to when relevant
- Keep responses brief - this is a quick lookup tool, not a conversation`;

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
