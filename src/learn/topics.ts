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
  /** the same recipe in one word per step, pinned over the solution */
  recipeShort?: string[];
  built: boolean;
}

const S = (who: string) => `\\Delta S^\\circ_{\\text{${who}}}`;

export const TOPICS: Topic[] = [
  // ---------------- energy (37381)
  {
    id: 'exo',
    part: 'energy',
    title: 'אקסותרמי, אנדותרמי ו־$\\Delta H^\\circ$',
    goal: 'לדעת מה אומר הסימן של $\\Delta H^\\circ$ ומה הקשר לחום',
    rules: ['T1', 'T2', 'T3'],
    types: [],
    phrases: [],
    built: false,
  },
  {
    id: 'phase',
    part: 'energy',
    title: 'מצבי צבירה ו־$\\Delta H^\\circ$',
    goal: 'רתיחה, התכה, עיבוי: מתי נבלע חום ומתי נפלט',
    rules: ['T17'],
    types: [],
    phrases: [],
    built: false,
  },
  {
    id: 'bonds',
    part: 'energy',
    title: 'אנרגיות קשר',
    goal: '$\\Delta H^\\circ$ = קשרים שנשברים − קשרים שנוצרים',
    rules: ['T6'],
    types: [],
    phrases: [],
    built: false,
  },
  {
    id: 'rate',
    part: 'energy',
    title: 'אנרגיית שפעול וזרז',
    goal: 'דיאגרמת אנרגיה: $E_a$ קדימה ואחורה, מה זרז משנה',
    rules: ['T8', 'T16'],
    types: [],
    phrases: [],
    built: false,
  },
  // ---------------- entropy (37282)
  {
    id: 'dS-sign',
    part: 'entropy',
    title: 'מה זה אנטרופיה, והסימן של $\\Delta S^\\circ$',
    goal: 'לקבוע מהניסוח אם $' + S('מערכת') + '$ חיובי, שלילי או לא ניתן לקבוע',
    rules: ['T9'],
    types: [],
    phrases: [],
    built: false,
  },
  {
    id: 'dS-calc',
    part: 'entropy',
    title: '$' + S('מערכת') + '$ מ־$S^\\circ$',
    goal: 'תוצרים פחות מגיבים, וגם למצוא $S^\\circ$ חסר',
    rules: ['T13'],
    types: [],
    phrases: [],
    built: false,
  },
  {
    id: 'dHf',
    part: 'entropy',
    title: '$\\Delta H^\\circ$ מאנתלפיות התהוות',
    goal: 'תוצרים פחות מגיבים, יסוד = 0',
    rules: ['T7'],
    types: [],
    phrases: [],
    built: false,
  },
  {
    id: 'spont',
    part: 'entropy',
    title: 'ספונטני? $' + S('סביבה') + '$ ו־$' + S('יקום') + '$',
    goal: 'לחשב סביבה ויקום, ולקבוע אם התהליך ספונטני',
    rules: ['T14', 'T15'],
    types: ['spontaneous'],
    phrases: ['g:dH', 'g:dS', 'g:T', 'h:room', 'h:same', 'a:surr', 'a:tot', 'a:spont', 'v:show', 'v:explain'],
    recipeShort: [`$${S('סביבה')}$`, `$${S('יקום')}$`, 'הסימן'],
    recipe: [`$${S('סביבה')} = -\\dfrac{\\Delta H^\\circ}{T}$ (ב־J וב־K)`, `$${S('יקום')} = ${S('מערכת')} + ${S('סביבה')}$`, `הסימן של $${S('יקום')}$: חיובי ← ספונטני, שלילי ← לא ספונטני`],
    built: true,
  },
  {
    id: 'back',
    part: 'entropy',
    title: 'בחזרה מ־$' + S('יקום') + '$',
    goal: 'נתון $' + S('יקום') + '$: למצוא סביבה, מערכת או $\\Delta H^\\circ$',
    rules: ['T14', 'T15'],
    types: [],
    phrases: [],
    built: false,
  },
  {
    id: 'signs',
    part: 'entropy',
    title: 'סימנים בלי חישוב',
    goal: 'מהסימנים בלבד: אקסו או אנדו, ספונטני או לא',
    rules: ['T1', 'T14', 'T15'],
    types: [],
    phrases: [],
    built: false,
  },
  {
    id: 'kinetic',
    part: 'entropy',
    title: 'ספונטני, אבל לא קורה',
    goal: 'למה תגובה ספונטנית לא מתרחשת, ומה עושים',
    rules: ['T16'],
    types: [],
    phrases: [],
    built: false,
  },
];

export const PART_HE = { energy: 'אנרגיה (שאלון 37381)', entropy: 'אנטרופיה (שאלון 37282)' } as const;

export const topicById = (id: string) => TOPICS.find((t) => t.id === id);
export const topicOfType = (type: string) => TOPICS.find((t) => t.types.includes(type));
