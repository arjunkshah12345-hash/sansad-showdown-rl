// Lookahead search player for the headless battle.
// Actions are relative to the opponent (fwd = toward them). Directions are held for the
// decision window; a button is pressed on the window's first tick only (the game reads edges).
import { tick, blankInput } from "./env.mjs";
import { cloneBattle } from "./clone.mjs";

export const ACTIONS = [
  { n: "idle" }, { n: "fwd", mx: 1 }, { n: "block", mx: -1 }, { n: "lowblock", mx: -1, down: 1 }, { n: "crouch", down: 1 },
  { n: "jump", up: 1 }, { n: "jumpfwd", up: 1, mx: 1 }, { n: "jumpback", up: 1, mx: -1 },
  { n: "punch", btn: "punch" }, { n: "kick", btn: "kick" }, { n: "fwdpunch", mx: 1, btn: "punch" }, { n: "fwdkick", mx: 1, btn: "kick" },
  { n: "lowpunch", down: 1, btn: "punch" }, { n: "lowkick", down: 1, btn: "kick" }, { n: "grab", btn: "grab" }, { n: "super", btn: "super" },
  { n: "budget", budget: 1 },
];
export const NA = ACTIONS.length;
export const WIN = 4; // ticks per decision

export function inputFor(b, a, first) {
  const side = b.playerSide, me = b.fighters[side], op = b.fighters[1 - side];
  const dir = op.x >= me.x ? 1 : -1, A = ACTIONS[a], i = blankInput();
  i.moveX = (A.mx || 0) * dir; i.up = !!A.up; i.down = !!A.down;
  if (first && A.btn) i[A.btn] = true;
  return i;
}
export function legal(b, a) {
  const A = ACTIONS[a], me = b.fighters[b.playerSide];
  if (A.btn === "super") return me.meter >= 100;
  if (A.budget) return !!b.budgetReady && !b.budgetUsed;
  return true;
}
// apply one decision window
export function act(b, a) {
  if (ACTIONS[a].budget) { b.callBudget(); }
  for (let t = 0; t < WIN; t++) { tick(b, inputFor(b, a, t === 0)); if (b.phase !== "fight") break; }
}
function advanceCinematics(b, cap = 1200) { // run supers/grapples/ko to completion without input
  let n = 0;
  while (b.phase !== "fight" && b.phase !== "done" && b.phase !== "matchOver" && n < cap) {
    if (b.phase === "ko" || b.phase === "roundOver") break;
    tick(b, blankInput()); n++;
  }
}
const score = (b, hp0) => {
  const me = b.fighters[b.playerSide], op = b.fighters[1 - b.playerSide];
  let v = (hp0[1] - op.hp / op.maxHp * 100) - 1.25 * (hp0[0] - me.hp / me.maxHp * 100);
  if (op.hp <= 0) v += 60; if (me.hp <= 0) v -= 80;
  v += 0.04 * me.meter - 0.03 * op.meter;
  return v;
};
// tail policy: keep guard up, occasionally poke when close
function tail(b, t) {
  const me = b.fighters[b.playerSide], op = b.fighters[1 - b.playerSide], d = Math.abs(op.x - me.x);
  if (op.attack) return 2;
  if (d < 1.0 && t % 16 === 0) return 8;
  return d > 2.2 ? 1 : 2;
}

export function plan(b, { H = 40, samples = 4, rand = Math.random, cands = null } = {}) {
  const me = b.fighters[b.playerSide], op = b.fighters[1 - b.playerSide];
  const hp0 = [me.hp / me.maxHp * 100, op.hp / op.maxHp * 100];
  const seeds = Array.from({ length: samples }, () => (rand() * 4294967296) >>> 0);
  const list = (cands || [...Array(NA).keys()]).filter((a) => legal(b, a));
  const vals = new Float64Array(NA).fill(-1e9);
  for (const a of list) {
    let tot = 0;
    for (const sd of seeds) {
      const c = cloneBattle(b); c._rs.a = sd;
      act(c, a); advanceCinematics(c);
      for (let t = WIN; t < H && c.phase === "fight"; t += WIN) { act(c, tail(c, t)); advanceCinematics(c); }
      tot += score(c, hp0);
    }
    vals[a] = tot / samples;
  }
  let best = list[0]; for (const a of list) if (vals[a] > vals[best]) best = a;
  return { best, vals };
}
