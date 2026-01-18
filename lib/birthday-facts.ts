// Birthday facts utility - loads pre-generated facts and selects randomly

export interface BirthdayFact {
  type: 'birthday' | 'event' | 'trivia';
  year?: number;
  text: string;
}

type BirthdayFactsData = Record<string, BirthdayFact[]>;

let factsCache: BirthdayFactsData | null = null;

/**
 * Load birthday facts from the static JSON file
 */
async function loadFacts(): Promise<BirthdayFactsData> {
  if (factsCache) return factsCache;

  try {
    const response = await fetch('/data/birthday-facts.json');
    if (!response.ok) {
      console.error('Failed to load birthday facts:', response.status);
      return {};
    }
    factsCache = await response.json();
    return factsCache || {};
  } catch (error) {
    console.error('Error loading birthday facts:', error);
    return {};
  }
}

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
export async function getRandomFact(month: number, day: number): Promise<BirthdayFact | null> {
  const facts = await loadFacts();
  const key = formatDateKey(month, day);
  const dateFacts = facts[key];

  if (!dateFacts || dateFacts.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * dateFacts.length);
  return dateFacts[randomIndex];
}

/**
 * Get a random fact from a birthday string (YYYY-MM-DD format)
 */
export async function getRandomFactFromBirthday(birthday: string): Promise<BirthdayFact | null> {
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
