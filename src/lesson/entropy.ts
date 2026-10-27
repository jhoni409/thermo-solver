// Lessons for the entropy questions: spontaneous? (T14, T15), back from ΔS°universe, signs without numbers,
// spontaneous but not happening (T16), and the sign of ΔS° from the equation (T9).

import type { Problem, Species, SignKey, Sign } from '../engine/parse';
import type { SpontSol, BackSol, SignsSol, KineticSol, DSignSol, CollisionSol, PR } from '../engine/solve';
import { claimHe, CHANGE_SUBJ } from '../engine/statement';
import { F, type Frac } from '../engine/frac';
import { fmt, type FmtOpts } from '../engine/format';
import { speciesTex, isGas } from '../engine/chem';
import { sideColor } from './board';
import { he } from '../ui/dom';
import { identify, exam, trap, fx, rel, par, col, SYS, SURR, TOT, DH, UNIT_SK, KJ, coefTimes, prColumn, sumTex, prLine, type Step } from './common';

// ---------------------------------------------------------------- shared bits

function unitsStep(dH: { v: Frac; unit: 'kJ' | 'J' }, dHJ: Frac, TC: Frac | undefined, TK: Frac, room: boolean, from: number[] = []): Step | null {
  if (dH.unit !== 'kJ' && !TC) return null;
  return {
    stage: 1,
    title: 'יחידות',
    say: dH.unit === 'kJ' && TC ? `מעבירים יחידות: $${DH}$ ל־J, הטמפרטורה ל־K` : TC ? 'מעבירים את הטמפרטורה לקלווין' : `מעבירים את $${DH}$ לג׳אול`,
    why: `$\\Delta S^\\circ$ נמדד ב־J/K, לכן גם $${DH}$ צריך להיות ב־J ($1\\,\\mathrm{kJ} = 1000\\,\\mathrm{J}$).\nבנוסחה הטמפרטורה תמיד בקלווין: $T = t + 273$.`,
    uses: ['dH', 'T', 'h:room', 'table'],
    recipe: 0,
    from,
    predict:
      dH.unit === 'kJ'
        ? { q: `$${DH} = ${fx(dH.v)}${KJ}$. כמה זה בג׳אול?`, options: [dH.v.div(1000), dHJ, dH.v].map((v) => `$${fx(v)}\\,\\mathrm{J}$`), correct: 1 }
        : { q: `$t = ${fx(TC!)}^\\circ\\mathrm{C}$. כמה זה בקלווין?`, options: [TC!.sub(273), TK, TC!].map((v) => `$${fx(v)}\\,\\mathrm{K}$`), correct: 1 },
    run: (c, t) => {
      if (dH.unit === 'kJ') c.math(t, `${DH} = ${fx(dH.v)}${KJ} \\times 1000 = ${fx(dHJ)}\\,\\mathrm{J}`, 'calc');
      if (room) c.line(t, 'טמפרטורת החדר = $25^\\circ\\mathrm{C}$', 'dim');
      if (TC) c.math(t, `T = ${fx(TC)} + 273 = ${fx(TK)}\\,\\mathrm{K}`, 'calc');
    },
  };
}

/** two short cards that work out a value from a table first (ΔH° from ΔH°f, ΔS° from S°) */
function tableSteps(pr: PR, kind: 'dHf' | 'S', o?: FmtOpts): Step[] {
  const q = kind === 'dHf' ? '\\Delta H^\\circ_f' : 'S^\\circ';
  const res = kind === 'dHf' ? DH : SYS;
  const unit = kind === 'dHf' ? KJ : UNIT_SK;
  const els = [...pr.P, ...pr.R].filter((t) => t.zero);
  return [
    {
      stage: 1,
      title: kind === 'dHf' ? `$${DH}$ מהטבלה` : `$${SYS}$ מהטבלה`,
      say: kind === 'dHf' ? `קודם $${DH}$: תוצרים פחות מגיבים (מ־$\\Delta H^\\circ_f$)` : `קודם $${SYS}$: תוצרים פחות מגיבים (מ־$S^\\circ$)`,
      why: kind === 'dHf' ? 'יסוד במצב תקני: $\\Delta H^\\circ_f = 0$.' : 'ל־$S^\\circ$ של יסוד יש ערך: הוא לא 0.',
      uses: ['table', 'rxn'],
      run: (c, t) => {
        c.cols(t, [
          { title: 'מגיבים', cls: 'r', rows: prColumn(pr.R, { q, res, unit }, 'R', o), sum: sumTex(pr.R, o) },
          { title: 'תוצרים', cls: 'p', rows: prColumn(pr.P, { q, res, unit }, 'P', o), sum: sumTex(pr.P, o) },
        ]);
        if (els.length) c.line(t, `${els.map((x) => `$${speciesTex(x.sp, false)}$`).join(', ')}: יסוד ← $\\Delta H^\\circ_f = 0$`, 'dim');
        c.math(t, `${res} = \\Sigma_{\\text{תוצרים}} - \\Sigma_{\\text{מגיבים}} = ${prLine(pr, o)} = ${fx(pr.total, o)}${unit}`, 'new');
      },
    },
  ];
}

