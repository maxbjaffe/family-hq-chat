/**
 * House Tasks Agent
 *
 * Manages family house tasks and chores via Todoist.
 * Connected to: Todoist "House Tasks" project
 */

import { BaseAgent } from '../base-agent';
import { AgentContext, AgentResult, AgentCapability, UserInput } from '../types';
import { getTasks, getProjects, createTask, completeTask, TodoistTask } from '../../todoist';

const HOUSE_TASKS_PROJECT_NAME = 'House Tasks';

export class HouseTasksAgent extends BaseAgent {
  name = 'HouseTasksAgent';
  description = 'Manages house tasks and chores';

  capabilities: AgentCapability[] = [
    {
      name: 'view_tasks',
      description: 'View house tasks',
      triggers: ['chore', 'task', 'house task', 'to do', 'chores'],
      examples: ['What house tasks are there?', 'Show chores', 'House tasks'],
    },
    {
      name: 'complete_task',
      description: 'Mark task complete',
      triggers: ['done', 'finished', 'completed', 'took out', 'cleaned'],
      examples: ['I took out the trash', 'Dishes are done', 'Finished vacuuming'],
    },
    {
      name: 'add_task',
      description: 'Add a new house task',
      triggers: ['add', 'new task', 'need to', 'remind'],
      examples: ['Add vacuum to house tasks', 'We need to clean the garage'],
    },
  ];

  private projectId: string | null = null;

  async process(input: UserInput, context: AgentContext): Promise<AgentResult> {
    const text = input.text.toLowerCase();

    // Ensure we have the project ID
    await this.ensureProjectId();

    if (/add|new (house\s+)?task|need to|remind/i.test(text)) {
      return this.addTask(input, context);
    }

    if (/done|finished|completed|took out|cleaned|did the/i.test(text)) {
      return this.completeTaskByName(input, context);
    }

    return this.showTasks(context);
  }

