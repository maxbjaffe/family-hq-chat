/**
 * Seed the nutrition_foods table with the full food database.
 *
 * Usage: npx tsx scripts/seed-nutrition-foods.ts
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables
 * (reads from .env.local automatically via dotenv if present).
 */

import { createClient } from '@supabase/supabase-js';
import { FOOD_DATABASE } from '../lib/nutrition/food-data';

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

const BATCH_SIZE = 25;

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`Seeding ${FOOD_DATABASE.length} foods into nutrition_foods...`);

  // Clear existing rows
  console.log('Clearing existing nutrition_foods rows...');
  const { error: deleteError } = await supabase
    .from('nutrition_foods')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // delete all rows (Supabase requires a filter)

  if (deleteError) {
    console.error('Error clearing existing foods:', deleteError);
    process.exit(1);
  }
  console.log('Cleared.');

  // Insert in batches
  let inserted = 0;
  for (let i = 0; i < FOOD_DATABASE.length; i += BATCH_SIZE) {
    const batch = FOOD_DATABASE.slice(i, i + BATCH_SIZE);

    const rows = batch.map((food) => ({
      name: food.name,
      emoji: food.emoji,
      meal_categories: food.meal_categories,
      protein_score: food.protein_score,
      veggie_score: food.veggie_score,
      sugar_score: food.sugar_score,
      water_score: food.water_score,
      vitamin_score: food.vitamin_score,
    }));

    const { error } = await supabase.from('nutrition_foods').insert(rows);

    if (error) {
      console.error(`Error inserting batch at index ${i}:`, error);
      process.exit(1);
    }

    inserted += batch.length;
    console.log(`  Inserted ${inserted}/${FOOD_DATABASE.length}`);
  }

  console.log(`Done! ${inserted} foods seeded successfully.`);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
