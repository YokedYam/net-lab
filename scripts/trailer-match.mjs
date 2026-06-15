// Records the Match game actually working: a visible cursor clicks correct
// term/definition pairs and they clear. Dev server must be running.
// Run: node scripts/trailer-match.mjs
import { chromium } from 'playwright';
import { mkdirSync, readdirSync, renameSync } from 'node:fs';

const URL = process.env.URL ?? 'http://localhost:5173/';
const OUT = '/tmp/trailer';
mkdirSync(OUT, { recursive: true });
const W = 1920, H = 1080;

// Ports & protocols pairs (from src/matchData.ts).
const PAIRS = [
  ['HTTPS', 'TCP 443'], ['SSH', 'TCP 22'], ['DNS', 'Port 53'],
  ['HTTP', 'TCP 80'], ['RDP', 'TCP 3389'], ['SMTP', 'TCP 25'],
  ['FTP', 'TCP 20/21'], ['DHCP', 'UDP 67/68'], ['Telnet', 'TCP 23'],
  ['SMB', 'TCP 445'], ['SNMP', 'UDP 161/162'], ['NTP', 'UDP 123'],
];

const CURSOR = `(() => {
  const add = () => {
    const c = document.createElement('div'); c.id='__cur';
    c.style.cssText='position:fixed;left:0;top:0;width:20px;height:20px;margin:-10px 0 0 -10px;border-radius:50%;background:#fff;border:2px solid #0b1220;box-shadow:0 2px 8px rgba(0,0,0,.5);z-index:2147483647;pointer-events:none;transition:transform .08s';
    const r = document.createElement('div'); r.id='__rip';
    r.style.cssText='position:fixed;left:0;top:0;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;border:3px solid #34d399;opacity:0;z-index:2147483646;pointer-events:none';
    document.body.appendChild(c); document.body.appendChild(r);
    let x=0,y=0;
    addEventListener('mousemove', e=>{x=e.clientX;y=e.clientY;c.style.left=x+'px';c.style.top=y+'px';}, true);
    addEventListener('mousedown', ()=>{c.style.transform='scale(.8)';r.style.left=x+'px';r.style.top=y+'px';r.style.transition='none';r.style.opacity='1';r.style.transform='scale(1)';requestAnimationFrame(()=>{r.style.transition='transform .5s,opacity .5s';r.style.transform='scale(3.2)';r.style.opacity='0';});}, true);
    addEventListener('mouseup', ()=>{c.style.transform='scale(1)';}, true);
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

const glide = async (locator, { steps = 22, pause = 360 } = {}) => {
  const box = await locator.boundingBox();
  if (!box) throw new Error('no box');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps });
  await page.waitForTimeout(120);
  await page.mouse.down(); await page.waitForTimeout(80); await page.mouse.up();
  await page.waitForTimeout(pause);
};

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
await page.locator('nav.sectionnav button', { hasText: 'Match' }).first().click();
await page.waitForTimeout(700);
await page.mouse.move(W * 0.5, H * 0.5, { steps: 8 });

// Pick the Ports & protocols set (chip reads "Ports & protocols · 12").
await glide(page.locator('button.fchip', { hasText: 'Ports & protocols' }).first(), { pause: 800 });

// Click correct pairs that are actually on the board.
let made = 0;
for (const [term, def] of PAIRS) {
  if (made >= 4) break;
  const t = page.getByText(term, { exact: true });
  const d = page.getByText(def, { exact: true });
  if (await t.count() && await d.count()) {
    try {
      await glide(t.first(), { pause: 260 });
      await glide(d.first(), { pause: 520 });
      made++;
    } catch { /* tile vanished mid-move, skip */ }
  }
}
await page.waitForTimeout(1200);

await ctx.close();
const all = readdirSync(OUT).filter((f) => f.endsWith('.webm') && f !== 'osi.webm' && f !== 'lab.webm');
if (all.length) renameSync(`${OUT}/${all[0]}`, `${OUT}/match.webm`);
await browser.close();
console.log('match clip ->', `${OUT}/match.webm`, '· matches made:', made);
