// Records a short demo video of Net+ Visual Lab by driving the running dev
// server with Playwright. Output is a .webm; convert to .mp4 with ffmpeg after.
// Run the dev server first (npm run dev), then: node scripts/record.mjs
import { chromium } from 'playwright';
import { mkdirSync, readdirSync, renameSync } from 'node:fs';

const URL = process.env.URL ?? 'http://localhost:5173/';
const OUT = '/tmp/netvideo';
mkdirSync(OUT, { recursive: true });

const step = async (label, fn) => {
  try { await fn(); console.log('ok:', label); }
  catch (e) { console.log('FAIL:', label, '-', e.message.split('\n')[0]); }
};

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: { dir: OUT, size: { width: 1280, height: 720 } },
});
const page = await context.newPage();

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);

// Confirm branding rendered (also useful as a still).
await step('branding still', async () => {
  await page.screenshot({ path: `${OUT}/branding-check.png` });
});

// Visual Lab hero: load the starter topology so the canvas is populated.
await step('starter topology', async () => {
  await page.getByRole('button', { name: 'Starter' }).click();
  await page.waitForTimeout(1800);
});

// OSI Model: the "see it move" centerpiece. Open it and let it animate.
await step('osi animate', async () => {
  await page.getByRole('button', { name: 'OSI Model' }).click();
  await page.waitForTimeout(800);
  // Kick a clean run from the top if there's a Restart/Play control.
  for (const name of ['Restart', 'Play']) {
    const b = page.getByRole('button', { name, exact: true });
    if (await b.count()) { await b.first().click().catch(() => {}); break; }
  }
  await page.waitForTimeout(7000); // let encapsulation -> wire -> de-encapsulation play
});

// Match game: open it, pick a set, click a couple tiles to show interaction.
await step('match game', async () => {
  await page.getByRole('button', { name: 'Match' }).click();
  await page.waitForTimeout(800);
  for (const set of ['Ports', 'OSI', 'Protocols']) {
    const s = page.getByRole('button', { name: new RegExp(set, 'i') });
    if (await s.count()) { await s.first().click().catch(() => {}); break; }
  }
  await page.waitForTimeout(700);
  const tiles = page.locator('.match-tile, [class*="tile"], button');
  const n = Math.min(6, await tiles.count());
  for (let i = 0; i < n; i++) {
    await tiles.nth(i).click().catch(() => {});
    await page.waitForTimeout(450);
  }
  await page.waitForTimeout(800);
});

// Troubleshoot: show the seven-step method screen.
await step('troubleshoot', async () => {
  await page.getByRole('button', { name: 'Troubleshoot' }).click();
  await page.waitForTimeout(2200);
});

// Flashcards: quick flip.
await step('flashcards', async () => {
  await page.getByRole('button', { name: 'Flashcards' }).click();
  await page.waitForTimeout(1500);
});

// Land back on the branded header.
await step('back to lab', async () => {
  await page.getByRole('button', { name: 'Visual Lab' }).click();
  await page.waitForTimeout(1200);
});

await context.close(); // finalizes the video file
await browser.close();

// Give the webm a stable name.
const vids = readdirSync(OUT).filter((f) => f.endsWith('.webm'));
if (vids.length) {
  renameSync(`${OUT}/${vids[0]}`, `${OUT}/netlab-demo.webm`);
  console.log('video -> ' + OUT + '/netlab-demo.webm');
}
console.log('done -> ' + OUT);
