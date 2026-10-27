// One pure solver per question type. Rules are only the ones in BRIEF §5; every number is an exact Frac.

import { Frac, F } from './frac';
import { exactDecimal, type FmtOpts } from './format';
import { InputError, type Problem, type Reaction, type Temp } from './parse';

export interface Recog {
  type: string; // Hebrew chip
}

/** T14 + T15: ΔS°surroundings from ΔH° and T, then ΔS°universe, then spontaneous or not */
export interface SpontSol {
  type: 'spontaneous';
  recog: Recog;
  rxn?: Reaction;
  dH: { v: Frac; unit: 'kJ' | 'J' };
  dHJ: Frac; // ΔH° in J
  T: Temp;
  TC?: Frac; // the °C value when the question gives °C (room = 25)
  TK: Frac;
  dSsys: Frac;
  dSsurr: Frac;
  dStot: Frac;
  spont: boolean;
  opts: FmtOpts;
}

export type Solution = SpontSol;

/** T14: T = t(°C) + 273; room temperature = 25°C */
export const ROOM_C = F(25);
export const KELVIN = F(273);

export function toKelvin(T: Temp): { TC?: Frac; TK: Frac } {
  if (T.unit === 'K') return { TK: T.v };
  const TC = T.unit === 'room' ? ROOM_C : T.v;
  return { TC, TK: TC.add(KELVIN) };
}

/** decimal places of an exactly written number (0 for integers) */
export function places(f: Frac): number {
  const d = exactDecimal(f);
  return d && d.includes('.') ? d.split('.')[1].length : 0;
}

const EX_SPONT = 'dH = -92 kJ\ndS = -199 J/K\nT = 298 K\nask: spontaneous';

function spontaneous(p: Problem): SpontSol {
  if (!p.dH) throw new InputError('חסר $\\Delta H^\\circ$', EX_SPONT);
  if (p.dSsys == null) throw new InputError('חסר $\\Delta S^\\circ$ של המערכת', EX_SPONT);
  if (!p.T) throw new InputError('חסרה טמפרטורה', EX_SPONT);
  const dHJ = p.dH.unit === 'kJ' ? p.dH.v.mul(1000) : p.dH.v;
  const { TC, TK } = toKelvin(p.T);
  const dSsurr = dHJ.neg().div(TK); // T14
  const dStot = p.dSsys.add(dSsurr); // T15
  if (dStot.isZero()) throw new InputError('$\\Delta S^\\circ_{\\text{יקום}} = 0$: המקרה הזה לא נדרש בחומר');
  return {
    type: 'spontaneous',
    recog: { type: 'ספונטני? ← $\\Delta S^\\circ_{\\text{יקום}}$' },
    rxn: p.rxn,
    dH: p.dH,
    dHJ,
    T: p.T,
    TC,
    TK,
    dSsys: p.dSsys,
    dSsurr,
    dStot,
    spont: dStot.sign() > 0,
    // J/K values are shown with 1 decimal (or as many as the given ΔS° has), unless the question asks otherwise
    opts: { decimals: p.decimals ?? Math.max(1, places(p.dSsys)) },
  };
}

export function solve(p: Problem): Solution {
  switch (p.ask) {
    case 'spontaneous':
      return spontaneous(p);
  }
}
