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
                aria-label="Exit personal space"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          )}
          {userRole === 'admin' && (
            <Link
              href="/admin"
              className="text-gray-400 hover:text-gray-600"
              aria-label="Settings"
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
