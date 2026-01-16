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
