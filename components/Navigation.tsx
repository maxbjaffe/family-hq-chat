"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  CheckSquare,
  MessageSquare,
  Paintbrush,
  Calendar,
  Settings,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/kiosk", label: "Checklists", icon: CheckSquare },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/doodle", label: "Doodle", icon: Paintbrush },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/admin", label: "Admin", icon: Settings },
];

export function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 w-20 lg:w-56 bg-white border-r border-slate-200 flex-col z-50">
        {/* Logo */}
        <div className="p-4 border-b border-slate-200">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/Images/JaffeFamilyHubLogo.PNG"
              alt="Jaffe Family Hub"
              className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl object-cover"
            />
            <span className="hidden lg:block font-bold text-lg bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Family Hub
            </span>
          </Link>
        </div>

        {/* Nav Items */}
        <div className="flex-1 p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                  active
                    ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon className="h-6 w-6 flex-shrink-0" />
                <span className="hidden lg:block font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200">
          <div className="hidden lg:block text-xs text-slate-400 text-center">
            Family Dashboard
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 safe-area-bottom">
        <div className="flex justify-around items-center py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg min-w-[60px] transition-all ${
                  active
                    ? "text-purple-600"
                    : "text-slate-500"
                }`}
              >
                <div
                  className={`p-2 rounded-xl transition-all ${
                    active
                      ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                      : ""
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Spacer for fixed nav */}
      <div className="hidden md:block w-20 lg:w-56 flex-shrink-0" />
    </>
  );
}

export function NavigationWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
    </div>
  );
}
