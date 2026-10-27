// One lesson per question type: a short list of steps, one card each. Every number comes from the solver.

import type { Problem, Reaction, Species } from '../engine/parse';
import type { Solution, SpontSol } from '../engine/solve';
import type { Frac } from '../engine/frac';
import { fmt, type FmtOpts } from '../engine/format';
import { speciesTex } from '../engine/chem';
import { statement, dS, DH, UNIT_SK } from '../engine/statement';
import { phrasesOf } from '../engine/text';
import { PHRASES } from '../learn/phrases';
import { topicOfType } from '../learn/topics';
import { el, he, tex } from '../ui/dom';
import { sideColor, show, type Board, type Card, type TL } from './board';

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
  run: (c: Card, t: TL, b: Board) => void;
}

// ---------------------------------------------------------------- text helpers

const fx = (f: Frac, o?: FmtOpts) => fmt(f, o).s;
const rel = (f: Frac, o?: FmtOpts) => (fmt(f, o).approx ? '\\approx' : '=');
const col = (c: string, s: string) => `\\textcolor{${c}}{${s}}`;
/** a value as it is written inside a calculation: negatives in brackets */
const par = (s: string) => (s.startsWith('-') ? `(${s})` : s);

/** the reaction with reactants and products in their colours */
function reactionC(r: Reaction, withState = true): string {
  const side = (xs: Species[]) => xs.map((x) => col(sideColor(x), speciesTex(x, true, withState))).join(' + ');
  return `${side(r.R)} \\rightarrow ${side(r.P)}`;
}

/** the reaction stays on top of the board for the whole lesson */
function pinEquation(b: Board, t: TL, r: Reaction) {
  const d = el('div', 'pin-eq', b.pin, tex(reactionC(r)));
  d.dir = 'ltr';
  const key = el('div', 'pin-key', b.pin, '<span class="k-r">כתום = מגיבים (צד שמאל)</span><span class="k-p">כחול = תוצרים (צד ימין)</span>');
  show(t, [d, key], 0);
}

/** the topic's recipe, one word per step, pinned under the reaction; the current step lights up */
function pinRecipe(b: Board, t: TL, labels: string[]) {
  const strip = el('div', 'pin-recipe', b.pin);
  labels.forEach((l, i) => {
    if (i) el('span', 'rs-sep', strip, '←');
    const it = el('span', 'rs-it', strip);
    el('span', 'rs-n', it, String(i + 1));
    el('span', 'rs-l', it, he(l));
  });
  show(t, strip, 0);
}

function markRecipe(b: Board, at: number) {
  b.pin.querySelectorAll('.rs-it').forEach((e, i) => {
    e.classList.toggle('done', i < at);
    e.classList.toggle('cur', i === at);
  });
}

// ---------------------------------------------------------------- shared steps

