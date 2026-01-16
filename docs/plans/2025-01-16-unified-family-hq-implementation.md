# Unified Family HQ - Phase 1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build MVP with PIN auth, family dashboard, Todoist integration for Max, and Shortcuts endpoints for Apple data.

**Architecture:** Family HQ Chat becomes the unified app. PIN-protected personal spaces, context-aware chat, role-based data filtering. Supabase stores users/permissions, Shortcuts push Apple data to cache tables.

**Tech Stack:** Next.js 14, TypeScript, Tailwind, Supabase, Claude API, Todoist API

---

## Task 1: Add User Auth Functions to Supabase Lib

**Files:**
- Modify: `lib/supabase.ts`

**Step 1: Add crypto import and user types**

Add at top of file after existing imports:

```typescript
import { createHash } from 'crypto';

// User auth types
export interface User {
  id: string;
  name: string;
  role: 'admin' | 'adult' | 'kid';
  integrations: Record<string, string>;
}

function hashPin(pin: string): string {
  return createHash('sha256').update(pin).digest('hex');
}
```

**Step 2: Add user auth functions**

Add after existing functions:

```typescript
export async function getUserByPin(pin: string): Promise<User | null> {
  const supabase = getFamilyDataClient();
  const pinHash = hashPin(pin);

  const { data, error } = await supabase
    .from('users')
    .select('id, name, role, integrations')
    .eq('pin_hash', pinHash)
    .single();

  if (error || !data) return null;
  return data as User;
}

export async function getUserById(userId: string): Promise<User | null> {
  const supabase = getFamilyDataClient();

  const { data, error } = await supabase
    .from('users')
    .select('id, name, role, integrations')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return data as User;
}

export async function verifyPin(userId: string, pin: string): Promise<boolean> {
  const supabase = getFamilyDataClient();
  const pinHash = hashPin(pin);

  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .eq('pin_hash', pinHash)
    .single();

  return !!data;
}

export async function getAllUsers(): Promise<User[]> {
  const supabase = getFamilyDataClient();

  const { data, error } = await supabase
    .from('users')
    .select('id, name, role, integrations')
    .order('name');

  if (error) return [];
  return (data || []) as User[];
}
```

**Step 3: Commit**

```bash
git add lib/supabase.ts
git commit -m "feat: add user auth functions for PIN-based login"
```

---

## Task 2: Create PIN Modal Component

**Files:**
- Create: `components/PinModal.tsx`

**Step 1: Create the PIN entry modal**

```typescript
'use client';

import { useState, useRef, useEffect } from 'react';

interface PinModalProps {
  isOpen: boolean;
  onSuccess: (userId: string) => void;
  onCancel: () => void;
  title?: string;
}

export function PinModal({ isOpen, onSuccess, onCancel, title = 'Enter PIN' }: PinModalProps) {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => {
    if (isOpen) {
      setPin(['', '', '', '']);
      setError('');
      inputRefs[0].current?.focus();
    }
  }, [isOpen]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    setError('');

    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    // Auto-submit when all digits entered
    if (value && index === 3 && newPin.every(d => d)) {
      submitPin(newPin.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  const submitPin = async (pinValue: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinValue }),
      });

      if (response.ok) {
        const { userId } = await response.json();
        onSuccess(userId);
      } else {
        setError('Invalid PIN');
        setPin(['', '', '', '']);
        inputRefs[0].current?.focus();
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-xl">
        <h2 className="text-xl font-semibold text-center mb-6">{title}</h2>

        <div className="flex justify-center gap-3 mb-6">
          {pin.map((digit, index) => (
            <input
              key={index}
              ref={inputRefs[index]}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              disabled={loading}
              className="w-14 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
            />
          ))}
        </div>

        {error && (
          <p className="text-red-500 text-center text-sm mb-4">{error}</p>
        )}

        <button
          onClick={onCancel}
          className="w-full py-3 text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/PinModal.tsx
git commit -m "feat: add PIN modal component for auth"
```

---

## Task 3: Create PIN Verification API Route

**Files:**
- Create: `app/api/auth/verify-pin/route.ts`

**Step 1: Create the API route**

