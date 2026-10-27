// The problem library (BRIEF §8). Each problem is stored in the input format (the data) plus `text`: the question
// as an exam writes it (see engine/text.ts). Data: PROBLEMS.md (the user's), or CRC values (`chemicals` package).

export interface LibProblem {
  id: string;
  title: string; // Hebrew, short
  group: string;
  topic: string; // learn/topics.ts
  input: string;
  text?: string; // exam wording with {slots} and «phrase|tag»
  original?: string[]; // files in public/exam-graphs
  note?: string; // shown under the title
}

const STYLE = 'ניסוח בסגנון הבגרות';
const G_SPONT = 'ספונטני? ($\\Delta S^\\circ$ יקום)';

export const LIBRARY: LibProblem[] = [
  // ---------------- ΔS° surroundings, ΔS° universe, spontaneous?
  {
    id: 'S1',
    title: 'יצירת $\\mathrm{NH_3}$ ב־298 K',
    group: G_SPONT,
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
    group: G_SPONT,
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
    group: G_SPONT,
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
    group: G_SPONT,
    topic: 'spont',
    note: STYLE,
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
    group: G_SPONT,
    topic: 'spont',
    note: STYLE,
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
];

export const byId = (id: string) => LIBRARY.find((p) => p.id === id);