const DIR_HE = { dH: `$${DH}$`, dSsys: `$${SYS}$`, dSsurr: `$${SURR}$`, dStot: `$${TOT}$` } as const;
const SIGN_HE = (s: Sign) => (s > 0 ? 'חיובי' : 'שלילי');
const GT = (k: string, s: Sign) => `$${k} ${s > 0 ? '>' : '<'} 0$`;
const T14_ROWS = [`אם $${DH} < 0$ (אקסותרמית) ← $${SURR} > 0$`, `אם $${DH} > 0$ (אנדותרמית) ← $${SURR} < 0$`];
const T15_ROWS = [`אם $${TOT} > 0$ ← ספונטני`, `אם $${TOT} < 0$ ← לא ספונטני`];

// ---------------------------------------------------------------- 6.9 spontaneous?

/** the common mistake: forgetting ×1000, or putting °C in the formula. The one that flips the verdict wins. */
function trapOf(sol: SpontSol) {
  const cands: { kind: '1000' | 'K'; dH: Frac; T: Frac }[] = [];
  if (sol.dH.unit === 'kJ') cands.push({ kind: '1000', dH: sol.dH.v, T: sol.TK });
  if (sol.TC && !sol.TC.isZero()) cands.push({ kind: 'K', dH: sol.dHJ, T: sol.TC });
  const out = cands.map((c) => {
    const surr = c.dH.neg().div(c.T);
    const tot = sol.dSsys.add(surr);
    return { ...c, surr, tot, flips: !sol.surrOnly && tot.sign() !== sol.dStot.sign() };
  });
  return out.find((x) => x.flips) ?? out[0] ?? null;
}

export function spontLesson(sol: SpontSol, p: Problem): Step[] {
  const o = sol.opts;
  const surr = fmt(sol.dSsurr, o);
  const tot = fmt(sol.dStot, o);
  const relTot = surr.approx || tot.approx ? '\\approx' : '=';
  const Tk = `${fx(sol.TK)}\\,\\mathrm{K}`;
  const exo = sol.dHJ.sign() < 0;
  const surrFrac = `-\\dfrac{${par(fx(sol.dHJ))}}{${fx(sol.TK)}}`;
  const steps: Step[] = [
    identify(p, sol, sol.surrOnly ? `נתונים $${DH}$ ו־$T$ ← מחשבים את $${SURR}$` : `נתונים $${DH}$, $${SYS}$ ו־$T$ ← בודקים את $${TOT}$`, 'החוק השני: תהליך ספונטני כשהאנטרופיה של היקום עולה.\nיקום = מערכת + סביבה.'),
  ];
  if (sol.dHfrom) steps.push(...tableSteps(sol.dHfrom, 'dHf'));
  if (sol.dSfrom) steps.push(...tableSteps(sol.dSfrom, 'S', o));
  const u = unitsStep(sol.dH, sol.dHJ, sol.TC, sol.TK, sol.T.unit === 'room');
  if (u) steps.push(u);
  steps.push({
    stage: 1,
    title: `$${SURR}$`,
    say: `מחשבים את $${SURR}$ מ־$${DH}$ ומ־$T$`,
    why: `תגובה אקסותרמית ($${DH} < 0$) פולטת חום לסביבה ← האנטרופיה של הסביבה עולה.\nתגובה אנדותרמית ($${DH} > 0$) לוקחת חום מהסביבה ← האנטרופיה של הסביבה יורדת.`,
    uses: ['dH', 'T', 'h:room'],
    recipe: 0,
    predict: { q: `$${DH} = ${fx(sol.dH.v)}\\,\\mathrm{${sol.dH.unit}}$. מה יהיה הסימן של $${SURR}$?`, options: ['חיובי (+)', 'שלילי (−)'], correct: exo ? 0 : 1 },
    run: (c, t) => {
      c.eqs(t, SURR, [`= -\\dfrac{${DH}}{T}`, `= ${surrFrac}`, `${rel(sol.dSsurr, o)} ${surr.s}${UNIT_SK}`], 'ans');
      c.line(t, exo ? `$${DH}$ שלילי, ולפני השבר יש מינוס ← מינוס כפול מינוס = פלוס ← $${SURR} > 0$` : `$${DH}$ חיובי, ולפני השבר יש מינוס ← $${SURR} < 0$`, 'dim');
    },
  });
  if (!sol.surrOnly) {
    steps.push({
      stage: 1,
      title: `$${TOT}$`,
      say: `$${TOT}$ = מערכת + סביבה`,
      why: 'מחברים את שני השינויים.\nמספר שלילי כותבים בסוגריים.',
      uses: ['dS', 'table'],
      recipe: 1,
      run: (c, t) => {
        c.eqs(t, TOT, [`= ${SYS} + ${SURR}`, `= ${par(fx(sol.dSsys, o))} + ${par(surr.s)}`, `${relTot} ${tot.s}${UNIT_SK}`], 'ans');
      },
    });
    const box = (label: string, v: string, f: Frac, ans = false) => ({ label, tex: v, ans, under: f.sign() > 0 ? { html: '↑ עולה', cls: 'up' } : { html: '↓ יורדת', cls: 'down' } });
    steps.push({
      stage: 1,
      title: 'ספונטני?',
      say: `בודקים את הסימן של $${TOT}$`,
      why: 'החוק השני של התרמודינמיקה: תהליך ספונטני רק כשהאנטרופיה של היקום עולה.',
      recipe: 2,
      predict: { q: `$${TOT} ${relTot} ${tot.s}\\,\\mathrm{J/K}$. אז התהליך…`, options: ['ספונטני', 'לא ספונטני'], correct: sol.spont ? 0 : 1 },
      run: (c, t) => {
        c.sum(t, [box('מערכת', fx(sol.dSsys, o), sol.dSsys), box('סביבה', surr.s, sol.dSsurr), box('יקום', tot.s, sol.dStot, true)], ['+', relTot]);
        c.rule(t, T15_ROWS, [sol.spont ? 0 : 1]);
        c.verdict(t, sol.spont ? `התהליך ספונטני ב־$${Tk}$` : `התהליך לא ספונטני ב־$${Tk}$`, sol.spont ? 'ok' : 'bad');
      },
    });
  }
  const tr = trapOf(sol);
  if (tr) {
    const sig = { sig: 3 };
    steps.push(
      trap(
        'מלכודת',
        tr.kind === '1000' ? 'מלכודת: שוכחים להכפיל ב־1000' : 'מלכודת: מציבים °C במקום קלווין',
        tr.kind === '1000' ? `$${DH}$ נתון ב־kJ, ו־$\\Delta S^\\circ$ ב־J/K.\nבלי $\\times 1000$ היחידות לא מתאימות.` : 'בנוסחה $T$ תמיד בקלווין: $t + 273$.',
        (c, t) => {
          c.eqs(t, SURR, [`= -\\dfrac{${par(fx(tr.dH))}}{${fx(tr.T)}}`, `${rel(tr.surr, sig)} ${fx(tr.surr, sig)}${UNIT_SK}`], 'bad');
          if (!sol.surrOnly) {
            c.math(t, `${TOT} ${rel(tr.tot, sig)} ${par(fx(sol.dSsys, o))} + ${par(fx(tr.surr, sig))} ${rel(tr.tot, sig)} ${fx(tr.tot, sig)}${UNIT_SK}`, 'calc');
            c.verdict(t, tr.flips ? `יוצא הפוך: ${sol.spont ? 'לא ספונטני' : 'ספונטני'}. זו טעות!` : 'יוצא מספר אחר לגמרי. זו טעות!', 'bad');
          } else c.verdict(t, 'יוצא מספר אחר לגמרי. זו טעות!', 'bad');
        },
      ),
    );
  }
  steps.push(
    exam([
      sol.dHfrom ? `$${DH} = ${prLine(sol.dHfrom)} = ${fx(sol.dHfrom.total)}${KJ}$` : '',
      sol.dSfrom ? `$${SYS} = ${prLine(sol.dSfrom, o)} = ${fx(sol.dSfrom.total, o)}${UNIT_SK}$` : '',
      sol.dH.unit === 'kJ' ? `$${DH} = ${fx(sol.dH.v)}${KJ} = ${fx(sol.dHJ)}\\,\\mathrm{J}$` : '',
      sol.TC ? `$T = ${fx(sol.TC)} + 273 = ${fx(sol.TK)}\\,\\mathrm{K}$` : '',
      `$${SURR} = -\\dfrac{${DH}}{T} = ${surrFrac} ${rel(sol.dSsurr, o)} ${surr.s}${UNIT_SK}$`,
      sol.surrOnly ? `$${SURR}$ [[${exo ? 'חיובי' : 'שלילי'}]]: התגובה [[${exo ? 'פולטת' : 'קולטת'}]] חום ${exo ? 'לסביבה' : 'מהסביבה'}.` : '',
      sol.surrOnly ? '' : `$${TOT} = ${SYS} + ${SURR} = ${par(fx(sol.dSsys, o))} + ${par(surr.s)} ${relTot} ${tot.s}${UNIT_SK}$`,
      sol.surrOnly ? '' : `היות ש־$${TOT}$ [[${sol.spont ? 'חיובי' : 'שלילי'}]], לפי החוק השני של התרמודינמיקה התהליך [[${sol.spont ? 'ספונטני' : 'לא ספונטני'}]] בתנאים אלו.`,
    ]),
  );
  return steps;
}

