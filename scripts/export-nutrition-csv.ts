/**
 * Export all nutrition_foods rows as CSV.
 *
 * Usage:
 *   export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/export-nutrition-csv.ts
 *
 * Outputs: docs/nutrition-foods.csv
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(
    'Missing SUPABASE_URL or SUPABASE_SERVICE_KEY. Set them in your environment or .env.local.'
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const OUTPUT_PATH = resolve(__dirname, '../docs/nutrition-foods.csv');

// ---------------------------------------------------------------------------
// CSV helpers
// ---------------------------------------------------------------------------

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('Fetching nutrition_foods from Supabase...');

  const { data, error } = await supabase
    .from('nutrition_foods')
    .select('*')
    .order('meal_categories')
    .order('name');

  if (error) {
    console.error('Error fetching foods:', error);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.error('No foods found in nutrition_foods table.');
    process.exit(1);
  }

  console.log(`Fetched ${data.length} foods.`);

  // Build CSV
  const header = 'id,name,emoji,meal_categories,protein_score,veggie_score,sugar_score,water_score,vitamin_score';

  const rows = data.map((food) => {
    const categories = Array.isArray(food.meal_categories)
      ? food.meal_categories.join('|')
      : String(food.meal_categories || '');

    return [
      food.id,
      escapeCsvField(food.name),
      escapeCsvField(food.emoji || ''),
      escapeCsvField(categories),
      food.protein_score,
      food.veggie_score,
      food.sugar_score,
      food.water_score,
      food.vitamin_score,
    ].join(',');
  });

  const csv = [header, ...rows].join('\n') + '\n';

  // Ensure docs/ directory exists
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });

  writeFileSync(OUTPUT_PATH, csv, 'utf-8');
  console.log(`Wrote ${rows.length} rows to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
