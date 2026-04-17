"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CheckSquare, Battery, Gamepad2, CheckCircle2, Mic } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/Avatar";

interface FamilyMember {
  id: string;
  name: string;
  role: "admin" | "adult" | "kid" | "pet";
  avatar_url: string | null;
  has_checklist: boolean;
  stats?: {
    total: number;
    completed: number;
    remaining: number;
    isComplete: boolean;
  };
}

const SORT_ORDER = ["Riley", "Parker", "Devin", "Jaffe"];
const EXIT_TAP_COUNT = 5;
const EXIT_TAP_WINDOW = 3000;
const POLL_INTERVAL = 30_000;

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/kiosk", label: "Checklists", icon: CheckSquare },
  { href: "/recharge", label: "Recharge", icon: Battery },
  { href: "/games", label: "Breaktime", icon: Gamepad2 },
];

function sortMembers(a: FamilyMember, b: FamilyMember): number {
  const aIndex = SORT_ORDER.indexOf(a.name);
  const bIndex = SORT_ORDER.indexOf(b.name);
  if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
  if (aIndex !== -1) return -1;
  if (bIndex !== -1) return 1;
  return a.name.localeCompare(b.name);
}

function SidebarProgressRing({
  total,
  completed,
  isComplete,
}: {
  total: number;
  completed: number;
  isComplete: boolean;
}) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? completed / total : 0;
  const offset = circumference - progress * circumference;

  return (
    <svg
      viewBox="0 0 96 96"
      className="absolute inset-0 w-full h-full"
      style={{ transform: "rotate(-90deg)" }}
    >
      <circle
        cx="48"
        cy="48"
        r={radius}
        fill="none"
        stroke="rgba(0,0,0,0.05)"
        strokeWidth={3}
      />
      <circle
        cx="48"
        cy="48"
        r={radius}
        fill="none"
        stroke={isComplete ? "#10b981" : "#8b5cf6"}
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-700"
      />
    </svg>
  );
}

function SidebarAvatar({ member, isActive }: { member: FamilyMember; isActive: boolean }) {
  const isPet = member.role === "pet";
  const stats = member.stats;
  const isComplete = stats?.isComplete ?? false;

  return (
    <Link
      href={`/family/${member.name.toLowerCase()}`}
      className={`flex flex-col items-center gap-1 rounded-xl p-2 transition-all ${
        isActive
          ? "bg-purple-100 ring-2 ring-purple-400"
          : "hover:bg-slate-100"
      }`}
    >
      <div className="relative w-[72px] h-[72px]">
        {!isPet && stats && (
          <SidebarProgressRing
            total={stats.total}
            completed={stats.completed}
            isComplete={isComplete}
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <Avatar member={member} size="sm" />
        </div>
        {isComplete && (
          <div className="absolute -bottom-0.5 -right-0.5 z-10">
            <div className="bg-white rounded-full p-0.5">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            </div>
          </div>
        )}
      </div>
      <span className="font-bold text-xs text-slate-700 leading-tight">{member.name}</span>
      {isPet ? (
        <span className="text-[10px] text-amber-600">Good boy!</span>
      ) : stats && isComplete ? (
        <span className="text-[10px] text-green-600 font-medium">All done!</span>
      ) : stats ? (
        <span className="text-[10px] text-slate-500">
          {stats.completed}/{stats.total}
        </span>
      ) : null}
    </Link>
  );
}

export function KioskSidebar() {
  const pathname = usePathname();
  const logoTapTimesRef = useRef<number[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [checklistRes, familyRes] = await Promise.all([
        fetch("/api/checklist"),
        fetch("/api/admin/family"),
      ]);

      let kids: FamilyMember[] = [];
      if (checklistRes.ok) {
        const data = await checklistRes.json();
        kids = (data.members || []).map(
          (m: FamilyMember & { checklist?: unknown[] }) => ({
            id: m.id,
            name: m.name,
            role: m.role,
            avatar_url: m.avatar_url,
            has_checklist: true,
            stats: m.stats,
          })
        );
      }

      let pets: FamilyMember[] = [];
      if (familyRes.ok) {
        const familyData = await familyRes.json();
        pets = (familyData.members || [])
          .filter((m: FamilyMember) => m.role === "pet")
          .map((m: FamilyMember) => ({
            id: m.id,
            name: m.name,
            role: m.role,
            avatar_url: m.avatar_url,
            has_checklist: false,
          }));
      }

      setMembers([...kids, ...pets].sort(sortMembers));
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleLogoTap = useCallback(() => {
    const now = Date.now();
    logoTapTimesRef.current = logoTapTimesRef.current.filter(
      (time) => now - time < EXIT_TAP_WINDOW
    );
    logoTapTimesRef.current.push(now);

    if (logoTapTimesRef.current.length >= EXIT_TAP_COUNT) {
      logoTapTimesRef.current = [];
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(console.error);
      }
    }
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Sidebar */}
      <nav className="fixed left-0 top-0 bottom-0 w-48 bg-white border-r border-slate-200 flex flex-col z-[100]">
        {/* Logo */}
        <div className="p-3 border-b border-slate-200">
          <button
            onClick={handleLogoTap}
            className="flex items-center justify-center w-full"
          >
            <img
              src="/Images/JaffeFamilyHubLogo.PNG"
              alt="Jaffe Family Hub"
              className="w-12 h-12 rounded-xl object-cover shadow-lg border-2 border-white"
            />
          </button>
        </div>

        {/* Family avatars */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {members.map((member) => (
            <SidebarAvatar
              key={member.id}
              member={member}
              isActive={pathname.startsWith(`/family/${member.name.toLowerCase()}`)}
            />
          ))}

          {/* Jarvis — avatar-sized button below family members */}
          <Link
            href="/jarvis"
            className={`flex flex-col items-center gap-1 rounded-xl p-2 transition-all ${
              pathname.startsWith("/jarvis")
                ? "bg-purple-100 ring-2 ring-purple-400"
                : "hover:bg-slate-100"
            }`}
          >
            <div className="relative w-[72px] h-[72px]">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                  <Mic className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <span className="font-bold text-xs text-slate-700 leading-tight">Jarvis</span>
          </Link>
        </div>

        {/* Bottom nav icons */}
        <div className="border-t border-slate-200 p-2">
          <div className="flex items-center justify-around">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-center min-h-[48px] min-w-[48px] rounded-xl transition-all ${
                    active
                      ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                      : "text-slate-500 hover:bg-slate-100"
                  }`}
                  title={item.label}
                >
                  <Icon className="h-5 w-5" />
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Spacer to push content right */}
      <div className="w-48 flex-shrink-0" />
    </>
  );
}
