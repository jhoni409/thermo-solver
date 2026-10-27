// What the student answers in practice, and how it is checked. Built from the same solution as the lesson.
// A question has parts, in the order of the solution (like the exam's א, ב, ג).

import type { Solution } from './solve';
import { Frac, F } from './frac';
import { fmt } from './format';

export type Part =
  | { kind: 'number'; label: string; unit: string; answer: Frac; decimals?: number }
  | { kind: 'choice'; label: string; options: string[]; correct: number };

const S = (who: string) => `\\Delta S^\\circ_{\\text{${who}}}`;

export function partsOf(sol: Solution): Part[] {
  switch (sol.type) {
    case 'spontaneous':
      return [
        { kind: 'number', label: `$${S('סביבה')} =$`, unit: 'J/K', answer: sol.dSsurr, decimals: sol.opts.decimals },
        { kind: 'number', label: `$${S('יקום')} =$`, unit: 'J/K', answer: sol.dStot, decimals: sol.opts.decimals },
        { kind: 'choice', label: 'התהליך:', options: ['ספונטני', 'לא ספונטני'], correct: sol.spont ? 0 : 1 },
      ];
  }
}

/**
 * A typed number is right when it is the answer as the app shows it, rounded or cut ("לא לעגל"),
 * or within one unit of the last decimal / 1% (when an earlier part was rounded).
 */
export function checkNumber(p: Extract<Part, { kind: 'number' }>, typed: string): boolean {
  let v: Frac;
  try {
    v = F(typed.replace(',', '.').replace(/[−–]/g, '-').trim());
  } catch {
    return false;
  }
  if (v.eq(p.answer)) return true;
  const d = p.decimals ?? 2;
  if (fmt(p.answer, { decimals: d }).s === fmt(v, { decimals: d }).s) return true;
  const diff = Math.abs(v.toNumber() - p.answer.toNumber());
  return diff <= 10 ** -d + 1e-9 || diff <= Math.abs(p.answer.toNumber()) * 0.01;
}

export function answerText(p: Part): string {
  if (p.kind === 'choice') return p.options[p.correct];
  const f = fmt(p.answer, p.decimals != null ? { decimals: p.decimals } : {});
  return `${p.label.replace(/=\$$/, `${f.approx ? '\\approx' : '='} ${f.s}\\,\\mathrm{${p.unit}}$`)}`;
}
