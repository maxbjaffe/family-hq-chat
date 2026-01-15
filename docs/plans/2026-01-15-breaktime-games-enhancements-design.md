# Break Time Games Enhancements Design

## Overview

Enhance Wordle and Hangman games with difficulty levels, expanded word lists, and visual improvements to Hangman.

## Difficulty Selection UI

Both games add a difficulty selector shown before the game starts:

- Three large, tappable buttons: Easy (green), Medium (yellow/orange), Hard (red/purple)
- Each shows difficulty name with subtitle ("Perfect for younger players", etc.)
- Selecting a difficulty immediately starts the game
- "Play Again" keeps same difficulty; "Change Difficulty" link returns to selection

## Wordle Changes

### Word Lists by Difficulty

- **Easy** (~150 words): 1st-2nd grade, common letters (A, E, R, S, T, L, N). Examples: APPLE, HAPPY, SMILE
- **Medium** (~200 words): 3rd-4th grade, broader letters. Examples: BRAVE, FROST, JUNGLE
- **Hard** (~150 words): 5th+ grade, includes Q, X, Z, J, V. Examples: QUILT, PLAZA, JAZZY

### Word Validation

- Check guesses against dictionary of valid 5-letter words (~8,000-10,000 words)
- Invalid word shows gentle message: "Hmm, try a real word!" with shake animation
- Guess not submitted; user keeps editing
- Dictionary stored client-side as Set for O(1) lookup

## Hangman Changes

### Word Lists by Difficulty

**Easy** (~150 words):
- 4-6 letters, 1st-2nd grade vocabulary
- Simple categories: Animals (CAT, DOG), Food (APPLE), Colors, Family
- Examples: BUNNY, HAPPY, SUNNY, BREAD

**Medium** (~200 words):
- 6-8 letters, 3rd-4th grade vocabulary
- Categories: Animals, Food, Places, Sports, Weather, Music
- Examples: GIRAFFE, DOLPHIN, RAINBOW, BICYCLE

**Hard** (~150 words):
- 8+ letters, 5th+ grade vocabulary, uncommon letters
- Categories: Science, Geography, Technology, Nature, Space
- Examples: BUTTERFLY, TELESCOPE, ASTRONAUT

Category hints get more specific at harder levels (e.g., "Ocean Animals" vs just "Animals").

### Visual Redesign

**Character Rotation** - Three types randomly selected each game:

1. **Cute Animals** (warm palette: soft oranges, pinks, browns)
   - Bunny, puppy, or kitten
   - Progression: happy → ears droop → sleepy eyes → yawns → sits → lies down → asleep with "ZZZ"
   - Win: jumps excited with sparkles

2. **Robots** (metallic palette: silvers, blues, teals)
   - Fully powered robot with glowing lights
   - Progression: antenna dims → screen flickers → arm droops → other arm → legs buckle → powers down "LOW BATTERY"
   - Win: lights flash, does a dance

3. **Friendly Monsters** (playful palette: purples, greens, magentas)
   - Big cheerful blob monster
   - Progression: shrinks each wrong guess, expression happy → uncertain → worried → sad → tiny/pouty
   - Win: grows back big with huge grin

**No gallows** - characters stand on simple platform or float.

## Technical Structure

```
lib/
  game-words.ts         # All word lists (Wordle + Hangman by difficulty)
  valid-words.ts        # Dictionary of valid 5-letter words

components/games/
  WordleGame.tsx        # Add difficulty prop, validation logic
  HangmanGame.tsx       # Add difficulty prop, character system
  DifficultySelect.tsx  # Shared difficulty picker component
  hangman-characters/
    AnimalCharacter.tsx
    RobotCharacter.tsx
    MonsterCharacter.tsx
```

### State Flow

1. User clicks game from menu → shows DifficultySelect
2. User picks difficulty → game component renders with difficulty prop
3. "Play Again" keeps same difficulty
4. "Change Difficulty" returns to DifficultySelect
