# thermo-solver — standing rules (one page, loads every turn)

**What this is:** a Hebrew (RTL) study app for 12th-grade Israeli chemistry, 5 units: energy and thermodynamics.
It solves each question step by step, one short card per step. The full spec is `BRIEF.md`, and the test
answers are in `PROBLEMS.md`. Read both before changing anything.

## How to work with me
- Do the thing I asked. Short answers. No speeches, no agreeing, no apologies.
- Show me the result (a picture, the thing itself), not numbers that pass.
- No process files, reports or rule files unless I ask for one.
- Do not guess: check it, or say plainly that you have not.
- One thing at a time. Ask only what is really mine to decide; otherwise pick, and say what you picked.
- When I say "weight thing": stop what you are doing. Write one page of where we are (the job in my words,
  what stands, what is next) as `CONTEXT.txt` in the project folder. If any rule or notes file loads on
  every turn, cut it back to one page and keep a backup. Then give me the one line to start a fresh session with.

## Hard rules
- **Every number comes from the engine** (exact fractions), never typed into a card by hand, never guessed.
- **Chemistry rules come only from the list in `BRIEF.md` §5.** If a question needs a rule that isn't
  there, say so and ask; don't invent one.
- **Show where every number comes from:** each result appears with its calculation on the line before it.
- **One idea per card, short sentences.** I'm not strong in this subject. No long explanations.
- **Every decision gets an "if" table** (all the cases, with the one that applies lit up).
- **Study colours are fixed:** reactants / left side orange, products / right side blue, "look here"
  yellow, answer green, wrong / goes down red. Do not switch to a blue/cyan theme; I tried it and it is
  harder to learn with.
- **No negative powers, no hidden signs.** Write subtraction with brackets, e.g. `−393.5 − (−283.0)`,
  and say the sign rule in words.
- **Before anything hard to undo** (deleting, force-push, changing repo settings), say so first.
- **Keep the CPU/GPU light:** nothing animates when nothing is happening.
- **Before saying something is done:** run the tests, take screenshots (computer and phone), and look at
  them. Hebrew and math order is checked by measurement (`scripts/checks.mjs`), not by eye.
- **Publishing:** push to `main`, which deploys to GitHub Pages. I can't open github.io from the cloud,
  so ask me to check the live page.
