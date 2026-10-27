// The app shell: top bar, and the views it switches between:
//   home (the learning map) · topic · dictionary of exam wordings · practice / review   → the page area
//   a lesson (a solved problem, or a topic's "what is it")                               → side + board + bottom bar
// Routes are hashes: #t:spont, #c:spont, #d:spont, #pr:spont, #review, #S1, #g-spontaneous-123 ('' = home).

import { parse, InputError, EXAMPLE, type Problem } from '../engine/parse';
import { solve } from '../engine/solve';
import { statement, type Seg } from '../engine/statement';
import { textLines } from '../engine/text';
import { generate, fromId, GEN_KINDS } from '../engine/generate';
import { LIBRARY, byId, type LibProblem } from '../library/problems';
import { lessonOf, type Step } from '../lesson/lessons';
import { Board, STAGE_HE } from '../lesson/board';
import { topicById, topicOfType } from '../learn/topics';
import { conceptOf } from '../learn/concepts';
import { markConcept, markSolved, setLast, dueItems, load } from '../learn/progress';
import { el, he, tex } from './dom';
import { Player, reducedMotion } from './player';
import { renderHome, renderTopic, renderDict, type Nav } from './home';
import { renderPractice, type PracticeQ } from './practice';

const SPEEDS = [0.5, 0.75, 1, 1.5, 2];

/** a library problem, or a generated one */
export type Meta = Omit<LibProblem, 'group'> & { group?: string };

