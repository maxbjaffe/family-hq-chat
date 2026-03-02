// Kids Recharge Menu — constants and configuration

export type RechargeCategory = "energy" | "calm" | "creative" | "fun";
export type RechargeDuration = (typeof DURATIONS)[number];

export const CATEGORY_CONFIG = {
  energy: {
    label: "Energy",
    gradient: "from-rose-50 to-rose-100",
    accent: "from-rose-400 to-rose-500",
    text: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
    pill: "bg-rose-100 text-rose-700",
    icon: "\uD83D\uDD25",
  },
  calm: {
    label: "Calm",
    gradient: "from-sky-50 to-sky-100",
    accent: "from-sky-400 to-sky-500",
    text: "text-sky-700",
    bg: "bg-sky-50",
    border: "border-sky-200",
    pill: "bg-sky-100 text-sky-700",
    icon: "\uD83C\uDF0A",
  },
  creative: {
    label: "Creative",
    gradient: "from-amber-50 to-amber-100",
    accent: "from-amber-400 to-amber-500",
    text: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    pill: "bg-amber-100 text-amber-700",
    icon: "\u2728",
  },
  fun: {
    label: "Fun",
    gradient: "from-violet-50 to-violet-100",
    accent: "from-violet-400 to-violet-500",
    text: "text-violet-700",
    bg: "bg-violet-50",
    border: "border-violet-200",
    pill: "bg-violet-100 text-violet-700",
    icon: "\uD83C\uDFAE",
  },
} as const;

export const DURATIONS = [5, 10, 15, 30] as const;

export const DURATION_LABELS: Record<RechargeDuration, string> = {
  5: "5 min",
  10: "10 min",
  15: "15 min",
  30: "30 min",
};

export const DURATION_DESCRIPTIONS: Record<RechargeDuration, string> = {
  5: "Quick Reset",
  10: "Real Reset",
  15: "Bigger Break",
  30: "Full Reset",
};

export const ENCOURAGEMENT_MESSAGES = [
  "You're doing amazing! Keep going!",
  "Almost there, superstar!",
  "Your brain is thanking you right now!",
  "This is YOUR time. Enjoy it!",
  "Deep breaths... you've got this!",
  "Recharging in progress... batteries filling up!",
  "You're going to feel so good after this!",
  "Taking breaks makes you STRONGER, not weaker!",
  "Even superheroes need to recharge!",
  "Your future self is high-fiving you right now!",
] as const;

export const CELEBRATION_MESSAGES = [
  "You did it! Fully recharged and ready to go!",
  "Break complete! You're a recharge champion!",
  "Amazing job taking care of yourself!",
  "Recharged and ready to crush it!",
  "That was awesome! Your brain says THANK YOU!",
] as const;
