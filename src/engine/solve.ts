// One pure solver per question type. Rules are only the ones in BRIEF §5; every number is an exact Frac.

import { Frac, F, ZERO } from './frac';
import { exactDecimal, type FmtOpts } from './format';
import { InputError, spKey, type Problem, type Reaction, type Species, type Temp, type Sign, type SignKey, type BondUse, type Change, type Claim } from './parse';
import { gasMoles, isGas, isStdElement, STATE_RANK } from './chem';

export interface Recog {
  type: string; // Hebrew chip
}

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
const maxPlaces = (xs: (Frac | null | undefined)[]) => Math.max(0, ...xs.filter((x): x is Frac => !!x).map(places));

const DSv = (who: string) => `$\\Delta S^\\circ_{\\text{${who}}}$`;

// ---------------------------------------------------------------- products − reactants (T7, T13)

export interface PRTerm {
  sp: Species;
  v: Frac | null; // the value per mol; null = the unknown x
  zero?: boolean; // an element in its standard state (T7)
  prod: Frac | null; // coefficient × value
}
export interface PR {
  P: PRTerm[];
  R: PRTerm[];
  sumP: Frac | null; // null when the unknown is on that side
  sumR: Frac | null;
  total: Frac;
  /** the unknown, when one value was x and the total was given */
  x?: { sp: Species; v: Frac; knownP: Frac; knownR: Frac };
}

function productsMinusReactants(rxn: Reaction, get: (sp: Species) => { v: Frac | null; zero?: boolean }, target?: Frac): PR {
  const term = (sp: Species): PRTerm => {
    const g = get(sp);
    return { sp, v: g.v, zero: g.zero, prod: g.v == null ? null : sp.coef.mul(g.v) };
  };
  const P = rxn.P.map(term);
  const R = rxn.R.map(term);
  const unknown = [...P, ...R].filter((t) => t.v == null);
  const known = (ts: PRTerm[]) => ts.reduce((a, t) => (t.prod ? a.add(t.prod) : a), ZERO);
  if (!unknown.length) {
    const sumP = known(P);
    const sumR = known(R);
    return { P, R, sumP, sumR, total: sumP.sub(sumR) };
  }
  if (unknown.length > 1) throw new InputError('יותר מנעלם אחד: אפשר למצוא רק ערך חסר אחד');
  if (target == null) throw new InputError('יש ערך חסר (x), אבל חסר הערך הכולל כדי למצוא אותו');
  const u = unknown[0];
  const knownP = known(P);
  const knownR = known(R);
  // target = (knownP + [c·x if product]) − (knownR + [c·x if reactant])
  const v = u.sp.side === 'P' ? target.sub(knownP).add(knownR).div(u.sp.coef) : knownP.sub(knownR).sub(target).div(u.sp.coef);
  u.v = v;
  u.prod = u.sp.coef.mul(v);
  return { P, R, sumP: known(P), sumR: known(R), total: target, x: { sp: u.sp, v, knownP, knownR } };
}

function needRxn(p: Problem, ex: string): Reaction {
  if (!p.rxn) throw new InputError('חסרה התגובה', ex);
  return p.rxn;
}

/** T13: ΔS° of the system from S° values (one may be x when ΔS° is given) */
function entropyPR(p: Problem, target?: Frac): PR {
  const rxn = needRxn(p, 'rxn: N2(g) + 3H2(g) -> 2NH3(g)\nS N2(g) = 191.6\n...');
  return productsMinusReactants(
    rxn,
    (sp) => {
      const k = spKey(sp);
      if (!p.S0?.has(k)) throw new InputError(`חסר $S^\\circ$ של ${sp.f}(${sp.state ?? ''}). ל־$S^\\circ$ של יסוד יש ערך (הוא לא 0).`, `S ${k} = …`);
      return { v: p.S0.get(k)! };
    },
    target,
  );
}

/** T7: ΔH° from ΔH°f values; an element in its standard state is 0 (one may be x when ΔH° is given) */
function formationPR(p: Problem, target?: Frac): PR {
  const rxn = needRxn(p, 'rxn: CH4(g) + 2O2(g) -> CO2(g) + 2H2O(l)\ndHf CH4(g) = -74.8\n...');
  return productsMinusReactants(
    rxn,
    (sp) => {
      const k = spKey(sp);
      if (p.dHfUnknown === k) return { v: null };
      if (p.dHf?.has(k)) return { v: p.dHf.get(k)! };
      if (isStdElement(sp)) return { v: ZERO, zero: true };
      throw new InputError(`חסר $\\Delta H^\\circ_f$ של ${sp.f}(${sp.state ?? ''})`, `dHf ${k} = …`);
    },
    target,
  );
}

const dHkJ = (p: Problem) => (p.dH ? (p.dH.unit === 'kJ' ? p.dH.v : p.dH.v.div(1000)) : undefined);

// ---------------------------------------------------------------- T13 / T7 as questions

