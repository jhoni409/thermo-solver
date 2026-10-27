// The data bank of the generator (BRIEF §8). Real values only:
//   ΔH°f and S°: CRC values from the `chemicals` package, rounded to 1 decimal (carbon and S8 left out: bad entries).
//   Bond enthalpies: only the values the library already uses (bagrut 2025 / PROBLEMS.md).
//   Molar masses: from the atomic masses the bagrut uses (H = 1, C = 12, O = 16, Cl = 35.5 …).
// Reactions are real reactions, balanced (tests/generate.test.ts checks every atom).

import { F, type Frac } from './frac';

export interface SpData {
  he: string; // Hebrew name
  H?: string; // ΔH°f, kJ/mol (absent = element in its standard state, 0)
  S: string; // S°, J/(mol·K)
}

/** by "formula(state)" */
export const SPECIES: Record<string, SpData> = {
  // elements in their standard state
  'H2(g)': { he: 'מימן', S: '130.7' },
  'O2(g)': { he: 'חמצן', S: '205.2' },
  'N2(g)': { he: 'חנקן', S: '191.6' },
  'Cl2(g)': { he: 'כלור', S: '223.1' },
  'F2(g)': { he: 'פלואור', S: '202.8' },
  'Br2(l)': { he: 'ברום', S: '152.2' },
  'I2(s)': { he: 'יוד', S: '116.1' },
  'Mg(s)': { he: 'מגנזיום', S: '32.7' },
  'Ca(s)': { he: 'סידן', S: '41.6' },
  'Fe(s)': { he: 'ברזל', S: '27.3' },
  'Na(s)': { he: 'נתרן', S: '51.3' },
  'Cu(s)': { he: 'נחושת', S: '33.2' },
  'Zn(s)': { he: 'אבץ', S: '41.6' },
  // elements in another state
  'Br2(g)': { he: 'ברום', H: '30.9', S: '245.5' },
  'I2(g)': { he: 'יוד', H: '62.4', S: '260.7' },
  'I2(l)': { he: 'יוד', H: '13.5', S: '150.4' },
  // compounds
  'H2O(l)': { he: 'מים', H: '-285.8', S: '70.0' },
  'H2O(g)': { he: 'מים', H: '-241.8', S: '188.8' },
  'CO2(g)': { he: 'פחמן דו־חמצני', H: '-393.5', S: '213.8' },
  'CO(g)': { he: 'פחמן חד־חמצני', H: '-110.5', S: '197.7' },
  'CH4(g)': { he: 'מתאן', H: '-74.5', S: '186.3' },
  'C2H6(g)': { he: 'אתאן', H: '-83.8', S: '229.2' },
  'C3H8(g)': { he: 'פרופאן', H: '-104.4', S: '270.3' },
  'C4H10(g)': { he: 'בוטאן', H: '-125.9', S: '304.4' },
  'C2H4(g)': { he: 'אתן', H: '52.6', S: '219.3' },
  'C2H2(g)': { he: 'אתין', H: '228.3', S: '200.9' },
  'C3H6(g)': { he: 'פרופן', H: '20.4', S: '266.7' },
  'CH3OH(l)': { he: 'מתנול', H: '-238.4', S: '126.8' },
  'CH3OH(g)': { he: 'מתנול', H: '-200.7', S: '239.9' },
  'C2H5OH(l)': { he: 'אתנול', H: '-277.0', S: '160.7' },
  'C2H5OH(g)': { he: 'אתנול', H: '-234.6', S: '281.6' },
  'C6H6(l)': { he: 'בנזן', H: '49.1', S: '173.4' },
  'C6H6(g)': { he: 'בנזן', H: '83.2', S: '269.2' },
  'C8H18(l)': { he: 'אוקטאן', H: '-249.7', S: '361.1' },
  'CH3COOH(l)': { he: 'חומצה אצטית', H: '-483.6', S: '159.8' },
  'NH3(g)': { he: 'אמוניה', H: '-45.6', S: '192.8' },
  'NO(g)': { he: 'חנקן חד־חמצני', H: '91.1', S: '210.8' },
  'NO2(g)': { he: 'חנקן דו־חמצני', H: '34.0', S: '240.1' },
  'N2O4(g)': { he: 'דו־חנקן ארבע־חמצני', H: '10.8', S: '304.4' },
  'N2O(g)': { he: 'דו־חנקן חמצני', H: '82.6', S: '220.0' },
  'HCl(g)': { he: 'מימן כלורי', H: '-92.2', S: '186.9' },
  'HBr(g)': { he: 'מימן ברומי', H: '-35.9', S: '198.7' },
  'HF(g)': { he: 'מימן פלואורי', H: '-272.7', S: '173.8' },
  'HI(g)': { he: 'מימן יודי', H: '26.5', S: '206.6' },
  'SO2(g)': { he: 'גופרית דו־חמצנית', H: '-296.8', S: '248.2' },
  'SO3(g)': { he: 'גופרית תלת־חמצנית', H: '-395.7', S: '256.8' },
  'SO3(l)': { he: 'גופרית תלת־חמצנית', H: '-441.0', S: '113.8' },
  'SO3(s)': { he: 'גופרית תלת־חמצנית', H: '-454.5', S: '70.7' },
  'H2S(g)': { he: 'מימן גופרתי', H: '-20.6', S: '205.8' },
  'CaCO3(s)': { he: 'סידן פחמתי', H: '-1207.6', S: '91.7' },
  'CaO(s)': { he: 'סידן חמצני', H: '-634.9', S: '38.1' },
  'MgO(s)': { he: 'מגנזיום חמצני', H: '-601.6', S: '27.0' },
  'Fe2O3(s)': { he: 'ברזל תחמוצתי', H: '-824.2', S: '87.4' },
  'NaCl(s)': { he: 'נתרן כלורי', H: '-411.2', S: '72.1' },
  'H2O2(l)': { he: 'מימן על־חמצני', H: '-187.8', S: '109.6' },
  'H2O2(g)': { he: 'מימן על־חמצני', H: '-135.4', S: '232.7' },
  'N2H4(l)': { he: 'הידרזין', H: '50.6', S: '121.2' },
  'N2H4(g)': { he: 'הידרזין', H: '95.5', S: '238.5' },
  'CH3Cl(g)': { he: 'כלורומתאן', H: '-82.6', S: '234.6' },
  'PCl3(g)': { he: 'זרחן תלת־כלורי', H: '-287.0', S: '311.8' },
  'PCl3(l)': { he: 'זרחן תלת־כלורי', H: '-319.7', S: '217.1' },
  'PCl5(g)': { he: 'זרחן חמש־כלורי', H: '-374.9', S: '364.6' },
  'NH4Cl(s)': { he: 'אמוניום כלורי', H: '-314.4', S: '94.6' },
  'HCN(g)': { he: 'מימן ציאנידי', H: '129.3', S: '201.8' },
  'CCl4(l)': { he: 'פחמן ארבע־כלורי', H: '-130.1', S: '215.7' },
  'CCl4(g)': { he: 'פחמן ארבע־כלורי', H: '-97.6', S: '309.7' },
  'CuO(s)': { he: 'נחושת חמצנית', H: '-157.3', S: '42.6' },
  'ZnO(s)': { he: 'אבץ חמצני', H: '-350.5', S: '43.7' },
  'NH4NO3(s)': { he: 'אמוניום חנקתי', H: '-365.6', S: '151.1' },
  'TiCl4(l)': { he: 'טיטניום ארבע־כלורי', H: '-804.2', S: '252.3' },
  'TiCl4(g)': { he: 'טיטניום ארבע־כלורי', H: '-763.2', S: '353.2' },
};

