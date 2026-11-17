// Where does the net choose idle? Counts decisions by the fighter's own state over 10 boss matches.
import { makeBattle, tick, blankInput } from "./env.mjs";
import { act, legal } from "./planner.mjs";
import { obs } from "./obs.mjs";
import { loadNet, netAct } from "./net.mjs";
const W = loadNet(new URL("../policy/dagger_r2.json", import.meta.url).pathname);
const st = {}, all = {}; let idle = 0, n = 0;
for (let s = 0; s < 10; s++) {
  const b = makeBattle({ player: "modi", opponent: "mbapu", difficulty: "hard", seed: 90000 + s }); let last = -1, g = 0;
  while (b.phase !== "done" && g++ < 300000) {
    if (b.phase === "fight" && b.hitStop <= 0) {
      const a = netAct(W, obs(b, last), (i) => legal(b, i)); const me = b.fighters[b.playerSide];
      const key = me.attack ? "attack" : me.state; all[key] = (all[key] || 0) + 1; n++;
      if (a === 0) { idle++; st[key] = (st[key] || 0) + 1; }
      act(b, a); last = a;
    } else tick(b, blankInput());
  }
}
console.log("decisions", n, "idle", idle, (idle / n).toFixed(3));
console.log("idle by own state", JSON.stringify(Object.entries(st).sort((a, b) => b[1] - a[1])));
console.log("all by own state", JSON.stringify(Object.entries(all).sort((a, b) => b[1] - a[1])));
