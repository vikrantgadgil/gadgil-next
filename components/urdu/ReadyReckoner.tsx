"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { UrduCharacter } from "@/lib/data/urdu-characters";
import { URDU_CHARACTERS } from "@/lib/data/urdu-characters";
// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FormKey = "isolated" | "initial" | "medial" | "final";
type FontMode = "nastaliq" | "naskh";

const FORM_LABELS: Record<FormKey, string> = {
  isolated: "Isolated",
  initial: "Initial",
  medial: "Medial",
  final: "Final",
};

const FORM_ORDER: FormKey[] = ["isolated", "initial", "medial", "final"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Some letters (daal, re groups) don't connect to the left — their initial
 *  and medial forms are the same as isolated. We detect this when the glyph
 *  for initial matches isolated. */
function hasDistinctForms(character: UrduCharacter): boolean {
  return character.forms.initial !== character.forms.isolated;
}

/** Highlight the position of a letter form within a word. Returns the word
 *  split into parts: before, match, after.
 *
 *  Searches for the base character (not the presentation-form glyph) since
 *  example words use standard Arabic codepoints. */
function highlightInWord(
  word: string,
  baseChar: string,
): { before: string; match: string; after: string } {
  const idx = word.indexOf(baseChar);
  if (idx === -1) {
    return { before: "", match: word, after: "" };
  }
  return {
    before: word.slice(0, idx),
    match: word.slice(idx, idx + baseChar.length),
    after: word.slice(idx + baseChar.length),
  };
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type Props = {
  /** Optional pre-fetched characters from the server. Falls back to static import. */
  initialCharacters?: UrduCharacter[];
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReadyReckoner({ initialCharacters }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── State ──────────────────────────────────────────────────────────────
  const [characters, setCharacters] = useState<UrduCharacter[]>(
    initialCharacters ?? URDU_CHARACTERS,
  );
  const [loading, setLoading] = useState(!initialCharacters);
  const [activeFont, setActiveFont] = useState<FontMode>(
    (searchParams.get("font") as FontMode) ?? "nastaliq",
  );
  const [selectedId, setSelectedId] = useState<number | null>(
    searchParams.get("char") ? Number(searchParams.get("char")) : null,
  );
  const [selectedForm, setSelectedForm] = useState<FormKey>(
    (searchParams.get("form") as FormKey) ?? "isolated",
  );
  const [detailOpen, setDetailOpen] = useState(false);

  const detailPanelRef = useRef<HTMLDivElement>(null);

  // ── Fetch data if not provided ─────────────────────────────────────────
  useEffect(() => {
    if (initialCharacters) return;
    fetch("/api/urdu-characters")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.characters?.length) {
          setCharacters(data.characters);
        }
      })
      .catch(() => {
        // Fallback to static data already set in state
      })
      .finally(() => setLoading(false));
  }, [initialCharacters]);

  // ── Sync URL state ─────────────────────────────────────────────────────
  const updateUrl = useCallback(
    (charId: number | null, form: FormKey, font: FontMode) => {
      const params = new URLSearchParams();
      if (charId !== null) params.set("char", String(charId));
      if (form !== "isolated") params.set("form", form);
      if (font !== "nastaliq") params.set("font", font);
      const qs = params.toString();
      router.replace(`/urdu/ready-reckoner${qs ? `?${qs}` : ""}`, {
        scroll: false,
      });
    },
    [router],
  );

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleFormClick = useCallback(
    (charId: number, form: FormKey) => {
      setSelectedId(charId);
      setSelectedForm(form);
      setDetailOpen(true);
      updateUrl(charId, form, activeFont);
      // Focus management: focus the detail panel after render
      requestAnimationFrame(() => {
        detailPanelRef.current?.focus();
      });
    },
    [activeFont, updateUrl],
  );

  const handleCloseDetail = useCallback(() => {
    setDetailOpen(false);
  }, []);

  const handleFontChange = useCallback(
    (font: FontMode) => {
      setActiveFont(font);
      updateUrl(selectedId, selectedForm, font);
    },
    [selectedId, selectedForm, updateUrl],
  );

  // ── Derived data ───────────────────────────────────────────────────────
  const selectedCharacter = useMemo(
    () => characters.find((c) => c.id === selectedId) ?? null,
    [characters, selectedId],
  );

  const selectedExample = selectedCharacter
    ? selectedCharacter.examples[selectedForm]
    : null;

  const selectedGlyph = selectedCharacter
    ? selectedCharacter.forms[selectedForm]
    : null;

  const fontFamily =
    activeFont === "nastaliq"
      ? "var(--font-nastaliq)"
      : "var(--font-naskh)";

  // ── Keyboard navigation ────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, charId: number) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleFormClick(charId, "isolated");
      }
    },
    [handleFormClick],
  );

  // ── Loading state ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-slate-400">Loading characters…</p>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Urdu Alphabet — Ready Reckoner
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Click any letter form to see an example word.
        </p>
      </div>

      {/* ── Font Toggle ────────────────────────────────────── */}
      <div className="mb-6 flex items-center gap-2">
        <span className="text-xs font-medium text-slate-400">Font:</span>
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
          {(["nastaliq", "naskh"] as const).map((font) => (
            <button
              key={font}
              onClick={() => handleFontChange(font)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                activeFont === font
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
              aria-pressed={activeFont === font}
              aria-label={`Switch to ${font} font`}
            >
              {font === "nastaliq" ? "Nastaliq" : "Naskh"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Desktop Table ──────────────────────────────────── */}
      <div className="hidden sm:block overflow-hidden rounded-xl border border-slate-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Character
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Name
              </TableHead>
              {FORM_ORDER.map((form) => (
                <TableHead
                  key={form}
                  className="text-center text-xs font-semibold uppercase tracking-wider text-slate-400"
                >
                  {FORM_LABELS[form]}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {characters.map((char) => {
              const isSelected = selectedId === char.id;
              return (
                <TableRow
                  key={char.id}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? "bg-primary/10 hover:bg-primary/10" : ""
                  }`}
                  onClick={() => handleFormClick(char.id, "isolated")}
                  onKeyDown={(e) => handleKeyDown(e, char.id)}
                  tabIndex={0}
                  role="button"
                  aria-label={`${char.name} — ${char.character}`}
                  aria-selected={isSelected}
                >
                  {/* Character glyph */}
                  <TableCell>
                    <p
                      className="text-4xl leading-none text-center"
                      style={{ fontFamily: fontFamily }}
                      dir="rtl"
                      lang="ur"
                      aria-hidden="true"
                    >
                      {char.character}
                    </p>
                  </TableCell>

                  {/* Name */}
                  <TableCell>
                    <span className="text-sm font-medium text-slate-700 capitalize">
                      {char.name}
                    </span>
                  </TableCell>

                  {/* Forms */}
                  {FORM_ORDER.map((form) => {
                    const glyph = char.forms[form];
                    const isSame =
                      form === "initial" || form === "medial"
                        ? !hasDistinctForms(char)
                        : false;
                    return (
                      <TableCell key={form} className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFormClick(char.id, form);
                            }}
                            className={`inline-flex items-center justify-center rounded-lg p-2 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 ${
                              isSelected && selectedForm === form
                                ? "ring-2 ring-slate-400"
                                : ""
                            }`}
                            aria-label={`${char.name} ${FORM_LABELS[form]} form`}
                          >
                            {isSame ? (
                              <span className="text-xs text-slate-300">—</span>
                            ) : (
                              <p
                                className="text-4xl leading-none"
                                style={{ fontFamily: fontFamily }}
                                dir="rtl"
                                lang="ur"
                              >
                                {glyph}
                              </p>
                            )}
                          </button>
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* ── Mobile Cards ───────────────────────────────────── */}
      <div className="sm:hidden space-y-3">
        {characters.map((char) => {
          const isSelected = selectedId === char.id;
          return (
            <div
              key={char.id}
              className={`rounded-xl border bg-white p-4 transition-colors ${
                isSelected
                  ? "border-primary/30 bg-primary/5"
                  : "border-slate-200"
              }`}
            >
              {/* Card header */}
              <div className="mb-3 flex items-center gap-3">
                <p
                  className="text-3xl leading-none"
                  style={{ fontFamily: fontFamily }}
                  dir="rtl"
                  lang="ur"
                >
                  {char.character}
                </p>
                <span className="text-sm font-medium text-slate-700 capitalize">
                  {char.name}
                </span>
              </div>

              {/* Forms grid */}
              <div className="grid grid-cols-4 gap-1">
                {FORM_ORDER.map((form) => {
                  const glyph = char.forms[form];
                  const isSame =
                    form === "initial" || form === "medial"
                      ? !hasDistinctForms(char)
                      : false;
                  return (
                    <button
                      key={form}
                      onClick={() => handleFormClick(char.id, form)}
                      className={`flex flex-col items-center gap-1 rounded-lg p-2 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 ${
                        isSelected && selectedForm === form
                          ? "bg-slate-100 ring-2 ring-slate-300"
                          : ""
                      }`}
                      aria-label={`${char.name} ${FORM_LABELS[form]} form`}
                    >
                      {isSame ? (
                        <span className="text-xs text-slate-300 py-2">—</span>
                      ) : (
                        <p
                          className="text-2xl leading-none"
                          style={{ fontFamily: fontFamily }}
                          dir="rtl"
                          lang="ur"
                        >
                          {glyph}
                        </p>
                      )}
                      <span className="text-[10px] font-medium text-slate-400">
                        {FORM_LABELS[form]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Detail Dialog ──────────────────────────────────── */}
      <Dialog open={detailOpen} onOpenChange={(v) => { if (!v) handleCloseDetail() }}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-4">
              <p
                className="text-5xl font-[family-name:var(--font-nastaliq)] leading-none"
                dir="rtl"
                lang="ur"
              >
                {selectedCharacter?.character}
              </p>
              <div>
                <DialogTitle className="capitalize">
                  {selectedCharacter?.name}
                </DialogTitle>
                <p className="mt-0.5 text-sm text-slate-500">
                  {FORM_LABELS[selectedForm]} form
                </p>
              </div>
            </div>
          </DialogHeader>

          {!selectedCharacter ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-slate-400">Character not found.</p>
            </div>
          ) : (
          <div className="px-6 py-5 space-y-6">
            {/* Selected form display */}
            <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Selected Form — {FORM_LABELS[selectedForm]}
              </p>
              <div className="flex items-center gap-6">
                <p
                  className="text-6xl leading-none font-[family-name:var(--font-nastaliq)]"
                  dir="rtl"
                  lang="ur"
                >
                  {selectedGlyph}
                </p>
                <div className="h-12 w-px bg-slate-200" />
                <p
                  className="text-6xl leading-none font-[family-name:var(--font-naskh)]"
                  dir="rtl"
                  lang="ur"
                >
                  {selectedGlyph}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                  Nastaliq
                </span>
                <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                  Naskh
                </span>
              </div>
            </div>

            {/* Example word */}
            {selectedExample && selectedGlyph && (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Example Word
                </p>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-4" dir="rtl" lang="ur">
                    {/* Word with highlighted form */}
                    <p
                      className="text-3xl leading-none font-[family-name:var(--font-nastaliq)]"
                      dir="rtl"
                      lang="ur"
                    >
                      {(() => {
                        const parts = highlightInWord(
                          selectedExample.word,
                          selectedCharacter!.character,
                        );
                        return (
                          <>
                            {parts.before && (
                              <span className="text-slate-300">
                                {parts.before}
                              </span>
                            )}
                            <span className="text-slate-900 underline decoration-slate-400 decoration-2 underline-offset-4">
                              {parts.match}
                            </span>
                            {parts.after && (
                              <span className="text-slate-300">
                                {parts.after}
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </p>
                  </div>
                  <div className="mt-3 space-y-1">
                    <p className="font-mono text-sm text-slate-600">
                      {selectedExample.transliteration}
                    </p>
                    <p className="text-sm text-slate-400">
                      {selectedExample.meaning}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* All forms mini-grid */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                All Forms
              </p>
              <div className="grid grid-cols-4 gap-2">
                {FORM_ORDER.map((form) => {
                  const glyph = selectedCharacter?.forms[form] ?? "";
                  const isActive = form === selectedForm;
                  return (
                    <div key={form} className="flex flex-col items-center gap-1">
                      <button
                        onClick={() => {
                          setSelectedForm(form);
                          updateUrl(
                            selectedId,
                            form,
                            activeFont,
                          );
                        }}
                        className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 ${
                          isActive
                            ? "border-slate-400 bg-slate-50 ring-1 ring-slate-300"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                        aria-label={`${selectedCharacter?.name} ${FORM_LABELS[form]} form`}
                        aria-current={isActive ? "true" : undefined}
                      >
                        <p
                          className="text-3xl leading-none"
                          style={{ fontFamily: fontFamily }}
                          dir="rtl"
                          lang="ur"
                        >
                          {glyph}
                        </p>
                        <span className="text-[10px] font-medium text-slate-400">
                          {FORM_LABELS[form]}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
