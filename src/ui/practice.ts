// Practice and review: the question in exam wording, the student answers every part, then sees what was right.
// Each answer is recorded (learn/progress.ts) so the question comes back for review.

import { parse } from '../engine/parse';
import { solve } from '../engine/solve';
import { textLines } from '../engine/text';
import { statement, type Seg } from '../engine/statement';
import { partsOf, checkNumber, answerText, type Part } from '../engine/practice';
import { record } from '../learn/progress';
import { el, he, tex } from './dom';

export interface PracticeQ {
  id: string;
  topic: string;
  input: string;
  text?: string;
  title: string;
}

export function questionLines(parent: HTMLElement, q: { input: string; text?: string }) {
  const problem = parse(q.input);
  const lines: Seg[][] = q.text ? textLines(q.text, problem) : statement(problem).lines;
  for (const line of lines) {
    const d = el('div', 'st-line', parent);
    for (const s of line) {
      const e = s.tex != null ? el('bdi', 'm', d, tex(s.tex)) : el('span', s.phrase ? 'phr' : '', d, he(s.text ?? ''));
      if (s.tex != null) e.dir = 'ltr';
      if (s.key) {
        e.classList.add('given');
        e.dataset.key = s.key;
      }
    }
  }
  if (!q.text) {
    const ask = statement(problem).ask;
    if (ask) el('div', 'st-line st-ask', parent, he(ask));
  }
}

/** one practice question on the page; `next` gives the following one (or null when the queue is empty) */
export function renderPractice(
  page: HTMLElement,
  o: { head: string; back: { label: string; go: () => void }; next: () => PracticeQ | null; open: (q: PracticeQ) => void; left?: () => number },
) {
  const show = (q: PracticeQ | null) => {
    page.innerHTML = '';
    const wrap = el('div', 'pg', page);
    const back = el('button', 'pg-back', wrap, `→ ${he(o.back.label)}`);
    back.onclick = o.back.go;
    const h = el('div', 'pr-head2', wrap);
    el('h1', 'pg-h', h, he(o.head));
    if (o.left) el('div', 'pr-left', h, `נשארו ${o.left()}`);
    if (!q) {
      el('div', 'pr-empty', wrap, '✓ אין עוד שאלות לחזרה היום');
      return;
    }
    const card = el('section', 'pr-card', wrap);
    const qb = el('div', 'pr-q q-body', card);
    questionLines(qb, q);

    const parts: Part[] = partsOf(solve(parse(q.input)));
    const rows: { part: Part; get: () => string | number | null; row: HTMLElement }[] = [];
    const ans = el('div', 'pr-parts', card);
    for (const part of parts) {
      const row = el('div', 'pr-part', ans);
      if (part.kind === 'number') {
        const line = el('div', 'pr-row', row);
        line.dir = 'ltr';
        el('bdi', 'm', line, tex(part.label.slice(1, -1))).dir = 'ltr';
        const inp = el('input', 'pr-input', line) as HTMLInputElement;
        inp.inputMode = 'decimal';
        inp.autocomplete = 'off';
        inp.dir = 'ltr';
        el('bdi', 'm pr-unit', line, tex(`\\mathrm{${part.unit}}`)).dir = 'ltr';
        rows.push({ part, row, get: () => inp.value.trim() || null });
      } else {
        el('div', 'pr-label', row, he(part.label));
        const list = el('div', 'pr-choices', row);
        let picked: number | null = null;
        const bs = part.options.map((op, i) => {
          const b = el('button', 'pr-choice', list, he(op));
          b.onclick = () => {
            picked = i;
            bs.forEach((x, j) => x.classList.toggle('on', j === i));
          };
          return b;
        });
        rows.push({ part, row, get: () => picked });
      }
    }
    const res = el('div', 'pr-res', card);
    const btns = el('div', 'pr-btns', card);
    const bCheck = el('button', 'btn-primary', btns, 'בדיקה');
    const bSol = el('button', 'btn', btns, 'הפתרון צעד אחר צעד');
    const bNext = el('button', 'btn', btns, 'השאלה הבאה');
    bSol.onclick = () => o.open(q);
    bNext.onclick = () => show(o.next());
    let done = false;
    bCheck.onclick = () => {
      if (done) return;
      if (rows.some((r) => r.get() == null)) {
        res.className = 'pr-res';
        res.textContent = 'ענו על כל החלקים';
        return;
      }
      done = true;
      let all = true;
      for (const r of rows) {
        const v = r.get()!;
        const ok = r.part.kind === 'number' ? checkNumber(r.part, String(v)) : v === r.part.correct;
        all &&= ok;
        r.row.classList.add(ok ? 'ok' : 'no');
        if (!ok) el('div', 'pr-right', r.row, `התשובה: ${he(answerText(r.part))}`);
      }
      record(q.id, q.topic, all);
      res.className = `pr-res ${all ? 'ok' : 'no'}`;
      res.textContent = all ? '✓ הכל נכון. השאלה תחזור בעוד כמה ימים.' : '✗ לא הכל נכון. כדאי לראות את הפתרון; השאלה תחזור היום.';
      bCheck.disabled = true;
    };
  };
  show(o.next());
}
