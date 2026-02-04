import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getCachedCalendarEvents, logAgentAnalytics } from '@/lib/supabase';
import { processWithAgents, shouldUseAgents } from '@/lib/agents/integration';

const BLOCKED_ACTIONS = [
  'create', 'add', 'make', 'new', 'delete', 'remove', 'update', 'change', 'edit', 'modify', 'complete', 'finish', 'mark'
];

// Read-only agent patterns (no state modification)
const READ_ONLY_PATTERNS = [
  /calendar|schedule|today|tomorrow|event|what.*happening/i,
  /teacher|school|class|homework/i,
  /doctor|health|birthday|allerg/i,
  /game|play|fun|quiz|fact|riddle/i,
];

function isReadOnlyQuery(message: string): boolean {
  const lower = message.toLowerCase();
  // Block if contains write actions
  if (BLOCKED_ACTIONS.some(a => lower.includes(a))) return false;
  // Check if matches read-only patterns
  return READ_ONLY_PATTERNS.some(p => p.test(lower));
}

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ response: 'Please ask a question!' });
    }

    // Check for blocked action words
    const lowerMessage = message.toLowerCase();
    const hasBlockedAction = BLOCKED_ACTIONS.some(action => lowerMessage.includes(action));

    if (hasBlockedAction && (lowerMessage.includes('task') || lowerMessage.includes('reminder') || lowerMessage.includes('todo'))) {
      return NextResponse.json({
        response: "I can only answer questions from the family home screen. To create or modify tasks, tap the Parents button to access the full dashboard."
      });
    }

    // Try agent system for read-only queries
    if (shouldUseAgents(message) && isReadOnlyQuery(message)) {
      try {
        const agentResult = await processWithAgents(message, 'guest');

        if (agentResult && agentResult.confidence >= 0.8) {
          // Log analytics
          logAgentAnalytics({
            app: 'family_hq',
            userId: 'guest',
            query: message,
            intentDetected: agentResult.agentPath?.[agentResult.agentPath.length - 1],
            agentPath: agentResult.agentPath?.join(' → '),
            agentHandled: true,
            confidence: agentResult.confidence,
            responseTimeMs: Date.now() - startTime,
          }).catch(() => {});

          return NextResponse.json({ response: agentResult.message });
        }
      } catch (agentError) {
        console.error('Quick chat agent error:', agentError);
        // Fall through to Claude
      }
    }

    // Get context data
    const events = await getCachedCalendarEvents(7);
    const eventContext = events.length > 0
      ? `Upcoming events:\n${events.slice(0, 10).map(e => `- ${e.title} on ${new Date(e.start_time).toLocaleDateString()}`).join('\n')}`
      : 'No upcoming events.';

    const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: `You are a helpful family assistant on a home dashboard. Answer questions briefly and friendly.
You can help with:
- Calendar/schedule questions
- Weather questions
- Family member info
- General family questions

Keep responses short (1-2 sentences). Be warm and helpful.

Context:
${eventContext}`,
      messages: [{ role: 'user', content: message }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : "I couldn't understand that.";

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error('Quick chat error:', error);
    return NextResponse.json({ response: "Sorry, I'm having trouble right now. Try again?" });
  }
}
