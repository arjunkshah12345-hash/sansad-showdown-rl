// Every number on the site comes from the logs in /results.
export const REPO = "https://github.com/arjunkshah12345-hash/sansad-showdown-rl"
export const media = (p: string) => `${import.meta.env.BASE_URL}media/${p}`

export const headline = {
  bossSim: 87, // results/eval/big_r2_boss.log
  mixSim: 97, // results/eval/big_r2_mix.log
  liveBoss: "2–1", // results/live/boss.json
  speedup: 400, // 81 ms search vs 0.2 ms net per decision
}

export const training = [
  { epoch: 5, r1Top1: 93.7, r2Top1: 94.2, r1Regret: 0.42, r2Regret: 0.38 },
  { epoch: 10, r1Top1: 94.2, r2Top1: 94.7, r1Regret: 0.32, r2Regret: 0.32 },
  { epoch: 15, r1Top1: 94.1, r2Top1: 94.9, r1Regret: 0.33, r2Regret: 0.28 },
  { epoch: 20, r1Top1: 94.3, r2Top1: 95.0, r1Regret: 0.31, r2Regret: 0.27 },
  { epoch: 25, r1Top1: 94.3, r2Top1: 94.8, r1Regret: 0.31, r2Regret: 0.28 },
  { epoch: 30, r1Top1: 94.3, r2Top1: 94.9, r1Regret: 0.32, r2Regret: 0.28 },
]

export const winRates = [
  { policy: "Search · 4 samples, 40 ticks", boss: 60, n: "3 / 5" },
  { policy: "Search · 8 samples, 48 ticks", boss: 80, n: "4 / 5" },
  { policy: "Net r1 · imitation", boss: 62, n: "62 / 100" },
  { policy: "Net r2 · + DAgger", boss: 87, n: "87 / 100" },
]

export const dagger = [
  { label: "r1 imitation", boss: 62, mix: 97 },
  { label: "r2 + DAgger", boss: 87, mix: 97 },
]

// rounds won-lost against the Hard boss over 100 matches each
export const roundOutcomes = {
  labels: ["2–0", "2–1", "1–2", "0–2"],
  r1: [40, 22, 22, 16],
  r2: [45, 42, 7, 6],
}

// r2 vs the nine regular Hard opponents (ids from the game's character table)
export const perOpponent = [
  { id: "didi", won: 12, of: 12 },
  { id: "yogi", won: 11, of: 11 },
  { id: "nitin", won: 11, of: 11 },
  { id: "lalu", won: 11, of: 11 },
  { id: "amit", won: 11, of: 11 },
  { id: "dhruv", won: 11, of: 11 },
  { id: "rahul", won: 11, of: 11 },
  { id: "trump", won: 10, of: 11 },
  { id: "ravi", won: 9, of: 11 },
]

export const obsGroups = [
  { label: "Self", value: 49 },
  { label: "Rival", value: 49 },
  { label: "Last move", value: 17 },
  { label: "Items", value: 9 },
  { label: "Round", value: 4 },
  { label: "Gap", value: 2 },
]

// results/analysis/idle_by_state.json
export const idleByState = [
  { state: "neutral", idle: 6449, total: 6768 },
  { state: "own attack", idle: 2963, total: 3249 },
  { state: "knocked down", idle: 758, total: 758 },
  { state: "getting up", idle: 263, total: 282 },
  { state: "mid-jump", idle: 254, total: 254 },
  { state: "hit stun", idle: 146, total: 154 },
  { state: "block stun", idle: 101, total: 142 },
  { state: "walking", idle: 2, total: 78 },
]

// non-idle decisions over 100 boss matches (results/eval/big_r2_boss.log, top-6 per match)
export const actionMix = [
  { label: "punch", value: 1870 },
  { label: "fwdkick", value: 1856 },
  { label: "kick", value: 1560 },
  { label: "block", value: 1273 },
  { label: "grab", value: 545 },
  { label: "jumpback", value: 181 },
  { label: "super", value: 54 },
  { label: "lowpunch", value: 42 },
]

export const ACTIONS = [
  ["idle", "—"], ["fwd", "→"], ["block", "←"], ["lowblock", "↙"], ["crouch", "↓"], ["jump", "↑"],
  ["jumpfwd", "↗"], ["jumpback", "↖"], ["punch", "J"], ["kick", "K"], ["fwdpunch", "→J"], ["fwdkick", "→K"],
  ["lowpunch", "↓J"], ["lowkick", "↓K"], ["grab", "I"], ["super", "L"], ["budget", "B"],
] as const

export const live = [
  { opp: "Mbapu · final boss", diff: "Hard", score: "2–1", hp: 90, decisions: 1180, length: "2:58", file: "02_modi_vs_mbapu_hard_WIN.mp4", poster: "boss_60.jpg" },
  { opp: "Rahul", diff: "Hard", score: "2–0", hp: 74, decisions: 600, length: "1:34", file: "01_modi_vs_rahul_hard_WIN.mp4", poster: "rahul_10.jpg" },
]

export const stills = [
  { src: "boss_20.jpg", caption: "Round 1 · the boss knocked down" },
  { src: "boss_140.jpg", caption: "Jumping kick into the boss" },
  { src: "boss_100.jpg", caption: "The boss's taunt cinematic, mid-fight" },
  { src: "boss_172.jpg", caption: "Match over · Mitraman wins 2–1" },
]