// ---------------------------------------------------------------- back from ΔS°universe / ΔS°surroundings

export function backLesson(sol: BackSol, p: Problem): Step[] {
  const o = sol.opts;
  const steps: Step[] = [identify(p, sol, `נתון $${sol.surrGiven ? SURR : TOT}$ ← הולכים אחורה במתכון`, 'אותו מתכון, בכיוון ההפוך.')];
  if (sol.dSfrom) steps.push(...tableSteps(sol.dSfrom, 'S', o));
  if (sol.TC)
    steps.push({
      stage: 1,
      title: 'יחידות',
      say: 'מעבירים את הטמפרטורה לקלווין',
      why: 'בנוסחה הטמפרטורה תמיד בקלווין: $T = t + 273$.',
      uses: ['T', 'h:room'],
      run: (c, t) => {
        if (sol.T.unit === 'room') c.line(t, 'טמפרטורת החדר = $25^\\circ\\mathrm{C}$', 'dim');
        c.math(t, `T = ${fx(sol.TC!)} + 273 = ${fx(sol.TK)}\\,\\mathrm{K}`, 'calc');
      },
    });
  const surr = fmt(sol.dSsurr, o);
  if (sol.find === 'dH') {
    if (!sol.surrGiven)
      steps.push({
        stage: 1,
        title: `$${SURR}$`,
        say: `$${SURR}$ = יקום פחות מערכת`,
        why: `$${TOT} = ${SYS} + ${SURR}$, ולכן $${SURR} = ${TOT} - ${SYS}$.`,
        uses: ['dStot', 'dS', 'table'],
        recipe: 1,
        run: (c, t) => {
          c.eqs(t, SURR, [`= ${TOT} - ${SYS}`, `= ${par(fx(sol.dStot!, o))} - ${par(fx(sol.dSsys!, o))}`, `${rel(sol.dSsurr, o)} ${surr.s}${UNIT_SK}`], 'ans');
          c.line(t, 'מינוס של מספר שלילי = פלוס', 'dim');
        },
      });
    const exo = sol.dHJ.sign() < 0;
    steps.push({
      stage: 1,
      title: `$${DH}$`,
      say: `$${DH}$ מ־$${SURR}$: כופלים ב־$T$ ומחליפים סימן`,
      why: `$${SURR} = -\\dfrac{${DH}}{T}$, ולכן $${DH} = -T \\times ${SURR}$.`,
      uses: ['dSsurr', 'T', 'h:room'],
      recipe: 0,
      predict: { q: `$${SURR} = ${surr.s}\\,\\mathrm{J/K}$. מה יהיה הסימן של $${DH}$?`, options: ['חיובי (+)', 'שלילי (−)'], correct: exo ? 1 : 0 },
      run: (c, t) => {
        c.eqs(t, DH, [`= -T \\times ${SURR}`, `= -${fx(sol.TK)} \\times ${par(fx(sol.dSsurr, o))}`, `${rel(sol.dHJ, o)} ${fx(sol.dHJ, o)}\\,\\mathrm{J}`, `${rel(sol.dH, { decimals: (o.decimals ?? 1) + 2 })} ${fx(sol.dH, { decimals: (o.decimals ?? 1) + 2 })}${KJ}`], 'ans');
        c.line(t, `מ־$\\mathrm{J}$ ל־$\\mathrm{kJ}$: מחלקים ב־$1000$. $${DH}$ ${exo ? 'שלילי ← התגובה אקסותרמית' : 'חיובי ← התגובה אנדותרמית'}`, 'dim');
      },
    });
    steps.push(
      trap('מלכודת', 'מלכודת: שוכחים לחלק ב־1000', `$\\Delta S^\\circ$ ב־J/K, ולכן $T \\times \\Delta S^\\circ$ יוצא ב־J, לא ב־kJ.`, (c, t) => {
        c.math(t, `${DH} = ${fx(sol.dHJ, o)}${KJ}`, 'bad');
        c.verdict(t, 'גדול פי 1000 מהנכון. זו טעות!', 'bad');
      }),
    );
    steps.push(
      exam([
        sol.TC ? `$T = ${fx(sol.TC)} + 273 = ${fx(sol.TK)}\\,\\mathrm{K}$` : '',
        sol.surrGiven ? '' : `$${SURR} = ${TOT} - ${SYS} = ${par(fx(sol.dStot!, o))} - ${par(fx(sol.dSsys!, o))} ${rel(sol.dSsurr, o)} ${surr.s}${UNIT_SK}$`,
        `$${DH} = -T \\times ${SURR} = -${fx(sol.TK)} \\times ${par(surr.s)} ${rel(sol.dHJ, o)} ${fx(sol.dHJ, o)}\\,\\mathrm{J} ${rel(sol.dH, { decimals: 3 })} ${fx(sol.dH, { decimals: 3 })}${KJ}$`,
      ]),
    );
    return steps;
  }
  // find ΔS°sys: ΔS°surr from ΔH°, then sys = tot − surr
  const u = unitsStep({ v: sol.dH, unit: 'kJ' }, sol.dHJ, sol.TC, sol.TK, sol.T.unit === 'room');
  if (u && !sol.TC) steps.push(u);
  steps.push({
    stage: 1,
    title: `$${SURR}$`,
    say: `קודם $${SURR}$ מ־$${DH}$ ומ־$T$`,
    uses: ['dH', 'T'],
    recipe: 0,
    run: (c, t) => {
      c.eqs(t, SURR, [`= -\\dfrac{${DH}}{T}`, `= -\\dfrac{${par(fx(sol.dHJ))}}{${fx(sol.TK)}}`, `${rel(sol.dSsurr, o)} ${surr.s}${UNIT_SK}`], 'ans');
    },
  });
  const sys = fmt(sol.dSsys!, o);
  steps.push({
    stage: 1,
    title: `$${SYS}$`,
    say: `$${SYS}$ = יקום פחות סביבה`,
    why: `$${TOT} = ${SYS} + ${SURR}$, ולכן $${SYS} = ${TOT} - ${SURR}$.`,
    uses: ['dStot'],
    recipe: 1,
    run: (c, t) => {
      c.eqs(t, SYS, [`= ${TOT} - ${SURR}`, `= ${par(fx(sol.dStot!, o))} - ${par(surr.s)}`, `${rel(sol.dSsys!, o)} ${sys.s}${UNIT_SK}`], 'ans');
    },
  });
  steps.push(
    exam([
      `$${SURR} = -\\dfrac{${DH}}{T} = -\\dfrac{${par(fx(sol.dHJ))}}{${fx(sol.TK)}} ${rel(sol.dSsurr, o)} ${surr.s}${UNIT_SK}$`,
      `$${SYS} = ${TOT} - ${SURR} = ${par(fx(sol.dStot!, o))} - ${par(surr.s)} ${rel(sol.dSsys!, o)} ${sys.s}${UNIT_SK}$`,
    ]),
  );
  return steps;
}

