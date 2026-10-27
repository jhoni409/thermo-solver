// The learning screens: the map of topics (home), one topic, and the dictionary of exam wordings.

import { TOPICS, PART_HE, type Topic } from '../learn/topics';
import { PHRASES, KIND_HE, type PhraseKind } from '../learn/phrases';
import { hasConcept } from '../learn/concepts';
import { load, topicState, dueItems } from '../learn/progress';
import { LIBRARY } from '../library/problems';
import type { Problem } from '../engine/parse';
import { el, he } from './dom';

export interface Nav {
  home(): void;
  topic(id: string): void;
  concept(id: string): void;
  problem(id: string): void;
  practice(topic: string): void;
  review(): void;
  dict(topic: string): void;
  go(hash: string): void;
}

const problemsOf = (t: Topic) => LIBRARY.filter((p) => p.topic === t.id);

function pill(parent: HTMLElement, text: string, cls = '') {
  return el('span', `pill ${cls}`.trim(), parent, he(text));
}

// ---------------------------------------------------------------- home: the map

export function renderHome(page: HTMLElement, nav: Nav) {
  page.innerHTML = '';
  const wrap = el('div', 'pg', page);
  el('h1', 'pg-h', wrap, 'מפת הלימוד');
  el('div', 'pg-sub', wrap, 'כל נושא: מה זה ← איך שואלים במבחן ← דוגמאות פתורות ← תרגול. מה שתרגלתם חוזר אליכם לחזרה.');

  const hero = el('div', 'hero', wrap);
  const due = dueItems().length;
  const bRev = el('button', `hero-btn${due ? ' on' : ''}`, hero);
  el('div', 'hb-n', bRev, String(due));
  el('div', 'hb-t', bRev, due ? 'חזרה להיום' : 'אין חזרות להיום');
  bRev.onclick = () => nav.review();
  bRev.disabled = !due;
  const last = load().last;
  if (last) {
    const bLast = el('button', 'hero-btn', hero);
    el('div', 'hb-n', bLast, '↩');
    el('div', 'hb-t', bLast, 'להמשיך מאיפה שעצרתי');
    bLast.onclick = () => nav.go(last);
  }

  let n = 0;
  for (const part of ['energy', 'entropy'] as const) {
    el('div', 'map-part', wrap, PART_HE[part]);
    const list = el('div', 'map-list', wrap);
    for (const t of TOPICS.filter((x) => x.part === part)) {
      n++;
      const row = el('button', `map-row${t.built ? '' : ' soon'}`, list);
      el('div', 'mr-no', row, String(n));
      const mid = el('div', 'mr-mid', row);
      el('div', 'mr-title', mid, he(t.title));
      if (t.built) el('div', 'mr-goal', mid, he(t.goal));
      const st = el('div', 'mr-state', row);
      if (!t.built) pill(st, 'בקרוב', 'dim');
      else {
        const s = topicState(t.id, problemsOf(t).map((p) => p.id));
        pill(st, s.concept ? 'מה זה ✓' : 'מה זה', s.concept ? 'ok' : '');
        pill(st, `דוגמאות ${s.solved}/${s.total}`, s.total && s.solved === s.total ? 'ok' : '');
        pill(st, s.practiced ? `תרגול ${s.strong}/${s.practiced}` : 'תרגול', s.strong >= 3 ? 'ok' : '');
        if (s.due) pill(st, `${s.due} לחזרה`, 'due');
        row.onclick = () => nav.topic(t.id);
      }
      row.disabled = !t.built;
    }
  }
  el('div', 'pg-foot', wrap, 'ההתקדמות נשמרת בדפדפן הזה, במחשב הזה.');
}

// ---------------------------------------------------------------- one topic

