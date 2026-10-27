// Endless problems: random but valid data for every question type, written in the same input format, plus the
// question in exam wording. The wordings vary on purpose (the ways the course asks the same thing), so the student
// learns to recognise them. Answers always come from the solver.
// Real substances only with data from the library (scaled or reversed); made-up data only for a "process" with no
// substances named (BRIEF §8).

import { parse, InputError } from './parse';
import { solve, type SpontSol } from './solve';
import { F, type Frac } from './frac';
import { fmt, num } from './format';

export type GenKind = 'spontaneous';

export const GEN_KINDS: { kind: GenKind; he: string; topic: string }[] = [{ kind: 'spontaneous', he: 'ספונטני? ($\\Delta S^\\circ$ יקום)', topic: 'spont' }];

export interface GenProblem {
  id: string;
  title: string;
  group: string;
  topic: string;
  input: string;
  text: string;
  kind: GenKind;
}

// ---------------------------------------------------------------- random

function rng(seed: number) {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type R = ReturnType<typeof rng>;
const pick = <T>(r: R, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)];
const int = (r: R, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));

// ---------------------------------------------------------------- data from the library (PROBLEMS.md P10/P11, CRC)

interface Real {
  R: [string, number][];
  P: [string, number][];
  dH: string; // kJ
  dS: string; // J/K
  k: string[]; // the multipliers that give a sensible equation
}

const REAL: Real[] = [
  { R: [['N2(g)', 1], ['H2(g)', 3]], P: [['NH3(g)', 2]], dH: '-92', dS: '-199', k: ['1', '1', '2', '1/2'] },
  { R: [['CaCO3(s)', 1]], P: [['CaO(s)', 1], ['CO2(g)', 1]], dH: '178', dS: '161', k: ['1', '1', '2'] },
  { R: [['H2O(l)', 1]], P: [['H2O(g)', 1]], dH: '44.0', dS: '118.8', k: ['1', '1', '2'] },
];

const side = (xs: [string, number][], k: Frac) =>
  xs
    .map(([f, c]) => {
      const v = k.mul(c);
      return `${v.eq(1) ? '' : num(v).includes('.') ? `${v.n}/${v.d}` : num(v)}${f}`;
    })
    .join(' + ');

function realData(r: R): { rxn: string; dH: Frac; dS: Frac } {
  const x = pick(r, REAL);
  const rev = r() < 0.4;
  const k = F(pick(r, x.k));
  const [L, Rt] = rev ? [x.P, x.R] : [x.R, x.P];
  const s = rev ? -1 : 1;
  return { rxn: `${side(L, k)} -> ${side(Rt, k)}`, dH: F(x.dH).mul(k).mul(s), dS: F(x.dS).mul(k).mul(s) };
}

// ---------------------------------------------------------------- wordings (from the course)

const W_SURR = ['«שינוי האנטרופיה של הסביבה|a:surr»', '«$\\Delta S^\\circ$ סביבה|a:surr»', '«שינוי האנטרופיה בסביבה|a:surr»'];
const W_TOT = ['«שינוי האנטרופיה של היקום|a:tot»', '«$\\Delta S^\\circ$ יקום (כולל, TOTAL)|a:tot»', '«$\\Delta S^\\circ_t$|a:tot» (יקום)'];
const W_SPONT = ['«האם התהליך ספונטני|a:spont»', '«האם התגובה מתרחשת באופן ספונטני|a:spont»', '«האם התהליך ספונטני או לא ספונטני|a:spont»'];
const W_ROOM = ['«בטמפרטורת החדר|h:room»', '«בטמפרטורת חדר|h:room»'];
const W_SAME = ['«בתנאים אלו|h:same»', '«בתנאים הנתונים|h:same»'];

