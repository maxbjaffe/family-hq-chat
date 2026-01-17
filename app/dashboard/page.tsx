'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Gamepad2 } from 'lucide-react';
import { CalendarWidget } from '@/components/widgets/CalendarWidget';
import { TasksWidget } from '@/components/widgets/TasksWidget';
import { SpaceCard } from '@/components/SpaceCard';
import { PinModal } from '@/components/PinModal';
import { useUser } from '@/components/UserProvider';
import { FamilyCards } from '@/components/FamilyCards';

export default function DashboardPage() {
  const router = useRouter();
  const { login, userName, isAuthenticated, logout } = useUser();
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

  const handlePinSuccess = (user: { id: string; name: string; role: 'admin' | 'adult' | 'kid' }) => {
    login(user.id, user.name, user.role);
    setPinModalOpen(false);
    if (pendingSpace) {
      router.push(`/${pendingSpace}`);
      setPendingSpace(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Family Dashboard
            </h1>
            <p className="text-slate-600">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          {isAuthenticated && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600">Logged in as {userName}</span>
              <button
                onClick={logout}
                className="text-sm text-purple-600 hover:text-purple-800 font-medium"
              >
                Exit
              </button>
            </div>
          )}
        </div>

        {/* Widgets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <CalendarWidget />
          <TasksWidget />
        </div>

        {/* Family Cards */}
        <div className="mb-6">
          <FamilyCards />
        </div>

        {/* Space Cards */}
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Personal Spaces</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            onClick={() => handleSpaceClick('kiosk', false)}
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
      </div>
    </div>
  );
}