// ---------------------------------------------------------------- signs without numbers

export function signsLesson(sol: SignsSol, p: Problem): Step[] {
  const steps: Step[] = [identify(p, sol, 'נתונים רק סימנים ← מסיקים סימן מסימן', 'שני כללים: הקשר בין $\\Delta H^\\circ$ לסביבה, ויקום = מערכת + סביבה.')];
  const given = Object.entries(sol.given) as [SignKey, Sign][];
  const key = (k: SignKey) => (k === 'dH' ? DH : k === 'dSsys' ? SYS : k === 'dSsurr' ? SURR : TOT);
  steps.push({
    stage: 1,
    title: 'מה ידוע',
    say: 'מה ידוע על הסימנים?',
    uses: ['*'],
    run: (c, t) => {
      c.chips(t, given.map(([k, s]) => ({ html: he(GT(key(k), s)), cls: s > 0 ? 'up' : 'down' })));
      c.line(t, given.map(([k, s]) => `${DIR_HE[k]} ${SIGN_HE(s)}`).join(' · '), 'calc');
    },
  });
  for (const s of sol.steps) {
    const known = (k: SignKey) => (sol.known[k] == null ? '?' : sol.known[k]! > 0 ? '+' : '−');
    steps.push({
      stage: 1,
      title: `${DIR_HE[s.gives]}`,
      say: `מכאן: ${DIR_HE[s.gives]} ${SIGN_HE(s.sign)}`,
      why:
        s.rule === 'T9'
          ? 'יותר מולי גז = יותר פיזור = אנטרופיה גבוהה יותר.'
          : s.rule === 'T14'
            ? `$${SURR} = -\\dfrac{${DH}}{T}$, ו־$T$ תמיד חיובי: הסימן מתהפך.`
            : `$${TOT} = ${SYS} + ${SURR}$.`,
      recipe: s.rule === 'T15' ? 1 : 0,
      run: (c, t) => {
        if (s.rule === 'T9') {
          c.math(t, `${gasSide(sol.rxn!.R)} \\rightarrow ${gasSide(sol.rxn!.P)}`, 'calc');
          c.rule(t, ['מולי הגז עולים ← $\\Delta S^\\circ > 0$', 'מולי הגז יורדים ← $\\Delta S^\\circ < 0$'], [s.sign > 0 ? 0 : 1]);
        } else if (s.rule === 'T14') c.rule(t, T14_ROWS, [(s.gives === 'dSsurr' ? -s.sign : s.sign) < 0 ? 0 : 1]);
        else {
          c.sum(
            t,
            (['dSsys', 'dSsurr', 'dStot'] as SignKey[]).map((k) => ({
              label: k === 'dSsys' ? 'מערכת' : k === 'dSsurr' ? 'סביבה' : 'יקום',
              tex: known(k),
              ans: k === s.gives,
              under: sol.known[k]! > 0 ? { html: '↑ עולה', cls: 'up' } : { html: '↓ יורדת', cls: 'down' },
            })),
            ['+', '='],
          );
          c.line(t, s.gives === 'dStot' ? 'שני חלקים עם אותו סימן ← הסכום באותו סימן' : `הסכום ${SIGN_HE(sol.known.dStot!)}, וחלק אחד ${SIGN_HE(-sol.known.dStot! as Sign)} ← החלק השני חייב להיות ${SIGN_HE(sol.known.dStot!)}`, 'dim');
        }
        c.verdict(t, `$${key(s.gives)} ${s.sign > 0 ? '>' : '<'} 0$`, 'go');
      },
    });
  }
  const a = sol.answer;
  let verdict = '';
  let ex: string[] = [];
  if (a.kind === 'sign') {
    verdict = `${DIR_HE[a.key]} ${SIGN_HE(a.sign)}${a.key === 'dH' ? (a.sign < 0 ? ' ← התגובה אקסותרמית' : ' ← התגובה אנדותרמית') : ''}`;
    ex = [verdict];
  } else if (a.kind === 'spont') {
    verdict = a.spont ? `$${TOT} > 0$ ← ספונטני` : `$${TOT} < 0$ ← לא ספונטני`;
    ex = [`היות ש־$${TOT}$ [[${a.spont ? 'חיובי' : 'שלילי'}]], התהליך [[${a.spont ? 'ספונטני' : 'לא ספונטני'}]].`];
  } else if (a.kind === 'compare') {
    const big = a.bigger === 'dSsurr' ? 'הסביבה' : 'המערכת';
    verdict = `השינוי באנטרופיה של ${big} גדול יותר בערכו המוחלט`;
    ex = [
      `$${TOT}$ ${SIGN_HE(sol.known.dStot!)}, ו־$${SYS}$, $${SURR}$ בסימנים הפוכים.`,
      `לכן השינוי באנטרופיה של [[${big}]] גדול יותר בערכו המוחלט.`,
    ];
  } else if (a.kind === 'any-T') {
    verdict = a.always ? 'ספונטני בכל טמפרטורה' : 'לא ספונטני באף טמפרטורה';
    ex = [
      `$${SURR} = -\\dfrac{${DH}}{T}$ ${SIGN_HE(sol.known.dSsurr!)} בכל טמפרטורה, ו־$${SYS}$ ${SIGN_HE(sol.known.dSsys!)}.`,
      `לכן $${TOT}$ [[${a.always ? 'חיובי' : 'שלילי'}]] בכל טמפרטורה: התגובה [[${a.always ? 'ספונטנית בכל טמפרטורה' : 'לא ספונטנית באף טמפרטורה'}]].`,
    ];
  }
  if (a.kind === 'compare' || a.kind === 'any-T' || a.kind === 'spont')
    steps.push({
      stage: 1,
      title: 'המסקנה',
      say: a.kind === 'compare' ? 'מי גדול יותר בערכו המוחלט?' : a.kind === 'any-T' ? 'האם יש טמפרטורה שבה זה ספונטני?' : 'ספונטני?',
      why: a.kind === 'compare' ? 'כשמחברים מספר חיובי ושלילי, הסימן של הסכום הוא הסימן של הגדול יותר (בערכו המוחלט).' : a.kind === 'any-T' ? `$T$ תמיד חיובי, לכן הסימן של $${SURR}$ לא משתנה עם הטמפרטורה.` : 'החוק השני.',
      recipe: 2,
      run: (c, t) => {
        if (a.kind === 'spont') c.rule(t, T15_ROWS, [a.spont ? 0 : 1]);
        c.verdict(t, verdict, 'ok');
      },
    });
  steps.push(exam(ex));
  return steps;
}

