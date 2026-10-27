// Screenshots of every step: node scripts/screens.mjs <outDir> <id,id,...> [base url]
// Starts `vite preview` on the built app unless a URL is given.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const [outDir = 'screens', ids = 'S1', given] = process.argv.slice(2);
const sizes = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'phone', width: 390, height: 844 },
];

let server;
let base = given;
if (!base) {
  server = spawn('npx', ['vite', 'preview', '--port', '4179', '--strictPort'], { stdio: 'pipe' });
  base = 'http://localhost:4179/';
  await new Promise((r) => setTimeout(r, 2500));
}

const browser = await chromium.launch();
mkdirSync(outDir, { recursive: true });
let bad = 0;
for (const size of sizes) {
  const page = await browser.newPage({ viewport: { width: size.width, height: size.height }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => {
    bad++;
    console.error('PAGE ERROR', e.message);
  });
  page.on('console', (m) => m.type() === 'error' && console.error('CONSOLE', m.text()));
  for (const id of ids.split(',')) {
    await page.goto(`${base}?p=${id}`);
    await page.waitForSelector('body.ready');
    const n = await page.evaluate(() => window.__eq.n());
    for (let i = 0; i < n; i++) {
      await page.evaluate((i) => window.__eq.jump(i), i);
      await page.waitForTimeout(420);
      const f = `${outDir}/${id}-${size.name}-${String(i + 1).padStart(2, '0')}.png`;
      await page.screenshot({ path: f });
      // the app clips its own overflow, so check the board itself: nothing may stick out sideways
      const sw = await page.evaluate(() => {
        const m = document.querySelector('.main').getBoundingClientRect();
        const b = document.querySelector('.board');
        return Math.max(document.documentElement.scrollWidth - window.innerWidth, Math.round(-m.left), Math.round(m.right - window.innerWidth), b.scrollWidth - b.clientWidth);
      });
      if (sw > 0) {
        bad++;
        console.error(`${id} ${size.name} step ${i + 1}: horizontal overflow ${sw}px`);
      }
    }
    console.log(`${id} ${size.name}: ${n} steps`);
  }
  await page.close();
}
await browser.close();
server?.kill();
process.exit(bad ? 1 : 0);