function genSpont(r: R): { input: string; text: string } {
  const real = r() < 0.6;
  let rxn: string | null = null;
  let dH: Frac;
  let dS: Frac;
  if (real) ({ rxn, dH, dS } = realData(r));
  else {
    dH = F(pick(r, [-1, 1]) * int(r, 1, 50) * 5);
    dS = F(pick(r, [-1, 1]) * int(r, 1, 60) * 5);
  }
  const T = pick(r, ['room', 'room', '298 K', '25 C', '100 C', '350 K', '400 K', '500 K', '800 K', '1000 K', '1200 K', '1327 C']);
  const input = [rxn ? `rxn: ${rxn}` : '', `dH = ${num(dH)} kJ`, `dS = ${num(dS)} J/K`, `T = ${T}`, 'ask: spontaneous'].filter(Boolean).join('\n');

  const temp = T === 'room' ? pick(r, W_ROOM) : '«בטמפרטורה של|g:T» {T}';
  const lines: string[] = [];
  lines.push(rxn ? pick(r, ['נתונה התגובה: {rxn}', 'נתונה התגובה הבאה: {rxn}']) : 'נתון תהליך:');
  if (r() < 0.5) lines.push('«שינוי האנתלפיה|g:dH» בתהליך הוא {dH}, ו«שינוי האנטרופיה של המערכת|g:dS» הוא {dS}.');
  else lines.push('{dH}', '{dS}');
  const form = int(r, 0, 2);
  if (form === 0) {
    lines.push(`א. חשבו את ${pick(r, W_SURR)} ${temp}. «פרטו חישוביכם|v:show».`);
    lines.push(`ב. חשבו את ${pick(r, W_TOT)}.`);
    lines.push(`ג. ${pick(r, W_SPONT)} ${pick(r, W_SAME)}? «נמקו|v:explain».`);
  } else if (form === 1) {
    lines.push(`חשבו את ${pick(r, W_TOT)} ${temp}, וקבעו ${pick(r, W_SPONT)}. «פרטו חישוביכם|v:show».`);
  } else {
    lines.push(`קבעו ${pick(r, W_SPONT)} ${temp}. «פרטו חישוביכם|v:show».`);
  }
  return { input, text: lines.join('\n') };
}

/** the shown numbers must add up as shown: round(sys + surr) = sys + round(surr), and not 0.0 */
function cleanSpont(s: SpontSol): boolean {
  const o = s.opts;
  const surr = F(fmt(s.dSsurr, o).s);
  const tot = F(fmt(s.dStot, o).s);
  return !tot.isZero() && s.dSsys.add(surr).eq(tot);
}

// ---------------------------------------------------------------- entry

const KIND_HE = Object.fromEntries(GEN_KINDS.map((k) => [k.kind, k.he])) as Record<GenKind, string>;
const KIND_TOPIC = Object.fromEntries(GEN_KINDS.map((k) => [k.kind, k.topic])) as Record<GenKind, string>;

export function generate(kind: GenKind | 'any', seed: number): GenProblem {
  const r = rng(seed);
  const k: GenKind = kind === 'any' ? pick(r, GEN_KINDS).kind : kind;
  for (let attempt = 0; attempt < 40; attempt++) {
    const g = genSpont(r);
    try {
      const s = solve(parse(g.input));
      if (!cleanSpont(s)) continue;
      return { id: `g-${k}-${seed}`, title: `∞ ${KIND_HE[k]} · ${seed % 10000}`, group: '∞', topic: KIND_TOPIC[k], kind: k, ...g };
    } catch (e) {
      if (!(e instanceof InputError)) throw e;
    }
  }
  throw new Error(`generator gave up: ${k} ${seed}`);
}

/** "g-kind-1234" → the same problem again */
export function fromId(id: string): GenProblem | null {
  const m = /^g-([a-z-]+)-(\d+)$/.exec(id);
  if (!m || !GEN_KINDS.some((k) => k.kind === m[1])) return null;
  return generate(m[1] as GenKind, parseInt(m[2], 10));
}

/** the generator kind that matches a solved problem's type */
export function kindOfType(t: string): GenKind | null {
  return GEN_KINDS.some((k) => k.kind === t) ? (t as GenKind) : null;
}
