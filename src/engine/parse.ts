// Input format → Problem. Only the fixed line formats below are read; free text is rejected.

import { Frac, F } from './frac';

export type State = 'g' | 'aq' | 's' | 'l';
export type Side = 'R' | 'P';
export type Sign = -1 | 1;

export interface Species {
  f: string; // formula as typed, e.g. "NH3"
  coef: Frac; // may be a fraction, e.g. 1/2 O2
  state?: State;
  side: Side;
}

export interface Reaction {
  R: Species[];
  P: Species[];
  all: Species[];
}

/** a temperature as the question gives it */
export type Temp = { v: Frac; unit: 'K' | 'C' } | { unit: 'room' };

export type Ask =
  | 'spontaneous'
  | 'back'
  | 'signs'
  | 'kinetic'
  | 'dS-sign'
  | 'dS'
  | 'S-unknown'
  | 'dH-formation'
  | 'dHf-unknown'
  | 'heat'
  | 'dH-from-q'
  | 'mass-for-heat'
  | 'dH-new'
  | 'phase-compare'
  | 'dH-bonds'
  | 'bond-unknown'
  | 'diagram'
  | 'collision';

export const ASKS: Ask[] = [
  'spontaneous',
  'back',
  'signs',
  'kinetic',
  'dS-sign',
  'dS',
  'S-unknown',
  'dH-formation',
  'dHf-unknown',
  'heat',
  'mass-for-heat',
  'dH-from-q',
  'dH-new',
  'phase-compare',
  'dH-bonds',
  'bond-unknown',
  'diagram',
  'collision',
];

/** T18: what is done to make a slow reaction happen */
export type Change = 'heat' | 'spark' | 'catalyst';
/** T18: what a statement claims about it */
export type Claim = 'Ea-down' | 'KE-up' | 'more-reach' | 'dH-change';
export const CLAIMS: Claim[] = ['Ea-down', 'KE-up', 'more-reach', 'dH-change'];

/** what a "signs" question asks for */
export type SignKey = 'dH' | 'dSsys' | 'dSsurr' | 'dStot';

export interface BondUse {
  bond: string; // canonical: "C-H", "C=O", "N#N"
  count: number;
}

export interface Problem {
  raw: string;
  rxn?: Reaction;
  /** a second equation: the new one (dH-new), or the one to compare (phase-compare) */
  newRxn?: Reaction;
  /** ΔH° of the reaction as written */
  dH?: { v: Frac; unit: 'kJ' | 'J' };
  /** ΔS° of the system, J/K */
  dSsys?: Frac;
  /** ΔS° of the universe, J/K */
  dStot?: Frac;
  /** ΔS° of the surroundings, J/K (when the question gives it) */
  dSsurr?: Frac;
  T?: Temp;
  decimals?: number;
  m?: Map<string, Frac>; // grams, by formula
  M?: Map<string, Frac>; // g/mol
  n?: Map<string, Frac>; // mol
  q?: Frac; // kJ
  qDir?: 'released' | 'absorbed';
  options?: Frac[]; // values to choose from (kJ)
  bondsOf?: Map<string, BondUse[]>; // by formula
  bond?: Map<string, Frac | null>; // kJ/mol; null = the unknown x
  dHf?: Map<string, Frac>; // by "formula(state)"
  S0?: Map<string, Frac | null>; // by "formula(state)"; null = the unknown x
  E?: { R?: Frac; P?: Frac; peak?: Frac; cat?: Frac }; // energy diagram, kJ
  sign?: Partial<Record<SignKey, Sign>>;
  find?: SignKey | 'spont' | 'compare' | 'any-T' | 'catalyst';
  /** ΔH°f of an unknown species ("dHf X(s) = x") */
  dHfUnknown?: string;
  observed?: 'none';
  /** T18 */
  change?: Change;
  statements?: { label: string; claim: Claim }[];
  ask: Ask;
}

export class InputError extends Error {
  constructor(
    readonly he: string,
    readonly example?: string,
  ) {
    super(he);
  }
}

const EX_REACTION = 'rxn: N2(g) + 3H2(g) -> 2NH3(g)';
export const EXAMPLE = `rxn: N2(g) + 3H2(g) -> 2NH3(g)
dH = -92 kJ
dS = -199 J/K
T = 298 K
ask: spontaneous`;

