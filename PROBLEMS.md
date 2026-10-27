# PROBLEMS — starter examples with checked answers

All the data is given inside each question. Every answer below was computed with exact fractions (Python
`fractions`) and must come out **exactly** like this in Vitest. These are teaching examples, not real
bagrut questions: put the user's own questions first in the library (BRIEF §4).

Format of each entry: the question in Hebrew, then the input in the app's line format, then the expected
results (intermediate values too, so the lesson's lines can be tested).

---

## P1 — Calorimetry, exothermic (6.3)
**Question:** ממיסים 4.0 g NaOH (M = 40 g/mol) ב־100 g מים. הטמפרטורה עלתה מ־20.0°C ל־30.0°C.
c = 4.18 J/(g·°C). הניחו שמסת התמיסה 100 g. חשבו את ΔH של ההמסה (kJ/mol).
```
m solution = 100 g
c = 4.18 J/(g*C)
T1 = 20.0 C
T2 = 30.0 C
m NaOH = 4.0 g
M NaOH = 40 g/mol
ask: dH-calorimetry
```
**Expect:**
- ΔT = +10.0 °C
- q = 100 × 4.18 × 10.0 = **4180 J = 4.18 kJ**
- the temperature rose → exothermic
- n = 4.0 ÷ 40 = **0.10 mol**
- ΔH = −4.18 ÷ 0.10 = **−41.8 kJ/mol**

## P2 — Calorimetry, endothermic (6.3)
**Question:** ממיסים 8.0 g NH₄NO₃ (M = 80 g/mol) ב־100 g מים. הטמפרטורה ירדה מ־25.0°C ל־19.0°C.
c = 4.18 J/(g·°C). חשבו את ΔH של ההמסה.
```
m solution = 100 g
c = 4.18 J/(g*C)
T1 = 25.0 C
T2 = 19.0 C
m NH4NO3 = 8.0 g
M NH4NO3 = 80 g/mol
ask: dH-calorimetry
```
**Expect:**
- ΔT = **−6.0 °C**
- q(solution) = 100 × 4.18 × (−6.0) = **−2508 J = −2.508 kJ**
- the temperature fell → endothermic
- n = **0.10 mol**
- ΔH = −(−2.508) ÷ 0.10 = **+25.08 kJ/mol**

## P3 — Heat for an amount (6.2)
**Question:** CH₄(g) + 2O₂(g) → CO₂(g) + 2H₂O(l), ΔH = −890 kJ. כמה חום נפלט בשריפת 8.0 g CH₄
(M = 16 g/mol)?
```
rxn: CH4(g) + 2O2(g) -> CO2(g) + 2H2O(l)
dH = -890 kJ
m CH4 = 8.0 g
M CH4 = 16 g/mol
ask: heat
```
**Expect:** n = 8.0 ÷ 16 = **0.5 mol**; q = 0.5 × 890 = **445 kJ, released** (ΔH < 0).

## P4 — Heat for an amount, backwards (6.2)
**Question:** same reaction. כמה גרם CH₄ צריך לשרוף כדי לקבל 1335 kJ?
```
rxn: CH4(g) + 2O2(g) -> CO2(g) + 2H2O(l)
dH = -890 kJ
q = 1335 kJ
M CH4 = 16 g/mol
ask: mass-for-heat
```
**Expect:** n = 1335 ÷ 890 = **1.5 mol**; m = 1.5 × 16 = **24 g**.

## P5 — Hess, one reversal (6.4)
**Question:** נתון:
(1) C(s) + O₂(g) → CO₂(g), ΔH = −393.5 kJ
(2) CO(g) + ½O₂(g) → CO₂(g), ΔH = −283.0 kJ

חשבו את ΔH של C(s) + ½O₂(g) → CO(g).
```
eq1: C(s) + O2(g) -> CO2(g) ; dH = -393.5 kJ
eq2: CO(g) + 1/2O2(g) -> CO2(g) ; dH = -283.0 kJ
target: C(s) + 1/2O2(g) -> CO(g)
ask: hess
```
**Expect:**
- (1) as is
- (2) reversed → +283.0
- CO₂ cancels, and ½O₂ is left on the left
- ΔH = −393.5 + 283.0 = **−110.5 kJ**

## P6 — Hess, add and halve (6.4)
**Question:** נתון:
(1) N₂(g) + O₂(g) → 2NO(g), ΔH = +180.6 kJ
(2) 2NO(g) + O₂(g) → 2NO₂(g), ΔH = −114.2 kJ

חשבו ΔH ל־N₂(g) + 2O₂(g) → 2NO₂(g), ואחר כך ל־½N₂(g) + O₂(g) → NO₂(g).
```
eq1: N2(g) + O2(g) -> 2NO(g) ; dH = 180.6 kJ
eq2: 2NO(g) + O2(g) -> 2NO2(g) ; dH = -114.2 kJ
target: N2(g) + 2O2(g) -> 2NO2(g)
ask: hess
```
**Expect:**
- (1) + (2), 2NO cancels → ΔH = 180.6 + (−114.2) = **+66.4 kJ**
- the halved target: ×½ → **+33.2 kJ**

## P7 — Bond enthalpies (6.5)
**Question:** H₂(g) + Cl₂(g) → 2HCl(g). אנרגיות קשר (kJ/mol): H–H 436, Cl–Cl 243, H–Cl 432. חשבו ΔH.
```
rxn: H2(g) + Cl2(g) -> 2HCl(g)
bonds H2: 1 H-H
bonds Cl2: 1 Cl-Cl
bonds HCl: 1 H-Cl
bond H-H = 436
bond Cl-Cl = 243
bond H-Cl = 432
ask: dH-bonds
```
**Expect:** broken 436 + 243 = **679**; formed 2 × 432 = **864**; ΔH = 679 − 864 = **−185 kJ** (exo).

## P8 — Bond enthalpies, combustion (6.5)
**Question:** CH₄(g) + 2O₂(g) → CO₂(g) + 2H₂O(g). C–H 413, O=O 498, C=O 799, O–H 463 (kJ/mol). חשבו ΔH.
```
rxn: CH4(g) + 2O2(g) -> CO2(g) + 2H2O(g)
bonds CH4: 4 C-H
bonds O2: 1 O=O
bonds CO2: 2 C=O
bonds H2O: 2 O-H
bond C-H = 413
bond O=O = 498
bond C=O = 799
bond O-H = 463
ask: dH-bonds
```
**Expect:**
- broken: 4 × 413 + 2 × 498 = 1652 + 996 = **2648**
- formed: 2 × 799 + 4 × 463 = 1598 + 1852 = **3450**
- ΔH = 2648 − 3450 = **−802 kJ**

## P9 — Formation enthalpies (6.6)
**Question:** CH₄(g) + 2O₂(g) → CO₂(g) + 2H₂O(l). ΔH°f (kJ/mol): CH₄ −74.8, CO₂ −393.5, H₂O(l) −285.8.
חשבו ΔH°.
```
rxn: CH4(g) + 2O2(g) -> CO2(g) + 2H2O(l)
dHf CH4(g) = -74.8
dHf CO2(g) = -393.5
dHf H2O(l) = -285.8
ask: dH-formation
```
**Expect:**
- O₂ is an element → 0
- products: (−393.5) + 2 × (−285.8) = **−965.1**
- reactants: (−74.8) + 2 × 0 = **−74.8**
- ΔH° = (−965.1) − (−74.8) = **−890.3 kJ**

## P10 — ΔG, ΔH < 0 and ΔS < 0 (6.8)
**Dropped (ΔG is out of scope, BRIEF §4). Not tested.**
**Question:** N₂(g) + 3H₂(g) → 2NH₃(g): ΔH = −92 kJ, ΔS = −199 J/K. חשבו ΔG ב־298 K. האם ספונטני?
באיזו טמפרטורה זה משתנה?
```
rxn: N2(g) + 3H2(g) -> 2NH3(g)
dH = -92 kJ
dS = -199 J/K
T = 298 K
ask: dG
```
**Expect:**
- ΔS = −0.199 kJ/K
- ΔG = −92 − 298 × (−0.199) = −92 + 59.302 = **−32.698 kJ** (≈ −32.7) → spontaneous
- turning T = (−92) ÷ (−0.199) = 92000/199 ≈ **462.3 K** → spontaneous **below** it (case −/−)

## P11 — ΔG, ΔH > 0 and ΔS > 0 (6.8)
**Dropped (ΔG is out of scope, BRIEF §4). Not tested.**
**Question:** CaCO₃(s) → CaO(s) + CO₂(g): ΔH = +178 kJ, ΔS = +161 J/K. ΔG ב־25°C? ספונטני?
מאיזו טמפרטורה?
```
rxn: CaCO3(s) -> CaO(s) + CO2(g)
dH = 178 kJ
dS = 161 J/K
T = 25 C
ask: dG
```
**Expect:**
- T = 25 + 273 = **298 K**
- ΔG = 178 − 298 × 0.161 = 178 − 47.978 = **130.022 kJ** (≈ 130.0) → not spontaneous
- turning T = 178 ÷ 0.161 = 178000/161 ≈ **1105.6 K** → spontaneous **above** it (case +/+)

## P12 — Sign of ΔS (6.7)
1. `2H2(g) + O2(g) -> 2H2O(l)` → gas 3 mol → 0 mol → **ΔS < 0**
2. `H2O(s) -> H2O(l)` → solid → liquid → **ΔS > 0**
3. `CaCO3(s) -> CaO(s) + CO2(g)` → gas 0 → 1 → **ΔS > 0**
4. `H2(g) + Cl2(g) -> 2HCl(g)` → gas 2 → 2, no phase change → **can't tell from the equation**

## P13 — The four cases (6.9)
**Dropped (ΔG is out of scope, BRIEF §4). Not tested.**
- ΔH < 0, ΔS > 0 → **always** spontaneous
- ΔH > 0, ΔS < 0 → **never**
- ΔH < 0, ΔS < 0 → at **low** T
- ΔH > 0, ΔS > 0 → at **high** T

## P14 — Energy diagram and catalyst (6.1)
**Question:** אנרגיית המגיבים 50 kJ, התוצרים 20 kJ, שיא העקומה 120 kJ. עם זרז השיא 90 kJ.
```
E reactants = 50 kJ
E products = 20 kJ
E peak = 120 kJ
E peak catalyst = 90 kJ
ask: diagram
```
**Expect:**
- ΔH = 20 − 50 = **−30 kJ** (exo)
- Ea(forward) = 120 − 50 = **70 kJ**
- Ea(reverse) = 120 − 20 = **100 kJ**
- with the catalyst: Ea(forward) = 90 − 50 = **40 kJ**, Ea(reverse) = **70 kJ**, ΔH still **−30 kJ**
