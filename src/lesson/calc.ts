// Lessons for the calculations: products − reactants from a table (T13, T7) and its unknown value, heat for an amount
// (T3), a reversed / multiplied equation (T2), another state of matter (T17), bond enthalpies (T6), the energy diagram (T8).

import type { Problem } from '../engine/parse';
import type { PRSol, HeatSol, DHNewSol, PhaseSol, BondsSol, DiagramSol, PRTerm } from '../engine/solve';
import { F, ZERO, type Frac } from '../engine/frac';
import { fmt, type FmtOpts } from '../engine/format';
import { speciesTex, formulaTex, bondTex, isStdElement } from '../engine/chem';
import { ORANGE, BLUE, sideColor } from './board';
import { identify, exam, trap, fx, rel, par, col, SYS, DH, UNIT_SK, KJ, coefTimes, prColumn, sumTex, prLine, reactionC, type Step } from './common';
import { stateHe } from './entropy';

const T1_ROWS = [`אם $\\Delta H^\\circ < 0$ ← אקסותרמית: נפלט חום`, `אם $\\Delta H^\\circ > 0$ ← אנדותרמית: נבלע חום`];

// ---------------------------------------------------------------- products − reactants (T13: S°, T7: ΔH°f)

export function prLesson(sol: PRSol, p: Problem): Step[] {
  const isS = sol.type === 'dS' || sol.type === 'S-unknown';
  const q = isS ? 'S^\\circ' : '\\Delta H^\\circ_f';
  const res = isS ? SYS : DH;
  const unit = isS ? UNIT_SK : KJ;
  const o: FmtOpts = sol.opts;
  const pr = sol.pr;
  const words = { q, res, unit };
  const x = pr.x;
  const els = [...pr.P, ...pr.R].filter((t) => (isS ? isStdElement(t.sp) : t.zero));
  const steps: Step[] = [
    identify(p, sol, x ? `נתון ה־$${res}$ של התגובה, וחסר ערך אחד ← מוצאים את x` : `נתונה טבלת $${q}$ ← תוצרים פחות מגיבים`, isS ? 'אנטרופיה של תגובה = סכום התוצרים פחות סכום המגיבים.' : 'אנתלפיה של תגובה = סכום התוצרים פחות סכום המגיבים.'),
  ];
  steps.push({
    stage: 1,
    title: 'הנוסחה',
    say: `הנוסחה: $${res}$ = תוצרים פחות מגיבים`,
    why: 'כל ערך בטבלה הוא למול אחד, ולכן כופלים במקדם מהניסוח.',
    uses: ['table', 'rxn'],
    recipe: 0,
    predict: els.length
      ? isS
        ? { q: `$${speciesTex(els[0].sp, false)}$ הוא יסוד. מה מציבים בשבילו?`, options: ['$0$', `$${fx(els[0].v!, o)}$ (מהטבלה)`], correct: 1 }
        : { q: `$${speciesTex(els[0].sp, false)}$ הוא יסוד במצב תקני. מה ה־$\\Delta H^\\circ_f$ שלו?`, options: ['$0$', 'צריך נתון'], correct: 0 }
      : undefined,
    run: (c, t) => {
      c.math(t, `${res} = \\Sigma\\, n \\cdot ${q}_{\\text{(תוצרים)}} - \\Sigma\\, n \\cdot ${q}_{\\text{(מגיבים)}}`, 'calc');
      c.rule(
        t,
        isS ? ['כל חומר ← $S^\\circ$ מהטבלה כפול המקדם', 'יסוד ← גם לו יש $S^\\circ$ (לא 0)'] : ['תרכובת ← $\\Delta H^\\circ_f$ מהטבלה כפול המקדם', 'יסוד במצב תקני ← $\\Delta H^\\circ_f = 0$'],
        els.length ? [0, 1] : [0],
      );
    },
  });
  steps.push({
    stage: 1,
    title: 'תוצרים ומגיבים',
    say: 'כל צד לחוד: מקדם × ערך, ואז סכום',
    why: 'תוצרים (כחול) ומגיבים (כתום) מחשבים בנפרד.',
    uses: ['table', 'rxn'],
    recipe: 1,
    run: (c, t) => {
      const sumOr = (ts: PRTerm[], side: 'R' | 'P') => (x && x.sp.side === side ? `\\Sigma = ${fx(side === 'P' ? x.knownP : x.knownR, o)} + ${coefTimes(x.sp.coef)}x` : sumTex(ts, o));
      c.cols(t, [
        { title: 'מגיבים', cls: 'r', rows: prColumn(pr.R.map((r) => (x && r.sp === x.sp ? { ...r, v: null, prod: null } : r)), words, 'R', o), sum: sumOr(pr.R, 'R') },
        { title: 'תוצרים', cls: 'p', rows: prColumn(pr.P.map((r) => (x && r.sp === x.sp ? { ...r, v: null, prod: null } : r)), words, 'P', o), sum: sumOr(pr.P, 'P') },
      ]);
    },
  });
  if (!x) {
    steps.push({
      stage: 1,
      title: 'תוצרים − מגיבים',
      say: 'תוצרים פחות מגיבים',
      why: pr.sumR!.sign() < 0 ? 'מחסירים מספר שלילי: מינוס כפול מינוס = פלוס.' : 'המספר השני נכתב בסוגריים כשהוא שלילי.',
      recipe: 2,
      run: (c, t) => {
        c.eqs(t, res, [`= \\Sigma_{\\text{תוצרים}} - \\Sigma_{\\text{מגיבים}}`, `= ${prLine(pr, o)}`, `${rel(pr.total, o)} ${fx(pr.total, o)}${unit}`], 'ans');
        if (pr.sumR!.sign() < 0) c.line(t, 'מינוס כפול מינוס = פלוס', 'dim');
        if (!isS) c.line(t, pr.total.sign() < 0 ? '$\\Delta H^\\circ < 0$ ← אקסותרמית' : '$\\Delta H^\\circ > 0$ ← אנדותרמית', 'dim');
      },
    });
    // the trap: an element taken as 0 for S°, or the coefficients forgotten
    const elTrap = isS && els.length;
    const coefTerms = [...pr.P, ...pr.R].some((t) => !t.sp.coef.eq(1) && t.v && !t.v.isZero());
    if (elTrap || coefTerms) {
      const wrongP = pr.P.reduce((a, t) => a.add(elTrap ? (isStdElement(t.sp) ? ZERO : t.prod!) : t.v!), ZERO);
      const wrongR = pr.R.reduce((a, t) => a.add(elTrap ? (isStdElement(t.sp) ? ZERO : t.prod!) : t.v!), ZERO);
      const wrong = wrongP.sub(wrongR);
      if (!wrong.eq(pr.total))
        steps.push(
          trap('מלכודת', elTrap ? 'מלכודת: שמים 0 ל־$S^\\circ$ של יסוד' : 'מלכודת: שוכחים את המקדמים', elTrap ? '0 נכון רק ל־$\\Delta H^\\circ_f$ של יסוד, לא ל־$S^\\circ$.' : 'הערך בטבלה הוא למול אחד.', (c, t) => {
            c.math(t, `${res} = ${par(fx(wrongP, o))} - ${par(fx(wrongR, o))} = ${fx(wrong, o)}${unit}`, 'bad');
            c.verdict(t, `במקום ${fx(pr.total, o)}. זו טעות!`, 'bad');
          }),
        );
    }
    steps.push(exam([`$${res} = \\Sigma_{\\text{תוצרים}} - \\Sigma_{\\text{מגיבים}} = ${prLine(pr, o)} = ${fx(pr.total, o)}${unit}$`]));
    return steps;
  }
  // the unknown: write the equation with x and solve it
  const xs = x.sp;
  const xName = `${q}(${formulaTex(xs.f)})`;
  const cx = `${coefTimes(xs.coef)}x`;
  const lhs = fx(pr.total, o);
  const kP = fx(x.knownP, o);
  const kR = fx(x.knownR, o);
  const lines =
    xs.side === 'P'
      ? [`${lhs} = (${kP} + ${cx}) - ${par(kR)}`, `${cx} = ${lhs} - ${par(kP)} + ${par(kR)}`]
      : [`${lhs} = ${par(kP)} - (${kR} + ${cx})`, `${cx} = ${par(kP)} - ${par(kR)} - ${par(lhs)}`];
  const xv = fmt(x.v, o);
  steps.push({
    stage: 1,
    title: 'פותרים את x',
    say: `מציבים בנוסחה ופותרים: $x = ${xName}$`,
    why: 'מעבירים את כל המספרים הידועים לצד אחד, ו־x נשאר לבד.',
    uses: [isS ? 'dS' : 'dH'],
    recipe: 2,
    run: (c, t) => {
      for (const l of lines) c.math(t, l, 'calc');
      if (!xs.coef.eq(1)) c.math(t, `x = \\dfrac{${fx(x.v.mul(xs.coef), o)}}{${fx(xs.coef)}} ${rel(x.v, o)} ${xv.s}`, 'calc');
      c.math(t, `${xName} ${rel(x.v, o)} ${xv.s}${isS ? '\\,\\mathrm{\\tfrac{J}{mol\\cdot K}}' : '\\,\\mathrm{\\tfrac{kJ}{mol}}'}`, 'ans');
    },
  });
  steps.push(exam([`$${res} = \\Sigma_{\\text{תוצרים}} - \\Sigma_{\\text{מגיבים}}$`, ...lines.map((l) => `$${l}$`), `$${xName} ${rel(x.v, o)} ${xv.s}$`]));
  return steps;
}

