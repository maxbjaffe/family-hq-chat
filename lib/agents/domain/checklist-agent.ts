/**
 * Checklist Agent
 * 
 * Manages morning/evening checklists for kids.
 */

import { BaseAgent } from '../base-agent';
import { AgentContext, AgentResult, AgentCapability, UserInput, ChecklistItem } from '../types';

export class ChecklistAgent extends BaseAgent {
  name = 'ChecklistAgent';
  description = 'Manages morning and evening checklists';

  capabilities: AgentCapability[] = [
    {
      name: 'view_checklist',
      description: 'View current checklist',
      triggers: ['checklist', 'routine', 'what do i need', 'tasks'],
      examples: ['Show my checklist', "What's left on my routine?"],
    },
    {
      name: 'complete_item',
      description: 'Mark checklist item complete',
      triggers: ['done', 'finished', 'completed', 'check off'],
      examples: ['I brushed my teeth', 'Done with breakfast'],
    },
  ];

  async process(input: UserInput, context: AgentContext): Promise<AgentResult> {
    const text = input.text.toLowerCase();
    const isKid = context.familyMember?.role === 'kid';

    if (/done|finished|completed|check/i.test(text)) {
      return this.markComplete(input, context);
    }

    return this.showChecklist(context);
  }

  private async showChecklist(context: AgentContext): Promise<AgentResult> {
    // TODO: Integrate with checklist_items and checklist_completions
    const isKid = context.familyMember?.role === 'kid';
    
    const message = isKid
      ? "Here's your checklist! 📋 (Coming soon - will show your morning/evening routine)"
      : "Checklist management coming soon. Will show kids' routines and completion status.";

    return this.success(
      { items: [] },
      message,
      { confidence: 0.6 }
    );
  }

  private async markComplete(input: UserInput, context: AgentContext): Promise<AgentResult> {
    // TODO: Integrate with checklist_completions
    const isKid = context.familyMember?.role === 'kid';
    
    const message = isKid
      ? "Great job! ⭐ Keep going!"
      : "Item marked complete.";

    return this.success(
      { completed: true },
      message,
      { confidence: 0.8 }
    );
  }
}
