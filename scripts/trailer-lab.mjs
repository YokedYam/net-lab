// Records a CLEAN interactive Visual Lab clip with a visible cursor that
// actually moves and clicks: grab Ping, click a source, click a destination,
// and the glowing packet animates the path. Dev server must be running.
// Run: node scripts/trailer-lab.mjs
import { chromium } from 'playwright';
import { mkdirSync, readdirSync, renameSync } from 'node:fs';

const URL = process.env.URL ?? 'http://localhost:5173/';
const OUT = '/tmp/trailer';
mkdirSync(OUT, { recursive: true });
const W = 1920, H = 1080;

// A fake cursor that follows real mouse events, with a click ripple.
const CURSOR = `(() => {
  const add = () => {
    const c = document.createElement('div');
    c.id = '__cur';
    c.style.cssText = 'position:fixed;left:0;top:0;width:20px;height:20px;margin:-10px 0 0 -10px;border-radius:50%;background:#fff;border:2px solid #0b1220;box-shadow:0 2px 8px rgba(0,0,0,.5);z-index:2147483647;pointer-events:none;transition:transform .08s';
    const r = document.createElement('div');
    r.id = '__rip';
    r.style.cssText = 'position:fixed;left:0;top:0;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;border:3px solid #34d399;opacity:0;z-index:2147483646;pointer-events:none';
    document.body.appendChild(c); document.body.appendChild(r);
    let x=0,y=0;
    addEventListener('mousemove', e => { x=e.clientX; y=e.clientY; c.style.left=x+'px'; c.style.top=y+'px'; }, true);
    addEventListener('mousedown', () => { c.style.transform='scale(.8)'; r.style.left=x+'px'; r.style.top=y+'px'; r.style.transition='none'; r.style.opacity='1'; r.style.transform='scale(1)'; requestAnimationFrame(()=>{ r.style.transition='transform .5s, opacity .5s'; r.style.transform='scale(3.2)'; r.style.opacity='0'; }); }, true);
    addEventListener('mouseup', () => { c.style.transform='scale(1)'; }, true);
  };
  if (document.body) add(); else addEventListener('DOMContentLoaded', add);
})()`;

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: W, height: H },
  recordVideo: { dir: OUT, size: { width: W, height: H } },
});
await ctx.addInitScript(CURSOR);
const page = await ctx.newPage();

// Smoothly move the cursor to an element's center, then click it.
const glide = async (locator, { steps = 30, pause = 500 } = {}) => {
  const box = await locator.boundingBox();
  if (!box) throw new Error('no box');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps });
  await page.waitForTimeout(180);
  await page.mouse.down(); await page.waitForTimeout(90); await page.mouse.up();
  await page.waitForTimeout(pause);
};

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(900);
await page.mouse.move(W * 0.5, H * 0.55, { steps: 10 });

// Populate the network.
await glide(page.getByRole('button', { name: 'Starter' }), { pause: 1400 });

// Grab the Ping tool, then ping across the two LANs: Laptop-1 -> Server-1.
await glide(page.locator('[data-coach="tool-ping"]'), { pause: 600 });
await glide(page.locator('g.device', { hasText: 'Laptop-1' }).first(), { pause: 600 });
await glide(page.locator('g.device', { hasText: 'Server-1' }).first(), { pause: 3600 });

// A second ping from the other laptop so there is sustained motion.
await glide(page.locator('g.device', { hasText: 'Laptop-2' }).first(), { pause: 600 });
await glide(page.locator('g.device', { hasText: 'Server-1' }).first(), { pause: 3400 });

await ctx.close();
const vids = readdirSync(OUT).filter((f) => f === 'lab.webm' ? false : f.endsWith('.webm') && f !== 'osi.webm');
// rename the freshest non-osi webm to lab.webm
const fresh = readdirSync(OUT).filter((f) => f.endsWith('.webm') && f !== 'osi.webm')
  .map((f) => ({ f, t: 0 }));
const all = readdirSync(OUT).filter((f) => f.endsWith('.webm') && f !== 'osi.webm');
if (all.length) renameSync(`${OUT}/${all[0]}`, `${OUT}/lab.webm`);
await browser.close();
console.log('lab clip ->', `${OUT}/lab.webm`);