// ---------------------------------------------------------------- T3: heat for an amount (and back)

export function heatLesson(sol: HeatSol, p: Problem): Step[] {
  const sp = sol.sp;
  const name = col(sideColor(sp), formulaTex(sp.f));
  const coef = fx(sp.coef);
  const o = { sig: 5 };
  const steps: Step[] = [
    identify(
      p,
      sol,
      sol.type === 'heat' ? 'נתונה כמות חומר ← כמה חום?' : sol.type === 'mass-for-heat' ? 'נתונה כמות חום ← כמה חומר?' : 'נתונה כמות חום לכמות חומר ← $\\Delta H^\\circ$ למול',
      '$\\Delta H^\\circ$ שייך לתגובה כפי שהיא כתובה: למספר המולים שכתוב במקדמים.',
    ),
  ];
  const nStep: Step | null =
    sol.nFromMass && sol.m && sol.M
      ? {
          stage: 1,
          title: 'מולים',
          say: 'מסה ← מולים: מחלקים במסה המולרית',
          why: '$n = \\dfrac{m}{M}$: גרם חלקי גרם למול = מול.',
          uses: ['m', 'M'],
          recipe: 0,
          run: (c, t) => {
            c.math(t, `n_{${name}} = \\dfrac{m}{M} = \\dfrac{${fx(sol.m!)}\\,\\mathrm{g}}{${fx(sol.M!)}\\,\\mathrm{g/mol}} ${rel(sol.n, o)} ${fx(sol.n, o)}\\,\\mathrm{mol}`, 'calc');
          },
        }
      : null;
  const recipeStep: Step = {
    stage: 1,
    title: 'המתכון מהניסוח',
    say: `$${DH}$ שייך ל־${coef} מול ${'$' + name + '$'} (המקדם)`,
    why: 'המקדם בניסוח אומר לכמה מולים שייך ה־$\\Delta H^\\circ$.',
    uses: ['rxn', 'dH'],
    recipe: 1,
    run: (c, t) => {
      c.math(t, `${coef}\\ \\mathrm{mol}\\ ${name} \\ \\longleftrightarrow\\ ${fx(sol.dH.abs())}${KJ}`, 'calc');
    },
  };
  if (sol.type === 'heat') {
    if (nStep) steps.push(nStep);
    steps.push(recipeStep);
    steps.push({
      stage: 1,
      title: 'כמה חום',
      say: `חום = מולים ÷ מקדם × $|${DH}|$`,
      uses: ['dH'],
      recipe: 2,
      predict: { q: `$${DH} = ${fx(sol.dH)}${KJ}$. החום…`, options: ['נפלט', 'נבלע'], correct: sol.released ? 0 : 1 },
      run: (c, t) => {
        c.math(t, `q = \\dfrac{${fx(sol.n, o)}}{${coef}} \\times ${fx(sol.dH.abs())} ${rel(sol.q, o)} ${fx(sol.q, o)}${KJ}`, 'ans');
        c.rule(t, T1_ROWS, [sol.released ? 0 : 1]);
      },
    });
    if (!sp.coef.eq(1))
      steps.push(
        trap('מלכודת', 'מלכודת: שוכחים לחלק במקדם', `$${DH}$ שייך ל־${coef} מול, לא למול אחד.`, (c, t) => {
          const w = sol.n.mul(sol.dH.abs());
          c.math(t, `q = ${fx(sol.n, o)} \\times ${fx(sol.dH.abs())} = ${fx(w, o)}${KJ}`, 'bad');
          c.verdict(t, `פי ${coef} מהנכון. זו טעות!`, 'bad');
        }),
      );
    steps.push(exam([nStep ? `$n = \\dfrac{${fx(sol.m!)}}{${fx(sol.M!)}} ${rel(sol.n, o)} ${fx(sol.n, o)}\\,\\mathrm{mol}$` : '', `$q = \\dfrac{${fx(sol.n, o)}}{${coef}} \\times ${fx(sol.dH.abs())} ${rel(sol.q, o)} ${fx(sol.q, o)}${KJ}$`, `${sol.released ? 'נפלט' : 'נבלע'} חום, כי [[${sol.released ? '$\\Delta H^\\circ < 0$' : '$\\Delta H^\\circ > 0$'}]].`]));
    return steps;
  }
  if (sol.type === 'mass-for-heat') {
    steps.push(recipeStep);
    steps.push({
      stage: 1,
      title: 'מולים',
      say: 'כמה מולים נותנים את החום הזה?',
      uses: ['q'],
      recipe: 0,
      run: (c, t) => {
        c.math(t, `n = \\dfrac{q}{|${DH}|} \\times ${coef} = \\dfrac{${fx(sol.q)}}{${fx(sol.dH.abs())}} \\times ${coef} ${rel(sol.n, o)} ${fx(sol.n, o)}\\,\\mathrm{mol}`, 'calc');
      },
    });
    steps.push({
      stage: 1,
      title: 'גרמים',
      say: 'מולים ← גרמים: כופלים במסה המולרית',
      uses: ['M'],
      recipe: 2,
      run: (c, t) => {
        c.math(t, `m = n \\times M = ${fx(sol.n, o)} \\times ${fx(sol.M!)} ${rel(sol.m!, o)} ${fx(sol.m!, o)}\\,\\mathrm{g}`, 'ans');
      },
    });
    steps.push(exam([`$n = \\dfrac{${fx(sol.q)}}{${fx(sol.dH.abs())}} \\times ${coef} ${rel(sol.n, o)} ${fx(sol.n, o)}\\,\\mathrm{mol}$`, `$m = ${fx(sol.n, o)} \\times ${fx(sol.M!)} ${rel(sol.m!, o)} ${fx(sol.m!, o)}\\,\\mathrm{g}$`]));
    return steps;
  }
  // dH from q
  if (nStep) steps.push(nStep);
  const per = sol.q.div(sol.n);
  steps.push({
    stage: 1,
    title: 'למול אחד',
    say: 'כמה חום למול? חום ÷ מולים',
    uses: ['q'],
    recipe: 1,
    run: (c, t) => {
      c.math(t, `\\dfrac{${fx(sol.q)}${KJ}}{${fx(sol.n, o)}\\,\\mathrm{mol}} ${rel(per, o)} ${fx(per, o)}\\,\\mathrm{kJ/mol}`, 'calc');
      if (!sp.coef.eq(1)) c.math(t, `\\times ${coef}\\ (\\text{המקדם}) = ${fx(per.mul(sp.coef), o)}${KJ}`, 'calc');
    },
  });
  steps.push({
    stage: 1,
    title: 'הסימן',
    say: `החום ${sol.released ? 'נפלט' : 'נבלע'} ← הסימן של $${DH}$`,
    recipe: 2,
    predict: { q: `החום ${sol.released ? 'נפלט' : 'נבלע'}. הסימן של $${DH}$…`, options: ['חיובי (+)', 'שלילי (−)'], correct: sol.released ? 1 : 0 },
    run: (c, t) => {
      c.rule(t, ['נפלט חום ← $\\Delta H^\\circ < 0$', 'נבלע חום ← $\\Delta H^\\circ > 0$'], [sol.released ? 0 : 1]);
      c.math(t, `${DH} ${rel(sol.dH, o)} ${fx(sol.dH, o)}${KJ}`, 'ans');
    },
  });
  steps.push(exam([nStep ? `$n = \\dfrac{${fx(sol.m!)}}{${fx(sol.M!)}} = ${fx(sol.n, o)}\\,\\mathrm{mol}$` : '', `$${DH} = ${sol.released ? '-' : ''}\\dfrac{${fx(sol.q)}}{${fx(sol.n, o)}}${sp.coef.eq(1) ? '' : ` \\times ${coef}`} ${rel(sol.dH, o)} ${fx(sol.dH, o)}${KJ}$`]));
  return steps;
}

