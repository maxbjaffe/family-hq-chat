"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import {
  AlertTriangle,
  Calendar,
  Mail,
  Megaphone,
  Loader2,
} from "lucide-react";

interface SchoolEvent {
  id: string;
  title: string;
  date: string;
  source: string;
  scope: string;
}

interface ActionItem {
  id: string;
  title: string;
  deadline?: string | null;
  urgency: string | null;
  source: string;
}

interface Announcement {
  id: string;
  title: string;
  source: string;
  created_at: string;
}

interface TeacherEmail {
  id: string;
  subject: string;
  from_name: string;
  teacher_name?: string;
  created_at: string;
}

interface KidSchoolData {
  events: SchoolEvent[];
  actions: ActionItem[];
  announcements: Announcement[];
  teacherEmails: TeacherEmail[];
}

interface KidSchoolTabProps {
  childName: string;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  const targetDay = new Date(date);
  targetDay.setHours(0, 0, 0, 0);

  if (targetDay.getTime() === today.getTime()) return "Today";
  if (targetDay.getTime() === tomorrow.getTime()) return "Tomorrow";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function UrgencyBadge({ urgency }: { urgency: string | null | undefined }) {
  if (!urgency || typeof urgency !== 'string') return null;

  const urgencyLower = urgency.toLowerCase();
  const isHigh = urgencyLower === "high";
  const isMedium = urgencyLower === "medium";

  if (!isHigh && !isMedium) return null;

  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
        isHigh
          ? "bg-red-100 text-red-700"
          : "bg-amber-100 text-amber-700"
      }`}
    >
      {isHigh ? "Urgent" : "Soon"}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="text-sm text-slate-400 py-3 text-center">{message}</p>
  );
}

export function KidSchoolTab({ childName }: KidSchoolTabProps) {
  const [data, setData] = useState<KidSchoolData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSchoolData() {
      try {
        const res = await fetch(`/api/family/${encodeURIComponent(childName)}/school`);
        if (!res.ok) {
          throw new Error("Failed to load school data");
        }
        const schoolData = await res.json();
        setData(schoolData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    fetchSchoolData();
  }, [childName]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 bg-red-50 border-red-200">
        <p className="text-red-600 text-center">{error}</p>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Action Items - Amber/Warning Style */}
      <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <h3 className="font-bold text-slate-800">Action Items</h3>
        </div>
        {data.actions.length === 0 ? (
          <EmptyState message="No action items right now" />
        ) : (
          <div className="space-y-2">
            {data.actions.map((action) => (
              <div
                key={action.id}
                className="p-3 bg-white/70 rounded-lg border border-amber-200"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-slate-800 text-sm">
                    {action.title}
                  </p>
                  <UrgencyBadge urgency={action.urgency} />
                </div>
                {action.deadline && (
                  <p className="text-xs text-amber-700 mt-1">
                    Due: {formatDate(action.deadline)}
                  </p>
                )}
                <p className="text-xs text-slate-500 mt-1">{action.source}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Upcoming Events - Blue Style */}
      <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-5 w-5 text-blue-600" />
          <h3 className="font-bold text-slate-800">Upcoming Events</h3>
        </div>
        {data.events.length === 0 ? (
          <EmptyState message="No upcoming events" />
        ) : (
          <div className="space-y-2">
            {data.events.map((event) => (
              <div
                key={event.id}
                className="p-3 bg-white/70 rounded-lg border border-blue-200"
              >
                <div className="flex items-center gap-2 text-xs text-blue-600 font-medium mb-1">
                  <span>{formatDate(event.date)}</span>
                </div>
                <p className="font-medium text-slate-800 text-sm">
                  {event.title}
                </p>
                <p className="text-xs text-slate-500 mt-1">{event.source}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Teacher Communications - Purple Style */}
      <Card className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
        <div className="flex items-center gap-2 mb-3">
          <Mail className="h-5 w-5 text-purple-600" />
          <h3 className="font-bold text-slate-800">Teacher Communications</h3>
        </div>
        {data.teacherEmails.length === 0 ? (
          <EmptyState message="No recent teacher emails" />
        ) : (
          <div className="space-y-2">
            {data.teacherEmails.map((email) => (
              <div
                key={email.id}
                className="p-3 bg-white/70 rounded-lg border border-purple-200"
              >
                <p className="font-medium text-slate-800 text-sm">
                  {email.subject}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                  <span className="text-purple-600 font-medium">
                    {email.teacher_name || email.from_name}
                  </span>
                  <span>{formatRelativeDate(email.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Announcements - Green Style */}
      <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <div className="flex items-center gap-2 mb-3">
          <Megaphone className="h-5 w-5 text-green-600" />
          <h3 className="font-bold text-slate-800">Announcements</h3>
        </div>
        {data.announcements.length === 0 ? (
          <EmptyState message="No announcements" />
        ) : (
          <div className="space-y-2">
            {data.announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="p-3 bg-white/70 rounded-lg border border-green-200"
              >
                <p className="font-medium text-slate-800 text-sm">
                  {announcement.title}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                  <span>{announcement.source}</span>
                  <span>{formatRelativeDate(announcement.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
