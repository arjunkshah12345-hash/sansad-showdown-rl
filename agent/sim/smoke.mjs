import { makeBattle, tick, blankInput } from "./env.mjs";
const b = makeBattle({ player: "modi", opponent: "rahul", difficulty: "hard", seed: 7 });
let t = 0; const [p, o] = b.fighters;
let lastPhase = "";
for (; t < 60 * 400; t++) {
  const i = blankInput(); i.moveX = Math.random() < 0.5 ? 1 : -1; i.punch = Math.random() < 0.1; i.kick = Math.random() < 0.05;
  tick(b, i);
  if (b.phase !== lastPhase) { console.log(t, b.phase, "hp", p.hp.toFixed(1), o.hp.toFixed(1), "wins", b.match.wins, "round", b.match.round, "timer", b.match.timer.toFixed(1)); lastPhase = b.phase; }
  if (b.phase === "done") break;
}
console.log("player keys", Object.keys(p).join(" ").slice(0, 1500));