// ---------------------------------------------------------------- T2: reversed / multiplied

export function dHnewLesson(sol: DHNewSol, p: Problem): Step[] {
  const k = fx(sol.k);
  const what = sol.reversed && !sol.k.eq(1) ? `הפוכה, וכפולה ב־${k}` : sol.reversed ? 'הפוכה' : `כפולה ב־${k}`;
  const steps: Step[] = [identify(p, sol, 'אותה תגובה, הפוכה או כפולה ← $\\Delta H^\\circ$ החדש', '$\\Delta H^\\circ$ שייך לתגובה כפי שהיא כתובה.')];
  steps.push({
    stage: 1,
    title: 'מה השתנה?',
    say: `משווים: התגובה החדשה ${what}`,
    uses: ['rxn', 'new'],
    recipe: 0,
    run: (c, t) => {
      c.math(t, reactionC(sol.rxn), 'calc');
      c.math(t, reactionC(sol.newRxn), 'calc');
    },
  });
  steps.push({
    stage: 1,
    title: `$${DH}$ החדש`,
    say: 'הכלל: הופכים ← הסימן מתחלף; כופלים ← $\\Delta H^\\circ$ כפול',
    recipe: 1,
    predict: sol.reversed ? { q: `$${DH} = ${fx(sol.dH)}${KJ}$, והתגובה הפוכה. הסימן החדש…`, options: ['אותו סימן', 'סימן הפוך'], correct: 1 } : undefined,
    run: (c, t) => {
      c.rule(t, ['הופכים את התגובה ← $\\Delta H^\\circ$ מחליף סימן', 'כופלים ב־n ← $\\Delta H^\\circ$ כפול n'], [sol.reversed ? 0 : -1, sol.k.eq(1) ? -1 : 1].filter((x) => x >= 0));
      c.math(t, `${DH}_{\\text{חדש}} = ${sol.reversed ? '-' : ''}${sol.k.eq(1) ? '' : `${k} \\times `}${par(fx(sol.dH))} = ${fx(sol.dHnew)}${KJ}`, 'ans');
      c.line(t, sol.dHnew.sign() < 0 ? 'שלילי ← בתגובה החדשה נפלט חום' : 'חיובי ← בתגובה החדשה נבלע חום', 'dim');
    },
  });
  steps.push(exam([`התגובה החדשה ${what}: $${DH}_{\\text{חדש}} = ${sol.reversed ? '-' : ''}${sol.k.eq(1) ? '' : `${k} \\times `}${par(fx(sol.dH))} = ${fx(sol.dHnew)}${KJ}$`]));
  return steps;
}

