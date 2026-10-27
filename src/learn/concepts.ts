// "What is it": the few ideas a topic rests on, one card each, before any number.
// Every sentence here is one of the rules in BRIEF §5 (named in the comment) or the מיקוד's wording.

import type { Step } from '../lesson/lessons';
import { topicById } from './topics';

const S = (who: string) => `\\Delta S^\\circ_{\\text{${who}}}`;
const UP = { html: '↑ עולה', cls: 'up' };
const DOWN = { html: '↓ יורדת', cls: 'down' };

function spont(): Step[] {
  const recipe = topicById('spont')!.recipe!;
  return [
    {
      // מיקוד: מערכת וסביבה; T15
      stage: 1,
      group: 'מה זה',
      title: 'מערכת, סביבה, יקום',
      say: 'שלוש מילים: מערכת, סביבה, יקום',
      why: 'במבחן כותבים גם "כולל", TOTAL או $\\Delta S^\\circ_t$. כולם = יקום.',
      run: (c, t) => {
        c.nest(t, { inner: 'מערכת = התגובה עצמה', outer: 'סביבה = כל מה שמסביב', foot: 'יקום = מערכת + סביבה' });
      },
    },
    {
      // T15, T16
      stage: 1,
      group: 'מה זה',
      title: 'החוק השני',
      say: `מה מחליט אם תהליך ספונטני? רק $${S('יקום')}$`,
      why: 'ספונטני = התהליך יכול לקרות מעצמו.\nזה לא אומר כמה מהר הוא קורה.',
      run: (c, t) => {
        c.rule(t, [`אם $${S('יקום')} > 0$ ← ספונטני`, `אם $${S('יקום')} < 0$ ← לא ספונטני`], []);
        c.line(t, 'לא מסתכלים רק על המערכת: צריך גם את הסביבה', 'dim');
      },
    },
    {
      // T1 + T14
      stage: 1,
      group: 'מה זה',
      title: 'אקסותרמית ← הסביבה עולה',
      say: `אקסותרמית ($\\Delta H^\\circ < 0$): חום יוצא לסביבה`,
      why: 'החום שיוצא מהתגובה נכנס לסביבה, ולכן האנטרופיה של הסביבה עולה.',
      run: (c, t) => {
        c.heat(t, { dir: 'out', sys: 'מערכת', surr: 'סביבה', chip: UP });
        c.line(t, `$\\Delta H^\\circ < 0$ ← $${S('סביבה')} > 0$`, 'calc');
      },
    },
    {
      // T1 + T14
      stage: 1,
      group: 'מה זה',
      title: 'אנדותרמית ← הסביבה יורדת',
      say: `אנדותרמית ($\\Delta H^\\circ > 0$): חום נכנס מהסביבה`,
      why: 'התגובה לוקחת חום מהסביבה, ולכן האנטרופיה של הסביבה יורדת.',
      run: (c, t) => {
        c.heat(t, { dir: 'in', sys: 'מערכת', surr: 'סביבה', chip: DOWN });
        c.line(t, `$\\Delta H^\\circ > 0$ ← $${S('סביבה')} < 0$`, 'calc');
      },
    },
    {
      // T14
      stage: 1,
      group: 'מה זה',
      title: 'הנוסחה לסביבה',
      say: `כמה הסביבה משתנה: $${S('סביבה')} = -\\dfrac{\\Delta H^\\circ}{T}$`,
      why: 'המינוס הופך את הסימן: $\\Delta H^\\circ$ שלילי נותן סביבה חיובית.',
      run: (c, t) => {
        c.grid(t, [
          ['בנוסחה', 'שימו לב'],
          ['$\\Delta H^\\circ$', 'ב־J: מכפילים kJ ב־1000'],
          ['$T$', 'בקלווין: °C ועוד 273'],
          ['המינוס', 'הופך את הסימן של $\\Delta H^\\circ$'],
        ]);
      },
    },
    {
      stage: 1,
      group: 'מה זה',
      title: 'המתכון',
      say: 'המתכון לכל שאלה כזו: שלושה צעדים',
      why: 'אותו מתכון בכל שאלה: סביבה, יקום, סימן.',
      cls: 'exam',
      run: (c, t) => {
        c.recipe(t, recipe);
      },
    },
  ];
}

const CONCEPTS: Record<string, () => Step[]> = { spont };

export const conceptOf = (topic: string): Step[] | null => CONCEPTS[topic]?.() ?? null;
export const hasConcept = (topic: string) => topic in CONCEPTS;