interface Lesson {
  title: string;
  steps: Step[];
  lines?: Seg[][]; // the question panel (none for a concept lesson)
  ask?: string;
  meta?: Meta;
  topic?: string;
  onEnd?: () => void;
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
const metaOf = (id: string): Meta | null => byId(id) ?? fromId(id);

export function startApp(root: HTMLElement) {
  root.innerHTML = '';
  const app = el('div', 'app mode-home', root);

  // ---------------- top bar
  const top = el('header', 'topbar', app);
  const title = el('button', 'tb-title', top, 'אנרגיה ואנטרופיה');
  const crumb = el('div', 'tb-prob', top);
  const acts = el('div', 'tb-acts', top);
  const btnMap = el('button', 'tb-btn', acts, 'מפת הלימוד');
  const btnRev = el('button', 'tb-btn accent', acts, 'חזרה');
  const btnMenu = el('button', 'tb-btn icon', acts, '⋯');
  btnMenu.setAttribute('aria-label', 'עוד');
  const menu = el('div', 'menu', app);
  menu.hidden = true;
  const btnMore = el('button', 'menu-item', menu, '∞ שאלה חדשה מאותו סוג');
  const btnEdit = el('button', 'menu-item', menu, '✎ הקלדת שאלה');
  const btnOrig = el('button', 'menu-item', menu, 'השאלה המקורית');
  const speedRow = el('div', 'menu-item speed-row', menu);
  el('span', '', speedRow, 'מהירות');
  const speedBox = el('div', 'speed', speedRow);
  const bSlow = el('button', 'sp-btn', speedBox, '−');
  const speedLab = el('span', 'sp-lab', speedBox, '1×');
  const bFast = el('button', 'sp-btn', speedBox, '+');
  const btnKeys = el('button', 'menu-item', menu, 'מקשים');

  // ---------------- page area (map, topic, dictionary, practice)
  const page = el('div', 'page', app);

  // ---------------- lesson: the question and the steps (side), the board
  const main = el('div', 'main', app);
  const side = el('aside', 'side', main);
  const qBox = el('section', 'q-box', side);
  const qHead = el('div', 'side-h', qBox, 'השאלה');
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
    ['W', 'למה?'],
    ['Esc', 'סגירה'],
  ]) {
    const tr = el('tr', '', kt);
    el('td', 'k', tr, k).dir = 'ltr';
    el('td', '', tr, t);
  }

  const closeAll = () => {
    dlg.hidden = true;
    orig.hidden = true;
    keys.hidden = true;
    menu.hidden = true;
  };
  const anyOpen = () => !dlg.hidden || !orig.hidden || !keys.hidden || !menu.hidden;
  btnMenu.onclick = (e) => {
    e.stopPropagation();
    const open = menu.hidden;
    closeAll();
    menu.hidden = !open;
  };
  document.addEventListener('click', (e) => {
    if (!menu.hidden && !(e.target as HTMLElement).closest('.menu')) menu.hidden = true;
  });
  dlg.onclick = (e) => e.target === dlg && closeAll();
  orig.onclick = () => closeAll();
  keys.onclick = () => closeAll();
  btnKeys.onclick = () => {
    closeAll();
    keys.hidden = false;
  };
  btnEdit.onclick = () => {
    closeAll();
    ta.value = cur?.meta?.input ?? EXAMPLE;
    dlgErr.textContent = '';
    dlg.hidden = false;
    ta.focus();
  };
  bCancel.onclick = closeAll;
  bSolve.onclick = () => {
    const err = openTyped(ta.value);
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
  btnMore.onclick = () => {
    closeAll();
    const k = GEN_KINDS.find((g) => g.topic === cur?.topic);
    if (k) go(`#${generate(k.kind, newSeed()).id}`);
  };

  // ---------------- state
  let cur: Lesson | null = null;
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

  const setMode = (m: 'home' | 'lesson') => {
    app.classList.toggle('mode-home', m === 'home');
    app.classList.toggle('mode-lesson', m === 'lesson');
    if (m === 'home') {
      player?.destroy();
      player = null;
      cur = null;
    }
    const due = dueItems().length;
    btnRev.textContent = due ? `חזרה (${due})` : 'חזרה';
  };
  const setCrumb = (parts: string[]) => {
    crumb.innerHTML = parts.map((p) => he(p)).join('<span class="sep"> ‹ </span>');
  };

  // the question, with every given value and exam phrase marked so a step can light up what it uses
  function renderQuestion(lines: Seg[][] | undefined, ask?: string) {
    qBody.innerHTML = '';
    qBox.hidden = !lines;
    if (!lines) return;
    for (const line of lines) {
      const d = el('div', 'st-line', qBody);
      for (const s of line) {
        const e = s.tex != null ? el('bdi', 'm', d, tex(s.tex)) : el('span', s.phrase ? 'phr' : '', d, he(s.text ?? ''));
        if (s.tex != null) e.dir = 'ltr';
        if (s.key) {
          e.classList.add('given');
          e.dataset.key = s.key;
        }
      }
    }
    if (ask) el('div', 'st-line st-ask', qBody, he(ask));
  }

  let items: HTMLElement[] = [];
  function renderSteps(steps: Step[]) {
    stepList.innerHTML = '';
    items = [];
    let last = '';
    steps.forEach((s, k) => {
      const g = s.group ?? STAGE_HE[s.stage];
      if (g !== last) {
        el('li', 'step-stage', stepList, g);
        last = g;
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
    const end = i >= cur.steps.length - 1;
    bNext.textContent = end ? (cur.topic ? 'סיום ✓' : 'הבא →') : 'הבא →';
    bNext.disabled = end && !cur.topic;
    bNext.classList.toggle('end', end && !!cur.topic);
    bPlay.textContent = player?.autoOn ? '❚❚' : '▶';
    if (end) cur.onEnd?.();
    if (window.__eq) window.__eq.i = i;
  }

  function showLesson(l: Lesson) {
    setMode('lesson');
    cur = l;
    errBox.hidden = true;
    qHead.textContent = 'השאלה';
    btnOrig.hidden = !l.meta?.original;
    btnMore.hidden = !GEN_KINDS.some((g) => g.topic === l.topic) || !l.meta;
    player?.destroy();
    renderQuestion(l.lines, l.ask);
    renderSteps(l.steps);
    player = new Player(l.steps, board, onStep);
    player.rate = speed;
    try {
      player.go(0);
    } catch (e) {
      console.error(e);
      board.reset();
      showErr(new InputError('לא הצלחתי לבנות את הפתרון לשאלה הזו. בחרו שאלה אחרת.'));
    }
  }

  function build(input: string, text?: string) {
    const problem: Problem = parse(input);
    const sol = solve(problem);
    const steps = lessonOf(sol, problem, text);
    const st = statement(problem);
    return { problem, sol, steps, lines: text ? textLines(text, problem) : st.lines, ask: text ? undefined : st.ask };
  }

  function openProblem(meta: Meta, back?: string) {
    try {
      const b = build(meta.input, meta.text);
      const topic = meta.topic ?? topicOfType(b.sol.type)?.id;
      const t = topic ? topicById(topic) : undefined;
      setCrumb([...(t ? [t.title] : []), meta.title]);
      showLesson({
        title: meta.title,
        steps: b.steps,
        lines: b.lines,
        ask: b.ask,
        meta,
        topic,
        onEnd: () => markSolved(meta.id),
      });
      returnTo = back ?? (topic ? `#t:${topic}` : '');
    } catch (e) {
      setMode('lesson');
      showErr(e instanceof InputError ? e : new InputError(`שגיאה: ${(e as Error).message}`));
    }
  }

  function openTyped(input: string): InputError | null {
    try {
      const b = build(input);
      setCrumb(['שאלה מוקלדת']);
      showLesson({ title: 'שאלה מוקלדת', steps: b.steps, lines: b.lines, ask: b.ask });
      return null;
    } catch (e) {
      if (e instanceof InputError) return e;
      return new InputError(`שגיאה: ${(e as Error).message}`);
    }
  }

  function showErr(err: InputError) {
    errBox.hidden = false;
    errBox.innerHTML = '';
    el('div', 'err-line', errBox, he(err.he));
    if (err.example) (el('pre', 'err-ex', errBox) as HTMLElement).textContent = err.example;
  }

  // ---------------- practice queues
  const toQ = (m: Meta): PracticeQ => ({ id: m.id, topic: m.topic, input: m.input, text: m.text, title: m.title });

  function topicQueue(topic: string): () => PracticeQ | null {
    let i = 0;
    return () => {
      // first the library questions not practised yet, then endless new ones
      const fresh = LIBRARY.filter((p) => p.topic === topic && !load().items[p.id]);
      if (fresh.length) return toQ(fresh[0]);
      const k = GEN_KINDS.find((g) => g.topic === topic);
      return k ? toQ(generate(k.kind, newSeed() + i++)) : null;
    };
  }

  function reviewQueue(): () => PracticeQ | null {
    return () => {
      const d = dueItems()[0];
      const m = d ? metaOf(d.id) : null;
      return m ? toQ(m) : null;
    };
  }

  // ---------------- routes
  let returnTo = '';
  const go = (hash: string) => {
    if (location.hash === hash || (!hash && !location.hash)) route();
    else location.hash = hash;
  };

  const navApi: Nav = {
    home: () => go(''),
    topic: (id) => go(`#t:${id}`),
    concept: (id) => go(`#c:${id}`),
    problem: (id) => go(`#${id}`),
    practice: (id) => go(`#pr:${id}`),
    review: () => go('#review'),
    dict: (id) => go(`#d:${id}`),
    go,
  };

  function route(from = '') {
    const h = decodeURIComponent(location.hash.slice(1));
    closeAll();
    let m: RegExpExecArray | null;
    if (!h || h === 'map') {
      setMode('home');
      setCrumb(['מפת הלימוד']);
      renderHome(page, navApi);
      return;
    }
    if ((m = /^(t|c|d|pr):(.+)$/.exec(h))) {
      const t = topicById(m[2]);
      if (!t) return go('');
      setLast(`#${h}`);
      if (m[1] === 't') {
        setMode('home');
        setCrumb([t.title]);
        renderTopic(page, t, navApi);
      } else if (m[1] === 'd') {
        setMode('home');
        setCrumb([t.title, 'איך שואלים']);
        renderDict(page, t, navApi);
      } else if (m[1] === 'pr') {
        setMode('home');
        setCrumb([t.title, 'תרגול']);
        renderPractice(page, {
          head: `תרגול: ${t.title}`,
          back: { label: t.title, go: () => navApi.topic(t.id) },
          next: topicQueue(t.id),
          open: (q) => go(`#${q.id}`),
        });
      } else {
        const steps = conceptOf(t.id);
        if (!steps) return go(`#t:${t.id}`);
        setCrumb([t.title, 'מה זה']);
        showLesson({ title: 'מה זה', steps, topic: t.id, onEnd: () => markConcept(t.id) });
        returnTo = `#t:${t.id}`;
      }
      return;
    }
    if (h === 'review') {
      setMode('home');
      setCrumb(['חזרה להיום']);
      renderPractice(page, {
        head: 'חזרה להיום',
        back: { label: 'מפת הלימוד', go: () => navApi.home() },
        next: reviewQueue(),
        open: (q) => go(`#${q.id}`),
        left: () => dueItems().length,
      });
      return;
    }
    const meta = metaOf(h);
    if (meta) {
      setLast(`#${h}`);
      // opened from practice or review → "סיום" goes back there
      openProblem(meta, from.startsWith('#pr:') || from === '#review' ? from : undefined);
      return;
    }
    go('');
  }

  let prevHash = location.hash;
  window.addEventListener('hashchange', () => {
    const from = prevHash;
    prevHash = location.hash;
    route(from);
  });

  title.onclick = () => navApi.home();
  btnMap.onclick = () => navApi.home();
  btnRev.onclick = () => navApi.review();

  // ---------------- input
  const toggleAuto = () => player?.setAuto(!player.autoOn);
  bNext.onclick = () => {
    if (!player || !cur) return;
    if (player.i >= cur.steps.length - 1 && cur.topic) go(returnTo || `#t:${cur.topic}`);
    else player.next();
  };
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
    load: (id: string) => go(`#${id}`),
    reduced: reducedMotion,
  };

  // ---------------- start
  loadFonts().then(() => {
    const p = new URLSearchParams(location.search).get('p');
    if (p) {
      history.replaceState(null, '', `${location.pathname}${location.search}#${p}`);
      prevHash = location.hash;
    }
    route();
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