// ---------------------------------------------------------------- spontaneous but not happening (T16)

export function kineticLesson(sol: KineticSol, p: Problem): Step[] {
  const steps: Step[] = [identify(p, sol, sol.find === 'why' ? 'ספונטני, אבל לא קורה ← אנרגיית שפעול' : 'האם זרז יעזור?', 'ספונטני אומר שהתגובה יכולה לקרות, לא כמה מהר.')];
  steps.push({
    stage: 1,
    title: 'ספונטני?',
    say: `הסימן של $${TOT}$`,
    uses: ['dStot', 'sign'],
    recipe: 0,
    run: (c, t) => {
      c.rule(t, T15_ROWS, [sol.spont ? 0 : 1]);
    },
  });
  if (sol.find === 'why') {
    steps.push({
      stage: 1,
      title: 'למה לא קורה?',
      say: 'ספונטני, ובכל זאת לא קורה: אנרגיית השפעול גבוהה',
      why: 'בטמפרטורת החדר מעט מאוד חלקיקים מגיעים לאנרגיית השפעול, אז התגובה כמעט לא מתקדמת.',
      recipe: 1,
      predict: { q: 'התגובה ספונטנית, אבל לא נוצרים תוצרים. למה?', options: ['$E_a$ גבוהה', 'היא לא ספונטנית', 'חסר חמצן'], correct: 0 },
      run: (c, t) => {
        c.rule(t, ['ספונטני ← התגובה יכולה לקרות', '$E_a$ גבוהה ← בטמפרטורת החדר היא לא קורה (או קורה לאט מאוד)'], [0, 1]);
      },
    });
    steps.push({
      stage: 1,
      title: 'מה עושים?',
      say: 'מה עושים כדי שתקרה? מחממים, או מוסיפים זרז',
      why: 'זרז מוריד את אנרגיית השפעול, ואת $\\Delta H^\\circ$ הוא לא משנה.',
      recipe: 2,
      run: (c, t) => {
        c.levels(t, { R: 40, P: 10, peak: 120, cat: 75, lR: 'מגיבים', lP: 'תוצרים', lPeak: 'בלי זרז', lCat: 'עם זרז', ea: 'Ea', eaCat: 'Ea קטנה' });
        c.chips(t, [
          { html: 'חימום', cls: 'type' },
          { html: 'זרז', cls: 'type' },
        ]);
        c.line(t, 'התמונה להמחשה בלבד, בלי מספרים', 'dim');
      },
    });
    steps.push(exam(['התגובה [[ספונטנית]], אבל [[אנרגיית השפעול]] שלה גבוהה, ולכן בטמפרטורת החדר היא לא מתרחשת.', 'כדי שתתרחש: [[מחממים]] או [[מוסיפים זרז]].']));
    return steps;
  }
  steps.push({
    stage: 1,
    title: 'זרז?',
    say: sol.spont ? 'זרז מזרז תגובה ספונטנית' : 'זרז לא הופך תגובה לא ספונטנית לספונטנית',
    why: `זרז לא משנה את $${DH}$ ולא את המגיבים והתוצרים, ולכן גם $${SURR}$, $${SYS}$ ו־$${TOT}$ לא משתנים.`,
    recipe: 1,
    run: (c, t) => {
      c.rule(t, [`זרז ← $E_a$ קטנה`, `זרז ← $${DH}$ לא משתנה, $${TOT}$ לא משתנה`], [0, 1]);
      c.verdict(t, sol.spont ? 'כן: הזרז יעזור לה להתרחש מהר יותר' : 'לא: עם זרז היא עדיין לא ספונטנית', sol.spont ? 'ok' : 'bad');
    },
  });
  steps.push(exam([sol.spont ? 'זרז מוריד את אנרגיית השפעול ולכן [[יעזור]].' : `זרז לא משנה את $${TOT}$, ולכן הוא [[לא יעזור]]: התגובה נשארת לא ספונטנית.`]));
  return steps;
}

