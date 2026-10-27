// What the student answers in practice, and how it is checked. Built from the same solution as the lesson.
// A question has parts, in the order of the solution (like the exam's א, ב, ג).

import type { Solution } from './solve';
import { Frac, F } from './frac';
import { fmt } from './format';
import { formulaTex, bondTex } from './chem';

export type Part =
  | { kind: 'number'; label: string; unit: string; answer: Frac; decimals?: number }
  | { kind: 'choice'; label: string; options: string[]; correct: number };

const S = (who: string) => `\\Delta S^\\circ_{\\text{${who}}}`;
const DH = '\\Delta H^\\circ';
const num = (label: string, unit: string, answer: Frac, decimals?: number): Part => ({ kind: 'number', label: `$${label} =$`, unit, answer, decimals });
const choice = (label: string, options: string[], correct: number): Part => ({ kind: 'choice', label, options, correct });
const SIGN2 = ['חיובי', 'שלילי'];

export function partsOf(sol: Solution): Part[] {
  const d = sol.opts.decimals;
  switch (sol.type) {
    case 'spontaneous': {
      const parts: Part[] = [];
      if (sol.dHfrom) parts.push(num(DH, 'kJ', sol.dHfrom.total));
      if (sol.dSfrom) parts.push(num(S('מערכת'), 'J/K', sol.dSfrom.total, d));
      parts.push(num(S('סביבה'), 'J/K', sol.dSsurr, d));
      if (!sol.surrOnly) parts.push(num(S('יקום'), 'J/K', sol.dStot, d), choice('התהליך:', ['ספונטני', 'לא ספונטני'], sol.spont ? 0 : 1));
      return parts;
    }
    case 'back':
      return sol.find === 'dH'
        ? [...(sol.surrGiven ? [] : [num(S('סביבה'), 'J/K', sol.dSsurr, d)]), num(DH, 'kJ', sol.dH, 2)]
        : [num(S('סביבה'), 'J/K', sol.dSsurr, d), num(S('מערכת'), 'J/K', sol.dSsys!, d)];
    case 'signs': {
      const a = sol.answer;
      if (a.kind === 'sign')
        return a.key === 'dH' ? [choice('התגובה:', ['אקסותרמית', 'אנדותרמית'], a.sign < 0 ? 0 : 1)] : [choice('הסימן:', SIGN2, a.sign > 0 ? 0 : 1)];
      if (a.kind === 'spont') return [choice('התהליך:', ['ספונטני', 'לא ספונטני'], a.spont ? 0 : 1)];
      if (a.kind === 'compare') return [choice('גדול יותר בערכו המוחלט:', ['השינוי באנטרופיה של הסביבה', 'השינוי באנטרופיה של המערכת'], a.bigger === 'dSsurr' ? 0 : 1)];
      if (a.kind === 'any-T') return [choice('יש טמפרטורה שבה התגובה ספונטנית?', ['כן, בכל טמפרטורה', 'לא, באף טמפרטורה'], a.always ? 0 : 1)];
      return [];
    }
    case 'kinetic':
      return sol.find === 'why'
        ? [choice('למה התגובה לא מתרחשת?', ['אנרגיית השפעול גבוהה', 'התגובה לא ספונטנית', 'אין מספיק מגיבים'], 0), choice('מה יעזור?', ['חימום או זרז', 'קירור', 'שום דבר'], 0)]
        : [choice('זרז יעזור?', ['כן', 'לא'], sol.spont ? 0 : 1)];
    case 'dS-sign':
      return [choice(`הסימן של $${S('מערכת')}$:`, ['חיובי', 'שלילי', 'לא ניתן לקבוע (קטן)'], sol.sign > 0 ? 0 : sol.sign < 0 ? 1 : 2)];
    case 'dS':
      return [num(S('מערכת'), 'J/K', sol.pr.total)];
    case 'S-unknown':
      return [num(`S^\\circ(${formulaTex(sol.pr.x!.sp.f)})`, 'J/(mol·K)', sol.pr.x!.v, d)];
    case 'dH-formation':
      return [num(DH, 'kJ', sol.pr.total)];
    case 'dHf-unknown':
      return [num(`\\Delta H^\\circ_f(${formulaTex(sol.pr.x!.sp.f)})`, 'kJ/mol', sol.pr.x!.v, d)];
    case 'heat':
      return [
        ...(sol.nFromMass && sol.m ? [num('n', 'mol', sol.n)] : []),
        num('q', 'kJ', sol.q),
        choice('החום:', ['נפלט', 'נבלע'], sol.released ? 0 : 1),
      ];
    case 'mass-for-heat':
      return [num('n', 'mol', sol.n), num('m', 'g', sol.m!)];
    case 'dH-from-q':
      return [...(sol.nFromMass && sol.m ? [num('n', 'mol', sol.n)] : []), num(DH, 'kJ', sol.dH)];
    case 'dH-new':
      return [num(`${DH}_{\\text{חדש}}`, 'kJ', sol.dHnew)];
    case 'phase-compare':
      if (sol.options && sol.pick != null) return [choice('הערך המתאים:', sol.options.map((o) => `$${fmt(o).s}\\,\\mathrm{kJ}$`), sol.pick)];
      if (sol.pure) return [choice(`הסימן של $${DH}$:`, SIGN2, sol.pure.sign > 0 ? 0 : 1)];
      return [choice('בתגובה השנייה נפלטת:', ['יותר אנרגיה', 'פחות אנרגיה'], sol.verdict === 'lower' ? 0 : 1)];
    case 'dH-bonds':
      return [num('\\Sigma_{\\text{נשברים}}', 'kJ', sol.sumB!), num('\\Sigma_{\\text{נוצרים}}', 'kJ', sol.sumF!), num(DH, 'kJ', sol.dH)];
    case 'bond-unknown':
      return [num(bondTex(sol.x!.bond), 'kJ/mol', sol.x!.v)];
    case 'collision':
      return [choice('ההיגד הנכון:', sol.claims.map((c) => `היגד ${c.label}`), sol.correct)];
    case 'diagram':
      return [
        num(DH, 'kJ', sol.dH),
        num('E_a(\\text{קדימה})', 'kJ', sol.eaF),
        num('E_a(\\text{אחורה})', 'kJ', sol.eaR),
        ...(sol.eaFc ? [num('E_a(\\text{עם זרז})', 'kJ', sol.eaFc)] : []),
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
  const f = fmt(p.answer, p.decimals != null ? { decimals: p.decimals } : { sig: 5 });
  return `${p.label.replace(/=\$$/, `${f.approx ? '\\approx' : '='} ${f.s}\\,\\mathrm{${p.unit.replace('·', '\\cdot ')}}$`)}`;
}