export interface PRSol {
  type: 'dS' | 'S-unknown' | 'dH-formation' | 'dHf-unknown';
  recog: Recog;
  rxn: Reaction;
  pr: PR;
  opts: FmtOpts;
}

function dSsol(p: Problem): PRSol {
  const pr = entropyPR(p);
  return { type: 'dS', recog: { type: `${DSv('מערכת')} מ־$S^\\circ$` }, rxn: p.rxn!, pr, opts: {} };
}
function sUnknown(p: Problem): PRSol {
  if (p.dSsys == null) throw new InputError('חסר $\\Delta S^\\circ$ של התגובה כדי למצוא את $S^\\circ$ החסר', 'dS = 447 J/K');
  const pr = entropyPR(p, p.dSsys);
  if (!pr.x) throw new InputError('אין ערך חסר: סמנו אותו ב־x, למשל S N2(g) = x');
  return { type: 'S-unknown', recog: { type: '$S^\\circ$ חסר ← מ־$\\Delta S^\\circ$' }, rxn: p.rxn!, pr, opts: { decimals: Math.max(1, maxPlaces([...p.S0!.values(), p.dSsys])) } };
}
function dHf(p: Problem): PRSol {
  const pr = formationPR(p);
  return { type: 'dH-formation', recog: { type: '$\\Delta H^\\circ$ מאנתלפיות התהוות' }, rxn: p.rxn!, pr, opts: {} };
}
function dHfUnknown(p: Problem): PRSol {
  const dH = dHkJ(p);
  if (dH == null) throw new InputError('חסר $\\Delta H^\\circ$ של התגובה כדי למצוא את $\\Delta H^\\circ_f$ החסר', 'dH = -6173 kJ');
  const pr = formationPR(p, dH);
  if (!pr.x) throw new InputError('אין ערך חסר: סמנו אותו ב־x, למשל dHf C10H16(l) = x');
  return { type: 'dHf-unknown', recog: { type: '$\\Delta H^\\circ_f$ חסר ← מ־$\\Delta H^\\circ$' }, rxn: p.rxn!, pr, opts: { decimals: Math.max(1, maxPlaces([...(p.dHf?.values() ?? []), dH])) } };
}

// ---------------------------------------------------------------- T14 + T15: spontaneous?

export interface SpontSol {
  type: 'spontaneous';
  recog: Recog;
  rxn?: Reaction;
  dH: { v: Frac; unit: 'kJ' | 'J' };
  dHfrom?: PR; // ΔH° worked out from ΔH°f first
  dHJ: Frac; // ΔH° in J
  T: Temp;
  TC?: Frac; // the °C value when the question gives °C (room = 25)
  TK: Frac;
  dSsys: Frac;
  dSfrom?: PR; // ΔS° worked out from S° first
  dSsurr: Frac;
  dStot: Frac;
  spont: boolean;
  /** "surroundings only": the question asks for ΔS°surr and nothing after it */
  surrOnly: boolean;
  opts: FmtOpts;
}

const EX_SPONT = 'dH = -92 kJ\ndS = -199 J/K\nT = 298 K\nask: spontaneous';

function spontaneous(p: Problem): SpontSol {
  let dHfrom: PR | undefined;
  let dH = p.dH;
  if (!dH && p.dHf) {
    dHfrom = formationPR(p);
    dH = { v: dHfrom.total, unit: 'kJ' };
  }
  if (!dH) throw new InputError('חסר $\\Delta H^\\circ$ (או טבלת $\\Delta H^\\circ_f$)', EX_SPONT);
  let dSfrom: PR | undefined;
  let dSsys = p.dSsys;
  if (dSsys == null && p.S0) {
    dSfrom = entropyPR(p);
    dSsys = dSfrom.total;
  }
  if (!p.T) throw new InputError('חסרה טמפרטורה', EX_SPONT);
  const surrOnly = dSsys == null;
  const dHJ = dH.unit === 'kJ' ? dH.v.mul(1000) : dH.v;
  const { TC, TK } = toKelvin(p.T);
  const dSsurr = dHJ.neg().div(TK); // T14
  const dStot = surrOnly ? ZERO : dSsys!.add(dSsurr); // T15
  if (!surrOnly && dStot.isZero()) throw new InputError(`${DSv('יקום')} = 0: המקרה הזה לא נדרש בחומר`);
  return {
    type: 'spontaneous',
    recog: { type: surrOnly ? `${DSv('סביבה')} מ־$\\Delta H^\\circ$` : `ספונטני? ← ${DSv('יקום')}` },
    rxn: p.rxn,
    dH,
    dHfrom,
    dHJ,
    T: p.T,
    TC,
    TK,
    dSsys: dSsys ?? ZERO,
    dSfrom,
    dSsurr,
    dStot,
    spont: dStot.sign() > 0,
    surrOnly,
    // J/K values are shown with 1 decimal (or as many as the given ΔS° has), unless the question asks otherwise
    opts: { decimals: p.decimals ?? Math.max(1, dSsys != null ? places(dSsys) : 0) },
  };
}

