'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from './UserProvider';
import { PinModal } from './PinModal';
import { LoadingSpinner } from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'adult' | 'kid')[];
  requiredUserId?: string;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  requiredUserId
}: ProtectedRouteProps) {
  const router = useRouter();
  const { userId, userRole, isAuthenticated, login } = useUser();
  const [showPinModal, setShowPinModal] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // If not authenticated, show PIN modal
    if (!isAuthenticated) {
      setShowPinModal(true);
      setChecking(false);
      return;
    }

    // Check role permissions
    if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
      router.push('/dashboard');
      return;
    }

    // Check specific user requirement
    if (requiredUserId && userId !== requiredUserId) {
      router.push('/dashboard');
      return;
    }

    setChecking(false);
  }, [isAuthenticated, userRole, userId, allowedRoles, requiredUserId, router]);

  const handlePinSuccess = (user: { id: string; name: string; role: 'admin' | 'adult' | 'kid' }) => {
    login(user.id, user.name, user.role);
    setShowPinModal(false);
  };

  const handlePinCancel = () => {
    router.push('/dashboard');
  };

  if (showPinModal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 flex items-center justify-center">
        <PinModal
          isOpen={true}
          onSuccess={handlePinSuccess}
          onCancel={handlePinCancel}
          title="Enter your PIN"
        />
      </div>
    );
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
