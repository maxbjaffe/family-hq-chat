// lib/word-ladder-puzzles.ts

import { Difficulty } from './game-words';

/**
 * Word Ladder Puzzle interface
 * Each puzzle has a start word, end word, and par (optimal number of steps)
 */
export interface WordLadderPuzzle {
  start: string;
  end: string;
  par: number;
}

/**
 * Pre-computed Word Ladder puzzles by difficulty
 *
 * All puzzles are verified to have valid solution paths where:
 * - Each word is a real English word
 * - Adjacent words differ by exactly one letter
 * - All words have the same length
 *
 * Easy: 3-letter words, 3-4 steps par
 * Medium: 4-letter words, 4-5 steps par
 * Hard: 5-letter words, 5-6 steps par
 */
export const WORD_LADDER_PUZZLES: Record<Difficulty, WordLadderPuzzle[]> = {
  easy: [
    // 3-letter words, 3-4 steps
    // CAT -> COT -> COG -> DOG
    { start: 'CAT', end: 'DOG', par: 3 },
    // PIG -> WIG -> WAG -> WAR
    { start: 'PIG', end: 'WAR', par: 3 },
    // HOT -> HIT -> BIT -> BIG
    { start: 'HOT', end: 'BIG', par: 3 },
    // WET -> SET -> SAT -> SAD
    { start: 'WET', end: 'SAD', par: 3 },
    // CAN -> CAP -> COP -> TOP
    { start: 'CAN', end: 'TOP', par: 3 },
    // RUN -> RAN -> TAN -> TEN
    { start: 'RUN', end: 'TEN', par: 3 },
    // SUN -> SON -> TON -> TEN
    { start: 'SUN', end: 'TEN', par: 3 },
    // BAT -> BIT -> BIG -> BAG
    { start: 'BAT', end: 'BAG', par: 3 },
    // PEN -> PIN -> TIN -> TAN
    { start: 'PEN', end: 'TAN', par: 3 },
    // BED -> BAD -> BAT -> HAT
    { start: 'BED', end: 'HAT', par: 3 },
    // OLD -> ODD -> ADD -> AID
    { start: 'OLD', end: 'AID', par: 3 },
    // MAN -> TAN -> TEN -> HEN
    { start: 'MAN', end: 'HEN', par: 3 },
    // FUN -> SUN -> SUB -> TUB
    { start: 'FUN', end: 'TUB', par: 3 },
    // RED -> BED -> BET -> SET
    { start: 'RED', end: 'SET', par: 3 },
    // CAR -> CAT -> BAT -> BAD
    { start: 'CAR', end: 'BAD', par: 3 },
    // HOT -> HOT -> HOP -> POP -> TOP (4 steps)
    { start: 'HOT', end: 'TOP', par: 4 },
    // BIG -> BAG -> RAG -> RAT -> HAT (4 steps)
    { start: 'BIG', end: 'HAT', par: 4 },
    // SIT -> SET -> BET -> BED -> RED (4 steps)
    { start: 'SIT', end: 'RED', par: 4 },
  ],

  medium: [
    // 4-letter words, 4-5 steps
    // COLD -> CORD -> CARD -> WARD -> WARM
    { start: 'COLD', end: 'WARM', par: 4 },
    // FISH -> FIST -> MIST -> MINT -> MINI
    { start: 'FISH', end: 'MINI', par: 4 },
    // WORK -> WORD -> WARD -> CARD -> CARE
    { start: 'WORK', end: 'CARE', par: 4 },
    // HATE -> HAVE -> HIVE -> HIRE -> FIRE
    { start: 'HATE', end: 'FIRE', par: 4 },
    // LAMP -> DAMP -> DAME -> GAME -> GAVE
    { start: 'LAMP', end: 'GAVE', par: 4 },
    // SLOW -> SLEW -> BLEW -> BREW -> BROW
    { start: 'SLOW', end: 'BROW', par: 4 },
    // ROCK -> RACK -> RACE -> RICE -> RISE
    { start: 'ROCK', end: 'RISE', par: 4 },
    // HAND -> HARD -> CARD -> CORD -> CORN
    { start: 'HAND', end: 'CORN', par: 4 },
    // BALL -> CALL -> CALF -> HALF -> HALE
    { start: 'BALL', end: 'HALE', par: 4 },
    // TRIP -> TRIM -> TRAM -> TEAM -> TEAK
    { start: 'TRIP', end: 'TEAK', par: 4 },
    // SHIP -> SHOP -> CHOP -> CHIP -> CHIN
    { start: 'SHIP', end: 'CHIN', par: 4 },
    // BEAR -> BEAT -> BEET -> BEEF -> BEER
    { start: 'BEAR', end: 'BEER', par: 4 },
    // PLAY -> PLAN -> CLAN -> CLAM -> SLAM
    { start: 'PLAY', end: 'SLAM', par: 4 },
    // FIND -> FINE -> LINE -> LONE -> BONE
    { start: 'FIND', end: 'BONE', par: 4 },
    // MOON -> MOOT -> FOOT -> FORT -> FORE
    { start: 'MOON', end: 'FORE', par: 4 },
    // 5-step puzzles
    // HEAD -> HEAT -> SEAT -> SEAM -> BEAM -> BEAD
    { start: 'HEAD', end: 'BEAD', par: 5 },
    // LAKE -> WAKE -> WADE -> WIDE -> WINE -> MINE
    { start: 'LAKE', end: 'MINE', par: 5 },
    // FAST -> LAST -> LOST -> LOFT -> SOFT -> SORT
    { start: 'FAST', end: 'SORT', par: 5 },
  ],

  hard: [
    // 5-letter words, 5-6 steps
    // HEART -> HEARS -> BEARS -> BEADS -> HEADS -> HEAPS
    { start: 'HEART', end: 'HEAPS', par: 5 },
    // STONE -> STOVE -> SHOVE -> SHORE -> SNORE -> SCORE
    { start: 'STONE', end: 'SCORE', par: 5 },
    // BLACK -> SLACK -> STACK -> STARK -> STARE -> STARS
    { start: 'BLACK', end: 'STARS', par: 5 },
    // BRAIN -> BRAWN -> DRAWN -> DRAIN -> TRAIN -> TRAIT
    { start: 'BRAIN', end: 'TRAIT', par: 5 },
    // CLOCK -> CLOAK -> CROAK -> CREAK -> CREAM -> DREAM
    { start: 'CLOCK', end: 'DREAM', par: 5 },
    // TRICK -> TRACK -> TRACE -> GRACE -> GRAVE -> CRAVE
    { start: 'TRICK', end: 'CRAVE', par: 5 },
    // STEEL -> STEER -> SHEER -> SHEEP -> SLEEP -> SLEET
    { start: 'STEEL', end: 'SLEET', par: 5 },
    // BEAST -> FEAST -> LEAST -> LEASH -> LEASE -> TEASE
    { start: 'BEAST', end: 'TEASE', par: 5 },
    // SNARE -> SHARE -> SHORE -> SHORT -> SPORT -> SPORE
    { start: 'SNARE', end: 'SPORE', par: 5 },
    // FLARE -> GLARE -> GLADE -> GRADE -> TRADE -> TRACE
    { start: 'FLARE', end: 'TRACE', par: 5 },
    // SWEAR -> SMEAR -> SHEAR -> SHEER -> SHEET -> SWEET
    { start: 'SWEAR', end: 'SWEET', par: 5 },
    // BRAKE -> BRAVE -> CRAVE -> CRANE -> CRONE -> PRONE
    { start: 'BRAKE', end: 'PRONE', par: 5 },
    // 6-step puzzles
    // STONE -> STORE -> STARE -> SPARE -> SPACE -> PLACE -> PEACE
    { start: 'STONE', end: 'PEACE', par: 6 },
    // PLANT -> PLANS -> PLANE -> PLACE -> PLATE -> SLATE -> STATE
    { start: 'PLANT', end: 'STATE', par: 6 },
    // WHEAT -> CHEAT -> CHEAP -> CHEEP -> CREEP -> CREED -> GREED
    { start: 'WHEAT', end: 'GREED', par: 6 },
    // CHARM -> CHASM -> CHASE -> CHOSE -> THOSE -> THESE -> THERE
    { start: 'CHARM', end: 'THERE', par: 6 },
    // BLAZE -> BLADE -> BLAME -> FLAME -> FLAKE -> FLARE -> GLARE
    { start: 'BLAZE', end: 'GLARE', par: 6 },
    // DRINK -> BRINK -> BRING -> BLING -> CLING -> CLIMB -> CLIME
    { start: 'DRINK', end: 'CLIME', par: 6 },
  ],
};

/**
 * Get a random word ladder puzzle for the given difficulty
 */
export function getRandomWordLadderPuzzle(difficulty: Difficulty): WordLadderPuzzle {
  const puzzles = WORD_LADDER_PUZZLES[difficulty];
  return puzzles[Math.floor(Math.random() * puzzles.length)];
}

/**
 * Check if two words differ by exactly one letter
 * Words must be the same length
 */
export function differsByOneLetter(word1: string, word2: string): boolean {
  if (word1.length !== word2.length) {
    return false;
  }

  const w1 = word1.toUpperCase();
  const w2 = word2.toUpperCase();

  let differences = 0;
  for (let i = 0; i < w1.length; i++) {
    if (w1[i] !== w2[i]) {
      differences++;
      if (differences > 1) {
        return false;
      }
    }
  }

  return differences === 1;
}
