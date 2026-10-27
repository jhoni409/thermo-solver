// The endless problems: every kind, many seeds. Each answer is re-computed here with plain numbers, straight from
// the given data (and, where the data come from the bank, from the bank itself), not with the solver.

import { describe, it, expect } from 'vitest';
import { parse, spKey, type Problem, type Species } from '../src/engine/parse';
import { solve, type Solution } from '../src/engine/solve';
import { textLines, phrasesOf } from '../src/engine/text';
import { generate, fromId, generateForTopic, GEN_KINDS, type GenKind } from '../src/engine/generate';
import { partsOf } from '../src/engine/practice';
import { isStdElement } from '../src/engine/chem';
import { SPECIES, REACTIONS, BOND_RXNS, BONDS_OF, BOND_SETS, bondsIn, PHASES, atoms, molarMass, isElementStd } from '../src/engine/bank';
import { PHRASES } from '../src/learn/phrases';
import { TOPICS } from '../src/learn/topics';
import { lessonOf } from '../src/lesson/lessons';

const SEEDS = 150;
const n = (x: { toNumber(): number } | undefined | null) => (x == null ? NaN : x.toNumber());
const close = (a: number, b: number, what: string) => expect(a, what).toBeCloseTo(b, 6);

// ---------------------------------------------------------------- plain-number chemistry, written again

const H = (k: string) => parseFloat(SPECIES[k]?.H ?? (SPECIES[k] ? '0' : 'NaN'));
const S = (k: string) => parseFloat(SPECIES[k]?.S ?? 'NaN');
const c = (s: Species) => s.coef.toNumber();
const sumBy = (xs: Species[], f: (s: Species) => number) => xs.reduce((a, s) => a + c(s) * f(s), 0);
const bankDH = (p: Problem) => sumBy(p.rxn!.P, (s) => H(spKey(s))) - sumBy(p.rxn!.R, (s) => H(spKey(s)));
const bankDS = (p: Problem) => sumBy(p.rxn!.P, (s) => S(spKey(s))) - sumBy(p.rxn!.R, (s) => S(spKey(s)));
const kelvin = (p: Problem) => (!p.T || p.T.unit === 'room' ? 298 : p.T.unit === 'C' ? n(p.T.v) + 273 : n(p.T.v));
const gas = (xs: Species[]) => xs.filter((s) => s.state === 'g').reduce((a, s) => a + c(s), 0);
/** from the question's table: ΔH°f (element = 0) or S° */
const tH = (p: Problem, s: Species) => (p.dHf?.has(spKey(s)) ? n(p.dHf.get(spKey(s))) : isStdElement(s) ? 0 : NaN);
const tS = (p: Problem, s: Species) => n(p.S0?.get(spKey(s)));

