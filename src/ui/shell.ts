// The app shell: top bar, the question and the list of steps (side), the board, prev / next,
// the library (with ∞ new problems), the input box, the original graph, keyboard help.

import { parse, InputError, EXAMPLE, type Problem } from '../engine/parse';
import { solve, type Solution } from '../engine/solve';
import { statement } from '../engine/statement';
import { generate, fromId, kindOfType, GEN_KINDS, type GenKind } from '../engine/generate';
import { LIBRARY, byId, type LibProblem } from '../library/problems';
import { lessonOf, type Step } from '../lesson/lessons';
import { Board, STAGE_HE } from '../lesson/board';
import { el, he, tex } from './dom';
import { Player, reducedMotion } from './player';
import { openPractice } from './practice';

const SPEEDS = [0.5, 0.75, 1, 1.5, 2];

/** a library problem, or a generated one (same shape) */
export type Meta = LibProblem & { kind?: GenKind };

interface Current {
  input: string;
  meta?: Meta;
  problem: Problem;
  sol: Solution;
  steps: Step[];
}

const store = {
  get(k: string): string | null {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set(k: string, v: string) {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* no storage */
    }
  },
};

const newSeed = () => Math.floor(Math.random() * 1e9);

export function startApp(root: HTMLElement) {
  root.innerHTML = '';
  const app = el('div', 'app', root);

  // ---------------- top bar
  const top = el('header', 'topbar', app);
  el('span', 'tb-title', top, 'אנרגיה ואנטרופיה');
  const probTitle = el('div', 'tb-prob', top);
  const acts = el('div', 'tb-acts', top);
  const btnLib = el('button', 'tb-btn', acts, 'אוסף שאלות');
  const btnMore = el('button', 'tb-btn accent', acts, '∞ שאלה חדשה');
  btnMore.title = 'שאלה חדשה מאותו סוג (N)';
  const btnPractice = el('button', 'tb-btn', acts, 'תרגול');
  // ∞ and practice come after every question type works (BRIEF §12)
  btnPractice.hidden = !GEN_KINDS.length;
  const btnMenu = el('button', 'tb-btn icon', acts, '⋯');
  btnMenu.setAttribute('aria-label', 'עוד');
  const menu = el('div', 'menu', app);
  menu.hidden = true;
  const btnEdit = el('button', 'menu-item', menu, '✎ הקלדת שאלה');
  const btnOrig = el('button', 'menu-item', menu, 'השאלה המקורית');
  const speedRow = el('div', 'menu-item speed-row', menu);
  el('span', '', speedRow, 'מהירות');
  const speedBox = el('div', 'speed', speedRow);
  const bSlow = el('button', 'sp-btn', speedBox, '−');
  const speedLab = el('span', 'sp-lab', speedBox, '1×');
  const bFast = el('button', 'sp-btn', speedBox, '+');
  const btnKeys = el('button', 'menu-item', menu, 'מקשים');
  const navP = el('div', 'menu-item speed-row', menu);
  el('span', '', navP, 'באוסף');
  const navPBox = el('div', 'speed', navP);
  const bPrevP = el('button', 'sp-btn wide', navPBox, '‹ הקודמת');
  const bNextP = el('button', 'sp-btn wide', navPBox, 'הבאה ›');

  // ---------------- main: the question and the steps (side), the board
  const main = el('div', 'main', app);
  const side = el('aside', 'side', main);
  const qBox = el('section', 'q-box', side);
  el('div', 'side-h', qBox, 'השאלה');
  const qBody = el('div', 'q-body', qBox);
  const stepsBox = el('nav', 'steps-box', side);
  el('div', 'side-h', stepsBox, 'הדרך');
  const stepList = el('ol', 'step-list', stepsBox);
  const boardWrap = el('div', 'board-wrap', main);
  const board = new Board(boardWrap);
  const errBox = el('div', 'err-box', boardWrap);
  errBox.hidden = true;

  // ---------------- bottom: why?, where we are, prev / auto / next
  const bottom = el('footer', 'bottom', app);
  const why = el('div', 'why', bottom);
  why.hidden = true;
  const btnWhy = el('button', 'btn-why', bottom, 'למה?');
  const where = el('div', 'where', bottom);
  const nav = el('div', 'nav', bottom);
  nav.dir = 'ltr';
  const bBack = el('button', 'nav-btn', nav, '←');
  bBack.setAttribute('aria-label', 'אחורה');
  const bPlay = el('button', 'nav-btn play', nav, '▶');
  bPlay.setAttribute('aria-label', 'ניגון אוטומטי');
  const bNext = el('button', 'nav-btn next', nav, 'הבא →');
  bNext.setAttribute('aria-label', 'קדימה');

  // ---------------- library drawer, with endless problems on top
  const lib = el('div', 'drawer', app);
  lib.hidden = true;
  const libIn = el('div', 'drawer-in', lib);
  el('div', 'drawer-h', libIn, 'אוסף שאלות');
  if (GEN_KINDS.length) el('div', 'lib-group', libIn, '∞ שאלה חדשה (בלי סוף)');
  const genBox = el('div', 'gen-grid', libIn);
  genBox.hidden = !GEN_KINDS.length;
  const genBtn = (k: GenKind | 'any', label: string) => {
    const b = el('button', 'gen-btn', genBox, he(label));
    b.onclick = () => {
      closeAll();
      loadGen(k);
    };
  };
  genBtn('any', 'מעורב');
  for (const g of GEN_KINDS) genBtn(g.kind, g.he);
  const groups = new Map<string, HTMLElement>();
  for (const p of LIBRARY) {
    if (!groups.has(p.group)) {
      el('div', 'lib-group', libIn, p.group);
      groups.set(p.group, el('div', 'lib-list', libIn));
    }
    const b = el('button', 'lib-item', groups.get(p.group)!, he(p.title));
    b.dataset.id = p.id;
    b.onclick = () => {
      closeAll();
      loadMeta(p);
    };
  }

  // ---------------- dialogs
  const dlg = el('div', 'dialog', app);
  dlg.hidden = true;
  const dlgIn = el('div', 'dialog-in', dlg);
  el('div', 'dialog-h', dlgIn, 'הקלדת שאלה');
  const ta = el('textarea', 'input', dlgIn) as HTMLTextAreaElement;
  ta.id = 'problem-input';
  ta.dir = 'ltr';
  ta.spellcheck = false;
  ta.rows = 8;
  const help = el('details', 'help', dlgIn);
  el('summary', '', help, 'פורמט');
  el(
    'pre',
    '',
    help,
    `rxn: N2(g) + 3H2(g) -> 2NH3(g)     (-> →)
dH = -92 kJ            (ΔH° של התגובה כפי שנכתבה)
dS = -199 J/K          (ΔS° של המערכת)
T = 298 K   |   T = 25 C   |   T = room
decimals = 1
ask: spontaneous`,
  ).dir = 'ltr';
  const dlgErr = el('div', 'dlg-err', dlgIn);
  const dlgBtns = el('div', 'dialog-btns', dlgIn);
  const bSolve = el('button', 'btn-primary', dlgBtns, 'פתרון');
  const bCancel = el('button', 'btn', dlgBtns, 'סגירה');

  const orig = el('div', 'dialog orig', app);
  orig.hidden = true;
  const origIn = el('div', 'dialog-in', orig);

  const keys = el('div', 'dialog keys', app);
  keys.hidden = true;
  const keysIn = el('div', 'dialog-in', keys);
  el('div', 'dialog-h', keysIn, 'מקשים');
  const kt = el('table', 'keys-table', keysIn);
  for (const [k, t] of [
    ['→ / רווח', 'השלב הבא'],
    ['←', 'השלב הקודם'],
    ['R', 'מההתחלה'],
    ['A', 'ניגון אוטומטי'],
    ['− / +', 'לאט יותר / מהר יותר'],
    ['N', 'עוד שאלה מאותו סוג'],
    ['W', 'למה?'],
    ['Esc', 'סגירה'],
  ]) {
    const tr = el('tr', '', kt);
    el('td', 'k', tr, k).dir = 'ltr';
    el('td', '', tr, t);
  }

  const closeAll = () => {
    lib.hidden = true;
    dlg.hidden = true;
    orig.hidden = true;
    keys.hidden = true;
    menu.hidden = true;
  };
  const anyOpen = () => !lib.hidden || !dlg.hidden || !orig.hidden || !keys.hidden || !menu.hidden || !!app.querySelector('.practice');
  btnMenu.onclick = (e) => {
    e.stopPropagation();
    const open = menu.hidden;
    closeAll();
    menu.hidden = !open;
  };
  document.addEventListener('click', (e) => {
    if (!menu.hidden && !(e.target as HTMLElement).closest('.menu')) menu.hidden = true;
  });
  lib.onclick = (e) => e.target === lib && closeAll();
  dlg.onclick = (e) => e.target === dlg && closeAll();
  orig.onclick = () => closeAll();
  keys.onclick = () => closeAll();
  btnLib.onclick = () => {
    closeAll();
    lib.hidden = false;
  };
  btnKeys.onclick = () => {
    closeAll();
    keys.hidden = false;
  };
  btnEdit.onclick = () => {
    closeAll();
    ta.value = cur?.input ?? EXAMPLE;
    dlgErr.textContent = '';
    dlg.hidden = false;
    ta.focus();
  };
  bCancel.onclick = closeAll;
  bSolve.onclick = () => {
    const err = tryLoad(ta.value);
    if (err) {
      dlgErr.innerHTML = '';
      el('div', 'err-line', dlgErr, he(err.he));
      if (err.example) (el('pre', 'err-ex', dlgErr, '') as HTMLElement).textContent = err.example;
    } else closeAll();
  };
  btnOrig.onclick = () => {
    if (!cur?.meta?.original) return;
    closeAll();
    origIn.innerHTML = '';
    el('div', 'dialog-h', origIn, 'השאלה המקורית');
    for (const f of cur.meta.original) {
      const img = el('img', 'orig-img', origIn) as HTMLImageElement;
      img.src = `${import.meta.env.BASE_URL}exam-graphs/${f}`;
      img.alt = 'השאלה המקורית';
    }
    orig.hidden = false;
  };
  btnPractice.onclick = () => {
    closeAll();
    player?.stop();
    openPractice(app, (p) => loadMeta(p));
  };
  btnMore.onclick = () => moreLikeThis();
  bPrevP.onclick = () => stepProblem(-1);
  bNextP.onclick = () => stepProblem(1);

  // ---------------- state
  let cur: Current | null = null;
  let player: Player | null = null;
  let speed = parseFloat(store.get('th-speed') ?? '1');
  if (!SPEEDS.includes(speed)) speed = 1;

  const setSpeed = (s: number) => {
    speed = s;
    speedLab.textContent = `${s}×`;
    if (player) player.rate = s;
    store.set('th-speed', String(s));
    bSlow.disabled = s === SPEEDS[0];
    bFast.disabled = s === SPEEDS[SPEEDS.length - 1];
  };
  const bump = (d: number) => setSpeed(SPEEDS[Math.max(0, Math.min(SPEEDS.length - 1, SPEEDS.indexOf(speed) + d))]);
  bSlow.onclick = (e) => {
    e.stopPropagation();
    bump(-1);
  };
  bFast.onclick = (e) => {
    e.stopPropagation();
    bump(1);
  };
  setSpeed(speed);

  // the question, with every given value marked so a step can light up what it uses
  function renderQuestion(p: Problem) {
    const st = statement(p);
    qBody.innerHTML = '';
    for (const line of st.lines) {
      const d = el('div', 'st-line', qBody);
      for (const s of line) {
        const e = s.tex != null ? el('bdi', 'm', d, tex(s.tex)) : el('span', '', d, he(s.text ?? ''));
        if (s.tex != null) e.dir = 'ltr';
        if (s.key) {
          e.classList.add('given');
          e.dataset.key = s.key;
        }
      }
    }
    if (st.ask) el('div', 'st-line st-ask', qBody, he(st.ask));
  }

  let items: HTMLElement[] = [];
  function renderSteps(steps: Step[]) {
    stepList.innerHTML = '';
    items = [];
    let last = -1;
    steps.forEach((s, k) => {
      if (s.stage !== last) {
        el('li', 'step-stage', stepList, STAGE_HE[s.stage]);
        last = s.stage;
      }
      const li = el('li', 'step-item', stepList);
      el('span', 'step-no', li, String(k + 1));
      el('span', 'step-t', li, he(s.title));
      li.onclick = () => player?.go(k);
      items.push(li);
    });
  }

  function onStep(i: number) {
    if (!cur) return;
    const s = cur.steps[i];
    items.forEach((li, k) => {
      li.classList.toggle('done', k < i);
      li.classList.toggle('cur', k === i);
    });
    items[i]?.scrollIntoView({ block: 'nearest' });
    const uses = new Set(s.uses ?? []);
    qBody.querySelectorAll<HTMLElement>('.given').forEach((g) => g.classList.toggle('hl', uses.has('*') || uses.has(g.dataset.key!)));
    where.innerHTML = `<span class="w-n">${i + 1} / ${cur.steps.length}</span><span class="w-t">${he(s.title)}</span>`;
    why.hidden = true;
    why.innerHTML = s.why ? s.why.split('\n').map((l) => `<div>${he(l)}</div>`).join('') : '';
    btnWhy.disabled = !s.why;
    bBack.disabled = i <= 0;
    bNext.disabled = i >= cur.steps.length - 1;
    bPlay.textContent = player?.autoOn ? '❚❚' : '▶';
    if (window.__eq) window.__eq.i = i;
  }

  function tryLoad(input: string, meta?: Meta): InputError | null {
    let problem: Problem;
    let sol: Solution;
    let steps: Step[];
    try {
      problem = parse(input);
      sol = solve(problem);
      steps = lessonOf(sol, problem);
    } catch (e) {
      if (e instanceof InputError) return e;
      return new InputError(`שגיאה: ${(e as Error).message}`);
    }
    cur = { input, meta, problem, sol, steps };
    errBox.hidden = true;
    probTitle.innerHTML = meta ? he(meta.title) + (meta.note ? `<span class="note">${he(meta.note)}</span>` : '') : 'שאלה מוקלדת';
    btnOrig.hidden = !meta?.original;
    btnMore.hidden = !kindOfType(sol.type);
    navP.hidden = !meta || LIBRARY.findIndex((p) => p.id === meta.id) < 0;
    try {
      // a bare #token is a deep link (library id, or g-kind-seed for a generated one)
      history.replaceState(null, '', meta ? `#${meta.id}` : location.pathname + location.search);
    } catch {
      /* sandboxed frame */
    }
    player?.destroy();
    renderQuestion(problem);
    renderSteps(steps);
    player = new Player(steps, board, onStep);
    player.rate = speed;
    try {
      player.go(0);
    } catch (e) {
      console.error(e);
      board.reset();
      showErr(new InputError('לא הצלחתי לבנות את הפתרון לשאלה הזו. בחרו שאלה אחרת.'));
    }
    return null;
  }

  function loadMeta(p: Meta) {
    const err = tryLoad(p.input, p);
    if (err) showErr(err);
  }

  function loadGen(k: GenKind | 'any') {
    loadMeta(generate(k, newSeed()));
  }

  function moreLikeThis() {
    if (!cur) return;
    const k = cur.meta?.kind ?? kindOfType(cur.sol.type);
    if (k) loadGen(k);
  }

  function stepProblem(d: number) {
    const li = cur?.meta ? LIBRARY.findIndex((p) => p.id === cur!.meta!.id) : -1;
    if (li < 0) return;
    loadMeta(LIBRARY[(li + d + LIBRARY.length) % LIBRARY.length]);
  }

  function showErr(err: InputError) {
    errBox.hidden = false;
    errBox.innerHTML = '';
    el('div', 'err-line', errBox, he(err.he));
    if (err.example) (el('pre', 'err-ex', errBox) as HTMLElement).textContent = err.example;
  }

  // ---------------- input
  const toggleAuto = () => player?.setAuto(!player.autoOn);
  bNext.onclick = () => player?.next();
  bBack.onclick = () => player?.back();
  bPlay.onclick = toggleAuto;
  btnWhy.onclick = () => (why.hidden = !why.hidden);

  window.addEventListener('keydown', (e) => {
    if ((e.target as HTMLElement).closest('textarea, input')) return;
    if (anyOpen()) {
      if (e.key === 'Escape') closeAll();
      return;
    }
    if (e.key === '?') {
      keys.hidden = false;
      return;
    }
    if (!player) return;
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      player.next();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      player.back();
    } else if (e.key === 'r' || e.key === 'R') player.restart();
    else if (e.key === 'a' || e.key === 'A') toggleAuto();
    else if (e.key === '-' || e.key === '_') bump(-1);
    else if (e.key === '+' || e.key === '=') bump(1);
    else if (e.key === 'n' || e.key === 'N') moreLikeThis();
    else if (e.key === 'w' || e.key === 'W') why.hidden = !why.hidden;
  });

  // swipe on the board: left = next, right = back
  let sx = 0;
  let sy = 0;
  boardWrap.addEventListener(
    'touchstart',
    (e) => {
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
    },
    { passive: true },
  );
  boardWrap.addEventListener(
    'touchend',
    (e) => {
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 50 && Math.abs(dx) > 1.5 * Math.abs(dy)) {
        if (dx < 0) player?.next();
        else player?.back();
      }
    },
    { passive: true },
  );
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => player && player.jump(player.i));

  // test hook for the screenshot and check scripts
  window.__eq = {
    i: -1,
    n: () => cur?.steps.length ?? 0,
    jump: (i: number) => player?.jump(i),
    load: (id: string) => {
      const p = byId(id) ?? fromId(id);
      if (p) loadMeta(p);
    },
    reduced: reducedMotion,
  };

  // ---------------- start
  loadFonts().then(() => {
    const id = new URLSearchParams(location.search).get('p') || location.hash.slice(1);
    const p: Meta = (id && (byId(id) ?? fromId(id))) || LIBRARY[0];
    loadMeta(p);
    const s = new URLSearchParams(location.search).get('step');
    if (s && player) player.jump(parseInt(s, 10));
    document.body.classList.add('ready');
  });
}

async function loadFonts() {
  const fams = ['20px KaTeX_Main', 'italic 20px KaTeX_Main', 'italic 20px KaTeX_Math', '20px KaTeX_AMS', '20px KaTeX_Size1', '20px KaTeX_Size2', '400 20px Heebo', '500 20px Heebo'];
  try {
    await Promise.race([Promise.all(fams.map((f) => document.fonts.load(f, 'אבג 123 ⇌'))), new Promise((r) => setTimeout(r, 2500))]);
    await document.fonts.ready;
  } catch {
    /* fonts are a nicety */
  }
}

declare global {
  interface Window {
    __eq?: {
      i: number;
      n: () => number;
      jump: (i: number) => void;
      load: (id: string) => void;
      reduced: () => boolean;
    };
  }
}
