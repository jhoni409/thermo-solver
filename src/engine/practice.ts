// What the student answers in practice mode, and how it is checked. Built from the same solution as the lesson.

import type { Solution } from './solve';
import { Frac, F } from './frac';
import { fmt } from './format';

export type Practice =
  | { kind: 'number'; label: string; answer: Frac; decimals?: number }
  | { kind: 'choice'; options: string[]; correct: number[]; multi: boolean }
  | { kind: 'self' };

export function practiceOf(sol: Solution): Practice {
  switch (sol.type) {
    case 'spontaneous':
      return { kind: 'choice', options: ['ספונטני', 'לא ספונטני'], correct: [sol.spont ? 0 : 1], multi: false };
  }
}

/** a typed number is right when it matches the answer as the app shows it, rounded or cut ("לא לעגל") */
export function checkNumber(p: Extract<Practice, { kind: 'number' }>, typed: string): boolean {
  let v: Frac;
  try {
    v = F(typed.replace(',', '.').trim());
  } catch {
    return false;
  }
  if (v.eq(p.answer)) return true;
  const o = p.decimals != null ? { decimals: p.decimals } : { sig: 4 };
  if (fmt(p.answer, o).s === fmt(v, o).s) return true;
  // allow 1% when the student rounded differently
  const a = p.answer.toNumber();
  return a !== 0 && Math.abs(v.toNumber() - a) / Math.abs(a) <= 0.01;
}

export const answerText = (p: Practice): string => {
  switch (p.kind) {
    case 'number': {
      const f = fmt(p.answer, p.decimals != null ? { decimals: p.decimals } : {});
      return `${p.label.replace(/=\$$/, `${f.approx ? '\\approx' : '='} ${f.s}$`)}`;
    }
    case 'choice':
      return p.correct.map((i) => p.options[i]).join(' · ');
    case 'self':
      return '';
  }
};
