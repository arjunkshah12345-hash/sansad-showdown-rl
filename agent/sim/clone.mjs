// Deep-clone a Battle (logic state only); presentation objects are shared.
const SHARE = new Set(["ctx", "rigs", "chaiwala", "diwali", "entrance", "superMove", "grapple", "hostDelay", "remoteInput", "ownMoves", "net", "onMatchEnd", "onMatchDecided", "_input", "char", "def", "profile"]);
function cl(v, memo) {
  if (v === null || typeof v !== "object") return v;
  let c = memo.get(v); if (c) return c;
  if (ArrayBuffer.isView(v)) { c = v.slice(); memo.set(v, c); return c; }
  if (Array.isArray(v)) { c = new Array(v.length); memo.set(v, c); for (let i = 0; i < v.length; i++) c[i] = cl(v[i], memo); return c; }
  if (v instanceof Map) { c = new Map(); memo.set(v, c); for (const [k, x] of v) c.set(k, cl(x, memo)); return c; }
  if (v instanceof Set) { c = new Set(); memo.set(v, c); for (const x of v) c.add(cl(x, memo)); return c; }
  c = Object.create(Object.getPrototypeOf(v)); memo.set(v, c);
  for (const k of Object.keys(v)) c[k] = SHARE.has(k) ? v[k] : cl(v[k], memo);
  return c;
}
export function cloneBattle(b) {
  const memo = new Map();
  const c = cl(b, memo);
  c._input = { cur: b._input.cur, poll() { return this.cur; }, clearEdges() {} };
  // ctx.input must point at the clone's own input
  c.ctx = new Proxy(b.ctx, { get: (t, k) => (k === "input" ? c._input : t[k]) });
  return c;
}
