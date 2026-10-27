// Chemistry helpers (BRIEF §5). Rules live in solve.ts; this file only counts and renders.

import { Frac, ZERO } from './frac';
import type { Reaction, Species, State } from './parse';

export const isGas = (s: Species) => s.state === 'g';

/** total moles of gas on a side (T9) */
export const gasMoles = (side: Species[]) => side.filter(isGas).reduce((a, s) => a.add(s.coef), ZERO);

// ---------- formula rendering (no DOM) ----------

export function formulaTex(f: string): string {
  return `\\mathrm{${f.replace(/(\d+)/g, '_{$1}')}}`;
}

const SUB = '₀₁₂₃₄₅₆₇₈₉';
export const formulaText = (f: string) => f.replace(/\d/g, (d) => SUB[+d]);

/** a coefficient: nothing for 1, "2", or a small fraction "½"-style */
export function coefTex(c: Frac): string {
  if (c.eq(1)) return '';
  if (c.isInt()) return c.toString();
  return `\\tfrac{${c.n}}{${c.d}}`;
}

export const stateTex = (s: Species) => (s.state ? `\\,\\mathrm{(${s.state})}` : '');

export function speciesTex(s: Species, withCoef = true, withState = true): string {
  return `${withCoef ? coefTex(s.coef) : ''}${formulaTex(s.f)}${withState ? stateTex(s) : ''}`;
}

export function reactionTex(r: Reaction, withState = true): string {
  const side = (xs: Species[]) => xs.map((s) => speciesTex(s, true, withState)).join(' + ');
  return `${side(r.R)} \\rightarrow ${side(r.P)}`;
}

export function reactionText(r: Reaction): string {
  const c = (x: Frac) => (x.eq(1) ? '' : x.toString());
  const side = (xs: Species[]) => xs.map((s) => `${c(s.coef)}${formulaText(s.f)}${s.state ? `(${s.state})` : ''}`).join(' + ');
  return `${side(r.R)} → ${side(r.P)}`;
}

// ---------- elements (T7: an element in its standard state has ΔH°f = 0) ----------

/** the standard state of the elements that appear in the questions */
const ELEMENT_STATE: Record<string, State> = {
  H2: 'g', N2: 'g', O2: 'g', F2: 'g', Cl2: 'g', He: 'g', Ne: 'g', Ar: 'g',
  Br2: 'l', Hg: 'l',
  C: 's', S8: 's', S: 's', I2: 's', P4: 's', Na: 's', K: 's', Mg: 's', Ca: 's', Al: 's', Fe: 's', Cu: 's', Zn: 's', Ti: 's', Ag: 's', Li: 's',
};

/** true for an element written in its standard state, e.g. O2(g), C(s), Fe(s) */
export const isStdElement = (s: { f: string; state?: State }) => ELEMENT_STATE[s.f] !== undefined && ELEMENT_STATE[s.f] === s.state;

// ---------- bonds ----------

/** "C=O" → TeX with the bond drawn as –, =, ≡ */
export function bondTex(b: string): string {
  const m = /^([A-Z][a-z]?)([-=#])([A-Z][a-z]?)$/.exec(b);
  if (!m) return `\\mathrm{${b}}`;
  const sym = m[2] === '-' ? '\\text{–}' : m[2] === '=' ? '{=}' : '{\\equiv}';
  return `\\mathrm{${m[1]}}${sym}\\mathrm{${m[3]}}`;
}

/** the order of states for T17 and T9: solid < liquid < gas */
export const STATE_RANK: Record<string, number> = { s: 0, l: 1, aq: 1, g: 2 };