// ---------------------------------------------------------------- back from ΔS°universe or ΔS°surroundings (T14, T15)

export interface BackSol {
  type: 'back';
  recog: Recog;
  rxn?: Reaction;
  /** which way: ΔH° from ΔS°surr (given, or tot − sys); or ΔS°sys from tot − surr(ΔH°) */
  find: 'dH' | 'dSsys';
  T: Temp;
  TC?: Frac;
  TK: Frac;
  dStot?: Frac;
  dSsys?: Frac;
  dSfrom?: PR;
  dSsurr: Frac;
  surrGiven: boolean;
  dHJ: Frac;
  dH: Frac; // kJ
  opts: FmtOpts;
}

function back(p: Problem): BackSol {
  if (!p.T) throw new InputError('חסרה טמפרטורה', 'T = 298 K');
  const { TC, TK } = toKelvin(p.T);
  let dSsys = p.dSsys;
  let dSfrom: PR | undefined;
  if (dSsys == null && p.S0 && p.dStot != null && !p.dH) {
    dSfrom = entropyPR(p);
    dSsys = dSfrom.total;
  }
  const dec = p.decimals ?? Math.max(1, maxPlaces([p.dStot, dSsys, p.dSsurr]));
  const base = { type: 'back' as const, rxn: p.rxn, T: p.T, TC, TK, dStot: p.dStot, dSfrom, opts: { decimals: dec } };
  if (p.dSsurr != null) {
    const dHJ = p.dSsurr.neg().mul(TK); // T14 backwards
    return { ...base, recog: { type: `$\\Delta H^\\circ$ ← מ־${DSv('סביבה')}` }, find: 'dH', dSsys, dSsurr: p.dSsurr, surrGiven: true, dHJ, dH: dHJ.div(1000) };
  }
  if (p.dStot == null) throw new InputError(`חסר ${DSv('יקום')} (או ${DSv('סביבה')})`, 'dS total = 10.4 J/K');
  if (dSsys != null) {
    const dSsurr = p.dStot.sub(dSsys); // T15 backwards
    const dHJ = dSsurr.neg().mul(TK); // T14 backwards
    return { ...base, recog: { type: `$\\Delta H^\\circ$ ← מ־${DSv('יקום')}` }, find: 'dH', dSsys, dSsurr, surrGiven: false, dHJ, dH: dHJ.div(1000) };
  }
  const dH = dHkJ(p);
  if (dH == null) throw new InputError(`חסר ${DSv('מערכת')} או $\\Delta H^\\circ$`, 'dS = 176.8 J/K');
  const dHJ = dH.mul(1000);
  const dSsurr = dHJ.neg().div(TK);
  return { ...base, recog: { type: `${DSv('מערכת')} ← מ־${DSv('יקום')}` }, find: 'dSsys', dSsys: p.dStot.sub(dSsurr), dSsurr, surrGiven: false, dHJ, dH };
}

// ---------------------------------------------------------------- signs without numbers (T1, T14, T15)

export interface SignStep {
  rule: 'T9' | 'T14' | 'T15';
  from: SignKey[];
  gives: SignKey;
  sign: Sign;
  /** T9: the moles of gas on each side */
  gas?: { R: Frac; P: Frac };
}
export interface SignsSol {
  type: 'signs';
  recog: Recog;
  rxn?: Reaction;
  given: Partial<Record<SignKey, Sign>>;
  known: Partial<Record<SignKey, Sign>>;
  steps: SignStep[];
  find: SignKey | 'spont' | 'compare' | 'any-T';
  /** the answer */
  answer: { kind: 'sign'; key: SignKey; sign: Sign } | { kind: 'spont'; spont: boolean } | { kind: 'compare'; bigger: 'dSsurr' | 'dSsys' } | { kind: 'any-T'; always: boolean } | { kind: 'cannot' };
  opts: FmtOpts;
}