export const dHfOf = (k: string): Frac => F(SPECIES[k].H ?? '0');
export const S0of = (k: string): Frac => F(SPECIES[k].S);
export const isElementStd = (k: string) => SPECIES[k] != null && SPECIES[k].H == null;

// ---------------------------------------------------------------- formulas

const ATOMIC: Record<string, string> = {
  H: '1', C: '12', N: '14', O: '16', F: '19', Na: '23', Mg: '24', Al: '27', P: '31', S: '32', Cl: '35.5', Ca: '40', Ti: '48', Fe: '56', Cu: '63.5', Zn: '65.4', Br: '80', I: '127',
};

/** "C2H5OH" → {C:2, H:6, O:1}; brackets allowed: "Ca(OH)2" */
export function atoms(f: string): Record<string, number> {
  const out: Record<string, number> = {};
  const stack: Record<string, number>[] = [out];
  const re = /([A-Z][a-z]?|\(|\))(\d*)/g;
  let m: RegExpExecArray | null;
  let pos = 0;
  while ((m = re.exec(f))) {
    if (m.index !== pos) throw new Error(`bad formula ${f}`);
    pos = re.lastIndex;
    const n = m[2] ? parseInt(m[2], 10) : 1;
    if (m[1] === '(') stack.push({});
    else if (m[1] === ')') {
      const g = stack.pop()!;
      const top = stack[stack.length - 1];
      for (const [e, c] of Object.entries(g)) top[e] = (top[e] ?? 0) + c * n;
    } else {
      const top = stack[stack.length - 1];
      top[m[1]] = (top[m[1]] ?? 0) + n;
    }
  }
  if (pos !== f.length || stack.length !== 1) throw new Error(`bad formula ${f}`);
  return out;
}

