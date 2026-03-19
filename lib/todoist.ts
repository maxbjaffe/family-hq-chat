const TODOIST_API_URL = 'https://api.todoist.com/api/v1';

export interface TodoistTask {
  id: string;
  content: string;
  description: string;
  due: {
    date: string;
    is_recurring: boolean;
    string: string;
  } | null;
  priority: number;
  project_id: string;
  labels: string[];
  checked: boolean;
}

export interface TodoistProject {
  id: string;
  name: string;
}

interface TodoistListResponse<T> {
  results: T[];
  next_cursor: string | null;
}

function todoistErrorMessage(status: number, action: string): string {
  if (status === 401 || status === 403) return 'Todoist token expired or invalid — re-add in settings';
  if (status === 429) return 'Todoist rate limited — try again in a moment';
  if (status >= 500) return 'Todoist is temporarily down — try again later';
  return `Todoist ${action} failed (${status})`;
}

async function todoistFetch(url: string, init: RequestInit, action: string): Promise<Response> {
  let response = await fetch(url, init);

  // Retry once on 429 with backoff
  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get('Retry-After') || '2', 10);
    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
    response = await fetch(url, init);
  }

  if (!response.ok) {
    throw new Error(todoistErrorMessage(response.status, action));
  }

  return response;
}

async function getToken(userId?: string): Promise<string> {
  // For MVP, use env var. Later: look up from user's integrations in Supabase
  const token = process.env.TODOIST_API_TOKEN;
  if (!token) throw new Error('TODOIST_API_TOKEN not set');
  return token;
}

export async function getTasks(userId?: string): Promise<TodoistTask[]> {
  const token = await getToken(userId);

  const response = await todoistFetch(`${TODOIST_API_URL}/tasks`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }, 'get tasks');

  const data: TodoistListResponse<TodoistTask> = await response.json();
  return data.results;
}

export async function getProjects(userId?: string): Promise<TodoistProject[]> {
  const token = await getToken(userId);

  const response = await todoistFetch(`${TODOIST_API_URL}/projects`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }, 'get projects');

  const data: TodoistListResponse<TodoistProject> = await response.json();
  return data.results;
}

export async function createTask(
  params: {
    content: string;
    description?: string;
    due_string?: string;
    priority?: number;
    project_id?: string;
  },
  userId?: string
): Promise<TodoistTask> {
  const token = await getToken(userId);

  const response = await todoistFetch(`${TODOIST_API_URL}/tasks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  }, 'create task');

  return response.json();
}

export async function completeTask(taskId: string, userId?: string): Promise<void> {
  const token = await getToken(userId);

  await todoistFetch(`${TODOIST_API_URL}/tasks/${taskId}/close`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  }, 'complete task');
}

export async function updateTask(
  taskId: string,
  params: {
    content?: string;
    description?: string;
    due_string?: string;
    priority?: number;
  },
  userId?: string
): Promise<TodoistTask> {
  const token = await getToken(userId);

  const response = await todoistFetch(`${TODOIST_API_URL}/tasks/${taskId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  }, 'update task');

  return response.json();
}

export async function deleteTask(taskId: string, userId?: string): Promise<void> {
  const token = await getToken(userId);

  await todoistFetch(`${TODOIST_API_URL}/tasks/${taskId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  }, 'delete task');
}
