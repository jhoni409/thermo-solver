// Chemistry helpers (BRIEF §5). Rules live in solve.ts; this file only counts and renders.

import { Frac, ZERO } from './frac';
import type { Reaction, Species } from './parse';

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