export function molarMass(f: string): Frac {
  return Object.entries(atoms(f)).reduce((a, [e, n]) => {
    if (!ATOMIC[e]) throw new Error(`no atomic mass for ${e}`);
    return a.add(F(ATOMIC[e]).mul(n));
  }, F(0));
}

// ---------------------------------------------------------------- reactions

/** one side: [coefficient, "formula(state)"] */
export type Side = [string, string][];
export interface RealRxn {
  R: Side;
  P: Side;
  /** a short Hebrew description, without numbers */
  he: string;
  /** which pools it is good for */
  tags: Tag[];
}
export type Tag =
  | 'comb' // a combustion (a fuel burns in oxygen)
  | 'slow' // spontaneous at room temperature but does not happen without a spark / heating / a catalyst
  | 'form'; // the formation of one compound from its elements

const R = (eq: string, he: string, ...tags: Tag[]): RealRxn => {
  const side = (s: string): Side =>
    s.split(' + ').map((t) => {
      const m = /^(\d+\/\d+|\d+)?(.+)$/.exec(t.trim())!;
      return [m[1] ?? '1', m[2]];
    });
  const [l, r] = eq.split(' -> ');
  return { R: side(l), P: side(r), he, tags };
};

/** fuels: CxHyOz (+ N) burn to CO2 and H2O (liquid or gas) */
const FUELS: [string, boolean][] = [
  // [fuel, slow at room temperature in air]
  ['CH4(g)', true],
  ['C2H6(g)', true],
  ['C3H8(g)', true],
  ['C4H10(g)', true],
  ['C2H4(g)', false],
  ['C2H2(g)', false],
  ['C3H6(g)', false],
  ['CH3OH(l)', true],
  ['CH3OH(g)', false],
  ['C2H5OH(l)', true],
  ['C2H5OH(g)', false],
  ['C6H6(l)', false],
  ['C8H18(l)', true],
  ['CH3COOH(l)', false],
];

function frac(n: number, d: number): string {
  const g = (a: number, b: number): number => (b ? g(b, a % b) : a);
  const k = g(n, d);
  return d / k === 1 ? `${n / k}` : `${n / k}/${d / k}`;
}