function signs(p: Problem): SignsSol {
  const given = { ...(p.sign ?? {}) };
  const fromNum = (k: SignKey, v: Frac | undefined) => {
    if (v != null && given[k] == null && !v.isZero()) given[k] = v.sign() as Sign;
  };
  fromNum('dH', p.dH?.v);
  fromNum('dSsys', p.dSsys);
  fromNum('dSsurr', p.dSsurr);
  fromNum('dStot', p.dStot);
  const find = (p.find ?? 'spont') as SignsSol['find'];

  const infer = (start: Partial<Record<SignKey, Sign>>, first: SignStep[]) => {
    const known = { ...start };
    const steps = [...first];
    for (let changed = true; changed; ) {
      changed = false;
      const add = (s: SignStep) => {
        if (known[s.gives] != null) return;
        known[s.gives] = s.sign;
        steps.push(s);
        changed = true;
      };
      if (known.dH != null) add({ rule: 'T14', from: ['dH'], gives: 'dSsurr', sign: -known.dH as Sign });
      if (known.dSsurr != null) add({ rule: 'T14', from: ['dSsurr'], gives: 'dH', sign: -known.dSsurr as Sign });
      const { dSsys: a, dSsurr: b, dStot: t } = known;
      if (a != null && b != null && a === b) add({ rule: 'T15', from: ['dSsys', 'dSsurr'], gives: 'dStot', sign: a });
      if (t != null && a != null && a !== t) add({ rule: 'T15', from: ['dStot', 'dSsys'], gives: 'dSsurr', sign: t });
      if (t != null && b != null && b !== t) add({ rule: 'T15', from: ['dStot', 'dSsurr'], gives: 'dSsys', sign: t });
    }
    let answer: SignsSol['answer'] = { kind: 'cannot' };
    if (find === 'spont') answer = known.dStot != null ? { kind: 'spont', spont: known.dStot > 0 } : { kind: 'cannot' };
    else if (find === 'compare') {
      const { dSsys: a, dSsurr: b, dStot: t } = known;
      if (a != null && b != null && t != null && a !== b) answer = { kind: 'compare', bigger: b === t ? 'dSsurr' : 'dSsys' };
    } else if (find === 'any-T') {
      // ΔS°surr has the sign of −ΔH° at every temperature (T14); if it agrees with ΔS°sys, ΔS°tot has that sign at every T
      const { dSsys: a, dSsurr: b } = known;
      if (a != null && b != null && a === b) answer = { kind: 'any-T', always: a > 0 };
    } else if (known[find] != null) answer = { kind: 'sign', key: find, sign: known[find]! };
    return { known, steps, answer };
  };

  let r = infer(given, []);
  // not enough: the sign of ΔS°sys from the equation (T9), when the moles of gas change
  if (r.answer.kind === 'cannot' && given.dSsys == null && p.rxn && p.rxn.all.every((s) => s.state)) {
    const gR = gasMoles(p.rxn.R);
    const gP = gasMoles(p.rxn.P);
    const c = gP.cmp(gR);
    if (c !== 0) r = infer({ ...given, dSsys: c as Sign }, [{ rule: 'T9', from: [], gives: 'dSsys', sign: c as Sign, gas: { R: gR, P: gP } }]);
  }
  if (r.answer.kind === 'cannot') throw new InputError('אי אפשר לקבוע מהסימנים הנתונים (המקרה תלוי במספרים)');
  return { type: 'signs', recog: { type: 'סימנים בלי חישוב' }, rxn: p.rxn, given, known: r.known, steps: r.steps, find, answer: r.answer, opts: {} };
}

// ---------------------------------------------------------------- spontaneous but not happening (T16, T8)

export interface KineticSol {
  type: 'kinetic';
  recog: Recog;
  rxn?: Reaction;
  spont: boolean;
  find: 'why' | 'catalyst';
  opts: FmtOpts;
}

function kinetic(p: Problem): KineticSol {
  const t = p.sign?.dStot ?? (p.dStot ? (p.dStot.sign() as Sign) : undefined);
  if (t == null) throw new InputError(`חסר הסימן של ${DSv('יקום')}`, 'sign dS total > 0');
  const find = p.find === 'catalyst' ? 'catalyst' : 'why';
  if (find === 'why' && (t < 0 || p.observed !== 'none')) throw new InputError('השאלה "למה לא קורה" מתאימה לתגובה ספונטנית שלא נצפית', 'sign dS total > 0\nobserved: no reaction');
  return { type: 'kinetic', recog: { type: 'ספונטני, אבל לא קורה' }, rxn: p.rxn, spont: t > 0, find, opts: {} };
}

// ---------------------------------------------------------------- T9: the sign of ΔS°

export interface DSignSol {
  type: 'dS-sign';
  recog: Recog;
  rxn: Reaction;
  gasR: Frac;
  gasP: Frac;
  /** which case of T9 */
  case: 'gas' | 'phase' | 'none';
  phase?: { f: string; from: string; to: string };
  sign: -1 | 0 | 1; // 0 = can't tell from the equation (small change)
  opts: FmtOpts;
}

function dSsign(p: Problem): DSignSol {
  const rxn = needRxn(p, 'rxn: CaCO3(s) -> CaO(s) + CO2(g)');
  if (rxn.all.some((s) => !s.state)) throw new InputError('צריך מצב צבירה לכל חומר: (s), (l), (g)', 'rxn: CaCO3(s) -> CaO(s) + CO2(g)');
  const gasR = gasMoles(rxn.R);
  const gasP = gasMoles(rxn.P);
  const base = { type: 'dS-sign' as const, recog: { type: `הסימן של ${DSv('מערכת')}` }, rxn, gasR, gasP, opts: {} };
  const c = gasP.cmp(gasR);
  if (c !== 0) return { ...base, case: 'gas', sign: c };
  // no change in gas moles: a single substance changing state (solid → liquid → gas), with no gas on either side
  if (!rxn.all.some(isGas) && rxn.R.length === 1 && rxn.P.length === 1 && rxn.R[0].f === rxn.P[0].f && rxn.R[0].state !== rxn.P[0].state) {
    const a = STATE_RANK[rxn.R[0].state!];
    const b = STATE_RANK[rxn.P[0].state!];
    return { ...base, case: 'phase', phase: { f: rxn.R[0].f, from: rxn.R[0].state!, to: rxn.P[0].state! }, sign: b > a ? 1 : -1 };
  }
  return { ...base, case: 'none', sign: 0 };
}