  private async ensureProjectId(): Promise<void> {
    if (this.projectId) return;

    try {
      const projects = await getProjects();
      const houseProject = projects.find(
        p => p.name.toLowerCase() === HOUSE_TASKS_PROJECT_NAME.toLowerCase()
      );
      if (houseProject) {
        this.projectId = houseProject.id;
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  }

  private async showTasks(context: AgentContext): Promise<AgentResult> {
    try {
      const tasks = await this.getHouseTasks();

      if (tasks.length === 0) {
        const isKid = context.familyMember?.role === 'kid';
        return this.success(
          { tasks: [] },
          isKid
            ? "🏠 No house tasks right now! The house is in good shape! 🎉"
            : "🏠 **House Tasks**\n\nNo tasks in the list. Add one with \"add [task] to house tasks\".",
          { confidence: 0.9 }
        );
      }

      const isKid = context.familyMember?.role === 'kid';
      const taskLines = tasks.map((t, i) => {
        const priority = t.priority > 2 ? '❗' : '';
        const due = t.due?.string ? ` (${t.due.string})` : '';
        return `${i + 1}. ${priority}${t.content}${due}`;
      });

      const message = isKid
        ? `🏠 Here are the house tasks:\n\n${taskLines.join('\n')}\n\nSay "I did [task]" when you finish one!`
        : `🏠 **House Tasks** (${tasks.length})\n\n${taskLines.join('\n')}`;

      return this.success(
        { tasks: tasks.map(t => ({ id: t.id, content: t.content, due: t.due?.string })) },
        message,
        { confidence: 0.95 }
      );
    } catch (error) {
      return this.failure(`Couldn't load house tasks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async addTask(input: UserInput, context: AgentContext): Promise<AgentResult> {
    const taskName = this.extractTaskName(input.text);

    if (!taskName) {
      return this.needsClarification(
        "What task would you like to add? Try: \"add vacuum to house tasks\"",
        { confidence: 0.5 }
      );
    }

    if (!this.projectId) {
      return this.failure("House Tasks project not found in Todoist. Please create it first.");
    }

    try {
      const newTask = await createTask({
        content: taskName,
        project_id: this.projectId,
      });

      const isKid = context.familyMember?.role === 'kid';
      return this.success(
        { added: true, task: { id: newTask.id, content: newTask.content } },
        isKid
          ? `✅ Added "${taskName}" to house tasks!`
          : `✅ Added to house tasks: **${taskName}**`,
        { confidence: 0.95 }
      );
    } catch (error) {
      return this.failure(`Couldn't add task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async completeTaskByName(input: UserInput, context: AgentContext): Promise<AgentResult> {
    const tasks = await this.getHouseTasks();

    if (tasks.length === 0) {
      return this.success(
        { completed: false },
        "No house tasks to complete right now!",
        { confidence: 0.7 }
      );
    }

    // Try to match the task by fuzzy name matching
    const matchedTask = this.findMatchingTask(input.text, tasks);

    if (!matchedTask) {
      const taskList = tasks.map(t => t.content).join(', ');
      return this.needsClarification(
        `Which task did you complete? Current tasks: ${taskList}`,
        { confidence: 0.5 }
      );
    }

    try {
      await completeTask(matchedTask.id);

      const isKid = context.familyMember?.role === 'kid';
      return this.success(
        { completed: true, task: { id: matchedTask.id, content: matchedTask.content } },
        isKid
          ? `🎉 Great job! "${matchedTask.content}" is done! You're a superstar! ⭐`
          : `✅ Completed: **${matchedTask.content}**`,
        { confidence: 0.95 }
      );
    } catch (error) {
      return this.failure(`Couldn't complete task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getHouseTasks(): Promise<TodoistTask[]> {
    if (!this.projectId) return [];

    try {
      const allTasks = await getTasks();
      return allTasks.filter(t => t.project_id === this.projectId && !t.is_completed);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      return [];
    }
  }

  private findMatchingTask(text: string, tasks: TodoistTask[]): TodoistTask | null {
    const lowerText = text.toLowerCase();

    // Common task keywords to strip
    const stripWords = ['done', 'finished', 'completed', 'did', 'the', 'i', 'just', 'took', 'out', 'with'];

    // Extract potential task name from input
    const words = lowerText
      .split(/\s+/)
      .filter(w => !stripWords.includes(w) && w.length > 2);

    // Try exact match first
    for (const task of tasks) {
      const taskLower = task.content.toLowerCase();
      if (lowerText.includes(taskLower)) {
        return task;
      }
    }

    // Try word-based matching
    for (const task of tasks) {
      const taskWords = task.content.toLowerCase().split(/\s+/);
      const matchCount = words.filter(w => taskWords.some(tw => tw.includes(w) || w.includes(tw))).length;

      if (matchCount >= 1) {
        return task;
      }
    }

    // Try partial match on main keywords
    const taskKeywords = ['trash', 'dishes', 'vacuum', 'laundry', 'clean', 'mow', 'lawn', 'garbage', 'recycling', 'bathroom', 'kitchen'];
    for (const keyword of taskKeywords) {
      if (lowerText.includes(keyword)) {
        const match = tasks.find(t => t.content.toLowerCase().includes(keyword));
        if (match) return match;
      }
    }

    return null;
  }

  private extractTaskName(text: string): string | null {
    // Try to extract task from patterns like:
    // "add vacuum to house tasks"
    // "we need to clean the garage"
    // "new task: mow the lawn"
    // "add: take out trash"
    // "remind me to do laundry"

    const patterns = [
      /add\s+["']?([^"']+?)["']?\s+to\s+(house\s+)?tasks?/i,
      /add[:\s]+["']?(.+?)["']?$/i,
      /new\s+(house\s+)?task[:\s]+(.+)/i,
      /need\s+to\s+(.+)/i,
      /remind\s+(me\s+)?to\s+(.+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        // Get the last captured group (the task name)
        const taskName = match[match.length - 1]?.trim();
        if (taskName && taskName.length > 2) {
          return taskName;
        }
      }
    }

    // If no pattern matches, try to extract after "add"
    const addMatch = text.match(/add\s+(.+)/i);
    if (addMatch) {
      let taskName = addMatch[1].trim();
      // Remove trailing "to house tasks" if present
      taskName = taskName.replace(/\s+to\s+(house\s+)?tasks?\s*$/i, '');
      if (taskName.length > 2) {
        return taskName;
      }
    }

    return null;
  }
}
