import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getCachedCalendarEvents } from '@/lib/supabase';

const BLOCKED_ACTIONS = [
  'create', 'add', 'make', 'new', 'delete', 'remove', 'update', 'change', 'edit', 'modify', 'complete', 'finish', 'mark'
];

export async function POST(request: Request) {
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
