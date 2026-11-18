# Sansad Showdown RL

A neural network that beats the secret **Hard final boss** of [Sansad Showdown](https://fightkaro.com), a browser fighting game, by pressing keys like a human player.

**Site with the full breakdown and both fight videos: https://arjunkshah12345-hash.github.io/sansad-showdown-rl/**

| | |
|---|---|
| Live win vs Hard final boss (Mbapu) | **2–1**, last round won with 98 HP left, 1,154 decisions, 2:49 of footage, with game audio |
| Live win vs Hard Rahul | **2–0**, 470 decisions, 1:19 of footage, with game audio |
| Final net vs Hard boss, simulator | **87 / 100** matches |
| Final net vs the other 9 Hard opponents, simulator | **97 / 100** matches |
| Search player it learned from, vs Hard boss | 4 / 5 (8 samples, 48-tick horizon) |
| Cost per decision | search 81 ms → net 0.2 ms (~400× cheaper) |

The net never reads anything the screen doesn't show and never writes to the game. It sees a 130-number summary of the fight, picks one of 17 moves, and that move becomes `keydown`/`keyup` events.

---

## How it works

```
 fightkaro.com bundle ──► build.py ──► headless Battle (Node, ~40k ticks/s)
                                             │
                                  clone + lookahead search  ── labels every decision
                                             │
                               41,758 (obs, action-values) pairs
                                             │
                          MLP 130→256→256→256→17  (imitation, r1)
                                             │
                    DAgger: net drives, search relabels  (+17,338 pairs)
                                             │
                                MLP retrained on 59,096 pairs (r2)
                                             │
                local copy of the real client ── keyboard events ──► recorded wins
```

### 1. A headless copy of the real game

The game is a single JS bundle. `agent/sim/build.py` cuts the bundle just before its DOM bootstrapping and exports the classes the fight runs on (`Battle`, `Fighter`, `Bot`, `Match`, the character table and the boss profile). `agent/sim/stubs.mjs` supplies just enough fake browser (`document`, `localStorage`, a 4×4 `@napi-rs/canvas`) for the bundle to load in Node. Rendering, rigs, audio and arena props are swapped for a recursive no-op `Proxy`.

So the simulator is **the shipping fight logic itself**, not a re-implementation. There is no separate physics model to drift out of sync with the real one.

Two changes make it usable for search:

- **Determinism.** Gameplay randomness is moved into a seeded generator stored *on the battle object* (`b._rs`), and visual effects keep using `Math.random`. Same seed + same inputs = same fight.
- **Cloning.** `agent/sim/clone.mjs` deep-copies every piece of logic state (fighters, timers, bot memory, RNG) and shares the read-only parts (character defs, rigs, context). One clone takes **~13 µs**.

The sim steps at a fixed 1/60 s and runs around **40,000 ticks per second** on one core, about 666× real time.

### 2. A search player to learn from

`agent/sim/planner.mjs` defines 17 actions relative to the opponent: `idle, fwd, block, lowblock, crouch, jump, jumpfwd, jumpback, punch, kick, fwdpunch, fwdkick, lowpunch, lowkick, grab, super, budget`. A decision covers 4 ticks (15 decisions a second). Directions are held for the window. Buttons are pressed only on its first tick, because the game reacts to key-down edges.

For each legal action the planner:

1. clones the battle and reseeds the clone's RNG (so the CPU opponent reacts differently in each sample),
2. plays the action, fast-forwards any super or grapple cinematic,
3. finishes a 48-tick horizon with a cheap scripted tail (guard up, poke when close),
4. scores the end state:

```
score = (opp HP lost) − 1.25 × (own HP lost) + 60·[opp KO] − 80·[own KO] + 0.04·own meter − 0.03·opp meter
```

and averages over 8 sampled futures. Losing health counts more than dealing it, so the player stays defensive and punishes rather than trades.

This is strong but slow: **~81 ms per decision**, 3½ to 11 minutes of compute per boss match in these runs (210–290 s with 4 samples, 370–640 s with 8). Against the Hard boss it won 3/5 with 4 samples and 40 ticks, and 4/5 with 8 samples and 48 ticks.

### 3. Distilling it into a small net

Every decision the search makes is logged as `(observation, value of every action, best action)`.

**Observation (130 numbers, `agent/sim/obs.mjs`).** Everything is mirrored so "forward" always means toward the opponent:

- distance;
- for each fighter: position, velocity, HP, meter, stun, crouch/grounded/blocking flags, combo count, facing, frames in current state, one-hots for 14 states and 14 attacks, attack phase (startup/active/recovery) and attack progress;
- round timer, round number, rounds won by each side, boss flag;
- the arena's "budget" power-up, bomb and mithai pickups;
- hit-stop, and the previous action.

The same file runs unchanged in Node and in the browser.

**Net (`agent/train.py`).** An MLP 130 → 256 → 256 → 256 → 17 with ReLU, about 169k parameters, inputs standardised. The loss mixes two targets:

- a **soft target**: softmax of the planner's action values / τ (τ = 2), over legal actions only. It teaches *how much* worse each alternative is, not just which one won;
- a **hard target**: cross-entropy on the planner's top pick, weight 0.5.

The training is AdamW at 1e-3, cosine schedule, 30 epochs, batch 512, on Apple MPS. The weights are exported to JSON and run by a 15-line forward pass in plain JS (`net.mjs`).

### 4. DAgger: fixing the states the expert never visits

Pure imitation (**r1**, 41,758 samples) matched the planner's pick 94.3% of the time, but it won only **62/100** against the boss. The search player never wanders into the positions the student's small mistakes lead to, so the student has no idea how to get out of them.

DAgger fixes that. In round 1, seven workers played 50/50 mixes of net and search moves (60% of matches against the boss). The *net* often chose the move, but the *search* labelled every state anyway. The 17,338 new labels were added and the net retrained (**r2**, 59,096 samples):

| | samples | top-1 agreement | regret* | vs Hard boss | vs 9 other Hard opponents |
|---|---|---|---|---|---|
| r1 (imitation) | 41,758 | 94.3% | 0.32 | 62 / 100 | 97 / 100 |
| r2 (+1 DAgger round) | 59,096 | 94.9% | 0.28 | **87 / 100** | **97 / 100** |

\* regret = planner value of the best action minus the planner value of the net's pick, averaged over held-out states.

Agreement barely moved. Boss wins jumped 25 points because the new data covers exactly the states where the net used to fall apart. Against the boss, r2's straight 2–0 wins went from 40 to 45 and its losses from 38 to 13.

### 5. Playing the real game

The game exposes a read-only `window.__game` hook for its developer, but only on `localhost`. `agent/mirror.py` downloads the published client's own files for a local copy, served with `python3 -m http.server`. The game code is left unmodified.

`agent/live-agent/agent.mjs` is injected into that page. Each `requestAnimationFrame` it:

1. reads `window.__game.battle`,
2. waits for the next 4-tick slot (using the game's own clock, so it stays in sync even if frames drop),
3. builds the same 130-number observation, runs the net, masks illegal moves (super needs full meter, budget needs the pickup),
4. turns the action into held `KeyA/KeyD/KeyW/KeyS` and tapped `KeyJ` (punch), `KeyK` (kick), `KeyI` (grab), `KeyL` (super), `KeyB` (budget).

`agent/live.mjs` drives Chrome through Playwright, starts a Hard match, records the tab through the DevTools screencast, and encodes the frames to H.264 using each frame's real timestamp.

`agent/live_audio.mjs` does the same with the game's sound. Before the page loads, it hooks `AudioNode.connect`, so anything wired to the speakers is also routed into a `MediaStreamDestination`. A `MediaRecorder` captures that stream as Opus and streams it back to Node. The audio is then lined up with the video using the wall-clock start time of each. The fights on the site were recorded this way.

### What the net actually does

Over 10 simulated boss matches (11,685 decisions), **93.6% of its choices are `idle`**. They split two ways:

- **41% land while it's locked into something**: its own attack animation (2,963), knocked down or getting up (1,021), mid-jump (254), or in hit or block stun (247). Nothing it presses there would matter.
- **59% are a real choice.** In neutral, free to act, it stands still **95% of the time** (6,449 of 6,768 neutral decisions).

So it plays a counter-puncher: it waits for the boss to commit, then answers with `punch`, `fwdkick`, `kick` and `grab`, and spends `super` when the meter is full. The search player's scoring (own HP counted 1.25× opponent HP) pushes it there, and the net inherited the style.

---

## Repository

```
agent/
  sim/build.py        cut the game bundle into an importable module (needs your own copy)
  sim/stubs.mjs       fake browser globals for Node
  sim/env.mjs         make a seeded headless Battle, tick it
  sim/clone.mjs       deep clone of logic state
  sim/planner.mjs     17 actions + lookahead search
  sim/obs.mjs         130-d observation (shared with the browser)
  sim/gen.mjs         self-play data generation (search or DAgger mix)
  sim/evalnet.mjs     pure-net evaluation
  train.py            soft+hard imitation, exports JSON weights
  dagger.sh           one DAgger round
  live-agent/         the in-browser keyboard agent
  live.mjs            live run + screen recording
  live_audio.mjs      same, with the game's audio captured and muxed in
  policy/             trained weights (r1 imitation, r2 DAgger)
results/              eval, training, search and live logs behind every number above
site/                 the write-up site (Vite + React)
```

**Not included:** the game's code, art, models and audio. `agent/sim/game.mjs`, `three.mjs` and `rooms.mjs` are generated locally by `build.py` from your own download of the client and are git-ignored.

### Reproduce

```bash
cd agent && npm i
python3 mirror.py                     # local copy of the client into ./mirror (expects site_raw/ with the entry bundle)
python3 sim/build.py                  # -> sim/game.mjs
node sim/play.mjs modi mbapu hard 1 48 8                   # one search-player match
node sim/gen.mjs data/r0/w0.jsonl 1000 50                  # imitation data
python3 train.py policy/r1.json data/r0/*.jsonl
./dagger.sh 1 0.5 30                                       # one DAgger round
node sim/evalnet.mjs policy/dagger_r2.json 90000 100 mbapu # evaluate
cp policy/dagger_r2.json mirror/agent/policy.json && cp live-agent/*.mjs mirror/agent/
(cd mirror && python3 -m http.server 8790 --bind 127.0.0.1) &
node live_audio.mjs recordings 4 mbapu                     # retries up to 4 times until a win
```

## Caveats

- One live win against the boss is one sample. Live results so far: the first silent recording session won its single boss attempt. The audio session took three attempts. The first loss (1–2) never produced a video because the disk filled up mid-write. The second attempt also lost 1–2 (logged in `results/live/boss.json`), and the third won 2–1. That makes 2 wins in 4 live boss matches, well under the simulator's 87%. The 87/100 rate comes from the simulator, which runs the same fight code but no renderer, so frame timing in the browser can differ slightly.
- The final rate is against the bot's Hard setting. Humans don't play like the bot, and the net has never faced one.
- Only one character (Mitraman) was trained.
- The live run uses the developer's localhost hook to *read* state. The net still sends nothing but keyboard input.

## Credits

Sansad Showdown is made by its own authors at fightkaro.com, and all characters, art and code belong to them. It's a satire game, and this project is only about the AI.

The site is built with [dithercn](https://dithercn.dev), [asciicn](https://asciicn.sumak.dev), [gradients.sh](https://gradients.sh) (free components) and [ditherkit](https://github.com/jvgomg/ditherkit) (vendored from source, as it isn't on npm yet).
