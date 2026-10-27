// The problem as short Hebrew lines, built from the parsed data (no free text is read).
// Each given value is a TeX segment with a key, so a step can light it up.

import type { Problem } from './parse';
import { reactionTex } from './chem';
import { num } from './format';
import type { Frac } from './frac';

export interface Seg {
  text?: string;
  tex?: string;
  key?: string;
}

export interface Statement {
  lines: Seg[][];
  ask: string; // Hebrew
}

const n = (f: Frac) => num(f);

/** ΔS° with a Hebrew label under it: מערכת / סביבה / יקום */
export const dS = (who: 'מערכת' | 'סביבה' | 'יקום') => `\\Delta S^\\circ_{\\text{${who}}}`;
export const DH = '\\Delta H^\\circ';
export const UNIT_SK = '\\,\\mathrm{J/K}';

const ASK_HE: Record<string, string> = {
  spontaneous: `חשבו את $${dS('סביבה')}$ ואת $${dS('יקום')}$. האם התהליך ספונטני?`,
};

export function statement(p: Problem): Statement {
  const lines: Seg[][] = [];
  if (p.rxn) lines.push([{ tex: reactionTex(p.rxn), key: 'rxn' }]);
  else lines.push([{ text: 'נתון תהליך:' }]);
  if (p.dH) lines.push([{ tex: `${DH} = ${n(p.dH.v)}\\,\\mathrm{${p.dH.unit}}`, key: 'dH' }]);
  if (p.dSsys != null) lines.push([{ tex: `${dS('מערכת')} = ${n(p.dSsys)}${UNIT_SK}`, key: 'dS' }]);
  if (p.T) {
    if (p.T.unit === 'room') lines.push([{ text: 'בטמפרטורת החדר', key: 'T' }]);
    else if (p.T.unit === 'K') lines.push([{ text: 'בטמפרטורה ' }, { tex: `T = ${n(p.T.v)}\\,\\mathrm{K}`, key: 'T' }]);
    else lines.push([{ text: 'בטמפרטורה ' }, { tex: `${n(p.T.v)}^\\circ\\mathrm{C}`, key: 'T' }]);
  }
  return { lines, ask: ASK_HE[p.ask] ?? '' };
}
