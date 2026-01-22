"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CheckSquare, Gamepad2, Maximize, MessageCircle } from "lucide-react";
import { useCallback, useRef, useState, useEffect } from "react";
import { SyncIndicator } from "./SyncIndicator";
import { HeaderClock } from "./Clock";

// Detect if running in iframe
function useIsEmbedded() {
  const [isEmbedded, setIsEmbedded] = useState(false);
  useEffect(() => {
    try {
      setIsEmbedded(window.self !== window.top);
    } catch {
      setIsEmbedded(true);
    }
  }, []);
  return isEmbedded;
}

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/kiosk", label: "Checklists", icon: CheckSquare },
  { href: "/games", label: "Breaktime", icon: Gamepad2 },
];

// Secret exit: tap logo 5 times in 3 seconds
const EXIT_TAP_COUNT = 5;
const EXIT_TAP_WINDOW = 3000;

export function Navigation() {
  const pathname = usePathname();
  const logoTapTimesRef = useRef<number[]>([]);
  const isEmbedded = useIsEmbedded();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  // Handle secret logo tap to exit kiosk/fullscreen
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

  const enterFullscreen = useCallback(() => {
    // Check if fullscreen is available (not in iframe or restricted)
    if (document.fullscreenEnabled) {
      document.documentElement.requestFullscreen().catch(console.error);
    } else {
      console.log("Fullscreen not available in this browser context");
    }
  }, []);

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 w-20 lg:w-56 bg-white border-r border-slate-200 flex-col z-50">
        {/* Logo - much larger, tappable for secret exit */}
        <div className="p-4 lg:p-5 border-b border-slate-200">
          <button
            onClick={handleLogoTap}
            className="flex items-center justify-center w-full"
          >
            <img
              src="/Images/JaffeFamilyHubLogo.PNG"
              alt="Jaffe Family Hub"
              className="w-16 h-16 lg:w-24 lg:h-24 rounded-2xl object-cover shadow-xl border-2 border-white"
            />
          </button>
        </div>

        {/* Nav Items - 50px minimum height for touch targets */}
        <div className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 min-h-[50px] rounded-xl transition-all ${
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

        {/* Footer with fullscreen button - hidden when embedded in iframe */}
        {!isEmbedded && (
          <div className="p-3 border-t border-slate-200 space-y-2">
            <button
              onClick={enterFullscreen}
              className="w-full flex items-center justify-center gap-2 min-h-[48px] px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition-all"
              title="Enter Kiosk Mode"
            >
              <Maximize className="h-5 w-5" />
              <span className="hidden lg:block text-sm font-medium">Kiosk Mode</span>
            </button>
          </div>
        )}
      </nav>

      {/* Mobile Bottom Nav - larger touch targets */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 safe-area-bottom">
        <div className="flex justify-around items-center py-1">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[56px] rounded-xl transition-all ${
                  active ? "text-purple-600" : "text-slate-500"
                }`}
              >
                <div
                  className={`p-2.5 rounded-xl transition-all ${
                    active
                      ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                      : ""
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Top bar for mobile - shows clock and sync status */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-sm border-b border-slate-200 z-40 flex items-center justify-between px-4">
        <button
          onClick={handleLogoTap}
          className="min-h-[48px] min-w-[48px] flex items-center justify-center -ml-2"
        >
          <img
            src="/Images/JaffeFamilyHubLogo.PNG"
            alt="Jaffe Family Hub"
            className="w-10 h-10 rounded-xl object-cover shadow-md"
          />
        </button>
        <div className="flex items-center gap-3">
          <HeaderClock />
          <SyncIndicator />
          {/* Hide fullscreen button when embedded in iframe */}
          {!isEmbedded && (
            <button
              onClick={enterFullscreen}
              className="min-h-[48px] min-w-[48px] flex items-center justify-center -mr-2"
              title="Enter Kiosk Mode"
            >
              <Maximize className="h-5 w-5 text-slate-500" />
            </button>
          )}
        </div>
      </div>

      {/* Spacer for fixed nav */}
      <div className="hidden md:block w-20 lg:w-56 flex-shrink-0" />
      {/* Mobile top spacer */}
      <div className="md:hidden h-14" />
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