function independent(kind: GenKind, p: Problem, sol: Solution) {
  const s = sol as any;
  switch (kind) {
    case 'spontaneous': {
      const dH = p.dH ? n(p.dH.v) : sumBy(p.rxn!.P, (x) => tH(p, x)) - sumBy(p.rxn!.R, (x) => tH(p, x));
      const dS = p.dSsys != null ? n(p.dSsys) : p.S0 ? sumBy(p.rxn!.P, (x) => tS(p, x)) - sumBy(p.rxn!.R, (x) => tS(p, x)) : 0;
      const surr = (-dH * 1000) / kelvin(p);
      close(n(s.dSsurr), surr, 'surr');
      if (!s.surrOnly) {
        close(n(s.dStot), dS + surr, 'tot');
        expect(s.spont).toBe(dS + surr > 0);
      }
      if (p.rxn) close(dH, bankDH(p), 'ΔH from the bank');
      break;
    }
    case 'back': {
      const T = kelvin(p);
      const dS = p.dSsys != null ? n(p.dSsys) : p.S0 ? sumBy(p.rxn!.P, (x) => tS(p, x)) - sumBy(p.rxn!.R, (x) => tS(p, x)) : NaN;
      if (p.dSsurr != null) close(n(s.dH), (-n(p.dSsurr) * T) / 1000, 'ΔH from surr');
      else if (p.dH) close(n(s.dSsys), n(p.dStot) + (n(p.dH.v) * 1000) / T, 'ΔS sys');
      else close(n(s.dH), (-(n(p.dStot) - dS) * T) / 1000, 'ΔH from tot');
      // the given numbers were rounded from the real values: the answer is the real one, nearly
      if (s.find === 'dH') expect(Math.abs(n(s.dH) - bankDH(p))).toBeLessThan((0.05 * T) / 1000 + 1e-9);
      else expect(Math.abs(n(s.dSsys) - bankDS(p))).toBeLessThan(0.05 + 1e-9);
      break;
    }
    case 'signs': {
      const T = kelvin(p);
      const dH = bankDH(p);
      const dS = bankDS(p);
      const tot = dS - (dH * 1000) / T;
      const a = s.answer;
      if (a.kind === 'sign') expect(a.sign, a.key).toBe(Math.sign({ dH, dSsys: dS, dSsurr: -dH, dStot: tot }[a.key as 'dH']));
      else if (a.kind === 'spont') expect(a.spont).toBe(tot > 0);
      else if (a.kind === 'compare') expect(a.bigger).toBe(Math.abs(dH * 1000) / T > Math.abs(dS) ? 'dSsurr' : 'dSsys');
      else if (a.kind === 'any-T') {
        expect(Math.sign(dS)).toBe(Math.sign(-dH));
        expect(a.always).toBe(dS > 0);
      } else throw new Error('no answer');
      break;
    }
    case 'kinetic': {
      const tot = bankDS(p) - (bankDH(p) * 1000) / 298;
      expect(s.spont).toBe(tot > 0);
      if (s.find === 'why') expect(tot).toBeGreaterThan(0);
      break;
    }
    case 'dS-sign': {
      const d = gas(p.rxn!.P) - gas(p.rxn!.R);
      const real = bankDS(p);
      if (d !== 0) {
        expect(s.sign).toBe(Math.sign(d));
        expect(Math.sign(real)).toBe(Math.sign(d)); // the rule agrees with the real values
      } else if (s.case === 'phase') expect(s.sign).toBe(Math.sign(real));
      else {
        expect(s.sign).toBe(0);
        expect(Math.abs(real)).toBeLessThan(45);
      }
      break;
    }
    case 'dS':
      close(n(s.pr.total), sumBy(p.rxn!.P, (x) => tS(p, x)) - sumBy(p.rxn!.R, (x) => tS(p, x)), 'ΔS');
      close(n(s.pr.total), bankDS(p), 'ΔS bank');
      break;
    case 'dH-formation':
      close(n(s.pr.total), sumBy(p.rxn!.P, (x) => tH(p, x)) - sumBy(p.rxn!.R, (x) => tH(p, x)), 'ΔH');
      close(n(s.pr.total), bankDH(p), 'ΔH bank');
      break;
    case 'S-unknown':
    case 'dHf-unknown': {
      const k = spKey(s.pr.x.sp);
      const table = kind === 'S-unknown' ? (x: Species) => (spKey(x) === k ? 0 : tS(p, x)) : (x: Species) => (spKey(x) === k ? 0 : tH(p, x));
      const known = sumBy(p.rxn!.P, table) - sumBy(p.rxn!.R, table);
      const target = kind === 'S-unknown' ? n(p.dSsys) : n(p.dH!.v);
      const coef = c(s.pr.x.sp) * (s.pr.x.sp.side === 'P' ? 1 : -1);
      close(n(s.pr.x.v), (target - known) / coef, 'x');
      close(n(s.pr.x.v), kind === 'S-unknown' ? S(k) : H(k), 'x = the bank value');
      break;
    }
    case 'heat':
    case 'mass-for-heat':
    case 'dH-from-q': {
      const sp = s.sp as Species;
      const M = p.M?.get(sp.f) ? n(p.M.get(sp.f)) : NaN;
      if (!Number.isNaN(M)) close(M, molarMass(sp.f).toNumber(), 'M');
      const mol = p.n?.get(sp.f) ? n(p.n.get(sp.f)) : n(p.m?.get(sp.f)) / M;
      const dH = bankDH(p);
      if (kind === 'heat') close(n(s.q), (mol / c(sp)) * Math.abs(n(p.dH!.v)), 'q');
      if (kind === 'mass-for-heat') close(n(s.m), ((n(p.q) / Math.abs(n(p.dH!.v))) * c(sp)) * M, 'm');
      if (kind === 'dH-from-q') {
        close(n(s.dH), (n(p.q) / mol) * c(sp) * (p.qDir === 'released' ? -1 : 1), 'ΔH');
        close(n(s.dH), dH, 'ΔH bank');
      } else close(n(p.dH!.v), dH, 'ΔH bank');
      break;
    }
    case 'dH-new': {
      const a = p.rxn!;
      const b = p.newRxn!;
      const first = a.R[0];
      const same = b.R.find((x) => spKey(x) === spKey(first));
      const other = b.P.find((x) => spKey(x) === spKey(first))!;
      const k = same ? c(same) / c(first) : c(other) / c(first);
      close(n(s.dHnew), n(p.dH!.v) * k * (same ? 1 : -1), 'ΔH new');
      close(n(p.dH!.v), bankDH(p), 'ΔH bank');
      break;
    }
    case 'phase-compare': {
      const d1 = bankDH(p);
      if (s.pure) expect(s.pure.sign).toBe(Math.sign(d1));
      else {
        const d2 = bankDH({ ...p, rxn: p.newRxn });
        close(n(p.dH!.v), d1, 'ΔH(1) bank');
        expect(s.verdict).toBe(d2 < d1 ? 'lower' : 'higher');
        if (p.options) close(n(p.options[s.pick]), d2, 'the right option is the real value');
      }
      if (s.pure && p.options) close(n(p.options[s.pick]), d1, 'the right option');
      break;
    }
    case 'dH-bonds':
    case 'bond-unknown': {
      const e = (b: string) => (p.bond!.get(b) == null ? NaN : n(p.bond!.get(b)));
      const side = (xs: Species[], f: (b: string) => number) => xs.reduce((a, x) => a + c(x) * p.bondsOf!.get(x.f)!.reduce((t, u) => t + u.count * f(u.bond), 0), 0);
      if (kind === 'dH-bonds') {
        close(n(s.dH), side(p.rxn!.R, e) - side(p.rxn!.P, e), 'ΔH');
        expect(BOND_SETS.some((st) => [...p.bond!.entries()].every(([b, v]) => st.E[b] === String(v!.toNumber()))), 'one set per question').toBe(true);
      }
      else {
        const bx = s.x.bond as string;
        const known = (b: string) => (b === bx ? 0 : e(b));
        const cnt = (b: string) => (b === bx ? 1 : 0);
        const x = (n(p.dH!.v) - side(p.rxn!.R, known) + side(p.rxn!.P, known)) / (side(p.rxn!.R, cnt) - side(p.rxn!.P, cnt));
        close(n(s.x.v), x, 'x');
        // the question's table is one set: the given values all match it, and x comes back as its value
        const set = BOND_SETS.find((st) => [...p.bond!.entries()].every(([b, v]) => v == null || st.E[b] === String(v.toNumber())))!;
        expect(set, 'the bond values come from one set').toBeDefined();
        close(n(s.x.v), parseFloat(set.E[bx]), 'x = the table value');
      }
      break;
    }
    case 'collision': {
      // T18, written again: heat / spark raise the particles' energy (Ea stays); a catalyst lowers Ea (energy stays)
      const truth = (claim: string) =>
        claim === 'more-reach' || (claim === 'KE-up' && p.change !== 'catalyst') || (claim === 'Ea-down' && p.change === 'catalyst');
      const right = p.statements!.filter((st) => truth(st.claim));
      expect(right.length).toBe(1);
      expect(s.claims[s.correct].label).toBe(right[0].label);
      if (p.change === 'spark') expect(p.rxn!.R.every((x) => x.state === 'g'), 'a spark only for gases').toBe(true);
      break;
    }
    case 'diagram': {
      const E = p.E!;
      close(n(s.dH), n(E.P) - n(E.R), 'ΔH');
      close(n(s.eaF), n(E.peak) - n(E.R), 'Ea');
      close(n(s.eaR), n(E.peak) - n(E.P), 'Ea back');
      if (E.cat) close(n(s.eaFc), n(E.cat) - n(E.R), 'Ea catalyst');
      break;
    }
  }
}

