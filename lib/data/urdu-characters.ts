export type UrduCharacterForm = {
  glyph: string;
};

export type UrduCharacterExample = {
  word: string;
  transliteration: string;
  meaning: string;
};

export type UrduCharacter = {
  id: number;
  character: string; // isolated form
  name: string; // Urdu name in English
  forms: {
    isolated: string;
    initial: string;
    medial: string;
    final: string;
  };
  examples: {
    isolated: UrduCharacterExample;
    initial: UrduCharacterExample;
    medial: UrduCharacterExample;
    final: UrduCharacterExample;
  };
};

export const URDU_CHARACTERS: UrduCharacter[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // 1. Alif Group
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 1,
    character: "ا",
    name: "alif",
    forms: {
      isolated: "ا",
      initial: "ا",
      medial: "ﺎ",
      final: "ﺎ",
    },
    examples: {
      isolated: { word: "ادب", transliteration: "adab", meaning: "literature / respect" },
      initial: { word: "امید", transliteration: "umeed", meaning: "hope" },
      medial: { word: "ہوا", transliteration: "hawa", meaning: "wind / air" },
      final: { word: "ہوا", transliteration: "hawa", meaning: "wind / air" },
    },
  },
  {
    id: 2,
    character: "آ",
    name: "alif madd",
    forms: {
      isolated: "آ",
      initial: "آ",
      medial: "ﺂ",
      final: "ﺂ",
    },
    examples: {
      isolated: { word: "آگ", transliteration: "aag", meaning: "fire" },
      initial: { word: "آسمان", transliteration: "aasmaan", meaning: "sky" },
      medial: { word: "ماں", transliteration: "maa", meaning: "mother" },
      final: { word: "ماہ", transliteration: "maah", meaning: "moon (poetic)" },
    },
  },
  {
    id: 3,
    character: "ب",
    name: "be",
    forms: {
      isolated: "ب",
      initial: "ﺑ",
      medial: "ﺒ",
      final: "ﺐ",
    },
    examples: {
      isolated: { word: "برا", transliteration: "bura", meaning: "bad" },
      initial: { word: "بھائی", transliteration: "bhai", meaning: "brother" },
      medial: { word: "محبت", transliteration: "mohabbat", meaning: "love" },
      final: { word: "بے تاب", transliteration: "betaab", meaning: "impatient" },
    },
  },
  {
    id: 4,
    character: "پ",
    name: "pe",
    forms: {
      isolated: "پ",
      initial: "ﭘ",
      medial: "ﭙ",
      final: "ﭗ",
    },
    examples: {
      isolated: { word: "پیار", transliteration: "pyar", meaning: "affection" },
      initial: { word: "پانی", transliteration: "paani", meaning: "water" },
      medial: { word: "سپنا", transliteration: "sapna", meaning: "dream" },
      final: { word: "آپ", transliteration: "aap", meaning: "you (formal)" },
    },
  },
  {
    id: 5,
    character: "ت",
    name: "te",
    forms: {
      isolated: "ت",
      initial: "ﺗ",
      medial: "ﺘ",
      final: "ﺖ",
    },
    examples: {
      isolated: { word: "تنہا", transliteration: "tanha", meaning: "lonely" },
      initial: { word: "تمنا", transliteration: "tamanna", meaning: "wish" },
      medial: { word: "ستارہ", transliteration: "sitaara", meaning: "star" },
      final: { word: "محبت", transliteration: "mohabbat", meaning: "love" },
    },
  },
  {
    id: 6,
    character: "ٹ",
    name: "tte",
    forms: {
      isolated: "ٹ",
      initial: "ﭨ",
      medial: "ﭩ",
      final: "ﭧ",
    },
    examples: {
      isolated: { word: "ٹھنڈا", transliteration: "thanda", meaning: "cold" },
      initial: { word: "ٹھنڈا", transliteration: "thanda", meaning: "cold" },
      medial: { word: "روٹی", transliteration: "roti", meaning: "bread" },
      final: { word: "پیٹ", transliteration: "pet", meaning: "stomach" },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. Se Group
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 7,
    character: "ث",
    name: "se",
    forms: {
      isolated: "ث",
      initial: "ﺛ",
      medial: "ﺜ",
      final: "ﺚ",
    },
    examples: {
      isolated: { word: "ثبوت", transliteration: "saboot", meaning: "proof" },
      initial: { word: "ثبوت", transliteration: "saboot", meaning: "proof" },
      medial: { word: "مثال", transliteration: "misaal", meaning: "example" },
      final: { word: "میراث", transliteration: "miraas", meaning: "inheritance" },
    },
  },
  {
    id: 8,
    character: "ج",
    name: "jeem",
    forms: {
      isolated: "ج",
      initial: "ﺟ",
      medial: "ﺠ",
      final: "ﺞ",
    },
    examples: {
      isolated: { word: "جان", transliteration: "jaan", meaning: "life / soul" },
      initial: { word: "جنون", transliteration: "junoon", meaning: "passion / madness" },
      medial: { word: "اجنبی", transliteration: "ajnabi", meaning: "stranger" },
      final: { word: "آج", transliteration: "aaj", meaning: "today" },
    },
  },
  {
    id: 9,
    character: "چ",
    name: "che",
    forms: {
      isolated: "چ",
      initial: "ﭼ",
      medial: "ﭽ",
      final: "ﭻ",
    },
    examples: {
      isolated: { word: "چاند", transliteration: "chaand", meaning: "moon" },
      initial: { word: "چاہت", transliteration: "chahat", meaning: "desire" },
      medial: { word: "بچہ", transliteration: "bachcha", meaning: "child" },
      final: { word: "کچھ", transliteration: "kuch", meaning: "some / a little" },
    },
  },
  {
    id: 10,
    character: "ح",
    name: "he",
    forms: {
      isolated: "ح",
      initial: "ﺣ",
      medial: "ﺤ",
      final: "ﺢ",
    },
    examples: {
      isolated: { word: "حیا", transliteration: "haya", meaning: "modesty" },
      initial: { word: "حیرت", transliteration: "hairat", meaning: "wonder" },
      medial: { word: "محبت", transliteration: "mohabbat", meaning: "love" },
      final: { word: "روح", transliteration: "rooh", meaning: "soul" },
    },
  },
  {
    id: 11,
    character: "خ",
    name: "khe",
    forms: {
      isolated: "خ",
      initial: "ﺧ",
      medial: "ﺨ",
      final: "ﺦ",
    },
    examples: {
      isolated: { word: "خوشی", transliteration: "khushi", meaning: "happiness" },
      initial: { word: "خوف", transliteration: "khauf", meaning: "fear" },
      medial: { word: "اخبار", transliteration: "akhbaar", meaning: "newspaper" },
      final: { word: "تاریخ", transliteration: "taareekh", meaning: "history / date" },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. Daal Group
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 12,
    character: "د",
    name: "daal",
    forms: {
      isolated: "د",
      initial: "د",
      medial: "ﺪ",
      final: "ﺪ",
    },
    examples: {
      isolated: { word: "دوست", transliteration: "dost", meaning: "friend" },
      initial: { word: "دوست", transliteration: "dost", meaning: "friend" },
      medial: { word: "زندگی", transliteration: "zindagi", meaning: "life" },
      final: { word: "زندگی", transliteration: "zindagi", meaning: "life" },
    },
  },
  {
    id: 13,
    character: "ڈ",
    name: "ddaal",
    forms: {
      isolated: "ڈ",
      initial: "ڈ",
      medial: "ﮉ",
      final: "ﮉ",
    },
    examples: {
      isolated: { word: "ڈر", transliteration: "darr", meaning: "fright" },
      initial: { word: "ڈر", transliteration: "darr", meaning: "fright" },
      medial: { word: "ٹھنڈا", transliteration: "thanda", meaning: "cold" },
      final: { word: "ٹھنڈا", transliteration: "thanda", meaning: "cold" },
    },
  },
  {
    id: 14,
    character: "ذ",
    name: "zaal",
    forms: {
      isolated: "ذ",
      initial: "ذ",
      medial: "ﺬ",
      final: "ﺬ",
    },
    examples: {
      isolated: { word: "ذلت", transliteration: "zillat", meaning: "humiliation" },
      initial: { word: "ذلت", transliteration: "zillat", meaning: "humiliation" },
      medial: { word: "عذاب", transliteration: "azaab", meaning: "torment" },
      final: { word: "عذاب", transliteration: "azaab", meaning: "torment" },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. Re Group
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 15,
    character: "ر",
    name: "re",
    forms: {
      isolated: "ر",
      initial: "ر",
      medial: "ﺮ",
      final: "ﺮ",
    },
    examples: {
      isolated: { word: "رنج", transliteration: "ranj", meaning: "grief" },
      initial: { word: "رنج", transliteration: "ranj", meaning: "grief" },
      medial: { word: "شرم", transliteration: "sharm", meaning: "shame" },
      final: { word: "شرم", transliteration: "sharm", meaning: "shame" },
    },
  },
  {
    id: 16,
    character: "ڑ",
    name: "rre",
    forms: {
      isolated: "ڑ",
      initial: "ڑ",
      medial: "ﮍ",
      final: "ﮍ",
    },
    examples: {
      isolated: { word: "پہاڑ", transliteration: "pahaar", meaning: "mountain" },
      initial: { word: "پہاڑ", transliteration: "pahaar", meaning: "mountain" },
      medial: { word: "لڑکا", transliteration: "ladka", meaning: "boy" },
      final: { word: "لڑکا", transliteration: "ladka", meaning: "boy" },
    },
  },
  {
    id: 17,
    character: "ز",
    name: "ze",
    forms: {
      isolated: "ز",
      initial: "ز",
      medial: "ﺰ",
      final: "ﺰ",
    },
    examples: {
      isolated: { word: "زندگی", transliteration: "zindagi", meaning: "life" },
      initial: { word: "زندگی", transliteration: "zindagi", meaning: "life" },
      medial: { word: "مزہ", transliteration: "mazaa", meaning: "fun" },
      final: { word: "مزہ", transliteration: "mazaa", meaning: "fun" },
    },
  },
  {
    id: 18,
    character: "ژ",
    name: "zhe",
    forms: {
      isolated: "ژ",
      initial: "ژ",
      medial: "ﮋ",
      final: "ﮋ",
    },
    examples: {
      isolated: { word: "ژالہ", transliteration: "zhaala", meaning: "hailstone" },
      initial: { word: "ژالہ", transliteration: "zhaala", meaning: "hailstone" },
      medial: { word: "واژه", transliteration: "vaazhe", meaning: "word (literary)" },
      final: { word: "واژه", transliteration: "vaazhe", meaning: "word (literary)" },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. Seen Group
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 19,
    character: "س",
    name: "seen",
    forms: {
      isolated: "س",
      initial: "ﺳ",
      medial: "ﺴ",
      final: "ﺲ",
    },
    examples: {
      isolated: { word: "سکون", transliteration: "sukoon", meaning: "peace" },
      initial: { word: "ساتھی", transliteration: "saathi", meaning: "companion" },
      medial: { word: "مسافر", transliteration: "musaafir", meaning: "traveller" },
      final: { word: "نفس", transliteration: "nafs", meaning: "soul / self" },
    },
  },
  {
    id: 20,
    character: "ش",
    name: "sheen",
    forms: {
      isolated: "ش",
      initial: "ﺷ",
      medial: "ﺸ",
      final: "ﺶ",
    },
    examples: {
      isolated: { word: "شکر", transliteration: "shukr", meaning: "gratitude" },
      initial: { word: "شرم", transliteration: "sharm", meaning: "shame" },
      medial: { word: "پریشان", transliteration: "pareshaan", meaning: "worried" },
      final: { word: "خواہش", transliteration: "khwaahish", meaning: "desire" },
    },
  },
  {
    id: 21,
    character: "ص",
    name: "swad",
    forms: {
      isolated: "ص",
      initial: "ﺻ",
      medial: "ﺼ",
      final: "ﺺ",
    },
    examples: {
      isolated: { word: "صبر", transliteration: "sabr", meaning: "patience" },
      initial: { word: "صاحب", transliteration: "saahib", meaning: "sir / gentleman" },
      medial: { word: "نصیب", transliteration: "naseeb", meaning: "destiny" },
      final: { word: "خاص", transliteration: "khaas", meaning: "special" },
    },
  },
  {
    id: 22,
    character: "ض",
    name: "zwad",
    forms: {
      isolated: "ض",
      initial: "ﺿ",
      medial: "ﻀ",
      final: "ﺾ",
    },
    examples: {
      isolated: { word: "ضدی", transliteration: "ziddi", meaning: "stubborn" },
      initial: { word: "ضدی", transliteration: "ziddi", meaning: "stubborn" },
      medial: { word: "حضور", transliteration: "hazoor", meaning: "presence / your honour" },
      final: { word: "مرض", transliteration: "marz", meaning: "illness" },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. Toe Group
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 23,
    character: "ط",
    name: "toe",
    forms: {
      isolated: "ط",
      initial: "ﻃ",
      medial: "ﻄ",
      final: "ﻂ",
    },
    examples: {
      isolated: { word: "طوفان", transliteration: "toofaan", meaning: "storm" },
      initial: { word: "طوفان", transliteration: "toofaan", meaning: "storm" },
      medial: { word: "نطق", transliteration: "natq", meaning: "speech / pronunciation" },
      final: { word: "غلط", transliteration: "ghalat", meaning: "wrong / incorrect" },
    },
  },
  {
    id: 24,
    character: "ظ",
    name: "zoe",
    forms: {
      isolated: "ظ",
      initial: "ﻇ",
      medial: "ﻈ",
      final: "ﻆ",
    },
    examples: {
      isolated: { word: "ظلم", transliteration: "zulm", meaning: "oppression" },
      initial: { word: "ظلم", transliteration: "zulm", meaning: "oppression" },
      medial: { word: "نظم", transliteration: "nazm", meaning: "poem" },
      final: { word: "حافظ", transliteration: "haafiz", meaning: "guardian / memorizer" },
    },
  },
  {
    id: 25,
    character: "ع",
    name: "ain",
    forms: {
      isolated: "ع",
      initial: "ﻋ",
      medial: "ﻌ",
      final: "ﻊ",
    },
    examples: {
      isolated: { word: "عزت", transliteration: "izzat", meaning: "honour" },
      initial: { word: "عورت", transliteration: "aurat", meaning: "woman" },
      medial: { word: "تعجب", transliteration: "ta'ajjub", meaning: "surprise" },
      final: { word: "شمع", transliteration: "shama", meaning: "candle" },
    },
  },
  {
    id: 26,
    character: "غ",
    name: "ghain",
    forms: {
      isolated: "غ",
      initial: "ﻏ",
      medial: "ﻐ",
      final: "ﻎ",
    },
    examples: {
      isolated: { word: "غیرت", transliteration: "ghairat", meaning: "self-respect" },
      initial: { word: "غصہ", transliteration: "gussa", meaning: "anger" },
      medial: { word: "نغمہ", transliteration: "naghama", meaning: "melody" },
      final: { word: "مبلغ", transliteration: "muballigh", meaning: "preacher" },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. Fe Group
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 27,
    character: "ف",
    name: "fe",
    forms: {
      isolated: "ف",
      initial: "ﻓ",
      medial: "ﻔ",
      final: "ﻒ",
    },
    examples: {
      isolated: { word: "فکر", transliteration: "fikr", meaning: "worry" },
      initial: { word: "فخر", transliteration: "fakhr", meaning: "pride" },
      medial: { word: "سفیر", transliteration: "safeer", meaning: "ambassador" },
      final: { word: "تکلیف", transliteration: "takleef", meaning: "trouble" },
    },
  },
  {
    id: 28,
    character: "ق",
    name: "qaaf",
    forms: {
      isolated: "ق",
      initial: "ﻗ",
      medial: "ﻘ",
      final: "ﻖ",
    },
    examples: {
      isolated: { word: "قسمت", transliteration: "qismat", meaning: "fate" },
      initial: { word: "قسم", transliteration: "qasam", meaning: "oath" },
      medial: { word: "یقین", transliteration: "yaqeen", meaning: "certainty" },
      final: { word: "عشق", transliteration: "ishq", meaning: "passionate love" },
    },
  },
  {
    id: 29,
    character: "ک",
    name: "kaaf",
    forms: {
      isolated: "ک",
      initial: "ﮐ",
      medial: "ﮑ",
      final: "ﮏ",
    },
    examples: {
      isolated: { word: "کسک", transliteration: "kasak", meaning: "pang" },
      initial: { word: "کل", transliteration: "kal", meaning: "yesterday / tomorrow" },
      medial: { word: "سکون", transliteration: "sukoon", meaning: "peace" },
      final: { word: "شک", transliteration: "shak", meaning: "doubt" },
    },
  },
  {
    id: 30,
    character: "گ",
    name: "gaaf",
    forms: {
      isolated: "گ",
      initial: "ﮔ",
      medial: "ﮕ",
      final: "ﮓ",
    },
    examples: {
      isolated: { word: "گرمی", transliteration: "garmi", meaning: "heat / summer" },
      initial: { word: "گرمی", transliteration: "garmi", meaning: "heat / summer" },
      medial: { word: "لگن", transliteration: "lagan", meaning: "dedication" },
      final: { word: "رنگ", transliteration: "rang", meaning: "colour" },
    },
  },
  {
    id: 31,
    character: "ل",
    name: "laam",
    forms: {
      isolated: "ل",
      initial: "ﻟ",
      medial: "ﻠ",
      final: "ﻞ",
    },
    examples: {
      isolated: { word: "لگن", transliteration: "lagan", meaning: "dedication" },
      initial: { word: "لطف", transliteration: "lutf", meaning: "pleasure" },
      medial: { word: "تکلیف", transliteration: "takleef", meaning: "trouble" },
      final: { word: "ساحل", transliteration: "saahil", meaning: "shore / coast" },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. Meem Group
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 32,
    character: "م",
    name: "meem",
    forms: {
      isolated: "م",
      initial: "ﻣ",
      medial: "ﻤ",
      final: "ﻢ",
    },
    examples: {
      isolated: { word: "ماں", transliteration: "maa", meaning: "mother" },
      initial: { word: "محبت", transliteration: "mohabbat", meaning: "love" },
      medial: { word: "تمنا", transliteration: "tamanna", meaning: "wish" },
      final: { word: "غم", transliteration: "gham", meaning: "sorrow" },
    },
  },
  {
    id: 33,
    character: "ن",
    name: "noon",
    forms: {
      isolated: "ن",
      initial: "ﻧ",
      medial: "ﻨ",
      final: "ﻦ",
    },
    examples: {
      isolated: { word: "ندی", transliteration: "nadi", meaning: "stream" },
      initial: { word: "نصیب", transliteration: "naseeb", meaning: "destiny" },
      medial: { word: "جنون", transliteration: "junoon", meaning: "passion / madness" },
      final: { word: "یقین", transliteration: "yaqeen", meaning: "certainty" },
    },
  },
  {
    id: 34,
    character: "و",
    name: "wao",
    forms: {
      isolated: "و",
      initial: "و",
      medial: "ﻮ",
      final: "ﻮ",
    },
    examples: {
      isolated: { word: "وفا", transliteration: "wafa", meaning: "loyalty" },
      initial: { word: "وفا", transliteration: "wafa", meaning: "loyalty" },
      medial: { word: "ہوا", transliteration: "hawa", meaning: "wind / air" },
      final: { word: "ہوا", transliteration: "hawa", meaning: "wind / air" },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. Choti Ye Group
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 35,
    character: "ہ",
    name: "he",
    forms: {
      isolated: "ہ",
      initial: "ﮬ",
      medial: "ﮭ",
      final: "ﮫ",
    },
    examples: {
      isolated: { word: "ہوا", transliteration: "hawa", meaning: "wind / air" },
      initial: { word: "ہمت", transliteration: "himmat", meaning: "courage" },
      medial: { word: "بہار", transliteration: "bahaar", meaning: "spring season" },
      final: { word: "گلہ", transliteration: "gila", meaning: "grievance" },
    },
  },
  {
    id: 36,
    character: "ء",
    name: "hamza",
    forms: {
      isolated: "ء",
      initial: "ء",
      medial: "ئ",
      final: "ئ",
    },
    examples: {
      isolated: { word: "جزا", transliteration: "jaza", meaning: "reward / punishment" },
      initial: { word: "ائرہ", transliteration: "a'irah", meaning: "apparatus" },
      medial: { word: "سائل", transliteration: "sa'il", meaning: "questioner" },
      final: { word: "شے", transliteration: "shay", meaning: "thing" },
    },
  },
  {
    id: 37,
    character: "ی",
    name: "ye",
    forms: {
      isolated: "ی",
      initial: "ﯾ",
      medial: "ﯿ",
      final: "ﯽ",
    },
    examples: {
      isolated: { word: "یاد", transliteration: "yaad", meaning: "remembrance" },
      initial: { word: "یقین", transliteration: "yaqeen", meaning: "certainty" },
      medial: { word: "تکلیف", transliteration: "takleef", meaning: "trouble" },
      final: { word: "خوشی", transliteration: "khushi", meaning: "happiness" },
    },
  },
  {
    id: 38,
    character: "ے",
    name: "bari ye",
    forms: {
      isolated: "ے",
      initial: "ے",
      medial: "ﮯ",
      final: "ﮯ",
    },
    examples: {
      isolated: { word: "میرے", transliteration: "mere", meaning: "my / mine" },
      initial: { word: "میرے", transliteration: "mere", meaning: "my / mine" },
      medial: { word: "آنے", transliteration: "aane", meaning: "to come / coming" },
      final: { word: "آنے", transliteration: "aane", meaning: "to come / coming" },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. Special Characters
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 39,
    character: "ں",
    name: "noon ghunna",
    forms: {
      isolated: "ں",
      initial: "ں",
      medial: "ﮟ",
      final: "ﮟ",
    },
    examples: {
      isolated: { word: "ماں", transliteration: "maa", meaning: "mother" },
      initial: { word: "ماں", transliteration: "maa", meaning: "mother" },
      medial: { word: "ہیں", transliteration: "hain", meaning: "are (plural)" },
      final: { word: "ہیں", transliteration: "hain", meaning: "are (plural)" },
    },
  },
  {
    id: 40,
    character: "ھ",
    name: "do chashmi he",
    forms: {
      isolated: "ھ",
      initial: "ﮪ",
      medial: "ﮭ",
      final: "ﮫ",
    },
    examples: {
      isolated: { word: "بھائی", transliteration: "bhai", meaning: "brother" },
      initial: { word: "بھائی", transliteration: "bhai", meaning: "brother" },
      medial: { word: "چھت", transliteration: "chhat", meaning: "roof / ceiling" },
      final: { word: "دھوپ", transliteration: "dhoop", meaning: "sunshine" },
    },
  },
];
