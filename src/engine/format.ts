import { Frac } from './frac';

export interface Fmt {
  /** ASCII text, "-" for minus, "." for decimal point */
  s: string;
  /** true when the shown value is rounded */
  approx: boolean;
}

export interface FmtOpts {
  /** fixed number of decimals asked by the question */
  decimals?: number;
  /** significant digits for values that are not short exact decimals (default 4) */
  sig?: number;
}

const p10 = (k: number) => 10n ** BigInt(k);

function placeDecimal(v: bigint, k: number, trim = true): string {
  const neg = v < 0n;
  let s = (neg ? -v : v).toString();
  if (k > 0) {
    s = s.padStart(k + 1, '0');
    s = `${s.slice(0, -k)}.${s.slice(-k)}`;
    if (trim) s = s.replace(/\.?0+$/, '');
  }
  return (neg && s !== '0' ? '-' : '') + s;
}

/** Exact decimal string when the denominator is 2^a·5^b, else null. */
export function exactDecimal(f: Frac): string | null {
  let d = f.d;
  let a = 0;
  let b = 0;
  while (d % 2n === 0n) {
    d /= 2n;
    a++;
  }
  while (d % 5n === 0n) {
    d /= 5n;
    b++;
  }
  if (d !== 1n) return null;
  const k = Math.max(a, b);
  return placeDecimal((f.n * p10(k)) / f.d, k);
}

function sigCount(dec: string): number {
  const digits = dec.replace('-', '').replace('.', '').replace(/^0+/, '');
  return digits.length;
}

/** value·10^k rounded half away from zero (k ≥ 0) */
function roundScaled(f: Frac, k: number): bigint {
  const num = f.n * p10(k);
  let q = num / f.d;
  const rem = num % f.d;
  const r2 = (rem < 0n ? -rem : rem) * 2n;
  if (r2 >= f.d) q += num < 0n ? -1n : 1n;
  return q;
}

/** floor(log10(|f|)) for f ≠ 0 */
function floorLog10(f: Frac): number {
  const n = f.n < 0n ? -f.n : f.n;
  let e = n.toString().length - f.d.toString().length;
  const ge = (e: number) => (e >= 0 ? n >= f.d * p10(e) : n * p10(-e) >= f.d);
  if (!ge(e)) e--;
  return e;
}

export function fmt(f: Frac, opt: FmtOpts = {}): Fmt {
  if (opt.decimals != null) {
    const r = roundScaled(f, opt.decimals);
    const back = new Frac(r, p10(opt.decimals));
    const approx = !back.eq(f);
    return { s: placeDecimal(r, opt.decimals, !approx), approx };
  }
  if (f.isInt()) return { s: f.n.toString(), approx: false };
  const sig = opt.sig ?? 4;
  const ex = exactDecimal(f);
  if (ex && sigCount(ex) <= Math.max(sig, 7)) return { s: ex, approx: false };
  const e = floorLog10(f);
  const k = sig - 1 - e;
  if (k <= 0) return { s: roundScaled(f, 0).toString(), approx: true };
  return { s: placeDecimal(roundScaled(f, k), k), approx: true };
}

/** "324", "0.6944" – the text only */
export const num = (f: Frac, opt?: FmtOpts) => fmt(f, opt).s;

/** TeX for a value: "324", "\approx 0.6944" is NOT added here; callers decide "=" vs "\approx". */
export const texNum = (f: Frac, opt?: FmtOpts) => fmt(f, opt).s;

/** "=" or "\approx" for a value */
export const texRel = (f: Frac, opt?: FmtOpts) => (fmt(f, opt).approx ? '\\approx' : '=');

/** For display in HTML text: real minus sign */
export const show = (s: string) => s.replace(/^-/, '−');

/** Percent with no decimals, e.g. 0.7059 → "71" */
export function percent(f: Frac): Fmt {
  const r = roundScaled(f.mul(100), 0);
  return { s: r.toString(), approx: !new Frac(r).eq(f.mul(100)) };
}
