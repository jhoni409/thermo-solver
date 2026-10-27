// The library: real bagrut questions and the PROBLEMS.md examples, with their exact answers.
// Bagrut answers were checked by hand against the official data; PROBLEMS answers are the user's (PROBLEMS.md).

import { describe, it, expect } from 'vitest';
import { parse } from '../src/engine/parse';
import { solve } from '../src/engine/solve';
import { textLines, phrasesOf } from '../src/engine/text';
import { partsOf } from '../src/engine/practice';
import { F } from '../src/engine/frac';
import { LIBRARY, byId } from '../src/library/problems';
import { lessonOf } from '../src/lesson/lessons';
import { PHRASES } from '../src/learn/phrases';
import { TOPICS } from '../src/learn/topics';

const sol = (id: string) => solve(parse(byId(id)!.input)) as any;
const eq = (a: { toString(): string }, b: string) => expect(a.toString()).toBe(F(b).toString());

describe('library: exact answers', () => {
  it('energy (37381) and PROBLEMS P3, P4, P7, P8, P9, P14', () => {
    eq(sol('B23-381-5').dH, '-15565'); // candle wax: 77.825 kJ from 1.76 g, M = 352
    eq(sol('P3').q, '445');
    eq(sol('P4').m, '24');
    eq(sol('B24-282-2b').dHnew, '-247.3');
    const ph = sol('B22-282-1e');
    eq(ph.options[ph.pick], '-138');
    const ph2 = sol('B23-282-2c');
    eq(ph2.options[ph2.pick], '-285.9');
    expect(sol('B23-282-1z').verdict).toBe('higher');
    eq(sol('B25-381-13').dH, '-291');
    const p7 = sol('P7');
    eq(p7.sumB, '679');
    eq(p7.sumF, '864');
    eq(p7.dH, '-185');
    const p8 = sol('P8');
    eq(p8.sumB, '2648');
    eq(p8.sumF, '3450');
    eq(p8.dH, '-802');
    eq(sol('X-bond-CC').x.v, '835');
    const d = sol('P14');
    eq(d.dH, '-30');
    eq(d.eaF, '70');
    eq(d.eaR, '100');
    eq(d.eaFc, '40');
    eq(d.eaRc, '70');
  });
  it('the sign of ΔS° (T9): P12 and the bagrut', () => {
    expect([sol('P12a').sign, sol('P12b').sign, sol('P12c').sign, sol('P12d').sign]).toEqual([-1, 1, 1, 0]);
    expect(sol('B26-282-2a').sign).toBe(0);
  });
  it('ΔS° and ΔH° from tables (T13, T7)', () => {
    eq(sol('B25-282-1b').pr.total, '-173.6');
    eq(sol('B22-282-1c').pr.total, '-198.2');
    eq(sol('B23-282-2d').pr.total, '176.8');
    eq(sol('B26-282-2a2').pr.total, '20.9');
    eq(sol('B25-282-2b').pr.total, '-87.7');
    eq(sol('B21-282-2b').pr.x.v, '151');
    eq(sol('B25-282-1a').pr.total, '-566');
    eq(sol('P9').pr.total, '-890.3');
    eq(sol('B22-282-2a').pr.x.v, '-55');
  });
  it('spontaneous, back, signs, kinetic', () => {
    const so3 = sol('B26-282-1c'); // SO3(l) at 1000 K
    eq(so3.dStot, '6');
    expect(so3.spont).toBe(true);
    expect(sol('B24-282-2a').spont).toBe(false); // CO2 + CH4 at room temperature
    eq(sol('B21-282-1a').dSsys, '-13'); // Ti
    eq(sol('B21-282-2c').dH, '-236.016'); // ΔS°surr = 792 J/K at 298 K
    eq(sol('B23-282-2d2').dH, '49.5872');
    expect(sol('B21-282-2c1').answer).toEqual({ kind: 'sign', key: 'dH', sign: -1 });
    expect(sol('B26-282-2b').answer).toEqual({ kind: 'any-T', always: true });
    expect(sol('B23-282-1b').answer).toEqual({ kind: 'compare', bigger: 'dSsurr' });
    expect(sol('B21-282-1e').answer).toEqual({ kind: 'compare', bigger: 'dSsurr' });
    expect(sol('K2').spont).toBe(false);
  });
});

describe('library: every question', () => {
  it('solves, renders in exam wording, decodes, has practice parts and a lesson that ends with the exam card', () => {
    for (const p of LIBRARY) {
      const pr = parse(p.input);
      const s = solve(pr);
      expect(TOPICS.find((t) => t.id === p.topic)?.types, p.id).toContain(s.type);
      expect(partsOf(s).length, p.id).toBeGreaterThan(0);
      const steps = lessonOf(s, pr, p.text);
      expect(steps[steps.length - 1].cls, p.id).toBe('exam');
      if (!p.text) continue;
      expect(textLines(p.text, pr).length).toBeGreaterThan(0);
      for (const u of phrasesOf(p.text, pr)) expect(PHRASES[u.tag], `${p.id} ${u.tag}`).toBeDefined();
      expect(p.text, `${p.id}: a number typed into the text`).not.toMatch(/(?<![{א-ת$\\_^(A-Za-z])\d{2,}/);
    }
  });
  it('ids are unique', () => {
    expect(new Set(LIBRARY.map((p) => p.id)).size).toBe(LIBRARY.length);
  });
});
