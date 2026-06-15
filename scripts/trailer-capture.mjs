// Captures CLEAN trailer assets: high-res stills with no visible navigation,
// plus one uninterrupted clip of the OSI animation playing. Separate browser
// contexts keep the recorded clip free of any clicking.
// Dev server must be running. Run: node scripts/trailer-capture.mjs
import { chromium } from 'playwright';
import { mkdirSync, readdirSync, renameSync } from 'node:fs';

const URL = process.env.URL ?? 'http://localhost:5173/';
const OUT = '/tmp/trailer';
mkdirSync(OUT, { recursive: true });
const W = 1920, H = 1080;

const nav = async (page, label) =>
  page.locator('nav.sectionnav button', { hasText: label }).first().click();

const browser = await chromium.launch();

// ---- Pass 1: clean desktop stills (no recording) ----
const ctx = await browser.newContext({ viewport: { width: W, height: H } });
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);

const shot = async (name) => { await page.screenshot({ path: `${OUT}/${name}.png` }); console.log('shot', name); };

await page.getByRole('button', { name: 'Starter' }).click().catch(() => {});
await page.waitForTimeout(1500);
await shot('lab');

await nav(page, 'Match').catch(() => {});
await page.waitForTimeout(700);
await page.locator('button', { hasText: /Ports/i }).first().click().catch(() => {});
await page.waitForTimeout(900);
await shot('match');

await nav(page, 'Troubleshoot').catch(() => {});
await page.waitForTimeout(1200);
await shot('troubleshoot');

await nav(page, 'OSI Model').catch(() => {});
await page.waitForTimeout(1500);
await shot('osi-still');
await ctx.close();

// ---- Pass 2: clean OSI animation clip (its own context, no clicks after start) ----
const vctx = await browser.newContext({
  viewport: { width: W, height: H },
  recordVideo: { dir: OUT, size: { width: W, height: H } },
});
const vpage = await vctx.newPage();
await vpage.goto(URL, { waitUntil: 'networkidle' });
await vpage.waitForTimeout(800);
await nav(vpage, 'OSI Model').catch(() => {});
await vpage.waitForTimeout(800);
for (const name of ['Restart', 'Play']) {
  const b = vpage.getByRole('button', { name, exact: true });
  if (await b.count()) { await b.first().click().catch(() => {}); break; }
}
await vpage.waitForTimeout(8000); // hold on the animation, untouched
await vctx.close();
const vids = readdirSync(OUT).filter((f) => f.endsWith('.webm'));
if (vids.length) renameSync(`${OUT}/${vids[0]}`, `${OUT}/osi.webm`);
console.log('osi clip ->', `${OUT}/osi.webm`);

// ---- Pass 3: mobile still ----
const mctx = await browser.newContext({
  viewport: { width: 412, height: 892 }, deviceScaleFactor: 2, isMobile: true,
});
const mpage = await mctx.newPage();
await mpage.goto(URL, { waitUntil: 'networkidle' });
await mpage.waitForTimeout(1000);
await mpage.locator('nav.sectionnav button', { hasText: 'Flashcards' }).first().click().catch(() => {});
await mpage.waitForTimeout(1200);
await mpage.screenshot({ path: `${OUT}/mobile.png` });
console.log('shot mobile');
await mctx.close();

await browser.close();
console.log('done ->', OUT);
