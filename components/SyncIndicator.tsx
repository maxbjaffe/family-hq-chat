"use client";

import { useEffect, useState } from "react";
import { Cloud, CloudOff, Loader2, Check } from "lucide-react";

type SyncStatus = "synced" | "syncing" | "offline" | "error";

interface SyncIndicatorProps {
  className?: string;
}

// Global sync state management
let syncListeners: ((status: SyncStatus) => void)[] = [];
let currentSyncCount = 0;
let isOnline = typeof window !== "undefined" ? navigator.onLine : true;

export function startSync() {
  currentSyncCount++;
  notifyListeners("syncing");
}

export function endSync(success = true) {
  currentSyncCount = Math.max(0, currentSyncCount - 1);
  if (currentSyncCount === 0) {
    notifyListeners(success && isOnline ? "synced" : isOnline ? "error" : "offline");
  }
}

function notifyListeners(status: SyncStatus) {
  syncListeners.forEach((listener) => listener(status));
}

// Wrapper for fetch that tracks sync state
export async function syncedFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  startSync();
  try {
    const response = await fetch(input, init);
    endSync(response.ok);
    return response;
  } catch (error) {
    endSync(false);
    throw error;
  }
}

export function SyncIndicator({ className = "" }: SyncIndicatorProps) {
  const [status, setStatus] = useState<SyncStatus>("synced");
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Subscribe to sync updates
    const listener = (newStatus: SyncStatus) => {
      setStatus(newStatus);
      if (newStatus === "synced") {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      }
    };
    syncListeners.push(listener);

    // Online/offline detection
    const handleOnline = () => {
      isOnline = true;
      if (currentSyncCount === 0) setStatus("synced");
    };
    const handleOffline = () => {
      isOnline = false;
      setStatus("offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial state
    if (!navigator.onLine) {
      setStatus("offline");
    }

    return () => {
      syncListeners = syncListeners.filter((l) => l !== listener);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const statusConfig = {
    synced: {
      icon: showSuccess ? Check : Cloud,
      text: showSuccess ? "Saved" : "Synced",
      color: "text-green-600",
      bg: "bg-green-100",
    },
    syncing: {
      icon: Loader2,
      text: "Syncing",
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    offline: {
      icon: CloudOff,
      text: "Offline",
      color: "text-orange-600",
      bg: "bg-orange-100",
    },
    error: {
      icon: CloudOff,
      text: "Error",
      color: "text-red-600",
      bg: "bg-red-100",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${config.bg} ${config.color} ${className}`}
    >
      <Icon
        className={`h-3.5 w-3.5 ${status === "syncing" ? "animate-spin" : ""}`}
      />
      <span className="hidden sm:inline">{config.text}</span>
    </div>
  );
}
