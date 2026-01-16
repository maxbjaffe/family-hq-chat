'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Bell,
  CheckCircle2,
  Circle,
  RefreshCw,
  Loader2,
  ArrowLeft,
  Calendar
} from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useUser } from '@/components/UserProvider';

interface Reminder {
  id: string;
  title: string;
  due_date: string | null;
  list_name: string | null;
  priority: number;
  is_completed: boolean;
}

function AlexSpaceContent() {
  const router = useRouter();
  const { userName, userId, logout } = useUser();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReminders = async () => {
    if (!userId) return;
    try {
      const response = await fetch(`/api/alex/reminders?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setReminders(data.reminders || []);
      }
    } catch (error) {
      console.error('Failed to fetch reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, [userId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchReminders();
    setRefreshing(false);
  };

  const handleExit = () => {
    logout();
    router.push('/dashboard');
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Group reminders by list
  const remindersByList = reminders.reduce((acc, reminder) => {
    const list = reminder.list_name || 'Reminders';
    if (!acc[list]) acc[list] = [];
    acc[list].push(reminder);
    return acc;
  }, {} as Record<string, Reminder[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-slate-50 to-pink-50/30">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={handleExit}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {userName}'s Space
              </h1>
              <p className="text-slate-600">Your reminders and lists</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="min-h-[44px]"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="p-4 text-center bg-gradient-to-br from-purple-50 to-white">
            <div className="text-3xl font-bold text-purple-600">{reminders.length}</div>
            <div className="text-sm text-slate-600">Active Reminders</div>
          </Card>
          <Card className="p-4 text-center bg-gradient-to-br from-pink-50 to-white">
            <div className="text-3xl font-bold text-pink-600">
              {reminders.filter(r => {
                if (!r.due_date) return false;
                const today = new Date().toISOString().split('T')[0];
                return r.due_date.split('T')[0] === today;
              }).length}
            </div>
            <div className="text-sm text-slate-600">Due Today</div>
          </Card>
        </div>

        {/* Reminders */}
        {loading ? (
          <Card className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-500" />
            <p className="mt-2 text-slate-600">Loading reminders...</p>
          </Card>
        ) : reminders.length === 0 ? (
          <Card className="p-8 text-center">
            <Bell className="h-12 w-12 mx-auto text-purple-300 mb-2" />
            <p className="text-lg font-medium text-slate-800">No reminders yet</p>
            <p className="text-slate-600 mt-1">
              Reminders from Apple Reminders will appear here once synced via Shortcuts.
            </p>
            <div className="mt-4 p-4 bg-purple-50 rounded-lg text-sm text-purple-800">
              <p className="font-medium">How to sync:</p>
              <p className="mt-1">Create an iOS Shortcut that sends your reminders to:</p>
              <code className="block mt-2 bg-white p-2 rounded text-xs">
                POST /api/shortcuts/reminders
              </code>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(remindersByList).map(([list, listReminders]) => (
              <div key={list}>
                <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  {list}
                  <span className="text-sm font-normal text-slate-500">
                    ({listReminders.length})
                  </span>
                </h2>
                <div className="space-y-2">
                  {listReminders.map((reminder) => (
                    <Card
                      key={reminder.id}
                      className="p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-3">
                        <Circle className="w-5 h-5 mt-0.5 text-purple-400" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800">{reminder.title}</p>
                          {reminder.due_date && (
                            <div className="flex items-center gap-1 mt-2 text-sm text-slate-500">
                              <Calendar className="w-4 h-4" />
                              {formatDate(reminder.due_date)}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AlexSpacePage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'adult']}>
      <AlexSpaceContent />
    </ProtectedRoute>
  );
}