function identify(p: Problem, sol: Solution, say: string, why: string): Step {
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
function decodeSteps(p: Problem, sol: Solution, text: string): Step[] {
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
  const valueKeys = ['rxn', 'dH', 'dS', 'T'].filter((k) => text.includes(`{${k}}`));
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

function exam(lines: string[]): Step {
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

// ---------------------------------------------------------------- 6.9 ΔS° surroundings, ΔS° universe, spontaneous?

const SYS = dS('מערכת');
const SURR = dS('סביבה');
const TOT = dS('יקום');

function tempLine(sol: SpontSol): string {
  return sol.TC ? `T = ${fx(sol.TC)} + 273 = ${fx(sol.TK)}\\,\\mathrm{K}` : '';
}
function dHLine(sol: SpontSol): string {
  return sol.dH.unit === 'kJ' ? `${DH} = ${fx(sol.dH.v)}\\,\\mathrm{kJ} \\times 1000 = ${fx(sol.dHJ)}\\,\\mathrm{J}` : '';
}
const surrFrac = (sol: SpontSol) => `-\\dfrac{${par(fx(sol.dHJ))}}{${fx(sol.TK)}}`;

/** the common mistake, worked out wrong: forgetting ×1000, or putting °C in the formula. The one that flips the verdict wins. */
function trapOf(sol: SpontSol) {
  const cands: { kind: '1000' | 'K'; dH: Frac; T: Frac }[] = [];
  if (sol.dH.unit === 'kJ') cands.push({ kind: '1000', dH: sol.dH.v, T: sol.TK });
  if (sol.TC && !sol.TC.isZero()) cands.push({ kind: 'K', dH: sol.dHJ, T: sol.TC });
  const out = cands.map((c) => {
    const surr = c.dH.neg().div(c.T);
    const tot = sol.dSsys.add(surr);
    return { ...c, surr, tot, flips: tot.sign() !== sol.dStot.sign() };
  });
  return out.find((x) => x.flips) ?? out[0] ?? null;
}

function spontLesson(sol: SpontSol, p: Problem): Step[] {
  const o = sol.opts;
  const surr = fmt(sol.dSsurr, o);
  const tot = fmt(sol.dStot, o);
  const relTot = surr.approx || tot.approx ? '\\approx' : '=';
  const Tk = `${fx(sol.TK)}\\,\\mathrm{K}`;
  const steps: Step[] = [];

  steps.push(
    identify(
      p,
      sol,
      `נתונים $${DH}$, $${SYS}$ ו־$T$ ← בודקים את $${TOT}$`,
      'החוק השני: תהליך ספונטני כשהאנטרופיה של היקום עולה.\nיקום = מערכת + סביבה.',
    ),
  );

  if (sol.dH.unit === 'kJ' || sol.TC) {
    steps.push({
      stage: 1,
      title: 'יחידות',
      say: sol.dH.unit === 'kJ' && sol.TC ? `מעבירים יחידות: $${DH}$ ל־J, הטמפרטורה ל־K` : sol.TC ? 'מעבירים את הטמפרטורה לקלווין' : `מעבירים את $${DH}$ לג׳אול`,
      why: `$\\Delta S^\\circ$ נמדד ב־J/K, לכן גם $${DH}$ צריך להיות ב־J ($1\\,\\mathrm{kJ} = 1000\\,\\mathrm{J}$).\nבנוסחה הטמפרטורה תמיד בקלווין: $T = t + 273$.`,
      uses: ['dH', 'T'],
      recipe: 0,
      predict:
        sol.dH.unit === 'kJ'
          ? {
              q: `$${DH} = ${fx(sol.dH.v)}\\,\\mathrm{kJ}$. כמה זה בג׳אול?`,
              options: [sol.dH.v.div(1000), sol.dHJ, sol.dH.v].map((v) => `$${fx(v)}\\,\\mathrm{J}$`),
              correct: 1,
            }
          : {
              q: `$t = ${fx(sol.TC!)}^\\circ\\mathrm{C}$. כמה זה בקלווין?`,
              options: [sol.TC!.sub(273), sol.TK, sol.TC!].map((v) => `$${fx(v)}\\,\\mathrm{K}$`),
              correct: 1,
            },
      run: (c, t) => {
        if (sol.dH.unit === 'kJ') c.math(t, dHLine(sol), 'calc');
        if (sol.T.unit === 'room') c.line(t, 'טמפרטורת החדר = $25^\\circ\\mathrm{C}$', 'dim');
        if (sol.TC) c.math(t, tempLine(sol), 'calc');
      },
    });
  }

  const exo = sol.dHJ.sign() < 0;
  steps.push({
    stage: 1,
    title: `$${SURR}$`,
    say: `מחשבים את $${SURR}$ מ־$${DH}$ ומ־$T$`,
    why: `תגובה אקסותרמית ($${DH} < 0$) פולטת חום לסביבה ← האנטרופיה של הסביבה עולה.\nתגובה אנדותרמית ($${DH} > 0$) לוקחת חום מהסביבה ← האנטרופיה של הסביבה יורדת.`,
    uses: ['dH', 'T'],
    recipe: 0,
    predict: { q: `$${DH} = ${fx(sol.dH.v)}\\,\\mathrm{${sol.dH.unit}}$. מה יהיה הסימן של $${SURR}$?`, options: ['חיובי (+)', 'שלילי (−)'], correct: exo ? 0 : 1 },
    run: (c, t) => {
      c.eqs(t, SURR, [`= -\\dfrac{${DH}}{T}`, `= ${surrFrac(sol)}`, `${rel(sol.dSsurr, o)} ${surr.s}${UNIT_SK}`], 'ans');
      c.line(
        t,
        exo
          ? `$${DH}$ שלילי, ולפני השבר יש מינוס ← מינוס כפול מינוס = פלוס ← $${SURR} > 0$`
          : `$${DH}$ חיובי, ולפני השבר יש מינוס ← $${SURR} < 0$`,
        'dim',
      );
    },
  });

  steps.push({
    stage: 1,
    title: `$${TOT}$`,
    say: `$${TOT}$ = מערכת + סביבה`,
    why: 'מחברים את שני השינויים.\nמספר שלילי כותבים בסוגריים.',
    uses: ['dS'],
    recipe: 1,
    run: (c, t) => {
      c.eqs(t, TOT, [`= ${SYS} + ${SURR}`, `= ${par(fx(sol.dSsys))} + ${par(surr.s)}`, `${relTot} ${tot.s}${UNIT_SK}`], 'ans');
    },
  });

  const box = (label: string, v: string, f: Frac, ans = false) => ({
    label,
    tex: v,
    ans,
    under: f.sign() > 0 ? { html: '↑ עולה', cls: 'up' } : { html: '↓ יורדת', cls: 'down' },
  });
  steps.push({
    stage: 1,
    title: 'ספונטני?',
    say: `בודקים את הסימן של $${TOT}$`,
    why: 'החוק השני של התרמודינמיקה: תהליך ספונטני רק כשהאנטרופיה של היקום עולה.',
    recipe: 2,
    predict: { q: `$${TOT} ${relTot} ${tot.s}\\,\\mathrm{J/K}$. אז התהליך…`, options: ['ספונטני', 'לא ספונטני'], correct: sol.spont ? 0 : 1 },
    run: (c, t) => {
      c.sum(
        t,
        [box('מערכת', fx(sol.dSsys), sol.dSsys), box('סביבה', surr.s, sol.dSsurr), box('יקום', tot.s, sol.dStot, true)],
        ['+', relTot],
      );
      c.rule(t, [`אם $${TOT} > 0$ ← ספונטני`, `אם $${TOT} < 0$ ← לא ספונטני`], [sol.spont ? 0 : 1]);
      c.verdict(t, sol.spont ? `התהליך ספונטני ב־$${Tk}$` : `התהליך לא ספונטני ב־$${Tk}$`, sol.spont ? 'ok' : 'bad');
    },
  });

  const trap = trapOf(sol);
  if (trap) {
    const sig = { sig: 3 };
    steps.push({
      stage: 1,
      title: 'מלכודת',
      say: trap.kind === '1000' ? 'מלכודת: שוכחים להכפיל ב־1000' : 'מלכודת: מציבים °C במקום קלווין',
      why: trap.kind === '1000' ? `$${DH}$ נתון ב־kJ, ו־$\\Delta S^\\circ$ ב־J/K.\nבלי $\\times 1000$ היחידות לא מתאימות.` : 'בנוסחה $T$ תמיד בקלווין: $t + 273$.',
      cls: 'trap',
      run: (c, t) => {
        c.eqs(t, SURR, [`= -\\dfrac{${par(fx(trap.dH))}}{${fx(trap.T)}}`, `${rel(trap.surr, sig)} ${fx(trap.surr, sig)}${UNIT_SK}`], 'bad');
        c.math(t, `${TOT} ${rel(trap.tot, sig)} ${par(fx(sol.dSsys))} + ${par(fx(trap.surr, sig))} ${rel(trap.tot, sig)} ${fx(trap.tot, sig)}${UNIT_SK}`, 'calc');
        c.verdict(t, trap.flips ? `יוצא הפוך: ${sol.spont ? 'לא ספונטני' : 'ספונטני'}. זו טעות!` : 'יוצא מספר אחר לגמרי. זו טעות!', 'bad');
      },
    });
  }

  steps.push(
    exam([
      dHLine(sol) && `$${DH} = ${fx(sol.dH.v)}\\,\\mathrm{kJ} = ${fx(sol.dHJ)}\\,\\mathrm{J}$`,
      tempLine(sol) && `$${tempLine(sol)}$`,
      `$${SURR} = -\\dfrac{${DH}}{T} = ${surrFrac(sol)} ${rel(sol.dSsurr, o)} ${surr.s}${UNIT_SK}$`,
      `$${TOT} = ${SYS} + ${SURR} = ${par(fx(sol.dSsys))} + ${par(surr.s)} ${relTot} ${tot.s}${UNIT_SK}$`,
      `היות ש־$${TOT}$ [[${sol.spont ? 'חיובי' : 'שלילי'}]], לפי החוק השני של התרמודינמיקה התהליך [[${sol.spont ? 'ספונטני' : 'לא ספונטני'}]] בתנאים אלו.`,
    ]),
  );
  return steps;
}

// ---------------------------------------------------------------- dispatch

export function lessonOf(sol: Solution, p: Problem, text?: string): Step[] {
  let steps = stepsOf(sol, p);
  // in exam wording, the first cards decode the question instead of naming its type
  if (text) steps = [...decodeSteps(p, sol, text), ...steps.slice(1)];
  // the recipe strip: each step lights its line; the exam card has them all done
  const labels = topicOfType(sol.type)?.recipeShort;
  if (labels)
    steps = steps.map((s) => {
      const at = s.cls === 'exam' ? labels.length : s.recipe ?? -1;
      return { ...s, pre: (b: Board) => markRecipe(b, at), run: (c, t, b) => (s.run(c, t, b), markRecipe(b, at)) };
    });
  // the reaction stays on top of the board, and the recipe under it
  const rxn = sol.rxn;
  const first = steps[0].run;
  steps[0] = {
    ...steps[0],
    run: (c, t, b) => {
      if (rxn) pinEquation(b, t, rxn);
      if (labels) pinRecipe(b, t, labels);
      first(c, t, b);
    },
  };
  return steps;
}

function stepsOf(sol: Solution, p: Problem): Step[] {
  switch (sol.type) {
    case 'spontaneous':
      return spontLesson(sol, p);
  }
}
