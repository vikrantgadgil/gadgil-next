import { auth } from "@/auth";

// Zero Width Joiner — tells the shaping engine to render in a connected form.
// standalone = char, initial = char+ZWJ, final = ZWJ+char, medial = ZWJ+char+ZWJ
const J = "‍";

type Position = "initial" | "medial" | "final" | "standalone";

interface LetterForm {
  glyph: string;
  position: Position;
  hint: string;
}

interface UrduLetter {
  roman: string;
  letter_name: string;
  forms: LetterForm[];
}

const LETTERS: UrduLetter[] = [
  {
    roman: "alef",
    letter_name: "alef",
    forms: [
      {
        glyph: "ا",
        position: "standalone",
        hint: "Alef is a single vertical stroke. It does not connect to the letter that follows it.",
      },
      {
        glyph: J + "ا",
        position: "final",
        hint: "Alef at the end of a word. It attaches to the connecting stroke coming from its right.",
      },
    ],
  },
  {
    roman: "be",
    letter_name: "be",
    forms: [
      {
        glyph: "ب",
        position: "standalone",
        hint: "Be standalone: a shallow bowl shape with one dot below and a short right-curving hook.",
      },
      {
        glyph: J + "ب",
        position: "final",
        hint: "Be in final form: the bowl extends into a long leftward sweeping tail. One dot below.",
      },
      {
        glyph: "ب" + J,
        position: "initial",
        hint: "Be at the start of a word: a short stroke open to the right to connect forward. One dot below.",
      },
      {
        glyph: J + "ب" + J,
        position: "medial",
        hint: "Be in the middle of a word: a tiny tooth-like stroke connecting on both sides. One dot below.",
      },
    ],
  },
  {
    roman: "pe",
    letter_name: "pe",
    forms: [
      {
        glyph: "پ",
        position: "standalone",
        hint: "Pe looks exactly like be but with three dots below instead of one.",
      },
      {
        glyph: J + "پ",
        position: "final",
        hint: "Pe in final form: long sweeping tail like be's final, but three dots below.",
      },
      {
        glyph: "پ" + J,
        position: "initial",
        hint: "Pe at the start: short stroke connecting rightward. Count three dots below.",
      },
      {
        glyph: J + "پ" + J,
        position: "medial",
        hint: "Pe in medial: a tiny connecting stroke. Three dots below distinguish it from be.",
      },
    ],
  },
  {
    roman: "te",
    letter_name: "te",
    forms: [
      {
        glyph: "ت",
        position: "standalone",
        hint: "Te looks like be but with two dots above the bowl instead of one dot below.",
      },
      {
        glyph: J + "ت",
        position: "final",
        hint: "Te in final form: long leftward tail, two dots above.",
      },
      {
        glyph: "ت" + J,
        position: "initial",
        hint: "Te at the start: short connecting stroke open to the right. Two dots above.",
      },
      {
        glyph: J + "ت" + J,
        position: "medial",
        hint: "Te in medial: a tiny stroke between letters. Two dots above the line.",
      },
    ],
  },
  {
    roman: "nun",
    letter_name: "nun",
    forms: [
      {
        glyph: "ن",
        position: "standalone",
        hint: "Nun standalone: a deep rounded bowl with one dot placed above, near the center.",
      },
      {
        glyph: J + "ن",
        position: "final",
        hint: "Nun in final form: a wide sweeping curve to the left, one dot above.",
      },
      {
        glyph: "ن" + J,
        position: "initial",
        hint: "Nun at the start: similar to be's initial, but the single dot sits above the stroke.",
      },
      {
        glyph: J + "ن" + J,
        position: "medial",
        hint: "Nun in medial: a small tooth-like connecting stroke. The dot above distinguishes it from be's medial.",
      },
    ],
  },
  {
    roman: "meem",
    letter_name: "meem",
    forms: [
      {
        glyph: "م",
        position: "standalone",
        hint: "Meem standalone: a closed round knob at the top with a small tail curling down and to the left.",
      },
      {
        glyph: J + "م",
        position: "final",
        hint: "Meem in final form: the round head appears at the end with the tail sweeping down-left.",
      },
      {
        glyph: "م" + J,
        position: "initial",
        hint: "Meem at the start: the round head connects to the right, with the tail tucked inward.",
      },
      {
        glyph: J + "م" + J,
        position: "medial",
        hint: "Meem in medial: a small round head sitting atop the connecting baseline.",
      },
    ],
  },
  {
    roman: "lam",
    letter_name: "lam",
    forms: [
      {
        glyph: "ل",
        position: "standalone",
        hint: "Lam standalone: a tall stroke that hooks upward at the top, with a long tail descending below the baseline.",
      },
      {
        glyph: J + "ل",
        position: "final",
        hint: "Lam in final form: the tall hook at top, connected from the right, with the tail curling down-left.",
      },
      {
        glyph: "ل" + J,
        position: "initial",
        hint: "Lam at the start: rises tall and the baseline extends rightward to connect forward.",
      },
      {
        glyph: J + "ل" + J,
        position: "medial",
        hint: "Lam in medial: a vertical rise from the connecting baseline on both sides.",
      },
    ],
  },
  {
    roman: "kaf",
    letter_name: "kaf",
    forms: [
      {
        glyph: "ک",
        position: "standalone",
        hint: "Urdu kaf standalone: a distinctive diagonal stroke above a bowl-like body.",
      },
      {
        glyph: J + "ک",
        position: "final",
        hint: "Kaf in final form: the angled top stroke sits over a closed body with a left-curling tail.",
      },
      {
        glyph: "ک" + J,
        position: "initial",
        hint: "Kaf at the start: the angled top mark is visible as the body opens to connect rightward.",
      },
      {
        glyph: J + "ک" + J,
        position: "medial",
        hint: "Kaf in medial: a flat connecting stroke with its characteristic angled mark above.",
      },
    ],
  },
  {
    roman: "re",
    letter_name: "re",
    forms: [
      {
        glyph: "ر",
        position: "standalone",
        hint: "Re is a simple rightward-curving hook that dips below the baseline. It does not connect to the letter that follows.",
      },
      {
        glyph: J + "ر",
        position: "final",
        hint: "Re at the end of a word: the hook curves down from the connecting stroke on its right.",
      },
    ],
  },
  {
    roman: "wao",
    letter_name: "wao",
    forms: [
      {
        glyph: "و",
        position: "standalone",
        hint: "Wao standalone: a closed teardrop loop at the top with a tail curving down and to the left. Does not connect to the letter that follows.",
      },
      {
        glyph: J + "و",
        position: "final",
        hint: "Wao in final form: the loop hangs from the connecting stroke on its right, tail curls below.",
      },
    ],
  },
];

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
  const form = letter.forms[Math.floor(Math.random() * letter.forms.length)];

  return Response.json({
    question_glyph: form.glyph,
    position: form.position,
    roman_answer: letter.roman,
    letter_name: letter.letter_name,
    hint: form.hint,
  });
}
