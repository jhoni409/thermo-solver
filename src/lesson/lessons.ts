// One lesson per question type: a short list of steps, one card each. Every number comes from the solver.

import type { Problem, Reaction, Species } from '../engine/parse';
import type { Solution, SpontSol } from '../engine/solve';
import type { Frac } from '../engine/frac';
import { fmt, type FmtOpts } from '../engine/format';
import { speciesTex } from '../engine/chem';
import { statement, dS, DH, UNIT_SK } from '../engine/statement';
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

export function lessonOf(sol: Solution, p: Problem): Step[] {
  const steps = stepsOf(sol, p);
  // the reaction stays on top of the board
  const rxn = sol.rxn;
  if (rxn) {
    const first = steps[0].run;
    steps[0] = { ...steps[0], run: (c, t, b) => (pinEquation(b, t, rxn), first(c, t, b)) };
  }
  return steps;
}

function stepsOf(sol: Solution, p: Problem): Step[] {
  switch (sol.type) {
    case 'spontaneous':
      return spontLesson(sol, p);
  }
}
