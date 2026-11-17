// Live run with game audio. Same as live.mjs, plus:
//  - an init script taps every AudioNode wired to ctx.destination into a MediaStreamDestination,
//    which a MediaRecorder captures as Opus and streams back to Node;
//  - screencast frames are piped straight into ffmpeg at constant 30 fps (no frames on disk);
//  - the audio is muxed in using the wall-clock start times of both streams.
// Usage: node live_audio.mjs OUTDIR maxTries opp1 [opp2 ...]   (retries each opponent until a win)
import { chromium } from "playwright";
import fs from "node:fs";
import { spawn, execFileSync } from "node:child_process";

const [outDir = "recordings", maxTries = "3", ...opps] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: false, args: ["--autoplay-policy=no-user-gesture-required", "--window-size=1600,980"] });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
await ctx.addInitScript(() => {
  const ctxs = (window.__audioCtxs = []);
  const tap = (ac) => { if (!ac.__rec) { ac.__rec = ac.createMediaStreamDestination(); ctxs.push(ac); } return ac.__rec; };
  const orig = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (dest, ...rest) {
    const r = orig.call(this, dest, ...rest);
    if (dest instanceof AudioDestinationNode) orig.call(this, tap(dest.context));
    return r;
  };
  // the game falls back to <audio> for a few clips; route those through the tapped context too
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    const ac = ctxs[0];
    if (ac && !this.__routed) { try { const s = ac.createMediaElementSource(this); s.connect(ac.destination); this.__routed = true; } catch {} }
    return play.call(this);
  };
  window.__recStart = () => {
    const ac = ctxs[0]; if (!ac) return false;
    const rec = new MediaRecorder(ac.__rec.stream, { mimeType: "audio/webm;codecs=opus", audioBitsPerSecond: 160000 });
    rec.onstart = () => window.__audioStart(Date.now() / 1000);
    rec.ondataavailable = async (e) => { const b = new Uint8Array(await e.data.arrayBuffer()); let s = ""; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000)); await window.__audioChunk(btoa(s)); };
    rec.onstop = () => setTimeout(() => window.__audioDone(), 300);
    window.__rec = rec; rec.start(1000); return true;
  };
  window.__recStop = () => window.__rec?.state === "recording" && window.__rec.stop();
});
const page = await ctx.newPage();
let audio = null;
await page.exposeFunction("__audioStart", (t) => { audio.start = t; });
await page.exposeFunction("__audioChunk", (b64) => { audio.fd && fs.writeSync(audio.fd, Buffer.from(b64, "base64")); });
await page.exposeFunction("__audioDone", () => { audio.done?.(); });
page.on("console", (m) => { const t = m.text(); if (/agent|error/i.test(t)) console.log("[page]", t.slice(0, 200)); });
await page.goto("http://localhost:8790/");
await page.locator("text=I UNDERSTAND · CONTINUE").click({ timeout: 30000 }).catch(() => {});
await page.waitForFunction(() => document.querySelector("#loading")?.classList.contains("hidden"), null, { timeout: 300000 });
await page.mouse.click(800, 450); // a real gesture so the game unlocks its AudioContext
await page.evaluate(() => import("/agent/agent.mjs"));
await page.waitForFunction(() => !!window.__agent?.W, null, { timeout: 30000 });
console.log("client + agent loaded, audio contexts:", await page.evaluate(() => window.__audioCtxs.length));

const cdp = await ctx.newCDPSession(page);
const results = [];
for (const [k, opp] of opps.entries()) {
  for (let attempt = 1; attempt <= +maxTries; attempt++) {
    const tag = `${String(k + 1).padStart(2, "0")}_modi_vs_${opp}_hard`, base = `${outDir}/${tag}_try${attempt}`;
    const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", "30", "-c:v", "mjpeg", "-i", "-", "-vf", "scale=1280:720:flags=lanczos", "-c:v", "libx264", "-crf", "24", "-preset", "veryfast", "-pix_fmt", "yuv420p", `${base}_v.mp4`], { stdio: ["pipe", "inherit", "inherit"] });
    const ffDone = new Promise((r) => ff.on("close", r));
    let t0 = null, written = 0, prev = null;
    const onFrame = (f) => {
      cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {});
      const buf = Buffer.from(f.data, "base64"), ts = f.metadata.timestamp;
      if (t0 === null) t0 = ts;
      const due = Math.floor((ts - t0) * 30); // output frames that should exist before this one
      while (prev && written < due) { ff.stdin.write(prev); written++; }
      prev = buf;
    };
    audio = { fd: fs.openSync(`${base}_a.webm`, "w") };
    cdp.on("Page.screencastFrame", onFrame);
    await cdp.send("Page.startScreencast", { format: "jpeg", quality: 85, maxWidth: 1600, maxHeight: 900, everyNthFrame: 1 });
    await page.evaluate((o) => { window.__agent.log = []; window.__agent.decisions = 0; window.__game.start("modi", "hard", undefined, o); }, opp);
    if (!(await page.evaluate(() => window.__recStart()))) throw new Error("no AudioContext to record");
    await page.waitForFunction(() => window.__game.battle && window.__game.battle.phase === "fight", null, { timeout: 120000 });
    const r = await page.waitForFunction(() => {
      const b = window.__game.battle; if (!b) return false;
      if (b.phase === "done" || (b.phase === "matchOver" && b.phaseTime > 4.5)) return { wins: [...b.match.wins], winner: b.match.winner, player: b.playerSide, opp: b.fighters[1 - b.playerSide].char.id, boss: !!b.fighters[1 - b.playerSide].boss, decisions: window.__agent.decisions, hp: b.fighters.map((f) => Math.round(f.hp)) };
      return false;
    }, null, { timeout: 900000, polling: 250 }).then((h) => h.jsonValue());
    const aDone = new Promise((res) => (audio.done = res));
    await page.evaluate(() => window.__recStop());
    await Promise.race([aDone, new Promise((res) => setTimeout(res, 5000))]);
    fs.closeSync(audio.fd); audio.fd = null;
    await cdp.send("Page.stopScreencast"); cdp.off("Page.screencastFrame", onFrame);
    if (prev) { ff.stdin.write(prev); written++; }
    ff.stdin.end(); await ffDone;
    r.won = r.winner === r.player; r.tag = tag; r.attempt = attempt; r.audioOffset = +(audio.start - t0).toFixed(3); r.frames = written;
    results.push(r); console.log(JSON.stringify(r));
    const out = `${outDir}/${tag}_${r.won ? "WIN" : "LOSS"}_audio.mp4`;
    const off = r.audioOffset;
    // shift audio by its start offset relative to the first video frame
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", `${base}_v.mp4`, ...(off >= 0 ? ["-itsoffset", String(off)] : ["-ss", String(-off)]), "-i", `${base}_a.webm`, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", out]);
    fs.rmSync(`${base}_v.mp4`); fs.rmSync(`${base}_a.webm`);
    fs.writeFileSync(`${outDir}/results.json`, JSON.stringify(results, null, 1));
    await page.waitForTimeout(3000);
    if (r.won) break;
    if (!r.won) fs.rmSync(out);
  }
}
await browser.close();
