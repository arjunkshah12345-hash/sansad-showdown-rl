// Live run in the real Sansad Showdown client (fightkaro.com build served on localhost so the
// developer's read-only window.__game hook is present). The neural net plays via keyboard events.
// Records each match from the DevTools screencast and encodes to MP4.
// Usage: node live.mjs OUTDIR opp1 [opp2 ...]
import { chromium } from "playwright";
import fs from "node:fs";
import { execFileSync } from "node:child_process";

const [outDir = "recordings", ...opps] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: false, args: ["--autoplay-policy=no-user-gesture-required", "--window-size=1600,980"] });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
const page = await ctx.newPage();
page.on("console", (m) => { const t = m.text(); if (/agent|perf|error/i.test(t)) console.log("[page]", t.slice(0, 200)); });
await page.goto("http://localhost:8790/");
const legal = page.locator("text=I UNDERSTAND · CONTINUE");
await legal.click({ timeout: 30000 }).catch(() => {});
await page.waitForFunction(() => document.querySelector("#loading")?.classList.contains("hidden"), null, { timeout: 300000 });
console.log("client loaded");
await page.evaluate(() => import("/agent/agent.mjs"));
await page.waitForFunction(() => !!window.__agent?.W, null, { timeout: 30000 });
console.log("agent loaded");

const cdp = await ctx.newCDPSession(page);
const results = [];
for (const [k, opp] of opps.entries()) {
  const tag = `${String(k + 1).padStart(2, "0")}_modi_vs_${opp}_hard`, fdir = `${outDir}/${tag}_frames`;
  fs.rmSync(fdir, { recursive: true, force: true }); fs.mkdirSync(fdir);
  const frames = [];
  const onFrame = async (f) => { frames.push(f.metadata.timestamp); fs.writeFileSync(`${fdir}/${String(frames.length).padStart(6, "0")}.jpg`, Buffer.from(f.data, "base64")); cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {}); };
  cdp.on("Page.screencastFrame", onFrame);
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 88, maxWidth: 1600, maxHeight: 900, everyNthFrame: 1 });
  await page.evaluate((o) => { window.__agent.log = []; window.__agent.decisions = 0; window.__game.start("modi", "hard", undefined, o); }, opp);
  await page.waitForFunction(() => window.__game.battle && window.__game.battle.phase === "fight", null, { timeout: 120000 });
  const r = await page.waitForFunction(() => {
    const b = window.__game.battle; if (!b) return false;
    if (b.phase === "done" || (b.phase === "matchOver" && b.phaseTime > 4.5)) return { wins: [...b.match.wins], winner: b.match.winner, player: b.playerSide, opp: b.fighters[1 - b.playerSide].char.id, boss: !!b.fighters[1 - b.playerSide].boss, decisions: window.__agent.decisions, hp: b.fighters.map((f) => Math.round(f.hp)) };
    return false;
  }, null, { timeout: 900000, polling: 250 }).then((h) => h.jsonValue());
  await cdp.send("Page.stopScreencast"); cdp.off("Page.screencastFrame", onFrame);
  r.won = r.winner === r.player; r.tag = tag; results.push(r);
  console.log(JSON.stringify(r));
  // encode with real frame timings
  const lines = [];
  for (let i = 0; i < frames.length; i++) { lines.push(`file '${String(i + 1).padStart(6, "0")}.jpg'`); lines.push(`duration ${Math.max(0.001, (frames[i + 1] ?? frames[i] + 1 / 30) - frames[i]).toFixed(4)}`); }
  fs.writeFileSync(`${fdir}/list.txt`, lines.join("\n") + `\nfile '${String(frames.length).padStart(6, "0")}.jpg'\n`);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", `${fdir}/list.txt`, "-vf", "fps=30,scale=1600:900:flags=lanczos", "-c:v", "libx264", "-crf", "23", "-pix_fmt", "yuv420p", "-movflags", "+faststart", `${outDir}/${tag}_${r.won ? "WIN" : "LOSS"}.mp4`]);
  fs.rmSync(fdir, { recursive: true, force: true });
  // back to menu between matches
  await page.waitForTimeout(3000);
}
fs.writeFileSync(`${outDir}/results.json`, JSON.stringify(results, null, 1));
await browser.close();
