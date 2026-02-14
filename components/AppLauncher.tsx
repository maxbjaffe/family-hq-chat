"use client";

import { useState, useEffect, useRef } from "react";
import {
  LayoutGrid,
  Crosshair,
  Home,
  Radio,
  Users,
  Brain,
  Gift,
  BookOpen,
  ExternalLink,
} from "lucide-react";
import { PLATFORM_APPS, CURRENT_APP_ID } from "@/lib/platform-apps";
import type { PlatformApp } from "@/lib/platform-apps";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Crosshair,
  Home,
  Radio,
  Users,
  Brain,
  Gift,
  BookOpen,
};

function AppIcon({ app }: { app: PlatformApp }) {
  const Icon = ICON_MAP[app.icon] || Users;
  return (
    <div
      className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${app.color}`}
    >
      <Icon className="w-5 h-5" />
    </div>
  );
}

export function AppLauncher() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`p-2 rounded-lg transition-colors ${
          open
            ? "bg-violet-100 text-violet-700"
            : "hover:bg-slate-100 text-slate-500"
        }`}
        title="Apps"
      >
        <LayoutGrid className="w-5 h-5" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 p-4 z-50">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3 px-1">
            Jaffe Platform
          </h3>
          <div className="grid grid-cols-3 gap-1">
            {PLATFORM_APPS.map((app) => {
              const isCurrent = app.id === CURRENT_APP_ID;
              return (
                <a
                  key={app.id}
                  href={app.url}
                  target={isCurrent ? undefined : "_blank"}
                  rel={isCurrent ? undefined : "noopener noreferrer"}
                  onClick={
                    isCurrent
                      ? (e) => {
                          e.preventDefault();
                          setOpen(false);
                        }
                      : undefined
                  }
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl text-center transition-all group ${
                    isCurrent
                      ? "bg-violet-50 ring-1 ring-violet-200"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <AppIcon app={app} />
                  <span className="text-xs font-medium text-gray-900 leading-tight">
                    {app.name}
                  </span>
                  {!isCurrent && (
                    <ExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
