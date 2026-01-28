/**
 * Family HQ Orchestrator
 * 
 * Top-level agent for Family HQ.
 * Persona: Warm, helpful family assistant.
 */

import { BaseAgent } from './base-agent';
import {
  AgentContext,
  AgentResult,
  AgentCapability,
  UserInput,
  AgentPersona,
} from './types';
import { SchoolAgent } from './domain/school-agent';
import { FamilyInfoAgent } from './domain/family-info-agent';
import { ChecklistAgent } from './domain/checklist-agent';
import { CalendarAgent } from './domain/calendar-agent';
import { GamesAgent } from './domain/games-agent';
import { HouseTasksAgent } from './domain/house-tasks-agent';

export class FamilyHQOrchestrator extends BaseAgent {
  name = 'FamilyHQOrchestrator';
  description = 'Main orchestrator for Family HQ - family command center';
  
  capabilities: AgentCapability[] = [
    {
      name: 'routing',
      description: 'Routes requests to the appropriate domain agent',
      triggers: [],
      examples: [
        "What's on the calendar today?",
        "Who is Riley's teacher?",
        'Play a game with me!',
      ],
    },
  ];

  private persona: AgentPersona = {
    name: 'Family Helper',
    style: 'warm',
    traits: [
      'friendly',
      'helpful',
      'patient',
      'encouraging',
      'family-focused',
    ],
  };

  constructor() {
    super();
    
    // Register domain agents
    this.registerSubAgent(new SchoolAgent());
    this.registerSubAgent(new FamilyInfoAgent());
    this.registerSubAgent(new ChecklistAgent());
    this.registerSubAgent(new CalendarAgent());
    this.registerSubAgent(new GamesAgent());
    this.registerSubAgent(new HouseTasksAgent());
  }

  async canHandle(): Promise<boolean> {
    return true;
  }

  async process(input: UserInput, context: AgentContext): Promise<AgentResult> {
    const startTime = Date.now();
    
    const enrichedContext: AgentContext = {
      ...context,
      persona: this.persona,
    };

    // Detect intent and route
    const routing = this.detectIntent(input);
    
    // Try to delegate to matching sub-agent
    const agentName = this.routeToAgent(routing.intent);
    if (agentName) {
      const result = await this.delegateToSubAgent(agentName, input, enrichedContext);
      if (result) {
        result.processingTimeMs = Date.now() - startTime;
        return result;
      }
    }

    // Try all agents for a match
    const delegatedResult = await this.delegateToMatchingSubAgent(input, enrichedContext);
    if (delegatedResult) {
      delegatedResult.processingTimeMs = Date.now() - startTime;
      return delegatedResult;
    }

    // Fallback: friendly response
    return this.handleGeneralQuery(input, enrichedContext, startTime);
  }

  private detectIntent(input: UserInput): { intent: string; confidence: number } {
    const text = input.text.toLowerCase();
    
    // School intents
    if (/school|teacher|homework|class|grade/i.test(text)) {
      return { intent: 'school', confidence: 0.9 };
    }
    
    // Family info intents
    if (/doctor|health|insurance|birthday|contact/i.test(text)) {
      return { intent: 'family_info', confidence: 0.85 };
    }
    
    // Checklist intents
    if (/checklist|routine|morning|bedtime|done|check/i.test(text)) {
      return { intent: 'checklist', confidence: 0.9 };
    }
    
    // Calendar intents
    if (/calendar|schedule|today|tomorrow|event|what.*happening/i.test(text)) {
      return { intent: 'calendar', confidence: 0.85 };
    }
    
    // Games intents
    if (/game|play|fun|quiz|fact|riddle/i.test(text)) {
      return { intent: 'games', confidence: 0.9 };
    }
    
    // House tasks intents
    if (/chore|task|house|clean|trash|dishes/i.test(text)) {
      return { intent: 'house_tasks', confidence: 0.85 };
    }
    
    return { intent: 'general', confidence: 0.5 };
  }

  private routeToAgent(intent: string): string | null {
    const routingMap: Record<string, string> = {
      school: 'SchoolAgent',
      family_info: 'FamilyInfoAgent',
      checklist: 'ChecklistAgent',
      calendar: 'CalendarAgent',
      games: 'GamesAgent',
      house_tasks: 'HouseTasksAgent',
    };
    
    return routingMap[intent] || null;
  }

  private async handleGeneralQuery(
    input: UserInput,
    context: AgentContext,
    startTime: number
  ): Promise<AgentResult> {
    const isKid = context.familyMember?.role === 'kid';
    
    const message = isKid
      ? "Hi there! 👋 I can help you with your checklist, tell you about today's schedule, or we can play a fun game! What would you like to do?"
      : "Hi! I can help with the family calendar, school info, house tasks, or the kids' checklists. What do you need?";

    return {
      success: true,
      message,
      confidence: 0.6,
      agentPath: [this.name],
      processingTimeMs: Date.now() - startTime,
    };
  }
}
