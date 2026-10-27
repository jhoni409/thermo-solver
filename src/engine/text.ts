// A question written the way the exam writes it. The template has value slots and marked phrases:
//   {rxn} {dH} {dS} {T}      values, filled from the parsed problem (so every number still comes from the engine)
//   «wording|tag»            an exam phrase, decoded in the lesson (see learn/phrases.ts)
// One template line = one line in the question panel.

import type { Problem } from './parse';
import type { Seg } from './statement';
import { reactionTex } from './chem';
import { num } from './format';

export interface PhraseUse {
  tag: string;
  wording: string;
}

const SLOT = /(\{[a-zA-Z]+\}|«[^»|]+\|[^»]+»)/;

export function slot(name: string, p: Problem): Seg {
  switch (name) {
    case 'rxn':
      if (!p.rxn) throw new Error('text uses {rxn} but there is no reaction');
      return { tex: reactionTex(p.rxn), key: 'rxn' };
    case 'dH':
      if (!p.dH) throw new Error('text uses {dH} but there is no dH');
      return { tex: `\\Delta H^\\circ = ${num(p.dH.v)}\\,\\mathrm{${p.dH.unit}}`, key: 'dH' };
    case 'dS':
      if (p.dSsys == null) throw new Error('text uses {dS} but there is no dS');
      return { tex: `\\Delta S^\\circ = ${num(p.dSsys)}\\,\\mathrm{J/K}`, key: 'dS' };
    case 'T':
      if (!p.T || p.T.unit === 'room') throw new Error('text uses {T} but T is not a number');
      return { tex: p.T.unit === 'K' ? `${num(p.T.v)}\\,\\mathrm{K}` : `${num(p.T.v)}^\\circ\\mathrm{C}`, key: 'T' };
  }
  throw new Error(`unknown slot {${name}}`);
}

export function textLines(text: string, p: Problem): Seg[][] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) =>
      line
        .split(SLOT)
        .filter((s) => s !== '')
        .map((part): Seg => {
          if (part.startsWith('{') && part.endsWith('}')) return slot(part.slice(1, -1), p);
          if (part.startsWith('«')) {
            const [wording, tag] = part.slice(1, -1).split('|');
            return { text: wording, key: tag, phrase: true };
          }
          return { text: part };
        }),
    );
}

const SLOT_TAG: Record<string, string> = { dH: 'g:dH', dS: 'g:dS', T: 'g:T' };

/**
 * The marked phrases in reading order (each tag once). A value slot with no phrase for it
 * ({dS} when no «…|g:dS» is written) becomes its own item "s:dS", quoted as the value itself.
 */
export function phrasesOf(text: string, p?: Problem): PhraseUse[] {
  const out: PhraseUse[] = [];
  const tags = new Set([...text.matchAll(/«[^»|]+\|([^»]+)»/g)].map((m) => m[1]));
  for (const m of text.matchAll(/«([^»|]+)\|([^»]+)»|\{([a-zA-Z]+)\}/g)) {
    let u: PhraseUse | null = null;
    if (m[2]) u = { wording: m[1], tag: m[2] };
    else if (m[3] && SLOT_TAG[m[3]] && !tags.has(SLOT_TAG[m[3]]) && p) u = { wording: `$${slot(m[3], p).tex}$`, tag: `s:${m[3]}` };
    if (u && !out.some((x) => x.tag === u!.tag)) out.push(u);
  }
  return out;
}