// ---------------------------------------------------------------- T3: heat for an amount, and back

export interface HeatSol {
  type: 'heat' | 'mass-for-heat' | 'dH-from-q';
  recog: Recog;
  rxn: Reaction;
  sp: Species; // the substance the amount is about
  m?: Frac;
  M?: Frac;
  n: Frac;
  nFromMass: boolean;
  dH: Frac; // kJ, as written (for dH-from-q: the answer)
  q: Frac; // kJ (for heat: the answer)
  released: boolean;
  opts: FmtOpts;
}

function amountSpecies(p: Problem, rxn: Reaction): Species {
  const keys = new Set([...(p.m?.keys() ?? []), ...(p.n?.keys() ?? []), ...(p.M?.keys() ?? [])]);
  const sps = rxn.all.filter((s) => keys.has(s.f));
  if (sps.length !== 1) throw new InputError('צריך נתון כמות (m, M או n) לחומר אחד מהתגובה', 'm CH4 = 8.0 g\nM CH4 = 16 g/mol');
  return sps[0];
}

function heat(p: Problem): HeatSol {
  const rxn = needRxn(p, 'rxn: CH4(g) + 2O2(g) -> CO2(g) + 2H2O(l)');
  const dH = dHkJ(p);
  if (dH == null) throw new InputError('חסר $\\Delta H^\\circ$', 'dH = -890 kJ');
  const sp = amountSpecies(p, rxn);
  const m = p.m?.get(sp.f);
  const M = p.M?.get(sp.f);
  let n = p.n?.get(sp.f);
  const nFromMass = n == null;
  if (n == null) {
    if (!m || !M) throw new InputError(`חסרים m ו־M של ${sp.f} (או n)`, `m ${sp.f} = 8.0 g\nM ${sp.f} = 16 g/mol`);
    n = m.div(M);
  }
  const q = n.div(sp.coef).mul(dH.abs()); // T3
  return { type: 'heat', recog: { type: 'כמה חום? ← כמות חומר' }, rxn, sp, m, M, n, nFromMass, dH, q, released: dH.sign() < 0, opts: {} };
}

function massForHeat(p: Problem): HeatSol {
  const rxn = needRxn(p, 'rxn: CH4(g) + 2O2(g) -> CO2(g) + 2H2O(l)');
  const dH = dHkJ(p);
  if (dH == null) throw new InputError('חסר $\\Delta H^\\circ$', 'dH = -890 kJ');
  if (!p.q) throw new InputError('חסרה כמות החום', 'q = 1335 kJ');
  const sp = amountSpecies(p, rxn);
  const M = p.M?.get(sp.f);
  if (!M) throw new InputError(`חסרה המסה המולרית של ${sp.f}`, `M ${sp.f} = 16 g/mol`);
  const n = p.q.div(dH.abs()).mul(sp.coef); // T3 backwards
  return { type: 'mass-for-heat', recog: { type: 'כמה חומר? ← כמות חום' }, rxn, sp, M, n, m: n.mul(M), nFromMass: false, dH, q: p.q, released: dH.sign() < 0, opts: {} };
}

function dHfromQ(p: Problem): HeatSol {
  const rxn = needRxn(p, 'rxn: C25H52(g) + 38O2(g) -> 25CO2(g) + 26H2O(g)');
  if (!p.q || !p.qDir) throw new InputError('חסרה כמות החום, ואם היא נפלטה או נבלעה', 'q = 77.825 kJ released');
  const sp = amountSpecies(p, rxn);
  const m = p.m?.get(sp.f);
  const M = p.M?.get(sp.f);
  let n = p.n?.get(sp.f);
  const nFromMass = n == null;
  if (n == null) {
    if (!m || !M) throw new InputError(`חסרים m ו־M של ${sp.f} (או n)`, `m ${sp.f} = 1.76 g\nM ${sp.f} = 352 g/mol`);
    n = m.div(M);
  }
  const released = p.qDir === 'released';
  const dH = p.q.div(n).mul(sp.coef).mul(released ? -1 : 1); // T3 backwards + T1 for the sign
  return { type: 'dH-from-q', recog: { type: '$\\Delta H^\\circ$ ← מכמות חום' }, rxn, sp, m, M, n, nFromMass, dH, q: p.q, released, opts: {} };
}

