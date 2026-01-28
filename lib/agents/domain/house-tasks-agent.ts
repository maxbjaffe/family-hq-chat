/**
 * House Tasks Agent
 * 
 * Manages family house tasks and chores.
 */

import { BaseAgent } from '../base-agent';
import { AgentContext, AgentResult, AgentCapability, UserInput, HouseTask } from '../types';

export class HouseTasksAgent extends BaseAgent {
  name = 'HouseTasksAgent';
  description = 'Manages house tasks and chores';

  capabilities: AgentCapability[] = [
    {
      name: 'view_tasks',
      description: 'View house tasks',
      triggers: ['chore', 'task', 'house task', 'to do'],
      examples: ['What house tasks are there?', 'Show chores'],
    },
    {
      name: 'complete_task',
      description: 'Mark task complete',
      triggers: ['done', 'finished', 'completed'],
      examples: ['I took out the trash', 'Dishes are done'],
    },
    {
      name: 'add_task',
      description: 'Add a new house task',
      triggers: ['add', 'new task', 'need to'],
      examples: ['Add "vacuum" to house tasks', 'We need to clean the garage'],
    },
  ];

  async process(input: UserInput, context: AgentContext): Promise<AgentResult> {
    const text = input.text.toLowerCase();

    if (/add|new task|need to/i.test(text)) {
      return this.addTask(input, context);
    }

    if (/done|finished|completed|took out|cleaned/i.test(text)) {
      return this.completeTask(input, context);
    }

    return this.showTasks(context);
  }

  private async showTasks(context: AgentContext): Promise<AgentResult> {
    // TODO: Integrate with house tasks from Todoist or dedicated table
    return this.success(
      { tasks: [] },
      "House tasks will appear here. Can integrate with Todoist or a dedicated table.",
      { confidence: 0.6 }
    );
  }

  private async addTask(input: UserInput, context: AgentContext): Promise<AgentResult> {
    const taskName = this.extractTaskName(input.text);
    
    if (!taskName) {
      return this.needsClarification(
        "What task would you like to add?",
        { confidence: 0.5 }
      );
    }

    // TODO: Create task in Todoist or house_tasks table
    return this.success(
      { added: true, taskName },
      `Added "${taskName}" to house tasks! ✓`,
      { confidence: 0.9 }
    );
  }

  private async completeTask(input: UserInput, context: AgentContext): Promise<AgentResult> {
    // TODO: Match and complete task
    return this.success(
      { completed: true },
      "Task marked complete! Great job! 🎉",
      { confidence: 0.8 }
    );
  }

  private extractTaskName(text: string): string | null {
    // Try to extract task from patterns like:
    // "add vacuum to house tasks"
    // "we need to clean the garage"
    // "new task: mow the lawn"
    
    const patterns = [
      /add\s+["']?([^"']+)["']?\s+to/i,
      /new task[:\s]+(.+)/i,
      /need to\s+(.+)/i,
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return null;
  }
}
