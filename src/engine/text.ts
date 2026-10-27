// A question written the way the exam writes it. The template has value slots and marked phrases:
//   {rxn} {new} {dH} {dS} {dStot} {dSsurr} {T} {q} {m} {M} {n} {table} {E} {opts} {x} {bx} {sp} {sign}
//                            values, filled from the parsed problem (so every number still comes from the engine)
//   «wording|tag»            an exam phrase, decoded in the lesson (see learn/phrases.ts)
// One template line = one line in the question panel.

import { spKey, type Problem, type Species } from './parse';
import type { Seg } from './statement';
import { reactionTex, formulaTex, speciesTex, bondTex, isStdElement } from './chem';
import { num } from './format';
import { F } from './frac';

export interface PhraseUse {
  tag: string;
  wording: string;
}

const SLOT = /(\{[a-zA-Z]+\}|«[^»|]+\|[^»]+»)/;
const DSt = (who: string) => `\\Delta S^\\circ_{\\text{${who}}}`;

function amountSp(p: Problem): Species | undefined {
  const keys = new Set([...(p.m?.keys() ?? []), ...(p.n?.keys() ?? []), ...(p.M?.keys() ?? [])]);
  return p.rxn?.all.find((s) => keys.has(s.f));
}

function unknownSp(p: Problem): Species | undefined {
  const k = p.dHfUnknown ?? [...(p.S0?.entries() ?? [])].find(([, v]) => v == null)?.[0];
  return k ? p.rxn?.all.find((s) => spKey(s) === k) : undefined;
}

/** the data table of the question, as the exam prints it (one row per substance) */
function table(p: Problem): string {
  const parts: string[] = [];
  const sps = p.rxn ? [...p.rxn.P, ...p.rxn.R] : [];
  const hasS = !!p.S0?.size;
  const hasH = !!p.dHf?.size || !!p.dHfUnknown;
  if ((hasS || hasH) && sps.length) {
    const head = ['\\text{החומר}', ...(hasS ? ['S^\\circ\\ (\\tfrac{J}{mol\\cdot K})'] : []), ...(hasH ? ['\\Delta H^\\circ_f\\ (\\tfrac{kJ}{mol})'] : [])];
    const rows = sps.map((s) => {
      const k = spKey(s);
      const sv = p.S0?.has(k) ? (p.S0.get(k) == null ? 'x' : num(p.S0.get(k)!)) : '';
      const hv = p.dHfUnknown === k ? 'x' : p.dHf?.has(k) ? num(p.dHf.get(k)!) : isStdElement(s) ? '–' : '';
      return [speciesTex({ ...s, coef: F(1) }), ...(hasS ? [sv] : []), ...(hasH ? [hv] : [])].join(' & ');
    });
    parts.push(`\\begin{array}{l|${'c'.repeat(head.length - 1).split('').join('|')}} ${head.join(' & ')} \\\\ \\hline ${rows.join(' \\\\ ')} \\end{array}`);
  }
  if (p.bond?.size) {
    const rows = [...p.bond.entries()].map(([b, v]) => `${bondTex(b)} & ${v == null ? 'x' : num(v)}`);
    parts.push(`\\begin{array}{c|c} \\text{הקשר} & \\tfrac{kJ}{mol} \\\\ \\hline ${rows.join(' \\\\ ')} \\end{array}`);
  }
  if (p.bondsOf?.size) {
    const rows = [...p.bondsOf.entries()].map(([f, us]) => `${formulaTex(f)}: & ${us.map((u) => `${u.count}\\ ${bondTex(u.bond)}`).join(',\\ ')}`);
    parts.push(`\\begin{array}{rl} ${rows.join(' \\\\ ')} \\end{array}`);
  }
  if (!parts.length) throw new Error('text uses {table} but there is no table');
  return parts.join('\\qquad ');
}

