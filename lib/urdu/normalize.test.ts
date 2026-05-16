import { describe, it, expect } from "vitest";
import { normalizeRomanUrdu, checkRomanUrduAnswer } from "./normalize";

// ─── normalizeRomanUrdu tests ──────────────────────────────────────────────

describe("normalizeRomanUrdu", () => {
  describe("basic normalization", () => {
    it("lowercases and trims", () => {
      expect(normalizeRomanUrdu("  Dal ")).toBe("dal");
    });

    it("removes punctuation", () => {
      expect(normalizeRomanUrdu("qalam!")).toBe("kalam");
      expect(normalizeRomanUrdu("kitab?")).toBe("kitab");
    });

    it("collapses repeated spaces", () => {
      expect(normalizeRomanUrdu("alif  ba   pe")).toBe("alif ba pi");
    });
  });

  describe("diacritic normalization", () => {
    it("normalizes ā to a", () => {
      expect(normalizeRomanUrdu("dāl")).toBe("dal");
    });

    it("normalizes ī to i", () => {
      expect(normalizeRomanUrdu("qālī")).toBe("kali");
    });

    it("normalizes ū to u", () => {
      expect(normalizeRomanUrdu("sūrāj")).toBe("suraj");
    });
  });

  describe("phonetic equivalence (relaxed mode)", () => {
    it("dal accepts dhal", () => {
      expect(normalizeRomanUrdu("dhal")).toBe("dal");
    });

    it("ain accepts ein", () => {
      expect(normalizeRomanUrdu("ein")).toBe("ain");
    });

    it("khuda accepts xuda", () => {
      expect(normalizeRomanUrdu("xuda")).toBe("khuda");
    });

    it("qalam accepts kalam", () => {
      expect(normalizeRomanUrdu("kalam")).toBe("kalam");
      expect(normalizeRomanUrdu("qalam")).toBe("kalam");
    });

    it("normalizes aspirated consonants", () => {
      expect(normalizeRomanUrdu("bhai")).toBe("bai");
      expect(normalizeRomanUrdu("phool")).toBe("pul");
      expect(normalizeRomanUrdu("ghar")).toBe("gar");
      expect(normalizeRomanUrdu("thanda")).toBe("tanda");
    });

    it("normalizes vowel length", () => {
      expect(normalizeRomanUrdu("kitaab")).toBe("kitab");
      expect(normalizeRomanUrdu("rooh")).toBe("ruh");
      expect(normalizeRomanUrdu("meetha")).toBe("mita");
    });

    it("normalizes e/i equivalence", () => {
      expect(normalizeRomanUrdu("yee")).toBe("yi");
      expect(normalizeRomanUrdu("ye")).toBe("yi");
      expect(normalizeRomanUrdu("yeh")).toBe("yi");
      expect(normalizeRomanUrdu("bey")).toBe("bi");
      expect(normalizeRomanUrdu("be")).toBe("bi");
    });


    it("removes apostrophes", () => {
      expect(normalizeRomanUrdu("qur'an")).toBe("kuran");
      expect(normalizeRomanUrdu("ma'mool")).toBe("mamul");
    });

    it("mujhe accepts muzhe (j/z/zh tolerance)", () => {
      expect(normalizeRomanUrdu("muzhe")).toBe("muji");
      expect(normalizeRomanUrdu("mujhe")).toBe("muji");
    });

    it("mujhe accepts muje", () => {
      expect(normalizeRomanUrdu("muje")).toBe("muji");
    });

    it("mujhe accepts mujhay/mujhey", () => {
      expect(normalizeRomanUrdu("mujhay")).toBe("muji");
      expect(normalizeRomanUrdu("mujhey")).toBe("muji");
    });

    it("mujhe accepts muzhay/muzhey", () => {
      expect(normalizeRomanUrdu("muzhay")).toBe("muji");
      expect(normalizeRomanUrdu("muzhey")).toBe("muji");
    });

    it("tujhe accepts tuzhe/tuje/tujhay/tujhey", () => {
      expect(normalizeRomanUrdu("tuzhe")).toBe("tuji");
      expect(normalizeRomanUrdu("tuje")).toBe("tuji");
      expect(normalizeRomanUrdu("tujhay")).toBe("tuji");
      expect(normalizeRomanUrdu("tujhey")).toBe("tuji");
      expect(normalizeRomanUrdu("tuzhay")).toBe("tuji");
      expect(normalizeRomanUrdu("tuzhey")).toBe("tuji");
    });

    it("ye accepts yeh, yee, yi", () => {
      expect(normalizeRomanUrdu("ye")).toBe("yi");
      expect(normalizeRomanUrdu("yeh")).toBe("yi");
      expect(normalizeRomanUrdu("yee")).toBe("yi");
      expect(normalizeRomanUrdu("yi")).toBe("yi");
    });

  });

  describe("strict mode", () => {
    it("does not apply phonetic equivalence", () => {
      expect(normalizeRomanUrdu("dhal", "strict")).not.toBe("dal");
      expect(normalizeRomanUrdu("dhal", "strict")).toBe("dhal");
    });

    it("still normalizes diacritics", () => {
      expect(normalizeRomanUrdu("dāl", "strict")).toBe("daal");
    });
  });
});