// ---------------------------------------------------------------- T2: the same reaction reversed / multiplied

export interface DHNewSol {
  type: 'dH-new';
  recog: Recog;
  rxn: Reaction;
  newRxn: Reaction;
  dH: Frac;
  reversed: boolean;
  k: Frac;
  dHnew: Frac;
  opts: FmtOpts;
}

function dHnew(p: Problem): DHNewSol {
  const rxn = needRxn(p, 'rxn: N2(g) + 3H2(g) -> 2NH3(g)');
  const dH = dHkJ(p);
  if (dH == null) throw new InputError('חסר $\\Delta H^\\circ$', 'dH = -92 kJ');
  if (!p.newRxn) throw new InputError('חסרה התגובה החדשה', 'new: 2NH3(g) -> N2(g) + 3H2(g)');
  const nr = p.newRxn;
  const match = (a: Species[], b: Species[]) => {
    if (a.length !== b.length) return null;
    let k: Frac | null = null;
    for (const s of a) {
      const t = b.find((x) => spKey(x) === spKey(s));
      if (!t) return null;
      const r = t.coef.div(s.coef);
      if (k && !k.eq(r)) return null;
      k = r;
    }
    return k;
  };
  const fwd = match(rxn.R, nr.R);
  const fwdP = match(rxn.P, nr.P);
  const rev = match(rxn.R, nr.P);
  const revP = match(rxn.P, nr.R);
  let k: Frac;
  let reversed: boolean;
  if (fwd && fwdP && fwd.eq(fwdP)) [k, reversed] = [fwd, false];
  else if (rev && revP && rev.eq(revP)) [k, reversed] = [rev, true];
  else throw new InputError('התגובה החדשה היא לא אותה תגובה (הפוכה או כפולה במספר)');
  if (!reversed && k.eq(1)) throw new InputError('זו אותה תגובה בדיוק');
  return { type: 'dH-new', recog: { type: 'תגובה הפוכה / כפולה ← $\\Delta H^\\circ$' }, rxn, newRxn: nr, dH, reversed, k, dHnew: dH.mul(k).mul(reversed ? -1 : 1), opts: {} };
}

// ---------------------------------------------------------------- T17: a substance in another state

export interface PhaseChange {
  sp: Species; // as in the second reaction
  from: string; // its state in the first reaction
  to: string;
}
export interface PhaseSol {
  type: 'phase-compare';
  recog: Recog;
  rxn: Reaction;
  newRxn?: Reaction;
  dH?: Frac; // kJ, of rxn
  /** a pure change of state (no second reaction): its ΔH° sign by T17 */
  pure?: { f: string; from: string; to: string; sign: Sign };
  changes: PhaseChange[];
  /** ΔH° of the new reaction compared with the first: 'lower' = more negative = gives out more heat */
  verdict?: 'lower' | 'higher';
  options?: Frac[];
  pick?: number; // index of the option that fits
  opts: FmtOpts;
}

function phase(p: Problem): PhaseSol {
  const rxn = needRxn(p, 'rxn: H2(g) + 1/2O2(g) -> H2O(g)');
  const dH = dHkJ(p);
  const base = { type: 'phase-compare' as const, recog: { type: 'מצב צבירה אחר ← $\\Delta H^\\circ$' }, rxn, dH, options: p.options, opts: {} };
  if (!p.newRxn) {
    // a single substance changing state: melting / boiling take in heat, freezing / condensing give it out
    if (rxn.R.length !== 1 || rxn.P.length !== 1 || rxn.R[0].f !== rxn.P[0].f || rxn.R[0].state === rxn.P[0].state || !rxn.R[0].state || !rxn.P[0].state)
      throw new InputError('חסרה תגובה שנייה להשוואה (new: …), או שזו לא החלפת מצב צבירה של חומר אחד');
    const sign: Sign = STATE_RANK[rxn.P[0].state!] > STATE_RANK[rxn.R[0].state!] ? 1 : -1;
    let pick: number | undefined;
    if (p.options) {
      const fit = p.options.map((o, i) => [o, i] as const).filter(([o]) => o.sign() === sign);
      if (fit.length !== 1) throw new InputError('צריך בדיוק ערך אחד שמתאים לסימן');
      pick = fit[0][1];
    }
    return { ...base, pure: { f: rxn.R[0].f, from: rxn.R[0].state!, to: rxn.P[0].state!, sign }, changes: [], pick };
  }
  const nr = p.newRxn;
  const changes: PhaseChange[] = [];
  let lower = 0;
  let higher = 0;
  for (const s of nr.all) {
    const same = (s.side === 'R' ? rxn.R : rxn.P).find((x) => x.f === s.f && x.coef.eq(s.coef));
    if (!same) throw new InputError(`בתגובה השנייה ${s.f} לא מופיע באותו מקום ובאותו מקדם`);
    if (same.state === s.state) continue;
    changes.push({ sp: s, from: same.state!, to: s.state! });
    const down = STATE_RANK[s.state!] < STATE_RANK[same.state!]; // e.g. a product as liquid instead of gas
    // product lower → extra heat given out (lower ΔH); reactant lower → extra heat needed first (higher ΔH)
    if ((s.side === 'P') === down) lower++;
    else higher++;
  }
  if (!changes.length) throw new InputError('אין הבדל במצבי הצבירה בין שתי התגובות');
  if (lower && higher) throw new InputError('השינויים פועלים לשני הכיוונים; אי אפשר לקבוע בלי מספרים');
  const verdict = lower ? 'lower' : 'higher';
  let pick: number | undefined;
  if (p.options) {
    if (!dH) throw new InputError('כדי לבחור ערך צריך את $\\Delta H^\\circ$ של התגובה הראשונה');
    const fit = p.options.map((o, i) => [o, i] as const).filter(([o]) => (verdict === 'lower' ? o.lt(dH) : o.gt(dH)));
    if (fit.length !== 1) throw new InputError('צריך בדיוק ערך אחד שמתאים');
    pick = fit[0][1];
  }
  return { ...base, newRxn: nr, changes, verdict, pick };
}

