// Drives the running dev server and saves screenshots to disk so Claude can
// Read the PNGs (token-efficient: nothing streams into context except the
// images we choose to look at). Run: node scripts/shoot.mjs
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const URL = process.env.URL ?? 'http://localhost:5173/';
const OUT = '/tmp/netshots';
mkdirSync(OUT, { recursive: true });

const shot = async (page, name) => {
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log('shot:', name);
};
const step = async (label, fn) => {
  try {
    await fn();
    console.log('ok:', label);
  } catch (e) {
    console.log('FAIL:', label, '-', e.message.split('\n')[0]);
  }
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
await shot(page, '01-lab');

// Manual IP: select a host, flip to Static, capture the addressing panel.
await step('open static panel', async () => {
  await page.locator('[data-coach="tool-select"]').click();
  await page.locator('g.device', { hasText: 'Laptop-1' }).first().click();
  await page.waitForTimeout(250);
  await page.locator('[data-coach="ipmode-static"]').click();
  await page.locator('[data-coach="static-ip"]').fill('192.168.1.10');
  await page.locator('[data-coach="static-mask"]').fill('24');
  await page.waitForTimeout(250);
});
await shot(page, '02-manual-ip');

// Guided home.
await step('go guided', async () => {
  await page.getByRole('button', { name: 'Guided' }).click();
  await page.waitForSelector('.gh-card');
  await page.waitForTimeout(250);
});
await shot(page, '03-guided-home');

// Start a mission -> teach card (dimmed screen).
await step('start mission', async () => {
  await page.getByText('Build your first network').click();
  await page.waitForSelector('.coach-lesson');
  await page.waitForTimeout(300);
});
await shot(page, '04-mission-teach');

// Advance to the first "do" step -> spotlight cutout over the Switch tool.
await step('advance to spotlight', async () => {
  await page.getByRole('button', { name: /Got it/ }).click();
  await page.waitForSelector('.coach-hole', { timeout: 4000 });
  await page.waitForTimeout(500);
});
await shot(page, '05-spotlight');

// Actually do the step -> capture the green celebration before it auto-advances.
await step('place switch -> celebrate', async () => {
  await page.locator('[data-coach="device-switch"]').click();
  await page.locator('.canvas-wrap').click({ position: { x: 460, y: 360 } });
  await page.waitForSelector('.coach-hole.pass', { timeout: 4000 });
  await page.waitForTimeout(220);
});
await shot(page, '06-celebrate');

// Confirm the auto-advance actually fires (regression: timer was being cleared).
await step('verify advance to step 3', async () => {
  await page.waitForFunction(() => document.body.innerText.includes('Step 3 of 6'), { timeout: 4000 });
  await page.waitForTimeout(200);
});
await shot(page, '07-advanced');

await browser.close();
console.log('done -> ' + OUT);