```typescript
import { NextResponse } from 'next/server';
import { getUserByPin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { pin } = await request.json();

    if (!pin || typeof pin !== 'string' || pin.length !== 4) {
      return NextResponse.json({ error: 'Invalid PIN format' }, { status: 400 });
    }

    const user = await getUserByPin(pin);

    if (!user) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
    }

    return NextResponse.json({
      userId: user.id,
      name: user.name,
      role: user.role,
    });
  } catch (error) {
    console.error('PIN verification error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add app/api/auth/verify-pin/route.ts
git commit -m "feat: add PIN verification API route"
```

---

## Task 4: Create User Context Provider

**Files:**
- Create: `components/UserProvider.tsx`

**Step 1: Create the context provider**

```typescript
'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface UserContextType {
  userId: string | null;
  userName: string | null;
  userRole: 'admin' | 'adult' | 'kid' | null;
  isAuthenticated: boolean;
  login: (userId: string, name: string, role: 'admin' | 'adult' | 'kid') => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'adult' | 'kid' | null>(null);

  const login = useCallback((id: string, name: string, role: 'admin' | 'adult' | 'kid') => {
    setUserId(id);
    setUserName(name);
    setUserRole(role);
  }, []);

  const logout = useCallback(() => {
    setUserId(null);
    setUserName(null);
    setUserRole(null);
  }, []);

  return (
    <UserContext.Provider
      value={{
        userId,
        userName,
        userRole,
        isAuthenticated: !!userId,
        login,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}
```

**Step 2: Commit**

```bash
git add components/UserProvider.tsx
git commit -m "feat: add user context provider for auth state"
```

---

## Task 5: Port Todoist Integration

**Files:**
- Create: `lib/todoist.ts`

**Step 1: Copy and adapt todoist.ts from Morning Rundown**

```typescript
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
```

**Step 2: Commit**

```bash
git add lib/todoist.ts
git commit -m "feat: port Todoist integration from Morning Rundown"
```

---

## Task 6: Create Shortcuts API Endpoints

**Files:**
- Create: `app/api/shortcuts/calendar/route.ts`
- Create: `app/api/shortcuts/reminders/route.ts`

**Step 1: Create calendar endpoint**

