// The problem library (BRIEF §8). Each problem is stored in the same input format the user types.
// Data: PROBLEMS.md (the user's), or CRC values from the `chemicals` package (BRIEF §8).

export interface LibProblem {
  id: string;
  title: string; // Hebrew, short
  group: string;
  input: string;
  original?: string[]; // files in public/exam-graphs
  note?: string; // shown under the title
}

export const LIBRARY: LibProblem[] = [
  // ---------------- 6.9 ΔS° surroundings, ΔS° universe, spontaneous?
  {
    id: 'S1',
    title: 'יצירת $\\mathrm{NH_3}$ ב־298 K',
    group: 'ספונטני? ($\\Delta S^\\circ$ יקום)',
    input: `rxn: N2(g) + 3H2(g) -> 2NH3(g)
dH = -92 kJ
dS = -199 J/K
T = 298 K
ask: spontaneous`,
  },
  {
    id: 'S2',
    title: 'פירוק $\\mathrm{CaCO_3}$ ב־25°C',
    group: 'ספונטני? ($\\Delta S^\\circ$ יקום)',
    input: `rxn: CaCO3(s) -> CaO(s) + CO2(g)
dH = 178 kJ
dS = 161 J/K
T = 25 C
ask: spontaneous`,
  },
  {
    id: 'S3',
    title: 'פירוק $\\mathrm{CaCO_3}$ ב־1200 K',
    group: 'ספונטני? ($\\Delta S^\\circ$ יקום)',
    input: `rxn: CaCO3(s) -> CaO(s) + CO2(g)
dH = 178 kJ
dS = 161 J/K
T = 1200 K
ask: spontaneous`,
  },
  {
    id: 'S4',
    title: 'אידוי מים בטמפרטורת החדר',
    group: 'ספונטני? ($\\Delta S^\\circ$ יקום)',
    input: `rxn: H2O(l) -> H2O(g)
dH = 44.0 kJ
dS = 118.8 J/K
T = room
ask: spontaneous`,
  },
  {
    id: 'S5',
    title: 'אידוי מים ב־100°C',
    group: 'ספונטני? ($\\Delta S^\\circ$ יקום)',
    input: `rxn: H2O(l) -> H2O(g)
dH = 44.0 kJ
dS = 118.8 J/K
T = 100 C
ask: spontaneous`,
  },
];

export const byId = (id: string) => LIBRARY.find((p) => p.id === id);
