// Live agent for the real client. Reads state through the developer's own localhost hook
// (window.__game.battle, read-only) and plays by dispatching keyboard events, like a player.
import { obs } from "./obs.mjs";
import { forward } from "./net.mjs";
const ACT = [{}, { mx: 1 }, { mx: -1 }, { mx: -1, down: 1 }, { down: 1 }, { up: 1 }, { up: 1, mx: 1 }, { up: 1, mx: -1 },
  { btn: "KeyJ" }, { btn: "KeyK" }, { mx: 1, btn: "KeyJ" }, { mx: 1, btn: "KeyK" }, { down: 1, btn: "KeyJ" }, { down: 1, btn: "KeyK" },
  { btn: "KeyI" }, { btn: "KeyL" }, { btn: "KeyB" }];
const A = window.__agent = { on: true, decisions: 0, last: -1, log: [], held: new Set(), lastSlot: -1 };
A.W = await (await fetch("/agent/policy.json?" + Date.now())).json();
const send = (type, code) => window.dispatchEvent(new KeyboardEvent(type, { code, key: code, bubbles: true }));
function setHeld(want) {
  for (const c of [...A.held]) if (!want.has(c)) { send("keyup", c); A.held.delete(c); }
  for (const c of want) if (!A.held.has(c)) { send("keydown", c); A.held.add(c); }
}
function legal(b, i) {
  const me = b.fighters[b.playerSide];
  if (i === 15) return me.meter >= 100;
  if (i === 16) return !!b.budgetReady;
  return true;
}
function loop() {
  requestAnimationFrame(loop);
  const b = window.__game?.battle;
  if (!A.on || !b) { if (A.held.size) setHeld(new Set()); return; }
  if (b.phase !== "fight") { if (A.held.size) setHeld(new Set()); A.lastSlot = -1; return; }
  if (b.hitStop > 0) return;
  const slot = Math.floor(b.time * 60 / 4);
  if (slot === A.lastSlot) return;
  A.lastSlot = slot;
  const me = b.fighters[b.playerSide], op = b.fighters[1 - b.playerSide], dir = op.x >= me.x ? 1 : -1;
  const q = forward(A.W, obs(b, A.last));
  let a = -1; for (let i = 0; i < q.length; i++) if (legal(b, i) && (a < 0 || q[i] > q[a])) a = i;
  const s = ACT[a], want = new Set();
  const mx = (s.mx || 0) * dir;
  if (mx > 0) want.add("KeyD"); if (mx < 0) want.add("KeyA");
  if (s.up) want.add("KeyW"); if (s.down) want.add("KeyS");
  setHeld(want);
  if (s.btn) { send("keydown", s.btn); setTimeout(() => send("keyup", s.btn), 30); }
  A.last = a; A.decisions++;
  if (A.log.length < 20000) A.log.push([+b.time.toFixed(2), a]);
}
requestAnimationFrame(loop);
console.log("agent loaded");