export function slot(name: string, p: Problem): Seg {
  const need = <T>(v: T | undefined | null, what: string): T => {
    if (v == null) throw new Error(`text uses {${name}} but there is no ${what}`);
    return v;
  };
  switch (name) {
    case 'rxn':
      return { tex: reactionTex(need(p.rxn, 'reaction')), key: 'rxn' };
    case 'new':
      return { tex: reactionTex(need(p.newRxn, 'second reaction')), key: 'new' };
    case 'dH': {
      const d = need(p.dH, 'dH');
      return { tex: `\\Delta H^\\circ = ${num(d.v)}\\,\\mathrm{${d.unit}}`, key: 'dH' };
    }
    case 'dS':
      return { tex: `\\Delta S^\\circ = ${num(need(p.dSsys, 'dS'))}\\,\\mathrm{J/K}`, key: 'dS' };
    case 'dStot':
      return { tex: `${DSt('יקום')} = ${num(need(p.dStot, 'dS total'))}\\,\\mathrm{J/K}`, key: 'dStot' };
    case 'dSsurr':
      return { tex: `${DSt('סביבה')} = ${num(need(p.dSsurr, 'dS surr'))}\\,\\mathrm{J/K}`, key: 'dSsurr' };
    case 'T': {
      const T = need(p.T, 'T');
      if (T.unit === 'room') throw new Error('text uses {T} but T is room');
      return { tex: T.unit === 'K' ? `${num(T.v)}\\,\\mathrm{K}` : `${num(T.v)}^\\circ\\mathrm{C}`, key: 'T' };
    }
    case 'q':
      return { tex: `${num(need(p.q, 'q'))}\\,\\mathrm{kJ}`, key: 'q' };
    case 'm': {
      const s = need(amountSp(p), 'amount');
      return { tex: `${num(need(p.m?.get(s.f), 'm'))}\\,\\mathrm{g}`, key: 'm' };
    }
    case 'M': {
      const s = need(amountSp(p), 'amount');
      return { tex: `M = ${num(need(p.M?.get(s.f), 'M'))}\\,\\mathrm{g/mol}`, key: 'M' };
    }
    case 'n': {
      const s = need(amountSp(p), 'amount');
      return { tex: `${num(need(p.n?.get(s.f), 'n'))}\\,\\mathrm{mol}`, key: 'n' };
    }
    case 'sp':
      return { tex: speciesTex({ ...need(amountSp(p), 'amount'), coef: F(1) }) };
    case 'bx':
      return { tex: bondTex(need([...(p.bond?.entries() ?? [])].find(([, v]) => v == null)?.[0], 'unknown bond')) };
    case 'x': {
      const s = need(unknownSp(p), 'unknown');
      return { tex: formulaTex(s.f) + (s.state ? `\\,\\mathrm{(${s.state})}` : '') };
    }
    case 'table':
      return { tex: table(p), key: 'table' };
    case 'E': {
      const E = need(p.E, 'energies');
      const rows = [
        `\\text{מגיבים} & ${num(need(E.R, 'E reactants'))}`,
        `\\text{תוצרים} & ${num(need(E.P, 'E products'))}`,
        `\\text{שיא} & ${num(need(E.peak, 'E peak'))}`,
        ...(E.cat != null ? [`\\text{שיא עם זרז} & ${num(E.cat)}`] : []),
      ];
      return { tex: `\\begin{array}{r|c} & \\mathrm{kJ} \\\\ \\hline ${rows.join(' \\\\ ')} \\end{array}`, key: 'E' };
    }
    case 'opts':
      return { tex: need(p.options, 'options').map((o) => `${num(o)}\\,\\mathrm{kJ}`).join(',\\quad '), key: 'opts' };
    case 'sign': {
      const s = need(p.sign, 'signs');
      const name = { dH: '\\Delta H^\\circ', dSsys: DSt('מערכת'), dSsurr: DSt('סביבה'), dStot: DSt('יקום') };
      return { tex: (Object.entries(s) as [keyof typeof name, number][]).map(([k, v]) => `${name[k]} ${v > 0 ? '>' : '<'} 0`).join(',\\quad '), key: 'sign' };
    }
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

const SLOT_TAG: Record<string, string> = { dH: 'g:dH', dS: 'g:dS', T: 'g:T', dStot: 'g:dStot', dSsurr: 'g:dSsurr', table: 'g:table', E: 'g:E', sign: 'g:sign' };

/**
 * The marked phrases in reading order (each tag once). A value slot with no phrase for it
 * ({dS} when no «…|g:dS» is written) becomes its own item "s:dS", quoted as the value itself.
 * A "–" in a ΔH°f table (an element) is added as a hidden given.
 */
export function phrasesOf(text: string, p?: Problem): PhraseUse[] {
  const out: PhraseUse[] = [];
  const tags = new Set([...text.matchAll(/«[^»|]+\|([^»]+)»/g)].map((m) => m[1]));
  for (const m of text.matchAll(/«([^»|]+)\|([^»]+)»|\{([a-zA-Z]+)\}/g)) {
    let u: PhraseUse | null = null;
    if (m[2]) u = { wording: m[1], tag: m[2] };
    else if (m[3] && SLOT_TAG[m[3]] && !tags.has(SLOT_TAG[m[3]]) && p) u = { wording: m[3] === 'table' || m[3] === 'E' ? 'הטבלה' : `$${slot(m[3], p).tex}$`, tag: `s:${m[3]}` };
    if (u && !out.some((x) => x.tag === u!.tag)) out.push(u);
  }
  if (p && text.includes('{table}') && p.dHf?.size && p.rxn?.all.some((s) => isStdElement(s) && !p.dHf!.has(spKey(s))) && !out.some((x) => x.tag === 'h:element'))
    out.push({ wording: '–', tag: 'h:element' });
  return out;
}
