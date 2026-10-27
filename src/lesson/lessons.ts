// One lesson per question type: a short list of steps, one card each. Every number comes from the solver.
// This file only dispatches, and adds what every lesson has: the decoded question, the pinned reaction and recipe.

import type { Problem } from '../engine/parse';
import type { Solution } from '../engine/solve';
import { topicOfType } from '../learn/topics';
import type { Board } from './board';
import { decodeSteps, pinEquation, pinRecipe, markRecipe, type Step } from './common';
import { spontLesson, backLesson, signsLesson, kineticLesson, dSsignLesson, collisionLesson } from './entropy';
import { prLesson, heatLesson, dHnewLesson, phaseLesson, bondsLesson, diagramLesson } from './calc';

export type { Step };

export function lessonOf(sol: Solution, p: Problem, text?: string): Step[] {
  let steps = stepsOf(sol, p);
  // in exam wording, the first cards decode the question instead of naming its type
  if (text) steps = [...decodeSteps(p, sol, text), ...steps.slice(1)];
  // the recipe strip: each step lights its line; the exam card has them all done
  const labels = topicOfType(sol.type)?.recipeShortOf?.[sol.type];
  if (labels)
    steps = steps.map((s) => {
      const at = s.cls === 'exam' ? labels.length : (s.recipe ?? -1);
      return { ...s, pre: (b: Board) => markRecipe(b, at), run: (c, t, b) => (s.run(c, t, b), markRecipe(b, at)) };
    });
  // the reaction stays on top of the board, and the recipe under it
  const rxn = sol.rxn;
  const first = steps[0].run;
  steps[0] = {
    ...steps[0],
    run: (c, t, b) => {
      if (rxn) pinEquation(b, t, rxn);
      if (labels) pinRecipe(b, t, labels);
      first(c, t, b);
    },
  };
  return steps;
}

function stepsOf(sol: Solution, p: Problem): Step[] {
  switch (sol.type) {
    case 'spontaneous':
      return spontLesson(sol, p);
    case 'back':
      return backLesson(sol, p);
    case 'signs':
      return signsLesson(sol, p);
    case 'kinetic':
      return kineticLesson(sol, p);
    case 'dS-sign':
      return dSsignLesson(sol, p);
    case 'dS':
    case 'S-unknown':
    case 'dH-formation':
    case 'dHf-unknown':
      return prLesson(sol, p);
    case 'heat':
    case 'mass-for-heat':
    case 'dH-from-q':
      return heatLesson(sol, p);
    case 'dH-new':
      return dHnewLesson(sol, p);
    case 'phase-compare':
      return phaseLesson(sol, p);
    case 'dH-bonds':
    case 'bond-unknown':
      return bondsLesson(sol, p);
    case 'diagram':
      return diagramLesson(sol, p);
    case 'collision':
      return collisionLesson(sol, p);
  }
}