// ---------------------------------------------------------------- T6: bond enthalpies

export interface BondRow {
  sp: Species;
  bond: string;
  count: number; // in one molecule
  n: Frac; // coefficient × count
  e: Frac | null; // kJ/mol; null = x
  prod: Frac | null;
}
export interface BondsSol {
  type: 'dH-bonds' | 'bond-unknown';
  recog: Recog;
  rxn: Reaction;
  broken: BondRow[];
  formed: BondRow[];
  sumB: Frac | null;
  sumF: Frac | null;
  dH: Frac;
  x?: { bond: string; v: Frac; nB: Frac; nF: Frac; knownB: Frac; knownF: Frac };
  opts: FmtOpts;
}

function bonds(p: Problem, unknown: boolean): BondsSol {
  const rxn = needRxn(p, 'rxn: H2(g) + Cl2(g) -> 2HCl(g)');
  if (rxn.all.some((s) => s.state !== 'g')) throw new InputError('חישוב באנרגיות קשר: כל החומרים צריכים להיות גזים (מיקוד)');
  const rows = (xs: Species[]): BondRow[] =>
    xs.flatMap((sp) => {
      const uses: BondUse[] | undefined = p.bondsOf?.get(sp.f);
      if (!uses) throw new InputError(`חסרים הקשרים של ${sp.f}`, `bonds ${sp.f}: 4 C-H`);
      return uses.map((u) => {
        if (!p.bond?.has(u.bond)) throw new InputError(`חסרה אנרגיית הקשר ${u.bond}`, `bond ${u.bond} = …`);
        const e = p.bond.get(u.bond)!;
        const n = sp.coef.mul(u.count);
        return { sp, bond: u.bond, count: u.count, n, e, prod: e == null ? null : n.mul(e) };
      });
    });
  const broken = rows(rxn.R);
  const formed = rows(rxn.P);
  const known = (rs: BondRow[]) => rs.reduce((a, r) => (r.prod ? a.add(r.prod) : a), ZERO);
  const xs = [...p.bond!.entries()].filter(([, v]) => v == null).map(([b]) => b);
  if (!unknown) {
    if (xs.length) throw new InputError('יש אנרגיית קשר חסרה (x): זו שאלה מסוג bond-unknown');
    const sumB = known(broken);
    const sumF = known(formed);
    return { type: 'dH-bonds', recog: { type: '$\\Delta H^\\circ$ מאנרגיות קשר' }, rxn, broken, formed, sumB, sumF, dH: sumB.sub(sumF), opts: {} };
  }
  if (xs.length !== 1) throw new InputError('צריך אנרגיית קשר חסרה אחת בדיוק (x)', 'bond N=O = x');
  const dH = dHkJ(p);
  if (dH == null) throw new InputError('חסר $\\Delta H^\\circ$ כדי למצוא את אנרגיית הקשר', 'dH = -291 kJ');
  const bx = xs[0];
  const nB = broken.filter((r) => r.bond === bx).reduce((a, r) => a.add(r.n), ZERO);
  const nF = formed.filter((r) => r.bond === bx).reduce((a, r) => a.add(r.n), ZERO);
  if (nB.eq(nF)) throw new InputError('הקשר החסר מופיע אותו מספר פעמים בשני הצדדים; אי אפשר למצוא אותו');
  const knownB = known(broken);
  const knownF = known(formed);
  const v = dH.sub(knownB).add(knownF).div(nB.sub(nF)); // ΔH = (knownB + nB·x) − (knownF + nF·x)
  for (const r of [...broken, ...formed]) if (r.bond === bx) {
    r.e = v;
    r.prod = r.n.mul(v);
  }
  return {
    type: 'bond-unknown',
    recog: { type: 'אנרגיית קשר חסרה ← מ־$\\Delta H^\\circ$' },
    rxn,
    broken,
    formed,
    sumB: known(broken),
    sumF: known(formed),
    dH,
    x: { bond: bx, v, nB, nF, knownB, knownF },
    opts: {},
  };
}

