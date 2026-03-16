// Nutrition Tracker — Constants and Configuration

import type { AvatarState, MealCategory, NutrientKey } from './types';

// Daily target scores for each nutrient meter
export const DAILY_TARGETS: Record<NutrientKey, number> = {
  protein: 10,
  veggie: 8,
  sugar: 9,
  water: 10,
  vitamin: 8,
};

// Thresholds used by the avatar state engine (percentages)
export const THRESHOLDS = {
  FIZZY_SUGAR: 70,
  LOW_METER: 25,
  HIGH_METER: 60,
  PEBBLE_COUNT: 2,
} as const;

// Each glass of water adds this many points to the water meter
export const WATER_PER_GLASS = 1;

// Visual configuration for each nutrient meter
export const METER_CONFIG: Record<
  NutrientKey,
  {
    label: string;
    color: string;
    bgColor: string;
    emoji: string;
    inverse: boolean;
  }
> = {
  protein: {
    label: 'Protein',
    color: '#3b82f6',
    bgColor: '#dbeafe',
    emoji: '\u{1F357}', // chicken leg
    inverse: false,
  },
  veggie: {
    label: 'Veggies',
    color: '#22c55e',
    bgColor: '#dcfce7',
    emoji: '\u{1F966}', // broccoli
    inverse: false,
  },
  sugar: {
    label: 'Sugar',
    color: '#f97316',
    bgColor: '#ffedd5',
    emoji: '\u{1F36C}', // candy
    inverse: true,
  },
  water: {
    label: 'Water',
    color: '#06b6d4',
    bgColor: '#cffafe',
    emoji: '\u{1F4A7}', // droplet
    inverse: false,
  },
  vitamin: {
    label: 'Vitamins',
    color: '#eab308',
    bgColor: '#fef9c3',
    emoji: '\u2728', // sparkles
    inverse: false,
  },
};

// Avatar state descriptions and UI hints
export const AVATAR_STATE_CONFIG: Record<
  AvatarState,
  { label: string; message: string; needsBubble: boolean }
> = {
  sunbeam: {
    label: 'Sunbeam',
    message: 'Full power! Your character is glowing!',
    needsBubble: false,
  },
  glow: {
    label: 'Glow',
    message: 'Nice! Your character is growing strong today',
    needsBubble: false,
  },
  flicker: {
    label: 'Flicker',
    message: 'Almost there \u2014 your character could use a boost',
    needsBubble: true,
  },
  pebble: {
    label: 'Pebble',
    message: "Your character is sleepy \u2014 they're looking for fuel!",
    needsBubble: true,
  },
  fizzy: {
    label: 'Fizzy',
    message:
      'Whoa, your character has the zoomies! Maybe some protein to balance out?',
    needsBubble: true,
  },
};

// Map avatar state to its numbered file suffix
const AVATAR_STATE_NUMBER: Record<AvatarState, number> = {
  sunbeam: 1,
  fizzy: 2,
  glow: 3,
  flicker: 4,
  pebble: 5,
};

/**
 * Build the image path for a kid's avatar in a given state.
 *
 * Example: getAvatarStatePath('riley', 'glow')
 *   => '/Images/Avatars/states/riley/riley_state3_glow.png'
 */
export function getAvatarStatePath(kidName: string, state: AvatarState): string {
  const name = kidName.toLowerCase();
  const n = AVATAR_STATE_NUMBER[state];
  return `/Images/Avatars/states/${name}/${name}_state${n}_${state}.png`;
}

// Tab configuration for meal selection UI
export const MEAL_TABS: { key: MealCategory; label: string; emoji: string }[] = [
  { key: 'breakfast', label: 'Breakfast', emoji: '\u{1F305}' },  // sunrise
  { key: 'lunch', label: 'Lunch', emoji: '\u{1F96A}' },         // sandwich
  { key: 'dinner', label: 'Dinner', emoji: '\u{1F37D}\uFE0F' }, // plate with cutlery
  { key: 'snack', label: 'Snack', emoji: '\u{1F34E}' },         // apple
  { key: 'drink', label: 'Drink', emoji: '\u{1F964}' },         // cup with straw
];
