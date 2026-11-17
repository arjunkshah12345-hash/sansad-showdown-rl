// Pure neural-net play (no search). Usage: node evalnet.mjs NET.json SEED0 COUNT OPP|mix
import { playMatch } from "./play.mjs";
import { loadNet, netAct } from "./net.mjs";
import { obs } from "./obs.mjs";
import { legal } from "./planner.mjs";
const [netPath, s0 = "5000", count = "4", oppArg = "mbapu"] = process.argv.slice(2);
const W = loadNet(netPath), OPP = ["rahul", "didi", "trump", "yogi", "nitin", "ravi", "lalu", "amit", "dhruv"];
for (let k = 0; k < +count; k++) {
  const seed = +s0 + k; let last = -1;
  const policy = (b) => { const a = netAct(W, obs(b, last), (i) => legal(b, i)); last = a; return a; };
  const opponent = oppArg === "mix" ? OPP[seed % OPP.length] : oppArg;
  console.log(JSON.stringify(playMatch({ player: "modi", opponent, difficulty: "hard", seed, policy })));
}