// ---------------------------------------------------------------- the bank

describe('the data bank', () => {
  it('every reaction is balanced and every species has data', () => {
    for (const x of [...REACTIONS, ...BOND_RXNS]) {
      const count = (side: [string, string][]) => {
        const out: Record<string, number> = {};
        for (const [cf, k] of side) {
          expect(SPECIES[k], k).toBeDefined();
          const [a, b] = cf.split('/').map(Number);
          for (const [el, m] of Object.entries(atoms(k.replace(/\(.+\)$/, '')))) out[el] = (out[el] ?? 0) + (m * a) / (b ?? 1);
        }
        return out;
      };
      expect(count(x.R), x.he).toEqual(count(x.P));
    }
  });
  it('elements: the bank and the solver agree on which are in their standard state (ΔH°f = 0)', () => {
    for (const k of Object.keys(SPECIES)) {
      const [, f, st] = /^(.+)\((\w+)\)$/.exec(k)!;
      expect(isElementStd(k), k).toBe(isStdElement({ f, state: st as 'g' }));
    }
  });
  it('bond molecules: the bonds give the right atoms', () => {
    for (const [f, bs] of Object.entries(BONDS_OF)) {
      for (const [, b] of bs) expect(BOND_SETS.some((st) => st.E[b]), b).toBe(true);
      // every atom is in a bond (H once, the others at least once)
      const inBonds = new Set(bs.flatMap(([, b]) => b.split(/[-=#]/)));
      for (const el of Object.keys(atoms(f))) expect(inBonds.has(el), `${f} ${el}`).toBe(true);
    }
    for (const x of BOND_RXNS) {
      for (const [, k] of [...x.R, ...x.P]) {
        expect(BONDS_OF[k.replace(/\(.+\)$/, '')], k).toBeDefined();
        expect(k.endsWith('(g)'), `${k}: bond calculations are for gases only`).toBe(true);
      }
      expect(BOND_SETS.some((st) => bondsIn(x).every((b) => st.E[b])), `${x.he}: one set has all its bonds`).toBe(true);
    }
  });
  it('phase changes are of one substance, both states in the bank', () => {
    for (const [f, a, b] of PHASES) {
      expect(SPECIES[`${f}(${a})`]).toBeDefined();
      expect(SPECIES[`${f}(${b})`]).toBeDefined();
    }
  });
  it('molar masses use the bagrut atomic masses', () => {
    expect(molarMass('CH4').toNumber()).toBe(16);
    expect(molarMass('C25H52').toNumber()).toBe(352);
    expect(molarMass('HCl').toNumber()).toBe(36.5);
    expect(molarMass('CaCO3').toNumber()).toBe(100);
  });
});

// ---------------------------------------------------------------- every kind

describe('endless problems', () => {
  for (const { kind, topic } of GEN_KINDS) {
    it(`${kind}: ${SEEDS} seeds parse, solve, render, decode, and match an independent re-computation`, () => {
      expect(TOPICS.some((t) => t.id === topic)).toBe(true);
      const inputs = new Set<string>();
      const texts = new Set<string>();
      for (let seed = 1; seed <= SEEDS; seed++) {
        const g = generate(kind, seed);
        expect(fromId(g.id)!.input).toBe(g.input); // the id gives the same problem back
        const p = parse(g.input);
        const sol = solve(p);
        expect(sol.type).toBe(kind);
        expect(textLines(g.text, p).length).toBeGreaterThan(1);
        for (const u of phrasesOf(g.text, p)) expect(PHRASES[u.tag], `${g.id} ${u.tag}`).toBeDefined();
        expect(g.text, 'no number typed into the text').not.toMatch(/(?<![{א-ת$\\_^(])\d{2,}/);
        expect(partsOf(sol).length).toBeGreaterThan(0);
        const steps = lessonOf(sol, p, g.text);
        expect(steps[steps.length - 1].cls).toBe('exam');
        independent(kind, p, sol);
        inputs.add(g.input);
        texts.add(g.text);
      }
      // close to endless: almost every seed gives another problem
      // (fewer for the kinds whose real data are few: bond enthalpies, phase changes, slow reactions)
      const small = ['dS-sign', 'kinetic', 'phase-compare', 'signs', 'dH-bonds'].includes(kind);
      expect(inputs.size, `${kind}: ${inputs.size} different problems`).toBeGreaterThan(SEEDS * (small ? 0.4 : 0.7));
      expect(texts.size, `${kind}: ${texts.size} different wordings`).toBeGreaterThan(small ? 6 : 10);
    });
  }
  it('every topic has endless problems', () => {
    for (const t of TOPICS) expect(generateForTopic(t.id, 7), t.id).not.toBeNull();
  });
});
