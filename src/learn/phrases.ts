// The exam-wording dictionary: every phrase an exam uses, what it means, and what to do with it.
// Wordings come from the user's course ("תרמודינמיקה ואנטרופיה – 21 תרגילים") and the מיקוד; each phrase in a
// question text is marked «wording|tag» and decoded in the first cards of the lesson.

import type { Problem } from '../engine/parse';
import { num } from '../engine/format';
import { toKelvin } from '../engine/solve';

export type PhraseKind = 'given' | 'hidden' | 'ask' | 'verb';

export interface Phrase {
  kind: PhraseKind;
  /** what it means, Hebrew with $TeX$; may use the problem's values */
  means: (p: Problem) => string;
  /** what to do with it (short) */
  todo?: string;
  /** other wordings of the same thing, seen in the course (for the dictionary page) */
  also?: string[];
}

const DS = (who: string) => `\\Delta S^\\circ_{\\text{${who}}}`;

export const PHRASES: Record<string, Phrase> = {
  'g:dH': {
    kind: 'given',
    means: (p) => (p.dH ? `$\\Delta H^\\circ = ${num(p.dH.v)}\\,\\mathrm{${p.dH.unit}}$` : '$\\Delta H^\\circ$'),
    todo: 'נתון: שינוי האנתלפיה של התגובה',
    also: ['שינוי האנתלפיה', '$\\Delta H^\\circ$'],
  },
  'g:dS': {
    kind: 'given',
    means: (p) => (p.dSsys != null ? `$${DS('מערכת')} = ${num(p.dSsys)}\\,\\mathrm{J/K}$` : `$${DS('מערכת')}$`),
    todo: 'נתון: שינוי האנטרופיה של המערכת',
    also: ['שינוי האנטרופיה של המערכת', '$\\Delta S^\\circ$ מערכת'],
  },
  'g:T': {
    kind: 'given',
    means: (p) => {
      if (!p.T || p.T.unit === 'room') return '$T$';
      const { TC, TK } = toKelvin(p.T);
      return TC ? `$T = ${num(TC)} + 273 = ${num(TK)}\\,\\mathrm{K}$` : `$T = ${num(TK)}\\,\\mathrm{K}$`;
    },
    todo: 'נתונה הטמפרטורה (בנוסחה תמיד בקלווין)',
    also: ['בטמפרטורה של', 'ב־°C ...'],
  },
  // a value written with no words around it
  's:dH': {
    kind: 'given',
    means: () => 'שינוי האנתלפיה של התגובה, כפי שהיא כתובה',
  },
  's:dS': {
    kind: 'given',
    means: () => `זה $${DS('מערכת')}$`,
    todo: '$\\Delta S^\\circ$ בלי מילה = של המערכת (התגובה)',
  },
  's:T': {
    kind: 'given',
    means: (p) => PHRASES['g:T'].means(p),
    todo: 'הטמפרטורה (בנוסחה תמיד בקלווין)',
  },
  'h:room': {
    kind: 'hidden',
    means: () => '$T = 25 + 273 = 298\\,\\mathrm{K}$',
    todo: 'נתון נסתר: אין מספר, אבל יש טמפרטורה',
    also: ['בטמפרטורת החדר', 'בטמפרטורת חדר', 'בתנאי חדר'],
  },
  'h:same': {
    kind: 'hidden',
    means: () => 'באותה טמפרטורה שכתובה בשאלה',
    todo: 'לא מחליפים טמפרטורה',
    also: ['בתנאים אלו', 'בתנאים הנתונים'],
  },
  'a:surr': {
    kind: 'ask',
    means: () => `מחפשים $${DS('סביבה')}$`,
    todo: `$${DS('סביבה')} = -\\dfrac{\\Delta H^\\circ}{T}$`,
    also: ['שינוי האנטרופיה של הסביבה', 'שינוי האנטרופיה בסביבה', '$\\Delta S^\\circ$ סביבה'],
  },
  'a:tot': {
    kind: 'ask',
    means: () => `מחפשים $${DS('יקום')}$`,
    todo: `$${DS('יקום')} = ${DS('מערכת')} + ${DS('סביבה')}$`,
    also: ['שינוי האנטרופיה של היקום', '$\\Delta S^\\circ$ יקום', '$\\Delta S^\\circ$ כולל', 'TOTAL', '$\\Delta S^\\circ_t$'],
  },
  'a:spont': {
    kind: 'ask',
    means: () => `צריך את הסימן של $${DS('יקום')}$`,
    todo: `$${DS('יקום')} > 0$ ← ספונטני`,
    also: ['האם התהליך ספונטני', 'האם התגובה מתרחשת באופן ספונטני', 'ספונטני או לא ספונטני'],
  },
  'v:show': {
    kind: 'verb',
    means: () => 'כותבים: נוסחה ← הצבה ← תוצאה עם יחידות',
    also: ['פרטו חישוביכם', 'פרט חישוביך'],
  },
  'v:explain': {
    kind: 'verb',
    means: () => 'כותבים את הכלל במשפט (למה)',
    also: ['נמקו', 'נמק', 'הסבירו קביעתכם'],
  },
};

export const KIND_HE: Record<PhraseKind, string> = {
  given: 'נתון',
  hidden: 'נתון נסתר',
  ask: 'שואלים',
  verb: 'מה כותבים',
};
