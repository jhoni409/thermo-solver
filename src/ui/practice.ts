// Practice mode (phase 7): a random problem, the solution hidden until "show", a running score.

import { parse } from '../engine/parse';
import { solve } from '../engine/solve';
import { statement } from '../engine/statement';
import { practiceOf, checkNumber, answerText, type Practice } from '../engine/practice';
import { LIBRARY, type LibProblem } from '../library/problems';
import { generate, GEN_KINDS, type GenKind } from '../engine/generate';
import { el, he, math } from './dom';

const KEY = 'th-practice-score';

function loadScore(): { ok: number; n: number } {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '');
    if (typeof v.ok === 'number' && typeof v.n === 'number') return v;
  } catch {
    /* no storage */
  }
  return { ok: 0, n: 0 };
}
function saveScore(s: { ok: number; n: number }) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* no storage */
  }
}

type Mode = GenKind | 'any' | 'library';
const MODE_KEY = 'th-practice-mode';

export function openPractice(app: HTMLElement, show: (p: LibProblem) => void) {
  const wrap = el('div', 'dialog practice', app);
  const box = el('div', 'dialog-in', wrap);
  let score = loadScore();
  let last = '';
  let mode: Mode = 'any';
  try {
    const m = localStorage.getItem(MODE_KEY) as Mode | null;
    if (m && (m === 'any' || m === 'library' || GEN_KINDS.some((g) => g.kind === m))) mode = m;
  } catch {
    /* no storage */
  }

  const close = () => wrap.remove();
  wrap.onclick = (e) => e.target === wrap && close();
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      close();
      window.removeEventListener('keydown', onKey);
    }
  };
  window.addEventListener('keydown', onKey);

  const next = () => {
    let p: LibProblem;
    if (mode === 'library') {
      const pool = LIBRARY.filter((x) => x.id !== last);
      p = pool[Math.floor(Math.random() * pool.length)];
    } else p = generate(mode, Math.floor(Math.random() * 1e9));
    last = p.id;
    render(p);
  };

  const render = (lp: LibProblem) => {
    box.innerHTML = '';
    const head = el('div', 'pr-head', box);
    el('div', 'dialog-h', head, 'תרגול');
    const sc = el('div', 'pr-score', head, `${score.ok} / ${score.n}`);
    sc.title = 'נכונות / ניסיונות';
    const modes = el('div', 'pr-modes', box);
    const modeBtn = (m: Mode, label: string) => {
      const b = el('button', `pr-mode ${m === mode ? 'on' : ''}`, modes, he(label));
      b.onclick = () => {
        mode = m;
        try {
          localStorage.setItem(MODE_KEY, m);
        } catch {
          /* no storage */
        }
        next();
      };
    };
    modeBtn('any', '∞ מעורב');
    for (const g of GEN_KINDS) modeBtn(g.kind, g.he);
    modeBtn('library', 'מהאוסף');
    el('div', 'pr-title', box, he(lp.title));
    const problem = parse(lp.input);
    const sol = solve(problem);
    const st = statement(problem);
    const q = el('div', 'pr-q', box);
    for (const line of st.lines) {
      const ln = el('div', 'st-line', q);
      for (const s of line) {
        if (s.tex) {
          const b = el('bdi', 'm', ln, math(s.tex).innerHTML);
          b.setAttribute('dir', 'ltr');
        } else el('span', '', ln, '').textContent = s.text ?? '';
      }
    }
    el('div', 'st-line st-ask', q, he(st.ask));

    const pr: Practice = practiceOf(sol);
    const ans = el('div', 'pr-ans', box);
    const res = el('div', 'pr-res', box);
    const btns = el('div', 'dialog-btns', box);
    const bShow = el('button', 'btn-primary', btns, 'הצג פתרון');
    const bNext = el('button', 'btn', btns, 'שאלה אחרת');
    const bClose = el('button', 'btn', btns, 'סגירה');
    bShow.onclick = () => {
      close();
      show(lp);
    };
    bNext.onclick = next;
    bClose.onclick = close;

    let done = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      score = { ok: score.ok + (ok ? 1 : 0), n: score.n + 1 };
      saveScore(score);
      sc.textContent = `${score.ok} / ${score.n}`;
      res.className = `pr-res ${ok ? 'ok' : 'no'}`;
      res.innerHTML = (ok ? '✓ נכון' : '✗ לא נכון') + (pr.kind !== 'self' ? ` <span class="pr-right">התשובה: ${he(answerText(pr))}</span>` : '');
    };

    if (pr.kind === 'number') {
      const row = el('div', 'pr-row', ans);
      row.dir = 'ltr';
      math(pr.label.slice(1, -1), '', row);
      const inp = el('input', 'pr-input', row) as HTMLInputElement;
      inp.id = 'pr-input';
      inp.inputMode = 'decimal';
      inp.autocomplete = 'off';
      const ok = el('button', 'btn-primary', row, 'בדיקה');
      const go = () => inp.value.trim() && finish(checkNumber(pr, inp.value));
      ok.onclick = go;
      inp.onkeydown = (e) => e.key === 'Enter' && go();
      setTimeout(() => inp.focus(), 50);
    } else if (pr.kind === 'choice') {
      const picked = new Set<number>();
      const list = el('div', 'pr-choices', ans);
      const items = pr.options.map((o, i) => {
        const b = el('button', 'pr-choice', list, he(o));
        b.onclick = () => {
          if (done) return;
          if (!pr.multi) {
            picked.clear();
            picked.add(i);
            const right = pr.correct.length === 1 && pr.correct[0] === i;
            items.forEach((x, j) => x.classList.toggle('ok', pr.correct.includes(j)));
            b.classList.add(right ? 'ok' : 'no');
            finish(right);
          } else {
            if (picked.has(i)) picked.delete(i);
            else picked.add(i);
            b.classList.toggle('on', picked.has(i));
          }
        };
        return b;
      });
      if (pr.multi) {
        el('div', 'pr-hint', ans, 'בחרו את כל הנכונים');
        const chk = el('button', 'btn-primary', ans, 'בדיקה');
        chk.onclick = () => {
          const right = pr.correct.length === picked.size && pr.correct.every((i) => picked.has(i));
          items.forEach((x, j) => x.classList.toggle('ok', pr.correct.includes(j)));
          finish(right);
        };
      }
    } else {
      el('div', 'pr-hint', ans, 'כתבו את התשובה על דף, ואז פתחו את הפתרון.');
    }
  };

  next();
}

