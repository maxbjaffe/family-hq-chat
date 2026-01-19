"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Settings,
  RefreshCw,
  Loader2,
  Square,
  Circle,
  Calendar as CalendarIcon,
  MessageSquare,
  Target,
  Send,
  LogOut,
} from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { getCalendarColor } from "@/lib/calendar-colors";

interface Task {
  id: string;
  content: string;
  description: string;
  due: { date: string; string: string } | null;
  priority: number;
  project_name?: string;
}

interface Reminder {
  id: string;
  title: string;
  due_date: string | null;
  list_name: string | null;
  priority: number;
  is_completed: boolean;
}

interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string | null;
  calendar_name: string | null;
  location: string | null;
}

interface Priority {
  priority_number: number;
  content: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function ParentDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userName = searchParams.get("user") || "Parent";
  const isMax = userName.toLowerCase() === "max";

  const [tasks, setTasks] = useState<Task[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const promises: Promise<Response>[] = [
        fetch("/api/calendar?days=7"),
        fetch("/api/dashboard/priorities"),
      ];

      if (isMax) {
        promises.push(fetch("/api/dashboard/tasks?userId=max"));
      } else {
        promises.push(fetch("/api/alex/reminders"));
      }

      const results = await Promise.all(promises);

      // Calendar events
      if (results[0].ok) {
        const data = await results[0].json();
        setEvents(data.events || []);
      }

      // Priorities
      if (results[1].ok) {
        const data = await results[1].json();
        setPriorities(data.priorities || []);
      }

      // Tasks or Reminders
      if (results[2].ok) {
        const data = await results[2].json();
        if (isMax) {
          setTasks(data.tasks || []);
        } else {
          setReminders(data.reminders || []);
        }
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, [isMax]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleExit = () => {
    router.push("/");
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await fetch("/api/dashboard/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete", taskId }),
      });
      setTasks(tasks.filter((t) => t.id !== taskId));
    } catch (error) {
      console.error("Failed to complete task:", error);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setChatLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: userMessage }],
          userId: isMax ? "max" : "alex",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.response },
        ]);
      }
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setChatLoading(false);
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    const eventDate = new Date(date);
    eventDate.setHours(0, 0, 0, 0);

    if (eventDate.getTime() === today.getTime()) return "Today";
    if (eventDate.getTime() === tomorrow.getTime()) return "Tomorrow";
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const priorityColor = (priority: number) => {
    if (priority === 4) return "border-l-red-500 bg-red-50";
    if (priority === 3) return "border-l-orange-500 bg-orange-50";
    if (priority === 2) return "border-l-blue-500 bg-blue-50";
    return "border-l-gray-300";
  };

  // Group events by date
  const eventsByDate = events.reduce((acc, event) => {
    const dateKey = formatDate(event.start_time);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, CalendarEvent[]>);

  // Group tasks by project
  const tasksByProject = tasks.reduce((acc, task) => {
    const project = task.project_name || "Inbox";
    if (!acc[project]) acc[project] = [];
    acc[project].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={handleExit}
              className="p-3 hover:bg-white/50 rounded-xl transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center"
              aria-label="Back to Family Home"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <Avatar
              member={{
                name: userName,
                role: "admin",
                avatar_url: null,
              }}
              size="xl"
              className="shadow-xl border-4 border-white"
            />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {userName}&apos;s Dashboard
              </h1>
              <p className="text-slate-600">Personal command center</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="p-3 hover:bg-white/50 rounded-xl transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5 text-slate-600" />
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="min-h-[48px] min-w-[48px]"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExit}
              className="min-h-[48px] gap-2"
            >
              <LogOut className="h-4 w-4" />
              Exit
            </Button>
          </div>
        </div>

        {/* Main Content - 2 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Calendar + Priorities */}
          <div className="space-y-6">
            {/* Calendar */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <CalendarIcon className="h-5 w-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-slate-800">This Week</h2>
                <Link
                  href="/calendar"
                  className="ml-auto text-sm text-blue-600 hover:underline"
                >
                  Full calendar
                </Link>
              </div>
              {events.length === 0 ? (
                <p className="text-slate-500 text-sm">No upcoming events</p>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {Object.entries(eventsByDate)
                    .slice(0, 5)
                    .map(([date, dateEvents]) => (
                      <div key={date}>
                        <h3 className="text-xs font-medium text-slate-400 uppercase mb-2">
                          {date}
                        </h3>
                        <ul className="space-y-2">
                          {dateEvents.slice(0, 4).map((event) => {
                            const colors = getCalendarColor(event.calendar_name);
                            return (
                              <li key={event.id} className="flex items-start gap-2">
                                <span
                                  className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${colors.dot}`}
                                />
                                <span className="text-xs text-gray-500 w-16 shrink-0">
                                  {formatTime(event.start_time)}
                                </span>
                                <span className="text-sm text-gray-800 truncate">
                                  {event.title}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                </div>
              )}
            </Card>

            {/* Weekly Priorities */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-5 w-5 text-purple-500" />
                <h2 className="text-lg font-semibold text-slate-800">
                  Weekly Priorities
                </h2>
              </div>
              {priorities.length === 0 ? (
                <p className="text-slate-500 text-sm">
                  No priorities set. Use chat to add some!
                </p>
              ) : (
                <ol className="space-y-2">
                  {priorities.map((p) => (
                    <li key={p.priority_number} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-sm font-medium flex items-center justify-center shrink-0">
                        {p.priority_number}
                      </span>
                      <span className="text-slate-700">{p.content}</span>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          </div>

          {/* Right Column: Tasks/Reminders + Chat */}
          <div className="space-y-6">
            {/* Tasks or Reminders */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Square className="h-5 w-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-slate-800">
                  {isMax ? "Tasks" : "Reminders"}
                </h2>
                <span className="ml-auto text-sm text-slate-500">
                  {isMax ? tasks.length : reminders.length} items
                </span>
              </div>

              {isMax ? (
                // Max's Todoist Tasks
                <div className="space-y-4 max-h-[300px] overflow-y-auto">
                  {tasks.length === 0 ? (
                    <p className="text-slate-500 text-sm">All clear! No tasks.</p>
                  ) : (
                    Object.entries(tasksByProject)
                      .slice(0, 3)
                      .map(([project, projectTasks]) => (
                        <div key={project}>
                          <h3 className="text-xs font-medium text-slate-400 uppercase mb-2">
                            {project}
                          </h3>
                          <div className="space-y-1">
                            {projectTasks.slice(0, 4).map((task) => (
                              <div
                                key={task.id}
                                className={`p-2 border-l-2 ${priorityColor(
                                  task.priority
                                )} rounded-r flex items-start gap-2`}
                              >
                                <button
                                  onClick={() => handleCompleteTask(task.id)}
                                  className="text-slate-400 hover:text-green-500 mt-0.5"
                                >
                                  <Square className="w-4 h-4" />
                                </button>
                                <span className="text-sm text-slate-700 truncate">
                                  {task.content}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                  )}
                </div>
              ) : (
                // Alex's Reminders
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {reminders.length === 0 ? (
                    <p className="text-slate-500 text-sm">No reminders synced yet.</p>
                  ) : (
                    reminders.slice(0, 8).map((reminder) => (
                      <div
                        key={reminder.id}
                        className="p-2 bg-slate-50 rounded flex items-start gap-2"
                      >
                        <Circle className="w-4 h-4 text-purple-400 mt-0.5" />
                        <span className="text-sm text-slate-700 truncate">
                          {reminder.title}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </Card>

            {/* Chat */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="h-5 w-5 text-green-500" />
                <h2 className="text-lg font-semibold text-slate-800">Chat</h2>
                <Link
                  href="/chat"
                  className="ml-auto text-sm text-blue-600 hover:underline"
                >
                  Open full chat
                </Link>
              </div>

              {/* Chat Messages */}
              <div className="h-[200px] overflow-y-auto mb-4 space-y-3">
                {messages.length === 0 ? (
                  <p className="text-slate-500 text-sm">
                    Ask me to manage tasks, check calendar, or set priorities...
                  </p>
                ) : (
                  messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded-lg text-sm ${
                        msg.role === "user"
                          ? "bg-blue-100 text-blue-800 ml-8"
                          : "bg-slate-100 text-slate-800 mr-8"
                      }`}
                    >
                      {msg.content}
                    </div>
                  ))
                )}
                {chatLoading && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleChatSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask anything..."
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[48px]"
                />
                <Button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="min-h-[48px] min-w-[48px] bg-gradient-to-r from-purple-500 to-blue-500"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex items-center justify-center gap-4 text-sm text-slate-500">
          <Link href="/admin" className="hover:text-purple-600 transition-colors">
            Admin Settings
          </Link>
          <span>•</span>
          <button onClick={handleExit} className="hover:text-purple-600 transition-colors">
            Back to Family Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ParentDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        </div>
      }
    >
      <ParentDashboardContent />
    </Suspense>
  );
}