// ---------------------------------------------------------------- T18: which statement is right (the collision model)

const T18_ROWS = [
  'חימום או ניצוץ ← האנרגייה הקינטית של החלקיקים גדלה; $E_a$ לא משתנה',
  'זרז ← $E_a$ קטנה; האנרגייה של החלקיקים לא משתנה',
  'בשני המקרים ← יותר חלקיקים מגיעים ל־$E_a$ ← יותר התנגשויות יעילות',
];

/** why a statement is right or wrong, in one line */
function claimWhy(claim: CollisionSol['claims'][number], heat: boolean): string {
  switch (claim.claim) {
    case 'Ea-down':
      return claim.ok ? 'נכון: הזרז מקטין את $E_a$.' : 'לא נכון: חימום או ניצוץ לא משנים את $E_a$. רק זרז מקטין אותה.';
    case 'KE-up':
      return claim.ok ? 'נכון: לחלקיקים יש יותר אנרגייה קינטית, אז יותר התנגשויות מגיעות ל־$E_a$.' : 'לא נכון: זרז לא משנה את האנרגייה של החלקיקים. הוא מקטין את $E_a$.';
    case 'more-reach':
      return heat ? 'נכון: לחלקיקים יש יותר אנרגייה, אז יותר מהם מגיעים ל־$E_a$ ויוצרים תצמידים משופעלים.' : 'נכון: $E_a$ קטנה, אז יותר חלקיקים מגיעים אליה ויוצרים תצמידים משופעלים.';
    case 'dH-change':
      return `לא נכון: $${DH}$ תלוי רק במגיבים ובתוצרים. הוא לא משתנה.`;
  }
}

