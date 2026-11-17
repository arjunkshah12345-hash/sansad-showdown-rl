// DAgger data generation. Every decision is labelled by the lookahead planner (values for all
// actions); the acting policy is the planner (beta) or the current net (1 - beta).
// Usage: node gen.mjs OUT.jsonl SEED0 COUNT [NET.json|none] [beta=1] [bossShare=0.5]
import fs from "node:fs";
import { makeBattle, tick, blankInput, mulberry } from "./env.mjs";
import { plan, act, legal, NA } from "./planner.mjs";
import { obs } from "./obs.mjs";
import { loadNet, netAct } from "./net.mjs";

const [out, s0 = "1", count = "4", netPath = "none", betaS = "1", bossS = "0.5"] = process.argv.slice(2);
const OPP = ["rahul", "didi", "trump", "yogi", "nitin", "ravi", "lalu", "amit", "dhruv"];
const net = netPath !== "none" ? loadNet(netPath) : null, beta = +betaS;
const fd = fs.openSync(out, "a");
for (let k = 0; k < +count; k++) {
  const seed = +s0 + k, r = mulberry(seed * 31 + 7);
  const opponent = r() < +bossS ? "mbapu" : OPP[Math.floor(r() * OPP.length)];
  const b = makeBattle({ player: "modi", opponent, difficulty: "hard", seed });
  let last = -1, n = 0, netUsed = 0, guard = 0; const rows = [];
  while (b.phase !== "done" && guard++ < 60 * 60 * 10) {
    if (b.phase === "fight" && b.hitStop <= 0) {
      const o = obs(b, last);
      const { best, vals } = plan(b, { H: 48, samples: 8, rand: r });
      let a = best;
      if (net && r() >= beta) { a = netAct(net, o, (i) => legal(b, i)); netUsed++; }
      rows.push(JSON.stringify({ o: o.map((v) => Math.round(v * 1000) / 1000), v: Array.from(vals, (x) => (x < -1e8 ? null : Math.round(x * 100) / 100)), y: best }));
      act(b, a); last = a; n++;
    } else tick(b, blankInput());
  }
  fs.writeSync(fd, rows.join("\n") + "\n");
  const won = b.match.winner === b.playerSide;
  console.log(JSON.stringify({ seed, opponent, wins: b.match.wins, won, decisions: n, netShare: n ? +(netUsed / n).toFixed(2) : 0 }));
}