function combustion(fuel: string, water: 'l' | 'g', slow: boolean): RealRxn {
  const f = fuel.replace(/\(.+\)$/, '');
  const a = atoms(f);
  const C = a.C ?? 0;
  const H = a.H ?? 0;
  const O = a.O ?? 0;
  // fuel + (C + H/4 − O/2) O2 → C CO2 + H/2 H2O, in quarters
  const o2q = 4 * C + H - 2 * O;
  const R: Side = [['1', fuel], [frac(o2q, 4), 'O2(g)']];
  const P: Side = [[`${C}`, 'CO2(g)'], [frac(H, 2), `H2O(${water})`]];
  return { R, P, he: `שרפה של ${SPECIES[fuel].he}`, tags: ['comb', ...(slow ? (['slow'] as Tag[]) : [])] };
}

export const REACTIONS: RealRxn[] = [
  ...FUELS.flatMap(([f, slow]) => [combustion(f, 'l', slow), combustion(f, 'g', slow)]),
  R('2H2(g) + O2(g) -> 2H2O(l)', 'שרפה של מימן', 'comb', 'slow'),
  R('2H2(g) + O2(g) -> 2H2O(g)', 'שרפה של מימן', 'comb', 'slow'),
  R('2CO(g) + O2(g) -> 2CO2(g)', 'שרפה של פחמן חד־חמצני', 'comb'),
  R('N2H4(l) + O2(g) -> N2(g) + 2H2O(g)', 'שרפה של הידרזין', 'comb'),
  R('N2H4(g) + O2(g) -> N2(g) + 2H2O(g)', 'שרפה של הידרזין', 'comb'),
  R('2H2S(g) + 3O2(g) -> 2SO2(g) + 2H2O(g)', 'שרפה של מימן גופרתי', 'comb'),
  R('4NH3(g) + 5O2(g) -> 4NO(g) + 6H2O(g)', 'חמצון של אמוניה', 'slow'),
  R('4NH3(g) + 3O2(g) -> 2N2(g) + 6H2O(g)', 'שרפה של אמוניה', 'comb'),
  R('N2(g) + 3H2(g) -> 2NH3(g)', 'הפקת אמוניה', 'slow'),
  R('2SO2(g) + O2(g) -> 2SO3(g)', 'חמצון של גופרית דו־חמצנית', 'slow'),
  R('2SO2(g) + O2(g) -> 2SO3(l)', 'חמצון של גופרית דו־חמצנית'),
  R('N2(g) + O2(g) -> 2NO(g)', 'תגובה בין חנקן לחמצן'),
  R('2NO(g) + O2(g) -> 2NO2(g)', 'חמצון של חנקן חד־חמצני'),
  R('2NO2(g) -> N2O4(g)', 'דימריזציה של חנקן דו־חמצני'),
  R('2N2O(g) -> 2N2(g) + O2(g)', 'פירוק של דו־חנקן חמצני'),
  R('2NO(g) -> N2(g) + O2(g)', 'פירוק של חנקן חד־חמצני'),
  R('CaCO3(s) -> CaO(s) + CO2(g)', 'פירוק של סידן פחמתי'),
  R('H2(g) + Cl2(g) -> 2HCl(g)', 'תגובה בין מימן לכלור', 'slow'),
  R('H2(g) + Br2(l) -> 2HBr(g)', 'תגובה בין מימן לברום'),
  R('H2(g) + Br2(g) -> 2HBr(g)', 'תגובה בין מימן לברום'),
  R('H2(g) + F2(g) -> 2HF(g)', 'תגובה בין מימן לפלואור'),
  R('H2(g) + I2(s) -> 2HI(g)', 'תגובה בין מימן ליוד'),
  R('2HI(g) -> H2(g) + I2(g)', 'פירוק של מימן יודי'),
  R('CO(g) + H2O(g) -> CO2(g) + H2(g)', 'תגובת גז המים'),
  R('CH4(g) + H2O(g) -> CO(g) + 3H2(g)', 'הפקת מימן ממתאן'),
  R('CO2(g) + CH4(g) -> 2CO(g) + 2H2(g)', 'הפקת גז סינתזה'),
  R('CO(g) + 2H2(g) -> CH3OH(g)', 'הפקת מתנול'),
  R('CO(g) + 2H2(g) -> CH3OH(l)', 'הפקת מתנול'),
  R('CO2(g) + 3H2(g) -> CH3OH(g) + H2O(g)', 'הפקת מתנול מפחמן דו־חמצני'),
  R('C2H4(g) + H2(g) -> C2H6(g)', 'הוספת מימן לאתן'),
  R('C2H2(g) + 2H2(g) -> C2H6(g)', 'הוספת מימן לאתין'),
  R('C2H4(g) + H2O(g) -> C2H5OH(g)', 'הפקת אתנול'),
  R('C2H4(g) + H2O(g) -> C2H5OH(l)', 'הפקת אתנול'),
  R('2H2O2(l) -> 2H2O(l) + O2(g)', 'פירוק של מימן על־חמצני', 'slow'),
  R('2H2O(l) -> 2H2(g) + O2(g)', 'פירוק של מים'),
  R('PCl3(g) + Cl2(g) -> PCl5(g)', 'הפקת זרחן חמש־כלורי'),
  R('2Mg(s) + O2(g) -> 2MgO(s)', 'שרפה של מגנזיום', 'comb'),
  R('2Ca(s) + O2(g) -> 2CaO(s)', 'חמצון של סידן'),
  R('4Fe(s) + 3O2(g) -> 2Fe2O3(s)', 'חלודה של ברזל'),
  R('Fe2O3(s) + 3CO(g) -> 2Fe(s) + 3CO2(g)', 'הפקת ברזל'),
  R('2Na(s) + Cl2(g) -> 2NaCl(s)', 'תגובה בין נתרן לכלור'),
  R('NH3(g) + HCl(g) -> NH4Cl(s)', 'תגובה בין אמוניה למימן כלורי'),
  R('2Cu(s) + O2(g) -> 2CuO(s)', 'חמצון של נחושת'),
  R('2Zn(s) + O2(g) -> 2ZnO(s)', 'חמצון של אבץ'),
  R('CuO(s) + H2(g) -> Cu(s) + H2O(g)', 'חיזור של נחושת חמצנית'),
  R('ZnO(s) + CO(g) -> Zn(s) + CO2(g)', 'הפקת אבץ'),
  R('2NH4NO3(s) -> 2N2(g) + O2(g) + 4H2O(g)', 'פירוק של אמוניום חנקתי'),
  R('NH4NO3(s) -> N2O(g) + 2H2O(g)', 'פירוק של אמוניום חנקתי'),
  R('CH4(g) + Cl2(g) -> CH3Cl(g) + HCl(g)', 'הכלרה של מתאן'),
  R('CH4(g) + 4Cl2(g) -> CCl4(l) + 4HCl(g)', 'הכלרה של מתאן'),
  R('CH4(g) + NH3(g) -> HCN(g) + 3H2(g)', 'הפקת מימן ציאנידי'),
  // formation of one mole from the elements
  R('1/2N2(g) + 3/2H2(g) -> NH3(g)', 'התהוות של אמוניה', 'form'),
  R('1/2N2(g) + 1/2O2(g) -> NO(g)', 'התהוות של חנקן חד־חמצני', 'form'),
  R('1/2N2(g) + O2(g) -> NO2(g)', 'התהוות של חנקן דו־חמצני', 'form'),
  R('N2(g) + 2O2(g) -> N2O4(g)', 'התהוות של דו־חנקן ארבע־חמצני', 'form'),
  R('N2(g) + 1/2O2(g) -> N2O(g)', 'התהוות של דו־חנקן חמצני', 'form'),
  R('H2(g) + 1/2O2(g) -> H2O(l)', 'התהוות של מים', 'form'),
  R('H2(g) + 1/2O2(g) -> H2O(g)', 'התהוות של מים', 'form'),
  R('H2(g) + O2(g) -> H2O2(l)', 'התהוות של מימן על־חמצני', 'form'),
  R('N2(g) + 2H2(g) -> N2H4(l)', 'התהוות של הידרזין', 'form'),
  R('1/2H2(g) + 1/2Cl2(g) -> HCl(g)', 'התהוות של מימן כלורי', 'form'),
  R('1/2H2(g) + 1/2F2(g) -> HF(g)', 'התהוות של מימן פלואורי', 'form'),
  R('Mg(s) + 1/2O2(g) -> MgO(s)', 'התהוות של מגנזיום חמצני', 'form'),
  R('Ca(s) + 1/2O2(g) -> CaO(s)', 'התהוות של סידן חמצני', 'form'),
  R('2Fe(s) + 3/2O2(g) -> Fe2O3(s)', 'התהוות של ברזל תחמוצתי', 'form'),
  R('Na(s) + 1/2Cl2(g) -> NaCl(s)', 'התהוות של נתרן כלורי', 'form'),
  R('1/2N2(g) + 2H2(g) + 1/2Cl2(g) -> NH4Cl(s)', 'התהוות של אמוניום כלורי', 'form'),
  R('N2(g) + 2H2(g) + 3/2O2(g) -> NH4NO3(s)', 'התהוות של אמוניום חנקתי', 'form'),
  R('Cu(s) + 1/2O2(g) -> CuO(s)', 'התהוות של נחושת חמצנית', 'form'),
  R('Zn(s) + 1/2O2(g) -> ZnO(s)', 'התהוות של אבץ חמצני', 'form'),
];

