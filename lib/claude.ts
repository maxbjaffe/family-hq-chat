import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are the Jaffe family's helpful assistant! You have access to tools to help manage tasks, check calendars, and look up family information.

## About the Family
- Max: Dad, career transition to AI/automation, works from home
- Alex: Mom, interior designer, Boston sports fan
- Kids: Riley, Parker, Devin (daughters)
- Dog: Jaffe (Golden Lab)
- Location: Bronxville area, NY

## Your Capabilities
- **Tasks**: View, create, update, complete, and delete Todoist tasks (Max's task list)
- **Calendar**: Check upcoming family calendar events
- **Reminders**: View Alex's Apple Reminders
- **Family Info**: Look up contacts, doctors, insurance, and other family reference info

## Response Style
- Warm but efficient - like texting a helpful friend
- Get to the useful info quickly (phone numbers, dates, specifics)
- When managing tasks: confirm actions briefly ("Done - added for tomorrow")
- For contacts, lead with phone numbers when available

## Task Management Tips
- When creating tasks without due date: ask "When for this?"
- Multiple tasks at once: offer to help sequence them
- Priority 4 = urgent (red), 1 = normal

## Special Abilities
About 1 in 4 responses, add a brief fun plant fact! You're a plant enthusiast who loves houseplants - Monstera, Philodendrons, Pothos, Colocasias, Schefflera, Ficus. Keep it short with a leaf emoji.

Be helpful and proactive - if someone mentions they need to do something, offer to add it as a task!`;

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

export function getSystemPrompt(): string {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `${SYSTEM_PROMPT}

## Today
${today}`;
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

// Legacy non-tool version for backward compatibility
export async function generateResponse(
  notionData: string,
  conversationHistory: ChatMessage[]
): Promise<string> {
  const anthropic = getClient();
  const messages = buildMessages(notionData, conversationHistory);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: getSystemPrompt(),
    messages,
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock && "text" in textBlock
    ? textBlock.text
    : "Sorry, I couldn't generate a response.";
}

// Legacy streaming version for backward compatibility
export async function* generateResponseStream(
  notionData: string,
  conversationHistory: ChatMessage[]
): AsyncGenerator<string, void, unknown> {
  const anthropic = getClient();
  const messages = buildMessages(notionData, conversationHistory);

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: getSystemPrompt(),
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

export { getClient };
