/**
 * Word lists for Break Time games (Wordle and Hangman)
 * Family-friendly vocabulary appropriate for all ages
 */

// =============================================================================
// Types
// =============================================================================

export type Difficulty = 'easy' | 'medium' | 'hard';

export type HangmanCategory = {
  name: string;
  words: string[];
};

export type HangmanDifficulty = {
  categories: HangmanCategory[];
};

// =============================================================================
// Wordle Words (all 5 letters)
// =============================================================================

/**
 * Wordle word lists by difficulty:
 * - Easy: 1st-2nd grade vocabulary, common letters (A, E, R, S, T, L, N)
 * - Medium: 3rd-4th grade vocabulary, broader letter usage
 * - Hard: 5th+ grade vocabulary, includes uncommon letters (Q, X, Z, J, V)
 */
export const WORDLE_WORDS: Record<Difficulty, string[]> = {
  easy: [
    // Common, simple words - 1st-2nd grade vocabulary
    'APPLE', 'HAPPY', 'SMILE', 'TREAT', 'BREAD', 'SLEEP', 'TREES', 'NAMES',
    'PAPER', 'PLANT', 'PLATE', 'TALES', 'TRAIN', 'SWEET', 'STEAL', 'STEAM',
    'STONE', 'STORE', 'STARE', 'START', 'STARS', 'SNAIL', 'SMALL', 'SMART',
    'SPELL', 'SPILL', 'SPLIT', 'SPORT', 'SPEAK', 'SPENT', 'STAND', 'STILL',
    'LEARN', 'LEAST', 'LEASE', 'LATER', 'LASER', 'LANES', 'LARGE', 'LATTE',
    'RATES', 'RATIO', 'RAISE', 'RAINS', 'REALS', 'RENTS', 'RESET', 'RESTS',
    'TESTS', 'TENTS', 'TEENS', 'TEARS', 'TELLS', 'TILES', 'TIMES', 'TIRES',
    'EATER', 'EATEN', 'EARNS', 'EARTH', 'EASEL', 'ENTER', 'ELITE', 'EQUAL',
    'SALES', 'SAILS', 'SAINT', 'SALTS', 'SENSE', 'SEATS', 'SEALS', 'SEEDS',
    'AUNTS', 'NAILS', 'NAMES', 'NEARS', 'NEEDS', 'NESTS', 'NOTES', 'NOISE',
    'ALERT', 'ALLEN', 'ALTER', 'AREAS', 'ARISE', 'AROSE', 'ASSET', 'ATLAS',
    'TABLE', 'TASTE', 'TEASE', 'THESE', 'TITLE', 'TOAST', 'TOOLS', 'TOTAL',
    'HOUSE', 'HORSE', 'HELLO', 'HEART', 'HELPS', 'HILLS', 'HINTS', 'HOLDS',
    'BOATS', 'BOOKS', 'BOOTS', 'BONUS', 'BOXES', 'BRAIN', 'BRAND', 'BRIEF',
    'CATCH', 'CAUSE', 'CHAIN', 'CHAIR', 'CHART', 'CHASE', 'CHEAP', 'CHECK',
    'DANCE', 'DATES', 'DEALS', 'DEPTH', 'DOORS', 'DOUBT', 'DRAFT', 'DRAIN',
    'FACES', 'FACTS', 'FAILS', 'FAITH', 'FALSE', 'FAULT', 'FEAST', 'FEELS',
    'GAMES', 'GATES', 'GIRLS', 'GIFTS', 'GIVES', 'GLASS', 'GRADE', 'GRAND',
    'LIGHT', 'LINES', 'LISTS', 'LIVED', 'LUNCH', 'LUCKY', 'LIMIT', 'LINKS',
    'MAGIC', 'MATCH', 'METAL', 'MINOR', 'MIXED', 'MODEL', 'MONTH', 'MOUNT',
  ],

  medium: [
    // 3rd-4th grade vocabulary with broader letter usage
    'BRAVE', 'FROST', 'GLOBE', 'CHARM', 'DWARF', 'FLAME', 'GHOST', 'GRAPE',
    'BRUSH', 'CLIMB', 'CROWN', 'CRUSH', 'DRAFT', 'DREAM', 'DRIFT', 'DRINK',
    'FLASH', 'FLOAT', 'FLOOD', 'FLOUR', 'FLOWN', 'FLUID', 'FLUSH', 'FORCE',
    'FRESH', 'FRUIT', 'GIANT', 'GLORY', 'GRACE', 'GRAIN', 'GRAND', 'GRASP',
    'GRASS', 'GRAVE', 'GREAT', 'GREEN', 'GREET', 'GRIEF', 'GRILL', 'GRIND',
    'GROSS', 'GROUP', 'GROVE', 'GROWL', 'GROWN', 'GUARD', 'GUESS', 'GUEST',
    'GUIDE', 'GUILT', 'HABIT', 'HARSH', 'HASTE', 'HAUNT', 'HAVEN', 'HEARD',
    'HEAVY', 'HEDGE', 'HENCE', 'HONOR', 'HORSE', 'HOTEL', 'HOUND', 'HUMAN',
    'HUMOR', 'HURRY', 'IDEAL', 'IMAGE', 'INNER', 'INPUT', 'IRONY', 'ISSUE',
    'IVORY', 'JUDGE', 'KNOCK', 'KNOWN', 'LABOR', 'LAUGH', 'LAYER', 'LEARN',
    'LEGAL', 'LEMON', 'LEVEL', 'LEVER', 'LIVER', 'LOCAL', 'LOGIC', 'LOOSE',
    'LOVER', 'LOWER', 'LOYAL', 'LUNAR', 'LUNCH', 'MAKER', 'MANOR', 'MARCH',
    'MARSH', 'MATCH', 'MAYBE', 'MAYOR', 'MEANT', 'MEDAL', 'MEDIA', 'MELON',
    'MERCY', 'MERGE', 'MERIT', 'MERRY', 'MICRO', 'MIGHT', 'MINER', 'MINOR',
    'MINUS', 'MIXED', 'MODEL', 'MOIST', 'MORAL', 'MOTOR', 'MOTTO', 'MOUNT',
    'MOUSE', 'MOUTH', 'MOVED', 'MOVIE', 'MUDDY', 'MUSIC', 'NAKED', 'NAVAL',
    'NERVE', 'NEVER', 'NEWER', 'NEWLY', 'NIGHT', 'NINTH', 'NOBLE', 'NOISE',
    'NORTH', 'NOTCH', 'NOTED', 'NOVEL', 'NURSE', 'OCCUR', 'OCEAN', 'OFFER',
    'OLIVE', 'OMEGA', 'ONSET', 'OPERA', 'ORBIT', 'ORDER', 'OTHER', 'OUGHT',
    'OUTER', 'OUTDO', 'OWNED', 'OWNER', 'OXIDE', 'OZONE', 'PAINT', 'PANEL',
    'PANIC', 'PATCH', 'PAUSE', 'PEACE', 'PEARL', 'PENNY', 'PERCH', 'PERIL',
    'PHASE', 'PHONE', 'PHOTO', 'PIANO', 'PIECE', 'PILOT', 'PITCH', 'PIZZA',
    'PLACE', 'PLAIN', 'PLANE', 'PLANK', 'PLANS', 'PLANT', 'PLATE', 'PLAZA',
    'PLEAD', 'PLUMB', 'PLUME', 'PLUMP', 'PLUNK', 'POACH', 'POEMS', 'POLES',
    'POINT', 'POLAR', 'POLIO', 'PORCH', 'POUND', 'POWER', 'PRESS', 'PRICE',
  ],

  hard: [
    // 5th+ grade vocabulary with uncommon letters (Q, X, Z, J, V)
    'QUILT', 'PLAZA', 'JAZZY', 'VIVID', 'VOUCH', 'VEXED', 'TOXIC', 'BOXER',
    'QUOTA', 'QUASI', 'QUAKE', 'QUALM', 'QUEEN', 'QUERY', 'QUEST', 'QUEUE',
    'QUICK', 'QUIET', 'QUIRK', 'QUITE', 'JOKER', 'JOINT', 'JOUST', 'JOLLY',
    'JEWEL', 'JUDGE', 'JUICE', 'JUMBO', 'JUMPY', 'JUNKY', 'JUROR', 'JELLY',
    'VAGUE', 'VALID', 'VALOR', 'VALUE', 'VALVE', 'VAPOR', 'VAULT', 'VAUNT',
    'VEGAN', 'VENOM', 'VENUE', 'VERGE', 'VERSE', 'VIBES', 'VIDEO', 'VIGIL',
    'VILLA', 'VIOLA', 'VIPER', 'VIRAL', 'VIRUS', 'VISOR', 'VISTA', 'VITAL',
    'VOCAL', 'VODKA', 'VOGUE', 'VOICE', 'VOILA', 'VOLTS', 'VOMIT', 'VOTER',
    'VOWEL', 'XEROX', 'XYLEM', 'YACHT', 'YEARN', 'YEAST', 'YIELD', 'YOUNG',
    'YOUTH', 'ZEBRA', 'ZESTY', 'ZILCH', 'ZIPPY', 'ZONAL', 'ZONES', 'ZOMBI',
    'AXIAL', 'AXIOM', 'EXIST', 'EXILE', 'EXPAT', 'EXTRA', 'EXULT', 'FIXED',
    'FIXER', 'FOXES', 'HEXED', 'INDEX', 'LATEX', 'LAXER', 'BOXER', 'MAXIM',
    'MIXED', 'MIXER', 'NEXUS', 'OXIDE', 'PIXEL', 'PROXY', 'RELAX', 'REMIX',
    'SIXTH', 'SIXTY', 'TAXED', 'TAXES', 'TAXIC', 'TEXAS', 'TEXTS', 'VEXES',
    'WAXED', 'WAXES', 'AFFIX', 'ANNEX', 'EPOXY', 'AUXIN', 'BORAX', 'BOXED',
    'CIVIL', 'CRAVE', 'CURVE', 'DELVE', 'DIVER', 'DRIVE', 'ENVOY', 'EVADE',
    'EVENT', 'EVERY', 'EVICT', 'FAVOR', 'FEVER', 'FIVER', 'GIVEN', 'GIVER',
    'GLOVE', 'GRAVY', 'GRAVE', 'GROVE', 'HAVEN', 'HEAVY', 'HOVER', 'IVORY',
    'KNAVE', 'LARVA', 'LAVER', 'LEAVE', 'LEVEL', 'LEVER', 'LIVER', 'LOVER',
    'MAUVE', 'MOVIE', 'NAIVE', 'NAVAL', 'NAVEL', 'NERVE', 'NEVER', 'NOVEL',
  ],
};