export function collisionLesson(sol: CollisionSol, p: Problem): Step[] {
  const heat = sol.change !== 'catalyst';
  const subj = CHANGE_SUBJ[sol.change];
  const right = sol.claims[sol.correct];
  const steps: Step[] = [identify(p, sol, 'בוחרים היגד ← בודקים כל היגד מול תורת ההתנגשויות', 'רק היגד אחד מתאים לכלל.')];
  steps.push({
    stage: 1,
    title: 'מה צריך לתגובה?',
    say: 'תגובה קורית רק כשחלקיקים מתנגשים עם אנרגייה של לפחות $E_a$',
    why: 'ההתנגשות צריכה גם כיוון מתאים. אז נוצר תצמיד משופעל, וממנו התוצרים.',
    recipe: 0,
    run: (c, t) => {
      c.levels(t, { R: 40, P: 10, peak: 120, lR: 'מגיבים', lP: 'תוצרים', lPeak: 'תצמיד משופעל', ea: 'Ea' });
      c.line(t, '$E_a$ = האנרגייה המינימלית שצריך בהתנגשות', 'dim');
    },
  });
  steps.push({
    stage: 1,
    title: `מה ${subj} עושה?`,
    say: `מה ${subj} משנה?`,
    why: heat ? 'חימום נותן לחלקיקים אנרגייה. המחסום עצמו, $E_a$, נשאר אותו דבר.' : 'זרז מנמיך את המחסום, $E_a$. האנרגייה של החלקיקים נשארת אותו דבר.',
    uses: ['h:hot', 'h:spark', 'g:cat'],
    recipe: 1,
    predict: { q: `${subj} מקטין את $E_a$?`, options: ['כן', 'לא'], correct: heat ? 1 : 0 },
    run: (c, t) => {
      if (heat) c.levels(t, { R: 40, P: 10, peak: 120, lR: 'מגיבים', lP: 'תוצרים', lPeak: 'אותו שיא', ea: 'Ea לא משתנה' });
      else c.levels(t, { R: 40, P: 10, peak: 120, cat: 75, lR: 'מגיבים', lP: 'תוצרים', lPeak: 'בלי זרז', lCat: 'עם זרז', eaCat: 'Ea קטנה' });
      c.rule(t, T18_ROWS, heat ? [0, 2] : [1, 2]);
    },
  });
  for (const cl of sol.claims)
    steps.push({
      stage: 1,
      title: `היגד ${cl.label}`,
      say: `היגד ${cl.label}: נכון או לא?`,
      why: cl.ok ? 'ההיגד מתאים לכלל.' : 'ההיגד סותר את הכלל: זו הטעות שהשאלה בודקת.',
      uses: ['a:statement'],
      cls: cl.ok ? undefined : 'trap',
      recipe: 2,
      predict: { q: `״${claimHe(cl.claim, sol.change)}״`, options: ['נכון', 'לא נכון'], correct: cl.ok ? 0 : 1 },
      run: (c, t) => {
        c.verdict(t, claimWhy(cl, heat), cl.ok ? 'ok' : 'bad');
      },
    });
  steps.push(
    exam([
      `ההיגד הנכון הוא [[${right.label}]].`,
      heat
        ? `לפי תורת ההתנגשויות, ${subj} מגדיל את [[האנרגייה הקינטית]] של חלקיקי המגיבים. לכן ל[[יותר חלקיקים]] יש אנרגייה של לפחות $E_a$, יש יותר התנגשויות [[יעילות]] שיוצרות תצמידים משופעלים, והתגובה מתרחשת.`
        : `לפי תורת ההתנגשויות, הזרז [[מקטין את $E_a$]]. לכן באותה טמפרטורה ל[[יותר חלקיקים]] יש אנרגייה מספקת, יש יותר התנגשויות [[יעילות]] שיוצרות תצמידים משופעלים, והתגובה מתרחשת.`,
      sol.change === 'heat' ? '$E_a$ [[לא משתנה]] כשמחממים.' : sol.change === 'spark' ? '$E_a$ [[לא משתנה]] בעקבות הניצוץ.' : 'האנרגייה של החלקיקים [[לא משתנה]] כשמוסיפים זרז.',
    ]),
  );
  return steps;
}

