"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import {
  AlertTriangle,
  Calendar,
  Loader2,
  Mail,
  Megaphone,
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
  teacher_name: string | null;
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
  onEventsLoaded?: (eventTitles: string[]) => void;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
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
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function UrgencyBadge({ urgency }: { urgency: string | null | undefined }) {
  if (!urgency || typeof urgency !== "string") return null;

  const urgencyLower = urgency.toLowerCase();
  const isHigh = urgencyLower === "high";
  const isMedium = urgencyLower === "medium";

  if (!isHigh && !isMedium) return null;

  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
        isHigh ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
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

export function KidSchoolTab({ childName, onEventsLoaded }: KidSchoolTabProps) {
  const [data, setData] = useState<KidSchoolData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSchoolData() {
      try {
        const res = await fetch(
          `/api/family/${encodeURIComponent(childName)}/school`
        );
        if (!res.ok) {
          throw new Error("Failed to load school data");
        }
        const schoolData = await res.json();
        setData(schoolData);

        // Notify parent of event titles for deduplication
        if (onEventsLoaded && schoolData.events) {
          const titles = schoolData.events.map((e: SchoolEvent) =>
            e.title?.toLowerCase().trim()
          ).filter(Boolean);
          onEventsLoaded(titles);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    fetchSchoolData();
  }, [childName, onEventsLoaded]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-4 bg-red-50 border-red-200">
        <p className="text-red-600 text-center text-sm">{error}</p>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const hasActions = data.actions && data.actions.length > 0;
  const hasEvents = data.events && data.events.length > 0;
  const hasAnnouncements = data.announcements && data.announcements.length > 0;
  const hasTeacherEmails = data.teacherEmails && data.teacherEmails.length > 0;

  // If no data at all, show nothing
  if (!hasActions && !hasEvents && !hasAnnouncements && !hasTeacherEmails) {
    return null;
  }

  return (
    <div className="space-y-4 mb-6">
      {/* Action Items - Only show if there are any */}
      {hasActions && (
        <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <h3 className="font-semibold text-slate-800">Things To Do</h3>
          </div>
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
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Upcoming School Events */}
      {hasEvents && (
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-slate-800">School Events</h3>
          </div>
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
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Teacher Communications */}
      {hasTeacherEmails && (
        <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center gap-2 mb-3">
            <Mail className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-slate-800">From Teachers</h3>
          </div>
          <div className="space-y-2">
            {data.teacherEmails.map((email) => (
              <div
                key={email.id}
                className="p-3 bg-white/70 rounded-lg border border-green-200"
              >
                <p className="font-medium text-slate-800 text-sm">
                  {email.subject}
                </p>
                <p className="text-xs text-green-700 mt-1">
                  {email.teacher_name || email.from_name} · {formatDate(email.created_at)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Announcements */}
      {hasAnnouncements && (
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <div className="flex items-center gap-2 mb-3">
            <Megaphone className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold text-slate-800">Announcements</h3>
          </div>
          <div className="space-y-2">
            {data.announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="p-3 bg-white/70 rounded-lg border border-purple-200"
              >
                <p className="font-medium text-slate-800 text-sm">
                  {announcement.title}
                </p>
                <p className="text-xs text-purple-700 mt-1">
                  {announcement.source} · {formatDate(announcement.created_at)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
