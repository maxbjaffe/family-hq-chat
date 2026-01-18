// Zodiac sign utility - pure date math, no API calls

export interface ZodiacInfo {
  sign: string;
  symbol: string;
  trait: string;
}

interface ZodiacData {
  sign: string;
  symbol: string;
  trait: string;
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
}

const ZODIAC_SIGNS: ZodiacData[] = [
  { sign: 'Capricorn', symbol: '♑', trait: 'Ambitious & disciplined', startMonth: 12, startDay: 22, endMonth: 1, endDay: 19 },
  { sign: 'Aquarius', symbol: '♒', trait: 'Independent & original', startMonth: 1, startDay: 20, endMonth: 2, endDay: 18 },
  { sign: 'Pisces', symbol: '♓', trait: 'Compassionate & intuitive', startMonth: 2, startDay: 19, endMonth: 3, endDay: 20 },
  { sign: 'Aries', symbol: '♈', trait: 'Bold & energetic', startMonth: 3, startDay: 21, endMonth: 4, endDay: 19 },
  { sign: 'Taurus', symbol: '♉', trait: 'Patient & reliable', startMonth: 4, startDay: 20, endMonth: 5, endDay: 20 },
  { sign: 'Gemini', symbol: '♊', trait: 'Curious & adaptable', startMonth: 5, startDay: 21, endMonth: 6, endDay: 20 },
  { sign: 'Cancer', symbol: '♋', trait: 'Nurturing & protective', startMonth: 6, startDay: 21, endMonth: 7, endDay: 22 },
  { sign: 'Leo', symbol: '♌', trait: 'Confident & creative', startMonth: 7, startDay: 23, endMonth: 8, endDay: 22 },
  { sign: 'Virgo', symbol: '♍', trait: 'Analytical & helpful', startMonth: 8, startDay: 23, endMonth: 9, endDay: 22 },
  { sign: 'Libra', symbol: '♎', trait: 'Balanced & harmonious', startMonth: 9, startDay: 23, endMonth: 10, endDay: 22 },
  { sign: 'Scorpio', symbol: '♏', trait: 'Passionate & resourceful', startMonth: 10, startDay: 23, endMonth: 11, endDay: 21 },
  { sign: 'Sagittarius', symbol: '♐', trait: 'Adventurous & optimistic', startMonth: 11, startDay: 22, endMonth: 12, endDay: 21 },
];

/**
 * Get zodiac sign info for a given month and day
 * @param month 1-12
 * @param day 1-31
 */
export function getZodiacSign(month: number, day: number): ZodiacInfo {
  for (const zodiac of ZODIAC_SIGNS) {
    // Handle Capricorn which spans Dec-Jan
    if (zodiac.startMonth > zodiac.endMonth) {
      if (
        (month === zodiac.startMonth && day >= zodiac.startDay) ||
        (month === zodiac.endMonth && day <= zodiac.endDay)
      ) {
        return { sign: zodiac.sign, symbol: zodiac.symbol, trait: zodiac.trait };
      }
    } else {
      if (
        (month === zodiac.startMonth && day >= zodiac.startDay) ||
        (month === zodiac.endMonth && day <= zodiac.endDay) ||
        (month > zodiac.startMonth && month < zodiac.endMonth)
      ) {
        return { sign: zodiac.sign, symbol: zodiac.symbol, trait: zodiac.trait };
      }
    }
  }

  // Fallback (should never happen with valid dates)
  return { sign: 'Unknown', symbol: '?', trait: '' };
}

/**
 * Get zodiac sign from a birthday string (YYYY-MM-DD format)
 */
export function getZodiacFromBirthday(birthday: string): ZodiacInfo | null {
  try {
    const parts = birthday.split('-');
    if (parts.length !== 3) return null;

    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    if (isNaN(month) || isNaN(day)) return null;

    return getZodiacSign(month, day);
  } catch {
    return null;
  }
}