// ---------------------------------------------------------------- T17: another state of matter

export function phaseLesson(sol: PhaseSol, p: Problem): Step[] {
  const steps: Step[] = [identify(p, sol, 'חומר במצב צבירה אחר ← משווים חום', 'שינוי מצב צבירה גם הוא קולט או פולט חום.')];
  const T17 = ['מוצק ← נוזל ← גז (התכה, רתיחה): נבלע חום, $\\Delta H^\\circ > 0$', 'גז ← נוזל ← מוצק (עיבוי, קיפאון): נפלט חום, $\\Delta H^\\circ < 0$'];
  if (sol.pure) {
    const up = sol.pure.sign > 0;
    steps.push({
      stage: 1,
      title: 'הכלל',
      say: `${stateHe(sol.pure.from)} ← ${stateHe(sol.pure.to)}: נבלע או נפלט חום?`,
      why: 'כדי לפרק את הכוחות בין המולקולות צריך להשקיע אנרגיה.',
      recipe: 0,
      predict: { q: `${fT2(sol.pure.f)} עובר מ${stateHe(sol.pure.from)} ל${stateHe(sol.pure.to)}. החום…`, options: ['נבלע', 'נפלט'], correct: up ? 0 : 1 },
      run: (c, t) => {
        c.rule(t, T17, [up ? 0 : 1]);
        c.verdict(t, up ? '$\\Delta H^\\circ > 0$' : '$\\Delta H^\\circ < 0$', 'ok');
        if (sol.options && sol.pick != null) c.line(t, `לכן הערך המתאים: $${fx(sol.options[sol.pick])}${KJ}$`, 'calc');
      },
    });
    steps.push(exam([`במעבר מ${stateHe(sol.pure.from)} ל${stateHe(sol.pure.to)} ${up ? 'נבלע' : 'נפלט'} חום, ולכן $\\Delta H^\\circ$ [[${up ? 'חיובי' : 'שלילי'}]]${sol.options && sol.pick != null ? `: [[${fx(sol.options[sol.pick])} kJ]]` : ''}.`]));
    return steps;
  }
  const ch = sol.changes[0];
  const lower = sol.verdict === 'lower';
  steps.push({
    stage: 1,
    title: 'מה שונה?',
    say: `ההבדל: ${fT2(ch.sp.f)} ${ch.sp.side === 'P' ? 'נוצר' : 'מגיב'} כ${stateHe(ch.to)}, לא כ${stateHe(ch.from)}`,
    uses: ['rxn', 'new'],
    recipe: 0,
    run: (c, t) => {
      c.math(t, `${reactionC(sol.rxn)}${sol.dH ? `\\quad ${DH} = ${fx(sol.dH)}${KJ}` : ''}`, 'calc');
      c.math(t, reactionC(sol.newRxn!), 'calc');
    },
  });
  steps.push({
    stage: 1,
    title: 'הכלל',
    say: `מעבר ${stateHe(ch.from)} ← ${stateHe(ch.to)}: ${STATE_RANK_HE(ch.from, ch.to) ? 'נבלע' : 'נפלט'} חום`,
    why: ch.sp.side === 'P' ? 'תוצר במצב צבירה נמוך יותר: נפלט עוד חום בסוף.' : 'מגיב במצב צבירה נמוך יותר: צריך קודם להשקיע חום כדי להעביר אותו.',
    recipe: 1,
    predict: { q: 'בתגובה השנייה נפלט…', options: ['יותר חום', 'פחות חום'], correct: lower ? 0 : 1 },
    run: (c, t) => {
      c.rule(t, T17, [STATE_RANK_HE(ch.from, ch.to) ? 0 : 1]);
      c.verdict(t, lower ? `בתגובה השנייה נפלט יותר חום ← $${DH}$ שלה נמוך יותר (שלילי יותר)` : `בתגובה השנייה נפלט פחות חום ← $${DH}$ שלה גבוה יותר`, 'ok');
      if (sol.options && sol.pick != null) c.line(t, `לכן מתאים: $${fx(sol.options[sol.pick])}${KJ}$ (${lower ? 'קטן' : 'גדול'} מ־$${fx(sol.dH!)}$)`, 'calc');
    },
  });
  steps.push(
    exam([
      `ההבדל בין התגובות: ${fT2(ch.sp.f)} כ${stateHe(ch.to)} במקום כ${stateHe(ch.from)}.`,
      `בתגובה השנייה נפלטת [[${lower ? 'יותר' : 'פחות'}]] אנרגיה, ולכן $${DH}$ שלה [[${lower ? 'קטן' : 'גדול'}]] יותר${sol.options && sol.pick != null ? `: [[${fx(sol.options[sol.pick])} kJ]]` : ''}.`,
    ]),
  );
  return steps;
}