// ---------------------------------------------------------------- T9: the sign of ΔS° from the equation

function gasSide(xs: Species[]): string {
  const g = xs.filter(isGas);
  const n = g.reduce((a, x) => a.add(x.coef), F(0));
  const parts = g.map((x) => fx(x.coef));
  const sum = g.length > 1 ? `${parts.join('+')}=${fx(n)}` : fx(n);
  return `\\underbrace{${xs.map((x) => col(sideColor(x), speciesTex(x))).join(' + ')}}_{${sum}\\ \\text{מול גז}}`;
}

export function dSsignLesson(sol: DSignSol, p: Problem): Step[] {
  const allR = sol.rxn.R.reduce((a, x) => a.add(x.coef), F(0));
  const allP = sol.rxn.P.reduce((a, x) => a.add(x.coef), F(0));
  const verdictHe = sol.sign > 0 ? 'חיובי' : sol.sign < 0 ? 'שלילי' : 'לא ניתן לקבוע (השינוי קטן)';
  const hit = sol.case === 'gas' ? (sol.sign > 0 ? 0 : 1) : sol.case === 'phase' ? (sol.sign > 0 ? 2 : 3) : 4;
  const steps: Step[] = [identify(p, sol, 'שואלים על הסימן של $\\Delta S^\\circ$ ← סופרים מולי גז', 'גז הוא המצב המפוזר ביותר, ולכן מולי הגז קובעים.')];
  steps.push({
    stage: 1,
    title: 'מולי גז',
    say: 'סופרים מולי גז בכל צד (רק (g))',
    why: 'מוצקים ונוזלים לא נספרים: רק גזים.',
    uses: ['rxn'],
    recipe: 0,
    predict: sol.case === 'gas' ? { q: `מגיבים: $${fx(sol.gasR)}$ מול גז, תוצרים: $${fx(sol.gasP)}$ מול גז. מספר מולי הגז…`, options: ['עולה', 'יורד'], correct: sol.sign > 0 ? 0 : 1 } : undefined,
    run: (c, t) => {
      c.math(t, `${gasSide(sol.rxn.R)} \\rightarrow ${gasSide(sol.rxn.P)}`, 'calc');
    },
  });
  steps.push({
    stage: 1,
    title: 'הכלל',
    say: `הסימן של $${SYS}$`,
    why: 'יותר מולי גז = יותר פיזור של חלקיקים = אנטרופיה גבוהה יותר.',
    recipe: 1,
    run: (c, t) => {
      c.rule(
        t,
        [
          'מולי הגז עולים ← $\\Delta S^\\circ > 0$',
          'מולי הגז יורדים ← $\\Delta S^\\circ < 0$',
          'בלי גז: מוצק ← נוזל ← גז ← $\\Delta S^\\circ > 0$',
          'בלי גז: גז ← נוזל ← מוצק ← $\\Delta S^\\circ < 0$',
          'אותו מספר מולי גז ← לא ניתן לקבוע (השינוי קטן)',
        ],
        [hit],
      );
      c.verdict(t, `$${SYS}$: ${verdictHe}`, sol.sign === 0 ? 'go' : 'ok');
    },
  });
  if (sol.case !== 'phase' && !allR.eq(sol.gasR) && !allP.eq(sol.gasP) && allP.cmp(allR) !== sol.sign)
    steps.push(
      trap('מלכודת', 'מלכודת: סופרים את כל המולים, לא רק גז', 'מוצקים ונוזלים לא נספרים.', (c, t) => {
        c.math(t, `${fx(allR)}\\ \\text{מול} \\rightarrow ${fx(allP)}\\ \\text{מול}`, 'bad');
        c.verdict(t, 'יוצאת תשובה אחרת. זו טעות!', 'bad');
      }),
    );
  steps.push(
    exam(
      sol.case === 'gas'
        ? [`סימנו של $${SYS}$ יהיה [[${verdictHe}]].`, `בניסוח התגובה יש [[${sol.sign > 0 ? 'עלייה' : 'ירידה'}]] במספר מולי הגז: מ־[[${fx(sol.gasR)}]] מול גז במגיבים ל־[[${fx(sol.gasP)}]] מול גז בתוצרים.`]
        : sol.case === 'phase'
          ? [`סימנו של $${SYS}$ יהיה [[${verdictHe}]]: מעבר מ־${stateHe(sol.phase!.from)} ל־${stateHe(sol.phase!.to)} ${sol.sign > 0 ? 'מגדיל' : 'מקטין'} את פיזור החלקיקים.`]
          : [`מספר מולי הגז [[שווה]] בשני הצדדים (${fx(sol.gasR)}), ולכן השינוי באנטרופיה של המערכת [[קטן]], ולא ניתן לקבוע את סימנו מהניסוח.`],
    ),
  );
  return steps;
}

const stateHe = (s: string) => ({ s: 'מוצק', l: 'נוזל', g: 'גז', aq: 'תמיסה' })[s] ?? s;
export { stateHe, coefTimes };
