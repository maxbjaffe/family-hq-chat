import { NextRequest, NextResponse } from 'next/server';
import { processWithAgents } from '@/lib/agents/integration';
import { getFamilyMemberById } from '@/lib/supabase';
import { getKidVoiceSystemPrompt } from '@/lib/jarvis/kid-voice-prompt';
import Anthropic from '@anthropic-ai/sdk';
import { FamilyMember } from '@/lib/agents/types';

export async function POST(req: NextRequest) {
  try {
    const { command, memberId } = await req.json();

    if (!command || typeof command !== 'string') {
      return NextResponse.json({ error: 'command is required' }, { status: 400 });
    }

    // Look up family member if provided
    let memberName = 'kiddo';
    let agentFamilyMember: FamilyMember | undefined;

    if (memberId) {
      const member = await getFamilyMemberById(memberId);
      if (member) {
        memberName = member.name;
        agentFamilyMember = {
          id: member.id,
          name: member.name,
          displayName: member.name,
          role: member.role as 'admin' | 'adult' | 'kid' | 'pet',
        };
      }
    }

    // Try agent system first (ChecklistAgent, CalendarAgent, GamesAgent, etc.)
    const agentResult = await processWithAgents(
      command,
      memberId || 'kiosk-guest',
      undefined,
      agentFamilyMember
    );

    if (agentResult && agentResult.confidence >= 0.7 && agentResult.message) {
      // Strip markdown for TTS
      const plainText = stripMarkdown(agentResult.message);
      return NextResponse.json({
        response: plainText,
        source: 'agent',
        agentPath: agentResult.agentPath,
        data: agentResult.data,
      });
    }

    // Fallback to Haiku for general questions
    const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      system: getKidVoiceSystemPrompt(memberName),
      messages: [{ role: 'user', content: command }],
    });

    const responseText =
      message.content[0].type === 'text'
        ? message.content[0].text
        : "Sorry, I didn't catch that. Try again?";

    return NextResponse.json({
      response: responseText,
      source: 'haiku',
    });
  } catch (error) {
    console.error('Jarvis command error:', error);
    return NextResponse.json(
      { response: "Oops, something went wrong. Try again?" },
      { status: 200 } // Return 200 so client can still speak the error message
    );
  }
}

/**
 * Strip markdown formatting for clean TTS output.
 */
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')   // bold
    .replace(/~~(.*?)~~/g, '$1')        // strikethrough
    .replace(/^#+\s+/gm, '')            // headings
    .replace(/^[-*]\s+/gm, '')          // bullet points
    .replace(/\n{3,}/g, '\n\n')         // excess newlines
    .trim();
}