const fT2 = (f: string) => `$${formulaTex(f)}$`;
/** true when going from `a` to `b` takes in heat (solid → liquid → gas) */
const STATE_RANK_HE = (a: string, b: string) => ({ s: 0, l: 1, aq: 1, g: 2 })[b]! > ({ s: 0, l: 1, aq: 1, g: 2 })[a]!;

// ---------------------------------------------------------------- T6: bond enthalpies

export function bondsLesson(sol: BondsSol, p: Problem): Step[] {
  const x = sol.x;
  const row = (r: BondsSol['broken'][number], color: string) => {
    const e = r.e == null || (x && r.bond === x.bond) ? 'x' : fx(r.e);
    const prod = r.prod == null || (x && r.bond === x.bond) ? `${fx(r.n)}x` : fx(r.prod);
    return `${col(color, formulaTex(r.sp.f))}:\\ ${fx(r.n)} \\times ${bondTex(r.bond)} = ${fx(r.n)} \\times ${e}${e === 'x' ? '' : ` = ${prod}`}`;
  };
  const sum = (rs: BondsSol['broken']) => {
    const known = rs.filter((r) => !(x && r.bond === x.bond));
    const k = known.reduce((a, r) => a.add(r.prod!), ZERO);
    const nx = rs.filter((r) => x && r.bond === x.bond).reduce((a, r) => a.add(r.n), ZERO);
    return nx.isZero() ? `\\Sigma = ${fx(k)}` : `\\Sigma = ${fx(k)} + ${fx(nx)}x`;
  };
  const steps: Step[] = [identify(p, sol, x ? 'נתון $\\Delta H^\\circ$ וחסרה אנרגיית קשר אחת ← מוצאים את x' : 'נתונות אנרגיות קשר ← שבירה פחות יצירה', 'שוברים את כל הקשרים במגיבים, ובונים את כל הקשרים בתוצרים.')];
  steps.push({
    stage: 1,
    title: 'נשברים',
    say: 'קשרים שנשברים: כל הקשרים במגיבים',
    why: 'שבירת קשר דורשת אנרגיה: הסכום נכנס עם (+).',
    uses: ['table', 'rxn', 'bonds'],
    recipe: 0,
    run: (c, t) => {
      c.cols(t, [{ title: 'נשברים (מגיבים)', cls: 'r', rows: sol.broken.map((r) => row(r, ORANGE)), sum: sum(sol.broken) }]);
    },
  });
  steps.push({
    stage: 1,
    title: 'נוצרים',
    say: 'קשרים שנוצרים: כל הקשרים בתוצרים',
    why: 'יצירת קשר משחררת אנרגיה: הסכום נכנס עם (−).',
    uses: ['table', 'bonds'],
    recipe: 1,
    run: (c, t) => {
      c.cols(t, [{ title: 'נוצרים (תוצרים)', cls: 'p', rows: sol.formed.map((r) => row(r, BLUE)), sum: sum(sol.formed) }]);
    },
  });
  if (!x) {
    steps.push({
      stage: 1,
      title: 'שבירה − יצירה',
      say: '$\\Delta H^\\circ$ = נשברים פחות נוצרים',
      recipe: 2,
      predict: { q: `נשברים: $${fx(sol.sumB!)}$, נוצרים: $${fx(sol.sumF!)}$. הסימן של $${DH}$…`, options: ['חיובי (+)', 'שלילי (−)'], correct: sol.dH.sign() > 0 ? 0 : 1 },
      run: (c, t) => {
        c.rule(t, ['שבירת קשרים ← צריך אנרגיה (+)', 'יצירת קשרים ← משחררת אנרגיה (−)'], [0, 1]);
        c.eqs(t, DH, [`= \\Sigma_{\\text{נשברים}} - \\Sigma_{\\text{נוצרים}}`, `= ${fx(sol.sumB!)} - ${fx(sol.sumF!)}`, `= ${fx(sol.dH)}${KJ}`], 'ans');
        c.rule(t, T1_ROWS, [sol.dH.sign() < 0 ? 0 : 1]);
      },
    });
    steps.push(
      trap('מלכודת', 'מלכודת: נוצרים פחות נשברים', 'הסדר הפוך מנוסחת אנתלפיות ההתהוות: כאן מתחילים מהמגיבים.', (c, t) => {
        c.math(t, `${fx(sol.sumF!)} - ${fx(sol.sumB!)} = ${fx(sol.dH.neg())}${KJ}`, 'bad');
        c.verdict(t, 'הסימן הפוך. זו טעות!', 'bad');
      }),
    );
    steps.push(exam([`$${DH} = \\Sigma_{\\text{נשברים}} - \\Sigma_{\\text{נוצרים}} = ${fx(sol.sumB!)} - ${fx(sol.sumF!)} = ${fx(sol.dH)}${KJ}$`, `$${DH}$ [[${sol.dH.sign() < 0 ? 'שלילי' : 'חיובי'}]] ← התגובה [[${sol.dH.sign() < 0 ? 'אקסותרמית' : 'אנדותרמית'}]].`]));
    return steps;
  }
  const kB = fx(x.knownB);
  const kF = fx(x.knownF);
  const nB = x.nB.isZero() ? '' : ` + ${fx(x.nB)}x`;
  const nF = x.nF.isZero() ? '' : ` + ${fx(x.nF)}x`;
  const net = x.nB.sub(x.nF);
  const eq1 = `${fx(sol.dH)} = (${kB}${nB}) - (${kF}${nF})`;
  const eq2 = `${fx(net)}x = ${fx(sol.dH)} - ${kB} + ${kF} = ${fx(x.v.mul(net))}`;
  steps.push({
    stage: 1,
    title: 'פותרים את x',
    say: `$${DH}$ = נשברים פחות נוצרים, ומוצאים את x`,
    uses: ['dH'],
    recipe: 2,
    run: (c, t) => {
      c.math(t, eq1, 'calc');
      c.math(t, eq2, 'calc');
      c.math(t, `x = ${bondTex(x.bond)} ${rel(x.v)} ${fx(x.v, { sig: 5 })}\\,\\mathrm{kJ/mol}`, 'ans');
    },
  });
  steps.push(exam([`$${DH} = \\Sigma_{\\text{נשברים}} - \\Sigma_{\\text{נוצרים}}$`, `$${eq1}$`, `$${eq2}$`, `$${bondTex(x.bond)} ${rel(x.v)} ${fx(x.v, { sig: 5 })}\\,\\mathrm{kJ/mol}$`]));
  return steps;
}

