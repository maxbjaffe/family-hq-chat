// Birthday facts utility - loads pre-generated facts and selects randomly

import birthdayFactsData from './data/birthday-facts.json';

export interface BirthdayFact {
  type: 'birthday' | 'event' | 'trivia';
  year?: number;
  text: string;
}

type BirthdayFactsData = Record<string, BirthdayFact[]>;

// Static import - data is bundled at build time, always available
const factsData: BirthdayFactsData = birthdayFactsData as BirthdayFactsData;

/**
 * Format date as MM-DD key for lookup
 */
function formatDateKey(month: number, day: number): string {
  return `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

/**
 * Get a random fact for a given date
 * @param month 1-12
 * @param day 1-31
 */
export function getRandomFact(month: number, day: number): BirthdayFact | null {
  const key = formatDateKey(month, day);
  const dateFacts = factsData[key];

  if (!dateFacts || dateFacts.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * dateFacts.length);
  return dateFacts[randomIndex];
}

/**
 * Get a random fact from a birthday string (YYYY-MM-DD format)
 */
export function getRandomFactFromBirthday(birthday: string): BirthdayFact | null {
  try {
    const parts = birthday.split('-');
    if (parts.length !== 3) return null;

    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    if (isNaN(month) || isNaN(day)) return null;

    return getRandomFact(month, day);
  } catch {
    return null;
  }
}

/**
 * Format a fact for display with type-specific emoji prefix
 */
export function formatFact(fact: BirthdayFact): string {
  switch (fact.type) {
    case 'birthday':
      return fact.year
        ? `🎂 Born today: ${fact.text} (${fact.year})`
        : `🎂 Born today: ${fact.text}`;
    case 'event':
      return fact.year
        ? `📅 On this day: ${fact.text} (${fact.year})`
        : `📅 On this day: ${fact.text}`;
    case 'trivia':
      return `🎉 Fun fact: ${fact.text}`;
    default:
      return fact.text;
  }
}
