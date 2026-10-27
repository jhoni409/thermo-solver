// DOM and KaTeX helpers shared by the shell, the lessons and practice mode.

import katex from 'katex';

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', parent?: Element | null, html?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  parent?.appendChild(e);
  return e;
}

export const tex = (src: string, display = false) =>
  katex.renderToString(src, { throwOnError: false, output: 'html', displayMode: display, strict: false });

/** a math span, isolated LTR */
export function math(src: string, cls = '', parent?: Element | null): HTMLElement {
  const e = el('span', `m ${cls}`.trim(), parent, tex(src));
  e.dir = 'ltr';
  return e;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Hebrew text with $TeX$ parts (each in an LTR isolate) and [[blank]] answers for fill-in lines. */
export function he(s: string): string {
  return s
    .split(/(\$[^$]+\$)/)
    .map((part) =>
      part.length > 2 && part.startsWith('$') && part.endsWith('$')
        ? `<bdi dir="ltr" class="m">${tex(part.slice(1, -1))}</bdi>`
        : esc(part).replace(/\[\[(.+?)\]\]/g, '<span class="blank">$1</span>'),
    )
    .join('');
}
