export interface PlatformApp {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: string;
  color: string;
}

export const PLATFORM_APPS: PlatformApp[] = [
  {
    id: "focus-hub",
    name: "Focus Hub",
    description: "Productivity command center",
    url: "https://focus.maxjaffe.ai",
    icon: "Crosshair",
    color: "bg-blue-500",
  },
  {
    id: "family-hq",
    name: "Family HQ",
    description: "Family command center",
    url: "https://family.maxjaffe.ai",
    icon: "Home",
    color: "bg-emerald-500",
  },
  {
    id: "radar",
    name: "Radar",
    description: "Email intelligence",
    url: "https://radar.maxjaffe.ai",
    icon: "Radio",
    color: "bg-orange-500",
  },
  {
    id: "profile-hub",
    name: "Profile Hub",
    description: "Family profiles",
    url: "https://profiles.maxjaffe.ai",
    icon: "Users",
    color: "bg-violet-500",
  },
  {
    id: "the-unloader",
    name: "The Unloader",
    description: "Mental load manager",
    url: "https://unloader.maxjaffe.ai",
    icon: "Brain",
    color: "bg-rose-500",
  },
  {
    id: "giftstash",
    name: "GiftStash",
    description: "Gift tracking",
    url: "https://giftstash.app",
    icon: "Gift",
    color: "bg-pink-500",
  },
  {
    id: "study-buddy",
    name: "Study Buddy",
    description: "Photo flashcards",
    url: "https://study-buddy-iota-nine.vercel.app",
    icon: "BookOpen",
    color: "bg-amber-500",
  },
];

export const CURRENT_APP_ID = "family-hq";
