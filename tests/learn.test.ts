import { describe, it, expect, beforeEach } from 'vitest';
import { parse } from '../src/engine/parse';
import { solve } from '../src/engine/solve';
import { textLines, phrasesOf } from '../src/engine/text';
import { partsOf, checkNumber } from '../src/engine/practice';
import { LIBRARY, byId } from '../src/library/problems';
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
  it('topics: all built, their phrases in the dictionary, a recipe strip for every type, a concept lesson', () => {
    for (const t of TOPICS) {
      expect(t.built, t.id).toBe(true);
      for (const g of t.phrases) expect(PHRASES[g], `${t.id} ${g}`).toBeDefined();
      for (const ty of t.types) expect(t.recipeShortOf?.[ty], `${t.id} ${ty}`).toBeDefined();
      expect(conceptOf(t.id)?.length, t.id).toBeGreaterThan(2);
    }
    expect(topicById('spont')!.built).toBe(true);
  });
});

describe('practice', () => {
  it('parts follow the solution: surroundings, universe, verdict', () => {
    const s = solve(parse(byId('S1')!.input));
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
