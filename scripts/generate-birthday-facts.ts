/**
 * Generate birthday facts using Claude API
 *
 * Usage: npx tsx scripts/generate-birthday-facts.ts
 *
 * Requires CLAUDE_API_KEY environment variable
 */

import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';

interface BirthdayFact {
  type: 'birthday' | 'event' | 'trivia';
  year?: number;
  text: string;
}

type BirthdayFactsData = Record<string, BirthdayFact[]>;

const MONTHS = [
  { name: 'January', days: 31 },
  { name: 'February', days: 29 }, // Include leap day
  { name: 'March', days: 31 },
  { name: 'April', days: 30 },
  { name: 'May', days: 31 },
  { name: 'June', days: 30 },
  { name: 'July', days: 31 },
  { name: 'August', days: 31 },
  { name: 'September', days: 30 },
  { name: 'October', days: 31 },
  { name: 'November', days: 30 },
  { name: 'December', days: 31 },
];

function formatDateKey(month: number, day: number): string {
  return `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

async function generateFactsForDates(
  client: Anthropic,
  dates: { month: number; day: number; monthName: string }[]
): Promise<Record<string, BirthdayFact[]>> {
  const dateList = dates.map(d => `${d.monthName} ${d.day}`).join(', ');

  const prompt = `Generate fun facts for these dates: ${dateList}

For EACH date, provide exactly 15 facts in this JSON format:
{
  "MM-DD": [
    { "type": "birthday", "year": 1985, "text": "Famous Person Name, brief description" },
    { "type": "event", "year": 1969, "text": "Brief description of historical event" },
    { "type": "trivia", "text": "It's National Something Day!" }
  ]
}

Requirements:
- 5 famous birthdays (celebrities, historical figures, athletes, artists)
- 5 historical events (significant moments in history)
- 5 fun trivia (national days, quirky facts, interesting observations about the date)
- Keep descriptions concise (under 10 words for birthdays, under 15 for events)
- Include the year for birthdays and events
- Mix serious and fun content
- Use MM-DD format for keys (e.g., "01-15" for January 15)

Return ONLY valid JSON, no other text.`;

  const response = await client.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = response.content.find(block => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  try {
    // Extract JSON from response (in case there's any surrounding text)
    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Failed to parse response:', textBlock.text.substring(0, 500));
    throw error;
  }
}

async function main() {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    console.error('Error: CLAUDE_API_KEY environment variable is required');
    process.exit(1);
  }

  const client = new Anthropic({ apiKey });
  const allFacts: BirthdayFactsData = {};

  // Generate all dates
  const allDates: { month: number; day: number; monthName: string }[] = [];
  MONTHS.forEach((monthData, monthIndex) => {
    const month = monthIndex + 1;
    for (let day = 1; day <= monthData.days; day++) {
      allDates.push({ month, day, monthName: monthData.name });
    }
  });

  console.log(`Generating facts for ${allDates.length} dates...`);

  // Process in batches of 5 dates to stay within token limits
  const batchSize = 5;
  const totalBatches = Math.ceil(allDates.length / batchSize);

  for (let i = 0; i < allDates.length; i += batchSize) {
    const batch = allDates.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;

    console.log(`Processing batch ${batchNum}/${totalBatches}: ${batch.map(d => `${d.monthName} ${d.day}`).join(', ')}`);

    try {
      const batchFacts = await generateFactsForDates(client, batch);
      Object.assign(allFacts, batchFacts);

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Error processing batch ${batchNum}:`, error);
      // Continue with next batch
    }
  }

  // Verify we got facts for all dates
  const missingDates: string[] = [];
  allDates.forEach(({ month, day }) => {
    const key = formatDateKey(month, day);
    if (!allFacts[key] || allFacts[key].length === 0) {
      missingDates.push(key);
    }
  });

  if (missingDates.length > 0) {
    console.warn(`Warning: Missing facts for ${missingDates.length} dates:`, missingDates.slice(0, 10));
  }

  // Write output
  const outputPath = path.join(process.cwd(), 'public', 'data', 'birthday-facts.json');

  // Ensure directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(allFacts, null, 2));

  const stats = {
    totalDates: Object.keys(allFacts).length,
    totalFacts: Object.values(allFacts).reduce((sum, facts) => sum + facts.length, 0),
    fileSizeKB: Math.round(fs.statSync(outputPath).size / 1024),
  };

  console.log('\n✓ Generation complete!');
  console.log(`  Dates: ${stats.totalDates}`);
  console.log(`  Total facts: ${stats.totalFacts}`);
  console.log(`  File size: ${stats.fileSizeKB}KB`);
  console.log(`  Output: ${outputPath}`);
}

main().catch(console.error);
