// The exam-wording dictionary: every phrase an exam uses, what it means, and what to do with it.
// Wordings come from the official bagrut papers 37282 / 37381 (2021–2026), the user's course, and the מיקוד.
// Each phrase in a question text is marked «wording|tag» and decoded in the first cards of the lesson.

import type { Problem } from '../engine/parse';
import { num } from '../engine/format';
import { toKelvin } from '../engine/solve';

export type PhraseKind = 'given' | 'hidden' | 'ask' | 'verb';

export interface Phrase {
  kind: PhraseKind;
  /** what it means, Hebrew with $TeX$; may use the problem's values */
  means: (p: Problem) => string;
  /** what to do with it (short) */
  todo?: string;
  /** other wordings of the same thing, seen in the exams (for the dictionary page) */
  also?: string[];
}

const DS = (who: string) => `\\Delta S^\\circ_{\\text{${who}}}`;
const SURR = DS('סביבה');
const SYS = DS('מערכת');
const TOT = DS('יקום');
const tempMeans = (p: Problem) => {
  if (!p.T || p.T.unit === 'room') return '$T$';
  const { TC, TK } = toKelvin(p.T);
  return TC ? `$T = ${num(TC)} + 273 = ${num(TK)}\\,\\mathrm{K}$` : `$T = ${num(TK)}\\,\\mathrm{K}$`;
};