const NUM = String.raw`([-+−]?(?:\d+\.?\d*|\.\d+)(?:\/\d+)?)`;
const ARROW = /\s*(?:->|→|⟶|=>)\s*/;
const TERM = /^(\d+\/\d+|\d*\.\d+|\d+)?\s*([A-Z][A-Za-z0-9()]*?)\s*(?:\((g|aq|s|l|ℓ)\))?$/;

/** "formula(state)", the key of per-species data */
export const spKey = (s: { f: string; state?: State }) => `${s.f}(${s.state ?? ''})`;

export function parseReaction(line: string): Reaction {
  const parts = line.split(ARROW);
  if (parts.length !== 2) throw new InputError('חסר חץ בתגובה (->)', EX_REACTION);
  const side = (s: string, sd: Side): Species[] =>
    s
      .split('+')
      .map((t) => t.trim())
      .filter(Boolean)
      .map((term) => {
        const m = TERM.exec(term);
        if (!m) throw new InputError(`לא מזהה את החומר: ${term}`, EX_REACTION);
        const coef = m[1] ? F(m[1]) : F(1);
        if (coef.sign() <= 0) throw new InputError(`מקדם לא חוקי: ${term}`, EX_REACTION);
        const st = m[3] === 'ℓ' ? 'l' : (m[3] as State | undefined);
        return { f: m[2], coef, state: st, side: sd };
      });
  const R = side(parts[0], 'R');
  const P = side(parts[1], 'P');
  if (!R.length || !P.length) throw new InputError('לתגובה חסר צד', EX_REACTION);
  const all = [...R, ...P];
  const seen = new Set<string>();
  for (const s of all) {
    const k = `${s.side}:${spKey(s)}`;
    if (seen.has(k)) throw new InputError(`החומר ${s.f} מופיע פעמיים`, EX_REACTION);
    seen.add(k);
  }
  return { R, P, all };
}

function number(val: string, line: string, ex?: string): Frac {
  try {
    return F(val.trim().replace(/[−–]/g, '-'));
  } catch {
    throw new InputError(`מספר לא מובן בשורה: ${line}`, ex);
  }
}

