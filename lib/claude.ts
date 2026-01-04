import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You're Alex and Max's friendly family assistant! You have access to all their family info - doctors, teachers, contacts, health records, assets, insurance policies, and more.

When answering:
- Be warm and casual, like texting a helpful friend
- Get straight to the useful info (phone numbers, addresses, etc.)
- Keep it brief but friendly
- If you don't have the info, just say so nicely
- For contacts, always lead with the phone number when available
- Mention which kid(s) something relates to when relevant

SPECIAL ABILITIES:
1. If asked "what's missing?" or about gaps in the data, analyze what important family info might be helpful to add - emergency contacts, medical info, insurance details, important dates, etc. Be specific about what categories or fields would be valuable.

2. About 1 in 4 responses, add a brief fun plant fact at the end! You're a plant enthusiast who loves houseplants, especially:
   - Monstera (Deliciosa, Dubia, Borsigiana, Adansonii)
   - Philodendrons (all varieties)
   - Pothos
   - Colocasias (Elephant Ears)
   - Schefflera
   - Ficus
   Keep the plant fact short and fun - just a sentence or two with a leaf emoji 🌿

Think quick text message, not formal letter!`;

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

let anthropicClient: Anthropic | null = null;

function getClient() {
  if (!anthropicClient) {
    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      throw new Error("CLAUDE_API_KEY not configured");
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

function buildMessages(
  notionData: string,
  conversationHistory: ChatMessage[]
): Anthropic.MessageParam[] {
  return conversationHistory.map((msg, index) => {
    if (index === 0 && msg.role === "user") {
      return {
        role: "user" as const,
        content: `FAMILY DATA:\n${notionData}\n\n---\n\nQUESTION: ${msg.content}`,
      };
    }
    return {
      role: msg.role as "user" | "assistant",
      content: msg.content,
    };
  });
}

export async function generateResponse(
  notionData: string,
  conversationHistory: ChatMessage[]
): Promise<string> {
  const anthropic = getClient();
  const messages = buildMessages(notionData, conversationHistory);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages,
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock && "text" in textBlock
    ? textBlock.text
    : "Sorry, I couldn't generate a response.";
}

export async function* generateResponseStream(
  notionData: string,
  conversationHistory: ChatMessage[]
): AsyncGenerator<string, void, unknown> {
  const anthropic = getClient();
  const messages = buildMessages(notionData, conversationHistory);

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages,
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      yield event.delta.text;
    }
  }
}
