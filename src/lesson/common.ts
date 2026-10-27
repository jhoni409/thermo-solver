// What every lesson shares: the Step, number and TeX helpers, the pinned reaction and recipe, the cards that decode
// the exam wording, the exam card, and the products − reactants cards (T7, T13).

import type { Problem, Reaction, Species } from '../engine/parse';
import type { Solution, PR, PRTerm } from '../engine/solve';
import { ZERO, type Frac } from '../engine/frac';
import { fmt, type FmtOpts } from '../engine/format';
import { speciesTex, formulaTex } from '../engine/chem';
import { statement } from '../engine/statement';
import { phrasesOf } from '../engine/text';
import { PHRASES } from '../learn/phrases';
import { el, he, tex } from '../ui/dom';
import { sideColor, show, ORANGE, BLUE, type Board, type Card, type TL } from './board';

export interface Step {
  stage: 0 | 1 | 2;
  /** short name in the list of steps */
  title: string;
  /** the one sentence on the card */
  say: string;
  why?: string;
  /** keys of the givens this step uses (highlighted in the question); '*' = all */
  uses?: string[];
  cls?: string;
  /** the group name in the list of steps, when it is not one of STAGE_HE (concept lessons) */
  group?: string;
  /** "guess before you see": asked first, the card's content comes after the answer */
  predict?: { q: string; options: string[]; correct: number };
  /** which line of the topic's recipe this step does (the pinned recipe strip lights it) */
  recipe?: number;
  /** runs as soon as the card exists, before a guess is answered */
  pre?: (b: Board) => void;
  /** earlier steps whose results this card uses ("מאיפה זה?") */
  from?: number[];
  run: (c: Card, t: TL, b: Board) => void;
}

// ---------------------------------------------------------------- text helpers

export const fx = (f: Frac, o?: FmtOpts) => fmt(f, o).s;
export const rel = (f: Frac, o?: FmtOpts) => (fmt(f, o).approx ? '\\approx' : '=');
export const col = (c: string, s: string) => `\\textcolor{${c}}{${s}}`;
/** a value as it is written inside a calculation: negatives in brackets */
export const par = (s: string) => (s.startsWith('-') ? `(${s})` : s);
export const signed = (f: Frac, o?: FmtOpts) => (f.sign() > 0 ? `+${fx(f, o)}` : fx(f, o));
export const DS = (who: string) => `\\Delta S^\\circ_{\\text{${who}}}`;
export const SYS = DS('מערכת');
export const SURR = DS('סביבה');
export const TOT = DS('יקום');
export const DH = '\\Delta H^\\circ';
export const UNIT_SK = '\\,\\mathrm{J/K}';
export const KJ = '\\,\\mathrm{kJ}';
export const fT = (f: string) => `$${formulaTex(f)}$`;
export const spT = (s: Species, coef = false) => `$${col(sideColor(s), speciesTex(s, coef))}$`;
export const coefTimes = (c: Frac) => (c.eq(1) ? '' : `${c.isInt() ? c.toString() : `\\tfrac{${c.n}}{${c.d}}`} \\times `);

/** the reaction with reactants and products in their colours */
export function reactionC(r: Reaction, withState = true): string {
  const side = (xs: Species[]) => xs.map((x) => col(sideColor(x), speciesTex(x, true, withState))).join(' + ');
  return `${side(r.R)} \\rightarrow ${side(r.P)}`;
}

/** the reaction stays on top of the board for the whole lesson */
export function pinEquation(b: Board, t: TL, r: Reaction) {
  const d = el('div', 'pin-eq', b.pin, tex(reactionC(r)));
  d.dir = 'ltr';
  const key = el('div', 'pin-key', b.pin, '<span class="k-r">כתום = מגיבים (צד שמאל)</span><span class="k-p">כחול = תוצרים (צד ימין)</span>');
  show(t, [d, key], 0);
}

/** the topic's recipe, one word per step, pinned under the reaction; the current step lights up */
export function pinRecipe(b: Board, t: TL, labels: string[]) {
  const strip = el('div', 'pin-recipe', b.pin);
  labels.forEach((l, i) => {
    if (i) el('span', 'rs-sep', strip, '←');
    const it = el('span', 'rs-it', strip);
    el('span', 'rs-n', it, String(i + 1));
    el('span', 'rs-l', it, he(l));
  });
  show(t, strip, 0);
}

export function markRecipe(b: Board, at: number) {
  b.pin.querySelectorAll('.rs-it').forEach((e, i) => {
    e.classList.toggle('done', i < at);
    e.classList.toggle('cur', i === at);
  });
}

// ---------------------------------------------------------------- shared steps

export function identify(p: Problem, sol: Solution, say: string, why: string): Step {
  const ask = statement(p).ask;
  return {
    stage: 0,
    title: 'מה סוג השאלה?',
    say,
    why,
    uses: ['*'],
    run: (c, t) => {
      c.chips(t, [{ html: he(sol.recog.type), cls: 'type' }]);
      if (ask) c.line(t, `שואלים: ${ask}`, 'dim');
    },
  };
}

