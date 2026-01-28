/**
 * Checklist Agent
 * 
 * Manages morning/evening checklists for kids.
 * Connected to: checklist_items, checklist_completions tables
 */

import { BaseAgent } from '../base-agent';
import { AgentContext, AgentResult, AgentCapability, UserInput } from '../types';
import { getChecklistForMember, toggleMemberChecklistItem, ChecklistItem } from '../../supabase';

export class ChecklistAgent extends BaseAgent {
  name = 'ChecklistAgent';
  description = 'Manages morning and evening checklists';

  capabilities: AgentCapability[] = [
    {
      name: 'view_checklist',
      description: 'View current checklist',
      triggers: ['checklist', 'routine', 'what do i need', 'tasks', 'morning', 'todo'],
      examples: ['Show my checklist', "What's left on my routine?", 'Morning checklist'],
    },
    {
      name: 'complete_item',
      description: 'Mark checklist item complete',
      triggers: ['done', 'finished', 'completed', 'check off', 'did'],
      examples: ['I brushed my teeth', 'Done with breakfast', 'Finished getting dressed'],
    },
  ];

  async process(input: UserInput, context: AgentContext): Promise<AgentResult> {
    const text = input.text.toLowerCase();
    
    // Need a family member to look up checklist
    if (!context.familyMember?.id) {
      return this.success(
        { items: [] },
        "I need to know who you are to show your checklist. Please select a family member.",
        { confidence: 0.5 }
      );
    }

    if (/done|finished|completed|check|did\s/i.test(text)) {
      return this.markComplete(input, context);
    }

    return this.showChecklist(context);
  }

  private async showChecklist(context: AgentContext): Promise<AgentResult> {
    try {
      const { items, stats } = await getChecklistForMember(context.familyMember!.id);
      const isKid = context.familyMember?.role === 'kid';

      if (items.length === 0) {
        const msg = isKid
          ? "No checklist set up yet! Ask Mom or Dad to add some items. 📋"
          : `No checklist items for ${context.familyMember?.name}. Add items in the admin panel.`;
        
        return this.success(
          { items: [], stats },
          msg,
          { confidence: 0.9 }
        );
      }

      // Format checklist
      const lines: string[] = [];
      
      if (isKid) {
        if (stats.isComplete) {
          lines.push(`🎉 **Amazing job, ${context.familyMember?.name}!** All done!`);
          lines.push('');
        } else {
          lines.push(`📋 **${context.familyMember?.name}'s Checklist** (${stats.completed}/${stats.total})`);
          lines.push('');
        }
      } else {
        lines.push(`📋 **Checklist** (${stats.completed}/${stats.total})`);
        lines.push('');
      }

      // Show incomplete items first
      const incomplete = items.filter(i => !i.isCompleted);
      const complete = items.filter(i => i.isCompleted);

      for (const item of incomplete) {
        const icon = item.icon || '⬜';
        lines.push(`${icon} ${item.title}`);
      }

      if (complete.length > 0 && incomplete.length > 0) {
        lines.push('');
        lines.push('✅ **Done:**');
      }
      
      for (const item of complete) {
        lines.push(`✅ ~~${item.title}~~`);
      }

      // Encouragement for kids
      if (isKid && !stats.isComplete && stats.remaining <= 3) {
        lines.push('');
        lines.push(`Almost there! Just ${stats.remaining} more to go! 💪`);
      }

      return this.success(
        { items, stats },
        lines.join('\n'),
        { confidence: 0.95 }
      );
    } catch (error) {
      return this.failure(`Couldn't load checklist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async markComplete(input: UserInput, context: AgentContext): Promise<AgentResult> {
    try {
      const { items } = await getChecklistForMember(context.familyMember!.id);
      const isKid = context.familyMember?.role === 'kid';
      
      // Find matching item
      const matchedItem = this.findMatchingItem(input.text, items);

      if (!matchedItem) {
        const itemNames = items.filter(i => !i.isCompleted).map(i => i.title).join(', ');
        return this.needsClarification(
          isKid 
            ? `Which one did you finish? I see: ${itemNames}`
            : `Which item? Available: ${itemNames}`,
          { confidence: 0.6 }
        );
      }

      if (matchedItem.isCompleted) {
        return this.success(
          { item: matchedItem, alreadyDone: true },
          isKid ? `${matchedItem.title} is already checked off! ✅` : `${matchedItem.title} already complete.`,
          { confidence: 0.9 }
        );
      }

      // Mark complete
      const success = await toggleMemberChecklistItem(
        context.familyMember!.id,
        matchedItem.id,
        false
      );

      if (!success) {
        return this.failure('Failed to mark item complete. Please try again.');
      }

      // Get updated stats
      const { stats } = await getChecklistForMember(context.familyMember!.id);

      // Celebration messages for kids
      let message: string;
      if (isKid) {
        if (stats.isComplete) {
          message = `✅ ${matchedItem.title} done!\n\n🎉 **ALL DONE!** Amazing job, ${context.familyMember?.name}! You finished everything! ⭐⭐⭐`;
        } else if (stats.remaining <= 2) {
          message = `✅ ${matchedItem.title} done! Great job! Only ${stats.remaining} more to go! 🌟`;
        } else {
          message = `✅ ${matchedItem.title} done! Keep it up! ⭐`;
        }
      } else {
        message = `✅ ${matchedItem.title} complete. (${stats.completed}/${stats.total})`;
      }

      return this.success(
        { item: matchedItem, stats, justCompleted: true },
        message,
        { confidence: 0.95 }
      );
    } catch (error) {
      return this.failure(`Couldn't update checklist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private findMatchingItem(
    text: string, 
    items: (ChecklistItem & { isCompleted: boolean })[]
  ): (ChecklistItem & { isCompleted: boolean }) | null {
    const lowerText = text.toLowerCase();

    // Try exact match first
    for (const item of items) {
      if (lowerText.includes(item.title.toLowerCase())) {
        return item;
      }
    }

    // Try keyword matching
    const keywords: Record<string, string[]> = {
      'teeth': ['brush teeth', 'teeth', 'brushing'],
      'bed': ['make bed', 'bed'],
      'dressed': ['get dressed', 'clothes', 'dressed'],
      'breakfast': ['breakfast', 'eat', 'eating'],
      'backpack': ['backpack', 'bag', 'pack'],
      'shoes': ['shoes', 'shoe'],
      'hair': ['hair', 'brush hair', 'comb'],
    };

    for (const item of items) {
      const itemLower = item.title.toLowerCase();
      for (const [key, matches] of Object.entries(keywords)) {
        if (matches.some(m => itemLower.includes(m)) && matches.some(m => lowerText.includes(m))) {
          return item;
        }
      }
    }

    return null;
  }
}
