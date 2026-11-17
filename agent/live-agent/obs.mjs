// Observation vector for the policy net. Pure function of the live Battle object, so the
// same code runs in the headless sim and in the real browser client (window.__game.battle).
export const STATES = ["intro", "idle", "walk", "crouch", "attack", "knockdown", "getup", "blockstun", "hitstun", "jump", "frozen", "super", "ko", "victory"];
export const ATTACKS = ["kick", "sweep", "jab", "roundhouse", "grab", "special2", "special1", "lowJab", "cross", "uppercut", "finisher", "airPunch", "landing", "airKick"];
export const PHASES = ["startup", "active", "recovery"];
export const NACT = 17;

function fighter(out, f, dir, ref) {
  out.push((f.x * dir) / 6.5, ((f.x - ref) * dir) / 6.5, f.y / 3, (f.vx * dir) / 8, f.vy / 8);
  out.push(f.hp / f.maxHp, (f.meter || 0) / 100, Math.min(1, (f.stun || 0) / 40), f.crouching ? 1 : 0, f.grounded ? 1 : 0,
    f.holdingBack ? 1 : 0, f.airAttackUsed ? 1 : 0, Math.min(1, (f.comboHits || 0) / 5), f.facing * dir, Math.min(1, (f.stateFrames || 0) / 60));
  for (const s of STATES) out.push(f.state === s ? 1 : 0);
  const a = f.attack, id = a ? a.def.id : null;
  for (const s of ATTACKS) out.push(id === s ? 1 : 0);
  out.push(a ? 0 : 1);
  for (const p of PHASES) out.push(a && f.attackPhase === p ? 1 : 0);
  out.push(a ? Math.min(1, (a.frame || 0) / 40) : 0);
  out.push(a && a.def.grab ? 1 : 0);
}

export function obs(b, lastAction = -1) {
  const side = b.playerSide, me = b.fighters[side], op = b.fighters[1 - side];
  const dir = op.x >= me.x ? 1 : -1, out = [];
  out.push(Math.abs(op.x - me.x) / 6.5);
  fighter(out, me, dir, me.x);
  fighter(out, op, dir, me.x);
  const m = b.match;
  out.push((m.timer || 0) / 60, (m.round || 1) / 3, (m.wins?.[side] || 0) / 2, (m.wins?.[1 - side] || 0) / 2);
  out.push(op.boss ? 1 : 0, b.budgetUsed ? 0 : Math.min(1, b.budget || 0), b.budgetReady ? 1 : 0);
  const bo = b.bomb;
  out.push(bo ? 1 : 0, bo ? ((bo.posX - me.x) * dir) / 6.5 : 0, bo ? Math.min(1, Math.max(0, bo.fuseLeft || 0) / 5) : 0);
  const mi = b.mithai;
  out.push(mi ? 1 : 0, mi ? ((mi.x - me.x) * dir) / 6.5 : 0, mi && mi.ready ? 1 : 0);
  out.push(b.hitStop > 0 ? 1 : 0);
  for (let i = 0; i < NACT; i++) out.push(i === lastAction ? 1 : 0);
  return out;
}
