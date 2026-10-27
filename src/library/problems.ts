// The problem library (BRIEF §8). Each problem is the data in the input format, plus `text`: the question as the
// exam writes it (engine/text.ts). Real bagrut questions come first, with the official wording and data and the
// original page; then the examples of PROBLEMS.md (the user's); then a few with CRC data (`chemicals` package).

export interface LibProblem {
  id: string;
  title: string; // Hebrew, short
  group: string;
  topic: string; // learn/topics.ts
  input: string;
  text?: string; // exam wording with {slots} and «phrase|tag»
  original?: string[]; // files in public/exam-pages
  note?: string; // shown under the title
}

const bag = (year: number, code: number, q: string) => `בגרות ${year}, שאלון ${code}, ${q}`;
const STYLE = 'ניסוח בסגנון הבגרות';
const PR = 'דוגמה מ־PROBLEMS';
const pg = (f: string) => [`${f}.png`];

const G = {
  exo: 'אקסו / אנדו וחום',
  phase: 'מצבי צבירה',
  bonds: 'אנרגיות קשר',
  rate: 'אנרגיית שפעול וזרז',
  sign: 'הסימן של ΔS°',
  dS: 'ΔS° מערכת מ־S°',
  dHf: 'ΔH° מאנתלפיות התהוות',
  spont: 'ספונטני? (ΔS° יקום)',
  back: 'בחזרה מ־ΔS° יקום',
  signs: 'סימנים בלי חישוב',
  kin: 'ספונטני אבל לא קורה',
};