/** "C-H", "C–H", "C=O", "N≡N", "N#N" → canonical "C-H", "C=O", "N#N" */
export function normBond(s: string): string {
  const t = s.trim().replace(/[–—]/g, '-').replace(/≡/g, '#');
  if (!/^[A-Z][a-z]?[-=#][A-Z][a-z]?$/.test(t)) throw new InputError(`קשר לא מובן: ${s}`, 'bond C-H = 413');
  return t;
}

const ASK_ALIASES: Record<string, Ask> = {
  spontaneous: 'spontaneous',
  'ds-total': 'spontaneous',
  back: 'back',
  'from-total': 'back',
  signs: 'signs',
  kinetic: 'kinetic',
  'ds-sign': 'dS-sign',
  ds: 'dS',
  's-unknown': 'S-unknown',
  'dh-formation': 'dH-formation',
  'dhf-unknown': 'dHf-unknown',
  heat: 'heat',
  'dh-from-q': 'dH-from-q',
  'mass-for-heat': 'mass-for-heat',
  'dh-new': 'dH-new',
  'phase-compare': 'phase-compare',
  'dh-bonds': 'dH-bonds',
  'bond-unknown': 'bond-unknown',
  diagram: 'diagram',
  collision: 'collision',
};

const SIGN_KEY: Record<string, SignKey> = { dh: 'dH', ds: 'dSsys', 'ds sys': 'dSsys', 'ds surr': 'dSsurr', 'ds total': 'dStot' };

export function parse(raw: string): Problem {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.replace(/#(?![A-Z]).*/, '').trim()) // "# comment", but keep N#N
    .filter(Boolean);
  if (!lines.length) throw new InputError('לא הוקלדה שאלה', EXAMPLE);

  const p: Partial<Problem> & { raw: string } = { raw };
  const map = <K extends 'm' | 'M' | 'n' | 'bondsOf' | 'bond' | 'dHf' | 'S0'>(k: K): NonNullable<Problem[K]> => (p[k] ??= new Map() as never) as NonNullable<Problem[K]>;

  for (const line of lines) {
    let m: RegExpExecArray | null;

    if ((m = /^new\s*:\s*(.+)$/i.exec(line))) {
      p.newRxn = parseReaction(m[1]);
      continue;
    }
    if ((m = /^(?:rxn\s*:\s*)?(.+(?:->|→|⟶|=>).+)$/i.exec(line)) && !/^(ask|bonds?|sign|find|observed)\b/i.test(line)) {
      if (p.rxn) throw new InputError('יש יותר משורת תגובה אחת. לתגובה נוספת כתבו new: …');
      p.rxn = parseReaction(m[1]);
      continue;
    }
    if ((m = new RegExp(String.raw`^(?:dH|ΔH)°?\s*=\s*${NUM}\s*(kJ|J)?$`, 'i').exec(line))) {
      const v = number(m[1], line, 'dH = -92 kJ');
      if (v.isZero()) throw new InputError('ΔH° = 0: אין כאן מה לחשב', 'dH = -92 kJ');
      p.dH = { v, unit: m[2]?.toLowerCase() === 'j' ? 'J' : 'kJ' };
      continue;
    }
    if ((m = new RegExp(String.raw`^(?:dS|ΔS)°?\s*(?:total|tot|יקום)\s*=\s*${NUM}\s*(J\/K)?$`, 'i').exec(line))) {
      p.dStot = number(m[1], line, 'dS total = 16.36 J/K');
      continue;
    }
    if ((m = new RegExp(String.raw`^(?:dS|ΔS)°?\s*(?:surr|סביבה)\s*=\s*${NUM}\s*(J\/K)?$`, 'i').exec(line))) {
      p.dSsurr = number(m[1], line, 'dS surr = 792 J/K');
      continue;
    }
    if ((m = new RegExp(String.raw`^(?:dS|ΔS)°?(?:\s*sys)?\s*=\s*${NUM}\s*(J\/K)?$`, 'i').exec(line))) {
      p.dSsys = number(m[1], line, 'dS = -199 J/K');
      continue;
    }
    if ((m = /^T\s*=\s*(.+)$/.exec(line))) {
      const t = m[1].trim();
      let q: RegExpExecArray | null;
      if (/^room$/i.test(t)) p.T = { unit: 'room' };
      else if ((q = new RegExp(String.raw`^${NUM}\s*K$`).exec(t))) {
        const v = number(q[1], line, 'T = 298 K');
        if (v.sign() <= 0) throw new InputError('טמפרטורה בקלווין חייבת להיות חיובית', 'T = 298 K');
        p.T = { v, unit: 'K' };
      } else if ((q = new RegExp(String.raw`^${NUM}\s*°?C$`).exec(t))) {
        const v = number(q[1], line, 'T = 25 C');
        if (v.add(273).sign() <= 0) throw new InputError('טמפרטורה מתחת לאפס המוחלט', 'T = 25 C');
        p.T = { v, unit: 'C' };
      } else throw new InputError(`טמפרטורה לא מובנת: ${t}`, 'T = 298 K   או   T = 25 C   או   T = room');
      continue;
    }
    if ((m = new RegExp(String.raw`^(m|M|n)\s+([A-Z][A-Za-z0-9()]*)\s*=\s*${NUM}\s*(g\/mol|g|mol)?$`).exec(line))) {
      const v = number(m[3], line);
      if (v.sign() <= 0) throw new InputError(`כמות חייבת להיות חיובית: ${line}`);
      map(m[1] as 'm' | 'M' | 'n').set(m[2], v);
      continue;
    }
    if ((m = new RegExp(String.raw`^q\s*=\s*${NUM}\s*(kJ)?\s*(released|absorbed)?$`, 'i').exec(line))) {
      const v = number(m[1], line, 'q = 1335 kJ');
      if (v.sign() <= 0) throw new InputError('כמות החום חייבת להיות חיובית', 'q = 1335 kJ');
      p.q = v;
      if (m[3]) p.qDir = m[3].toLowerCase() as 'released' | 'absorbed';
      continue;
    }
    if ((m = /^options\s*=\s*(.+?)\s*(kJ)?$/i.exec(line))) {
      p.options = m[1].split(/[,;]/).map((x) => number(x, line, 'options = -46, -138 kJ'));
      continue;
    }
    if ((m = /^bonds\s+([A-Z][A-Za-z0-9()]*)\s*:\s*(.+)$/i.exec(line))) {
      const uses = m[2].split(/[,+]/).map((x) => {
        const q = /^\s*(\d+)\s*([^\s]+)\s*$/.exec(x);
        if (!q) throw new InputError(`קשרים לא מובנים: ${x}`, 'bonds CH4: 4 C-H');
        return { count: parseInt(q[1], 10), bond: normBond(q[2]) };
      });
      map('bondsOf').set(m[1], uses);
      continue;
    }
    if ((m = new RegExp(String.raw`^bond\s+(\S+)\s*=\s*(?:${NUM}|(x))\s*(kJ(?:\/mol)?)?$`, 'i').exec(line))) {
      map('bond').set(normBond(m[1]), m[3] ? null : number(m[2], line, 'bond C-H = 413'));
      continue;
    }
    if ((m = new RegExp(String.raw`^dHf\s+([A-Z][A-Za-z0-9()]*?)\s*\((g|aq|s|l)\)\s*=\s*(?:${NUM}|(x))\s*(kJ(?:\/mol)?)?$`, 'i').exec(line))) {
      if (m[4]) p.dHfUnknown = `${m[1]}(${m[2]})`;
      else map('dHf').set(`${m[1]}(${m[2]})`, number(m[3], line, 'dHf CH4(g) = -74.8'));
      continue;
    }
    if ((m = new RegExp(String.raw`^S°?\s+([A-Z][A-Za-z0-9()]*?)\s*\((g|aq|s|l)\)\s*=\s*(?:${NUM}|(x))\s*(J\/(?:mol\*?K|K\*?mol))?$`, 'i').exec(line))) {
      map('S0').set(`${m[1]}(${m[2]})`, m[4] ? null : number(m[3], line, 'S CH4(g) = 186.3'));
      continue;
    }
    if ((m = new RegExp(String.raw`^E\s+(reactants|products|peak catalyst|peak)\s*=\s*${NUM}\s*(kJ)?$`, 'i').exec(line))) {
      const v = number(m[2], line, 'E reactants = 50 kJ');
      const k = { reactants: 'R', products: 'P', peak: 'peak', 'peak catalyst': 'cat' }[m[1].toLowerCase()] as 'R' | 'P' | 'peak' | 'cat';
      (p.E ??= {})[k] = v;
      continue;
    }
    if ((m = /^sign\s+(dH|dS(?:\s+(?:sys|surr|total))?)\s*([<>])\s*0$/i.exec(line))) {
      (p.sign ??= {})[SIGN_KEY[m[1].toLowerCase().replace(/\s+/g, ' ')]] = m[2] === '<' ? -1 : 1;
      continue;
    }
    if ((m = /^find\s*:\s*(dH|dS(?:\s+(?:sys|surr|total))?|spont|compare|any-T|catalyst)$/i.exec(line))) {
      const k = m[1].toLowerCase().replace(/\s+/g, ' ');
      p.find = k === 'spont' || k === 'compare' || k === 'any-t' || k === 'catalyst' ? ((k === 'any-t' ? 'any-T' : k) as Problem['find']) : SIGN_KEY[k];
      continue;
    }
    if ((m = /^change\s*:\s*(heat|spark|catalyst)$/i.exec(line))) {
      p.change = m[1].toLowerCase() as Change;
      continue;
    }
    if ((m = /^statement\s+(\S+)\s*:\s*(\S+)$/i.exec(line))) {
      const claim = CLAIMS.find((c) => c.toLowerCase() === m![2].toLowerCase());
      if (!claim) throw new InputError(`היגד לא מוכר: ${m[2]}`, `statement I: ${CLAIMS.join(' | ')}`);
      (p.statements ??= []).push({ label: m[1], claim });
      continue;
    }
    if (/^observed\s*:\s*no reaction$/i.test(line)) {
      p.observed = 'none';
      continue;
    }
    if ((m = /^decimals\s*=\s*(\d)$/i.exec(line))) {
      p.decimals = parseInt(m[1], 10);
      continue;
    }
    if ((m = /^ask\s*:\s*(\S+)$/i.exec(line))) {
      const ask = ASK_ALIASES[m[1].toLowerCase()];
      if (!ask) throw new InputError(`שאלה לא מוכרת: ${m[1]}`, `ask: ${ASKS.join(' | ')}`);
      p.ask = ask;
      continue;
    }
    if (/[֐-׿]/.test(line)) throw new InputError('טקסט חופשי בעברית לא נקרא. כתבו את הנתונים בשורות קבועות.', EXAMPLE);
    throw new InputError(`שורה לא מובנת: ${line}`, EXAMPLE);
  }

  if (!p.ask) throw new InputError('חסרה שורת ask: מה שואלים', `ask: ${ASKS.join(' | ')}`);
  return p as Problem;
}