/** a single substance changing state, both states in the bank */
export const PHASES: [string, string, string][] = [
  // [formula, state 1, state 2]  (state 1 is the lower one: s < l < g)
  ['H2O', 'l', 'g'],
  ['CH3OH', 'l', 'g'],
  ['C2H5OH', 'l', 'g'],
  ['C6H6', 'l', 'g'],
  ['Br2', 'l', 'g'],
  ['I2', 's', 'g'],
  ['I2', 's', 'l'],
  ['I2', 'l', 'g'],
  ['SO3', 's', 'l'],
  ['SO3', 'l', 'g'],
  ['SO3', 's', 'g'],
  ['H2O2', 'l', 'g'],
  ['N2H4', 'l', 'g'],
  ['PCl3', 'l', 'g'],
  ['CCl4', 'l', 'g'],
  ['TiCl4', 'l', 'g'],
];

/** the other states of a formula that the bank has */
export const statesOf = (f: string): string[] => ['s', 'l', 'g'].filter((s) => SPECIES[`${f}(${s})`]);

// ---------------------------------------------------------------- bond enthalpies (kJ/mol)
// Two sets, one per question, never mixed in one question.

export interface BondSet {
  id: 'bagrut' | 'openstax';
  ref: string;
  E: Record<string, string>;
}

