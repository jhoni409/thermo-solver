// The learning map: every topic of the scope (BRIEF §4), in the order they build on each other.
// A topic = what it is (concept cards) → how exams ask it (phrases) → solved examples → practice.

export interface Topic {
  id: string;
  part: 'energy' | 'entropy';
  title: string; // Hebrew, may hold $TeX$
  goal: string; // one line: what you can do after it
  rules: string[]; // BRIEF §5
  /** solution types whose problems belong here */
  types: string[];
  /** the phrase tags this topic's questions use (dictionary page) */
  phrases: string[];
  /** the memory card: the recipe, one line per step */
  recipe?: string[];
  /** the recipe in one word per step, pinned over the solution, for each solution type */
  recipeShortOf?: Record<string, string[]>;
  built: boolean;
}

const S = (who: string) => `\\Delta S^\\circ_{\\text{${who}}}`;

const DH = '\\Delta H^\\circ';
const SURR = `$${S('סביבה')}$`;
const TOT = `$${S('יקום')}$`;
const SYS = `$${S('מערכת')}$`;

export const TOPICS: Topic[] = [
  // ---------------- energy (37381)
  {
    id: 'exo',
    part: 'energy',
    title: `אקסותרמי, אנדותרמי ו־$${DH}$`,
    goal: `לדעת מה אומר הסימן של $${DH}$, ולחשב כמה חום לכמות חומר`,
    rules: ['T1', 'T2', 'T3'],
    types: ['heat', 'mass-for-heat', 'dH-from-q', 'dH-new'],
    phrases: ['g:dH', 'g:M', 'g:q', 'g:released', 'g:new', 'a:q', 'a:mass', 'a:dH-mol', 'a:dH-new', 'v:show', 'v:explain'],
    recipe: [
      `$${DH} < 0$ ← אקסותרמית (חום נפלט); $${DH} > 0$ ← אנדותרמית (חום נבלע)`,
      'גרם ← מול: $n = \\dfrac{m}{M}$',
      `חום = $\\dfrac{n}{\\text{מקדם}} \\times |${DH}|$`,
      `תגובה הפוכה ← סימן הפוך; כפולה ב־2 ← $${DH}$ כפול 2`,
    ],
    recipeShortOf: {
      heat: ['מולים', '÷ מקדם', 'החום'],
      'mass-for-heat': ['מולים', '÷ מקדם', 'גרמים'],
      'dH-from-q': ['מולים', 'למקדם', 'הסימן'],
      'dH-new': ['מה השתנה', 'הכלל'],
    },
    built: true,
  },
  {
    id: 'phase',
    part: 'energy',
    title: `מצבי צבירה ו־$${DH}$`,
    goal: 'רתיחה, התכה, עיבוי: מתי נבלע חום ומתי נפלט',
    rules: ['T17'],
    types: ['phase-compare'],
    phrases: ['g:dH', 'g:new', 'g:opts', 'a:energy-cmp', 'a:choose', 'a:exo-endo', 'v:explain'],
    recipe: ['מה שונה? חומר אחד במצב צבירה אחר', 'מוצק ← נוזל ← גז: נבלע חום. גז ← נוזל ← מוצק: נפלט חום', `תוצר נוזל במקום גז ← נפלט עוד חום ← $${DH}$ שלילי יותר`],
    recipeShortOf: { 'phase-compare': ['מה השתנה', 'נבלע או נפלט'] },
    built: true,
  },
  {
    id: 'bonds',
    part: 'energy',
    title: 'אנרגיות קשר',
    goal: `$${DH}$ = קשרים שנשברים − קשרים שנוצרים`,
    rules: ['T6'],
    types: ['dH-bonds', 'bond-unknown'],
    phrases: ['g:table', 'g:dH', 'a:dH-bonds', 'a:bond', 'v:show'],
    recipe: ['נשברים: כל הקשרים במגיבים (מקדם × מספר קשרים × אנרגיה)', 'נוצרים: כל הקשרים בתוצרים', `$${DH}$ = נשברים − נוצרים`],
    recipeShortOf: { 'dH-bonds': ['נשברים', 'נוצרים', 'נשברים − נוצרים'], 'bond-unknown': ['נשברים', 'נוצרים', 'פותרים x'] },
    built: true,
  },
  {
    id: 'rate',
    part: 'energy',
    title: 'אנרגיית שפעול וזרז',
    goal: 'דיאגרמת אנרגיה: $E_a$ קדימה ואחורה, מה זרז משנה',
    rules: ['T8', 'T16'],
    types: ['diagram'],
    phrases: ['g:E', 'a:Ea', 'a:catalyst', 'v:show', 'v:explain'],
    recipe: [`$${DH}$ = תוצרים − מגיבים`, '$E_a$ קדימה = שיא − מגיבים; $E_a$ אחורה = שיא − תוצרים', `זרז: מוריד את השיא. $${DH}$ לא משתנה`],
    recipeShortOf: { diagram: [`$${DH}$`, '$E_a$', 'זרז'] },
    built: true,
  },
  // ---------------- entropy (37282)
  {
    id: 'dS-sign',
    part: 'entropy',
    title: 'מה זה אנטרופיה, והסימן של $\\Delta S^\\circ$',
    goal: `לקבוע מהניסוח אם ${SYS} חיובי, שלילי או לא ניתן לקבוע`,
    rules: ['T9'],
    types: ['dS-sign'],
    phrases: ['a:dS-sign', 'v:no-calc', 'v:explain'],
    recipe: ['סופרים מולי גז בכל צד (רק (g))', 'יותר מולי גז ← $\\Delta S^\\circ > 0$; פחות ← $\\Delta S^\\circ < 0$', 'אותו מספר ← לא ניתן לקבוע (השינוי קטן)'],
    recipeShortOf: { 'dS-sign': ['מולי גז', 'הסימן'] },
    built: true,
  },
  {
    id: 'dS-calc',
    part: 'entropy',
    title: `${SYS} מ־$S^\\circ$`,
    goal: 'תוצרים פחות מגיבים, וגם למצוא $S^\\circ$ חסר',
    rules: ['T13'],
    types: ['dS', 'S-unknown'],
    phrases: ['g:table', 'g:dS', 'a:dS', 'a:S0', 'v:show'],
    recipe: ['כל $S^\\circ$ כפול המקדם שלו', 'סכום לכל צד', `${SYS} = תוצרים − מגיבים (ל־$S^\\circ$ של יסוד יש ערך!)`],
    recipeShortOf: { dS: ['× מקדם', 'Σ לכל צד', 'תוצרים − מגיבים'], 'S-unknown': ['× מקדם', 'Σ לכל צד', 'פותרים x'] },
    built: true,
  },
  {
    id: 'dHf',
    part: 'entropy',
    title: `$${DH}$ מאנתלפיות התהוות`,
    goal: 'תוצרים פחות מגיבים, יסוד = 0',
    rules: ['T7'],
    types: ['dH-formation', 'dHf-unknown'],
    phrases: ['g:table', 'h:element', 'g:dH', 'a:dH', 'a:dHf', 'v:show'],
    recipe: ['כל $\\Delta H^\\circ_f$ כפול המקדם שלו (יסוד = 0)', 'סכום לכל צד', `$${DH}$ = תוצרים − מגיבים`],
    recipeShortOf: { 'dH-formation': ['× מקדם', 'Σ לכל צד', 'תוצרים − מגיבים'], 'dHf-unknown': ['× מקדם', 'Σ לכל צד', 'פותרים x'] },
    built: true,
  },
  {
    id: 'spont',
    part: 'entropy',
    title: `ספונטני? ${SURR} ו־${TOT}`,
    goal: 'לחשב סביבה ויקום, ולקבוע אם התהליך ספונטני',
    rules: ['T14', 'T15'],
    types: ['spontaneous'],
    phrases: ['g:dH', 'g:dS', 'g:T', 'g:table', 'h:room', 'h:same', 'a:surr', 'a:tot', 'a:spont', 'v:show', 'v:explain'],
    recipe: [`${SURR} $= -\\dfrac{${DH}}{T}$ (ב־J וב־K)`, `${TOT} $=$ ${SYS} $+$ ${SURR}`, `הסימן של ${TOT}: חיובי ← ספונטני, שלילי ← לא ספונטני`],
    recipeShortOf: { spontaneous: [SURR, TOT, 'הסימן'] },
    built: true,
  },
  {
    id: 'back',
    part: 'entropy',
    title: `בחזרה מ־${TOT}`,
    goal: `נתון ${TOT}: למצוא סביבה, מערכת או $${DH}$`,
    rules: ['T14', 'T15'],
    types: ['back'],
    phrases: ['g:dStot', 'g:dSsurr', 'g:dS', 'g:dH', 'g:T', 'h:room', 'a:dH-back', 'a:dS-back', 'v:show'],
    recipe: [`${SURR} $=$ ${TOT} $-$ ${SYS}`, `$${DH} = -T \\times$ ${SURR} (ב־J, ואז ל־kJ)`, `או הפוך: ${SURR} מ־$${DH}$, ואז ${SYS} $=$ ${TOT} $-$ ${SURR}`],
    recipeShortOf: { back: [`$${DH}$ ↔ סביבה`, 'יקום = מערכת + סביבה'] },
    built: true,
  },
  {
    id: 'signs',
    part: 'entropy',
    title: 'סימנים בלי חישוב',
    goal: 'מהסימנים בלבד: אקסו או אנדו, ספונטני או לא, מי גדול יותר',
    rules: ['T1', 'T9', 'T14', 'T15'],
    types: ['signs'],
    phrases: ['g:sign', 'h:spont', 'h:notspont', 'h:exo-word', 'h:endo-word', 'a:exo-endo', 'a:surr-dir', 'a:spont', 'a:compare', 'a:any-T', 'a:sys-sign', 'v:no-calc', 'v:explain'],
    recipe: [`$${DH}$ וסביבה: סימנים הפוכים`, `${TOT} $=$ ${SYS} $+$ ${SURR}: אותו סימן ← הסכום באותו סימן`, 'סימנים הפוכים ← הסימן של היקום = הסימן של הגדול'],
    recipeShortOf: { signs: ['סימן מסימן', 'מערכת + סביבה', 'המסקנה'] },
    built: true,
  },
  {
    id: 'kinetic',
    part: 'entropy',
    title: 'ספונטני, אבל לא קורה',
    goal: 'למה תגובה ספונטנית לא מתרחשת, ומה עושים',
    rules: ['T16'],
    types: ['kinetic'],
    phrases: ['h:spont', 'h:none', 'a:why-not', 'a:fix', 'a:cat-help', 'v:explain'],
    recipe: [`${TOT} $> 0$ ← יכולה לקרות (ספונטנית)`, 'לא קורה ← אנרגיית שפעול גבוהה', 'מחממים או מוסיפים זרז. זרז לא הופך תגובה לא ספונטנית לספונטנית'],
    recipeShortOf: { kinetic: [`הסימן של ${TOT}`, '$E_a$ גבוהה', 'חימום / זרז'] },
    built: true,
  },
];

export const PART_HE = { energy: 'אנרגיה (שאלון 37381)', entropy: 'אנטרופיה (שאלון 37282)' } as const;

export const topicById = (id: string) => TOPICS.find((t) => t.id === id);
export const topicOfType = (type: string) => TOPICS.find((t) => t.types.includes(type));
