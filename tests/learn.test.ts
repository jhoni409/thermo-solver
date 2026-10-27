import { describe, it, expect, beforeEach } from 'vitest';
import { parse } from '../src/engine/parse';
import { solve, type SpontSol } from '../src/engine/solve';
import { textLines, phrasesOf } from '../src/engine/text';
import { generate, fromId, GEN_KINDS } from '../src/engine/generate';
import { partsOf, checkNumber } from '../src/engine/practice';
import { fmt } from '../src/engine/format';
import { LIBRARY } from '../src/library/problems';
import { lessonOf } from '../src/lesson/lessons';
import { PHRASES } from '../src/learn/phrases';
import { TOPICS, topicById } from '../src/learn/topics';
import { conceptOf } from '../src/learn/concepts';
import { record, dueItems, today, _reset } from '../src/learn/progress';

describe('exam wording', () => {
  it('every library text renders, and every phrase tag is in the dictionary', () => {
    for (const p of LIBRARY) {
      if (!p.text) continue;
      const pr = parse(p.input);
      expect(textLines(p.text, pr).length).toBeGreaterThan(0);
      for (const u of phrasesOf(p.text, pr)) expect(PHRASES[u.tag], `${p.id} ${u.tag}`).toBeDefined();
      const steps = lessonOf(solve(pr), pr, p.text);
      expect(steps[0].stage).toBe(0);
      expect(steps[steps.length - 1].cls).toBe('exam');
    }
  });
  it('a bare value becomes its own decoded item: ΔS° with no word = the system', () => {
    const p = LIBRARY.find((x) => x.id === 'S2')!;
    const tags = phrasesOf(p.text!, parse(p.input)).map((u) => u.tag);
    expect(tags).toContain('s:dS');
    expect(tags).toContain('s:dH');
    expect(tags).not.toContain('g:dS');
  });
  it('room temperature is decoded as a hidden given', () => {
    const p = LIBRARY.find((x) => x.id === 'S4')!;
    expect(phrasesOf(p.text!, parse(p.input)).some((u) => u.tag === 'h:room' && PHRASES[u.tag].kind === 'hidden')).toBe(true);
  });
  it('topics: every built topic has its phrases in the dictionary; spont has a concept lesson', () => {
    for (const t of TOPICS) for (const g of t.phrases) expect(PHRASES[g], `${t.id} ${g}`).toBeDefined();
    expect(conceptOf('spont')!.length).toBeGreaterThan(3);
    expect(topicById('spont')!.built).toBe(true);
  });
});

describe('endless problems', () => {
  for (const { kind } of GEN_KINDS) {
    it(`${kind}: 150 seeds solve, render and match an independent re-computation`, () => {
      for (let seed = 1; seed <= 150; seed++) {
        const g = generate(kind, seed);
        const pr = parse(g.input);
        const s = solve(pr) as SpontSol;
        expect(textLines(g.text, pr).length).toBeGreaterThan(1);
        for (const u of phrasesOf(g.text, pr)) expect(PHRASES[u.tag], `${g.id} ${u.tag}`).toBeDefined();
        // independent: plain numbers, ΔS°tot = ΔS°sys − ΔH·1000/T(K)
        const dH = parseFloat(/dH = (\S+)/.exec(g.input)![1]);
        const dS = parseFloat(/dS = (\S+)/.exec(g.input)![1]);
        const t = /T = (\S+)(?: (\S+))?/.exec(g.input)!;
        const T = t[1] === 'room' ? 298 : t[2] === 'C' ? parseFloat(t[1]) + 273 : parseFloat(t[1]);
        const tot = dS - (dH * 1000) / T;
        expect(s.dStot.toNumber()).toBeCloseTo(tot, 9);
        expect(s.spont).toBe(tot > 0);
        // the shown numbers add up as shown
        expect(parseFloat(fmt(s.dSsurr, s.opts).s) + dS).toBeCloseTo(parseFloat(fmt(s.dStot, s.opts).s), 9);
        expect(lessonOf(s, pr, g.text).length).toBeGreaterThan(4);
      }
    });
  }
  it('the same id gives the same problem', () => {
    const a = generate('spontaneous', 777);
    expect(fromId(a.id)!.text).toBe(a.text);
    expect(fromId(a.id)!.input).toBe(a.input);
  });
  it('real substances only with library data (NH3, CaCO3, H2O)', () => {
    for (let seed = 1; seed <= 150; seed++) {
      const g = generate('spontaneous', seed);
      const m = /rxn: (.+)/.exec(g.input);
      if (m) expect(m[1]).toMatch(/NH3|CaCO3|H2O/);
    }
  });
});

describe('practice', () => {
  it('parts follow the solution: surroundings, universe, verdict', () => {
    const s = solve(parse(LIBRARY[0].input));
    const parts = partsOf(s);
    expect(parts.map((p) => p.kind)).toEqual(['number', 'number', 'choice']);
  });
  it('rounded or cut answers are accepted, a wrong sign is not', () => {
    const s = solve(parse('dH = 27.5 kJ\ndS = 89.2 J/K\nT = room\nask: spontaneous'));
    const surr = partsOf(s)[0] as Extract<ReturnType<typeof partsOf>[number], { kind: 'number' }>;
    expect(checkNumber(surr, '-92.3')).toBe(true); // rounded
    expect(checkNumber(surr, '-92.2')).toBe(true); // cut
    expect(checkNumber(surr, '92.3')).toBe(false);
    expect(checkNumber(surr, '-0.0923')).toBe(false); // forgot ×1000
  });
});

describe('review schedule', () => {
  beforeEach(() => _reset());
  it('right → later, wrong → back today', () => {
    const d = today();
    expect(record('S1', 'spont', true, d).due).toBe(d + 1);
    expect(record('S1', 'spont', true, d).due).toBe(d + 3);
    expect(record('S1', 'spont', false, d).due).toBe(d);
    expect(dueItems(d).map((x) => x.id)).toEqual(['S1']);
  });
});
