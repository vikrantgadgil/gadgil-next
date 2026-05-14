"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { UrduLetter } from "@/lib/urdu/letters"
type Props = {
  letter: UrduLetter
  open: boolean
  onClose: () => void
}

const FORMS = ["standalone", "initial", "medial", "final"] as const
type Form = typeof FORMS[number]

const FORM_LABELS: Record<Form, string> = {
  standalone: "Standalone",
  initial:    "Initial",
  medial:     "Medial",
  final:      "Final",
}

export function UrduLetterDetail({ letter, open, onClose }: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent>
        {/* ── Header ────────────────────────────────────────── */}
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <p
                className="text-5xl font-[family-name:var(--font-nastaliq)] leading-none"
                dir="rtl"
                lang="ur"
              >
                {letter.standalone.glyph}
              </p>
            </div>
            <div>
              <DialogTitle className="capitalize">{letter.name}</DialogTitle>
              <p className="mt-0.5 text-sm text-slate-500">All positional forms</p>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-6">

          {/* ── Forms grid — desktop ──────────────────────── */}
          <div className="hidden sm:block overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3 text-left">Form</th>
                  <th className="px-4 py-3 text-center">Nastaliq</th>
                  <th className="px-4 py-3 text-center">Naskh</th>
                  <th className="px-4 py-3 text-left">Sample word</th>
                </tr>
              </thead>
              <tbody>
                {FORMS.map((form) => {
                  const formData = letter[form]
                  const word = letter.sample_words[form]
                  return (
                    <tr key={form} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3">
                        <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                          {FORM_LABELS[form]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <p
                            className="text-4xl font-[family-name:var(--font-nastaliq)] leading-none"
                            dir="rtl"
                            lang="ur"
                          >
                            {formData.glyph}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <p
                          className="text-4xl font-[family-name:var(--font-naskh)] leading-none"
                          dir="rtl"
                          lang="ur"
                        >
                          {formData.glyph}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          <a
                            href={`/urdu/word?q=${encodeURIComponent(word.roman)}`}
                            className="group inline-block rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-50 flex-1"
                          >
                            <div className="flex items-center gap-3" dir="rtl">
                              <p
                                className="text-xl font-[family-name:var(--font-nastaliq)] leading-none"
                                lang="ur"
                              >
                                {word.urdu_script}
                              </p>
                              <p
                                className="text-xl font-[family-name:var(--font-naskh)] leading-none text-slate-400"
                                lang="ur"
                              >
                                {word.urdu_script}
                              </p>
                            </div>
                            <p className="mt-1 font-mono text-xs text-slate-600">{word.roman}</p>
                            <p className="text-xs text-slate-400">{word.meaning}</p>
                            <p className="mt-0.5 text-xs text-slate-300 transition-colors group-hover:text-slate-500">
                              See full breakdown →
                            </p>
                          </a>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* ── Forms grid — mobile ───────────────────────── */}
          <div className="sm:hidden space-y-3">
            {FORMS.map((form) => {
              const formData = letter[form]
              const word = letter.sample_words[form]
              return (
                <div key={form} className="rounded-xl border border-slate-200 bg-white p-4">
                  <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 mb-3">
                    {FORM_LABELS[form]}
                  </span>
                  <div className="flex items-center gap-6 mb-3">
                    <div className="flex flex-col items-center gap-1">
                      <p
                        className="text-4xl font-[family-name:var(--font-nastaliq)] leading-none"
                        dir="rtl"
                        lang="ur"
                      >
                        {formData.glyph}
                      </p>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-slate-400">Nastaliq</span>
                      </div>
                    </div>
                    <div className="h-8 w-px bg-slate-200" />
                    <div className="flex flex-col items-center gap-1">
                      <p
                        className="text-4xl font-[family-name:var(--font-naskh)] leading-none"
                        dir="rtl"
                        lang="ur"
                      >
                        {formData.glyph}
                      </p>
                      <span className="text-xs text-slate-400">Naskh</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <a
                      href={`/urdu/word?q=${encodeURIComponent(word.roman)}`}
                      className="flex items-start gap-3 rounded-lg bg-slate-50 px-3 py-2.5 transition-colors hover:bg-slate-100 flex-1"
                    >
                      <div dir="rtl" className="flex gap-2 shrink-0">
                        <p
                          className="text-xl font-[family-name:var(--font-nastaliq)] leading-none"
                          lang="ur"
                        >
                          {word.urdu_script}
                        </p>
                        <p
                          className="text-xl font-[family-name:var(--font-naskh)] leading-none text-slate-400"
                          lang="ur"
                        >
                          {word.urdu_script}
                        </p>
                      </div>
                      <div>
                        <p className="font-mono text-xs text-slate-600">{word.roman}</p>
                        <p className="text-xs text-slate-400">{word.meaning}</p>
                        <p className="text-xs text-slate-300">See full breakdown →</p>
                      </div>
                    </a>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Pronunciation ──────────────────────────────── */}
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Pronunciation
            </p>
            <p className="text-sm text-slate-700">{letter.pronunciation}</p>
          </div>

          {/* ── Mnemonic ───────────────────────────────────── */}
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Remember it
            </p>
            <p className="text-sm text-slate-700">{letter.mnemonic}</p>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  )
}