export function renderTopic(page: HTMLElement, t: Topic, nav: Nav) {
  page.innerHTML = '';
  const wrap = el('div', 'pg', page);
  const back = el('button', 'pg-back', wrap, '→ מפת הלימוד');
  back.onclick = () => nav.home();
  el('h1', 'pg-h', wrap, he(t.title));
  el('div', 'pg-sub', wrap, he(t.goal));

  if (t.recipe) {
    const mem = el('div', 'memo', wrap);
    el('div', 'memo-h', mem, 'זוכרים? המתכון');
    const ol = el('ol', 'c-recipe', mem);
    t.recipe.forEach((l, i) => {
      const li = el('li', '', ol);
      el('span', 'rc-no', li, String(i + 1));
      el('span', 'rc-t', li, he(l));
    });
  }

  const s = topicState(t.id, problemsOf(t).map((p) => p.id));
  const tiles = el('div', 'tiles', wrap);
  const tile = (no: number, title: string, sub: string, done: boolean, on: (() => void) | null) => {
    const b = el('button', `tile${done ? ' done' : ''}`, tiles);
    el('div', 'tl-no', b, done ? '✓' : String(no));
    el('div', 'tl-title', b, he(title));
    el('div', 'tl-sub', b, he(sub));
    if (on) b.onclick = on;
    else b.disabled = true;
    return b;
  };
  tile(1, 'מה זה', 'הרעיונות, בלי מספרים', s.concept, hasConcept(t.id) ? () => nav.concept(t.id) : null);
  tile(2, 'איך שואלים במבחן', 'מילים בשאלה ← מה הן אומרות', false, t.phrases.length ? () => nav.dict(t.id) : null);
  tile(3, 'דוגמאות פתורות', `${s.solved} מתוך ${s.total}`, s.total > 0 && s.solved === s.total, null).classList.add('static');
  tile(4, 'תרגול', s.practiced ? `${s.strong} מתוך ${s.practiced} כבר חזקות` : 'עונים לבד, ואז רואים פתרון', s.strong >= 3, () => nav.practice(t.id));

  const solved = load().solved;
  const list = el('div', 'ex-list', wrap);
  for (const p of problemsOf(t)) {
    const b = el('button', `ex-item${solved[p.id] ? ' done' : ''}`, list);
    el('span', 'ex-mark', b, solved[p.id] ? '✓' : '○');
    el('span', 'ex-t', b, he(p.title));
    b.onclick = () => nav.problem(p.id);
  }
}

// ---------------------------------------------------------------- the dictionary of exam wordings

const BLANK: Problem = { raw: '', ask: 'spontaneous' };
const ORDER: PhraseKind[] = ['ask', 'given', 'hidden', 'verb'];

export function renderDict(page: HTMLElement, t: Topic, nav: Nav) {
  page.innerHTML = '';
  const wrap = el('div', 'pg', page);
  const back = el('button', 'pg-back', wrap, `→ ${he(t.title)}`);
  back.onclick = () => nav.topic(t.id);
  el('h1', 'pg-h', wrap, 'איך שואלים במבחן');
  el('div', 'pg-sub', wrap, 'כך זה כתוב בשאלות. מימין המילים, משמאל מה הן אומרות ומה עושים.');
  for (const kind of ORDER) {
    const tags = t.phrases.filter((g) => PHRASES[g]?.kind === kind);
    if (!tags.length) continue;
    el('div', `dict-h k-${kind}`, wrap, KIND_HE[kind]);
    const box = el('div', 'c-decode dict', wrap);
    for (const g of tags) {
      const ph = PHRASES[g];
      const row = el('div', `dc-row${kind === 'hidden' ? ' hidden-given' : ''}`, box);
      const q = el('div', 'dc-q', row);
      for (const w of ph.also ?? []) el('span', 'dc-quote', q, `״${he(w)}״`);
      el('div', 'dc-a', row, '←');
      const m = el('div', 'dc-m', row, he(ph.means(BLANK)));
      if (ph.todo) el('div', 'dc-todo', m, he(ph.todo));
    }
  }
}
