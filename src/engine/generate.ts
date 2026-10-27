// Endless problems for every question type. Each one is written in the input format (so the solver answers it)
// plus the question in exam wording. Nothing is typed by hand: the data are real values from the bank (bank.ts),
// scaled or reversed, and every number in the text is a value slot.
// Several solution paths per type (e.g. ΔH° given, or worked out from a table first), and the wordings vary the
// way the bagrut varies them, so the student learns to recognise the same question in other words.
// Every problem is checked before it is shown: it must parse, solve, render, have practice parts, and its numbers
// must come out clean. tests/generate.test.ts re-computes every answer independently.

import { parse, InputError, CLAIMS, type Ask, type Problem, type Change } from './parse';
import { solve, CLAIM_TRUE, type Solution, type SpontSol } from './solve';
import { claimHe } from './statement';
import { F, ZERO, type Frac } from './frac';
import { fmt, exactDecimal } from './format';
import { textLines } from './text';
import { partsOf } from './practice';
import { SPECIES, REACTIONS, BOND_RXNS, PHASES, BOND_SETS, BONDS_OF, bondsIn, dHfOf, S0of, isElementStd, molarMass, statesOf, type RealRxn, type Tag } from './bank';

export type GenKind = Ask;

export const GEN_KINDS: { kind: GenKind; he: string; topic: string }[] = [
  { kind: 'heat', he: 'כמה חום?', topic: 'exo' },
  { kind: 'mass-for-heat', he: 'כמה גרם?', topic: 'exo' },
  { kind: 'dH-from-q', he: '$\\Delta H^\\circ$ מכמות חום', topic: 'exo' },
  { kind: 'dH-new', he: 'תגובה הפוכה / כפולה', topic: 'exo' },
  { kind: 'phase-compare', he: 'מצב צבירה אחר', topic: 'phase' },
  { kind: 'dH-bonds', he: '$\\Delta H^\\circ$ מאנרגיות קשר', topic: 'bonds' },
  { kind: 'bond-unknown', he: 'אנרגיית קשר חסרה', topic: 'bonds' },
  { kind: 'diagram', he: 'דיאגרמת אנרגיה', topic: 'rate' },
  { kind: 'dS-sign', he: 'הסימן של $\\Delta S^\\circ$', topic: 'dS-sign' },
  { kind: 'dS', he: '$\\Delta S^\\circ$ מ־$S^\\circ$', topic: 'dS-calc' },
  { kind: 'S-unknown', he: '$S^\\circ$ חסר', topic: 'dS-calc' },
  { kind: 'dH-formation', he: '$\\Delta H^\\circ$ מ־$\\Delta H^\\circ_f$', topic: 'dHf' },
  { kind: 'dHf-unknown', he: '$\\Delta H^\\circ_f$ חסר', topic: 'dHf' },
  { kind: 'spontaneous', he: 'ספונטני?', topic: 'spont' },
  { kind: 'back', he: 'בחזרה מהיקום', topic: 'back' },
  { kind: 'signs', he: 'סימנים בלי חישוב', topic: 'signs' },
  { kind: 'kinetic', he: 'ספונטני אבל לא קורה', topic: 'kinetic' },
  { kind: 'collision', he: 'תורת ההתנגשויות', topic: 'kinetic' },
];

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
/** weighted pick: [value, weight][] */
function wpick<T>(r: R, xs: [T, number][]): T {
  let x = r() * xs.reduce((a, [, w]) => a + w, 0);
  for (const [v, w] of xs) if ((x -= w) < 0) return v;
  return xs[xs.length - 1][0];
}
function shuffle<T>(r: R, xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** a problem that cannot be used (unclean numbers, a case the material does not cover): try again */
class Retry extends Error {}
const need = (ok: unknown) => {
  if (!ok) throw new Retry();
};

// ---------------------------------------------------------------- reactions from the bank

interface Term {
  c: Frac;
  k: string; // "formula(state)"
}
interface Inst {
  R: Term[];
  P: Term[];
  he?: string; // the description, when the reaction is written the bank's way round
  tags: Tag[];
}

const fOf = (k: string) => k.replace(/\(.+\)$/, '');
const coefStr = (c: Frac) => (c.eq(1) ? '' : c.isInt() ? c.toString() : `${c.n}/${c.d}`);
const sideStr = (ts: Term[]) => ts.map((t) => `${coefStr(t.c)}${t.k}`).join(' + ');
const rxnStr = (x: Inst) => `${sideStr(x.R)} -> ${sideStr(x.P)}`;
const terms = (x: Inst) => [...x.R, ...x.P];
const keys = (x: Inst) => [...new Set(terms(x).map((t) => t.k))];
const total = (ts: Term[], f: (k: string) => Frac) => ts.reduce((a, t) => a.add(t.c.mul(f(t.k))), ZERO);
const dHof = (x: Inst) => total(x.P, dHfOf).sub(total(x.R, dHfOf));
const dSof = (x: Inst) => total(x.P, S0of).sub(total(x.R, S0of));
const gasOf = (ts: Term[]) => ts.filter((t) => t.k.endsWith('(g)')).reduce((a, t) => a.add(t.c), ZERO);

function inst(x: RealRxn, k: Frac, rev: boolean): Inst {
  const t = (s: [string, string][]) => s.map(([c, sp]) => ({ c: F(c).mul(k), k: sp }));
  const [Rs, Ps] = rev ? [t(x.P), t(x.R)] : [t(x.R), t(x.P)];
  return { R: Rs, P: Ps, he: rev ? undefined : x.he, tags: rev ? [] : x.tags };
}

/** a multiplier that keeps the coefficients readable: whole numbers or halves, not too big */
function scale(r: R, x: RealRxn, ks = ['1', '1', '1', '2', '1/2']): Frac {
  const ok = ks.map((k) => F(k)).filter((k) => [...x.R, ...x.P].every(([c]) => {
    const v = F(c).mul(k);
    return (v.d === 1n || v.d === 2n) && v.lt(30);
  }));
  return ok.length ? pick(r, ok) : F(1);
}

/** a reaction from the pool, sometimes multiplied or reversed (a combustion or a formation is not reversed: no one burns backwards) */
function realInst(r: R, pool: RealRxn[], rev = 0.35): Inst {
  const x = pick(r, pool);
  const back = r() < rev && !x.tags.includes('comb') && !x.tags.includes('form');
  return inst(x, scale(r, x), back);
}

/** the table lines of the input: S° of every species, ΔH°f of every species that is not an element (T7) */
const sLines = (x: Inst, hide?: string) => keys(x).map((k) => `S ${k} = ${k === hide ? 'x' : SPECIES[k].S}`);
const hLines = (x: Inst, hide?: string) => keys(x).filter((k) => !isElementStd(k)).map((k) => `dHf ${k} = ${k === hide ? 'x' : SPECIES[k].H}`);

/** a value as the input writes it: exact */
const ex = (f: Frac) => {
  const s = exactDecimal(f);
  if (s == null) throw new Retry();
  return s;
};
/** rounded to d decimals, as an exact value (what a question prints) */
const round = (f: Frac, d: number) => F(fmt(f, { decimals: d }).s);
const decimalsOf = (f: Frac) => {
  const s = exactDecimal(f);
  return s == null ? 99 : s.includes('.') ? s.split('.')[1].length : 0;
};

// ---------------------------------------------------------------- temperatures

interface TPick {
  line: string;
  TK: Frac;
  room: boolean;
}
const T_K = [298, 300, 350, 400, 450, 500, 600, 648, 700, 800, 900, 1000, 1200, 1500];
const T_C = [25, 100, 127, 200, 227, 327, 400, 500, 527, 727, 1000];
function temp(r: R, room = 0.3): TPick {
  const x = r();
  if (x < room) return { line: 'T = room', TK: F(298), room: true };
  if (x < room + (1 - room) * 0.6) {
    const t = pick(r, T_K);
    return { line: `T = ${t} K`, TK: F(t), room: false };
  }
  const t = pick(r, T_C);
  return { line: `T = ${t} C`, TK: F(t + 273), room: false };
}

// ---------------------------------------------------------------- wording

interface Verbs {
  calc: string;
  det: string;
  expl: string;
  show: string;
  write: string;
  why: string;
  here: string;
}
const PL: Verbs = { calc: 'חשבו', det: 'קבעו', expl: 'נמקו', show: 'פרטו את חישוביכם', write: 'רשמו', why: 'הסבירו', here: 'לפניכם' };
const SG: Verbs = { calc: 'חשב', det: 'קבע', expl: 'נמק', show: 'פרט את חישוביך', write: 'רשום', why: 'הסבר', here: 'לפניך' };
const verbs = (r: R) => (r() < 0.7 ? PL : SG);
const expl = (r: R, v: Verbs) => `«${pick(r, [v.expl, v.expl, v.why])}|v:explain»`;
const show = (v: Verbs) => `«${v.show}|v:show»`;
const LETTERS = ['א', 'ב', 'ג', 'ד', 'ה'];
const lettered = (parts: string[]) => (parts.length > 1 ? parts.map((p, i) => `${LETTERS[i]}. ${p}`) : parts);

function intro(r: R, x: Inst, v: Verbs): string {
  const opts = [`${v.here} ניסוח של תגובה: {rxn}`, 'נתונה התגובה: {rxn}', 'תגובה (1): {rxn}', 'נתונה התגובה הבאה: {rxn}'];
  if (x.he) opts.push(`${x.he}: {rxn}`, `${x.he}: {rxn}`);
  return pick(r, opts);
}

const tempPhrase = (r: R, T: TPick) =>
  T.room ? `«${pick(r, ['בטמפרטורת החדר', 'בטמפרטורת חדר'])}|h:room»` : pick(r, ['«בטמפרטורה של|g:T» {T}', '«בטמפרטורה|g:T» {T}', '«ב־|g:T»{T}']);
const samePhrase = (r: R) => `«${pick(r, ['בתנאים אלו', 'בתנאים הנתונים', 'באותה טמפרטורה'])}|h:same»`;

const TABLE_S = ['בטבלה שלפניכם מוצגים ערכים של אנטרופיה מולרית תקנית', 'בטבלה הנתונה מוצגים ערכי האנטרופיה המולרית התקנית', 'נתונות האנטרופיות המולריות התקניות'];
const TABLE_H = ['בטבלה שלפניכם מוצגים ערכים של אנתלפיית התהוות תקנית', 'בטבלה הנתונה מוצגות אנתלפיות ההתהוות התקניות', 'נתונות אנתלפיות ההיווצרות המולריות התקניות'];
const TABLE_SH = ['בטבלה שלפניכם מוצגים ערכי $S^\\circ$ וערכי $\\Delta H^\\circ_f$', 'בטבלה הנתונה מוצגים ערכים של אנטרופיה מולרית תקנית ושל אנתלפיית התהוות תקנית'];
const tableLine = (r: R, kind: 'S' | 'H' | 'SH') => `«${pick(r, kind === 'S' ? TABLE_S : kind === 'H' ? TABLE_H : TABLE_SH)}|g:table»: {table}`;

const W_SURR = ['שינוי האנטרופיה של הסביבה', 'השינוי באנטרופיה של הסביבה', '$\\Delta S^\\circ$ סביבה', 'שינוי האנטרופיה התקנית של הסביבה'];
const W_TOT = ['שינוי האנטרופיה של היקום', 'השינוי באנטרופיה של היקום', '$\\Delta S^\\circ$ יקום', '$\\Delta S^\\circ$ הכולל (TOTAL)'];
const W_SYS = ['שינוי האנטרופיה של המערכת', 'השינוי באנטרופיה של המערכת', 'שינוי האנטרופיה התקנית של המערכת'];
const W_DH = ['שינוי האנתלפיה', 'השינוי באנתלפיה', 'שינוי האנתלפייה התקני'];

/** "ΔH° = … , ΔS° = …" written one of the ways the exams write it */
function givenDHdS(r: R, hasH: boolean, hasS: boolean): string[] {
  if (hasH && hasS)
    return pick(r, [
      [`«${pick(r, W_DH)}|g:dH» בתגובה הוא {dH}, ו«${pick(r, W_SYS)}|g:dS» הוא {dS}.`],
      ['{dH}', '{dS}'],
      ['{dH}, {dS}'],
    ]);
  if (hasH) return pick(r, [[`«${pick(r, W_DH)}|g:dH» בתגובה הוא {dH}.`], ['{dH}']]);
  if (hasS) return pick(r, [[`«${pick(r, W_SYS)}|g:dS» הוא {dS}.`], ['{dS}']]);
  return [];
}

interface Built {
  input: string[];
  text: string[];
  check?: (sol: Solution, p: Problem) => boolean;
}

// ---------------------------------------------------------------- 6.9 spontaneous? (T14, T15)

/** the shown numbers must add up as shown: round(sys + surr) = sys + round(surr), and not 0.0 */
function cleanSpont(s: SpontSol): boolean {
  const o = s.opts;
  if (s.surrOnly) return !round(s.dSsurr, o.decimals ?? 1).isZero();
  const sys = s.dSfrom ? round(s.dSsys, o.decimals ?? 1) : s.dSsys;
  const surr = round(s.dSsurr, o.decimals ?? 1);
  const tot = round(s.dStot, o.decimals ?? 1);
  return !tot.isZero() && sys.add(surr).eq(tot) && s.dSsys.abs().gt(1);
}

function genSpont(r: R): Built {
  const v = verbs(r);
  const path = wpick(r, [
    ['given', 4],
    ['dHf', 1.5],
    ['S', 1.5],
    ['both', 1],
    ['surr', 1.5],
    ['process', 0.6],
  ] as ['given' | 'dHf' | 'S' | 'both' | 'surr' | 'process', number][]);
  const want = r() < 0.5;
  const input: string[] = [];
  const text: string[] = [];
  let T = temp(r);
  if (path === 'process') {
    let dH = ZERO;
    let dS = ZERO;
    for (let i = 0; i < 12; i++) {
      dH = F(pick(r, [-1, 1]) * int(r, 2, 80) * 5);
      dS = F(pick(r, [-1, 1]) * int(r, 1, 60) * 5);
      T = temp(r);
      if (dS.add(dH.mul(-1000).div(T.TK)).sign() > 0 === want) break;
    }
    input.push(`dH = ${ex(dH)} kJ`, `dS = ${ex(dS)} J/K`);
    text.push('נתון תהליך:', ...givenDHdS(r, true, true));
  } else {
    let x = realInst(r, REACTIONS);
    for (let i = 0; i < 12; i++) {
      x = realInst(r, REACTIONS);
      T = temp(r);
      const dH = dHof(x);
      const dS = dSof(x);
      if (dH.isZero() || dS.isZero()) continue;
      if (path === 'surr' || dS.add(dH.mul(-1000).div(T.TK)).sign() > 0 === want) break;
    }
    input.push(`rxn: ${rxnStr(x)}`);
    text.push(intro(r, x, v));
    const H = path === 'given' || path === 'S' || path === 'surr';
    const S = path === 'given' || path === 'dHf';
    if (H) input.push(`dH = ${ex(dHof(x))} kJ`);
    if (S) input.push(`dS = ${ex(dSof(x))} J/K`);
    if (path === 'dHf' || path === 'both') input.push(...hLines(x));
    if (path === 'S' || path === 'both') input.push(...sLines(x));
    if (path === 'dHf') text.push(tableLine(r, 'H'), ...givenDHdS(r, false, true));
    else if (path === 'S') text.push(...givenDHdS(r, true, false), tableLine(r, 'S'));
    else if (path === 'both') text.push(tableLine(r, 'SH'));
    else text.push(...givenDHdS(r, true, path !== 'surr'));
  }
  input.push(T.line, 'ask: spontaneous');

  const parts: string[] = [];
  if (path === 'dHf' || path === 'both') parts.push(`${v.calc} את «${pick(r, W_DH)} של התגובה|a:dH». ${show(v)}.`);
  if (path === 'S' || path === 'both') parts.push(`${v.calc} את «${pick(r, W_SYS)}|a:dS».`);
  const surr = `${v.calc} את «${pick(r, W_SURR)}|a:surr»`;
  const tot = `${v.calc} את «${pick(r, W_TOT)}|a:tot»`;
  const spont = (where: string, calc = false) => {
    const tail = `${expl(r, v)}${calc ? ` ו${show(v)}` : ''}.`;
    return pick(r, [`${v.det} «אם התגובה ספונטנית|a:spont» ${where}. ${tail}`, `«האם התהליך ספונטני|a:spont» ${where}? ${tail}`, `«האם התגובה מתרחשת באופן ספונטני|a:spont» ${where}? ${tail}`]);
  };
  if (path === 'surr') parts.push(`${surr} ${tempPhrase(r, T)}. ${show(v)}.`);
  else {
    const form = int(r, 0, 2);
    if (form === 0) parts.push(`${surr} ${tempPhrase(r, T)}. ${show(v)}.`, `${tot}.`, spont(samePhrase(r)));
    else if (form === 1) parts.push(`${tot} ${tempPhrase(r, T)}, ו${v.det} «אם התגובה ספונטנית|a:spont». ${expl(r, v)}.`);
    else parts.push(spont(tempPhrase(r, T), true));
  }
  text.push(...lettered(parts));
  return { input, text, check: (s) => cleanSpont(s as SpontSol) };
}

// ---------------------------------------------------------------- back from ΔS°universe / ΔS°surroundings

function genBack(r: R): Built {
  const v = verbs(r);
  const path = wpick(r, [
    ['sys', 3],
    ['surr', 2],
    ['dH', 2.5],
    ['S', 1.5],
  ] as ['sys' | 'surr' | 'dH' | 'S', number][]);
  const x = realInst(r, REACTIONS);
  const T = temp(r, 0.4);
  const dH = dHof(x);
  const dS = dSof(x);
  need(!dH.isZero() && !dS.isZero());
  const surr = dH.mul(-1000).div(T.TK);
  const tot = round(dS.add(surr), 1);
  need(!tot.isZero() && dS.abs().gt(1));
  const input = [`rxn: ${rxnStr(x)}`];
  const text = [intro(r, x, v)];
  const totLine = pick(r, [`«${pick(r, W_TOT)}|g:dStot» ${tempPhrase(r, T)} הוא {dStot}.`, `${tempPhrase(r, T)}: {dStot}`]);
  if (path === 'sys') {
    input.push(`dS = ${ex(dS)} J/K`, `dS total = ${ex(tot)} J/K`);
    text.push(...givenDHdS(r, false, true), totLine, `${v.calc} את «${pick(r, W_DH)} של התגובה|a:dH-back». ${show(v)}.`);
  } else if (path === 'S') {
    input.push(...sLines(x), `dS total = ${ex(tot)} J/K`);
    text.push(tableLine(r, 'S'), totLine, `${v.calc} את «${pick(r, W_DH)} של התגובה|a:dH-back». ${show(v)}.`);
  } else if (path === 'surr') {
    const s = round(surr, 1);
    need(!s.isZero());
    input.push(`dS surr = ${ex(s)} J/K`);
    text.push(pick(r, [`«${pick(r, W_SURR)}|g:dSsurr» ${tempPhrase(r, T)} הוא {dSsurr}.`, `${tempPhrase(r, T)}: {dSsurr}`]), `${v.calc} את «${pick(r, W_DH)} של התגובה|a:dH-back». ${show(v)}.`);
  } else {
    input.push(`dH = ${ex(dH)} kJ`, `dS total = ${ex(tot)} J/K`);
    text.push(...givenDHdS(r, true, false), totLine, `${v.calc} את «${pick(r, W_SYS)}|a:dS-back». ${show(v)}.`);
  }
  input.push(T.line, 'ask: back');
  return { input, text, check: (s) => s.type === 'back' && s.find === (path === 'dH' ? 'dSsys' : 'dH') };
}

// ---------------------------------------------------------------- signs without numbers (T9, T14, T15)

function genSigns(r: R): Built {
  const v = verbs(r);
  const x = realInst(r, REACTIONS);
  const T = temp(r, 0.6);
  const dH = dHof(x);
  const dS = dSof(x);
  need(!dH.isZero() && dS.abs().gt(5));
  const sH = dH.sign();
  const sS = dS.sign();
  const sSurr = -sH;
  const tot = dS.add(dH.mul(-1000).div(T.TK));
  need(tot.abs().gt(1));
  const sT = tot.sign();
  const t9 = gasOf(x.P).cmp(gasOf(x.R));
  const t9ok = t9 !== 0 && t9 === sS;

  type Find = 'surr' | 'dH-surr' | 'spont' | 'compare' | 'dH-tot' | 'sys-tot' | 'any-T';
  const can: Find[] = ['surr', 'dH-surr'];
  if (sS === sSurr) can.push('spont', 'any-T');
  else {
    can.push('compare', 'compare');
    if (sT === sSurr) can.push('dH-tot');
    else can.push('sys-tot');
  }
  const find = pick(r, can);
  const input = [`rxn: ${rxnStr(x)}`];
  const text = [intro(r, x, v)];
  const known: string[] = [];
  const signLine = (k: string, s: number) => `sign ${k} ${s > 0 ? '>' : '<'} 0`;

  const giveDH = () => {
    const how = pick(r, ['num', 'sign', 'word']);
    if (how === 'num') {
      input.push(`dH = ${ex(dH)} kJ`);
      known.push('{dH}');
    } else {
      input.push(signLine('dH', sH));
      known.push(how === 'word' ? (sH < 0 ? `התגובה «${pick(r, ['פולטת חום', 'אקסותרמית'])}|h:exo-word»` : `התגובה «${pick(r, ['בולעת חום', 'אנדותרמית'])}|h:endo-word»`) : '{sign}');
    }
  };
  const giveSys = () => {
    const how = pick(r, t9ok ? ['num', 'sign', 'T9', 'T9'] : ['num', 'sign']);
    if (how === 'num') {
      input.push(`dS = ${ex(dS)} J/K`);
      known.push('{dS}');
    } else if (how === 'sign') {
      input.push(signLine('dS sys', sS));
      known.push('{sign}');
    } // T9: nothing given, the sign comes from the equation
  };
  const giveSpont = () => {
    input.push(signLine('dS total', sT), T.line);
    known.push(`«${sT > 0 ? 'התגובה ספונטנית' : 'התגובה אינה ספונטנית'}|${sT > 0 ? 'h:spont' : 'h:notspont'}» ${T.room ? '«בטמפרטורת החדר|h:room»' : '«בטמפרטורה|g:T» {T}'}`);
  };

  let ask = '';
  if (find === 'surr') {
    giveDH();
    input.push('find: dS surr');
    ask = `${v.det} «אם האנטרופיה של הסביבה עולה או יורדת|a:surr-dir» בתגובה. ${expl(r, v)}.`;
  } else if (find === 'dH-surr') {
    if (r() < 0.5) {
      const s = round(dH.mul(-1000).div(T.TK), 1);
      need(!s.isZero());
      input.push(`dS surr = ${ex(s)} J/K`, T.line);
      known.push(`${T.room ? '«בטמפרטורת החדר|h:room»' : '«בטמפרטורה|g:T» {T}'}: {dSsurr}`);
    } else {
      input.push(signLine('dS surr', sSurr));
      known.push('{sign}');
    }
    input.push('find: dH');
    ask = `${v.det} «אם התגובה אנדותרמית או אקסותרמית|a:exo-endo». ${r() < 0.5 ? `«${v.expl} ללא חישובים|v:no-calc»` : expl(r, v)}.`;
  } else if (find === 'spont') {
    giveDH();
    giveSys();
    input.push('find: spont');
    ask = `${v.det} «אם התגובה ספונטנית|a:spont» בכל טמפרטורה. «${v.expl} ללא חישובים|v:no-calc».`;
  } else if (find === 'any-T') {
    giveDH();
    giveSys();
    input.push('find: any-T');
    ask = `${v.det} «אם יש טמפרטורה שבה התגובה ספונטנית|a:any-T». ${expl(r, v)}.`;
  } else if (find === 'compare') {
    giveSpont();
    if (r() < 0.6) giveDH();
    giveSys();
    input.push('find: compare');
    ask = `${v.det} «אם השינוי באנטרופיה של הסביבה גדול בערכו המוחלט מן השינוי באנטרופיה של המערכת או קטן ממנו|a:compare». ${expl(r, v)}.`;
  } else if (find === 'dH-tot') {
    giveSpont();
    giveSys();
    input.push('find: dH');
    ask = `${v.det} «אם התגובה אנדותרמית או אקסותרמית|a:exo-endo». ${expl(r, v)}.`;
  } else {
    giveSpont();
    giveDH();
    input.push('find: dS sys');
    ask = `${v.det} «את הסימן של שינוי האנטרופיה של המערכת|a:sys-sign». ${expl(r, v)}.`;
  }
  input.push('ask: signs');
  // the signs line {sign} once, at its place; the other givens joined with commas
  const seen = new Set<string>();
  const parts = known.filter((k) => (k === '{sign}' ? !seen.has(k) && !!seen.add(k) : true));
  if (parts.length) text.push(`נתון: ${parts.join(', ')}.`);
  text.push(ask);
  return {
    input,
    text,
    check: (s) => {
      if (s.type !== 'signs') return false;
      const a = s.answer;
      // the answer must be the real one (from the bank values)
      if (a.kind === 'sign') return a.sign === (a.key === 'dH' ? sH : a.key === 'dSsys' ? sS : a.key === 'dSsurr' ? sSurr : sT);
      if (a.kind === 'spont') return a.spont === sT > 0;
      if (a.kind === 'compare') return a.bigger === (sT === sSurr ? 'dSsurr' : 'dSsys');
      if (a.kind === 'any-T') return a.always === sS > 0;
      return false;
    },
  };
}

// ---------------------------------------------------------------- spontaneous but not happening (T16)

const NONE_SAY: [Tag | 'any', string][] = [
  ['comb', '{fuel} נשמר במגע עם אוויר לאורך זמן, ולא נצפית תגובה'],
  ['comb', 'מכל של {fuel} פתוח לאוויר בטמפרטורת החדר, ולא נוצרים תוצרים'],
  ['any', 'תערובת המגיבים נשמרת בכלי סגור לאורך זמן, ללא שינוי'],
  ['any', 'בניסוי בטמפרטורת החדר לא התקבלו תוצרים'],
];

function genKinetic(r: R): Built {
  const v = verbs(r);
  const why = r() < 0.6;
  const slow = REACTIONS.filter((x) => x.tags.includes('slow'));
  const x = why || r() < 0.5 ? inst(pick(r, slow), F(1), false) : realInst(r, REACTIONS.filter((y) => !y.tags.includes('slow')), 0.5);
  const dH = dHof(x);
  const tot = dSof(x).add(dH.mul(-1000).div(298));
  need(tot.abs().gt(1));
  if (why) need(tot.sign() > 0);
  const input = [`rxn: ${rxnStr(x)}`];
  const text: string[] = [];
  const totGiven = r() < 0.4;
  if (totGiven) input.push(`dS total = ${ex(round(tot, 1))} J/K`);
  else input.push(`sign dS total ${tot.sign() > 0 ? '>' : '<'} 0`);
  input.push('T = room');
  const given = `«בטמפרטורת החדר|h:room» ${totGiven ? '{dStot}' : '{sign}'}`;
  if (why) {
    input.push('observed: no reaction', 'ask: kinetic');
    const fuel = x.tags.includes('comb') ? SPECIES[x.R[0].k].he : null;
    const say = pick(r, NONE_SAY.filter(([t]) => t === 'any' || (t === 'comb' && fuel)))[1].replace('{fuel}', fuel ?? '');
    text.push(intro(r, x, v), `נתון: ${given}.`, `«${say}|h:none».`, `«${pick(r, ['מדוע התגובה לא מתרחשת', 'מה הסיבה שהתגובה לא יוצאת לפועל', 'מדוע לא התקבלו תוצרים'])}|a:why-not»? «${pick(r, [`${v.write} דרך שבה התגובה תתרחש`, 'הציעו דרך לפתור זאת', 'הצע פתרון כדי שהתהליך כן יתרחש'])}|a:fix».`);
  } else {
    input.push('find: catalyst', 'ask: kinetic');
    text.push(intro(r, x, v), `נתון: ${given}.`, `«${pick(r, ['האם הוספת זרז תגרום לתגובה להתרחש', 'האם נוכחות זרז תגדיל את הסיכוי להתרחשות התגובה'])}|a:cat-help»? ${expl(r, v)}.`);
  }
  return { input, text, check: (s) => s.type === 'kinetic' && s.spont === tot.sign() > 0 };
}

// ---------------------------------------------------------------- T18: which statement is right

function genCollision(r: R): Built {
  const v = verbs(r);
  const slow = REACTIONS.filter((y) => y.tags.includes('slow'));
  const x = inst(pick(r, slow), F(1), false);
  // a spark only for a mixture of gases that burn
  const gasesBurn = x.tags.includes('comb') && x.R.every((t) => t.k.endsWith('(g)'));
  const change: Change = pick(r, gasesBurn ? (['heat', 'spark', 'catalyst'] as Change[]) : (['heat', 'catalyst'] as Change[]));
  const yes = CLAIMS.filter((c) => CLAIM_TRUE[change][c]);
  const no = CLAIMS.filter((c) => !CLAIM_TRUE[change][c]);
  const claims = shuffle(r, [pick(r, yes), pick(r, no)]);
  const labels = pick(r, [['I', 'II'], ['a', 'b']]);
  const input = [`rxn: ${rxnStr(x)}`, `change: ${change}`, ...claims.map((c, i) => `statement ${labels[i]}: ${c}`), 'ask: collision'];
  const context =
    change === 'spark'
      ? `«תערובת המגיבים נשמרת בכלי סגור לאורך זמן, ללא שינוי|h:none». «כאשר משקיעים אנרגייה על ידי הפעלת ניצוץ חשמלי|h:spark», מתרחשת התגובה.`
      : change === 'heat'
        ? `«בטמפרטורת החדר|h:room» התגובה כמעט לא מתרחשת. «כאשר מחממים את המגיבים|h:hot», היא מתרחשת.`
        : `«בטמפרטורת החדר|h:room» התגובה כמעט לא מתרחשת. «כאשר מוסיפים זרז מתאים|g:cat», היא מתרחשת.`;
  const text = [
    intro(r, x, v),
    context,
    `«${pick(r, [`${v.here} שני היגדים`, 'נתונים שני היגדים'])}|g:stmts»:`,
    ...claims.map((c, i) => `${labels[i]}. ${claimHe(c, change)}`),
    `«${pick(r, ['איזה מבין ההיגדים הוא ההיגד הנכון', 'איזה מן ההיגדים מסביר נכון מדוע התגובה מתרחשת'])}|a:statement»? «${pick(r, [`${v.why} באמצעות תורת ההתנגשויות`, `${v.expl} באמצעות תורת ההתנגשויות`])}|v:collision».`,
  ];
  return { input, text, check: (s) => s.type === 'collision' && s.claims[s.correct].claim === claims.find((c) => CLAIM_TRUE[change][c]) };
}

// ---------------------------------------------------------------- T9: the sign of ΔS° from the equation

function phaseInst(r: R, noGas: boolean): Inst {
  const ps = PHASES.filter(([, a, b]) => !noGas || (a !== 'g' && b !== 'g'));
  const [f, a, b] = pick(r, ps);
  const [from, to] = r() < 0.5 ? [a, b] : [b, a];
  return { R: [{ c: F(1), k: `${f}(${from})` }], P: [{ c: F(1), k: `${f}(${to})` }], tags: [] };
}

function genDSign(r: R): Built {
  const v = verbs(r);
  const want = wpick(r, [
    ['up', 3],
    ['down', 3],
    ['phase', 1.5],
    ['none', 2],
  ] as ['up' | 'down' | 'phase' | 'none', number][]);
  let x: Inst | null = null;
  for (let i = 0; i < 40 && !x; i++) {
    const y = want === 'phase' ? phaseInst(r, true) : r() < 0.15 ? phaseInst(r, false) : realInst(r, REACTIONS);
    const c = gasOf(y.P).cmp(gasOf(y.R));
    if (want === 'phase' ? c === 0 : (want === 'up' && c > 0) || (want === 'down' && c < 0) || (want === 'none' && c === 0 && terms(y).some((t) => t.k.endsWith('(g)')))) x = y;
  }
  need(x);
  const dS = dSof(x!);
  // T9 must agree with the real values; "small" really small
  if (want === 'up' || want === 'phase') need(dS.sign() === gasOf(x!.P).cmp(gasOf(x!.R)) || want === 'phase');
  if (want === 'up' || want === 'down') need(dS.sign() === gasOf(x!.P).cmp(gasOf(x!.R)));
  if (want === 'phase') need(dS.sign() !== 0);
  if (want === 'none') need(dS.abs().lt(45));
  const input = [`rxn: ${rxnStr(x!)}`, 'ask: dS-sign'];
  const ask = pick(r, [
    `«${v.det} ללא חישוב|v:no-calc» את הסימן של «שינוי האנטרופיה של המערכת|a:dS-sign»: חיובי, שלילי או שלא ניתן לקבוע. ${expl(r, v)}.`,
    `«${v.why} את סימנו של שינוי האנטרופיה של המערכת|a:dS-sign» בתהליך. «${v.det} ללא חישובים|v:no-calc».`,
    `«האם סימנו של שינוי האנטרופיה של המערכת יהיה חיובי, שלילי או שלא ניתן לקבוע|a:dS-sign»? ${expl(r, v)}.`,
  ]);
  return { input, text: [intro(r, x!, v), ask] };
}

// ---------------------------------------------------------------- T13 / T7: products − reactants

function genPR(r: R, kind: 'dS' | 'S-unknown' | 'dH-formation' | 'dHf-unknown'): Built {
  const v = verbs(r);
  const x = realInst(r, REACTIONS);
  need(terms(x).length >= 2 && terms(x).length <= 6);
  const S = kind === 'dS' || kind === 'S-unknown';
  const input = [`rxn: ${rxnStr(x)}`];
  const text = [intro(r, x, v)];
  let hide: string | undefined;
  if (kind === 'S-unknown' || kind === 'dHf-unknown') {
    const cands = keys(x).filter((k) => S || !isElementStd(k));
    need(S || cands.length >= 2); // ΔH°f of the only compound = ΔH°: nothing to learn
    hide = pick(r, cands);
  }
  if (S) input.push(...sLines(x, hide));
  else input.push(...hLines(x, hide));
  const total = S ? dSof(x) : dHof(x);
  if (kind === 'S-unknown') input.push(`dS = ${ex(total)} J/K`);
  if (kind === 'dHf-unknown') {
    need(!total.isZero());
    input.push(`dH = ${ex(total)} kJ`);
  }
  input.push(`ask: ${kind}`);
  text.push(tableLine(r, S ? 'S' : 'H'));
  if (kind === 'dS') text.push(`${v.calc} את «${pick(r, [...W_SYS, '$\\Delta S^\\circ$ של התגובה'])}|a:dS». ${show(v)}.`);
  else if (kind === 'dH-formation') text.push(`${v.calc} את «${pick(r, W_DH)} של התגובה|a:dH». ${show(v)}.`);
  else if (kind === 'S-unknown') text.push(`${pick(r, ['«שינוי האנטרופיה של המערכת|g:dS» בתגובה הוא {dS}.', '{dS}'])}`, `${v.calc} את «${pick(r, ['האנטרופיה המולרית התקנית', 'האנטרופיה התקנית'])}|a:S0» של {x}. ${show(v)}.`);
  else text.push(`${pick(r, [`«${pick(r, W_DH)}|g:dH» בתגובה הוא {dH}.`, '{dH}'])}`, `${v.calc} את «${pick(r, ['אנתלפיית ההתהוות התקנית', 'אנתלפיית ההיווצרות המולרית התקנית'])}|a:dHf» של {x}. ${show(v)}.`);
  return {
    input,
    text,
    check: (s) => {
      if (s.type !== kind) return false;
      const pr = (s as { pr: { total: Frac; x?: { v: Frac } } }).pr;
      if (kind === 'S-unknown') return pr.x!.v.eq(S0of(hide!)); // the hidden value comes back
      if (kind === 'dHf-unknown') return pr.x!.v.eq(dHfOf(hide!));
      return pr.total.eq(total) && !pr.total.isZero();
    },
  };
}

// ---------------------------------------------------------------- T3: heat and amount

const N_NICE = ['0.1', '0.2', '0.25', '0.4', '0.5', '0.75', '1.5', '2', '2.5', '3', '4', '5'];

function heatData(r: R) {
  const x = realInst(r, REACTIONS.filter((y) => y.tags.includes('comb') || r() < 0.4), 0.15);
  const dH = dHof(x);
  need(dH.abs().gt(20));
  const tm = r() < 0.6 ? x.R[0] : pick(r, terms(x));
  const sp = fOf(tm.k);
  const n = F(pick(r, N_NICE));
  const M = molarMass(sp);
  return { x, dH, tm, sp, n, M, m: n.mul(M), q: n.div(tm.c).mul(dH.abs()) };
}

function genHeat(r: R, kind: 'heat' | 'mass-for-heat' | 'dH-from-q'): Built {
  const v = verbs(r);
  const d = heatData(r);
  const { x, dH, tm, sp, n, M, m, q } = d;
  const exo = dH.sign() < 0;
  const input = [`rxn: ${rxnStr(x)}`];
  const text = [intro(r, x, v)];
  const isR = x.R.includes(tm);
  const mol = r() < 0.25 && kind !== 'mass-for-heat';
  const Mline = `(«מסה מולרית|g:M» של {sp}: {M})`;
  if (kind === 'heat') {
    need(decimalsOf(q) <= 3);
    input.push(`dH = ${ex(dH)} kJ`, mol ? `n ${sp} = ${ex(n)} mol` : `m ${sp} = ${ex(m)} g`);
    if (!mol) input.push(`M ${sp} = ${ex(M)} g/mol`);
    text.push(...givenDHdS(r, true, false));
    const amt = mol ? '{n}' : '{m}';
    text.push(
      `${pick(r, [`«${exo ? 'כמה חום נפלט' : 'כמה חום נבלע'}|a:q»`, `${v.calc} «את כמות האנרגייה|a:q» ש${exo ? 'משתחררת' : 'נבלעת'}`])} כאשר ${isR ? 'מגיבים' : 'נוצרים'} ${amt} של {sp}${mol ? '' : ` ${Mline}`}. ${show(v)}.`,
    );
  } else if (kind === 'mass-for-heat') {
    need(decimalsOf(q) <= 2);
    input.push(`dH = ${ex(dH)} kJ`, `q = ${ex(q)} kJ`, `M ${sp} = ${ex(M)} g/mol`);
    text.push(...givenDHdS(r, true, false));
    text.push(`«כמה גרם|a:mass» {sp} ${isR ? 'צריכים להגיב' : 'צריכים להיווצר'} כדי ש${exo ? 'ייפלטו' : 'ייבלעו'} {q}? ${Mline}. ${show(v)}.`);
  } else {
    need(decimalsOf(q) <= 3);
    input.push(mol ? `n ${sp} = ${ex(n)} mol` : `m ${sp} = ${ex(m)} g`);
    if (!mol) input.push(`M ${sp} = ${ex(M)} g/mol`);
    input.push(`q = ${ex(q)} kJ ${exo ? 'released' : 'absorbed'}`);
    const amt = mol ? '{n}' : '{m}';
    text.push(`נמצא שכאשר ${isR ? 'מגיבים' : 'נוצרים'} ${amt} של {sp}${mol ? '' : ` ${Mline}`}, «${exo ? pick(r, ['נפלטים', 'משתחררים']) : 'נבלעים'}|g:released» {q}.`);
    text.push(`«${pick(r, ['מהו שינוי האנתלפיה של התגובה כפי שהיא כתובה', `${v.calc} את שינוי האנתלפיה התקני של התגובה`])}|a:dH-mol»? ${show(v)}.`);
  }
  input.push(`ask: ${kind}`);
  return {
    input,
    text,
    check: (s) => {
      if (s.type !== kind) return false;
      const h = s as { n: Frac; q: Frac; m?: Frac; dH: Frac };
      if (kind === 'heat') return h.q.eq(q);
      if (kind === 'mass-for-heat') return h.m!.eq(m) && decimalsOf(m) <= 3;
      return h.dH.eq(dH);
    },
  };
}

// ---------------------------------------------------------------- T2: reversed / multiplied

function genDHnew(r: R): Built {
  const v = verbs(r);
  const base = pick(r, REACTIONS);
  const x = inst(base, scale(r, base, ['1', '1', '2', '1/2']), r() < 0.3);
  const dH = dHof(x);
  need(!dH.isZero());
  const how = wpick(r, [
    ['rev', 4],
    ['mul', 3],
    ['both', 3],
  ] as ['rev' | 'mul' | 'both', number][]);
  const k = how === 'rev' ? F(1) : F(pick(r, ['2', '3', '1/2', '2', '1/2']));
  const rev = how !== 'mul';
  const y: Inst = { ...inst({ R: x.R.map((t) => [t.c.toString(), t.k] as [string, string]), P: x.P.map((t) => [t.c.toString(), t.k] as [string, string]), he: '', tags: [] }, k, rev) };
  need(terms(y).every((t) => (t.c.d === 1n || t.c.d === 2n) && t.c.lt(30)));
  need(!(k.eq(1) && !rev));
  const input = [`rxn: ${rxnStr(x)}`, `dH = ${ex(dH)} kJ`, `new: ${rxnStr(y)}`, 'ask: dH-new'];
  const text = [
    `${pick(r, ['תגובה (1): {rxn}', 'נתונה התגובה: {rxn}'])} {dH}`,
    `«${pick(r, ['מבצעים את התגובה', 'נתונה תגובה (2)', 'לפניכם תגובה נוספת'])}|g:new»: {new}`,
    pick(r, [
      `${v.calc} את «$\\Delta H^\\circ$ של תגובה (2)|a:dH-new». ${expl(r, v)}.`,
      `«${pick(r, ['מהו שינוי האנתלפיה של תגובה (2)', 'מהו $\\Delta H^\\circ$ של התגובה החדשה'])}|a:dH-new»? ${expl(r, v)}.`,
      `«האם בתגובה (2) נפלטת אנרגייה או נבלעת, וכמה|a:dH-new»? ${v.calc} את $\\Delta H^\\circ$ של תגובה (2).`,
    ]),
  ];
  return { input, text, check: (s) => s.type === 'dH-new' && s.dHnew.eq(dH.mul(k).mul(rev ? -1 : 1)) };
}

// ---------------------------------------------------------------- T17: another state

function genPhase(r: R): Built {
  const v = verbs(r);
  const mode = wpick(r, [
    ['pure', 2],
    ['pure-opts', 1.5],
    ['cmp', 3],
    ['cmp-opts', 3.5],
  ] as ['pure' | 'pure-opts' | 'cmp' | 'cmp-opts', number][]);
  if (mode === 'pure' || mode === 'pure-opts') {
    const x = phaseInst(r, false);
    const dH = dHof(x);
    need(!dH.isZero());
    const input = [`rxn: ${rxnStr(x)}`];
    const text = [pick(r, ['נתון התהליך: {rxn}', `${'לפניכם'} ניסוח של שינוי מצב צבירה: {rxn}`])];
    if (mode === 'pure-opts') {
      const opts = shuffle(r, [dH, dH.neg()]);
      input.push(`options = ${opts.map((o) => ex(o)).join(', ')}`);
      text.push(`נתונים שני ערכים: {opts}`, `«${v.det} איזה משני הערכים מתאים|a:choose» ל־$\\Delta H^\\circ$ של התהליך. ${expl(r, v)}.`);
    } else text.push(`«${v.det} אם התהליך אנדותרמי או אקסותרמי|a:exo-endo», כלומר מה הסימן של $\\Delta H^\\circ$. ${expl(r, v)}.`);
    input.push('ask: phase-compare');
    return { input, text, check: (s) => s.type === 'phase-compare' && s.pure!.sign === dH.sign() && (mode === 'pure' || s.pick === [...(s.options ?? [])].findIndex((o) => o.eq(dH))) };
  }
  // the same reaction with one substance in another state
  let x: Inst | null = null;
  let y: Inst | null = null;
  for (let i = 0; i < 30 && !y; i++) {
    const a = realInst(r, REACTIONS, 0.2);
    const alt = terms(a).filter((t) => statesOf(fOf(t.k)).length > 1);
    if (!alt.length) continue;
    const t = pick(r, alt);
    const st = pick(r, statesOf(fOf(t.k)).filter((s) => `${fOf(t.k)}(${s})` !== t.k));
    const k2 = `${fOf(t.k)}(${st})`;
    if (terms(a).some((u) => u.k === k2)) continue;
    const sw = (ts: Term[]) => ts.map((u) => (u === t ? { c: u.c, k: k2 } : u));
    x = a;
    y = { R: sw(a.R), P: sw(a.P), tags: [] };
  }
  need(x && y);
  const dH1 = dHof(x!);
  const dH2 = dHof(y!);
  need(!dH1.isZero() && !dH1.eq(dH2));
  const input = [`rxn: ${rxnStr(x!)}`, `dH = ${ex(dH1)} kJ`, `new: ${rxnStr(y!)}`];
  const text = [`${pick(r, ['תגובה (1): {rxn}', 'נתונה התגובה: {rxn}'])} {dH}`, `«${pick(r, ['בתגובה (2) אחד החומרים במצב צבירה אחר', 'נתונה תגובה (2)', 'מבצעים את אותה תגובה, אבל עם חומר במצב צבירה אחר'])}|g:new»: {new}`];
  if (mode === 'cmp-opts') {
    const opts = shuffle(r, r() < 0.6 ? [dH2, dH1, dH1.mul(2).sub(dH2)] : [dH2, dH1.mul(2).sub(dH2)]);
    input.push(`options = ${opts.map((o) => ex(o)).join(', ')}`);
    text.push(`«נתונים ערכים של שינוי אנתלפייה|g:opts»: {opts}`, `«${v.det} איזה מבין הערכים מתאים|a:choose» ל־$\\Delta H^\\circ$ של תגובה (2). ${expl(r, v)}.`);
  } else text.push(`«${v.det} אם בתגובה (2) משתחררת אנרגייה רבה יותר או מעטה יותר מאשר בתגובה (1)|a:energy-cmp». ${expl(r, v)}.`);
  input.push('ask: phase-compare');
  return {
    input,
    text,
    check: (s) => {
      if (s.type !== 'phase-compare' || !s.verdict) return false;
      if ((s.verdict === 'lower') !== dH2.lt(dH1)) return false; // the rule agrees with the real values
      return mode === 'cmp' || (s.options != null && s.options[s.pick!].eq(dH2));
    },
  };
}

// ---------------------------------------------------------------- T6: bond enthalpies

function genBonds(r: R, kind: 'dH-bonds' | 'bond-unknown'): Built {
  const v = verbs(r);
  // one bond table per question: the bagrut's, or OpenStax's (more bonds, so more reactions)
  const set = r() < 0.4 ? BOND_SETS[0] : BOND_SETS[1];
  const BOND_E = set.E;
  const x = realInst(r, BOND_RXNS.filter((y) => bondsIn(y).every((b) => BOND_E[b])), 0.3);
  const used = new Map<string, number>(); // bond → (broken − formed) count
  for (const t of x.R) for (const [c, b] of BONDS_OF[fOf(t.k)]) used.set(b, (used.get(b) ?? 0) + c * t.c.toNumber());
  for (const t of x.P) for (const [c, b] of BONDS_OF[fOf(t.k)]) used.set(b, (used.get(b) ?? 0) - c * t.c.toNumber());
  const bonds = [...used.keys()];
  const dH = [...used.entries()].reduce((a, [b, n]) => a.add(F(BOND_E[b]).mul(F(n.toString()))), ZERO);
  need(!dH.isZero());
  let hide: string | undefined;
  if (kind === 'bond-unknown') {
    hide = pick(r, bonds.filter((b) => Math.abs(used.get(b)!) > 1e-9));
    need(hide);
  }
  const mols = [...new Set(terms(x).map((t) => fOf(t.k)))];
  const input = [
    `rxn: ${rxnStr(x)}`,
    ...mols.map((f) => `bonds ${f}: ${BONDS_OF[f].map(([c, b]) => `${c} ${b}`).join(', ')}`),
    ...bonds.map((b) => `bond ${b} = ${b === hide ? 'x' : BOND_E[b]}`),
  ];
  if (kind === 'bond-unknown') input.push(`dH = ${ex(dH)} kJ`);
  input.push(`ask: ${kind}`);
  const text = [intro(r, x, v), `«${pick(r, ['בטבלה שלפניכם מוצגות אנתלפיות קשר', 'נתונות אנתלפיות הקשר הממוצעות', 'לפניכם אנרגיות הקשר, והקשרים בכל מולקולה'])}|g:table»: {table}`];
  if (kind === 'dH-bonds') text.push(`${pick(r, [`«${v.write} את הביטוי לחישוב $\\Delta H^\\circ$ בעזרת אנתלפיות קשר|a:dH-bonds», ו${v.calc} את ערכו.`, `${v.calc} את «$\\Delta H^\\circ$ של התגובה בעזרת אנתלפיות הקשר|a:dH-bonds».`])} ${show(v)}.`);
  else text.push(pick(r, ['{dH}', `«${pick(r, W_DH)}|g:dH» בתגובה הוא {dH}.`]), `${v.calc} את «אנתלפיית הקשר|a:bond» {bx}. ${show(v)}.`);
  return {
    input,
    text,
    check: (s) => {
      if (s.type !== kind) return false;
      if (kind === 'bond-unknown') return s.x!.v.eq(F(BOND_E[hide!]));
      return s.dH.eq(dH);
    },
  };
}

// ---------------------------------------------------------------- T8: energy diagram (made-up numbers: no substance named)

function genDiagram(r: R): Built {
  const v = verbs(r);
  const step = pick(r, [5, 10, 10, 20]);
  const R0 = int(r, 0, 30) * step;
  const P0 = int(r, 0, 30) * step;
  need(R0 !== P0);
  const peak = Math.max(R0, P0) + int(r, 2, 20) * step;
  const cat = r() < 0.45 ? int(r, Math.max(R0, P0) / step + 1, peak / step - 1) * step : null;
  const input = [`E reactants = ${R0} kJ`, `E products = ${P0} kJ`, `E peak = ${peak} kJ`];
  if (cat != null) {
    need(cat > Math.max(R0, P0) && cat < peak);
    input.push(`E peak catalyst = ${cat} kJ`);
  }
  const named = r() < 0.5;
  if (named) input.unshift(`rxn: ${pick(r, ['A(g) + B(g) -> AB(g)', 'A2(g) + B2(g) -> 2AB(g)', 'AB(g) -> A(g) + B(g)', 'A(g) -> B(g)'])}`);
  input.push('ask: diagram');
  const text = [
    named ? 'לתגובה {rxn} נתונה דיאגרמת אנרגייה.' : 'לפניכם נתונים מדיאגרמת אנרגייה של תגובה.',
    `«${pick(r, ['האנרגיה של המגיבים, של התוצרים ושל השיא', 'הגבהים בדיאגרמה'])}|g:E»: {E}`,
    ...lettered([
      `${v.calc} את $\\Delta H^\\circ$ של התגובה, ואת «אנרגיית השפעול של התגובה ושל התגובה ההפוכה|a:Ea». ${show(v)}.`,
      ...(cat != null ? [`«${pick(r, ['מהי אנרגיית השפעול בנוכחות זרז', 'מה משתנה כשמוסיפים זרז'])}|a:catalyst»? ${expl(r, v)}.`] : []),
    ]),
  ];
  return { input, text, check: (s) => s.type === 'diagram' && s.dH.eq(P0 - R0) && s.eaF.eq(peak - R0) && s.eaR.eq(peak - P0) };
}

// ---------------------------------------------------------------- entry

const GENS: Record<GenKind, (r: R) => Built> = {
  spontaneous: genSpont,
  back: genBack,
  signs: genSigns,
  kinetic: genKinetic,
  collision: genCollision,
  'dS-sign': genDSign,
  dS: (r) => genPR(r, 'dS'),
  'S-unknown': (r) => genPR(r, 'S-unknown'),
  'dH-formation': (r) => genPR(r, 'dH-formation'),
  'dHf-unknown': (r) => genPR(r, 'dHf-unknown'),
  heat: (r) => genHeat(r, 'heat'),
  'mass-for-heat': (r) => genHeat(r, 'mass-for-heat'),
  'dH-from-q': (r) => genHeat(r, 'dH-from-q'),
  'dH-new': genDHnew,
  'phase-compare': genPhase,
  'dH-bonds': (r) => genBonds(r, 'dH-bonds'),
  'bond-unknown': (r) => genBonds(r, 'bond-unknown'),
  diagram: genDiagram,
};

const KIND = Object.fromEntries(GEN_KINDS.map((k) => [k.kind, k])) as Record<GenKind, (typeof GEN_KINDS)[number]>;

/** one problem, or the reason it was refused (for the tests) */
export function attempt(kind: GenKind, r: R): { g: Built; p: Problem; sol: Solution } {
  const g = GENS[kind](r);
  const p = parse(g.input.join('\n'));
  const sol = solve(p);
  need(sol.type === kind);
  need(!g.check || g.check(sol, p));
  textLines(g.text.join('\n'), p); // every slot can be filled
  const parts = partsOf(sol);
  need(parts.length && parts.every((x) => x.kind === 'choice' || Number.isFinite(x.answer.toNumber())));
  return { g, p, sol };
}

export function generate(kind: GenKind | 'any', seed: number): GenProblem {
  const r = rng(seed);
  const k: GenKind = kind === 'any' ? pick(r, GEN_KINDS).kind : kind;
  for (let i = 0; i < 200; i++) {
    try {
      const { g } = attempt(k, r);
      return { id: `g-${k}-${seed}`, title: `∞ ${KIND[k].he} · ${seed % 10000}`, group: '∞', topic: KIND[k].topic, kind: k, input: g.input.join('\n'), text: g.text.join('\n') };
    } catch (e) {
      if (!(e instanceof Retry || e instanceof InputError)) throw e;
    }
  }
  throw new Error(`generator gave up: ${k} ${seed}`);
}

/** a problem of one of the topic's kinds */
export function generateForTopic(topic: string, seed: number): GenProblem | null {
  const ks = GEN_KINDS.filter((g) => g.topic === topic);
  if (!ks.length) return null;
  return generate(ks[seed % ks.length].kind, seed);
}

/** "g-kind-1234" → the same problem again */
export function fromId(id: string): GenProblem | null {
  const m = /^g-([a-zA-Z-]+)-(\d+)$/.exec(id);
  if (!m || !GEN_KINDS.some((k) => k.kind === m[1])) return null;
  return generate(m[1] as GenKind, parseInt(m[2], 10));
}

/** the generator kind that matches a solved problem's type */
export function kindOfType(t: string): GenKind | null {
  return GEN_KINDS.some((k) => k.kind === t) ? (t as GenKind) : null;
}