```typescript
// app/api/shortcuts/calendar/route.ts
import { NextResponse } from 'next/server';
import { getFamilyDataClient } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const secretKey = request.headers.get('X-Shortcut-Key');
    if (secretKey !== process.env.SHORTCUTS_SECRET_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { events } = await request.json();

    if (!Array.isArray(events)) {
      return NextResponse.json({ error: 'Invalid events format' }, { status: 400 });
    }

    const supabase = getFamilyDataClient();

    // Upsert events (update if exists, insert if new)
    for (const event of events) {
      await supabase
        .from('cached_calendar_events')
        .upsert({
          event_id: event.id || event.title + event.start_time,
          title: event.title,
          start_time: event.start_time,
          end_time: event.end_time,
          calendar_name: event.calendar_name,
          location: event.location,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'event_id',
        });
    }

    return NextResponse.json({ success: true, count: events.length });
  } catch (error) {
    console.error('Calendar sync error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

**Step 2: Create reminders endpoint**

```typescript
// app/api/shortcuts/reminders/route.ts
import { NextResponse } from 'next/server';
import { getFamilyDataClient } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const secretKey = request.headers.get('X-Shortcut-Key');
    if (secretKey !== process.env.SHORTCUTS_SECRET_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user, reminders } = await request.json();

    if (!user || !Array.isArray(reminders)) {
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    }

    const supabase = getFamilyDataClient();

    // Look up user by name
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .ilike('name', user)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Upsert reminders
    for (const reminder of reminders) {
      await supabase
        .from('cached_reminders')
        .upsert({
          reminder_id: reminder.id || reminder.title + reminder.list_name,
          user_id: userData.id,
          title: reminder.title,
          due_date: reminder.due_date,
          list_name: reminder.list_name,
          priority: reminder.priority || 0,
          is_completed: reminder.is_completed || false,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'reminder_id',
        });
    }

    return NextResponse.json({ success: true, count: reminders.length });
  } catch (error) {
    console.error('Reminders sync error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

**Step 3: Commit**

```bash
git add app/api/shortcuts/calendar/route.ts app/api/shortcuts/reminders/route.ts
git commit -m "feat: add Shortcuts API endpoints for Apple Calendar and Reminders"
```

---

## Task 7: Add Cache Query Functions to Supabase Lib

**Files:**
- Modify: `lib/supabase.ts`

**Step 1: Add types and query functions for cached data**

```typescript
// Add types after existing interfaces
export interface CachedCalendarEvent {
  id: string;
  event_id: string;
  title: string;
  start_time: string;
  end_time: string | null;
  calendar_name: string | null;
  location: string | null;
}

export interface CachedReminder {
  id: string;
  reminder_id: string;
  user_id: string;
  title: string;
  due_date: string | null;
  list_name: string | null;
  priority: number;
  is_completed: boolean;
}

// Add query functions
export async function getCachedCalendarEvents(days: number = 7): Promise<CachedCalendarEvent[]> {
  const supabase = getFamilyDataClient();
  const now = new Date().toISOString();
  const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('cached_calendar_events')
    .select('*')
    .gte('start_time', now)
    .lte('start_time', futureDate)
    .order('start_time');

  if (error) {
    console.error('Error fetching cached calendar:', error);
    return [];
  }

  return data || [];
}

export async function getCachedReminders(userId: string): Promise<CachedReminder[]> {
  const supabase = getFamilyDataClient();

  const { data, error } = await supabase
    .from('cached_reminders')
    .select('*')
    .eq('user_id', userId)
    .eq('is_completed', false)
    .order('due_date');

  if (error) {
    console.error('Error fetching cached reminders:', error);
    return [];
  }

  return data || [];
}
```

**Step 2: Commit**

```bash
git add lib/supabase.ts
git commit -m "feat: add cache query functions for calendar and reminders"
```

---

## Task 8: Create Dashboard Layout Component

**Files:**
- Create: `components/DashboardLayout.tsx`

**Step 1: Create the dashboard layout**

```typescript
'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { Settings, LogOut } from 'lucide-react';
import { useUser } from './UserProvider';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
}

export function DashboardLayout({ children, title = 'Family HQ' }: DashboardLayoutProps) {
  const { userName, userRole, isAuthenticated, logout } = useUser();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-gray-900">
          {title}
        </Link>

        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <>
              <span className="text-sm text-gray-600">{userName}</span>
              <button
                onClick={logout}
                className="text-gray-400 hover:text-gray-600"
                title="Exit personal space"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          )}
          {userRole === 'admin' && (
            <Link
              href="/admin"
              className="text-gray-400 hover:text-gray-600"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </Link>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="p-4 max-w-4xl mx-auto">
        {children}
      </main>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/DashboardLayout.tsx
git commit -m "feat: add dashboard layout component"
```

---

## Task 9: Create Calendar Widget Component

**Files:**
- Create: `components/widgets/CalendarWidget.tsx`

**Step 1: Create the calendar widget**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string | null;
  calendar_name: string | null;
  location: string | null;
}

export function CalendarWidget() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch('/api/dashboard/calendar');
        if (response.ok) {
          const data = await response.json();
          setEvents(data.events || []);
        }
      } catch (error) {
        console.error('Failed to fetch calendar:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-blue-500" />
        <h3 className="font-semibold text-gray-900">Today</h3>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : events.length === 0 ? (
        <p className="text-sm text-gray-500">No events today</p>
      ) : (
        <ul className="space-y-2">
          {events.slice(0, 5).map((event) => (
            <li key={event.id} className="flex items-start gap-2">
              <span className="text-xs text-gray-500 w-16 shrink-0">
                {formatTime(event.start_time)}
              </span>
              <span className="text-sm text-gray-800">{event.title}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
```

**Step 2: Commit**

```bash
git add components/widgets/CalendarWidget.tsx
git commit -m "feat: add calendar widget component"
```

---

## Task 10: Create Tasks Widget Component

**Files:**
- Create: `components/widgets/TasksWidget.tsx`

**Step 1: Create the tasks widget**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { CheckSquare, Square } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useUser } from '@/components/UserProvider';

interface Task {
  id: string;
  content: string;
  due: { date: string; string: string } | null;
  priority: number;
  project_name?: string;
}

export function TasksWidget() {
  const { userId, userRole } = useUser();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTasks() {
      try {
        const params = new URLSearchParams();
        if (userId) params.set('userId', userId);

        const response = await fetch(`/api/dashboard/tasks?${params}`);
        if (response.ok) {
          const data = await response.json();
          setTasks(data.tasks || []);
        }
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchTasks();
  }, [userId]);

  const handleComplete = async (taskId: string) => {
    try {
      await fetch('/api/dashboard/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete', taskId }),
      });
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  const priorityColor = (priority: number) => {
    if (priority === 4) return 'text-red-500';
    if (priority === 3) return 'text-orange-500';
    return 'text-gray-400';
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <CheckSquare className="w-5 h-5 text-green-500" />
        <h3 className="font-semibold text-gray-900">Tasks</h3>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-gray-500">No tasks</p>
      ) : (
        <ul className="space-y-2">
          {tasks.slice(0, 8).map((task) => (
            <li key={task.id} className="flex items-start gap-2">
              <button
                onClick={() => handleComplete(task.id)}
                className={priorityColor(task.priority)}
              >
                <Square className="w-4 h-4" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 truncate">{task.content}</p>
                {task.due && (
                  <p className="text-xs text-gray-500">{task.due.string}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
```

**Step 2: Commit**

```bash
git add components/widgets/TasksWidget.tsx
git commit -m "feat: add tasks widget component"
```

---

## Task 11: Create Dashboard API Routes

**Files:**
- Create: `app/api/dashboard/calendar/route.ts`
- Create: `app/api/dashboard/tasks/route.ts`

**Step 1: Create calendar API**

```typescript
// app/api/dashboard/calendar/route.ts
import { NextResponse } from 'next/server';
import { getCachedCalendarEvents } from '@/lib/supabase';

export async function GET() {
  try {
    const events = await getCachedCalendarEvents(1); // Today only

    // Filter to today's events
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayEvents = events.filter(e => {
      const eventDate = new Date(e.start_time);
      return eventDate >= today && eventDate < tomorrow;
    });

    return NextResponse.json({ events: todayEvents });
  } catch (error) {
    console.error('Calendar API error:', error);
    return NextResponse.json({ events: [] });
  }
}
```

**Step 2: Create tasks API**

```typescript
// app/api/dashboard/tasks/route.ts
import { NextResponse } from 'next/server';
import { getTasks, getProjects, completeTask } from '@/lib/todoist';
import { getFamilyDataClient } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Get tasks from Todoist
    const [tasks, projects] = await Promise.all([
      getTasks(),
      getProjects(),
    ]);

    const projectMap = new Map(projects.map(p => [p.id, p.name]));

    // If no user logged in, filter to "family" visibility only
    // For MVP, return all tasks for authenticated users
    let filteredTasks = tasks;

    if (!userId) {
      // Get family-visible project IDs from content_visibility
      const supabase = getFamilyDataClient();
      const { data: visibleContent } = await supabase
        .from('content_visibility')
        .select('content_id')
        .eq('content_type', 'todoist_project')
        .eq('visibility', 'family');

      const familyProjectIds = new Set(visibleContent?.map(v => v.content_id) || []);

      filteredTasks = tasks.filter(t => familyProjectIds.has(t.project_id));
    }

    const enrichedTasks = filteredTasks.map(task => ({
      ...task,
      project_name: projectMap.get(task.project_id) || 'Inbox',
    }));

    return NextResponse.json({ tasks: enrichedTasks });
  } catch (error) {
    console.error('Tasks API error:', error);
    return NextResponse.json({ tasks: [] });
  }
}

export async function POST(request: Request) {
  try {
    const { action, taskId } = await request.json();

    if (action === 'complete' && taskId) {
      await completeTask(taskId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Tasks POST error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

**Step 3: Commit**

```bash
git add app/api/dashboard/calendar/route.ts app/api/dashboard/tasks/route.ts
git commit -m "feat: add dashboard API routes for calendar and tasks"
```

---

## Task 12: Create Space Card Component

**Files:**
- Create: `components/SpaceCard.tsx`

**Step 1: Create the space card**

```typescript
'use client';

import { Lock } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface SpaceCardProps {
  name: string;
  icon: React.ReactNode;
  color: string;
  requiresPin?: boolean;
  onClick: () => void;
}

export function SpaceCard({ name, icon, color, requiresPin = false, onClick }: SpaceCardProps) {
  return (
    <Card
      onClick={onClick}
      className={`p-4 cursor-pointer transition-transform hover:scale-105 ${color}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-medium text-white">{name}</span>
        </div>
        {requiresPin && <Lock className="w-4 h-4 text-white/70" />}
      </div>
    </Card>
  );
}
```

**Step 2: Commit**

```bash
git add components/SpaceCard.tsx
git commit -m "feat: add space card component for personal spaces"
```

---

## Task 13: Create Family Dashboard Page

**Files:**
- Create: `app/dashboard/page.tsx`

**Step 1: Create the dashboard page**

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Users, Gamepad2 } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { CalendarWidget } from '@/components/widgets/CalendarWidget';
import { TasksWidget } from '@/components/widgets/TasksWidget';
import { SpaceCard } from '@/components/SpaceCard';
import { PinModal } from '@/components/PinModal';
import { useUser } from '@/components/UserProvider';

export default function DashboardPage() {
  const router = useRouter();
  const { login } = useUser();
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pendingSpace, setPendingSpace] = useState<string | null>(null);

  const handleSpaceClick = (space: string, requiresPin: boolean) => {
    if (requiresPin) {
      setPendingSpace(space);
      setPinModalOpen(true);
    } else {
      router.push(`/${space}`);
    }
  };

  const handlePinSuccess = async (userId: string) => {
    // Fetch user info and update context
    const response = await fetch(`/api/auth/user?id=${userId}`);
    if (response.ok) {
      const { name, role } = await response.json();
      login(userId, name, role);
    }

    setPinModalOpen(false);
    if (pendingSpace) {
      router.push(`/${pendingSpace}`);
      setPendingSpace(null);
    }
  };

  return (
    <DashboardLayout>
      {/* Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <CalendarWidget />
        <TasksWidget />
      </div>

      {/* Chat Section */}
      <div className="bg-white rounded-xl border p-4 mb-6">
        <p className="text-gray-500 text-center py-8">
          Chat coming soon...
        </p>
      </div>

      {/* Space Cards */}
      <div className="grid grid-cols-3 gap-4">
        <SpaceCard
          name="Max's Space"
          icon={<User className="w-5 h-5 text-white" />}
          color="bg-blue-500"
          requiresPin={true}
          onClick={() => handleSpaceClick('max', true)}
        />
        <SpaceCard
          name="Alex's Space"
          icon={<User className="w-5 h-5 text-white" />}
          color="bg-purple-500"
          requiresPin={true}
          onClick={() => handleSpaceClick('alex', true)}
        />
        <SpaceCard
          name="Kids Zone"
          icon={<Gamepad2 className="w-5 h-5 text-white" />}
          color="bg-green-500"
          requiresPin={false}
          onClick={() => handleSpaceClick('kids', false)}
        />
      </div>

      <PinModal
        isOpen={pinModalOpen}
        onSuccess={handlePinSuccess}
        onCancel={() => {
          setPinModalOpen(false);
          setPendingSpace(null);
        }}
        title={`Enter PIN for ${pendingSpace}'s Space`}
      />
    </DashboardLayout>
  );
}
```

**Step 2: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: create family dashboard page with widgets and space cards"
```

---

## Task 14: Create User Lookup API Route

**Files:**
- Create: `app/api/auth/user/route.ts`

**Step 1: Create the API route**

```typescript
import { NextResponse } from 'next/server';
import { getUserById } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const user = await getUserById(userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      role: user.role,
    });
  } catch (error) {
    console.error('User lookup error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add app/api/auth/user/route.ts
git commit -m "feat: add user lookup API route"
```

---

## Task 15: Update App Layout with UserProvider

**Files:**
- Modify: `app/layout.tsx`

**Step 1: Wrap app with UserProvider**

Add import and wrap children:

```typescript
import { UserProvider } from '@/components/UserProvider';

// In the return, wrap {children} with:
<UserProvider>
  {children}
</UserProvider>
```

**Step 2: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: add UserProvider to app layout"
```

---

## Task 16: Add Environment Variables

**Files:**
- Modify: `.env.local` (do not commit)

**Step 1: Add required env vars**

```
# Existing vars...

# New vars for unified Family HQ
TODOIST_API_TOKEN=<from Morning Rundown .env.local>
SHORTCUTS_SECRET_KEY=<generate a random string>
```

**Step 2: Document in .env.example or README**

---

## Summary

| Task | Description |
|------|-------------|
| 1 | User auth functions in Supabase lib |
| 2 | PIN modal component |
| 3 | PIN verification API route |
| 4 | User context provider |
| 5 | Port Todoist integration |
| 6 | Shortcuts API endpoints |
| 7 | Cache query functions |
| 8 | Dashboard layout component |
| 9 | Calendar widget |
| 10 | Tasks widget |
| 11 | Dashboard API routes |
| 12 | Space card component |
| 13 | Family dashboard page |
| 14 | User lookup API route |
| 15 | Update app layout |
| 16 | Environment variables |

Total: 16 tasks