// =============================================================================
// Hangman Words (varying lengths by difficulty)
// =============================================================================

/**
 * Hangman word lists by difficulty with category hints:
 * - Easy: 4-6 letters, 1st-2nd grade vocab, simple categories
 * - Medium: 6-8 letters, 3rd-4th grade vocab, broader categories
 * - Hard: 8+ letters, 5th+ grade vocab, challenging categories
 */
export const HANGMAN_WORDS: Record<Difficulty, HangmanDifficulty> = {
  easy: {
    categories: [
      {
        name: 'Animals',
        words: [
          'TOAD', 'WOLF', 'BIRD', 'FISH', 'FROG', 'DUCK', 'BEAR', 'DEER',
          'LION', 'PONY', 'GOAT', 'LAMB', 'SEAL', 'CRAB', 'MOTH', 'WORM',
          'BUNNY', 'MOUSE', 'SNAKE', 'TIGER', 'ZEBRA', 'HIPPO', 'PANDA',
          'PUPPY', 'KITTY', 'HORSE', 'SHARK', 'WHALE', 'EAGLE', 'PARROT',
        ],
      },
      {
        name: 'Food',
        words: [
          'APPLE', 'BREAD', 'CANDY', 'DONUT', 'GRAPE', 'LEMON', 'MANGO',
          'OLIVE', 'PEACH', 'PIZZA', 'SALAD', 'TOAST', 'WATER', 'JUICE',
          'CAKE', 'CORN', 'EGGS', 'MEAL', 'MILK', 'PEAR', 'RICE', 'SOUP',
          'TACO', 'BAGEL', 'BERRY', 'CHIPS', 'CREAM', 'HONEY', 'PASTA',
        ],
      },
      {
        name: 'Colors',
        words: [
          'RUBY', 'BLUE', 'PINK', 'GOLD', 'GRAY', 'CYAN', 'TEAL',
          'GREEN', 'BLACK', 'WHITE', 'BROWN', 'ORANGE', 'PURPLE', 'YELLOW',
          'PEACH', 'CORAL', 'IVORY', 'BEIGE', 'CREAM', 'OLIVE', 'SALMON',
        ],
      },
      {
        name: 'Family',
        words: [
          'MAMA', 'DADA', 'BABY', 'AUNT', 'UNCLE', 'PAPA', 'NANA',
          'TWIN', 'KIDS', 'FAMILY', 'SISTER', 'MOTHER', 'FATHER',
          'GRANNY', 'PARENT', 'COUSIN', 'NIECE', 'NEPHEW',
        ],
      },
    ],
  },

  medium: {
    categories: [
      {
        name: 'Wild Animals',
        words: [
          'GIRAFFE', 'DOLPHIN', 'PENGUIN', 'GORILLA', 'CHEETAH', 'PANTHER',
          'LEOPARD', 'BUFFALO', 'RACCOON', 'HAMSTER', 'OSTRICH', 'PEACOCK',
          'PELICAN', 'SEAGULL', 'LOBSTER', 'OCTOPUS', 'SEAHORSE', 'STARFISH',
          'MEERKAT', 'GAZELLE', 'ANTELOPE', 'FLAMINGO', 'CARDINAL', 'SPARROW',
        ],
      },
      {
        name: 'Healthy Food',
        words: [
          'SPINACH', 'BROCCOLI', 'CARROTS', 'CABBAGE', 'LETTUCE', 'AVOCADO',
          'ALMONDS', 'WALNUTS', 'OATMEAL', 'YOGURT', 'CHICKEN', 'SALMON',
          'QUINOA', 'GRANOLA', 'BANANA', 'BERRIES', 'ORANGES', 'CHERRIES',
          'PEPPERS', 'PUMPKIN', 'SQUASH', 'CUCUMBER', 'TOMATO', 'CELERY',
        ],
      },
      {
        name: 'Places',
        words: [
          'AIRPORT', 'LIBRARY', 'STADIUM', 'THEATER', 'MUSEUM', 'AQUARIUM',
          'HOSPITAL', 'PHARMACY', 'GROCERY', 'BAKERY', 'SCHOOL', 'COLLEGE',
          'CHURCH', 'TEMPLE', 'CASTLE', 'PALACE', 'VILLAGE', 'ISLAND',
          'MOUNTAIN', 'FOREST', 'DESERT', 'VALLEY', 'SEASHORE', 'HARBOR',
        ],
      },
      {
        name: 'Sports',
        words: [
          'SOCCER', 'TENNIS', 'HOCKEY', 'BOXING', 'BOWLING', 'SKATING',
          'SURFING', 'CYCLING', 'RUNNING', 'SWIMMING', 'DIVING', 'ARCHERY',
          'FENCING', 'ROWING', 'SAILING', 'SKIING', 'GOLFING', 'KARATE',
          'LACROSSE', 'SOFTBALL', 'BASEBALL', 'FOOTBALL', 'CURLING', 'JAVELIN',
        ],
      },
      {
        name: 'Weather',
        words: [
          'CLOUDY', 'STORMY', 'CHILLY', 'BREEZY', 'FROSTY', 'STEAMY', 'WARMTH',
          'THUNDER', 'OVERCAST', 'BLIZZARD', 'TORNADO', 'TYPHOON', 'RAINBOW',
          'DRIZZLE', 'HAILING', 'FREEZING', 'HUMIDITY', 'FORECAST', 'CLIMATE',
        ],
      },
      {
        name: 'Music',
        words: [
          'GUITAR', 'VIOLIN', 'TRUMPET', 'CLARINET', 'TROMBONE', 'BAGPIPE',
          'DRUMSET', 'CYMBALS', 'MARIMBA', 'MARACAS', 'UKULELE', 'MANDOLIN',
          'BONGOS', 'FIDDLER', 'BASSOON', 'CELLIST', 'PIANIST', 'ORGANIST',
          'MELODY', 'RHYTHM', 'HARMONY', 'CHORUS', 'LYRICS', 'CONCERT',
        ],
      },
    ],
  },

  hard: {
    categories: [
      {
        name: 'Science Terms',
        words: [
          'MOLECULE', 'ELECTRON', 'PARTICLE', 'ORGANISM', 'BACTERIA', 'CHROMOSOME',
          'MITOCHONDRIA', 'PHOTOSYNTHESIS', 'ECOSYSTEM', 'HYPOTHESIS', 'EXPERIMENT',
          'MICROSCOPE', 'TELESCOPE', 'LABORATORY', 'CHEMISTRY', 'CELLULAR', 'REACTION',
          'EQUATION', 'SOLUTION', 'VELOCITY', 'MOMENTUM', 'MAGNETISM', 'ELECTRICITY',
          'EVAPORATION', 'CONDENSATION', 'PRECIPITATION', 'OXIDATION', 'COMBUSTION',
        ],
      },
      {
        name: 'World Geography',
        words: [
          'AUSTRALIA', 'ANTARCTICA', 'CALIFORNIA', 'COLORADO', 'WASHINGTON',
          'ARGENTINA', 'VENEZUELA', 'INDONESIA', 'PHILIPPINES', 'BANGLADESH',
          'MEDITERRANEAN', 'CARIBBEAN', 'ATLANTIC', 'THAILAND', 'HIMALAYAS',
          'KILIMANJARO', 'MONGOLIA', 'PATAGONIA', 'MISSISSIPPI', 'PENINSULA',
          'ARCHIPELAGO', 'CONTINENT', 'HEMISPHERE', 'LONGITUDE', 'LATITUDE',
        ],
      },
      {
        name: 'Technology',
        words: [
          'COMPUTER', 'SOFTWARE', 'HARDWARE', 'DATABASE', 'ALGORITHM', 'PROCESSOR',
          'KEYBOARD', 'BLUETOOTH', 'WIRELESS', 'INTERNET', 'DOWNLOAD', 'STREAMING',
          'SMARTPHONE', 'APPLICATION', 'PROGRAMMING', 'ENCRYPTION', 'CYBERSECURITY',
          'ARTIFICIAL', 'INTELLIGENCE', 'AUTOMATION', 'ROBOTICS', 'SIMULATION',
          'HOLOGRAPHIC', 'SATELLITE', 'NAVIGATION', 'TELECOMMUNICATIONS',
        ],
      },
      {
        name: 'Nature and Environment',
        words: [
          'ATMOSPHERE', 'BIOSPHERE', 'RAINFOREST', 'SAVANNAH', 'GRASSLAND',
          'WOODLAND', 'PERMAFROST', 'VOLCANIC', 'GEOLOGICAL', 'EARTHQUAKE',
          'MUDSLIDE', 'AVALANCHE', 'WILDERNESS', 'CONSERVATION', 'BIODIVERSITY',
          'ENDANGERED', 'EXTINCTION', 'SUSTAINABLE', 'RENEWABLE', 'POLLUTION',
          'DEFORESTATION', 'REFORESTATION', 'MIGRATION', 'HIBERNATION', 'METAMORPHOSIS',
        ],
      },
      {
        name: 'Space and Astronomy',
        words: [
          'UNIVERSE', 'ASTRONOMY', 'ASTRONAUT', 'TELESCOPE', 'SATELLITE',
          'CONSTELLATION', 'SUPERNOVA', 'STARLIGHT', 'ASTEROID', 'METEORITE',
          'SPACECRAFT', 'SPACESHIP', 'ATMOSPHERE', 'STRATOSPHERE', 'THERMOSPHERE',
          'EXOSPHERE', 'GRAVITATIONAL', 'PLANETARY', 'INTERSTELLAR', 'EXTRATERRESTRIAL',
          'OBSERVATORY', 'PLANETARIUM', 'COSMOLOGY', 'CELESTIAL', 'BLACKHOLE',
        ],
      },
    ],
  },
};

