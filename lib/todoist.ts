const TODOIST_API_URL = 'https://api.todoist.com/rest/v2';

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
  is_completed: boolean;
}

export interface TodoistProject {
  id: string;
  name: string;
}

async function getToken(userId?: string): Promise<string> {
  // For MVP, use env var. Later: look up from user's integrations in Supabase
  const token = process.env.TODOIST_API_TOKEN;
  if (!token) throw new Error('TODOIST_API_TOKEN not set');
  return token;
}

export async function getTasks(userId?: string): Promise<TodoistTask[]> {
  const token = await getToken(userId);

  const response = await fetch(`${TODOIST_API_URL}/tasks`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Todoist API error: ${response.status}`);
  }

  return response.json();
}

export async function getProjects(userId?: string): Promise<TodoistProject[]> {
  const token = await getToken(userId);

  const response = await fetch(`${TODOIST_API_URL}/projects`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Todoist API error: ${response.status}`);
  }

  return response.json();
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

  const response = await fetch(`${TODOIST_API_URL}/tasks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Todoist create error: ${response.status}`);
  }

  return response.json();
}

export async function completeTask(taskId: string, userId?: string): Promise<void> {
  const token = await getToken(userId);

  const response = await fetch(`${TODOIST_API_URL}/tasks/${taskId}/close`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Todoist complete error: ${response.status}`);
  }
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

  const response = await fetch(`${TODOIST_API_URL}/tasks/${taskId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Todoist update error: ${response.status}`);
  }

  return response.json();
}

export async function deleteTask(taskId: string, userId?: string): Promise<void> {
  const token = await getToken(userId);

  const response = await fetch(`${TODOIST_API_URL}/tasks/${taskId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Todoist delete error: ${response.status}`);
  }
}
