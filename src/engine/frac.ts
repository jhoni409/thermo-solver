// Exact rational numbers on BigInt. Every number the app shows is computed with these.

const abs = (a: bigint) => (a < 0n ? -a : a);

export function gcd(a: bigint, b: bigint): bigint {
  a = abs(a);
  b = abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

export function lcm(a: bigint, b: bigint): bigint {
  return (abs(a) / gcd(a, b)) * abs(b);
}

export type FracLike = Frac | bigint | number | string;

export class Frac {
  readonly n: bigint;
  readonly d: bigint;

  constructor(n: bigint, d: bigint = 1n) {
    if (d === 0n) throw new RangeError('division by zero');
    if (d < 0n) {
      n = -n;
      d = -d;
    }
    const g = gcd(n, d) || 1n;
    this.n = n / g;
    this.d = d / g;
  }

  static of(x: FracLike): Frac {
    if (x instanceof Frac) return x;
    if (typeof x === 'bigint') return new Frac(x);
    if (typeof x === 'number') return Number.isInteger(x) ? new Frac(BigInt(x)) : Frac.parse(String(x));
    return Frac.parse(x);
  }

  /** "7.2", "-57.2", "8/49", "0.25/0.36", "2.5e-3" */
  static parse(src: string): Frac {
    const s = src.trim().replace(/[−–]/g, '-');
    const slash = s.indexOf('/');
    if (slash > 0) return Frac.parse(s.slice(0, slash)).div(Frac.parse(s.slice(slash + 1)));
    const m = /^([+-]?)(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/.exec(s);
    if (!m || (m[2] === '' && !m[3])) throw new SyntaxError(`not a number: ${src}`);
    const frac = m[3] ?? '';
    let n = BigInt((m[2] || '0') + frac);
    let d = 10n ** BigInt(frac.length);
    const e = m[4] ? parseInt(m[4], 10) : 0;
    if (e > 0) n *= 10n ** BigInt(e);
    else if (e < 0) d *= 10n ** BigInt(-e);
    if (m[1] === '-') n = -n;
    return new Frac(n, d);
  }

  add(o: FracLike): Frac {
    const b = Frac.of(o);
    return new Frac(this.n * b.d + b.n * this.d, this.d * b.d);
  }
  sub(o: FracLike): Frac {
    const b = Frac.of(o);
    return new Frac(this.n * b.d - b.n * this.d, this.d * b.d);
  }
  mul(o: FracLike): Frac {
    const b = Frac.of(o);
    return new Frac(this.n * b.n, this.d * b.d);
  }
  div(o: FracLike): Frac {
    const b = Frac.of(o);
    return new Frac(this.n * b.d, this.d * b.n);
  }
  neg(): Frac {
    return new Frac(-this.n, this.d);
  }
  inv(): Frac {
    return new Frac(this.d, this.n);
  }
  abs(): Frac {
    return new Frac(abs(this.n), this.d);
  }
  pow(k: number): Frac {
    if (!Number.isInteger(k)) throw new RangeError('integer powers only');
    const e = BigInt(Math.abs(k));
    const r = new Frac(this.n ** e, this.d ** e);
    return k < 0 ? r.inv() : r;
  }

  cmp(o: FracLike): -1 | 0 | 1 {
    const b = Frac.of(o);
    const l = this.n * b.d;
    const r = b.n * this.d;
    return l < r ? -1 : l > r ? 1 : 0;
  }
  eq(o: FracLike) {
    return this.cmp(o) === 0;
  }
  lt(o: FracLike) {
    return this.cmp(o) < 0;
  }
  gt(o: FracLike) {
    return this.cmp(o) > 0;
  }
  sign(): -1 | 0 | 1 {
    return this.n < 0n ? -1 : this.n > 0n ? 1 : 0;
  }
  isZero() {
    return this.n === 0n;
  }
  isInt() {
    return this.d === 1n;
  }
  toNumber(): number {
    return Number(this.n) / Number(this.d);
  }
  toString(): string {
    return this.d === 1n ? `${this.n}` : `${this.n}/${this.d}`;
  }
}

export const F = (x: FracLike) => Frac.of(x);
export const ZERO = new Frac(0n);
export const ONE = new Frac(1n);

/** Exact integer m-th root of a rational, or null. */
export function rootExact(x: Frac, m: number): Frac | null {
  if (x.sign() < 0) return null;
  const r = (v: bigint) => {
    let lo = 0n;
    let hi = 1n;
    while (hi ** BigInt(m) <= v) hi *= 2n;
    while (lo < hi - 1n) {
      const mid = (lo + hi) / 2n;
      if (mid ** BigInt(m) <= v) lo = mid;
      else hi = mid;
    }
    return lo ** BigInt(m) === v ? lo : null;
  };
  const n = r(x.n);
  const d = r(x.d);
  return n !== null && d !== null ? new Frac(n, d) : null;
}
