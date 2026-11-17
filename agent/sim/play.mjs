// Play full matches with the planner. Usage: node play.mjs PLAYER OPP DIFF SEED [H] [samples]
import { makeBattle, tick, blankInput, mulberry } from "./env.mjs";
import { plan, act, ACTIONS } from "./planner.mjs";
export function playMatch({ player, opponent, difficulty, seed, H = 40, samples = 4, policy = null, log = null }) {
  const b = makeBattle({ player, opponent, difficulty, seed });
  const rand = mulberry(seed * 7 + 1); let decisions = 0; const t0 = performance.now(); const counts = new Array(ACTIONS.length).fill(0);
  let guard = 0;
  while (b.phase !== "done" && guard++ < 60 * 60 * 8) {
    if (b.phase === "fight" && b.hitStop <= 0) {
      const a = policy ? policy(b) : plan(b, { H, samples, rand }).best;
      if (log) log(b, a);
      counts[a]++; decisions++; act(b, a);
    } else tick(b, blankInput());
  }
  const me = b.fighters[b.playerSide], op = b.fighters[1 - b.playerSide];
  return { player, opponent, difficulty, seed, wins: b.match.wins, won: b.match.winner === b.playerSide, decisions, sec: +((performance.now() - t0) / 1000).toFixed(1),
    top: counts.map((c, i) => [ACTIONS[i].n, c]).filter((x) => x[1]).sort((a, b) => b[1] - a[1]).slice(0, 6).map((x) => x.join(":")).join(" ") };
}
if (process.argv[1].endsWith("play.mjs")) {
  const [player = "modi", opponent = "rahul", difficulty = "hard", seed = "1", H = "40", S = "4"] = process.argv.slice(2);
  console.log(JSON.stringify(playMatch({ player, opponent, difficulty, seed: +seed, H: +H, samples: +S })));
}
