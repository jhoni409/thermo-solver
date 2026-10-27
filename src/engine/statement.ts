// The problem as short Hebrew lines, built from the parsed data (no free text is read).
// Each given value is a TeX segment with a key, so a step can light it up.

import type { Problem } from './parse';
import { slot } from './text';

export interface Seg {
  text?: string;
  tex?: string;
  key?: string;
  /** an exam phrase that the lesson decodes */
  phrase?: boolean;
}

export interface Statement {
  lines: Seg[][];
  ask: string; // Hebrew
}

/** ΔS° with a Hebrew label under it: מערכת / סביבה / יקום */
export const dS = (who: 'מערכת' | 'סביבה' | 'יקום') => `\\Delta S^\\circ_{\\text{${who}}}`;
export const DH = '\\Delta H^\\circ';
export const UNIT_SK = '\\,\\mathrm{J/K}';

const SIGN_ASK: Record<string, string> = {
  dH: 'התגובה אקסותרמית או אנדותרמית?',
  dSsys: `מה הסימן של $${dS('מערכת')}$?`,
  dSsurr: 'האנטרופיה של הסביבה עולה או יורדת?',
  dStot: `מה הסימן של $${dS('יקום')}$?`,
  spont: 'האם התגובה ספונטנית?',
  compare: 'מי גדול יותר בערכו המוחלט: השינוי באנטרופיה של הסביבה או של המערכת?',
  'any-T': 'האם יש טמפרטורה שבה התגובה ספונטנית?',
};

function askHe(p: Problem): string {
  switch (p.ask) {
    case 'spontaneous':
      return p.dSsys == null && !p.S0 ? `חשבו את $${dS('סביבה')}$.` : `חשבו את $${dS('סביבה')}$ ואת $${dS('יקום')}$. האם התהליך ספונטני?`;
    case 'back':
      return p.dH ? `חשבו את $${dS('מערכת')}$.` : `חשבו את $${DH}$.`;
    case 'signs':
      return SIGN_ASK[p.find ?? 'spont'] ?? '';
    case 'kinetic':
      return p.find === 'catalyst' ? 'האם הוספת זרז תגרום לתגובה להתרחש?' : 'התגובה לא מתרחשת. למה? מה אפשר לעשות?';
    case 'dS-sign':
      return `מה הסימן של $${dS('מערכת')}$: חיובי, שלילי או לא ניתן לקבוע?`;
    case 'dS':
      return `חשבו את $${dS('מערכת')}$.`;
    case 'S-unknown':
      return 'חשבו את $S^\\circ$ החסר (x).';
    case 'dH-formation':
      return `חשבו את $${DH}$ של התגובה.`;
    case 'dHf-unknown':
      return 'חשבו את $\\Delta H^\\circ_f$ החסר (x).';
    case 'heat':
      return 'כמה חום נפלט או נבלע?';
    case 'mass-for-heat':
      return 'כמה גרם צריך?';
    case 'dH-from-q':
      return `מהו $${DH}$ של התגובה כפי שהיא כתובה?`;
    case 'dH-new':
      return `מהו $${DH}$ של התגובה החדשה?`;
    case 'phase-compare':
      return p.options ? 'איזה ערך מתאים?' : p.newRxn ? 'באיזו תגובה נפלטת יותר אנרגיה?' : `מה הסימן של $${DH}$?`;
    case 'dH-bonds':
      return `חשבו את $${DH}$ מאנרגיות הקשר.`;
    case 'bond-unknown':
      return 'חשבו את אנרגיית הקשר החסרה (x).';
    case 'diagram':
      return `חשבו את $${DH}$ ואת אנרגיות השפעול.`;
  }
}

/** the typed problem as lines: every given value through the same slots as the exam wording */
export function statement(p: Problem): Statement {
  const lines: Seg[][] = [];
  const put = (name: string, before?: string) => lines.push([...(before ? [{ text: before }] : []), slot(name, p)]);
  if (p.rxn) put('rxn');
  else lines.push([{ text: 'נתון תהליך:' }]);
  if (p.newRxn) put('new', 'תגובה נוספת: ');
  if (p.dH) put('dH');
  if (p.dSsys != null) put('dS');
  if (p.dSsurr != null) put('dSsurr');
  if (p.dStot != null) put('dStot');
  if (p.T) {
    if (p.T.unit === 'room') lines.push([{ text: 'בטמפרטורת החדר', key: 'T' }]);
    else put('T', 'בטמפרטורה ');
  }
  if (p.S0?.size || p.dHf?.size || p.dHfUnknown || p.bond?.size) put('table');
  const amount = (name: string, he: string) => lines.push([{ text: `${he} של ` }, slot('sp', p), { text: ': ' }, slot(name, p)]);
  if (p.m?.size) amount('m', 'מסה');
  if (p.M?.size) amount('M', 'מסה מולרית');
  if (p.n?.size) amount('n', 'מספר מולים');
  if (p.q) lines.push([slot('q', p), ...(p.qDir ? [{ text: p.qDir === 'released' ? ' נפלטו' : ' נבלעו' }] : [])]);
  if (p.options) put('opts', 'ערכים לבחירה: ');
  if (p.E) put('E');
  if (p.sign && Object.keys(p.sign).length) put('sign');
  if (p.observed === 'none') lines.push([{ text: 'התגובה לא נצפית בפועל.' }]);
  return { lines, ask: askHe(p) };
}