export const BOND_SETS: BondSet[] = [
  {
    id: 'bagrut',
    ref: 'בגרות 2025 (37381, שאלה 13) ו־PROBLEMS.md',
    E: { 'H-H': '436', 'Cl-Cl': '243', 'H-Cl': '432', 'C-H': '413', 'O=O': '498', 'C=O': '799', 'O-H': '463', 'C-C': '346', 'C#C': '835' },
  },
  {
    id: 'openstax',
    ref: 'OpenStax Chemistry 2e, Table 7.2',
    E: {
      'H-H': '436', 'C-H': '415', 'N-H': '390', 'O-H': '464', 'H-F': '569', 'H-Cl': '432', 'H-Br': '370', 'H-I': '295',
      'C-C': '345', 'C=C': '611', 'C#C': '837', 'C-N': '290', 'C#N': '891', 'C-O': '350', 'C=O': '741', 'C#O': '1080',
      'C-Cl': '330', 'N-N': '160', 'N#N': '946', 'O-O': '140', 'O=O': '498', 'F-F': '160', 'Cl-Cl': '243', 'Br-Br': '190', 'I-I': '150',
    },
  },
];

/** the bagrut set (the library's values) */
export const BOND_E = BOND_SETS[0].E;

/** the bonds in one molecule */
export const BONDS_OF: Record<string, [number, string][]> = {
  H2: [[1, 'H-H']],
  Cl2: [[1, 'Cl-Cl']],
  HCl: [[1, 'H-Cl']],
  O2: [[1, 'O=O']],
  CO2: [[2, 'C=O']],
  H2O: [[2, 'O-H']],
  CH4: [[4, 'C-H']],
  C2H6: [[1, 'C-C'], [6, 'C-H']],
  C2H2: [[1, 'C#C'], [2, 'C-H']],
  C3H8: [[2, 'C-C'], [8, 'C-H']],
  C4H10: [[3, 'C-C'], [10, 'C-H']],
  // OpenStax set only
  N2: [[1, 'N#N']],
  NH3: [[3, 'N-H']],
  N2H4: [[1, 'N-N'], [4, 'N-H']],
  HF: [[1, 'H-F']],
  F2: [[1, 'F-F']],
  HBr: [[1, 'H-Br']],
  Br2: [[1, 'Br-Br']],
  HI: [[1, 'H-I']],
  I2: [[1, 'I-I']],
  C2H4: [[1, 'C=C'], [4, 'C-H']],
  C3H6: [[1, 'C=C'], [1, 'C-C'], [6, 'C-H']],
  CH3OH: [[3, 'C-H'], [1, 'C-O'], [1, 'O-H']],
  C2H5OH: [[1, 'C-C'], [5, 'C-H'], [1, 'C-O'], [1, 'O-H']],
  CH3Cl: [[3, 'C-H'], [1, 'C-Cl']],
  CCl4: [[4, 'C-Cl']],
  H2O2: [[2, 'O-H'], [1, 'O-O']],
  CO: [[1, 'C#O']],
  HCN: [[1, 'C-H'], [1, 'C#N']],
};

