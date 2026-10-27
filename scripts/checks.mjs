// Browser checks the brief asks to measure, not eyeball:
//  1. bidi: inside every LTR isolate, the first character is left of the last one (e.g. "Q < K" has Q left of K)
//  2. idle: no requestAnimationFrame loop runs once a step has finished
//  3. reduced motion: the next step lands on its final frame at once
// node scripts/checks.mjs <base url>
import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://localhost:4179/';
const ids = ['S1', 'S2', 'S3', 'S4', 'S5'];
const browser = await chromium.launch();
let fail = 0;
const bad = (m) => {
  fail++;
  console.log('FAIL', m);
};

// ---------------------------------------------------------------- 1. bidi
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  let checked = 0;
  for (const id of ids) {
    await page.goto(`${base}?p=${id}`);
    await page.waitForSelector('body.ready');
    const n = await page.evaluate(() => window.__eq.n());
    for (let i = 0; i < n; i++) {
      await page.evaluate((i) => window.__eq.jump(i), i);
      const r = await page.evaluate(() => {
        const out = [];
        const roots = [...document.querySelectorAll('.card bdi, .q-body bdi, .step-list bdi, .where bdi, .why bdi')];
        for (const b of roots) {
          const walker = document.createTreeWalker(b, NodeFilter.SHOW_TEXT);
          const chars = [];
          for (let t = walker.nextNode(); t; t = walker.nextNode()) {
            const s = t.textContent ?? '';
            for (let k = 0; k < s.length; k++) if (s[k].trim() && !/[​⁡-⁤]/.test(s[k])) chars.push([t, k]);
          }
          if (chars.length < 2) continue;
          const rect = ([t, k]) => {
            const rg = document.createRange();
            rg.setStart(t, k);
            rg.setEnd(t, k + 1);
            return rg.getBoundingClientRect();
          };
          const a = rect(chars[0]);
          const z = rect(chars[chars.length - 1]);
          if (!a.width || !z.width) continue;
          // same line only (fractions stack vertically)
          if (Math.abs(a.top - z.top) > a.height * 1.5) continue;
          out.push({ text: b.textContent, ok: a.left < z.left });
        }
        return out;
      });
      for (const x of r) {
        checked++;
        if (!x.ok) bad(`bidi ${id} step ${i + 1}: "${x.text}" reads right-to-left`);
      }
    }
  }
  // the brief's example: "ΔS°יקום > 0" in S1's rule row has Δ left of 0
  await page.goto(`${base}?p=S1`);
  await page.waitForSelector('body.ready');
  const n = await page.evaluate(() => window.__eq.n());
  let found = false;
  for (let i = 0; i < n && !found; i++) {
    await page.evaluate((i) => window.__eq.jump(i), i);
    const r = await page.evaluate(() => {
      const b = [...document.querySelectorAll('.card.cur .rule-row bdi')].find((x) => /Δ.*>\s*0/.test(x.textContent.replace(/\s/g, ' ')));
      if (!b) return null;
      const w = document.createTreeWalker(b, NodeFilter.SHOW_TEXT);
      let d, z;
      for (let t = w.nextNode(); t; t = w.nextNode()) {
        const i1 = t.textContent.indexOf('Δ');
        const i2 = t.textContent.indexOf('0');
        const rg = document.createRange();
        if (i1 >= 0 && d == null) {
          rg.setStart(t, i1);
          rg.setEnd(t, i1 + 1);
          d = rg.getBoundingClientRect().left;
        }
        if (i2 >= 0 && z == null) {
          rg.setStart(t, i2);
          rg.setEnd(t, i2 + 1);
          z = rg.getBoundingClientRect().left;
        }
      }
      return { d, z };
    });
    if (r && r.d != null && r.z != null) {
      found = true;
      console.log(`"ΔS° > 0" on the card: Δ at x=${r.d.toFixed(1)}, 0 at x=${r.z.toFixed(1)} → ${r.d < r.z ? 'Δ left of 0 ✓' : 'WRONG'}`);
      if (!(r.d < r.z)) bad('ΔS° > 0 order');
    }
  }
  if (!found) bad('no "ΔS° > 0" found on an S1 card');
  console.log(`bidi: ${checked} LTR isolates measured`);
  await page.close();
}

// ---------------------------------------------------------------- 2. idle
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.addInitScript(() => {
    window.__raf = 0;
    const orig = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (cb) => {
      window.__raf++;
      return orig(cb);
    };
  });
  await page.goto(`${base}?p=S1`);
  await page.waitForSelector('body.ready');
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(9000); // the step plays, then GSAP's ticker goes to sleep
  const a = await page.evaluate(() => window.__raf);
  await page.waitForTimeout(3000);
  const b = await page.evaluate(() => window.__raf);
  console.log(`idle: ${b - a} animation frames requested in 3 s of idle`);
  if (b - a > 2) bad('animation frames keep running while idle');
  await page.close();
}

// ---------------------------------------------------------------- 3. reduced motion
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(`${base}?p=S1`);
  await page.waitForSelector('body.ready');
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(50);
  const r = await page.evaluate(() => ({
    i: window.__eq.i,
    reduced: window.__eq.reduced(),
    shown: [...document.querySelectorAll('.card.cur, .card.cur .card-body > *')].every((e) => getComputedStyle(e).opacity === '1'),
  }));
  console.log(`reduced motion: media=${r.reduced}, after one → press the app is on step ${r.i + 1}, card fully shown: ${r.shown}`);
  if (!r.reduced || r.i !== 1 || !r.shown) bad('reduced motion does not jump');
  await ctx.close();
}

await browser.close();
console.log(fail ? `${fail} check(s) failed` : 'all checks passed');
process.exit(fail ? 1 : 0);