export const LIBRARY: LibProblem[] = [
  // =========================================================== energy (37381)
  {
    id: 'B23-381-5',
    title: 'שעוות נר: $\\Delta H^\\circ$ מכמות חום',
    group: G.exo,
    topic: 'exo',
    note: bag(2023, 37381, 'שאלה 5'),
    original: pg('37381-2023-6-p4'),
    input: `rxn: C25H52(g) + 38O2(g) -> 25CO2(g) + 26H2O(g)
m C25H52 = 1.76 g
M C25H52 = 352 g/mol
q = 77.825 kJ released
ask: dH-from-q`,
    text: `שעוות הנרות עשויה בעיקר מפחמימן שנוסחתו המולקולרית היא {sp} («מסה מולרית|g:M»: {M}).
לפניכם תגובת השרפה המלאה של אדי הפחמימן בעת בעירת הנר: {rxn}
נמצא ש«כמות האנרגייה שנפלטה|g:released» בתגובת השרפה של {m} {sp} שווה ל־{q}.
«מהו שינוי האנתלפיה התקנית, $\\Delta H^\\circ$, בתגובת השרפה של 1 מול|a:dH-mol» {sp}?`,
  },
  {
    id: 'P3',
    title: 'כמה חום בשרפת 8 g מתאן',
    group: G.exo,
    topic: 'exo',
    note: PR,
    input: `rxn: CH4(g) + 2O2(g) -> CO2(g) + 2H2O(l)
dH = -890 kJ
m CH4 = 8.0 g
M CH4 = 16 g/mol
ask: heat`,
    text: `נתונה תגובת השרפה של מתאן: {rxn}
{dH}
«כמה חום נפלט|a:q» בשרפת {m} {sp}? («מסה מולרית|g:M»: {M})`,
  },
  {
    id: 'P4',
    title: 'כמה גרם מתאן ל־1335 kJ',
    group: G.exo,
    topic: 'exo',
    note: PR,
    input: `rxn: CH4(g) + 2O2(g) -> CO2(g) + 2H2O(l)
dH = -890 kJ
q = 1335 kJ
M CH4 = 16 g/mol
ask: mass-for-heat`,
    text: `נתונה תגובת השרפה של מתאן: {rxn}
{dH}
«כמה גרם|a:mass» {sp} צריך לשרוף כדי לקבל {q}? («מסה מולרית|g:M»: {M})`,
  },
  {
    id: 'B24-282-2b',
    title: 'התגובה ההפוכה פולטת חום?',
    group: G.exo,
    topic: 'exo',
    note: bag(2024, 37282, 'שאלה 2ב'),
    original: pg('37282-2024-6-p4'),
    input: `rxn: CO2(g) + CH4(g) -> 2CO(g) + 2H2(g)
dH = 247.3 kJ
new: 2CO(g) + 2H2(g) -> CO2(g) + CH4(g)
ask: dH-new`,
    text: `במגדל השמש מבצעים את תגובה (1): {rxn} {dH}
מבצעים תגובה הפוכה לתגובה (1), נסמן אותה כתגובה (2): {new}
«האם בהתרחשות תגובה (2) נפלטת אנרגיה|a:dH-new», שיכולה להיות מנוצלת ליצירת קיטור? «נמקו|v:explain».`,
  },
  {
    id: 'B22-282-1e',
    title: 'אמוניה נוזלית: $-46$ או $-138$?',
    group: G.phase,
    topic: 'phase',
    note: bag(2022, 37282, 'שאלה 1ה'),
    original: pg('37282-2022-6-p3'),
    input: `rxn: N2(g) + 3H2(g) -> 2NH3(g)
dH = -92 kJ
new: N2(g) + 3H2(g) -> 2NH3(l)
options = -46, -138
ask: phase-compare`,
    text: `אמוניה מתקבלת על פי תגובה (1): {rxn} {dH}
אמוניה «במצב נוזל|g:new» מתקבלת על פי תגובה (3): {new}
«קבעו איזה משני ערכים|a:choose»: {opts} מתאים להיות הערך של $\\Delta H^\\circ_{(3)}$. «נמקו|v:explain».`,
  },
  {
    id: 'B23-282-2c',
    title: 'מים נוזליים: איזה $\\Delta H^\\circ$?',
    group: G.phase,
    topic: 'phase',
    note: bag(2023, 37282, 'שאלה 2ג'),
    original: pg('37282-2023-6-p4'),
    input: `rxn: H2(g) + 1/2O2(g) -> H2O(g)
dH = -241.8 kJ
new: H2(g) + 1/2O2(g) -> H2O(l)
options = -285.9, -241.8, -197.7
ask: phase-compare`,
    text: `תגובה (1): {rxn} {dH}
בתגובה (2) מקבלים מתערובת הגזים מימן וחמצן «מים במצב נוזל|g:new»: {new}
נתונים שלושה ערכים של שינוי אנתלפייה: {opts}
«קבעו איזה מבין הערכים האלה מתאים|a:choose» עבור $\\Delta H^\\circ_{2}$. «נמקו|v:explain».`,
  },
  {
    id: 'B23-282-1z',
    title: '$\\mathrm{N_2O}$ נוזלי: יותר או פחות אנרגיה?',
    group: G.phase,
    topic: 'phase',
    note: bag(2023, 37282, 'שאלה 1ז'),
    original: pg('37282-2023-6-p3'),
    input: `rxn: 2N2O(g) -> 2N2(g) + O2(g)
dH = -164.4 kJ
new: 2N2O(l) -> 2N2(g) + O2(g)
ask: phase-compare`,
    text: `נתונות שתי תגובות הפירוק של דו־חנקן חמצני:
(5) {rxn} {dH}
(6) {new}
«קבעו אם האנרגייה הנפלטת בתגובה (6) גדולה מהאנרגייה הנפלטת בתגובה (5), קטנה ממנה או שווה לה|a:energy-cmp».`,
  },
  {
    id: 'B26-282-1f',
    title: '$\\mathrm{SO_3}$ גז או נוזל: איפה משתחרר יותר?',
    group: G.phase,
    topic: 'phase',
    note: bag(2026, 37282, 'שאלה 1ו'),
    original: pg('37282-2026-6-p3'),
    input: `rxn: 2SO2(g) + O2(g) -> 2SO3(l)
dH = -196 kJ
new: 2SO2(g) + O2(g) -> 2SO3(g)
ask: phase-compare`,
    text: `תגובה (1): {rxn} {dH}
תגובה (2): {new}
«קבעו אם בתגובה (2) משתחררת אנרגייה רבה יותר, שווה או קטנה יותר לעומת האנרגייה המשתחררת בתגובה (1)|a:energy-cmp». «נמקו|v:explain».`,
  },
  {
    id: 'B23-282-2f',
    title: 'יוד מוצק או גז: איזו אקסותרמית?',
    group: G.phase,
    topic: 'phase',
    note: bag(2023, 37282, 'שאלה 2ו'),
    original: pg('37282-2023-6-p5'),
    input: `rxn: H2(g) + I2(s) -> 2HI(g)
new: H2(g) + I2(g) -> 2HI(g)
ask: phase-compare`,
    text: `נתונים ניסוחים של שני תהליכים. רק אחד משני התהליכים הוא אקסותרמי.
(6) {rxn}
(7) {new}
«איזה מבין שני התהליכים הוא התהליך האקסותרמי|a:energy-cmp»? «נמקו|v:explain».`,
  },
  {
    id: 'B22-282-2b',
    title: 'אידוי לימונן: $49$ או $-49$?',
    group: G.phase,
    topic: 'phase',
    note: bag(2022, 37282, 'שאלה 2ב'),
    original: pg('37282-2022-6-p4'),
    input: `rxn: C10H16(l) -> C10H16(g)
options = 49, -49
ask: phase-compare`,
    text: `במהלך האידוי של לימונן מתרחשת תגובה (2): {rxn}
נתונים שני ערכים של שינוי האנתלפייה: {opts}
«איזה מן הערכים הנתונים מתאים|a:choose» לשינוי האנתלפייה $\\Delta H^\\circ_{(2)}$? «הסבירו|v:explain».`,
  },
  {
    id: 'B25-381-13',
    title: 'אצטילן + מימן ← אתאן: אנרגיות קשר',
    group: G.bonds,
    topic: 'bonds',
    note: `${bag(2025, 37381, 'שאלה 13')} (בבחינה ביקשו את הביטוי; כאן גם מחשבים)`,
    original: pg('37381-2025-6-p14'),
    input: `rxn: C2H2(g) + 2H2(g) -> C2H6(g)
bonds C2H2: 1 C#C, 2 C-H
bonds H2: 1 H-H
bonds C2H6: 1 C-C, 6 C-H
bond C#C = 835
bond C-H = 413
bond C-C = 346
bond H-H = 436
ask: dH-bonds`,
    text: `נתון ניסוח תגובה 4 של יצירת אתאן מאצטילן ומימן: {rxn}
«בטבלה שלפניכם נתונים ערכי אנתלפיית הקשר|g:table»: {table}
«רשמו את הביטוי לחישוב $\\Delta H^\\circ_4$ בעזרת אנתלפיות קשר|a:dH-bonds», וחשבו את ערכו.`,
  },
  {
    id: 'P7',
    title: '$\\mathrm{HCl}$ מאנרגיות קשר',
    group: G.bonds,
    topic: 'bonds',
    note: PR,
    input: `rxn: H2(g) + Cl2(g) -> 2HCl(g)
bonds H2: 1 H-H
bonds Cl2: 1 Cl-Cl
bonds HCl: 1 H-Cl
bond H-H = 436
bond Cl-Cl = 243
bond H-Cl = 432
ask: dH-bonds`,
    text: `נתונה התגובה: {rxn}
«אנרגיות קשר|g:table» (kJ/mol): {table}
«חשבו את $\\Delta H^\\circ$ של התגובה בעזרת אנרגיות הקשר|a:dH-bonds». «פרטו חישוביכם|v:show».`,
  },
  {
    id: 'P8',
    title: 'שרפת מתאן מאנרגיות קשר',
    group: G.bonds,
    topic: 'bonds',
    note: PR,
    input: `rxn: CH4(g) + 2O2(g) -> CO2(g) + 2H2O(g)
bonds CH4: 4 C-H
bonds O2: 1 O=O
bonds CO2: 2 C=O
bonds H2O: 2 O-H
bond C-H = 413
bond O=O = 498
bond C=O = 799
bond O-H = 463
ask: dH-bonds`,
    text: `נתונה תגובת השרפה של מתאן: {rxn}
«אנרגיות קשר|g:table» (kJ/mol): {table}
«חשבו את $\\Delta H^\\circ$ של התגובה בעזרת אנרגיות הקשר|a:dH-bonds». «פרטו חישוביכם|v:show».`,
  },
  {
    id: 'X-bond-CC',
    title: 'מוצאים את אנרגיית הקשר $\\mathrm{C{\\equiv}C}$',
    group: G.bonds,
    topic: 'bonds',
    note: 'בעקבות בגרות 2025, שאלון 37381',
    input: `rxn: C2H2(g) + 2H2(g) -> C2H6(g)
dH = -291 kJ
bonds C2H2: 1 C#C, 2 C-H
bonds H2: 1 H-H
bonds C2H6: 1 C-C, 6 C-H
bond C#C = x
bond C-H = 413
bond C-C = 346
bond H-H = 436
ask: bond-unknown`,
    text: `נתונה התגובה: {rxn} {dH}
«נתונה טבלת האנרגיות הבאה|g:table»: {table}
«חשבו את אנרגיית הקשר|a:bond» $\\mathrm{C{\\equiv}C}$. «פרטו חישוביכם|v:show».`,
  },
  {
    id: 'P14',
    title: 'דיאגרמת אנרגיה וזרז',
    group: G.rate,
    topic: 'rate',
    note: PR,
    input: `E reactants = 50 kJ
E products = 20 kJ
E peak = 120 kJ
E peak catalyst = 90 kJ
ask: diagram`,
    text: `בדיאגרמת האנרגיה של תגובה נתונים הגבהים הבאים: {E}
«חשבו את $\\Delta H^\\circ$ ואת אנרגיות השפעול, קדימה ואחורה|a:Ea».
«מה משתנה כאשר מוסיפים זרז|a:catalyst»?`,
  },
  {
    id: 'X-diag-endo',
    title: 'דיאגרמה של תגובה אנדותרמית',
    group: G.rate,
    topic: 'rate',
    note: 'תגובה כללית (ללא חומרים אמיתיים)',
    input: `E reactants = 80 kJ
E products = 130 kJ
E peak = 200 kJ
ask: diagram`,
    text: `בדיאגרמת האנרגיה של תגובה A נתונים הגבהים הבאים: {E}
«חשבו את $\\Delta H^\\circ$ ואת אנרגיות השפעול|a:Ea». «קבעו אם התגובה אנדותרמית או אקסותרמית|a:exo-endo».`,
  },

  // =========================================================== entropy (37282)
  {
    id: 'B25-282-1c',
    title: 'הסימן של $\\Delta S^\\circ$: שרפת $\\mathrm{CO}$',
    group: G.sign,
    topic: 'dS-sign',
    note: bag(2025, 37282, 'שאלה 1א iii'),
    original: pg('37282-2025-6-p2'),
    input: `rxn: 2CO(g) + O2(g) -> 2CO2(g)
ask: dS-sign`,
    text: `בממיר המכונית מתרחשת תגובה (1): {rxn}
«הסבירו את סימנו של שינוי האנטרופיה של המערכת|a:dS-sign» עבור תגובה (1).`,
  },
  {
    id: 'B26-282-2a',
    title: 'הסימן של $\\Delta S^\\circ$: $\\mathrm{HBr}$ (שינוי קטן)',
    group: G.sign,
    topic: 'dS-sign',
    note: bag(2026, 37282, 'שאלה 2א ii'),
    original: pg('37282-2026-6-p4'),
    input: `rxn: H2(g) + Br2(g) -> 2HBr(g)
ask: dS-sign`,
    text: `בתגובה (1) מימן מגיב עם ברום לקבלת מימן ברומי: {rxn}
במהלך תגובה (1) «השינוי באנטרופיה של המערכת הוא קטן. הסבירו|a:dS-sign».`,
  },
  {
    id: 'B26-282-1a',
    title: 'הסימן של $\\Delta S^\\circ$: $\\mathrm{SO_3}$ נוזלי',
    group: G.sign,
    topic: 'dS-sign',
    note: bag(2026, 37282, 'שאלה 1א ii'),
    original: pg('37282-2026-6-p2'),
    input: `rxn: 2SO2(g) + O2(g) -> 2SO3(l)
ask: dS-sign`,
    text: `בתגובה (1) גופרית דו־חמצנית מגיבה עם חמצן: {rxn}
«הסבירו את השינוי באנטרופיה של המערכת|a:dS-sign» במהלך תגובה (1).`,
  },
  ...(
    [
      ['P12a', '2H2(g) + O2(g) -> 2H2O(l)', 'יצירת מים נוזליים'],
      ['P12b', 'H2O(s) -> H2O(l)', 'התכת קרח'],
      ['P12c', 'CaCO3(s) -> CaO(s) + CO2(g)', 'פירוק $\\mathrm{CaCO_3}$'],
      ['P12d', 'H2(g) + Cl2(g) -> 2HCl(g)', 'יצירת $\\mathrm{HCl}$'],
    ] as const
  ).map(
    ([id, rxn, title]): LibProblem => ({
      id,
      title: `הסימן של $\\Delta S^\\circ$: ${title}`,
      group: G.sign,
      topic: 'dS-sign',
      note: PR,
      input: `rxn: ${rxn}\nask: dS-sign`,
      text: `נתונה התגובה: {rxn}
«האם סימנו של $\\Delta S^\\circ$ מערכת יהיה חיובי, שלילי או שלא ניתן לקבוע|a:dS-sign»? «הסבירו קביעתכם|v:explain».`,
    }),
  ),
  {
    id: 'B25-282-1b',
    title: '$\\Delta S^\\circ$ מערכת: שרפת $\\mathrm{CO}$',
    group: G.dS,
    topic: 'dS-calc',
    note: bag(2025, 37282, 'שאלה 1א ii'),
    original: pg('37282-2025-6-p2'),
    input: `rxn: 2CO(g) + O2(g) -> 2CO2(g)
S O2(g) = 205.0
S CO(g) = 197.9
S CO2(g) = 213.6
ask: dS`,
    text: `בממיר המכונית מתרחשת תגובה (1): {rxn}
«בטבלה שלפניכם מוצגים ערכים תרמודינמיים|g:table» של המגיבים ושל התוצר: {table}
«חשבו את שינוי האנטרופיה של המערכת|a:dS», $\\Delta S^\\circ_{\\text{מערכת}}$, עבור תגובה (1). «פרטו את חישוביכם|v:show».`,
  },
  {
    id: 'B22-282-1c',
    title: '$\\Delta S^\\circ$ מערכת: הבר־בוש',
    group: G.dS,
    topic: 'dS-calc',
    note: bag(2022, 37282, 'שאלה 1ג i'),
    original: pg('37282-2022-6-p3'),
    input: `rxn: N2(g) + 3H2(g) -> 2NH3(g)
S NH3(g) = 192.5
S N2(g) = 191.4
S H2(g) = 130.6
ask: dS`,
    text: `בתהליך הבר־בוש אמוניה מתקבלת על פי תגובה (1): {rxn}
«בטבלה שלהלן מוצגים ערכים של אנטרופיה תקנית|g:table»: {table}
היעזרו בנתונים שבטבלה ו«חשבו את שינוי האנטרופיה התקנית של המערכת|a:dS» עבור תגובה (1). «פרטו את החישובים|v:show».`,
  },
  {
    id: 'B23-282-2d',
    title: '$\\Delta S^\\circ$ מערכת: מתאנול וקיטור',
    group: G.dS,
    topic: 'dS-calc',
    note: bag(2023, 37282, 'שאלה 2ד i'),
    original: pg('37282-2023-6-p4'),
    input: `rxn: CH3OH(g) + H2O(g) -> 3H2(g) + CO2(g)
S CH3OH(g) = 239.9
S H2O(g) = 188.7
S H2(g) = 130.6
S CO2(g) = 213.6
ask: dS`,
    text: `מתאנול מגיב עם קיטור ונוצר מימן על פי תגובה (3): {rxn}
«בטבלה הנתונה מוצגים ערכים של אנטרופיה מולרית תקנית|g:table»: {table}
«חשבו את שינוי האנטרופיה במערכת|a:dS» עבור תגובה (3). «פרטו את החישובים|v:show».`,
  },
  {
    id: 'B26-282-1a2',
    title: '$\\Delta S^\\circ$ מערכת: $\\mathrm{SO_3}$ נוזלי',
    group: G.dS,
    topic: 'dS-calc',
    note: bag(2026, 37282, 'שאלה 1א i'),
    original: pg('37282-2026-6-p2'),
    input: `rxn: 2SO2(g) + O2(g) -> 2SO3(l)
S SO2(g) = 248.5
S O2(g) = 205
S SO3(l) = 256
ask: dS`,
    text: `תגובה (1): {rxn}
«בטבלה שלפניכם מוצגים ערכים של אנטרופיה תקנית|g:table»: {table}
«חשבו את שינוי האנטרופיה של המערכת|a:dS» בתגובה (1). «פרטו את חישוביכם|v:show».`,
  },
  {
    id: 'B26-282-2a2',
    title: '$\\Delta S^\\circ$ מערכת: $\\mathrm{HBr}$',
    group: G.dS,
    topic: 'dS-calc',
    note: bag(2026, 37282, 'שאלה 2א i'),
    original: pg('37282-2026-6-p4'),
    input: `rxn: H2(g) + Br2(g) -> 2HBr(g)
S H2(g) = 130.6
S Br2(g) = 245.5
S HBr(g) = 198.5
ask: dS`,
    text: `תגובה (1): {rxn}
«בטבלה שלפניכם מוצגים ערכים של אנטרופיה תקנית|g:table»: {table}
«חשבו את שינוי האנטרופיה של המערכת|a:dS» בתגובה (1). «פרטו את חישוביכם|v:show».`,
  },
  {
    id: 'B25-282-2b',
    title: '$\\Delta S^\\circ$ מערכת: $\\mathrm{PCl_5}$',
    group: G.dS,
    topic: 'dS-calc',
    note: bag(2025, 37282, 'שאלה 2ב'),
    original: pg('37282-2025-6-p4'),
    input: `rxn: PCl3(g) + Cl2(g) -> PCl5(g)
S PCl3(g) = 217.1
S Cl2(g) = 223
S PCl5(g) = 352.4
ask: dS`,
    text: `זרחן תלת כלורי מגיב עם כלור על פי תגובה (1): {rxn}
«בטבלה שלפניכם מוצגים ערכים של אנטרופיה מולרית תקנית|g:table»: {table}
«חשבו את שינוי האנטרופיה של המערכת|a:dS» עבור תגובה (1). «פרטו את חישוביכם|v:show».`,
  },
  {
    id: 'B21-282-2b',
    title: '$S^\\circ$ של אמוניום חנקתי (נעלם)',
    group: G.dS,
    topic: 'dS-calc',
    note: bag(2021, 37282, 'שאלה 2ב'),
    original: pg('37282-2021-6-p4'),
    input: `rxn: NH4NO3(s) -> N2O(g) + 2H2O(g)
dS = 447 J/K
S N2O(g) = 220
S H2O(g) = 189
S NH4NO3(s) = x
ask: S-unknown`,
    text: `תגובה (1) יכולה להתרחש במהלך הפיצוץ: {rxn} {dS}
«בטבלה שלפניך מוצגים ערכים|g:table»: {table}
היעזר בנתונים ו«חשב את האנטרופיה התקנית|a:S0», $S^\\circ$, של {x}. «פרט את חישוביך|v:show».`,
  },
  {
    id: 'B25-282-1a',
    title: '$\\Delta H^\\circ$ מאנתלפיות התהוות: שרפת $\\mathrm{CO}$',
    group: G.dHf,
    topic: 'dHf',
    note: bag(2025, 37282, 'שאלה 1א i'),
    original: pg('37282-2025-6-p2'),
    input: `rxn: 2CO(g) + O2(g) -> 2CO2(g)
dHf CO(g) = -110.5
dHf CO2(g) = -393.5
ask: dH-formation`,
    text: `בממיר המכונית מתרחשת תגובה (1): {rxn}
«בטבלה שלפניכם מוצגים ערכים תרמודינמיים|g:table»: {table}
«חשבו את השינוי באנתלפיה|a:dH», $\\Delta H^\\circ$, עבור תגובה (1). «פרטו את חישוביכם|v:show».`,
  },
  {
    id: 'B21-282-5e',
    title: '$\\Delta H^\\circ$ מאנתלפיות התהוות: שרפת אתאנאל',
    group: G.dHf,
    topic: 'dHf',
    note: bag(2021, 37282, 'מועד נבצרים, שאלה 2ה'),
    original: pg('37282-2021-5-p6'),
    input: `rxn: 2CH3CHO(g) + 5O2(g) -> 4CO2(g) + 4H2O(g)
dHf CH3CHO(g) = -166
dHf CO2(g) = -394
dHf H2O(g) = -242
ask: dH-formation`,
    text: `לפניך ניסוח תגובת שרפה של אתאנאל במצב גז: {rxn}
«בטבלה שלפניך מוצגים נתונים תרמודינמיים|g:table»: {table}
«חשב את שינוי האנתלפייה|a:dH» בתגובה (4). «פרט את חישוביך|v:show».`,
  },
  {
    id: 'B24-282-1a',
    title: '$\\Delta H^\\circ$ מאנתלפיות התהוות: $\\mathrm{NO_2}$',
    group: G.dHf,
    topic: 'dHf',
    note: bag(2024, 37282, 'שאלה 1א'),
    original: pg('37282-2024-6-p2'),
    input: `rxn: 2NO(g) + O2(g) -> 2NO2(g)
dHf NO(g) = 90.4
dHf NO2(g) = 33.2
ask: dH-formation`,
    text: `חנקן דו־חמצני מתקבל על פי תגובה (1): {rxn}
«בטבלה שלפניכם מוצגים נתונים תרמודינמיים|g:table»: {table}
«חשבו את שינוי האנתלפיה|a:dH» של תגובה (1). «פרטו את חישוביכם|v:show».`,
  },
  {
    id: 'P9',
    title: '$\\Delta H^\\circ$ מאנתלפיות התהוות: מתאן',
    group: G.dHf,
    topic: 'dHf',
    note: PR,
    input: `rxn: CH4(g) + 2O2(g) -> CO2(g) + 2H2O(l)
dHf CH4(g) = -74.8
dHf CO2(g) = -393.5
dHf H2O(l) = -285.8
ask: dH-formation`,
    text: `נתונה התגובה: {rxn}
«אנתלפיות התהוות תקניות|g:table» (kJ/mol): {table}
«חשבו את $\\Delta H^\\circ$ של התגובה|a:dH». «פרטו חישוביכם|v:show».`,
  },
  {
    id: 'B22-282-2a',
    title: '$\\Delta H^\\circ_f$ של לימונן (נעלם)',
    group: G.dHf,
    topic: 'dHf',
    note: bag(2022, 37282, 'שאלה 2א'),
    original: pg('37282-2022-6-p4'),
    input: `rxn: C10H16(l) + 14O2(g) -> 10CO2(g) + 8H2O(l)
dH = -6173 kJ
dHf CO2(g) = -394
dHf H2O(l) = -286
dHf C10H16(l) = x
ask: dHf-unknown`,
    text: `לימונן נשרף בטמפרטורת החדר על פי תגובה (1): {rxn} {dH}
«נתונה הטבלה|g:table»: {table}
היעזרו בנתונים ו«חשבו את אנתלפיית ההתהוות התקנית|a:dHf» של {x}. «פרטו את החישובים|v:show».`,
  },

  // ---------------- spontaneous? (real bagrut first)
  {
    id: 'B22-282-1d',
    title: 'הבר־בוש: ספונטני ב־298 K?',
    group: G.spont,
    topic: 'spont',
    note: bag(2022, 37282, 'שאלה 1ג–ד'),
    original: pg('37282-2022-6-p3'),
    input: `rxn: N2(g) + 3H2(g) -> 2NH3(g)
dH = -92 kJ
S NH3(g) = 192.5
S N2(g) = 191.4
S H2(g) = 130.6
T = 298 K
ask: spontaneous`,
    text: `אמוניה מתקבלת על פי תגובה (1): {rxn} {dH}
«בטבלה שלהלן מוצגים ערכים של אנטרופיה תקנית|g:table»: {table}
«חשבו את שינוי האנטרופיה התקנית של הסביבה|a:surr» עבור תגובה (1) «בטמפרטורה|g:T» {T}.
«קבעו אם תגובה (1) היא ספונטנית|a:spont» «בטמפרטורת החדר|h:room», {T}. «נמקו|v:explain».`,
  },
  {
    id: 'B23-282-1e',
    title: '$\\mathrm{NO_2}$: ספונטני ב־1100 K?',
    group: G.spont,
    topic: 'spont',
    note: bag(2023, 37282, 'שאלה 1ה'),
    original: pg('37282-2023-6-p3'),
    input: `rxn: 2NO(g) + O2(g) -> 2NO2(g)
dH = -114 kJ
dS = -147 J/K
T = 1100 K
ask: spontaneous`,
    text: `נתונה תגובה (2): {rxn} {dH} {dS}
«קבעו אם תגובה (2) ספונטנית|a:spont» «בתנאי תקן|h:std», «בטמפרטורה|g:T» {T}. «פרטו את החישובים|v:show» «ונמקו|v:explain».`,
  },
  {
    id: 'B24-282-1a2',
    title: '$\\mathrm{NO_2}$: ספונטני ב־298 K? (שתי טבלאות)',
    group: G.spont,
    topic: 'spont',
    note: bag(2024, 37282, 'שאלה 1א'),
    original: pg('37282-2024-6-p2'),
    input: `rxn: 2NO(g) + O2(g) -> 2NO2(g)
dHf NO(g) = 90.4
dHf NO2(g) = 33.2
S NO(g) = 210.5
S O2(g) = 205.0
S NO2(g) = 240.0
T = 298 K
ask: spontaneous`,
    text: `חנקן דו־חמצני מתקבל על פי תגובה (1): {rxn}
«בטבלה שלפניכם מוצגים נתונים תרמודינמיים|g:table»: {table}
«קבעו אם תגובה (1) ספונטנית|a:spont» «בתנאי תקן|h:std», «בטמפרטורה של|g:T» {T}. «פרטו את חישוביכם|v:show» «ונמקו|v:explain».`,
  },
  {
    id: 'B24-282-2a',
    title: 'מגדל השמש: ספונטני ב־298 K?',
    group: G.spont,
    topic: 'spont',
    note: bag(2024, 37282, 'שאלה 2א'),
    original: pg('37282-2024-6-p4'),
    input: `rxn: CO2(g) + CH4(g) -> 2CO(g) + 2H2(g)
dH = 247.3 kJ
S CO2(g) = 213.6
S CH4(g) = 186.2
S CO(g) = 197.9
S H2(g) = 130.6
T = 298 K
ask: spontaneous`,
    text: `במגדל השמש מבצעים את תגובה (1): {rxn} {dH}
«בטבלה שלפניכם מוצגים ערכים של אנטרופיה תקנית|g:table»: {table}
«חשבו את שינוי האנטרופיה של הסביבה|a:surr» בתגובה (1) «בתנאי תקן|h:std», «בטמפרטורה של|g:T» {T}.
«קבעו אם תגובה (1) ספונטנית|a:spont» בתנאי תקן, בטמפרטורה של {T}. «פרטו את חישוביכם|v:show» «ונמקו|v:explain».`,
  },
  {
    id: 'B26-282-1c',
    title: '$\\mathrm{SO_3}$: ספונטני ב־1000 K?',
    group: G.spont,
    topic: 'spont',
    note: bag(2026, 37282, 'שאלה 1א–ג'),
    original: pg('37282-2026-6-p2'),
    input: `rxn: 2SO2(g) + O2(g) -> 2SO3(l)
dH = -196 kJ
S SO2(g) = 248.5
S O2(g) = 205
S SO3(l) = 256
T = 1000 K
ask: spontaneous`,
    text: `תגובה (1): {rxn} {dH}
«בטבלה שלפניכם מוצגים ערכים של אנטרופיה תקנית|g:table»: {table}
«חשבו את שינוי האנטרופיה של הסביבה|a:surr» בתגובה (1), «בטמפרטורה של|g:T» {T}. «פרטו את חישוביכם|v:show».
«האם תגובה (1) ספונטנית|a:spont» בטמפרטורה של {T}? «נמקו|v:explain».`,
  },
  {
    id: 'B21-282-1a',
    title: 'טיטניום ו־$\\mathrm{CO_2}$: ספונטני ב־298 K?',
    group: G.spont,
    topic: 'spont',
    note: bag(2021, 37282, 'מועד נבצרים, שאלה 1א'),
    original: pg('37282-2021-5-p2'),
    input: `rxn: 2CO2(g) + Ti(s) -> 2CO(g) + TiO2(s)
dH = -379 kJ
S Ti(s) = 31
S TiO2(s) = 50
S CO(g) = 198
S CO2(g) = 214
T = 298 K
ask: spontaneous`,
    text: `בתא מתרחשת תגובה (1): {rxn} {dH}
«בטבלה שלפניך מוצגים ערכים של אנטרופיה תקנית|g:table»: {table}
«קבע אם תגובה (1) ספונטנית|a:spont» «בתנאי תקן|h:std» «ב־|g:T»{T}. «פרט את חישוביך|v:show» «ונמק|v:explain».`,
  },
  {
    id: 'B21-282-5b',
    title: 'פחם ו־$\\mathrm{CO_2}$: ספונטני ב־298 K?',
    group: G.spont,
    topic: 'spont',
    note: bag(2021, 37282, 'מועד נבצרים, שאלה 2ב'),
    original: pg('37282-2021-5-p5'),
    input: `rxn: C(s) + CO2(g) -> 2CO(g)
dH = 173 kJ
dS = 176.3 J/K
T = 298 K
ask: spontaneous`,
    text: `בתעשייה מייצרים CO על פי תגובה (2): {rxn} {dH} {dS}
«קבע אם תגובה (2) היא תגובה ספונטנית|a:spont» «בתנאי תקן|h:std», «ב־|g:T»{T}. «פרט את חישוביך|v:show», «ונמק|v:explain».`,
  },
  {
    id: 'B25-282-2e',
    title: '$\\mathrm{PCl_5}$: $\\Delta S^\\circ$ סביבה ב־298 K',
    group: G.spont,
    topic: 'spont',
    note: bag(2025, 37282, 'שאלה 2ה'),
    original: pg('37282-2025-6-p4'),
    input: `rxn: PCl3(g) + Cl2(g) -> PCl5(g)
dH = -78.9 kJ
T = 298 K
ask: spontaneous`,
    text: `זרחן תלת כלורי מגיב עם כלור על פי תגובה (1): {rxn} {dH}
«חשבו את שינוי האנטרופיה של הסביבה|a:surr», $\\Delta S^\\circ_{\\text{סביבה}}$, עבור תגובה (1) «בטמפרטורה|g:T» {T}. «פרטו את חישוביכם|v:show».`,
  },
  {
    id: 'B22-282-2b2',
    title: 'אידוי לימונן: $\\Delta S^\\circ$ סביבה',
    group: G.spont,
    topic: 'spont',
    note: bag(2022, 37282, 'שאלה 2ב ii'),
    original: pg('37282-2022-6-p4'),
    input: `rxn: C10H16(l) -> C10H16(g)
dH = 49 kJ
T = room
ask: spontaneous`,
    text: `במהלך האידוי של לימונן מתרחשת תגובה (2): {rxn} {dH}
«חשבו את שינוי האנטרופיה של הסביבה|a:surr» עבור תגובה (2) «בטמפרטורת החדר|h:room». «פרטו את החישובים|v:show».`,
  },
  {
    id: 'S1',
    title: 'יצירת $\\mathrm{NH_3}$ ב־298 K',
    group: G.spont,
    topic: 'spont',
    note: STYLE,
    input: `rxn: N2(g) + 3H2(g) -> 2NH3(g)
dH = -92 kJ
dS = -199 J/K
T = 298 K
ask: spontaneous`,
    text: `נתונה התגובה: {rxn}
«שינוי האנתלפיה|g:dH» בתגובה הוא {dH}, ו«שינוי האנטרופיה של המערכת|g:dS» הוא {dS}.
א. חשבו את «שינוי האנטרופיה של הסביבה|a:surr» «בטמפרטורה של|g:T» {T}.
ב. חשבו את «שינוי האנטרופיה של היקום|a:tot».
ג. «האם התהליך ספונטני|a:spont» «בתנאים אלו|h:same»? «נמקו|v:explain».`,
  },
  {
    id: 'S2',
    title: 'פירוק $\\mathrm{CaCO_3}$ ב־25°C',
    group: G.spont,
    topic: 'spont',
    note: STYLE,
    input: `rxn: CaCO3(s) -> CaO(s) + CO2(g)
dH = 178 kJ
dS = 161 J/K
T = 25 C
ask: spontaneous`,
    text: `נתונה תגובת הפירוק: {rxn}
{dH}
{dS}
א. חשבו את «$\\Delta S^\\circ$ סביבה|a:surr» «בטמפרטורה של|g:T» {T}. «פרטו חישוביכם|v:show».
ב. חשבו את «$\\Delta S^\\circ$ יקום (כולל, TOTAL)|a:tot», וקבעו «האם התהליך ספונטני או לא ספונטני|a:spont» «בתנאים הנתונים|h:same».`,
  },
  {
    id: 'S3',
    title: 'פירוק $\\mathrm{CaCO_3}$ ב־1200 K',
    group: G.spont,
    topic: 'spont',
    note: STYLE,
    input: `rxn: CaCO3(s) -> CaO(s) + CO2(g)
dH = 178 kJ
dS = 161 J/K
T = 1200 K
ask: spontaneous`,
    text: `נתונה התגובה: {rxn}
{dH}
{dS}
«קבעו האם התגובה מתרחשת באופן ספונטני|a:spont» «בטמפרטורה של|g:T» {T}. «פרטו חישוביכם|v:show».`,
  },
  {
    id: 'S4',
    title: 'אידוי מים בטמפרטורת החדר',
    group: G.spont,
    topic: 'spont',
    note: `${STYLE} (נתוני CRC)`,
    input: `rxn: H2O(l) -> H2O(g)
dH = 44.0 kJ
dS = 118.8 J/K
T = room
ask: spontaneous`,
    text: `נתון תהליך האידוי של מים: {rxn}
{dH}
{dS}
א. חשבו את «שינוי האנטרופיה בסביבה|a:surr» «בטמפרטורת חדר|h:room». «פרטו חישוביכם|v:show».
ב. «האם המים מתאדים באופן ספונטני|a:spont» «בתנאים אלו|h:same»? «נמקו|v:explain».`,
  },
  {
    id: 'S5',
    title: 'אידוי מים ב־100°C',
    group: G.spont,
    topic: 'spont',
    note: `${STYLE} (נתוני CRC)`,
    input: `rxn: H2O(l) -> H2O(g)
dH = 44.0 kJ
dS = 118.8 J/K
T = 100 C
ask: spontaneous`,
    text: `נתון תהליך האידוי של מים: {rxn}
{dH}
{dS}
חשבו את «$\\Delta S^\\circ_t$|a:tot» (יקום) «בטמפרטורה של|g:T» {T}, וקבעו «האם התהליך ספונטני|a:spont». «פרטו חישוביכם|v:show».`,
  },

  // ---------------- back from ΔS°universe / surroundings
  {
    id: 'B23-282-2d2',
    title: 'מתאנול וקיטור: $\\Delta H^\\circ$ מ־$\\Delta S^\\circ$ יקום',
    group: G.back,
    topic: 'back',
    note: bag(2023, 37282, 'שאלה 2ד'),
    original: pg('37282-2023-6-p4'),
    input: `rxn: CH3OH(g) + H2O(g) -> 3H2(g) + CO2(g)
S CH3OH(g) = 239.9
S H2O(g) = 188.7
S H2(g) = 130.6
S CO2(g) = 213.6
dS total = 10.4 J/K
T = 298 K
ask: back`,
    text: `מתאנול מגיב עם קיטור ונוצר מימן על פי תגובה (3): {rxn}
«בטבלה הנתונה מוצגים ערכים של אנטרופיה מולרית תקנית|g:table»: {table}
«בטמפרטורה|g:T» {T} «השינוי באנטרופיה של היקום|g:dStot» הוא: {dStot}.
«חשבו את שינוי האנתלפייה|a:dH-back», $\\Delta H^\\circ_3$, עבור תגובה (3). «פרטו את החישובים|v:show».`,
  },
  {
    id: 'B21-282-2c',
    title: 'אמוניום חנקתי: $\\Delta H^\\circ$ מ־$\\Delta S^\\circ$ סביבה',
    group: G.back,
    topic: 'back',
    note: bag(2021, 37282, 'שאלה 2ג ii'),
    original: pg('37282-2021-6-p4'),
    input: `rxn: 2NH4NO3(s) -> 2N2(g) + O2(g) + 4H2O(g)
dS surr = 792 J/K
T = room
ask: back`,
    text: `תגובה (2): {rxn}
«בטמפרטורת החדר|h:room» «השינוי באנטרופיה של הסביבה|g:dSsurr» הוא {dSsurr}.
«חשב את שינוי האנתלפייה|a:dH-back», $\\Delta H^\\circ_{(2)}$, עבור תגובה (2). «פרט את חישוביך|v:show».`,
  },
  {
    id: 'X-back-sys',
    title: '$\\mathrm{NH_3}$: $\\Delta S^\\circ$ מערכת מ־$\\Delta S^\\circ$ יקום',
    group: G.back,
    topic: 'back',
    note: `${STYLE} (נתוני PROBLEMS)`,
    input: `rxn: N2(g) + 3H2(g) -> 2NH3(g)
dH = -92 kJ
dS total = 31 J/K
T = 400 K
ask: back`,
    text: `נתונה התגובה: {rxn} {dH}
«בטמפרטורה של|g:T» {T} «השינוי באנטרופיה של היקום|g:dStot» הוא {dStot}.
«חשבו את שינוי האנטרופיה של המערכת|a:dS-back». «פרטו חישוביכם|v:show».`,
  },

  // ---------------- signs without numbers
  {
    id: 'B21-282-5a',
    title: 'ספונטני ו־$\\Delta S^\\circ<0$: אקסו או אנדו?',
    group: G.signs,
    topic: 'signs',
    note: bag(2021, 37282, 'מועד נבצרים, שאלה 2א ii'),
    original: pg('37282-2021-5-p5'),
    input: `rxn: CO(g) + 1/2O2(g) -> CO2(g)
dS = -86.8 J/K
sign dS total > 0
T = 298 K
find: dH
ask: signs`,
    text: `בגלאי מתרחשת תגובה (1): {rxn}, ובסעיף הקודם חישבתם: {dS}.
«תגובה (1) היא תגובה ספונטנית|h:spont» «בתנאי תקן|h:std», «בטמפרטורה|g:T» {T}.
«קבע אם תגובה (1) היא אנדותרמית או אקסותרמית|a:exo-endo». «נמק|v:explain».`,
  },
  {
    id: 'B23-282-1b',
    title: '$\\mathrm{N_2O_4}$: מי גדול יותר, סביבה או מערכת?',
    group: G.signs,
    topic: 'signs',
    note: bag(2023, 37282, 'שאלה 1ב'),
    original: pg('37282-2023-6-p3'),
    input: `rxn: 2NO2(g) -> N2O4(g)
sign dH < 0
sign dS sys < 0
sign dS total > 0
T = 298 K
find: compare
ask: signs`,
    text: `תגובה (1): {rxn}, {sign}
«תגובה (1) ספונטנית|h:spont» «בטמפרטורה|g:T» {T}.
«קבעו אם השינוי באנטרופיה של הסביבה גדול מן השינוי באנטרופיה של המערכת או קטן ממנו|a:compare» «באותה טמפרטורה|h:same». «נמקו|v:explain».`,
  },
  {
    id: 'B21-282-1e',
    title: '$\\mathrm{SO_2Cl_2}$ לא ספונטני: מי גדול יותר?',
    group: G.signs,
    topic: 'signs',
    note: bag(2021, 37282, 'שאלה 1ה'),
    original: pg('37282-2021-6-p3'),
    input: `rxn: SO2Cl2(g) -> SO2(g) + Cl2(g)
sign dH > 0
sign dS sys > 0
sign dS total < 0
T = 648 K
find: compare
ask: signs`,
    text: `לפניך שני נתונים הנוגעים לתגובה (1): {rxn}, {sign}
«תגובה (1) אינה ספונטנית|h:notspont» «בטמפרטורה של|g:T» {T}.
«קבע אם השינוי באנטרופיה של הסביבה גדול בערכו המוחלט מן השינוי באנטרופיה של המערכת או קטן ממנו|a:compare». «נמק|v:explain».`,
  },
  {
    id: 'B26-282-2b',
    title: '$\\mathrm{HBr}$: יש טמפרטורה שבה זה ספונטני?',
    group: G.signs,
    topic: 'signs',
    note: bag(2026, 37282, 'שאלה 2ב'),
    original: pg('37282-2026-6-p4'),
    input: `rxn: H2(g) + Br2(g) -> 2HBr(g)
dH = -103 kJ
dS = 20.9 J/K
find: any-T
ask: signs`,
    text: `תגובה (1): {rxn} {dH}, ובסעיף הקודם חישבתם: {dS}.
«קבעו אם יש טמפרטורה שבה תגובה (1) היא ספונטנית|a:any-T». «נמקו את קביעתכם|v:explain».`,
  },
  {
    id: 'B25-282-1d',
    title: 'שרפת $\\mathrm{CO}$: הסביבה עולה או יורדת?',
    group: G.signs,
    topic: 'signs',
    note: bag(2025, 37282, 'שאלה 1א iv'),
    original: pg('37282-2025-6-p2'),
    input: `rxn: 2CO(g) + O2(g) -> 2CO2(g)
dH = -566 kJ
find: dS surr
ask: signs`,
    text: `תגובה (1): {rxn}, ובסעיף הקודם חישבתם: {dH}.
«קבעו אם האנטרופיה של הסביבה עולה או יורדת|a:surr-dir» בהתרחשות תגובה (1). «נמקו|v:explain».`,
  },
  {
    id: 'B21-282-2c1',
    title: 'הסביבה עולה: אקסו או אנדו (בלי חישוב)?',
    group: G.signs,
    topic: 'signs',
    note: bag(2021, 37282, 'שאלה 2ג i'),
    original: pg('37282-2021-6-p4'),
    input: `rxn: 2NH4NO3(s) -> 2N2(g) + O2(g) + 4H2O(g)
dS surr = 792 J/K
T = room
find: dH
ask: signs`,
    text: `תגובה (2): {rxn}
«בטמפרטורת החדר|h:room» «השינוי באנטרופיה של הסביבה|g:dSsurr» הוא {dSsurr}.
«קבע אם תגובה (2) היא אנדותרמית או אקסותרמית|a:exo-endo». «נמק ללא חישובים|v:no-calc».`,
  },
  {
    id: 'B22-282-2f',
    title: 'לימונן נשרף: מי גדול יותר?',
    group: G.signs,
    topic: 'signs',
    note: bag(2022, 37282, 'שאלה 2ו'),
    original: pg('37282-2022-6-p4'),
    input: `rxn: C10H16(g) + 14O2(g) -> 10CO2(g) + 8H2O(l)
sign dS sys < 0
sign dS total > 0
find: compare
ask: signs`,
    text: `לימונן במצב גז נשרף על פי תגובה (3): {rxn}, {sign}
«תגובה (3) היא ספונטנית|h:spont» בטמפרטורת החדר.
«קבעו אם העלייה באנטרופיה של הסביבה גדולה מן הירידה באנטרופיית המערכת או קטנה ממנה|a:compare». «נמקו|v:explain».`,
  },

  // ---------------- spontaneous but not happening
  {
    id: 'K1',
    title: 'מימן וחמצן בכלי: למה לא קורה?',
    group: G.kin,
    topic: 'kinetic',
    note: 'בעקבות בגרות 2023, שאלון 37282, שאלה 2 (הנתון על היקום נוסף כאן)',
    original: pg('37282-2023-6-p4'),
    input: `rxn: H2(g) + 1/2O2(g) -> H2O(g)
sign dS total > 0
observed: no reaction
ask: kinetic`,
    text: `«תערובת של הגזים מימן וחמצן נשמרת בכלי זכוכית סגור לאורך זמן, ללא שינוי|h:none».
לתגובה {rxn} נתון ש־{sign} בטמפרטורת החדר.
«מדוע התגובה לא מתרחשת|a:why-not»? «הציעו דרך|a:fix» שבה התגובה תתרחש.`,
  },
  {
    id: 'K2',
    title: 'תגובה לא ספונטנית: זרז יעזור?',
    group: G.kin,
    topic: 'kinetic',
    note: 'תגובה כללית (ללא חומרים אמיתיים)',
    input: `sign dS total < 0
find: catalyst
ask: kinetic`,
    text: `לתגובה A נתון ש־{sign} בטמפרטורת החדר.
«האם הוספת זרז תגרום לתגובה A להתרחש|a:cat-help»? «נמקו|v:explain».`,
  },
];

export const byId = (id: string) => LIBRARY.find((p) => p.id === id);