export const PHRASES: Record<string, Phrase> = {
  // ---------------- givens
  'g:dH': {
    kind: 'given',
    means: (p) => (p.dH ? `$\\Delta H^\\circ = ${num(p.dH.v)}\\,\\mathrm{${p.dH.unit}}$` : '$\\Delta H^\\circ$'),
    todo: 'שינוי האנתלפיה של התגובה, כפי שהיא כתובה',
    also: ['שינוי האנתלפיה', 'השינוי באנתלפיה', 'שינוי האנתלפייה', '$\\Delta H^\\circ$'],
  },
  'g:dS': {
    kind: 'given',
    means: (p) => (p.dSsys != null ? `$${SYS} = ${num(p.dSsys)}\\,\\mathrm{J/K}$` : `$${SYS}$`),
    todo: 'שינוי האנטרופיה של המערכת',
    also: ['שינוי האנטרופיה של המערכת', 'השינוי באנטרופיה של המערכת', '$\\Delta S^\\circ$ מערכת'],
  },
  'g:T': { kind: 'given', means: tempMeans, todo: 'הטמפרטורה (בנוסחה תמיד בקלווין)', also: ['בטמפרטורה של', 'בטמפרטורה', 'ב־...K'] },
  'g:dStot': {
    kind: 'given',
    means: (p) => (p.dStot != null ? `$${TOT} = ${num(p.dStot)}\\,\\mathrm{J/K}$` : `$${TOT}$`),
    todo: 'נתון היקום: הולכים אחורה במתכון',
    also: ['השינוי באנטרופיה של היקום', '$\\Delta S^\\circ$ יקום', '$\\Delta S^\\circ_t$', 'TOTAL'],
  },
  'g:dSsurr': {
    kind: 'given',
    means: (p) => (p.dSsurr != null ? `$${SURR} = ${num(p.dSsurr)}\\,\\mathrm{J/K}$` : `$${SURR}$`),
    todo: `נתון הסביבה: $\\Delta H^\\circ = -T \\times ${SURR}$`,
    also: ['השינוי באנטרופיה של הסביבה', '$\\Delta S^\\circ$ סביבה'],
  },
  'g:table': {
    kind: 'given',
    means: (p) => (p.S0?.size && p.dHf?.size ? 'ערכי $S^\\circ$ וערכי $\\Delta H^\\circ_f$ למול' : p.S0?.size ? 'ערכי $S^\\circ$ למול של כל חומר' : p.dHf?.size ? 'ערכי $\\Delta H^\\circ_f$ למול של כל חומר' : 'אנרגיות קשר, למול קשרים'),
    todo: 'כל ערך הוא למול אחד: כופלים במקדם',
    also: ['בטבלה שלפניכם מוצגים ערכים', 'אנטרופיה מולרית תקנית', 'אנתלפיית התהוות תקנית', 'אנתלפית היווצרות מולרית תקנית', 'אנתלפיית הקשר'],
  },
  'g:E': { kind: 'given', means: () => 'הגובה של המגיבים, השיא והתוצרים', todo: 'כל גודל בדיאגרמה = הפרש בין שני גבהים' },
  'g:sign': { kind: 'given', means: () => 'רק סימנים, בלי מספרים', todo: 'מסיקים סימן מסימן' },
  'g:mass': { kind: 'given', means: (p) => (p.m?.size ? `$m = ${num([...p.m.values()][0])}\\,\\mathrm{g}$` : 'מסה בגרם'), todo: 'גרם ← מול: מחלקים ב־$M$' },
  'g:M': { kind: 'given', means: (p) => (p.M?.size ? `$M = ${num([...p.M.values()][0])}\\,\\mathrm{g/mol}$` : 'מסה מולרית'), todo: 'גרם למול' },
  'g:q': { kind: 'given', means: (p) => (p.q ? `$q = ${num(p.q)}\\,\\mathrm{kJ}$` : 'כמות חום'), todo: 'החום, בלי סימן' },
  'g:released': {
    kind: 'given',
    means: (p) => (p.qDir === 'absorbed' ? 'נבלע חום ← $\\Delta H^\\circ > 0$' : 'נפלט חום ← $\\Delta H^\\circ < 0$'),
    todo: 'הסימן מגיע מהמילה, לא מהמספר',
    also: ['נפלטה', 'משתחררת', 'נבלעה', 'נבלעים'],
  },
  'g:new': { kind: 'given', means: () => 'תגובה שנייה להשוואה', todo: 'מחפשים מה השתנה בה' },
  'g:cat': { kind: 'given', means: () => 'זרז: מקטין את $E_a$', todo: 'האנרגייה של החלקיקים לא משתנה; $\\Delta H^\\circ$ לא משתנה', also: ['בנוכחות זרז', 'מוסיפים זרז מתאים'] },
  'g:stmts': { kind: 'given', means: () => 'כמה משפטים; רק אחד נכון', todo: 'בודקים כל משפט מול הכלל', also: ['לפניך שני היגדים', 'נתונים שני היגדים'] },
  'g:opts': { kind: 'given', means: () => 'ערכים לבחירה', todo: 'רק אחד מתאים לכלל' },
  // a value written with no words around it
  's:dH': { kind: 'given', means: () => 'שינוי האנתלפיה של התגובה, כפי שהיא כתובה' },
  's:dS': { kind: 'given', means: () => `זה $${SYS}$`, todo: '$\\Delta S^\\circ$ בלי מילה = של המערכת (התגובה)' },
  's:T': { kind: 'given', means: tempMeans, todo: 'הטמפרטורה (בנוסחה תמיד בקלווין)' },
  's:dStot': { kind: 'given', means: (p) => PHRASES['g:dStot'].means(p), todo: PHRASES_TODO_TOT() },
  's:dSsurr': { kind: 'given', means: (p) => PHRASES['g:dSsurr'].means(p), todo: `$\\Delta H^\\circ = -T \\times ${SURR}$` },
  's:table': { kind: 'given', means: (p) => PHRASES['g:table'].means(p), todo: 'כל ערך הוא למול אחד: כופלים במקדם' },
  's:E': { kind: 'given', means: () => 'הגובה של המגיבים, השיא והתוצרים', todo: 'כל גודל בדיאגרמה = הפרש בין שני גבהים' },
  's:sign': { kind: 'given', means: () => 'רק סימנים, בלי מספרים', todo: 'מסיקים סימן מסימן' },
  // ---------------- hidden givens
  'h:room': { kind: 'hidden', means: () => '$T = 25 + 273 = 298\\,\\mathrm{K}$', todo: 'נתון נסתר: אין מספר, אבל יש טמפרטורה', also: ['בטמפרטורת החדר', 'בטמפרטורת חדר', 'בתנאי חדר'] },
  'h:std': { kind: 'hidden', means: () => 'כל החומרים במצב תקני ($^\\circ$)', todo: 'לא משנה את החישוב; הטמפרטורה כתובה לידו', also: ['בתנאי תקן', 'תקנית'] },
  'h:same': { kind: 'hidden', means: () => 'באותה טמפרטורה שכתובה בשאלה', todo: 'לא מחליפים טמפרטורה', also: ['בתנאים אלו', 'בתנאים הנתונים'] },
  'h:element': { kind: 'hidden', means: () => 'יסוד במצב תקני: $\\Delta H^\\circ_f = 0$', todo: 'הקו בטבלה הוא 0, לא "חסר"', also: ['–'] },
  'h:spont': { kind: 'hidden', means: () => `$${TOT} > 0$`, todo: 'ספונטני = היקום עולה', also: ['תגובה (1) ספונטנית', 'היא תגובה ספונטנית'] },
  'h:notspont': { kind: 'hidden', means: () => `$${TOT} < 0$`, todo: 'לא ספונטני = היקום יורד', also: ['אינה ספונטנית'] },
  'h:none': { kind: 'hidden', means: () => 'התגובה לא מתרחשת בפועל', todo: 'ספונטני ≠ קורה מהר', also: ['לא התקבלו תוצרים', 'נשמרת לאורך זמן ללא שינוי'] },
  'h:spark': { kind: 'hidden', means: () => 'משקיעים אנרגייה: לחלקיקים יש יותר אנרגייה קינטית', todo: 'כמו חימום: $E_a$ לא משתנה', also: ['הפעלת ניצוץ חשמלי', 'השקעת אנרגייה'] },
  'h:hot': { kind: 'hidden', means: () => 'טמפרטורה גבוהה = לחלקיקים יש יותר אנרגייה קינטית', todo: '$E_a$ לא משתנה; יותר חלקיקים מגיעים אליה', also: ['כאשר מחממים', 'בטמפרטורה גבוהה'] },
  'h:exo-word': { kind: 'hidden', means: () => '$\\Delta H^\\circ < 0$', todo: 'פולטת חום = אקסותרמית', also: ['פולטת חום', 'אקסותרמית'] },
  'h:endo-word': { kind: 'hidden', means: () => '$\\Delta H^\\circ > 0$', todo: 'בולעת חום = אנדותרמית', also: ['בולעת חום', 'אנדותרמית'] },
  // ---------------- asks
  'a:surr': {
    kind: 'ask',
    means: () => `מחפשים $${SURR}$`,
    todo: `$${SURR} = -\\dfrac{\\Delta H^\\circ}{T}$`,
    also: ['שינוי האנטרופיה של הסביבה', 'שינוי האנטרופיה בסביבה', '$\\Delta S^\\circ$ סביבה', 'שינוי האנטרופיה התקנית של הסביבה'],
  },
  'a:surr-dir': { kind: 'ask', means: () => `הסימן של $${SURR}$`, todo: '$\\Delta H^\\circ < 0$ ← עולה; $\\Delta H^\\circ > 0$ ← יורדת', also: ['האנטרופיה של הסביבה עולה או יורדת', 'הסבירו את סימנו של שינוי האנטרופיה של הסביבה'] },
  'a:tot': { kind: 'ask', means: () => `מחפשים $${TOT}$`, todo: `$${TOT} = ${SYS} + ${SURR}$`, also: ['שינוי האנטרופיה של היקום', '$\\Delta S^\\circ$ יקום', '$\\Delta S^\\circ$ כולל', 'TOTAL', '$\\Delta S^\\circ_t$'] },
  'a:spont': {
    kind: 'ask',
    means: () => `צריך את הסימן של $${TOT}$`,
    todo: `$${TOT} > 0$ ← ספונטני`,
    also: ['האם התהליך ספונטני', 'קבעו אם תגובה (1) ספונטנית', 'האם התגובה מתרחשת באופן ספונטני', 'ספונטני או לא ספונטני'],
  },
  'a:dS': { kind: 'ask', means: () => `מחפשים $${SYS}$`, todo: 'תוצרים פחות מגיבים (מ־$S^\\circ$)', also: ['שינוי האנטרופיה של המערכת', 'השינוי באנטרופיה של המערכת', 'שינוי האנטרופיה במערכת', 'שינוי האנטרופיה התקנית של המערכת'] },
  'a:dS-sign': { kind: 'ask', means: () => `הסימן של $${SYS}$, ולמה`, todo: 'סופרים מולי גז בכל צד', also: ['הסבירו את סימנו של שינוי האנטרופיה של המערכת', 'האם סימנו יהיה חיובי, שלילי או שלא ניתן לקבוע', 'השינוי באנטרופיה של המערכת הוא קטן. הסבירו'] },
  'a:S0': { kind: 'ask', means: () => 'מחפשים $S^\\circ$ של חומר אחד', todo: 'כותבים תוצרים פחות מגיבים עם x, ופותרים', also: ['חשבו את האנטרופיה התקנית', 'מהי האנטרופיה התקנית'] },
  'a:dH': { kind: 'ask', means: () => 'מחפשים $\\Delta H^\\circ$ של התגובה', todo: 'מהטבלה: תוצרים פחות מגיבים', also: ['חשבו את השינוי באנתלפיה', 'חשבו את שינוי האנתלפייה'] },
  'a:dH-back': { kind: 'ask', means: () => 'מחפשים $\\Delta H^\\circ$ מהאנטרופיה', todo: `$\\Delta H^\\circ = -T \\times ${SURR}$` },
  'a:dS-back': { kind: 'ask', means: () => `מחפשים $${SYS}$ מהיקום`, todo: `$${SYS} = ${TOT} - ${SURR}$` },
  'a:dHf': { kind: 'ask', means: () => 'מחפשים $\\Delta H^\\circ_f$ של חומר אחד', todo: 'כותבים תוצרים פחות מגיבים עם x, ופותרים', also: ['חשבו את אנתלפיית ההתהוות התקנית'] },
  'a:exo-endo': { kind: 'ask', means: () => 'הסימן של $\\Delta H^\\circ$', todo: '$\\Delta H^\\circ < 0$ אקסותרמית, $> 0$ אנדותרמית', also: ['קבעו אם התגובה אנדותרמית או אקסותרמית', 'מה יהיה סימנו של $\\Delta H^\\circ$'] },
  'a:compare': { kind: 'ask', means: () => 'מי גדול יותר בערכו המוחלט: הסביבה או המערכת?', todo: 'הסימן של היקום = הסימן של הגדול', also: ['גדול מן השינוי באנטרופיה של המערכת או קטן ממנו', 'בערכו המוחלט'] },
  'a:sys-sign': { kind: 'ask', means: () => `הסימן של $${SYS}$`, todo: 'מהיקום ומהסביבה: $\\Delta S^\\circ_{\\text{יקום}} = \\Delta S^\\circ_{\\text{מערכת}} + \\Delta S^\\circ_{\\text{סביבה}}$', also: ['קבעו את הסימן של שינוי האנטרופיה של המערכת'] },
  'a:statement': { kind: 'ask', means: () => 'בוחרים את ההיגד הנכון', todo: 'בודקים כל היגד: מה השינוי עושה לאנרגייה של החלקיקים, ומה ל־$E_a$', also: ['איזה מבין ההיגדים הוא ההיגד הנכון', 'איזה מן ההיגדים מסביר נכון'] },
  'a:any-T': { kind: 'ask', means: () => 'האם בכלל יש טמפרטורה שבה זה ספונטני?', todo: 'בודקים את הסימנים של מערכת ושל סביבה', also: ['קבעו אם יש טמפרטורה שבה התגובה ספונטנית'] },
  'a:q': { kind: 'ask', means: () => 'מחפשים כמה חום', todo: 'מולים ÷ מקדם × $|\\Delta H^\\circ|$', also: ['כמה חום נפלט', 'כמות האנרגייה'] },
  'a:mass': { kind: 'ask', means: () => 'מחפשים מסה בגרם', todo: 'חום ← מולים ← גרם', also: ['כמה גרם'] },
  'a:dH-mol': { kind: 'ask', means: () => '$\\Delta H^\\circ$ לתגובה כפי שהיא כתובה', todo: 'חום ÷ מולים, ואז הסימן', also: ['מהו שינוי האנתלפיה של 1 מול'] },
  'a:dH-new': { kind: 'ask', means: () => '$\\Delta H^\\circ$ של התגובה החדשה', todo: 'הפוכה ← סימן הפוך; כפולה ← $\\Delta H^\\circ$ כפול' },
  'a:energy-cmp': { kind: 'ask', means: () => 'באיזו תגובה נפלט יותר חום?', todo: 'מה שונה: חומר במצב צבירה אחר', also: ['האם האנרגייה הנפלטת גדולה, קטנה או שווה', 'משתחררת אנרגייה רבה יותר'] },
  'a:choose': { kind: 'ask', means: () => 'בוחרים ערך אחד', todo: 'הכלל אומר אם גדול או קטן; רק אחד מתאים', also: ['איזה מבין הערכים מתאים', 'איזה משני ערכים מתאים'] },
  'a:bond': { kind: 'ask', means: () => 'מחפשים אנרגיית קשר אחת', todo: 'נשברים פחות נוצרים עם x, ופותרים', also: ['חשבו את אנרגיית הקשר'] },
  'a:dH-bonds': { kind: 'ask', means: () => '$\\Delta H^\\circ$ מאנרגיות קשר', todo: 'נשברים (מגיבים) פחות נוצרים (תוצרים)', also: ['רשמו את הביטוי לחישוב בעזרת אנתלפיות קשר'] },
  'a:Ea': { kind: 'ask', means: () => 'אנרגיות השפעול ו־$\\Delta H^\\circ$ מהדיאגרמה', todo: 'כל אחד = הפרש גבהים' },
  'a:catalyst': { kind: 'ask', means: () => 'מה משתנה עם זרז?', todo: '$E_a$ קטנה, $\\Delta H^\\circ$ לא משתנה', also: ['קבעו איזה משני הגדלים ישתנה ללא זרז'] },
  'a:why-not': { kind: 'ask', means: () => 'למה תגובה ספונטנית לא קורה?', todo: 'אנרגיית שפעול גבוהה', also: ['מדוע התגובה לא התרחשה', 'מה הסיבה שתגובה זו לא יוצאת לפועל'] },
  'a:fix': { kind: 'ask', means: () => 'מה עושים כדי שתקרה?', todo: 'מחממים או מוסיפים זרז', also: ['הציעו דרך לפתור זאת', 'הצע פתרון כדי שהתהליך כן יתרחש'] },
  'a:cat-help': { kind: 'ask', means: () => 'האם זרז יעזור?', todo: 'זרז לא משנה את $\\Delta S^\\circ$ של היקום', also: ['האם נוכחות זרז תגדיל את הסיכוי להתרחשות התגובה'] },
  // ---------------- what to write
  'v:show': { kind: 'verb', means: () => 'כותבים: נוסחה ← הצבה ← תוצאה עם יחידות', also: ['פרטו את חישוביכם', 'פרטו חישוביכם', 'פרט את חישוביך'] },
  'v:explain': { kind: 'verb', means: () => 'כותבים את הכלל במשפט (למה)', also: ['נמקו', 'נמק', 'הסבירו', 'הסבירו קביעתכם'] },
  'v:collision': { kind: 'verb', means: () => 'מסבירים עם חלקיקים: התנגשויות, אנרגייה ו־$E_a$', also: ['הסבירו באמצעות תורת ההתנגשויות', 'הסבירו את ההיגד שבחרתם באמצעות תורת ההתנגשויות'] },
  'v:no-calc': { kind: 'verb', means: () => 'בלי מספרים: רק סימנים וכללים', also: ['נמקו ללא חישובים', 'קבעו ללא חישובים'] },
};

function PHRASES_TODO_TOT() {
  return 'נתון היקום: הולכים אחורה במתכון';
}

export const KIND_HE: Record<PhraseKind, string> = {
  given: 'נתון',
  hidden: 'נתון נסתר',
  ask: 'שואלים',
  verb: 'מה כותבים',
};
