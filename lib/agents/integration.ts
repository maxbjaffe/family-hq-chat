/**
 * Agent Integration Layer for Family HQ
 * 
 * Provides integration between the orchestrator agents and the chat API.
 */

import { FamilyHQOrchestrator } from './orchestrator';
import { AgentContext, AgentResult, UserInput, FamilyMember } from './types';

// Singleton orchestrator instance
let orchestrator: FamilyHQOrchestrator | null = null;

export function getOrchestrator(): FamilyHQOrchestrator {
  if (!orchestrator) {
    orchestrator = new FamilyHQOrchestrator();
  }
  return orchestrator;
}

/**
 * Process a user message through the agent hierarchy.
 * Returns agent-processed result or null if agents can't handle it.
 */
export async function processWithAgents(
  message: string,
  userId: string = 'guest',
  sessionId?: string,
  familyMember?: FamilyMember
): Promise<AgentResult | null> {
  const orch = getOrchestrator();
  
  const input: UserInput = {
    text: message,
  };

  const context: AgentContext = {
    userId,
    sessionId: sessionId || generateSessionId(),
    timestamp: new Date(),
    familyMember,
  };

  try {
    const result = await orch.process(input, context);
    
    // Return result if confidence is high enough
    if (result.confidence >= 0.7) {
      return result;
    }
    
    // Low confidence - let the main Claude handler take over
    return null;
  } catch (error) {
    console.error('Agent processing error:', error);
    return null;
  }
}

/**
 * Check if a message should be handled by agents vs. full Claude.
 */
export function shouldUseAgents(message: string): boolean {
  const text = message.toLowerCase();
  
  // High-confidence agent triggers for Family HQ
  const agentTriggers = [
    // School triggers
    /who'?s?\s+\w+'?s?\s+teacher/i,
    /teacher\s+for\s+\w+/i,
    /school\s+(event|update|announcement)/i,
    /any(thing)?\s+from\s+school/i,
    
    // Checklist triggers
    /my\s+checklist/i,
    /morning\s+(routine|checklist)/i,
    /bedtime\s+(routine|checklist)/i,
    /what\s+(do\s+)?i\s+(have\s+to|need\s+to)\s+do/i,
    
    // Calendar triggers
    /what'?s?\s+(on\s+)?(the\s+)?calendar/i,
    /what'?s?\s+(on\s+)?today/i,
    /what'?s?\s+happening/i,
    /family\s+calendar/i,
    /today'?s?\s+(schedule|events|calendar)/i,
    /any(thing)?\s+on\s+(the\s+)?calendar/i,
    /show\s+(me\s+)?(the\s+)?calendar/i,
    /calendar\s+for\s+today/i,
    
    // Games triggers
    /play\s+(a\s+)?game/i,
    /fun\s+fact/i,
    /quiz\s+me/i,
    /riddle/i,
    
    // House tasks triggers
    /house\s+(task|chore)/i,
    /who'?s?\s+(doing|responsible)/i,
    /chore\s+list/i,
  ];

  return agentTriggers.some(trigger => trigger.test(text));
}

/**
 * Format agent result for chat response.
 */
export function formatAgentResponse(result: AgentResult): {
  message: string;
  data?: unknown;
  suggestedFollowUp?: string;
  agentPath: string[];
} {
  return {
    message: result.message || 'Here you go!',
    data: result.data,
    suggestedFollowUp: result.suggestedFollowUp,
    agentPath: result.agentPath,
  };
}

/**
 * Build agent context with family member info.
 */
export function buildAgentContext(
  userId: string,
  sessionId: string,
  familyMember?: FamilyMember
): AgentContext {
  return {
    userId,
    sessionId,
    timestamp: new Date(),
    familyMember,
  };
}

/**
 * Generate a simple session ID.
 */
function generateSessionId(): string {
  return `fhq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