// ---------------------------------------------------------------- T8: the energy diagram

export function diagramLesson(sol: DiagramSol, p: Problem): Step[] {
  const n = (f: Frac) => f.toNumber();
  const kj = (f: Frac) => `${fx(f)} kJ`;
  const exo = sol.dH.sign() < 0;
  const steps: Step[] = [identify(p, sol, 'נתונות אנרגיות המגיבים, התוצרים והשיא ← מחסירים', 'כל גודל בדיאגרמה הוא הפרש בין שני גבהים.')];
  steps.push({
    stage: 1,
    title: 'הדיאגרמה',
    say: 'מציירים: מגיבים, שיא, תוצרים',
    uses: ['E'],
    run: (c, t) => {
      c.levels(t, { R: n(sol.R), P: n(sol.P), peak: n(sol.peak), lR: `מגיבים ${kj(sol.R)}`, lP: `תוצרים ${kj(sol.P)}`, lPeak: `שיא ${kj(sol.peak)}` });
    },
  });
  steps.push({
    stage: 1,
    title: `$${DH}$`,
    say: `$${DH}$ = תוצרים פחות מגיבים`,
    uses: ['E'],
    recipe: 0,
    predict: { q: 'התוצרים נמוכים מהמגיבים?', options: ['כן ← אקסותרמית', 'לא ← אנדותרמית'], correct: exo ? 0 : 1 },
    run: (c, t) => {
      c.levels(t, { R: n(sol.R), P: n(sol.P), peak: n(sol.peak), lR: `מגיבים ${kj(sol.R)}`, lP: `תוצרים ${kj(sol.P)}`, lPeak: `שיא ${kj(sol.peak)}`, dH: `ΔH = ${kj(sol.dH)}` });
      c.math(t, `${DH} = E_{\\text{תוצרים}} - E_{\\text{מגיבים}} = ${fx(sol.P)} - ${fx(sol.R)} = ${fx(sol.dH)}${KJ}`, 'ans');
      c.rule(t, T1_ROWS, [exo ? 0 : 1]);
    },
  });
  steps.push({
    stage: 1,
    title: '$E_a$',
    say: 'אנרגיית שפעול: מהמגיבים (או מהתוצרים) עד השיא',
    why: '$E_a$ קדימה מתחילה במגיבים; $E_a$ אחורה מתחילה בתוצרים.',
    uses: ['E'],
    recipe: 1,
    run: (c, t) => {
      c.levels(t, { R: n(sol.R), P: n(sol.P), peak: n(sol.peak), lR: `מגיבים ${kj(sol.R)}`, lP: `תוצרים ${kj(sol.P)}`, lPeak: `שיא ${kj(sol.peak)}`, ea: `Ea = ${kj(sol.eaF)}`, eaRev: `Ea אחורה = ${kj(sol.eaR)}` });
      c.math(t, `E_a(\\text{קדימה}) = ${fx(sol.peak)} - ${fx(sol.R)} = ${fx(sol.eaF)}${KJ}`, 'calc');
      c.math(t, `E_a(\\text{אחורה}) = ${fx(sol.peak)} - ${fx(sol.P)} = ${fx(sol.eaR)}${KJ}`, 'calc');
    },
  });
  if (sol.cat != null)
    steps.push({
      stage: 1,
      title: 'זרז',
      say: 'עם זרז: השיא נמוך יותר',
      why: 'זרז מוריד את שתי אנרגיות השפעול. המגיבים והתוצרים לא זזים, ולכן $\\Delta H^\\circ$ לא משתנה.',
      uses: ['E'],
      recipe: 2,
      predict: { q: `עם זרז, $${DH}$…`, options: ['קטן', 'גדל', 'לא משתנה'], correct: 2 },
      run: (c, t) => {
        c.levels(t, { R: n(sol.R), P: n(sol.P), peak: n(sol.peak), cat: n(sol.cat!), lR: `מגיבים ${kj(sol.R)}`, lP: `תוצרים ${kj(sol.P)}`, lPeak: `שיא ${kj(sol.peak)}`, lCat: `עם זרז ${kj(sol.cat!)}`, eaCat: `Ea = ${kj(sol.eaFc!)}` });
        c.math(t, `E_a(\\text{קדימה, זרז}) = ${fx(sol.cat!)} - ${fx(sol.R)} = ${fx(sol.eaFc!)}${KJ}`, 'calc');
        c.math(t, `E_a(\\text{אחורה, זרז}) = ${fx(sol.cat!)} - ${fx(sol.P)} = ${fx(sol.eaRc!)}${KJ}`, 'calc');
        c.rule(t, ['זרז ← $E_a$ קטנה', 'זרז ← $\\Delta H^\\circ$ לא משתנה'], [0, 1]);
      },
    });
  steps.push(
    trap('מלכודת', 'מלכודת: $E_a$ אחורה מהמגיבים', '$E_a$ אחורה מתחילה בתוצרים, כי שם מתחילה התגובה ההפוכה.', (c, t) => {
      c.math(t, `E_a(\\text{אחורה}) = ${fx(sol.peak)} - ${fx(sol.R)} = ${fx(sol.eaF)}${KJ}`, 'bad');
      c.verdict(t, `זו $E_a$ קדימה, לא אחורה. זו טעות!`, 'bad');
    }),
  );
  steps.push(
    exam([
      `$${DH} = ${fx(sol.P)} - ${fx(sol.R)} = ${fx(sol.dH)}${KJ}$ ← [[${exo ? 'אקסותרמית' : 'אנדותרמית'}]]`,
      `$E_a(\\text{קדימה}) = ${fx(sol.peak)} - ${fx(sol.R)} = ${fx(sol.eaF)}${KJ}$`,
      `$E_a(\\text{אחורה}) = ${fx(sol.peak)} - ${fx(sol.P)} = ${fx(sol.eaR)}${KJ}$`,
      sol.cat != null ? `עם זרז: $E_a = ${fx(sol.eaFc!)}${KJ}$ (קדימה), $${fx(sol.eaRc!)}${KJ}$ (אחורה); $${DH}$ [[לא משתנה]].` : '',
    ]),
  );
  return steps;
}

export { F };
