// Endless problems: random but valid data for every question type, written in the same input format.
// Answers always come from the solver. (Kinds are added after every question type works, BRIEF §12.)

export type GenKind = 'spontaneous';

export const GEN_KINDS: { kind: GenKind; he: string }[] = [];

export interface GenProblem {
  id: string;
  title: string;
  group: string;
  input: string;
  kind: GenKind;
}

export function generate(kind: GenKind | 'any', seed: number): GenProblem {
  throw new Error(`no generator yet: ${kind} ${seed}`);
}

/** "g-kind-1234" → the same problem again */
export function fromId(id: string): GenProblem | null {
  const m = /^g-([a-z-]+)-(\d+)$/.exec(id);
  if (!m || !GEN_KINDS.some((k) => k.kind === m[1])) return null;
  return generate(m[1] as GenKind, parseInt(m[2], 10));
}

/** the generator kind that matches a solved problem's type */
export function kindOfType(t: string): GenKind | null {
  return GEN_KINDS.some((k) => k.kind === t) ? (t as GenKind) : null;
}
