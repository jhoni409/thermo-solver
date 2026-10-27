import { describe, it, expect } from 'vitest';
import { parse, InputError } from '../src/engine/parse';
import { solve, type SpontSol } from '../src/engine/solve';
import { F, type Frac } from '../src/engine/frac';
import { fmt } from '../src/engine/format';
import { byId, LIBRARY } from '../src/library/problems';
import { lessonOf } from '../src/lesson/lessons';

const lib = (id: string) => solve(parse(byId(id)!.input)) as SpontSol;
const exact = (a: Frac, b: string) => expect(a.toString()).toBe(F(b).toString());

// PROBLEMS.md P15–P19 (exact fractions, computed with Python `fractions`)
const EXPECT: Record<string, { TK: string; surr: string; tot: string; surrS: string; totS: string; spont: boolean }> = {
  S1: { TK: '298', surr: '46000/149', tot: '16349/149', surrS: '308.7', totS: '109.7', spont: true },
  S2: { TK: '298', surr: '-89000/149', tot: '-65011/149', surrS: '-597.3', totS: '-436.3', spont: false },
  S3: { TK: '1200', surr: '-445/3', tot: '38/3', surrS: '-148.3', totS: '12.7', spont: true },
  S4: { TK: '298', surr: '-22000/149', tot: '-21494/745', surrS: '-147.7', totS: '-28.9', spont: false },
  S5: { TK: '373', surr: '-44000/373', tot: '1562/1865', surrS: '-118.0', totS: '0.8', spont: true },
};

describe('6.9 ΔS° surroundings → ΔS° universe → spontaneous (T14, T15)', () => {
  for (const [id, e] of Object.entries(EXPECT)) {
    it(`${id}: exact values and verdict`, () => {
      const s = lib(id);
      exact(s.TK, e.TK);
      exact(s.dSsurr, e.surr);
      exact(s.dStot, e.tot);
      expect(fmt(s.dSsurr, s.opts).s).toBe(e.surrS);
      expect(fmt(s.dStot, s.opts).s).toBe(e.totS);
      expect(s.spont).toBe(e.spont);
    });
  }

  it('ΔH° kJ → J and °C → K lines', () => {
    const s = lib('S2');
    exact(s.dHJ, '178000');
    exact(s.TC!, '25');
    const r = lib('S4');
    exact(r.TC!, '25'); // room temperature
    expect(lib('S1').TC).toBeUndefined();
  });

  it('independent re-computation: ΔS°tot = ΔS°sys − ΔH°·1000/T', () => {
    for (const p of LIBRARY) {
      const s = solve(parse(p.input)) as SpontSol;
      const dH = parseFloat(/dH = (\S+)/.exec(p.input)![1]);
      const dSs = parseFloat(/dS = (\S+)/.exec(p.input)![1]);
      const t = /T = (\S+)(?: (\S+))?/.exec(p.input)!;
      const T = t[1] === 'room' ? 298 : t[2] === 'C' ? parseFloat(t[1]) + 273 : parseFloat(t[1]);
      const tot = dSs - (dH * 1000) / T;
      expect(s.dStot.toNumber()).toBeCloseTo(tot, 9);
      expect(s.spont).toBe(tot > 0);
    }
  });

  it('every library problem builds a lesson that ends with the exam card', () => {
    for (const p of LIBRARY) {
      const pr = parse(p.input);
      const steps = lessonOf(solve(pr), pr);
      expect(steps[0].stage).toBe(0);
      expect(steps[steps.length - 1].cls).toBe('exam');
    }
  });

  it('decimals = 2 is respected', () => {
    const s = solve(parse('dH = 45 kJ\ndS = 160 J/K\nT = room\ndecimals = 2\nask: spontaneous')) as SpontSol;
    expect(fmt(s.dSsurr, s.opts).s).toBe('-151.01');
    expect(fmt(s.dStot, s.opts).s).toBe('8.99');
  });
});

describe('input', () => {
  it('Hebrew free text is rejected with an example', () => {
    expect(() => parse('האם התגובה ספונטנית?')).toThrow(InputError);
  });
  it('missing temperature', () => {
    expect(() => solve(parse('dH = -92 kJ\ndS = -199 J/K\nask: spontaneous'))).toThrow(InputError);
  });
  it('fraction coefficients and ℓ', () => {
    const p = parse('rxn: H2(g) + 1/2O2(g) -> H2O(ℓ)\ndH = -285.8 kJ\ndS = -163.3 J/K\nT = 298 K\nask: spontaneous');
    expect(p.rxn!.R[1].coef.toString()).toBe('1/2');
    expect(p.rxn!.P[0].state).toBe('l');
  });
  it('ΔS°universe = 0 is refused (not in the material)', () => {
    expect(() => solve(parse('dH = 29.8 kJ\ndS = 100 J/K\nT = 298 K\nask: spontaneous'))).toThrow(InputError);
  });
});