/** gas reactions whose molecules are all in BONDS_OF */
export const BOND_RXNS: RealRxn[] = [
  R('H2(g) + Cl2(g) -> 2HCl(g)', 'תגובה בין מימן לכלור'),
  R('CH4(g) + 2O2(g) -> CO2(g) + 2H2O(g)', 'שרפה של מתאן', 'comb'),
  R('2C2H6(g) + 7O2(g) -> 4CO2(g) + 6H2O(g)', 'שרפה של אתאן', 'comb'),
  R('C2H6(g) + 7/2O2(g) -> 2CO2(g) + 3H2O(g)', 'שרפה של אתאן', 'comb'),
  R('C3H8(g) + 5O2(g) -> 3CO2(g) + 4H2O(g)', 'שרפה של פרופאן', 'comb'),
  R('2C4H10(g) + 13O2(g) -> 8CO2(g) + 10H2O(g)', 'שרפה של בוטאן', 'comb'),
  R('2C2H2(g) + 5O2(g) -> 4CO2(g) + 2H2O(g)', 'שרפה של אתין', 'comb'),
  R('C2H2(g) + 2H2(g) -> C2H6(g)', 'הוספת מימן לאתין'),
  R('2H2(g) + O2(g) -> 2H2O(g)', 'שרפה של מימן', 'comb'),
  R('2CH4(g) -> C2H6(g) + H2(g)', 'צימוד של מתאן'),
  R('C2H6(g) + H2(g) -> 2CH4(g)', 'פירוק של אתאן במימן'),
  R('C3H8(g) + H2(g) -> C2H6(g) + CH4(g)', 'פירוק של פרופאן במימן'),
  R('C4H10(g) + H2(g) -> 2C2H6(g)', 'פירוק של בוטאן במימן'),
  R('2C2H6(g) -> C4H10(g) + H2(g)', 'צימוד של אתאן'),
  R('C2H6(g) + CH4(g) -> C3H8(g) + H2(g)', 'צימוד של אתאן ומתאן'),
  R('C3H8(g) + CH4(g) -> C4H10(g) + H2(g)', 'צימוד של פרופאן ומתאן'),
  R('C2H2(g) + 3H2(g) -> 2CH4(g)', 'הוספת מימן לאתין'),
  R('C3H8(g) + 2H2(g) -> 3CH4(g)', 'פירוק של פרופאן במימן'),
  R('C4H10(g) + 3H2(g) -> 4CH4(g)', 'פירוק של בוטאן במימן'),
  R('CO2(g) + 4H2(g) -> CH4(g) + 2H2O(g)', 'הפקת מתאן מפחמן דו־חמצני'),
  R('4HCl(g) + O2(g) -> 2Cl2(g) + 2H2O(g)', 'חמצון של מימן כלורי'),
  // these need bonds that only the OpenStax set has
  R('N2(g) + 3H2(g) -> 2NH3(g)', 'הפקת אמוניה'),
  R('H2(g) + F2(g) -> 2HF(g)', 'תגובה בין מימן לפלואור'),
  R('H2(g) + Br2(g) -> 2HBr(g)', 'תגובה בין מימן לברום'),
  R('H2(g) + I2(g) -> 2HI(g)', 'תגובה בין מימן ליוד'),
  R('C2H4(g) + H2(g) -> C2H6(g)', 'הוספת מימן לאתן'),
  R('C3H6(g) + H2(g) -> C3H8(g)', 'הוספת מימן לפרופן'),
  R('C2H4(g) + H2O(g) -> C2H5OH(g)', 'הפקת אתנול'),
  R('CO(g) + 2H2(g) -> CH3OH(g)', 'הפקת מתנול'),
  R('CH4(g) + Cl2(g) -> CH3Cl(g) + HCl(g)', 'הכלרה של מתאן'),
  R('CH4(g) + 4Cl2(g) -> CCl4(g) + 4HCl(g)', 'הכלרה של מתאן'),
  R('N2H4(g) + O2(g) -> N2(g) + 2H2O(g)', 'שרפה של הידרזין', 'comb'),
  R('2H2O2(g) -> 2H2O(g) + O2(g)', 'פירוק של מימן על־חמצני'),
  R('CH4(g) + NH3(g) -> HCN(g) + 3H2(g)', 'הפקת מימן ציאנידי'),
  R('4NH3(g) + 3O2(g) -> 2N2(g) + 6H2O(g)', 'שרפה של אמוניה', 'comb'),
  R('CO(g) + H2O(g) -> CO2(g) + H2(g)', 'תגובת גז המים'),
  R('CH4(g) + H2O(g) -> CO(g) + 3H2(g)', 'הפקת מימן ממתאן'),
  R('2CO(g) + O2(g) -> 2CO2(g)', 'שרפה של פחמן חד־חמצני', 'comb'),
  R('C2H4(g) + 3O2(g) -> 2CO2(g) + 2H2O(g)', 'שרפה של אתן', 'comb'),
  R('2CH3OH(g) + 3O2(g) -> 2CO2(g) + 4H2O(g)', 'שרפה של מתנול', 'comb'),
  R('C2H5OH(g) + 3O2(g) -> 2CO2(g) + 3H2O(g)', 'שרפה של אתנול', 'comb'),
];

/** the bonds a reaction needs */
export const bondsIn = (x: RealRxn) => [...new Set([...x.R, ...x.P].flatMap(([, k]) => BONDS_OF[k.replace(/\(.+\)$/, '')].map(([, b]) => b)))];
