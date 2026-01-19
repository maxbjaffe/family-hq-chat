"use client";

import { useState, useEffect, useCallback, Suspense, useRef } from "react";
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
  Home,
  Maximize2,
  Minimize2,
  CheckSquare,
  ListTodo,
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
  project_id?: string;
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

interface HouseTask {
  id: string;
  content: string;
  priority: number;
  due: { date: string; string: string } | null;
}

interface FamilyMember {
  id: string;
  name: string;
  role: string;
  avatar_url: string | null;
}

function ParentDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userName = searchParams.get("user") || "Parent";
  const isMax = userName.toLowerCase() === "max";
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [houseTasks, setHouseTasks] = useState<HouseTask[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const promises: Promise<Response>[] = [
        fetch("/api/calendar?days=7"),
        fetch("/api/dashboard/priorities"),
        fetch("/api/house-tasks"),
        fetch("/api/admin/family"), // Fetch family members for avatar
      ];

      if (isMax) {
        // Fetch ALL tasks for Max (including Personal)
        promises.push(fetch("/api/dashboard/tasks?userId=max&includeAll=true"));
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

      // House Tasks
      if (results[2].ok) {
        const data = await results[2].json();
        setHouseTasks(data.tasks || []);
      }

      // Family members for avatar
      if (results[3].ok) {
        const data = await results[3].json();
        const members: FamilyMember[] = data.members || [];
        const currentUser = members.find(
          (m) => m.name.toLowerCase() === userName.toLowerCase()
        );
        if (currentUser?.avatar_url) {
          setUserAvatar(currentUser.avatar_url);
        }
      }

      // Tasks or Reminders
      if (results[4].ok) {
        const data = await results[4].json();
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
  }, [isMax, userName]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleExit = () => {
    router.push("/");
  };

  const handleCompleteTask = async (taskId: string, isHouseTask = false) => {
    try {
      if (isHouseTask) {
        await fetch("/api/house-tasks", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: taskId }),
        });
        setHouseTasks(houseTasks.filter((t) => t.id !== taskId));
      } else {
        await fetch("/api/dashboard/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "complete", taskId }),
        });
        setTasks(tasks.filter((t) => t.id !== taskId));
      }
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
        // Refresh data after chat in case tasks/priorities changed
        fetchData();
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
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
    return "border-l-gray-300 bg-gray-50";
  };

  // Group events by date
  const eventsByDate = events.reduce((acc, event) => {
    const dateKey = formatDate(event.start_time);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, CalendarEvent[]>);

  // Group tasks by project (separate Personal from others)
  const personalTasks = tasks.filter((t) => t.project_name?.toLowerCase() === "personal");
  const otherTasks = tasks.filter((t) => t.project_name?.toLowerCase() !== "personal" && t.project_name?.toLowerCase() !== "house tasks");

  const tasksByProject = otherTasks.reduce((acc, task) => {
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

  // Full-screen chat mode
  if (chatExpanded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setChatExpanded(false)}
              className="min-h-[44px]"
            >
              <Minimize2 className="h-4 w-4 mr-2" />
              Exit Full Screen
            </Button>
            <span className="text-slate-600">{userName}&apos;s Chat</span>
          </div>
          <Link
            href="/chat"
            className="text-sm text-blue-600 hover:underline"
          >
            Open dedicated chat page
          </Link>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-slate-500 mt-8">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-medium">Welcome to your personal assistant</p>
              <p className="text-sm mt-2">Try asking me to:</p>
              <ul className="text-sm mt-2 space-y-1">
                <li>• "Show my tasks for today"</li>
                <li>• "Add a task to buy groceries"</li>
                <li>• "What&apos;s on the calendar this week?"</li>
                <li>• "Set my priorities for this week"</li>
                <li>• "Look up Riley&apos;s doctor info"</li>
              </ul>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`p-4 rounded-xl max-w-3xl ${
                  msg.role === "user"
                    ? "bg-blue-100 text-blue-900 ml-auto"
                    : "bg-white border text-slate-800"
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            ))
          )}
          {chatLoading && (
            <div className="flex items-center gap-2 text-slate-500 p-4">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Thinking...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Chat Input */}
        <div className="bg-white border-t p-4">
          <form onSubmit={handleChatSubmit} className="flex gap-3 max-w-4xl mx-auto">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask anything... (tasks, calendar, family info, priorities)"
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[52px] text-lg"
            />
            <Button
              type="submit"
              disabled={chatLoading || !chatInput.trim()}
              className="min-h-[52px] px-6 bg-gradient-to-r from-purple-500 to-blue-500"
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
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
                avatar_url: userAvatar,
              }}
              size="lg"
              className="shadow-xl border-4 border-white"
            />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {userName}&apos;s Dashboard
              </h1>
              <p className="text-slate-600 text-sm">Personal command center</p>
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

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Calendar + Priorities */}
          <div className="space-y-6">
            {/* Calendar Events */}
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <CalendarIcon className="h-5 w-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-slate-800">This Week</h2>
                <Link href="/calendar" className="ml-auto text-sm text-blue-600 hover:underline">
                  Full calendar
                </Link>
              </div>
              {events.length === 0 ? (
                <p className="text-slate-500 text-sm">No upcoming events</p>
              ) : (
                <div className="space-y-4 max-h-[350px] overflow-y-auto">
                  {Object.entries(eventsByDate).slice(0, 5).map(([date, dateEvents]) => (
                    <div key={date}>
                      <h3 className="text-xs font-medium text-slate-400 uppercase mb-2">{date}</h3>
                      <ul className="space-y-2">
                        {dateEvents.slice(0, 5).map((event) => {
                          const colors = getCalendarColor(event.calendar_name);
                          return (
                            <li key={event.id} className="flex items-start gap-2">
                              <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${colors.dot}`} />
                              <span className="text-xs text-gray-500 w-14 shrink-0">{formatTime(event.start_time)}</span>
                              <span className="text-sm text-gray-800 truncate">{event.title}</span>
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
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-5 w-5 text-purple-500" />
                <h2 className="text-lg font-semibold text-slate-800">Weekly Priorities</h2>
              </div>
              {priorities.length === 0 ? (
                <p className="text-slate-500 text-sm">No priorities set. Use chat to add some!</p>
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

            {/* House Tasks */}
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Home className="h-5 w-5 text-green-500" />
                <h2 className="text-lg font-semibold text-slate-800">House Tasks</h2>
                <span className="ml-auto text-sm text-slate-500">{houseTasks.length}</span>
              </div>
              {houseTasks.length === 0 ? (
                <p className="text-slate-500 text-sm">No house tasks</p>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {houseTasks.map((task) => (
                    <div key={task.id} className="p-2 bg-green-50 border-l-2 border-green-400 rounded-r flex items-start gap-2">
                      <button
                        onClick={() => handleCompleteTask(task.id, true)}
                        className="text-green-400 hover:text-green-600 mt-0.5"
                      >
                        <Square className="w-4 h-4" />
                      </button>
                      <span className="text-sm text-slate-700">{task.content}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Middle Column: Personal Tasks */}
          <div className="space-y-6">
            {isMax ? (
              <>
                {/* Personal Tasks (Max Only) */}
                <Card className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <ListTodo className="h-5 w-5 text-indigo-500" />
                    <h2 className="text-lg font-semibold text-slate-800">Personal</h2>
                    <span className="ml-auto text-sm text-slate-500">{personalTasks.length}</span>
                  </div>
                  {personalTasks.length === 0 ? (
                    <p className="text-slate-500 text-sm">No personal tasks</p>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {personalTasks.map((task) => (
                        <div key={task.id} className={`p-2 border-l-2 ${priorityColor(task.priority)} rounded-r flex items-start gap-2`}>
                          <button onClick={() => handleCompleteTask(task.id)} className="text-slate-400 hover:text-green-500 mt-0.5">
                            <Square className="w-4 h-4" />
                          </button>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-slate-700 block truncate">{task.content}</span>
                            {task.due && <span className="text-xs text-slate-400">{task.due.string}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Other Todoist Projects */}
                <Card className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckSquare className="h-5 w-5 text-blue-500" />
                    <h2 className="text-lg font-semibold text-slate-800">Other Tasks</h2>
                    <span className="ml-auto text-sm text-slate-500">{otherTasks.length}</span>
                  </div>
                  {otherTasks.length === 0 ? (
                    <p className="text-slate-500 text-sm">All clear!</p>
                  ) : (
                    <div className="space-y-4 max-h-[300px] overflow-y-auto">
                      {Object.entries(tasksByProject).slice(0, 4).map(([project, projectTasks]) => (
                        <div key={project}>
                          <h3 className="text-xs font-medium text-slate-400 uppercase mb-2">{project}</h3>
                          <div className="space-y-1">
                            {projectTasks.slice(0, 5).map((task) => (
                              <div key={task.id} className={`p-2 border-l-2 ${priorityColor(task.priority)} rounded-r flex items-start gap-2`}>
                                <button onClick={() => handleCompleteTask(task.id)} className="text-slate-400 hover:text-green-500 mt-0.5">
                                  <Square className="w-4 h-4" />
                                </button>
                                <span className="text-sm text-slate-700 truncate">{task.content}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </>
            ) : (
              // Alex's Reminders
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Circle className="h-5 w-5 text-purple-500" />
                  <h2 className="text-lg font-semibold text-slate-800">Reminders</h2>
                  <span className="ml-auto text-sm text-slate-500">{reminders.length}</span>
                </div>
                {reminders.length === 0 ? (
                  <p className="text-slate-500 text-sm">No reminders synced yet.</p>
                ) : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {reminders.map((reminder) => (
                      <div key={reminder.id} className="p-2 bg-purple-50 rounded flex items-start gap-2">
                        <Circle className="w-4 h-4 text-purple-400 mt-0.5" />
                        <div className="flex-1">
                          <span className="text-sm text-slate-700 block">{reminder.title}</span>
                          {reminder.due_date && (
                            <span className="text-xs text-slate-400">
                              {new Date(reminder.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Right Column: Chat (Large) */}
          <div className="lg:col-span-1">
            <Card className="p-5 h-full flex flex-col" style={{ minHeight: "600px" }}>
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="h-5 w-5 text-green-500" />
                <h2 className="text-lg font-semibold text-slate-800">AI Assistant</h2>
                <div className="ml-auto flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setChatExpanded(true)}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                  <Link href="/chat" className="text-sm text-blue-600 hover:underline">
                    Full page
                  </Link>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto mb-4 space-y-3 min-h-[400px]">
                {messages.length === 0 ? (
                  <div className="text-slate-500 text-sm space-y-2">
                    <p>Ask me to:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Manage Todoist tasks</li>
                      <li>• Check calendar events</li>
                      <li>• Set weekly priorities</li>
                      <li>• Look up family info from Notion</li>
                      <li>• Get reminders (Alex)</li>
                    </ul>
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-xl text-sm ${
                        msg.role === "user"
                          ? "bg-blue-100 text-blue-800 ml-4"
                          : "bg-slate-100 text-slate-800 mr-4"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  ))
                )}
                {chatLoading && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                )}
                <div ref={chatEndRef} />
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
