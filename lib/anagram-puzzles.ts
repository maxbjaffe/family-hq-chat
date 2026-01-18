// lib/anagram-puzzles.ts

import { Difficulty } from './game-words';

export interface AnagramPuzzle {
  letters: string;
  words: string[];  // All valid words 3+ letters that can be formed
  minWords: number; // Target number of words to find
}

/**
 * Pre-computed anagram puzzles
 * Each puzzle has scrambled letters and all valid 3+ letter words
 *
 * Easy: 5 letters, target 3 words
 * Medium: 6 letters, target 5 words
 * Hard: 7 letters, target 7 words
 */
export const ANAGRAM_PUZZLES: Record<Difficulty, AnagramPuzzle[]> = {
  easy: [
    // 5-letter puzzles, find 3 words
    {
      letters: 'RATES',
      words: ['RATES', 'STARE', 'TEARS', 'ASTER', 'TARES', 'STAR', 'RATS', 'EARS', 'EATS', 'SEAT', 'TEAS', 'SATE', 'ETAS', 'ARES', 'ARTS', 'TARS', 'ATE', 'EAT', 'ERA', 'EAR', 'SAT', 'SET', 'TAR', 'TEA', 'ARE', 'ART', 'SEA', 'RES'],
      minWords: 3
    },
    {
      letters: 'STONE',
      words: ['STONE', 'TONES', 'NOTES', 'ONSET', 'SETON', 'NOSE', 'ONES', 'TONE', 'NOTE', 'TENS', 'NETS', 'NEST', 'SENT', 'TOES', 'SNOT', 'SET', 'SON', 'TON', 'TEN', 'NET', 'NOT', 'TOE', 'ONE', 'SOT'],
      minWords: 3
    },
    {
      letters: 'BREAD',
      words: ['BREAD', 'BEARD', 'BARED', 'DEBAR', 'ARDEB', 'BARE', 'BEAR', 'READ', 'DEAR', 'DARE', 'BRED', 'BEAD', 'DRAB', 'BRAD', 'BAR', 'BAD', 'BED', 'RED', 'ERA', 'EAR', 'ARE', 'DAB', 'RAD', 'REB'],
      minWords: 3
    },
    {
      letters: 'HEART',
      words: ['HEART', 'EARTH', 'HATER', 'RATHE', 'HEAT', 'HATE', 'HEAR', 'RATE', 'TEAR', 'HARE', 'EAT', 'ATE', 'ERA', 'EAR', 'HAT', 'ART', 'TAR', 'TEA', 'THE', 'HER', 'RAT', 'ETA', 'ARE', 'RET', 'ETH'],
      minWords: 3
    },
    {
      letters: 'LOOPS',
      words: ['LOOPS', 'SLOOP', 'POOLS', 'SPOOL', 'POLO', 'POOL', 'LOOP', 'SOLO', 'OOPS', 'SLOP', 'POLS', 'LOPS', 'LOO', 'SOP', 'SOL'],
      minWords: 3
    },
    {
      letters: 'CLEAN',
      words: ['CLEAN', 'LANCE', 'ANCLE', 'LANE', 'LEAN', 'LACE', 'CLAN', 'CANE', 'ACNE', 'ELAN', 'CAN', 'ACE', 'ALE', 'ANE', 'LEA'],
      minWords: 3
    },
    {
      letters: 'SMILE',
      words: ['SMILE', 'SLIME', 'LIMES', 'MILES', 'MISLE', 'LIME', 'MILE', 'SLIM', 'ELMS', 'ISLE', 'LIES', 'LEIS', 'SEMI', 'MISE', 'ELM', 'LIE', 'LEI', 'MIL', 'ELS'],
      minWords: 3
    },
    {
      letters: 'PAINT',
      words: ['PAINT', 'PINTA', 'INAPT', 'PATIN', 'PINT', 'PAIN', 'PANT', 'ANTI', 'PITA', 'NIPA', 'TAIN', 'TAN', 'TAP', 'TIN', 'TIP', 'PAN', 'PAT', 'PIN', 'PIT', 'NAP', 'NIT', 'ANT', 'APT', 'AIT', 'NIP', 'TAI'],
      minWords: 3
    },
    {
      letters: 'MAPLE',
      words: ['MAPLE', 'AMPLE', 'PALM', 'PALE', 'MEAL', 'MALE', 'LAMP', 'LEAP', 'LAME', 'PLEA', 'PEAL', 'ALME', 'ALE', 'APE', 'ELM', 'LAP', 'MAP', 'PAL', 'PEA', 'AMP', 'LAM', 'LEA', 'MAL'],
      minWords: 3
    },
    {
      letters: 'SKATE',
      words: ['SKATE', 'STAKE', 'STEAK', 'TAKES', 'TEAKS', 'KETAS', 'SAKE', 'TAKE', 'SEAT', 'EATS', 'TEAS', 'TASK', 'TEAK', 'SATE', 'ETAS', 'KEAS', 'ATES', 'ATE', 'EAT', 'SAT', 'SET', 'TEA', 'ASK', 'SEA', 'ETA', 'KAT', 'TAE'],
      minWords: 3
    },
    {
      letters: 'TRACE',
      words: ['TRACE', 'CRATE', 'REACT', 'CATER', 'CARTE', 'RECTA', 'ACRE', 'CARE', 'RACE', 'CART', 'TARE', 'TEAR', 'RATE', 'AREC', 'ACE', 'ARC', 'ARE', 'ATE', 'CAR', 'CAT', 'EAR', 'EAT', 'ERA', 'ETA', 'RAT', 'REC', 'RET', 'TAR', 'TEA'],
      minWords: 3
    },
    {
      letters: 'LEMON',
      words: ['LEMON', 'MELON', 'LONE', 'MOLE', 'NOME', 'OMEN', 'LENO', 'MENO', 'NOEL', 'ENOL', 'MON', 'ONE', 'OLE', 'MEN', 'ELM', 'EON', 'MEL', 'NOM', 'MOL'],
      minWords: 3
    },
  ],

  medium: [
    // 6-letter puzzles, find 5 words
    {
      letters: 'PLATES',
      words: ['PLATES', 'PETALS', 'STAPLE', 'PALEST', 'PASTEL', 'PLEATS', 'SEPTAL', 'PLATE', 'PETAL', 'LEAPS', 'PASTE', 'TALES', 'STEAL', 'STALE', 'SLATE', 'LEAST', 'SPELT', 'SLEPT', 'SEPAL', 'LEAPT', 'TEPAL', 'PALES', 'PEALS', 'PLEAS', 'SALEP', 'LAPSE', 'SPALE', 'TAPES', 'PATES', 'PEATS', 'SEPTA', 'SPATE', 'LEAP', 'PALE', 'PEAL', 'PLEA', 'TALE', 'LATE', 'SALT', 'SEAL', 'SALE', 'SLAP', 'LAPS', 'PALS', 'ALPS', 'TAPS', 'PAST', 'PETS', 'STEP', 'PEST', 'PELT', 'LETS', 'LEST', 'SETA', 'EATS', 'TEAS', 'SEAT', 'SATE', 'ETAS', 'ATES'],
      minWords: 5
    },
    {
      letters: 'STREAM',
      words: ['STREAM', 'MASTER', 'ARMETS', 'MATERS', 'MATRES', 'RAMETS', 'SMEAR', 'MARES', 'REAMS', 'MATES', 'STEAM', 'MEATS', 'TEAMS', 'SMART', 'TRAMS', 'MARTS', 'TERMS', 'TAMER', 'ARMET', 'MATER', 'RAMET', 'MARS', 'ARMS', 'RATS', 'STAR', 'ARTS', 'TARS', 'MAST', 'MATS', 'TAMS', 'MATE', 'MEAT', 'TEAM', 'META', 'TRAM', 'MART', 'SEAM', 'SAME', 'MESA', 'MARE', 'REAM', 'EARS', 'ERAS', 'ARES', 'SEAR', 'SERA', 'RATE', 'TEAR', 'TARE', 'ETAS', 'REST', 'TERM'],
      minWords: 5
    },
    {
      letters: 'LISTEN',
      words: ['LISTEN', 'SILENT', 'TINSEL', 'ENLIST', 'INLETS', 'ELINTS', 'TILES', 'LINES', 'LIENS', 'ISLET', 'INLET', 'STILE', 'LENIS', 'NEIST', 'SENTI', 'STEIN', 'TINES', 'NITES', 'INSET', 'SLIT', 'LENS', 'LENT', 'LIST', 'LITE', 'LINE', 'LIEN', 'TILE', 'TIES', 'SINE', 'SITE', 'NEST', 'NETS', 'TENS', 'SENT', 'SILT', 'LEST', 'LETS', 'SNIT', 'NITS', 'TINS', 'LINT', 'LEIS', 'LIES', 'ISLE', 'NITE', 'TINE'],
      minWords: 5
    },
    {
      letters: 'ORANGE',
      words: ['ORANGE', 'ONAGER', 'ORANG', 'ANGER', 'RANGE', 'ORGAN', 'GROAN', 'ARGON', 'GONER', 'GENRO', 'ERGON', 'AGONE', 'OATER', 'ORATE', 'RAGE', 'RANG', 'GORE', 'GONE', 'GEAR', 'NEAR', 'EARN', 'OGRE', 'ERGO', 'GOER', 'AEON', 'AREG', 'GNAR', 'GRAN', 'GEAN', 'GAEN', 'NARE', 'AERO', 'AGON', 'ROAN', 'AGE', 'AGO', 'ARE', 'EAR', 'ERA', 'ERG', 'NAG', 'NOR', 'OAR', 'ONE', 'ORE', 'RAG', 'RAN', 'REG', 'ROE', 'GOA', 'GAN', 'GAR', 'GEN', 'EGO', 'EON'],
      minWords: 5
    },
    {
      letters: 'TRAVEL',
      words: ['TRAVEL', 'VARLET', 'LATER', 'ALTER', 'ALERT', 'RAVEL', 'LAVER', 'LAVRE', 'VELAR', 'ARTEL', 'TALER', 'RATEL', 'VALET', 'LATE', 'TALE', 'RATE', 'TEAR', 'TARE', 'RAVE', 'VALE', 'VEAL', 'VERT', 'LAVE', 'LEVA', 'EARL', 'LEAR', 'REAL', 'RALE', 'ATE', 'EAT', 'ERA', 'EAR', 'ART', 'TAR', 'TEA', 'VET', 'VAT', 'LET', 'ALE', 'LEA', 'LAT', 'LAV', 'RAT', 'RET', 'TAV', 'REV', 'AVE', 'ETA'],
      minWords: 5
    },
    {
      letters: 'GARDEN',
      words: ['GARDEN', 'DANGER', 'GANDER', 'RANGED', 'GRANDE', 'GRADE', 'GRAND', 'ANGER', 'RANGE', 'RAGED', 'DEAR', 'READ', 'DARE', 'RANG', 'DRAG', 'GRAD', 'NEAR', 'EARN', 'DEAN', 'DANE', 'RAND', 'NARD', 'DARN', 'AGER', 'GEAR', 'RAGE', 'AGED', 'EGAD', 'GADE', 'GNAR', 'GRAN', 'DANG', 'NERD', 'REND', 'DENE', 'DEN', 'END', 'AND', 'AGE', 'ARE', 'EAR', 'ERA', 'NAG', 'RAG', 'RAN', 'RED', 'GAR', 'GAN', 'REG', 'ERG', 'RAD', 'GAD', 'GED'],
      minWords: 5
    },
    {
      letters: 'THINGS',
      words: ['THINGS', 'NIGHTS', 'SIGHT', 'NIGHT', 'THING', 'HINTS', 'THINS', 'STING', 'TINGS', 'NIGHS', 'SHIN', 'THIS', 'THIN', 'HINT', 'SING', 'GINS', 'NITS', 'GIST', 'HITS', 'SIGH', 'NIGH', 'GITS', 'SNIT', 'TINS', 'GHIS', 'HIS', 'HIT', 'ITS', 'SIN', 'SIT', 'TIN', 'GIN', 'NIT', 'GIT', 'GHI', 'NTH'],
      minWords: 5
    },
    {
      letters: 'DREAMS',
      words: ['DREAMS', 'MADRES', 'DERMAS', 'DREAM', 'ARMED', 'DRAMS', 'DAMES', 'READS', 'DEARS', 'RASED', 'DARES', 'MARES', 'SMEAR', 'REAMS', 'DERMA', 'MADRE', 'DEAR', 'READ', 'DARE', 'SEAM', 'SAME', 'MESA', 'MADE', 'DAME', 'MARS', 'ARMS', 'RAMS', 'REDS', 'MEAD', 'DRAM', 'MARE', 'REAM', 'SADE', 'ARES', 'EARS', 'ERAS', 'SEAR', 'SERA', 'RADS', 'MAD', 'DAM', 'RED', 'ARE', 'EAR', 'ERA', 'ARM', 'RAM', 'SAD', 'SEA', 'RAD', 'REM', 'MED', 'ADS', 'MAS'],
      minWords: 5
    },
    {
      letters: 'BASKET',
      words: ['BASKET', 'BEAKS', 'BASTE', 'BEAST', 'BEATS', 'STAKE', 'STEAK', 'TAKES', 'TEAKS', 'ABETS', 'BATES', 'TABES', 'BETAS', 'BAKE', 'BEAK', 'BEAT', 'SAKE', 'TAKE', 'BASE', 'BEST', 'BETS', 'BATS', 'TASK', 'SEAT', 'EATS', 'TEAS', 'TABS', 'TEAK', 'KABS', 'KAES', 'KEAS', 'SABE', 'SATE', 'ETAS', 'ATES', 'SETA', 'ABET', 'BATE', 'BETA', 'ASK', 'ATE', 'BAT', 'BET', 'EAT', 'SAT', 'SET', 'TAB', 'TEA', 'SEA', 'ETA', 'KAT', 'TAE', 'KAB', 'KAS', 'TSK', 'SKA'],
      minWords: 5
    },
    {
      letters: 'PLANET',
      words: ['PLANET', 'PLATEN', 'PALNET', 'PLANT', 'PLANE', 'PANEL', 'LEANT', 'LATEN', 'PENAL', 'LEAPT', 'PETAL', 'PLATE', 'PLEAT', 'TEPAL', 'PLAN', 'PALE', 'PANE', 'LANE', 'LEAN', 'LATE', 'TALE', 'PELT', 'LENT', 'PANT', 'PLEA', 'PEAL', 'LEAP', 'TAPE', 'PEAT', 'PATE', 'NEAT', 'ANTE', 'ELAN', 'NAPE', 'NEAP', 'PEAN', 'TELA', 'PALET', 'PLAT', 'LEPT', 'ALE', 'ANT', 'APE', 'APT', 'ATE', 'EAT', 'LET', 'NAP', 'NET', 'PAL', 'PAN', 'PAT', 'PEA', 'PEN', 'PET', 'TAN', 'TAP', 'TEA', 'TEN', 'LEA', 'LAP', 'LAT', 'ETA', 'ANE', 'TAE', 'ELT', 'NAE'],
      minWords: 5
    },
    {
      letters: 'SPIDER',
      words: ['SPIDER', 'PRISED', 'PRIDES', 'REDIPS', 'SPIRED', 'PRIDE', 'PRIED', 'SPIED', 'SIPED', 'RIPED', 'RIPES', 'SPEIR', 'SPIRE', 'PRISE', 'PRIES', 'PIERS', 'PERIS', 'DRIES', 'RESID', 'RIDES', 'SIRED', 'DRIPS', 'RIDS', 'RIDE', 'DIRE', 'IRED', 'SIDE', 'DIES', 'IDES', 'REDS', 'REPS', 'PIED', 'PIER', 'RIPE', 'PERI', 'DRIP', 'DIPS', 'RID', 'RED', 'REP', 'PER', 'PIE', 'SIP', 'SIR', 'DIP', 'IRE', 'RES', 'SRI', 'PIS', 'PSI', 'PED', 'DIS', 'IDS'],
      minWords: 5
    },
    {
      letters: 'BLENDS',
      words: ['BLENDS', 'BLEND', 'BENDS', 'LENDS', 'DENS', 'SEND', 'ENDS', 'BEDS', 'BEND', 'LEND', 'BLED', 'SLED', 'DELS', 'ELDS', 'LENS', 'BELS', 'NEBS', 'SNEB', 'BENS', 'BED', 'BEN', 'DEN', 'END', 'LED', 'BEL', 'ELS', 'SEN', 'ELD', 'DEL', 'NEB'],
      minWords: 5
    },
  ],

  hard: [
    // 7-letter puzzles, find 7 words
    {
      letters: 'PAINTER',
      words: ['PAINTER', 'REPAINT', 'PERTAIN', 'PATRINE', 'TRAIN', 'PAINT', 'PRINT', 'INTER', 'INERT', 'TAPER', 'PRATE', 'IRATE', 'RETIN', 'TRINE', 'INTRA', 'RAPIN', 'PATIN', 'PINTA', 'TENIA', 'TINEA', 'ENTIA', 'TAPIR', 'ATRIP', 'RIPEN', 'REPIN', 'TRIPE', 'PEART', 'PATER', 'APTER', 'PIETA', 'ARPEN', 'PART', 'TRAP', 'RAPT', 'RAIN', 'PAIR', 'PINT', 'PIER', 'RIPE', 'PINE', 'TRIP', 'TIER', 'TIRE', 'RITE', 'REIN', 'RATE', 'TEAR', 'TARE', 'PEAR', 'REAP', 'RAPE', 'PARE', 'APER', 'NEAR', 'EARN', 'PANE', 'NAPE', 'NEAP', 'PEAN', 'PANT', 'ANTI', 'PAIN', 'PITA', 'PERI', 'PEIN', 'TERN', 'RENT', 'PENT', 'NITE', 'TINE'],
      minWords: 7
    },
    {
      letters: 'STORAGE',
      words: ['STORAGE', 'ORGEATS', 'GAROTES', 'TOGAS', 'GOATS', 'GROAT', 'GATOR', 'TOGAE', 'GATES', 'STAGE', 'GETAS', 'GREAT', 'GRATE', 'ERGOT', 'GOERS', 'GORES', 'OGRES', 'TORSE', 'STORE', 'ROTES', 'ROSET', 'TORES', 'STARE', 'RATES', 'ASTER', 'TEARS', 'TARES', 'RESAT', 'STOAE', 'TOEAS', 'OATER', 'ORATE', 'AROSE', 'TOGA', 'GOAT', 'GATE', 'GETA', 'STAR', 'RATS', 'TARS', 'ARTS', 'OARS', 'SOAR', 'SORT', 'ROTS', 'ORTS', 'TORS', 'TOGS', 'GROT', 'GORE', 'OGRE', 'ERGO', 'GOER', 'RAGE', 'SAGE', 'AGES', 'GAES', 'GARS', 'RAGS', 'RATE', 'TEAR', 'TARE', 'SATE', 'ETAS', 'EATS', 'TEAS', 'SEAT', 'SETA', 'ATES', 'OAST', 'OATS', 'TAOS', 'STOA', 'TOES', 'ROES', 'ORES', 'ROSE', 'SORE', 'TORE', 'ROTE'],
      minWords: 7
    },
    {
      letters: 'STRANGE',
      words: ['STRANGE', 'GARNETS', 'ARGENTS', 'GRANTS', 'ANGST', 'TANGS', 'GRANS', 'GNARS', 'STANG', 'ANGER', 'RANGE', 'GRATE', 'GREAT', 'TEARS', 'STARE', 'RATES', 'ASTER', 'AGENT', 'STAGE', 'GATES', 'GETAS', 'TRANS', 'RANTS', 'TARNS', 'ANTES', 'NATES', 'NEATS', 'STANE', 'SANER', 'SNARE', 'NEARS', 'EARNS', 'NARES', 'STERN', 'RENTS', 'TERNS', 'NERTS', 'RANT', 'ANTS', 'TANS', 'RANG', 'SANG', 'TANG', 'TAGS', 'RAGS', 'GNAT', 'NAGS', 'GANS', 'GENS', 'TENS', 'NETS', 'NEST', 'SENT', 'ERNS', 'RENT', 'TERN', 'GEAR', 'RAGE', 'AGES', 'GAES', 'GARS', 'RATE', 'TEAR', 'TARE', 'SATE', 'ETAS', 'EATS', 'TEAS', 'SEAT', 'SETA', 'ATES', 'EARS', 'ERAS', 'ARES', 'SEAR', 'SERA', 'NEAR', 'EARN', 'ANES', 'SANE', 'ANTE', 'NEAT'],
      minWords: 7
    },
    {
      letters: 'WONDERS',
      words: ['WONDERS', 'DOWNERS', 'WONDER', 'DOWNER', 'OWNERS', 'RESOWN', 'ROWENS', 'WORSEN', 'DROWSE', 'DOWERS', 'DOWSER', 'WORDS', 'SWORD', 'DOWNS', 'SWORN', 'ROWND', 'SNORED', 'SONDER', 'SORNED', 'DRONES', 'SNORE', 'SENOR', 'DRONE', 'NODES', 'NOSED', 'SONDE', 'NERDS', 'RENDS', 'SOWED', 'DEWS', 'WEDS', 'OWES', 'WOES', 'OWED', 'OWSE', 'DOES', 'DOSE', 'ODES', 'RODE', 'DOER', 'REDO', 'RODS', 'DORS', 'WORD', 'ROWS', 'WORN', 'OWNS', 'SNOW', 'SOWN', 'WONS', 'NOWS', 'DONS', 'NODS', 'DENS', 'ENDS', 'SEND', 'REND', 'NERD', 'ERNS', 'NODE', 'DONE', 'EONS', 'ONES', 'NOSE', 'SORE', 'ORES', 'ROES', 'ROSE', 'EROS'],
      minWords: 7
    },
    {
      letters: 'CHAPTER',
      words: ['CHAPTER', 'PATCHER', 'REPATCH', 'CHEAP', 'CHEAT', 'REACH', 'TEACH', 'THECA', 'CHARE', 'CHART', 'PARCH', 'PERCH', 'PATCH', 'RATCH', 'CHERT', 'RETCH', 'TRACE', 'CRATE', 'REACT', 'CARET', 'RECTA', 'HEART', 'EARTH', 'HATER', 'RATHE', 'CAPER', 'PACER', 'RECAP', 'CRAPE', 'PEART', 'TAPER', 'PRATE', 'PATER', 'APTER', 'THRAE', 'RAPT', 'TRAP', 'PART', 'CARE', 'RACE', 'ACRE', 'ARCH', 'CHAR', 'CHAT', 'TACH', 'EACH', 'ACHE', 'CAPE', 'PACE', 'HARE', 'HEAR', 'RHEA', 'HEAP', 'EPHA', 'REAP', 'PEAR', 'RAPE', 'PARE', 'APER', 'TAPE', 'PEAT', 'PATE', 'RATE', 'TEAR', 'TARE', 'HEAT', 'HATE', 'EATH', 'HAET', 'PATH', 'PHAT', 'HEPT', 'PECH', 'TECH', 'ETCH', 'CART'],
      minWords: 7
    },
    {
      letters: 'MONSTER',
      words: ['MONSTER', 'MENTORS', 'STORMEN', 'MENTOR', 'METROS', 'MONTES', 'SERMON', 'TRONES', 'STONER', 'TENSOR', 'TONERS', 'NESTOR', 'TENORS', 'STORE', 'TOMES', 'MOTES', 'SMOTE', 'MOSTE', 'TORSE', 'ROTES', 'ROSET', 'TORES', 'METRO', 'MORES', 'MORSE', 'OMERS', 'TERMS', 'TONER', 'TENOR', 'SNORE', 'SENOR', 'STONE', 'TONES', 'NOTES', 'ONSET', 'SETON', 'STERN', 'RENTS', 'TERNS', 'NERTS', 'NORMS', 'MORNS', 'MONTE', 'TOME', 'MOTE', 'MOST', 'STEM', 'TERM', 'REMS', 'SOME', 'OMEN', 'NOME', 'MENO', 'ORES', 'ROES', 'ROSE', 'SORE', 'EROS', 'TORE', 'ROTE', 'REST', 'ERST', 'RETS', 'NEST', 'TENS', 'NETS', 'SENT', 'ERNS', 'RENT', 'TERN', 'MORE', 'OMER', 'NORM', 'MORN', 'MONS', 'NOMS', 'MORT', 'SORT', 'ROTS', 'ORTS', 'TORS', 'SNOT', 'TONS', 'NOTE', 'TONE', 'EONS', 'ONES', 'NOSE'],
      minWords: 7
    },
    {
      letters: 'ISLANDS',
      words: ['ISLANDS', 'ISLAND', 'SNAILS', 'SLAIN', 'NAILS', 'SAILS', 'SISAL', 'SNAIL', 'LANDS', 'SANDS', 'DIALS', 'NAIDS', 'SLAID', 'DALIS', 'SLID', 'LIDS', 'LAND', 'SAND', 'SAIL', 'NAIL', 'DIAL', 'SAID', 'AIDS', 'DAIS', 'LAID', 'LADS', 'DALS', 'DINS', 'AILS', 'LAIN', 'ANIL', 'NILS', 'LINS', 'NIDS', 'AND', 'ADS', 'SAD', 'DAL', 'LAD', 'AID', 'DIS', 'IDS', 'LID', 'AIL', 'SIN', 'INS', 'NIS', 'ANI', 'AIS', 'ALS', 'LAS', 'SAL'],
      minWords: 7
    },
    {
      letters: 'CREDITS',
      words: ['CREDITS', 'DIRECTS', 'CREDIT', 'DIRECT', 'CIDERS', 'DICERS', 'SCRIED', 'TRICED', 'CISTED', 'EDICTS', 'DIREST', 'DRIEST', 'STRIDE', 'CRIED', 'DICES', 'CIDER', 'DICER', 'RICED', 'CEDIS', 'TRICE', 'RECIT', 'CITER', 'RECTI', 'CITES', 'TIDES', 'EDITS', 'DITES', 'SITED', 'STIED', 'DEIST', 'TRIED', 'TIRED', 'RIDES', 'SIRED', 'DRIES', 'RESID', 'EDICT', 'CITED', 'DICE', 'ICED', 'CEDI', 'TIDE', 'EDIT', 'DIET', 'DITE', 'TIED', 'RIDE', 'DIRE', 'IRED', 'CITE', 'RICE', 'REST', 'ERST', 'RETS', 'REDS', 'SECT', 'RECS', 'DISC', 'SIDE', 'DIES', 'IDES', 'IRES', 'SIRE', 'REIS', 'RISE', 'TIER', 'TIRE', 'RITE'],
      minWords: 7
    },
    {
      letters: 'TOASTED',
      words: ['TOASTED', 'TOAST', 'DATES', 'SATED', 'STADE', 'STEAD', 'TSADE', 'TASTED', 'STATED', 'DOTES', 'DOEST', 'TOSED', 'TOTES', 'STOAT', 'DATOS', 'DOATS', 'TOADS', 'TASTE', 'STATE', 'TATES', 'TEATS', 'TAETS', 'OATED', 'DATE', 'SATE', 'EATS', 'SEAT', 'TEAS', 'SETA', 'ETAS', 'ATES', 'DOSE', 'DOES', 'ODES', 'DOTE', 'TOED', 'TOAD', 'DATO', 'DOAT', 'DOST', 'DOTS', 'TODS', 'OAST', 'OATS', 'TAOS', 'STOA', 'TADS', 'SODA', 'ADOS', 'TOES', 'TOTE', 'TEST', 'STET', 'TETS', 'STAT', 'TATS', 'TEAT', 'TATE', 'EAT', 'ATE', 'ETA', 'TEA', 'SEA', 'SAT', 'SET', 'TAD', 'ADO', 'OAT', 'TAO', 'TOE', 'DOT', 'TOD', 'SOT', 'SOD', 'ODE', 'DOE', 'TET', 'TAT'],
      minWords: 7
    },
    {
      letters: 'SPARKLE',
      words: ['SPARKLE', 'LEAPS', 'LAPSE', 'PEALS', 'PALES', 'SEPAL', 'SPALE', 'SALEP', 'PLEAS', 'SPEAR', 'PEARS', 'REAPS', 'SPARE', 'PARSE', 'PRASE', 'APERS', 'ASPER', 'PARES', 'RAPES', 'PRESA', 'LAKERS', 'SLAKER', 'REAKS', 'RAKES', 'SAKER', 'ESKAR', 'KALES', 'LAKES', 'LEAKS', 'SLAKE', 'LAKER', 'ARLES', 'EARLS', 'LEARS', 'RALES', 'REALS', 'SERAL', 'LASER', 'LARES', 'LARKS', 'KARLS', 'PERKS', 'PALER', 'PEARL', 'PARLE', 'SAKE', 'RAKE', 'LAKE', 'LEAK', 'KALE', 'PALE', 'PEAL', 'PLEA', 'LEAP', 'SALE', 'SEAL', 'LASE', 'ALES', 'LEAS', 'REAL', 'EARL', 'LEAR', 'RALE', 'LAPS', 'SLAP', 'PALS', 'ALPS', 'ARKS', 'PARK', 'SPAR', 'RASP', 'PARS', 'RAPS', 'LARK', 'KARL', 'PERK', 'REPS', 'KEPS', 'ELKS', 'LEKS'],
      minWords: 7
    },
    {
      letters: 'TRAVELS',
      words: ['TRAVELS', 'VARLETS', 'SLAVER', 'VERSAL', 'SERVAL', 'SALVER', 'LAVERS', 'RAVELS', 'VALETS', 'TRAVEL', 'VARLET', 'LATER', 'ALTER', 'ALERT', 'RATEL', 'TALER', 'ARTEL', 'RAVEL', 'LAVER', 'LAVRE', 'VELAR', 'VALET', 'SALVE', 'SLAVE', 'VALES', 'VEALS', 'SELVA', 'LAVES', 'AVERS', 'RAVES', 'SAVER', 'TALES', 'STEAL', 'STALE', 'SLATE', 'LEAST', 'SETAL', 'TESLA', 'TEALS', 'TAELS', 'LEATS', 'STAVE', 'VESTA', 'TRAVE', 'AVERT', 'STARVE', 'STARE', 'RATES', 'ASTER', 'TEARS', 'TARES', 'RESAT', 'LAVE', 'VALE', 'VEAL', 'LEVA', 'AVES', 'SAVE', 'VASE', 'RAVE', 'AVER', 'VERA', 'LATE', 'TALE', 'TEAL', 'TAEL', 'LEAT', 'RATE', 'TEAR', 'TARE', 'SALE', 'SEAL', 'LASE', 'ALES', 'LEAS', 'REAL', 'EARL', 'LEAR', 'RALE', 'ARES', 'EARS', 'ERAS', 'SEAR', 'SERA', 'EATS', 'TEAS', 'SEAT', 'SETA', 'ETAS', 'ATES', 'SALT', 'SLAT', 'LAST', 'LATS', 'ALTS', 'LARS', 'ARLS', 'ARTS', 'RATS', 'TARS', 'STAR', 'VAST', 'VATS', 'TAVS', 'REST', 'ERST', 'RETS', 'REVS', 'VERT', 'VETS'],
      minWords: 7
    },
    {
      letters: 'CLAIMED',
      words: ['CLAIMED', 'DECLAIM', 'MEDICAL', 'DECIMAL', 'CLAIM', 'MACED', 'CAMEL', 'CLIME', 'MELIC', 'MEDIC', 'DEMIC', 'ILEAC', 'MALIC', 'AMICE', 'LAMED', 'MEDAL', 'IDEAL', 'AILED', 'ACLED', 'LACED', 'DECAL', 'CLADE', 'CADMIE', 'CLAM', 'CALM', 'LAME', 'MALE', 'MEAL', 'DAME', 'MADE', 'MEAD', 'ACID', 'AMID', 'MAID', 'DALE', 'DEAL', 'LADE', 'LEAD', 'IDEA', 'AIDE', 'DIAL', 'LAID', 'DIME', 'IDEM', 'MICE', 'MILE', 'LIME', 'CEIL', 'LICE', 'DICE', 'ICED', 'CEDI', 'CLAD', 'LACE', 'MACE', 'CAME', 'ACME', 'ACE', 'ALE', 'LEA', 'LAC', 'CAD', 'DAM', 'MAD', 'LAD', 'DAL', 'AID', 'LID', 'MIL', 'AIM', 'MED', 'DIE', 'LIE', 'LEI', 'ICE', 'ELM', 'MIC', 'CAM', 'MAC'],
      minWords: 7
    },
  ],
};

/**
 * Get a random anagram puzzle for given difficulty
 */
export function getRandomAnagramPuzzle(difficulty: Difficulty): AnagramPuzzle {
  const puzzles = ANAGRAM_PUZZLES[difficulty];
  return puzzles[Math.floor(Math.random() * puzzles.length)];
}

/**
 * Scramble letters randomly using Fisher-Yates shuffle
 */
export function scrambleLetters(letters: string): string {
  const arr = letters.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join('');
}
