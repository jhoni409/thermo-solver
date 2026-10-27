// Input format → Problem. Only the fixed line formats below are read; free text is rejected.

import { Frac, F } from './frac';

export type State = 'g' | 'aq' | 's' | 'l';
export type Side = 'R' | 'P';

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

export type Ask = 'spontaneous';

export const ASKS: Ask[] = ['spontaneous'];

export interface Problem {
  raw: string;
  rxn?: Reaction;
  /** ΔH° of the reaction as written */
  dH?: { v: Frac; unit: 'kJ' | 'J' };
  /** ΔS° of the system, J/K */
  dSsys?: Frac;
  T?: Temp;
  decimals?: number;
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
    const k = `${s.f}(${s.state ?? ''})`;
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

const ASK_ALIASES: Record<string, Ask> = {
  spontaneous: 'spontaneous',
  'dS-total': 'spontaneous',
};

export function parse(raw: string): Problem {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.replace(/#.*/, '').trim())
    .filter(Boolean);
  if (!lines.length) throw new InputError('לא הוקלדה שאלה', EXAMPLE);

  const p: Partial<Problem> & { raw: string } = { raw };

  for (const line of lines) {
    let m: RegExpExecArray | null;

    if ((m = /^(?:rxn\s*:\s*)?(.+(?:->|→|⟶|=>).+)$/i.exec(line)) && !/^ask\s*:/i.test(line)) {
      if (p.rxn) throw new InputError('יש יותר משורת תגובה אחת');
      p.rxn = parseReaction(m[1]);
      continue;
    }
    if ((m = new RegExp(String.raw`^(?:dH|ΔH)°?\s*=\s*${NUM}\s*(kJ|J)?$`, 'i').exec(line))) {
      const v = number(m[1], line, 'dH = -92 kJ');
      if (v.isZero()) throw new InputError('ΔH° = 0: אין כאן מה לחשב', 'dH = -92 kJ');
      p.dH = { v, unit: m[2]?.toLowerCase() === 'j' ? 'J' : 'kJ' };
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
    if ((m = /^decimals\s*=\s*(\d)$/i.exec(line))) {
      p.decimals = parseInt(m[1], 10);
      continue;
    }
    if ((m = /^ask\s*:\s*(\S+)$/i.exec(line))) {
      const ask = ASK_ALIASES[m[1]] ?? ASK_ALIASES[m[1].toLowerCase()];
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