// ---------------------------------------------------------------- T8: the energy diagram

export interface DiagramSol {
  type: 'diagram';
  recog: Recog;
  rxn?: Reaction;
  R: Frac;
  P: Frac;
  peak: Frac;
  cat?: Frac;
  dH: Frac;
  eaF: Frac;
  eaR: Frac;
  eaFc?: Frac;
  eaRc?: Frac;
  opts: FmtOpts;
}

function diagram(p: Problem): DiagramSol {
  const E = p.E ?? {};
  if (E.R == null || E.P == null || E.peak == null) throw new InputError('חסרות אנרגיות: מגיבים, תוצרים ושיא', 'E reactants = 50 kJ\nE products = 20 kJ\nE peak = 120 kJ');
  if (E.peak.lt(E.R) || E.peak.lt(E.P)) throw new InputError('השיא חייב להיות גבוה מהמגיבים ומהתוצרים');
  if (E.cat && (E.cat.gt(E.peak) || E.cat.lt(E.R) || E.cat.lt(E.P))) throw new InputError('השיא עם זרז צריך להיות נמוך מהשיא בלי זרז, וגבוה מהמגיבים ומהתוצרים');
  return {
    type: 'diagram',
    recog: { type: 'דיאגרמת אנרגיה' },
    rxn: p.rxn,
    R: E.R,
    P: E.P,
    peak: E.peak,
    cat: E.cat,
    dH: E.P.sub(E.R),
    eaF: E.peak.sub(E.R),
    eaR: E.peak.sub(E.P),
    eaFc: E.cat?.sub(E.R),
    eaRc: E.cat?.sub(E.P),
    opts: {},
  };
}

// ---------------------------------------------------------------- T18: the collision model

/**
 * T18: heating or a spark gives the particles more kinetic energy (more of them reach Ea; Ea stays);
 * a catalyst lowers Ea (T8; the particles' energy stays). Either way more particles reach Ea. ΔH° never changes.
 */
export const CLAIM_TRUE: Record<Change, Record<Claim, boolean>> = {
  heat: { 'Ea-down': false, 'KE-up': true, 'more-reach': true, 'dH-change': false },
  spark: { 'Ea-down': false, 'KE-up': true, 'more-reach': true, 'dH-change': false },
  catalyst: { 'Ea-down': true, 'KE-up': false, 'more-reach': true, 'dH-change': false },
};

export interface CollisionSol {
  type: 'collision';
  recog: Recog;
  rxn?: Reaction;
  change: Change;
  claims: { label: string; claim: Claim; ok: boolean }[];
  correct: number; // the one true statement
  opts: FmtOpts;
}

function collision(p: Problem): CollisionSol {
  if (!p.change) throw new InputError('חסר מה עושים לתגובה: חימום, ניצוץ או זרז', 'change: heat');
  if (!p.statements?.length) throw new InputError('חסרים ההיגדים', 'statement I: Ea-down\nstatement II: KE-up');
  const claims = p.statements.map((st) => ({ ...st, ok: CLAIM_TRUE[p.change!][st.claim] }));
  const ok = claims.filter((c) => c.ok);
  if (ok.length !== 1) throw new InputError('צריך היגד נכון אחד בדיוק');
  return { type: 'collision', recog: { type: 'תורת ההתנגשויות: איזה היגד נכון?' }, rxn: p.rxn, change: p.change, claims, correct: claims.indexOf(ok[0]), opts: {} };
}

// ---------------------------------------------------------------- dispatch

export type Solution = SpontSol | BackSol | SignsSol | KineticSol | DSignSol | PRSol | HeatSol | DHNewSol | PhaseSol | BondsSol | DiagramSol | CollisionSol;

export function solve(p: Problem): Solution {
  switch (p.ask) {
    case 'spontaneous':
      return spontaneous(p);
    case 'back':
      return back(p);
    case 'signs':
      return signs(p);
    case 'kinetic':
      return kinetic(p);
    case 'dS-sign':
      return dSsign(p);
    case 'dS':
      return dSsol(p);
    case 'S-unknown':
      return sUnknown(p);
    case 'dH-formation':
      return dHf(p);
    case 'dHf-unknown':
      return dHfUnknown(p);
    case 'heat':
      return heat(p);
    case 'mass-for-heat':
      return massForHeat(p);
    case 'dH-from-q':
      return dHfromQ(p);
    case 'dH-new':
      return dHnew(p);
    case 'phase-compare':
      return phase(p);
    case 'dH-bonds':
      return bonds(p, false);
    case 'bond-unknown':
      return bonds(p, true);
    case 'diagram':
      return diagram(p);
    case 'collision':
      return collision(p);
  }
}