// =============================================================================
// Word Search Words
// =============================================================================

/**
 * Word Search word lists by difficulty:
 * - Easy: 3-4 letter words, simple nouns
 * - Medium: 4-5 letter words, common vocabulary
 * - Hard: 5-7 letter words, challenging vocabulary
 */
export const WORD_SEARCH_WORDS: Record<Difficulty, string[]> = {
  easy: [
    'CAT', 'DOG', 'SUN', 'HAT', 'BED', 'CUP', 'RUN', 'FUN', 'MAP', 'PEN',
    'BAT', 'RAT', 'JAM', 'VAN', 'FAN', 'CAN', 'MAN', 'PAN', 'TAN', 'BUS',
    'BALL', 'TREE', 'BIRD', 'FISH', 'CAKE', 'MILK', 'BOOK', 'FROG', 'STAR', 'MOON',
    'BEAR', 'DUCK', 'KITE', 'RAIN', 'SNOW', 'LEAF', 'NEST', 'BOAT', 'SHIP', 'WAVE',
    'HAND', 'FOOT', 'NOSE', 'EYES', 'EARS', 'LIPS', 'TOES', 'HAIR', 'FACE', 'HEAD',
  ],
  medium: [
    'APPLE', 'BEACH', 'CHAIR', 'DANCE', 'EARTH', 'FLAME', 'GRAPE', 'HOUSE', 'IGLOO', 'JELLY',
    'KOALA', 'LEMON', 'MANGO', 'NURSE', 'OCEAN', 'PIANO', 'QUEEN', 'RIVER', 'SNAKE', 'TIGER',
    'UNCLE', 'VOICE', 'WATER', 'YOUTH', 'ZEBRA', 'BREAD', 'CLOUD', 'DREAM', 'FAIRY', 'GHOST',
    'HEART', 'JUICE', 'LAUGH', 'MAGIC', 'NIGHT', 'PAINT', 'QUIET', 'SMILE', 'TRAIN', 'WORLD',
    'BRAIN', 'CROWN', 'FROST', 'GIANT', 'HORSE', 'JEWEL', 'LIGHT', 'MOUSE', 'PLANT', 'STORM',
  ],
  hard: [
    'PLANET', 'GARDEN', 'FROZEN', 'CASTLE', 'DRAGON', 'FOREST', 'ISLAND', 'JUNGLE', 'KNIGHT', 'LADDER',
    'MONKEY', 'NATURE', 'ORANGE', 'PARROT', 'RABBIT', 'SILVER', 'TURKEY', 'VALLEY', 'WINDOW', 'YELLOW',
    'ANCHOR', 'BRIDGE', 'CANDLE', 'DESERT', 'EMPIRE', 'FLIGHT', 'GLOBAL', 'HARBOR', 'INSECT', 'JIGSAW',
    'KITTEN', 'LIZARD', 'MARBLE', 'NAPKIN', 'OYSTER', 'PEPPER', 'QUIVER', 'ROCKET', 'SPHINX', 'TURTLE',
    'UMPIRE', 'VELVET', 'WALRUS', 'ZOMBIE', 'BRANCH', 'SPLASH', 'STREAM', 'THRONE', 'VOYAGE', 'WIZARD',
  ],
};

/**
 * Get random words for Word Search puzzle
 */
export function getWordSearchWords(difficulty: Difficulty, count: number): string[] {
  const words = [...WORD_SEARCH_WORDS[difficulty]];
  const selected: string[] = [];

  for (let i = 0; i < count && words.length > 0; i++) {
    const index = Math.floor(Math.random() * words.length);
    selected.push(words.splice(index, 1)[0]);
  }

  return selected;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get a random word from a Wordle difficulty level
 */
export function getRandomWordleWord(difficulty: Difficulty): string {
  const words = WORDLE_WORDS[difficulty];
  return words[Math.floor(Math.random() * words.length)];
}

/**
 * Get a random word and category hint from a Hangman difficulty level
 */
export function getRandomHangmanWord(difficulty: Difficulty): { word: string; category: string } {
  const { categories } = HANGMAN_WORDS[difficulty];
  const category = categories[Math.floor(Math.random() * categories.length)];
  const word = category.words[Math.floor(Math.random() * category.words.length)];
  return { word, category: category.name };
}

/**
 * Validate that a word is valid for Wordle (5 letters, alphabetic)
 */
export function isValidWordleWord(word: string): boolean {
  return /^[A-Z]{5}$/.test(word.toUpperCase());
}
