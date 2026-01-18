import Anthropic from '@anthropic-ai/sdk';

export const tools: Anthropic.Tool[] = [
  {
    name: 'get_tasks',
    description: 'Refresh and get the current list of Todoist tasks. Use this to get updated task data.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'create_task',
    description: 'Create a new task in Todoist. Returns the created task.',
    input_schema: {
      type: 'object' as const,
      properties: {
        content: {
          type: 'string',
          description: 'The task content/title',
        },
        description: {
          type: 'string',
          description: 'Optional task description',
        },
        due_string: {
          type: 'string',
          description: 'Natural language due date like "tomorrow", "next monday", "jan 20"',
        },
        priority: {
          type: 'number',
          description: 'Priority 1-4. 1=normal, 4=urgent',
        },
      },
      required: ['content'],
    },
  },
  {
    name: 'update_task',
    description: 'Update an existing task. Can change content, due date, or priority.',
    input_schema: {
      type: 'object' as const,
      properties: {
        task_id: {
          type: 'string',
          description: 'The Todoist task ID to update',
        },
        content: {
          type: 'string',
          description: 'New task content/title',
        },
        due_string: {
          type: 'string',
          description: 'New due date in natural language',
        },
        priority: {
          type: 'number',
          description: 'New priority 1-4',
        },
      },
      required: ['task_id'],
    },
  },
  {
    name: 'complete_task',
    description: 'Mark a task as complete/done.',
    input_schema: {
      type: 'object' as const,
      properties: {
        task_id: {
          type: 'string',
          description: 'The Todoist task ID to complete',
        },
      },
      required: ['task_id'],
    },
  },
  {
    name: 'delete_task',
    description: 'Delete a task from Todoist permanently.',
    input_schema: {
      type: 'object' as const,
      properties: {
        task_id: {
          type: 'string',
          description: 'The Todoist task ID to delete',
        },
      },
      required: ['task_id'],
    },
  },
  {
    name: 'get_family_info',
    description: 'Get family reference information from Notion - doctors, contacts, insurance, etc. Use when user asks about family contacts or info.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_calendar',
    description: 'Get upcoming calendar events for the family.',
    input_schema: {
      type: 'object' as const,
      properties: {
        days: {
          type: 'number',
          description: 'Number of days to look ahead (default 7)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_reminders',
    description: "Get Alex's Apple Reminders.",
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_priorities',
    description: 'Get weekly priorities. Returns current week by default, or previous week if specified.',
    input_schema: {
      type: 'object' as const,
      properties: {
        previous_week: {
          type: 'boolean',
          description: "Set true to get last week's priorities instead of current week",
        },
      },
      required: [],
    },
  },
  {
    name: 'set_priorities',
    description: 'Set priorities for the current week. Replaces any existing priorities.',
    input_schema: {
      type: 'object' as const,
      properties: {
        priorities: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of 1-5 priority strings for the week',
        },
      },
      required: ['priorities'],
    },
  },
  {
    name: 'update_priority',
    description: 'Update a single priority by its number (1-5).',
    input_schema: {
      type: 'object' as const,
      properties: {
        priority_number: {
          type: 'integer',
          description: 'Which priority to update (1-5)',
        },
        content: {
          type: 'string',
          description: 'New priority text',
        },
      },
      required: ['priority_number', 'content'],
    },
  },
  {
    name: 'get_free_time',
    description: 'Analyze calendar to find free time slots during working hours. Use when the user asks about availability, wants to schedule something, or asks "when do I have time for..."',
    input_schema: {
      type: 'object' as const,
      properties: {
        days: {
          type: 'number',
          description: 'Number of days to analyze (default 7)',
        },
        min_duration: {
          type: 'number',
          description: 'Minimum slot duration in minutes (default 30)',
        },
      },
      required: [],
    },
  },
  {
    name: 'suggest_time_block',
    description: 'Suggest when to schedule a task based on its estimated duration and calendar availability. Use when user wants to find time for a specific task.',
    input_schema: {
      type: 'object' as const,
      properties: {
        task_description: {
          type: 'string',
          description: 'What the user needs to do',
        },
        estimated_minutes: {
          type: 'number',
          description: 'Estimated time needed in minutes. If not provided, will estimate based on task type.',
        },
        prefer_morning: {
          type: 'boolean',
          description: 'Prefer morning slots if available (default true for focus work)',
        },
      },
      required: ['task_description'],
    },
  },
];