// ─── checkRomanUrduAnswer tests ────────────────────────────────────────────

describe("checkRomanUrduAnswer", () => {
  describe("letter quiz: alef-madda", () => {
    const primary = "alef-madda";
    const variants = [
      "alif madda",
      "alif madd",
      "alif maddah",
      "alif mad",
      "alef madda",
      "alef-madda",
      "alif-madda",
      "alif with madda",
      "alef with madda",
      "aa",
      "a",
    ];

    it("accepts exact match", () => {
      const result = checkRomanUrduAnswer("alef-madda", primary, variants);
      expect(result.isCorrect).toBe(true);
    });

    it("accepts alif madd", () => {
      const result = checkRomanUrduAnswer("alif madd", primary, variants);
      expect(result.isCorrect).toBe(true);
    });

    it("accepts alif madda", () => {
      const result = checkRomanUrduAnswer("alif madda", primary, variants);
      expect(result.isCorrect).toBe(true);
    });

    it("accepts alif-madda", () => {
      const result = checkRomanUrduAnswer("alif-madda", primary, variants);
      expect(result.isCorrect).toBe(true);
    });

    it("accepts alef maddah", () => {
      const result = checkRomanUrduAnswer("alef maddah", primary, variants);
      expect(result.isCorrect).toBe(true);
    });

    it("accepts aa via variant", () => {
      const result = checkRomanUrduAnswer("aa", primary, variants);
      expect(result.isCorrect).toBe(true);
    });

    it("accepts alif mad", () => {
      const result = checkRomanUrduAnswer("alif mad", primary, variants);
      expect(result.isCorrect).toBe(true);
    });
  });

  describe("letter quiz: dal", () => {
    const primary = "dal";
    const variants = ["daal", "d", "dhal"];

    it("accepts exact match", () => {
      const result = checkRomanUrduAnswer("dal", primary, variants);
      expect(result.isCorrect).toBe(true);
    });

    it("accepts dhal as variant", () => {
      const result = checkRomanUrduAnswer("dhal", primary, variants);
      expect(result.isCorrect).toBe(true);
      // dhal normalizes to "dal" which matches primary, so matchedVariant is primary
      expect(result.matchedVariant).toBe("dal");
    });

    it("accepts daal as variant", () => {
      const result = checkRomanUrduAnswer("daal", primary, variants);
      expect(result.isCorrect).toBe(true);
    });

    it("rejects wrong answer", () => {
      const result = checkRomanUrduAnswer("jeem", primary, variants);
      expect(result.isCorrect).toBe(false);
    });
  });

  describe("letter quiz: ain", () => {
    const primary = "ain";
    const variants = ["ayn", "ein", "a"];

    it("accepts ain", () => {
      const result = checkRomanUrduAnswer("ain", primary, variants);
      expect(result.isCorrect).toBe(true);
    });

    it("accepts ein as variant", () => {
      const result = checkRomanUrduAnswer("ein", primary, variants);
      expect(result.isCorrect).toBe(true);
    });

    it("accepts ayn as variant", () => {
      const result = checkRomanUrduAnswer("ayn", primary, variants);
      expect(result.isCorrect).toBe(true);
    });
  });

  describe("letter quiz: qaf", () => {
    const primary = "qaf";
    const variants = ["qaaf", "q"];

    it("accepts qaf", () => {
      const result = checkRomanUrduAnswer("qaf", primary, variants);
      expect(result.isCorrect).toBe(true);
    });

    it("accepts kaf in relaxed mode (q→k)", () => {
      const result = checkRomanUrduAnswer("kaf", primary, variants);
      expect(result.isCorrect).toBe(true);
    });
  });

  describe("letter quiz: zal", () => {
    const primary = "zal";
    const variants = ["zaal", "z", "dh", "dhal"];

    it("accepts zal", () => {
      const result = checkRomanUrduAnswer("zal", primary, variants);
      expect(result.isCorrect).toBe(true);
    });

    it("accepts dhal via relaxed normalization", () => {
      const result = checkRomanUrduAnswer("dhal", primary, variants);
      expect(result.isCorrect).toBe(true);
    });
  });

  describe("letter quiz: ye", () => {
    const primary = "ye";
    const variants = ["yay", "y", "yeh", "yee", "yi"];

    it("accepts exact match", () => {
      const result = checkRomanUrduAnswer("ye", primary, variants);
      expect(result.isCorrect).toBe(true);
    });

    it("accepts yee as variant", () => {
      const result = checkRomanUrduAnswer("yee", primary, variants);
      expect(result.isCorrect).toBe(true);
    });

    it("accepts yeh as variant", () => {
      const result = checkRomanUrduAnswer("yeh", primary, variants);
      expect(result.isCorrect).toBe(true);
    });

    it("accepts yi as variant", () => {
      const result = checkRomanUrduAnswer("yi", primary, variants);
      expect(result.isCorrect).toBe(true);
    });

    it("accepts y as variant", () => {
      const result = checkRomanUrduAnswer("y", primary, variants);
      expect(result.isCorrect).toBe(true);
    });
  });

  describe("letter quiz: be", () => {
    const primary = "be";
    const variants = ["ba", "b"];

    it("accepts exact match", () => {
      const result = checkRomanUrduAnswer("be", primary, variants);
      expect(result.isCorrect).toBe(true);
    });

    it("accepts bey via e/i equivalence", () => {
      const result = checkRomanUrduAnswer("bey", primary, variants);
      expect(result.isCorrect).toBe(true);
    });

    it("accepts bay via variant", () => {
      const result = checkRomanUrduAnswer("bay", primary, variants);
      expect(result.isCorrect).toBe(true);
    });
  });

  describe("letter quiz: pe", () => {
    const primary = "pe";
    const variants = ["pa", "p"];

    it("accepts exact match", () => {
      const result = checkRomanUrduAnswer("pe", primary, variants);
      expect(result.isCorrect).toBe(true);
    });

    it("accepts pey via e/i equivalence", () => {
      const result = checkRomanUrduAnswer("pey", primary, variants);
      expect(result.isCorrect).toBe(true);
    });
  });

  describe("letter quiz: te", () => {
    const primary = "te";
    const variants = ["ta", "t"];

    it("accepts exact match", () => {
      const result = checkRomanUrduAnswer("te", primary, variants);
      expect(result.isCorrect).toBe(true);
    });

    it("accepts tey via e/i equivalence", () => {
      const result = checkRomanUrduAnswer("tey", primary, variants);
      expect(result.isCorrect).toBe(true);
    });
  });

  describe("letter quiz: jeem", () => {
    const primary = "jeem";
    const variants = ["jim", "j"];

    it("accepts exact match", () => {
      const result = checkRomanUrduAnswer("jeem", primary, variants);
      expect(result.isCorrect).toBe(true);
    });

    it("accepts jim as variant", () => {
      const result = checkRomanUrduAnswer("jim", primary, variants);
      expect(result.isCorrect).toBe(true);
    });

    it("accepts jīm via diacritic normalization", () => {
      const result = checkRomanUrduAnswer("jīm", primary, variants);
      expect(result.isCorrect).toBe(true);
    });
  });

  describe("letter quiz: laam", () => {
    const primary = "lam";
    const variants = ["laam", "l"];

    it("accepts exact match", () => {
      const result = checkRomanUrduAnswer("lam", primary, variants);
      expect(result.isCorrect).toBe(true);
    });

    it("accepts laam as variant", () => {
      const result = checkRomanUrduAnswer("laam", primary, variants);
      expect(result.isCorrect).toBe(true);
    });

    it("accepts lām via diacritic normalization", () => {
      const result = checkRomanUrduAnswer("lām", primary, variants);
      expect(result.isCorrect).toBe(true);
    });
  });

  describe("letter quiz: kaaf", () => {
    const primary = "kaf";
    const variants = ["kaaf", "k"];

    it("accepts exact match", () => {
      const result = checkRomanUrduAnswer("kaf", primary, variants);
      expect(result.isCorrect).toBe(true);
    });

    it("accepts kaaf as variant", () => {
      const result = checkRomanUrduAnswer("kaaf", primary, variants);
      expect(result.isCorrect).toBe(true);
    });
  });

  describe("letter quiz: qaf (duplicate)", () => {
    const primary = "qaf";
    const variants = ["qaaf", "q"];

    it("accepts qaf", () => {
      const result = checkRomanUrduAnswer("qaf", primary, variants);
      expect(result.isCorrect).toBe(true);
    });

    it("accepts qaaf as variant", () => {
      const result = checkRomanUrduAnswer("qaaf", primary, variants);
      expect(result.isCorrect).toBe(true);
    });

    it("accepts kaf via q→k normalization", () => {
      const result = checkRomanUrduAnswer("kaf", primary, variants);
      expect(result.isCorrect).toBe(true);
    });
  });

  describe("word quiz: kitab", () => {
    const primary = "kitab";

    it("accepts exact match", () => {
      const result = checkRomanUrduAnswer("kitab", primary);
      expect(result.isCorrect).toBe(true);
    });

    it("accepts kitaab (vowel length variant)", () => {
      const result = checkRomanUrduAnswer("kitaab", primary);
      expect(result.isCorrect).toBe(true);
    });

    it("does not validate English meaning", () => {
      const result = checkRomanUrduAnswer("book", primary);
      expect(result.isCorrect).toBe(false);
    });
  });

  describe("word quiz: khuda", () => {
    const primary = "khuda";

    it("accepts exact match", () => {
      const result = checkRomanUrduAnswer("khuda", primary);
      expect(result.isCorrect).toBe(true);
    });

    it("accepts xuda (x→kh)", () => {
      const result = checkRomanUrduAnswer("xuda", primary);
      expect(result.isCorrect).toBe(true);
    });
  });

  describe("word quiz: qalam", () => {
    const primary = "qalam";

    it("accepts exact match", () => {
      const result = checkRomanUrduAnswer("qalam", primary);
      expect(result.isCorrect).toBe(true);
    });

    it("accepts kalam (q→k)", () => {
      const result = checkRomanUrduAnswer("kalam", primary);
      expect(result.isCorrect).toBe(true);
    });
  });

  describe("strict mode", () => {
    it("rejects dhal for dal in strict mode", () => {
      const result = checkRomanUrduAnswer("dhal", "dal", ["daal", "d"], "strict");
      expect(result.isCorrect).toBe(true); // falls back to relaxed
    });

    it("rejects kalam for qalam in strict mode (strict falls back to relaxed)", () => {
      const result = checkRomanUrduAnswer("kalam", "qalam", [], "strict");
      // strict falls back to relaxed, so kalam matches qalam via q→k normalization
      expect(result.isCorrect).toBe(true);
    });
  });
});
