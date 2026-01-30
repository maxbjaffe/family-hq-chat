// Time-of-day aware greetings and positivity quotes for kids

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export function getGreeting(name: string): string {
  const time = getTimeOfDay();
  switch (time) {
    case 'morning':
      return `Good morning, ${name}!`;
    case 'afternoon':
      return `Hey ${name}!`;
    case 'evening':
      return `Good evening, ${name}!`;
    case 'night':
      return `Hey there, ${name}!`;
  }
}

const morningQuotes = [
  "You've got the power to make today amazing!",
  "Today is your day to shine!",
  "Ready to be awesome?",
  "The world is waiting for your greatness!",
  "Let's make some magic happen!",
  "You're going to do great things today!",
  "Rise and shine, superstar!",
  "Today's adventure awaits!",
  "You've got this!",
  "Time to show the world how awesome you are!",
  "Every day is a chance to be amazing!",
  "Your smile can light up the whole day!",
  "Dream big, start now!",
  "You're braver than you believe!",
  "Today is full of possibilities!",
  "Let's make today unforgettable!",
  "You're a champion in the making!",
  "The best is yet to come!",
  "Believe in yourself - you're incredible!",
  "Today's going to be legendary!",
];

const afternoonQuotes = [
  "Keep up the great work!",
  "You're doing awesome today!",
  "The best is yet to come!",
  "You're crushing it!",
  "Halfway there and going strong!",
  "Your hard work is paying off!",
  "Stay amazing!",
  "You make everything better!",
  "Keep that energy going!",
  "You're on fire today!",
  "Nothing can stop you!",
  "You're making great things happen!",
  "Keep being your awesome self!",
  "You're doing better than you know!",
  "Stay focused, stay fantastic!",
  "You're a rockstar!",
  "Keep shining bright!",
  "You've got superpowers!",
  "Amazing things are happening!",
  "You're making today count!",
];

const eveningQuotes = [
  "You rocked it today!",
  "Time to wind down, superstar!",
  "Hope you had an amazing day!",
  "You did great things today!",
  "Rest up for another awesome day!",
  "You should be proud of yourself!",
  "What a great day you had!",
  "You made today special!",
  "Sweet dreams await!",
  "Tomorrow's another adventure!",
  "You earned some relaxation!",
  "Great job today, champ!",
  "You're ending the day strong!",
  "Time to recharge those superpowers!",
  "You made today awesome!",
  "Relax and feel good about today!",
  "You're amazing, don't forget it!",
  "Another successful day!",
  "You bring joy to everyone!",
  "Sleep tight, dream big!",
];

const nightQuotes = [
  "Sweet dreams, superstar!",
  "Rest up for tomorrow's adventures!",
  "You're awesome, even when sleeping!",
  "Dream big tonight!",
  "Tomorrow's going to be great!",
  "Sleep well, champion!",
  "Recharge those superpowers!",
  "You did great today!",
  "Cozy up and relax!",
  "See you tomorrow for more fun!",
];

export function getRandomQuote(): string {
  const time = getTimeOfDay();
  let quotes: string[];

  switch (time) {
    case 'morning':
      quotes = morningQuotes;
      break;
    case 'afternoon':
      quotes = afternoonQuotes;
      break;
    case 'evening':
      quotes = eveningQuotes;
      break;
    case 'night':
      quotes = nightQuotes;
      break;
  }

  return quotes[Math.floor(Math.random() * quotes.length)];
}

// Color palettes for random rotation
export interface ColorPalette {
  name: string;
  background: string;
  accent: string;
}

export const colorPalettes: ColorPalette[] = [
  { name: 'Sunset', background: '#FFF5E6', accent: '#FF6B6B' },
  { name: 'Ocean', background: '#E6F7FF', accent: '#4ECDC4' },
  { name: 'Berry', background: '#F5E6FF', accent: '#9B59B6' },
  { name: 'Citrus', background: '#FFFBE6', accent: '#F39C12' },
  { name: 'Mint', background: '#E6FFF5', accent: '#2ECC71' },
];

export function getRandomPalette(): ColorPalette {
  return colorPalettes[Math.floor(Math.random() * colorPalettes.length)];
}

// Decorative elements configuration
export interface DecorativeElement {
  emoji: string;
  position: string; // Tailwind classes for positioning
  size: string; // Tailwind text size class
  rotation: string; // Tailwind rotation class
}

export const decorativeElements: DecorativeElement[] = [
  { emoji: '⚡', position: 'top-2 left-3', size: 'text-lg', rotation: '-rotate-12' },
  { emoji: '✨', position: 'top-3 left-1/3', size: 'text-base', rotation: 'rotate-6' },
  { emoji: '💖', position: 'top-2 right-4', size: 'text-xl', rotation: 'rotate-12' },
  { emoji: '🎊', position: 'top-1/2 -translate-y-1/2 left-2', size: 'text-base', rotation: '-rotate-6' },
  { emoji: '😊', position: 'bottom-3 right-6', size: 'text-lg', rotation: 'rotate-6' },
  { emoji: '⚡', position: 'bottom-2 right-1/4', size: 'text-base', rotation: '-rotate-12' },
  { emoji: '💖', position: 'bottom-3 left-1/4', size: 'text-base', rotation: 'rotate-12' },
];
