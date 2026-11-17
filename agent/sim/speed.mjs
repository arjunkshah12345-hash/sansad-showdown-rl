import { makeBattle, tick, blankInput } from "./env.mjs";
let t0 = performance.now(), ticks = 0, res = [];
for (let s = 1; s <= 10; s++) {
  const b = makeBattle({ player: "modi", opponent: ["rahul","didi","trump","yogi","amit"][s % 5], difficulty: "hard", seed: s });
  for (let t = 0; t < 60 * 400 && b.phase !== "done"; t++) { const i = blankInput(); i.moveX = Math.random() < 0.6 ? 1 : -1; i.punch = Math.random() < 0.1; i.kick = Math.random() < 0.05; tick(b, i); ticks++; }
  res.push(b.match.wins.join("-"));
}
console.log(res.join(" "), (ticks / ((performance.now() - t0) / 1000)).toFixed(0), "ticks/s");
const b = makeBattle({ seed: 3 }); for (let t = 0; t < 400; t++) tick(b, blankInput());
const f = b.fighters[1]; console.log(JSON.stringify({ x: f.x, y: f.y, state: f.state, meter: f.meter, attack: f.attack && { id: f.attack.def.id, frame: f.attack.frame, phase: f.attackPhase } }));
console.log(Object.keys(b.fighters[0].char).join(" "));
console.log(JSON.stringify(Object.keys(b.fighters[0].char.moves || {})));
