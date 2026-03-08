export type BoardLogoType =
  | 'lunch-menu'
  | 'class-schedule'
  | 'class-specials'
  | 'general-calendar'
  | 'general-doc'
  | 'spirit-week';

export interface BoardLogo {
  type: BoardLogoType;
  label: string;
  imagePath: string;
}

export const BOARD_LOGOS: BoardLogo[] = [
  { type: 'lunch-menu', label: 'Lunch Menu', imagePath: '/Images/board-logos/lunch-menu.png' },
  { type: 'class-schedule', label: 'Class Schedule', imagePath: '/Images/board-logos/class-schedule.png' },
  { type: 'class-specials', label: 'Class Specials', imagePath: '/Images/board-logos/class-specials.png' },
  { type: 'general-calendar', label: 'General Calendar', imagePath: '/Images/board-logos/general-calendar.png' },
  { type: 'general-doc', label: 'General Doc', imagePath: '/Images/board-logos/general-doc.png' },
  { type: 'spirit-week', label: 'Spirit Week', imagePath: '/Images/board-logos/spirit-week.png' },
];

const DEFAULT_LOGO = BOARD_LOGOS.find(l => l.type === 'general-doc')!;

export function getLogoByType(type: string | null | undefined): BoardLogo {
  if (!type) return DEFAULT_LOGO;
  return BOARD_LOGOS.find(l => l.type === type) ?? DEFAULT_LOGO;
}