/** the first cards when the question is written in exam wording: what is given, what is asked */
export function decodeSteps(p: Problem, sol: Solution, text: string): Step[] {
  const uses = phrasesOf(text, p);
  const phrase = (tag: string) => {
    const ph = PHRASES[tag];
    if (!ph) throw new Error(`unknown phrase tag ${tag}`);
    return ph;
  };
  const row = (u: { tag: string; wording: string }) => {
    const ph = phrase(u.tag);
    const also = ph.kind === 'ask' || ph.kind === 'hidden' ? (ph.also ?? []).filter((w) => w !== u.wording).slice(0, 3) : [];
    return { quote: u.wording, means: ph.means(p), todo: ph.todo, tag: u.tag, hidden: ph.kind === 'hidden', also };
  };
  const giv = uses.filter((u) => ['given', 'hidden'].includes(phrase(u.tag).kind));
  const ask = uses.filter((u) => ['ask', 'verb'].includes(phrase(u.tag).kind));
  const valueKeys = ['rxn', 'dH', 'dS', 'T', 'dStot', 'dSsurr', 'table', 'q', 'm', 'M', 'new', 'E', 'opts'].filter((k) => text.includes(`{${k}}`));
  const steps: Step[] = [];
  if (giv.length)
    steps.push({
      stage: 0,
      title: 'מה נתון?',
      say: 'מה נתון? מתרגמים כל נתון לסימן',
      why: 'עוברים על השאלה ומסמנים כל נתון.\nנתון נסתר: מילים שהן בעצם מספר, למשל "בטמפרטורת החדר".',
      uses: [...giv.map((u) => u.tag), ...valueKeys],
      run: (c, t) => {
        c.decode(t, giv.map(row));
      },
    });
  steps.push({
    stage: 0,
    title: 'מה שואלים?',
    say: 'מה שואלים, ומה צריך לכתוב?',
    why: 'כל מילת שאלה אומרת מה מחפשים ואיזו נוסחה לוקחים.',
    uses: ask.map((u) => u.tag),
    run: (c, t) => {
      c.decode(t, ask.map(row));
      c.chips(t, [{ html: he(sol.recog.type), cls: 'type' }]);
    },
  });
  return steps;
}

export function exam(lines: string[]): Step {
  return {
    stage: 2,
    title: 'מה כותבים במבחן',
    say: 'כך כותבים במבחן',
    cls: 'exam',
    run: (c, t) => {
      for (const l of lines.filter(Boolean)) c.line(t, l, 'ex-line', '>-0.15');
    },
  };
}

/** a "מלכודת" card: the common mistake worked to its wrong answer */
export function trap(title: string, say: string, why: string, run: (c: Card, t: TL) => void): Step {
  return { stage: 1, title, say, why, cls: 'trap', run };
}

// ---------------------------------------------------------------- products − reactants (T7, T13)

export interface PRWords {
  /** the quantity per mol, e.g. "S^\\circ" or "\\Delta H^\\circ_f" */
  q: string;
  /** the result, e.g. SYS or DH */
  res: string;
  unit: string; // TeX
}

const termTex = (t: PRTerm, o?: FmtOpts, xName = 'x') =>
  t.v == null ? `${coefTimes(t.sp.coef)}${xName}` : `${coefTimes(t.sp.coef)}${par(fx(t.v, o))}`;

/** one column: "n × value = product" per species, and the sum */
export function prColumn(ts: PRTerm[], _w: PRWords, side: 'R' | 'P', o?: FmtOpts) {
  const color = side === 'R' ? ORANGE : BLUE;
  const rows = ts.map((t) => {
    const name = col(color, formulaTex(t.sp.f));
    if (t.v == null) return `${name}:\\ ${coefTimes(t.sp.coef)}x`;
    const z = t.zero ? '\\ (\\text{יסוד})' : '';
    return t.sp.coef.eq(1) ? `${name}:\\ ${fx(t.v, o)}${z}` : `${name}:\\ ${termTex(t, o)} = ${fx(t.prod!, o)}${z}`;
  });
  return rows;
}

/** the sum of a column, written out when it has more than one term */
export function sumTex(ts: PRTerm[], o?: FmtOpts): string {
  const s = ts.reduce((a, t) => (t.prod ? a.add(t.prod) : a), ZERO);
  return ts.length > 1 ? `\\Sigma = ${ts.map((t) => par(fx(t.prod!, o))).join(' + ')} = ${fx(s, o)}` : `\\Sigma = ${fx(s, o)}`;
}

/** "Σ products − Σ reactants" in numbers, negatives in brackets */
export const prLine = (pr: PR, o?: FmtOpts) => `${par(fx(pr.sumP!, o))} - ${par(fx(pr.sumR!, o))}`;
