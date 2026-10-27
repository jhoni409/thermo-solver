// What the student has done, kept in this browser (localStorage, wrapped in try/catch).
// Practice items come back for review on a growing schedule (1, 3, 7, 16, 35 days); a wrong answer resets it.

const KEY = 'th-progress-v1';
const GAPS = [0, 1, 3, 7, 16, 35]; // days until the next review, by box

export interface Item {
  topic: string;
  box: number; // 1..5
  due: number; // day number
  tries: number;
  right: number;
}

export interface Progress {
  concept: Record<string, boolean>; // topic id → "what is it" finished
  solved: Record<string, boolean>; // problem id → watched to the end
  items: Record<string, Item>; // practice items (problem ids, library or generated)
  last?: string; // the last place (hash), to continue from
}

export const today = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);

let mem: Progress | null = null;

export function load(): Progress {
  if (mem) return mem;
  let p: Progress = { concept: {}, solved: {}, items: {} };
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (v && typeof v === 'object') p = { concept: v.concept ?? {}, solved: v.solved ?? {}, items: v.items ?? {}, last: v.last };
  } catch {
    /* no storage */
  }
  mem = p;
  return p;
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(mem));
  } catch {
    /* no storage */
  }
}

export function markConcept(topic: string) {
  load().concept[topic] = true;
  save();
}

export function markSolved(id: string) {
  load().solved[id] = true;
  save();
}

export function setLast(hash: string) {
  load().last = hash;
  save();
}

/** record a practice answer and schedule the next review */
export function record(id: string, topic: string, right: boolean, day = today()): Item {
  const p = load();
  const it = p.items[id] ?? { topic, box: 0, due: day, tries: 0, right: 0 };
  it.tries++;
  if (right) {
    it.right++;
    it.box = Math.min(5, it.box + 1);
    it.due = day + GAPS[it.box];
  } else {
    it.box = 1;
    it.due = day; // back in today's review
  }
  p.items[id] = it;
  save();
  return it;
}

export const dueItems = (day = today()) =>
  Object.entries(load().items)
    .filter(([, it]) => it.due <= day)
    .sort((a, b) => a[1].due - b[1].due)
    .map(([id, it]) => ({ id, ...it }));

/** a topic's state, for the map */
export function topicState(topic: string, problemIds: string[]) {
  const p = load();
  const items = Object.values(p.items).filter((it) => it.topic === topic);
  return {
    concept: !!p.concept[topic],
    solved: problemIds.filter((id) => p.solved[id]).length,
    total: problemIds.length,
    practiced: items.length,
    strong: items.filter((it) => it.box >= 3).length,
    due: items.filter((it) => it.due <= today()).length,
  };
}

/** for tests */
export function _reset() {
  mem = { concept: {}, solved: {}, items: {} };
}
