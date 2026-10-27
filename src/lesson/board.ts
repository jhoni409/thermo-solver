// The board: a notebook page that grows by one card per step. A card says one thing and shows the math for it.
// Everything a card does is added to a GSAP timeline, so a step can play, or jump straight to its end.

import { el, he, tex } from '../ui/dom';

export type TL = gsap.core.Timeline;
type Pos = gsap.Position;

export const STAGE_HE = ['קוראים את השאלה', 'פתרון', 'מה כותבים במבחן'] as const;

export const ORANGE = '#ff9f43';
export const BLUE = '#54a0ff';
export const sideColor = (s: { side: 'R' | 'P' }) => (s.side === 'R' ? ORANGE : BLUE);

// ---------------------------------------------------------------- motion

export function show(t: TL, e: Element | Element[], pos: Pos = '>', stagger = 0.15) {
  t.fromTo(e, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power2.out', stagger }, pos);
}

export function pop(t: TL, e: Element | Element[], pos: Pos = '>') {
  t.fromTo(e, { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'back.out(2.2)', stagger: 0.12 }, pos);
}

/** math is written from left to right */
export function write(t: TL, e: Element, pos: Pos = '>', dur = 0.7) {
  t.fromTo(e, { clipPath: 'inset(-40% 100% -40% -3%)', autoAlpha: 1 }, { clipPath: 'inset(-40% -3% -40% -3%)', duration: dur, ease: 'power1.inOut' }, pos);
}

export function flash(t: TL, e: Element, pos: Pos = '<') {
  t.fromTo(e, { backgroundColor: 'rgba(254,202,87,0.4)' }, { backgroundColor: 'rgba(254,202,87,0)', duration: 1.4, ease: 'power1.out' }, pos);
}

// ---------------------------------------------------------------- card

export class Card {
  readonly el: HTMLElement;
  readonly body: HTMLElement;

  constructor(parent: HTMLElement, no: number, say: string, cls: string) {
    this.el = el('section', `card ${cls}`.trim(), parent);
    const head = el('div', 'card-head', this.el);
    el('span', 'card-no', head, String(no));
    el('div', 'card-say', head, he(say));
    this.body = el('div', 'card-body', this.el);
  }

  enter(t: TL) {
    show(t, this.el, 0);
  }

  /** a Hebrew line, math inside $…$ */
  line(t: TL, s: string, cls = '', pos: Pos = '>'): HTMLElement {
    const e = el('div', `c-line ${cls}`.trim(), this.body, he(s));
    show(t, e, pos);
    return e;
  }

  /** a line of math, written left to right */
  math(t: TL, src: string, cls = '', pos: Pos = '>'): HTMLElement {
    const e = el('div', `c-math ${cls}`.trim(), this.body, tex(src));
    e.dir = 'ltr';
    write(t, e, pos);
    return e;
  }

  /** lhs = rhs₁ = rhs₂ …, one row after another with the "=" signs under each other. Each rhs starts with its relation. */
  eqs(t: TL, lhs: string, rhs: string[], last: '' | 'ans' | 'new' | 'bad' = 'new', pos: Pos = '>'): HTMLElement[] {
    const g = el('div', 'c-eqs', this.body);
    g.dir = 'ltr';
    return rhs.map((r, i) => {
      const l = el('div', 'eq-l', g, i === 0 ? tex(lhs) : '');
      const cls = i === rhs.length - 1 && last ? last : '';
      const e = el('div', `eq-r ${cls}`.trim(), g, tex(r));
      if (i === 0) write(t, l, pos, 0.4);
      write(t, e, i === 0 ? '>' : '>0.25');
      return e;
    });
  }

  /** small chips in a row (e.g. what goes up and what goes down) */
  chips(t: TL, items: { html: string; cls?: string }[], pos: Pos = '>'): HTMLElement[] {
    const row = el('div', 'c-chips', this.body);
    const out = items.map((x) => el('span', `chip ${x.cls ?? ''}`.trim(), row, x.html));
    pop(t, out, pos);
    return out;
  }

  /** a ✓ / ✗ / → verdict line */
  verdict(t: TL, s: string, kind: 'ok' | 'bad' | 'go' = 'go', pos: Pos = '>'): HTMLElement {
    const mark = kind === 'ok' ? '✓' : kind === 'bad' ? '✗' : '';
    const e = el('div', `c-verdict ${kind}`, this.body, (mark ? `<span class="v-mark">${mark}</span>` : '') + he(s));
    pop(t, e, pos);
    return e;
  }

  /** an "if … ← …" table: every case appears, then the case that applies lights up */
  rule(t: TL, rows: string[], hits: number[], pos: Pos = '>'): HTMLElement {
    const box = el('div', 'c-rule', this.body);
    el('div', 'rule-h', box, 'הכלל');
    const rs = rows.map((r) => el('div', 'rule-row', box, he(r)));
    show(t, rs, pos, 0.12);
    const off = rs.filter((_, i) => !hits.includes(i));
    const on = rs.filter((_, i) => hits.includes(i));
    if (off.length) t.to(off, { opacity: 0.35, duration: 0.35 }, '>0.25');
    if (on.length)
      t.fromTo(
        on,
        { borderColor: 'rgba(254,202,87,0)', backgroundColor: 'rgba(254,202,87,0)' },
        { borderColor: 'rgba(254,202,87,0.8)', backgroundColor: 'rgba(254,202,87,0.12)', duration: 0.4 },
        '<',
      );
    return box;
  }

  /** the two sides of the reaction as boxes, with an arrow between them showing which way the reaction moves */
  shift(
    t: TL,
    o: { L: string; R: string; arrow: 'r' | 'l' | 'eq'; label?: string; hl?: 'L' | 'R'; underL?: string; underR?: string },
    pos: Pos = '>',
  ): HTMLElement {
    const w = el('div', 'shift', this.body);
    w.dir = 'ltr';
    const side = (src: string, under: string | undefined, on: boolean) => {
      const s = el('div', `sh-side${on ? ' hl' : ''}`, w);
      el('div', 'sh-box', s, tex(src));
      const u = under ? el('div', 'sh-under', s, under) : null;
      if (u) u.dir = 'rtl';
      return { s, u };
    };
    const a = side(o.L, o.underL, o.hl === 'L');
    const mid = el('div', 'sh-mid', w);
    if (o.label) el('div', 'sh-label', mid, he(o.label)).dir = 'rtl';
    const arr = el('div', `sh-arrow ${o.arrow}`, mid, o.arrow === 'r' ? '⟶' : o.arrow === 'l' ? '⟵' : '⇌');
    const b = side(o.R, o.underR, o.hl === 'R');
    show(t, [a.s, b.s], pos, 0.1);
    show(t, mid, '>-0.1');
    if (o.arrow !== 'eq')
      t.fromTo(arr, { scaleX: 0 }, { scaleX: 1, transformOrigin: o.arrow === 'r' ? '0% 50%' : '100% 50%', duration: 0.6, ease: 'power2.out' }, '<');
    const unders = [a.u, b.u].filter((x): x is HTMLDivElement => !!x);
    if (unders.length) pop(t, unders, '>');
    return w;
  }

  /** "Q = …  <  K = …": the two sides first, then the sign between them */
  compare(t: TL, a: string, sign: string, b: string, pos: Pos = '>'): HTMLElement {
    const row = el('div', 'c-cmp', this.body);
    row.dir = 'ltr';
    const A = el('span', 'cmp-side', row, tex(a));
    const S = el('span', 'cmp-sign', row, tex(sign));
    const B = el('span', 'cmp-side', row, tex(b));
    show(t, [A, B], pos, 0.1);
    pop(t, S, '>0.1');
    return row;
  }

  /** boxes added up, e.g. [מערכת] + [סביבה] = [יקום]: a label on top, the value, a chip under it */
  sum(
    t: TL,
    boxes: { label: string; tex: string; under?: { html: string; cls: string }; ans?: boolean }[],
    ops: string[],
    pos: Pos = '>',
  ): HTMLElement {
    const w = el('div', 'c-sum', this.body);
    w.dir = 'ltr';
    const bs: HTMLElement[] = [];
    const os: HTMLElement[] = [];
    boxes.forEach((b, i) => {
      if (i) os.push(el('div', 'sum-op', w, tex(ops[i - 1])));
      const s = el('div', `sum-box${b.ans ? ' ans' : ''}`, w);
      el('div', 'sum-label', s, he(b.label)).dir = 'rtl';
      el('div', 'sum-v', s, tex(b.tex));
      if (b.under) el('div', `chip ${b.under.cls}`, s, b.under.html).dir = 'rtl';
      bs.push(s);
    });
    show(t, bs, pos, 0.25);
    pop(t, os, '<0.2');
    return w;
  }

  /** the exam wording, decoded: "בשאלה כתוב" ← what it means (← what to do), one row at a time */
  decode(t: TL, rows: { quote: string; means: string; todo?: string; tag?: string; hidden?: boolean; also?: string[] }[], pos: Pos = '>'): HTMLElement {
    const box = el('div', 'c-decode', this.body);
    const head = el('div', 'dc-row dc-head', box);
    el('div', 'dc-q', head, 'בשאלה כתוב');
    el('div', 'dc-a', head, '');
    el('div', 'dc-m', head, 'פירוש');
    const rs = rows.map((r) => {
      const row = el('div', `dc-row${r.hidden ? ' hidden-given' : ''}`, box);
      if (r.tag) row.dataset.tag = r.tag;
      const q = el('div', 'dc-q', row);
      el('span', 'dc-quote', q, `״${he(r.quote)}״`);
      if (r.hidden) el('span', 'dc-flag', q, 'נסתר!');
      el('div', 'dc-a', row, '←');
      const m = el('div', 'dc-m', row, he(r.means));
      if (r.todo) el('div', 'dc-todo', m, he(r.todo));
      if (r.also?.length) el('div', 'dc-also', q, `נכתב גם: ${r.also.map((a) => `״${he(a)}״`).join(' · ')}`);
      return row;
    });
    show(t, head, pos);
    show(t, rs, '>', 0.35);
    return box;
  }

  /**
   * "guess before you see": a question with options; the step's content waits until one is picked.
   * `picked` = an earlier answer (the card is rebuilt answered), else onPick is called once.
   */
  predict(q: string, options: string[], correct: number, picked: number | undefined, onPick: (i: number) => void): HTMLElement {
    const box = el('div', 'c-predict', this.body);
    el('div', 'pd-h', box, 'רגע, לפני שממשיכים');
    el('div', 'pd-q', box, he(q));
    const row = el('div', 'pd-opts', box);
    const res = el('div', 'pd-res', box);
    const bs = options.map((o) => el('button', 'pd-opt', row, he(o)));
    const settle = (i: number) => {
      bs.forEach((b, j) => {
        b.disabled = true;
        b.classList.toggle('ok', j === correct);
        b.classList.toggle('no', j === i && i !== correct);
      });
      res.className = `pd-res ${i === correct ? 'ok' : i < 0 ? '' : 'no'}`;
      res.innerHTML = i === correct ? '✓ נכון' : i < 0 ? `התשובה: ${he(options[correct])}` : `✗ התשובה: ${he(options[correct])}`;
    };
    if (picked !== undefined) settle(picked);
    else
      bs.forEach((b, i) => {
        b.onclick = () => {
          settle(i);
          onPick(i);
        };
      });
    return box;
  }

  /** system inside surroundings; together the universe */
  nest(t: TL, o: { inner: string; outer: string; foot: string }, pos: Pos = '>'): HTMLElement {
    const w = el('div', 'c-nest', this.body);
    const out = el('div', 'nest-out', w);
    el('div', 'nest-label', out, he(o.outer));
    const inn = el('div', 'nest-in', out, he(o.inner));
    const foot = el('div', 'nest-foot', w, he(o.foot));
    show(t, out, pos);
    pop(t, inn, '>-0.1');
    show(t, foot, '>');
    return w;
  }

  /** heat leaving the system (exo) or entering it (endo), and what the surroundings' entropy does */
  heat(t: TL, o: { dir: 'out' | 'in'; sys: string; surr: string; chip: { html: string; cls: string } }, pos: Pos = '>'): HTMLElement {
    const w = el('div', 'c-heat', this.body);
    const s = el('div', 'ht-box sys', w, he(o.sys));
    const mid = el('div', 'ht-mid', w);
    el('div', 'ht-label', mid, 'חום');
    const arr = el('div', 'ht-arrow', mid, o.dir === 'out' ? '⟵' : '⟶');
    const r = el('div', 'ht-side', w);
    el('div', 'ht-box', r, he(o.surr));
    const ch = el('div', `chip ${o.chip.cls}`, r, o.chip.html);
    show(t, [s, r], pos, 0.1);
    show(t, mid, '>-0.1');
    t.fromTo(arr, { scaleX: 0 }, { scaleX: 1, transformOrigin: o.dir === 'out' ? '100% 50%' : '0% 50%', duration: 0.6, ease: 'power2.out' }, '<');
    pop(t, ch, '>');
    return w;
  }

  /** a numbered recipe, one short line per step */
  recipe(t: TL, lines: string[], pos: Pos = '>'): HTMLElement {
    const w = el('ol', 'c-recipe', this.body);
    const rs = lines.map((l, i) => {
      const li = el('li', '', w);
      el('span', 'rc-no', li, String(i + 1));
      el('span', 'rc-t', li, he(l));
      return li;
    });
    show(t, rs, pos, 0.3);
    return w;
  }

  /** a small table (rows of cells, first row is the header) */
  grid(t: TL, rows: string[][], pos: Pos = '>'): HTMLElement {
    const tb = el('table', 'c-grid', this.body);
    tb.dir = 'rtl';
    rows.forEach((r, i) => {
      const tr = el('tr', i === 0 ? 'head' : '', tb);
      for (const c of r) el(i === 0 ? 'th' : 'td', '', tr, he(c));
    });
    show(t, Array.from(tb.rows), pos, 0.12);
    return tb;
  }
}

// ---------------------------------------------------------------- the board

export class Board {
  readonly root: HTMLElement;
  readonly pin: HTMLElement;
  readonly flow: HTMLElement;
  cards: Card[] = [];

  constructor(parent: HTMLElement) {
    this.root = el('div', 'board', parent);
    this.pin = el('div', 'pin', this.root);
    this.flow = el('div', 'flow', this.root);
  }

  reset() {
    this.pin.innerHTML = '';
    this.flow.innerHTML = '';
    this.cards = [];
  }

  card(no: number, say: string, cls = ''): Card {
    const c = new Card(this.flow, no, say, cls);
    this.cards.push(c);
    return c;
  }

  /** scroll so the card is in view under the pinned part */
  reveal(c: Card, smooth: boolean) {
    const pinH = this.pin.offsetHeight;
    const top = c.el.offsetTop - pinH - 12;
    const bottom = c.el.offsetTop + c.el.offsetHeight + 16 - this.root.clientHeight;
    const y = Math.max(0, Math.min(top, bottom));
    this.root.scrollTo({ top: y, behavior: smooth ? 'smooth' : 'auto' });
  }
}
