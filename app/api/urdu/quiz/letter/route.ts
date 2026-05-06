import { auth } from "@/auth";

// Unicode Presentation Form codepoints — each is unambiguously one positional
// form, no shaping-engine dependency.

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
    // Non-connector: only two visually distinct forms.
    forms: [
      {
        glyph: "ﺍ", // ﺍ isolated
        position: "standalone",
        hint: "Alef is a single upright vertical stroke. It never connects to the letter that follows it.",
      },
      {
        glyph: "ﺎ", // ﺎ final
        position: "final",
        hint: "Alef in final position attaches to the connecting stroke coming from the preceding letter on its right.",
      },
    ],
  },
  {
    roman: "be",
    letter_name: "be",
    forms: [
      {
        glyph: "ﺏ", // ﺏ isolated
        position: "standalone",
        hint: "Be standalone: a shallow bowl shape with one dot below and a short hook on the right.",
      },
      {
        glyph: "ﺐ", // ﺐ final
        position: "final",
        hint: "Be in final form: the bowl extends into a long sweeping leftward tail. One dot below.",
      },
      {
        glyph: "ﺑ", // ﺑ initial
        position: "initial",
        hint: "Be at the start: a short stroke open to the right for connecting forward. One dot below.",
      },
      {
        glyph: "ﺒ", // ﺒ medial
        position: "medial",
        hint: "Be in the middle: a tiny tooth-like stroke connecting on both sides. One dot below.",
      },
    ],
  },
  {
    roman: "pe",
    letter_name: "pe",
    forms: [
      {
        glyph: "ﭖ", // ﭖ isolated
        position: "standalone",
        hint: "Pe looks exactly like be but with three dots below instead of one.",
      },
      {
        glyph: "ﭗ", // ﭗ final
        position: "final",
        hint: "Pe in final form: same long sweeping tail as be's final, but three dots below.",
      },
      {
        glyph: "ﭘ", // ﭘ initial
        position: "initial",
        hint: "Pe at the start: short connecting stroke open rightward. Three dots below.",
      },
      {
        glyph: "ﭙ", // ﭙ medial
        position: "medial",
        hint: "Pe in medial: tiny connecting tooth. Three dots below distinguish it from be.",
      },
    ],
  },
  {
    roman: "te",
    letter_name: "te",
    forms: [
      {
        glyph: "ﺕ", // ﺕ isolated
        position: "standalone",
        hint: "Te looks like be but with two dots above the bowl instead of one dot below.",
      },
      {
        glyph: "ﺖ", // ﺖ final
        position: "final",
        hint: "Te in final form: long leftward sweeping tail, two dots above.",
      },
      {
        glyph: "ﺗ", // ﺗ initial
        position: "initial",
        hint: "Te at the start: short connecting stroke open to the right. Two dots above.",
      },
      {
        glyph: "ﺘ", // ﺘ medial
        position: "medial",
        hint: "Te in medial: tiny connecting tooth. Two dots above the stroke.",
      },
    ],
  },
  {
    roman: "nun",
    letter_name: "nun",
    forms: [
      {
        glyph: "ﻥ", // ﻥ isolated
        position: "standalone",
        hint: "Nun standalone: a deep rounded bowl with one dot placed above, near the center.",
      },
      {
        glyph: "ﻦ", // ﻦ final
        position: "final",
        hint: "Nun in final form: a broad sweeping curve to the left, one dot above.",
      },
      {
        glyph: "ﻧ", // ﻧ initial
        position: "initial",
        hint: "Nun at the start: resembles be's initial but the single dot sits above the stroke.",
      },
      {
        glyph: "ﻨ", // ﻨ medial
        position: "medial",
        hint: "Nun in medial: tiny connecting tooth. The dot above distinguishes it from be's medial.",
      },
    ],
  },
  {
    roman: "meem",
    letter_name: "meem",
    forms: [
      {
        glyph: "ﻡ", // ﻡ isolated
        position: "standalone",
        hint: "Meem standalone: a closed round knob at the top with a small tail curling down and to the left.",
      },
      {
        glyph: "ﻢ", // ﻢ final
        position: "final",
        hint: "Meem in final form: the round head at the end, tail sweeping down-left.",
      },
      {
        glyph: "ﻣ", // ﻣ initial
        position: "initial",
        hint: "Meem at the start: the round head connects rightward, tail tucked inward.",
      },
      {
        glyph: "ﻤ", // ﻤ medial
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
        glyph: "ﻝ", // ﻝ isolated
        position: "standalone",
        hint: "Lam standalone: a tall stroke hooking upward at the top, with a long descending tail.",
      },
      {
        glyph: "ﻞ", // ﻞ final
        position: "final",
        hint: "Lam in final form: tall hook at top, connected from the right, tail curling down-left.",
      },
      {
        glyph: "ﻟ", // ﻟ initial
        position: "initial",
        hint: "Lam at the start: rises tall and the baseline extends rightward to connect forward.",
      },
      {
        glyph: "ﻠ", // ﻠ medial
        position: "medial",
        hint: "Lam in medial: a vertical rise from the connecting baseline on both sides.",
      },
    ],
  },
  {
    roman: "kaf",
    letter_name: "kaf",
    // Using Keheh (U+06A9), the form used in Urdu.
    forms: [
      {
        glyph: "ﮎ", // ﮎ isolated
        position: "standalone",
        hint: "Urdu kaf standalone: a distinctive diagonal mark above a bowl-like body.",
      },
      {
        glyph: "ﮏ", // ﮏ final
        position: "final",
        hint: "Kaf in final form: the diagonal mark sits over a closed body with a left-curling tail.",
      },
      {
        glyph: "ﮐ", // ﮐ initial
        position: "initial",
        hint: "Kaf at the start: the diagonal mark is visible as the body opens rightward to connect.",
      },
      {
        glyph: "ﮑ", // ﮑ medial
        position: "medial",
        hint: "Kaf in medial: a flat connecting stroke with its characteristic diagonal mark above.",
      },
    ],
  },
  {
    roman: "re",
    letter_name: "re",
    // Non-connector: only two visually distinct forms.
    forms: [
      {
        glyph: "ﺭ", // ﺭ isolated
        position: "standalone",
        hint: "Re is a simple rightward-curving hook dipping below the baseline. It never connects to the letter that follows.",
      },
      {
        glyph: "ﺮ", // ﺮ final
        position: "final",
        hint: "Re in final position: the hook curves down from the connecting stroke of the preceding letter.",
      },
    ],
  },
  {
    roman: "wao",
    letter_name: "wao",
    // Non-connector: only two visually distinct forms.
    forms: [
      {
        glyph: "ﻭ", // ﻭ isolated
        position: "standalone",
        hint: "Wao standalone: a closed teardrop loop with a tail curling down and to the left. Never connects to the letter that follows.",
      },
      {
        glyph: "ﻮ", // ﻮ final
        position: "final",
        hint: "Wao in final position: the loop hangs from the preceding letter's connecting stroke, tail below.",
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
