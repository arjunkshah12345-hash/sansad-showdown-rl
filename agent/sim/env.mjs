// Headless Sansad Showdown battle: the site's own Battle class with presentation stubbed out.
import { deep } from "./stubs.mjs";
globalThis.__HEADLESS_RIG = () => deep();
const G = await import("./game.mjs");
export { G };
export function mulberry(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export const blankInput = () => ({ moveX: 0, up: false, down: false, punch: false, kick: false, grab: false, super: false });

export function makeBattle({ player = "modi", opponent = "rahul", difficulty = "hard", seed = 1, finale = false } = {}) {
  Math.random = mulberry(seed);
  const input = { cur: blankInput(), poll() { return this.cur; }, clearEdges() {} };
  const audio = new Proxy({ clipTime: () => null }, { get: (t, k) => (k in t ? t[k] : () => undefined) });
  const arena = new Proxy({ stage: "sansad" }, { get: (t, k) => (k in t ? t[k] : (t[k] = deep())) });
  const ctx = new Proxy({ input, audio, arena, faceTextures: {}, portraits: {}, toScreen: () => ({ x: 0, y: 0 }) }, { get: (t, k) => (k in t ? t[k] : (t[k] = deep())) });
  const b = new G.Battle(ctx, { player, opponent, difficulty, bossEntrance: finale, rng: () => Math.random() });
  b._input = input;
  // gameplay RNG lives in battle state (cloneable); visuals keep using Math.random
  b._rs = { a: (seed * 2654435761) >>> 0 };
  b.rng = gameRng; b.bot.rng = gameRng;
  return b;
}
// advance one fixed 1/60 tick of game logic (update(dt) also drives phases)
export function rsNext(r) { r.a = (r.a + 0x6d2b79f5) >>> 0; let t = r.a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
function gameRng() { return rsNext(globalThis.__CUR._rs); }
export function tick(b, inp) { if (inp) b._input.cur = inp; globalThis.__CUR = b; b.update(G.DT); }
