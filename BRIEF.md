# BRIEF — thermo-solver

A study app for **energy and thermodynamics in Israeli high-school chemistry (12th grade, 5 units)**.
It is built the same way as the finished equilibrium app (`jhoni409/equilibrium-solver`, live at
https://jhoni409.github.io/equilibrium-solver/): one question at a time, solved step by step, in Hebrew.

---

## 0. Who it is for and what "good" means

- **The user:** one student who is *not strong* in chemistry and studies on a **PC** (phone second).
  They want to understand *why*, not just see the answer.
- **Good means:**
  - short Hebrew sentences
  - one idea per card
  - every number shown with where it came from
  - every decision shown as an "if" table
  - pictures (boxes, arrows, a level diagram) instead of paragraphs
  - nothing on screen that isn't needed now
- **Bad means:** walls of text, many rules in one card, animations for show, graphs that look "basic",
  numbers that appear without a calculation, colours that don't mean anything.

---

## 1. Start from the equilibrium app (don't start from zero)

Attach the old repo read-only (`add_repo jhoni409/equilibrium-solver`). Copy its skeleton, then replace
the chemistry. These parts carry over almost unchanged:

| Old file | What it is | In thermo-solver |
|---|---|---|
| `src/engine/frac.ts` | exact BigInt fractions (`F("4.18")`, add/sub/mul/div/pow) | keep as is |
| `src/engine/format.ts` | `fmt(f, {decimals, sig})` → `{s, approx}` (≤5 sig exact, else ≈4 sig) | keep |
| `src/ui/dom.ts` | `el`, `tex` (KaTeX), `he()` (Hebrew with `$math$` in LTR `<bdi>`, `[[blank]]`) | keep |
| `src/lesson/board.ts` | Board (pinned area + flow of cards), Card helpers | keep; add the new pictures (§3) |
| `src/ui/player.ts` | rebuilds the board up to step i, plays only step i | keep |
| `src/ui/shell.ts` | top bar, question panel (givens light up), step list, bottom bar, library, ∞, practice, input dialog, keys, deep links `#id`, test hook `window.__eq` | keep; change texts |
| `src/ui/practice.ts`, `src/engine/practice.ts` | practice mode with score | keep pattern |
| `src/engine/generate.ts` | ∞ new problems per kind, seeded (`g-kind-seed` ids) | rewrite for thermo kinds |
| `src/engine/parse.ts`, `statement.ts`, `solve.ts`, `chem.ts` | input format, question text with keyed givens, solvers | rewrite for thermo |
| `src/lesson/lessons.ts` | one lesson (list of steps) per question type | rewrite for thermo (§6) |
| `src/ui/style.css` | the design system (§2) | keep |
| `scripts/screens.mjs`, `scripts/checks.mjs` | Playwright screenshots; measured bidi / idle / reduced-motion checks | keep |
| `.github/workflows/deploy.yml` | test → build → GitHub Pages | keep |

Stack: Vite + TypeScript (strict), KaTeX (`output: 'html'`), GSAP (timelines, sleeps when idle),
Vitest, Playwright 1.63.0 (pinned to the preinstalled Chromium). `vite.config.ts` uses `base: './'`.

---

## 2. Screen design (same as the equilibrium app)

- **Top bar:** title, problem name, and the buttons אוסף שאלות · ∞ שאלה חדשה · תרגול · ⋯ (type your own
  question, original exam picture, speed, keys, previous/next problem).
- **Side panel (right):**
  - **השאלה:** the question as short lines. Every given value is a "given" span with a key. When a step
    uses a value, its span lights up yellow.
  - **הדרך:** the list of steps grouped by stage (זיהוי / פתרון / מה כותבים במבחן), current step marked.
- **Board (main):** one card per step, newest at the bottom, older cards stay (dimmed); auto-scroll to the
  current card. A card = number + one sentence + its content.
- **Pinned on top of the board:** the reaction in colour, with a colour key under it (כתום = מגיבים
  (צד שמאל) · כחול = תוצרים (צד ימין)). A table that fills during the solution (Hess, bonds) can also be
  pinned there.
- **Bottom bar:** למה? (one or two extra lines), "3 / 8 + step title", ← ▶ הבא →.
  Keys: → / Space / Enter next, ← back, R restart, A auto, N new problem of this kind, W why, ? keys.
- **Exam card** (last step, green): "כך כותבים במבחן", the lines to write in the exam, fill-in
  `[[blanks]]` where it helps.
- **Colours (fixed):**
  - `--reactant #ff9f43` (orange, reactants / left side)
  - `--product #54a0ff` (blue, products / right side)
  - `--focus #feca57` (yellow, look here / current)
  - `--answer #1dd1a1` (green, answer)
  - `--wrong #ff6b6b` (red, wrong / goes down / "heat")
  - background black
- **Motion:** a card fades in; math is "written" left to right (clip-path); numbers pop into table cells;
  arrows grow. Back = jump, no replay. Reduced motion = no animation. GSAP must go idle (0 rAF).
- **PC first.** Phone: the side panel shrinks to the question only, cards stack, nothing sticks out
  sideways (checked automatically).

---

## 3. Card toolbox

Existing helpers (`board.ts`, `Card`):
- `line` — a Hebrew line with `$math$`
- `math` — a math line written left to right
- `eqs(lhs, rows)` — a calculation with the "=" signs lined up
- `chips` — small labels such as ↑ עולה / ↓ יורד
- `verdict` — ✓ / ✗ / → result
- `rule(rows, hits)` — the **"if" table**: every case shown, then the case that applies lights up
- `compare(a, sign, b)` — two values with the sign popping in between
- `grid(rows)` — a small table
- `shift({L, R, arrow, hl, underL, underR, label})` — the two sides of a reaction as boxes, with an arrow
  between them

New pictures for thermo (simple, static, large labels, one per card):
- **Energy levels (`levels`)**:
  - three horizontal bars (reactants, peak, products) at their energies
  - ΔH drawn as a vertical arrow between reactants and products (red down = exo, up = endo)
  - Ea drawn as an arrow from the reactants up to the peak
  - an optional dashed lower peak for a catalyst
  - numbers come from the question
  - no axes clutter: only "אנרגיה ↑" and the labels
- **Hess table (pinned)** — one row per given equation, with columns:
  - the equation as given
  - what we do (×n, הופכים)
  - the new equation
  - the new ΔH

  Species that cancel get a line through them (animated strike); the target equation is pinned above.
- **Bond table** — two columns, "נשברים (מגיבים)" and "נוצרים (תוצרים)": bond × count × energy, and the
  sum under each column.
- **Heat box** — "חום" written into the equation on the correct side (like the equilibrium app):
  - exo: `A + B → C + חום`
  - endo: `A + חום → B`

---

## 4. Curriculum scope — read the official documents first

**Confirmed scope (2026-10-27).** Source: the user's course "תרמודינמיקה ואנטרופיה – 21 תרגילים"
(easy-chemistry.co.il). It is for learning the scope only: **do not put its exercises in the library.**
All topics are √ in the 2026 מיקוד (p. 8: energy, 37381; p. 16: entropy, 37282).

1. Sign of ΔS°מערכת from the equation (moles of gas, states): חיובי / שלילי / לא ניתן לקבוע
2. ΔS°מערכת = ΣS°(תוצרים) − ΣS°(מגיבים)
3. Backwards: the unknown S° of one substance from a given ΔS°
4. ΔH° by Hess, and by bond enthalpies (gases only; also an unknown bond energy, backwards)
5. ΔS°סביבה = −ΔH°/T
6. ΔS°יקום = ΔS°מערכת + ΔS°סביבה → spontaneous or not (second law)
7. Backwards from ΔS°יקום to ΔS°סביבה, ΔS°מערכת or ΔH°
8. Signs without calculating: exo / endo, spontaneous or not
9. Spontaneous but does not happen: activation energy, heating, catalyst (T16)
10. ΔH° with a liquid vs a gaseous product (T17)

**Out:** ΔG (not in the מיקוד, not in the course). Not required by the מיקוד: comparing S° of different
substances, ΔS°יקום = 0, the turning temperature, the temperature range of spontaneity.
**Later, if at all:** calorimetry, heat for an amount, the energy diagram (PROBLEMS P1–P4, P14).

The cloud session **cannot download from meyda.education.gov.il or chemcenter.weizmann.ac.il** (the proxy
blocks them). The user uploads the PDFs into `sources/` in the repo, and you read them with the Read tool
(`pages: "1-20"`).

**Read these before writing any lesson:**

| File in `sources/` | What it is | Use it for |
|---|---|---|
| `mikud-2026.pdf` | the Ministry's official מיקוד for chemistry, exam year תשפ"ו (questionnaires 37381, 37387). Every topic is marked √ (in the exam) or X (not in the exam). | **the final list of topics**: build only what is √ in the energy / thermodynamics part |
| `maane-2026.pdf` | the new answering guidelines for summer 2026 (the exam format changed: 50 points instead of 60, two of questions 10–14) | the wording of the exam card |
| `energy-chemical-rate.pdf` | the Ministry's teacher guide "אנרגיה בקצב הכימיה" (2nd ed.) | the Hebrew terms, the order of ideas, the kind of diagrams used |
| `tirgul-energia.pdf` | Weizmann centre practice pool on energy and reaction rate, with answers (based on exams 2018–2022) | library questions and test answers |
| `37381-<year>.pdf` | past bagrut papers | real questions for the library |
| photos from the user | their own class / exam questions | **the first library entries** |

**What web searches showed (secondhand, from search summaries; confirm it in the PDFs):**
- The 5-unit program is 70% external exam (questionnaire 37381) and 30% school-assessed. "אנרגיה" is part of
  it, and "תרמודינמיקה" is an extended topic in the 30% part (Weizmann centre).
- The מיקוד documents for 2025 and 2026 mention ΔH by **Hess's law** and by **bond enthalpies**. The
  bond-enthalpy calculation is said to be **limited to reactions where everything is a gas**.
- A Ministry curriculum document lists, for a 5-unit unit "אנרגיה ודינמיקה":
  - standard entropy changes (melting, boiling, reactions)
  - the second law
  - **ΔG = ΔH − TΔS**
  - **ΔG from formation values**
  - the link between ΔG, spontaneity and equilibrium
- The 2026 מיקוד has a heading "שיווי משקל כימי ואנטרופיה" under the mandatory topics. Whether each line
  is √ or X could not be read from the search results.

**So:** after reading the PDFs, write the confirmed topic list (√ only) at the top of this section, show it
to the user, then adjust §6.

Probable topic list (to be cut down to the √ ones):
1. exo / endo, sign of ΔH, energy diagrams, activation energy, catalyst
2. thermochemical equations: heat for a given amount (mol, grams)
3. calorimetry: q = m·c·ΔT → ΔH per mol
4. Hess's law
5. bond enthalpies (gases only)
6. standard enthalpies of formation (ΔH°f, and ΔG°f if √)
7. entropy: sign of ΔS from the equation, standard entropy values if √
8. Gibbs: ΔG = ΔH − TΔS, spontaneity, the temperature where it changes, the four sign cases, ΔG and
   equilibrium if √

---

## 5. Chemistry rules (the only ones the app may use)

Source: OpenStax *Chemistry 2e* (openstax.org/details/books/chemistry-2e). The chapter numbers are from
memory — **check them**: ch. 5 Thermochemistry; 7.5 bond strengths; 12.5 / 12.7 activation energy and
catalysis; ch. 16 Thermodynamics.

- **T1:** ΔH < 0 is exothermic (gives out heat, the surroundings warm up). ΔH > 0 is endothermic (takes
  in heat, the surroundings cool down).
- **T2:** ΔH belongs to the equation **as written, per the coefficients**. Multiplying the equation by n
  multiplies ΔH by n. **Reversing it flips the sign.**
- **T3:** heat for a given amount: q = n(substance) ÷ coefficient × |ΔH|. Gives out heat if ΔH < 0,
  takes it in if ΔH > 0. n = m / M (M given in the question).
- **T4:** calorimetry: q(solution) = m·c·ΔT, with ΔT = T(end) − T(start). ΔH(reaction) = −q(solution) / n,
  converted from J to kJ (÷1000). m and c are the ones the question gives (for example c = 4.18 J/(g·°C)).
- **T5:** Hess: if equations add up to the target, their ΔH values add up the same way (after T2).
- **T6:** bond enthalpies: ΔH ≈ Σ(bonds broken, reactants) − Σ(bonds formed, products). Breaking takes
  energy (+), forming gives it out (−). The bonds of each molecule are given in the question (the app
  does not draw Lewis structures). Use it only when every substance is a gas (the מיקוד limit, to confirm).
- **T7:** formation: ΔH° = Σ n·ΔH°f(products) − Σ n·ΔH°f(reactants). An element in its standard state
  has ΔH°f = 0.
- **T8:** energy diagram:
  - ΔH = E(products) − E(reactants)
  - Ea(forward) = E(peak) − E(reactants)
  - Ea(reverse) = E(peak) − E(products)
  - a catalyst lowers the peak (both Ea values) and **does not change ΔH**
- **T9:** sign of ΔS:
  - more moles of gas → ΔS > 0, fewer → ΔS < 0
  - solid → liquid → gas: ΔS > 0 (and the reverse < 0)
  - same gas moles and no phase change: say "can't tell from the equation"
- **T10–T12 (ΔG, turning temperature, the four cases): dropped.** Not in the מיקוד or the user's course.
- **T13:** ΔS°מערכת = Σ n·S°(תוצרים) − Σ n·S°(מגיבים), n = the coefficient. Units J/K (S° in J/(mol·K)).
  The S° of an element is **not** 0 (unlike ΔH°f). Backwards: one unknown S° solved from a given ΔS°.
- **T14:** ΔS°סביבה = −ΔH°/T, with ΔH° in J (kJ × 1000) and T in K: T = t(°C) + 273 (the course's 1327°C
  gives exactly 1600 K). Room temperature = 298 K (25°C).
- **T15:** second law: ΔS°יקום = ΔS°מערכת + ΔS°סביבה. ΔS°יקום > 0 → ספונטני, < 0 → לא ספונטני.
- **T16:** ΔS°יקום > 0 means the reaction *can* happen, not that it is fast. If Ea is high, it does not
  happen at room temperature; heating or a catalyst makes it happen.
- **T17:** melting and boiling take in heat (ΔH > 0); freezing and condensing give it out (ΔH < 0). So the
  same reaction gives out more heat with a liquid product than with a gaseous one: its ΔH° is more negative.

Anything else (Lewis structures, heat of solution of a specific salt, specific heats not given in the
question, tabulated data) is **not** a rule: the question must give it.

---

## 6. Question types and their lessons

Each lesson is a list of `Step {stage, title, say, why?, uses?, run(card, timeline, board)}`.
Every lesson has the same frame:
- **step 1, זיהוי:** a chip with the type, "שואלים: …", and one line on how we recognised it
- **the solving steps** below
- **last step:** the exam card

The pinned reaction is shown whenever there is one.

### 6.1 Exo / endo and the energy diagram (`ask: diagram` / `ask: exo-endo`)
1. **Picture:** `levels` with the given energies.
2. **ΔH:** ΔH = E(products) − E(reactants), worked out, then the if table T1 (lit row). Heat is written
   into the equation (heat box).
3. **Ea:** forward, then reverse, each with its subtraction.
4. **Catalyst** (if asked): the dashed lower peak; the if table "זרז ← Ea קטנה, ΔH לא משתנה".

### 6.2 Heat for an amount (`ask: heat`)
1. n = m / M, with numbers and units.
2. The "recipe" from the equation: "ΔH = −890 kJ for **1** mol CH₄ (the coefficient)".
3. q = n ÷ coefficient × |ΔH|.
4. If table T1 → "נפלט / נבלע חום".

Variant: grams from a given heat, solved backwards.

### 6.3 Calorimetry (`ask: dH-calorimetry`)
1. ΔT = T(end) − T(start) (sign shown).
2. q = m·c·ΔT, then J → kJ (÷1000 on its own line).
3. If table: "אם הטמפרטורה עלתה ← התגובה פלטה חום ← ΔH < 0", plus the falling case.
4. n = m / M.
5. ΔH = −q / n (the minus sign explained in one line).

### 6.4 Hess (`ask: hess`)
1. The target pinned on top.
2. For each given equation, one card: "צריך את X בצד …" → if table T2 (הופכים ← ΔH מחליף סימן ·
   כופלים ב־n ← ΔH כפול n) → its row in the pinned Hess table fills.
3. Add the equations: strike out what cancels, check that what is left is the target.
4. ΔH = sum, with each term in brackets.

The engine finds the multipliers by exact Gaussian elimination over the species.

### 6.5 Bond enthalpies (`ask: dH-bonds`)
1. Bonds broken: the reactants column of the bond table, row by row, then the sum.
2. Bonds formed: the products column, then the sum.
3. ΔH = broken − formed (if table: שבירה ← צריך אנרגיה (+), יצירה ← משחרר אנרגיה (−)).
4. Exo / endo by T1.

### 6.6 Formation (`ask: dH-formation`)
1. If table "יסוד במצב תקני ← ΔH°f = 0" (lit for each element that appears).
2. Σ products (n × ΔH°f each).
3. Σ reactants.
4. ΔH = products − reactants, written `(−965.1) − (−74.8)`.
5. "minus minus = plus" said in words.

### 6.7 Sign of ΔS (`ask: dS-sign`)
1. The `shift` picture with the moles of gas (and the phases) under each side.
2. If table T9 (lit row).
3. Verdict ΔS > 0 / < 0.

### 6.8 ΔS°מערכת from S° values (`ask: dS`; backwards `ask: S-unknown`)
1. Table of S° × coefficient, one column for תוצרים (blue) and one for מגיבים (orange); a line that an
   element's S° is not 0.
2. Σ products, Σ reactants, then ΔS° = products − reactants (T13), negatives in brackets.
3. Backwards: the same line with the unknown S° as x, then solve for x.

### 6.9 ΔS°סביבה, ΔS°יקום, spontaneous? (`ask: spontaneous`; backwards `ask: from-total`)
1. Units: ΔH° kJ → J (× 1000), t °C → K (+ 273) — each on its own line.
2. ΔS°סביבה = −ΔH°/T (T14), the minus sign said in words.
3. ΔS°יקום = ΔS°מערכת + ΔS°סביבה (T15).
4. If table T15 (lit row) → ספונטני / לא ספונטני.
5. Backwards: from a given ΔS°יקום, ΔS°סביבה = ΔS°יקום − ΔS°מערכת, then ΔH° = −T·ΔS°סביבה.

### 6.10 Signs without calculating (`ask: signs`)
From the signs that are given (ΔS°יקום, ΔS°מערכת, …): T14 and T15 as if tables, one lit row each, and
the sign that follows (for example ΔS°סביבה > 0 → ΔH° < 0 → exothermic).

---

## 7. Engine and input format

- **Numbers:** everything is exact `Frac`. Display goes through `fmt`; respect `decimals = n` when the
  question asks for it. Units are always shown (kJ, kJ/mol, J, g, mol, °C, K, J/K).
- **Input:** a line format, solved by `parse()`. Hebrew free text is rejected with a Hebrew error and an
  example. Proposed lines:

```
rxn: CH4(g) + 2O2(g) -> CO2(g) + 2H2O(l)
dH = -890 kJ                        (ΔH of rxn as written)
m CH4 = 8.0 g      M CH4 = 16 g/mol      n CH4 = 0.5 mol      q = 1335 kJ
m solution = 100 g    c = 4.18 J/(g*C)    T1 = 20.0 C    T2 = 30.0 C
eq1: C(s) + O2(g) -> CO2(g) ; dH = -393.5 kJ
target: C(s) + 1/2O2(g) -> CO(g)
bonds CH4: 4 C-H      bond C-H = 413
dHf CH4(g) = -74.8
T = 298 K   (or T = 25 C)
E reactants = 50 kJ   E products = 20 kJ   E peak = 120 kJ   E peak catalyst = 90 kJ
decimals = 1
S H2(g) = 130.7      dS = 173 J/K      dS total = 16.36 J/K
ask: dS-sign | dS | S-unknown | spontaneous | from-total | signs | hess | dH-bonds | dH-formation
```

- **`statement(p)`** turns the parsed problem into short Hebrew lines, every value with a key.
  The key lets a step light that value up.
- **One solver per type,** pure (no DOM), returning everything the lesson shows: intermediate values,
  operations, signs, the lit rule row.

---

## 8. Library, ∞, practice

- **Library:** the examples in `PROBLEMS.md`, plus new examples for the entropy types. Grouped by type.
  (The user's course exercises are not library entries; see §4.) S° and ΔH°f values for real substances
  come from the CRC data in the Python package `chemicals` (S0g/S0l/S0s, Hfg/Hfl/Hfs), rounded to 1
  decimal; textbook sites are blocked from the cloud session.
- **∞ generator:** for every type, seeded, with ids like `g-hess-1234` that work as deep links.
  It must only make problems whose numbers are clean (exact decimals) and whose chemistry is real:
  use reactions and data from the library, and scale or reverse them.
  Never invent ΔH values for real substances; use letter species (A, B, C) for made-up data.
- **Practice:** the student answers (a number, or a choice) before seeing the solution; the score is kept
  in localStorage (wrapped in try/catch).

---

## 9. Tests and checks (must pass before every push)

- **Vitest:**
  - every `PROBLEMS.md` answer exactly
  - every library answer exactly
  - 150 seeds per ∞ kind solve without errors and pass an **independent re-computation**, i.e. a second,
    simple implementation of the rule in the test (as `tests/expressions.test.ts` and
    `tests/lechatelier.test.ts` do in the old repo)
- **`scripts/screens.mjs`:** every step of the listed problems on desktop 1280×800 and phone 390×844.
  It fails on page errors or anything sticking out sideways. **Look at the pictures.**
- **`scripts/checks.mjs`:**
  - **bidi:** inside every LTR math piece the first character is left of the last; check a case such as
    "ΔG < 0"
  - **idle:** 0 animation frames in 3 s of idle
  - **reduced motion:** a step lands on its final frame at once

---

## 10. Repo and publishing

- The cloud session **cannot create the repo** (the proxy blocks it), so the user must:
  1. create a **public** repo (e.g. `thermo-solver`)
  2. add these files
  3. go to Settings → Pages → Source: **GitHub Actions**
- Each push to `main` runs test → build → deploy. Check the run with
  `gh api repos/<owner>/thermo-solver/actions/runs`.
- github.io pages can't be opened from the cloud, so say so, and ask the user to check the live link.
  Write the link carefully (a typo once sent the user to a 404).

---

## 11. What the user taught us in the equilibrium app (do / don't)

1. **"Messy / piling up / over-explained"** → one sentence per card, one picture per card, delete instead
   of adding.
2. **"It doesn't say how it got 1.8 and 3.6"** → every number gets its calculation line (e.g.
   `[Cl₂]₀ = 4 mol ÷ 2 L = 2 M`, with units).
3. **"M = 2 while it's 4?"** → show the unit change explicitly and name it (mol → M, here J → kJ, °C → K).
4. **"Graphs look basic"** → no decorative charts. Only pictures that explain (levels, boxes, arrows).
5. **"Not only Q, an IF too"** → every decision has an "if" table with the applying row lit.
6. **"When is blue on the bottom?"** → explain fixed meanings: colours belong to the *side* of the
   equation. Put a colour key under the pinned equation.
7. **"Sometimes − and sometimes +"** → say the sign rule each time, in words. Write negatives in brackets.
   No negative powers (`1/K²`, not `K⁻²`).
8. **"+57.2 but it moved the other way"** → ΔH belongs to a direction. When it matters, show both
   directions (+ for one, − for the reverse), and **only show ΔH where it matters**.
9. **"How do we move, what moves?"** → the two-box picture with an arrow, and what goes up / down under
   each box. "Heat" written into the equation as if it were a substance.
10. **Blue/cyan theme** → rejected. Keep the study colours.
11. **Copying a fraction** from the page reverses top and bottom in the pasted text (KaTeX puts the
    denominator first). If the user pastes something that "looks wrong", check the picture before
    changing anything.
12. **Invented example numbers** (e.g. "assume 1 M") confused more than they helped. Use the question's
    numbers. If you must illustrate, label it clearly and keep it out of the exam card.

---

## 12. Order of work (show pictures after each)

1. Ask the user for their questions / מיקוד (§4). Copy the skeleton (§1). Get one type working end to
   end (start with **6.9 ΔS°סביבה / ΔS°יקום**) with tests, screenshots and a deploy.
2. Add the types one at a time, each with: solver, statement, lesson, library entries, tests,
   screenshots.
3. ∞ generator and practice for every type.
4. Polish the phone layout, run all checks, update the README.

Glossary (keep the wording consistent):
- אנתלפיה, שינוי אנתלפיה ΔH
- תגובה אקסותרמית / אנדותרמית, פולטת / בולעת חום
- אנרגיית שפעול Ea, זרז
- חוק הס
- אנרגיית קשר, שבירת / יצירת קשרים
- אנתלפיית יצירה תקנית ΔH°f
- קלורימטר, חום סגולי c
- אנטרופיה ΔS
- אנרגיה חופשית ΔG, תהליך ספונטני
