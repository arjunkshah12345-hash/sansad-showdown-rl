import { useState } from "react"
import { DitheredImage, type DitherAlgorithm } from "@ditherkit/react"
import { Fire } from "@/components/dithercn/fire"
import { DitherNumber } from "@/components/dithercn/dither-number"
import { StatCard } from "@/components/dithercn/stat-card"
import { BarChart } from "@/components/dithercn/bar-chart"
import { LineChart } from "@/components/dithercn/line-chart"
import { DonutChart } from "@/components/dithercn/donut-chart"
import { AsciiText } from "@/components/ascii/ascii-text"
import { AsciiBox } from "@/components/ascii/ascii-box"
import { AsciiProgress } from "@/components/ascii/ascii-progress"
import { AsciiColumnChart } from "@/components/ascii/ascii-column-chart"
import { AsciiImageCompare } from "@/components/ascii/ascii-image-compare"
import { AsciiVideo } from "@/components/ascii/ascii-video"
import { AsciiSpinner } from "@/components/ascii/ascii-spinner"
import { GradientText } from "@/components/gradient-text"
import { GradientBorder } from "@/components/gradient-border"
import { GradientButton } from "@/components/gradient-button"
import { GrainGradient } from "@/components/grain-gradient"
import { Card, Code, Label, Prose, Scramble, Section } from "@/ui"
import {
  ACTIONS, REPO, actionMix, dagger, headline, idleByState, live, media, obsGroups, perOpponent, roundOutcomes, stills, training, winRates,
} from "@/data"

const FIRE = ["#0b0806", "#5a1406", "#c2410c", "#ff9933", "#ffc24b", "#fff1c9"] as const
const WARM: [string, string, ...string[]] = ["#ff9933", "#ffc24b", "#ff5fa2", "#c2410c"]

const TOC = [
  ["proof", "00", "The proof"],
  ["sim", "01", "A headless copy of the game"],
  ["search", "02", "A search player to learn from"],
  ["distill", "03", "Distilling it into a small net"],
  ["dagger", "04", "DAgger"],
  ["live", "05", "Playing the real game"],
  ["style", "06", "How it fights"],
  ["limits", "07", "Caveats"],
] as const

export default function App() {
  return (
    <div className="relative min-h-screen overflow-x-clip">
      <Nav />
      <Hero />
      <Proof />
      <Sim />
      <Search />
      <Distill />
      <Dagger />
      <Live />
      <Style />
      <Limits />
      <Footer />
    </div>
  )
}

function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line/60 bg-night/70 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 md:px-8">
        <a href="#top" className="font-mono text-[13px] tracking-[0.14em] text-[#fff4e8]">
          SANSAD<span className="text-saffron">/</span>RL
        </a>
        <nav className="hidden items-center gap-6 font-mono text-[12px] text-dim md:flex">
          {TOC.slice(1, 7).map(([id, n]) => (
            <a key={id} href={`#${id}`} className="transition hover:text-saffron">{n}</a>
          ))}
        </nav>
        <a href={REPO} className="font-mono text-[12px] text-[#fff4e8] transition hover:text-saffron">[ github ↗ ]</a>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section id="top" className="grain relative flex min-h-[100svh] flex-col justify-center overflow-hidden pt-24 pb-40">
      <Fire className="absolute inset-0" palette={FIRE} height={0.42} embers={2} wind={0.1} intensity={0.85} cell={4} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(11,8,6,.2),rgba(11,8,6,.92)_70%)]" />
      <div className="relative mx-auto w-full max-w-6xl px-5 md:px-8">
        <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-line bg-night/70 px-4 py-1.5 font-mono text-[12px] text-dim">
          <AsciiSpinner variant="grow" label="live" className="text-leaf" />
          <span><Scramble text="HARD · FINAL BOSS · DEFEATED LIVE" /></span>
        </div>
        <AsciiText text="BOSS DOWN" fontSize={9} charset="blocks" className="hidden h-[min(26vw,230px)] w-full text-saffron md:block" />
        <AsciiText text="BOSS DOWN" fontSize={4} charset="blocks" className="block h-[24vw] w-full text-saffron md:hidden" />
        <h1 className="mt-8 max-w-4xl text-4xl leading-[1.04] font-medium tracking-[-0.04em] text-[#fff4e8] md:text-6xl">
          A <GradientText kind="mesh" colors={WARM} background="#ff9933">169k-parameter net</GradientText> learned to beat the secret final boss by pressing keys.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#cbbcae]">
          Sansad Showdown is a 3D browser fighting game. Its Hard final boss turned out to be beatable by a small MLP. It was trained to copy a slow lookahead search, then corrected with DAgger. Here's how it was built, with both live wins on tape.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <GradientButton kind="mesh" colors={WARM} background="#c2410c" className="text-night font-medium" size="lg" onClick={() => document.getElementById("proof")?.scrollIntoView({ behavior: "smooth" })}>
            Watch the boss fight ↓
          </GradientButton>
          <a href={REPO} className="font-mono text-sm text-[#fff4e8] underline decoration-saffron/50 underline-offset-4 hover:decoration-saffron">read the code</a>
        </div>
        <div className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-4">
          <HeroStat value={headline.bossSim} suffix="/100" label="wins vs Hard boss, simulator" />
          <HeroStat value={headline.mixSim} suffix="/100" label="wins vs 9 other Hard opponents" />
          <div className="bg-night/90 p-5">
            <div className="text-4xl font-semibold tracking-[-0.04em] text-[#fff4e8]">2<span className="text-saffron">–</span>1</div>
            <div className="mt-2 font-mono text-[11px] tracking-wider text-dim uppercase">live vs the boss, recorded</div>
          </div>
          <HeroStat value={headline.speedup} suffix="×" label="cheaper per decision than search" />
        </div>
      </div>
    </section>
  )
}

function HeroStat({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  return (
    <div className="bg-night/90 p-5">
      <DitherNumber value={value} suffix={suffix} size="md" trigger="in-view" color="#fff4e8" accent="orange" affixClassName="text-saffron text-2xl" />
      <div className="mt-2 font-mono text-[11px] tracking-wider text-dim uppercase">{label}</div>
    </div>
  )
}

function Proof() {
  const [ascii, setAscii] = useState(false)
  const boss = live[0], rahul = live[1]
  return (
    <Section id="proof" n="00" kicker="the proof" title={<>Two Hard matches, played by the net, recorded in the real client.</>}>
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <GradientBorder kind="linear-flow" colors={WARM} background="#c2410c" borderWidth={2} radius={18}>
            <div className="overflow-hidden rounded-[16px] bg-black">
              {ascii ? (
                <AsciiVideo src={media(boss.file)} charset="detailed" fontSize={7} color="source" className="aspect-video w-full" />
              ) : (
                <video src={media(boss.file)} poster={media(boss.poster)} controls playsInline preload="metadata" className="aspect-video w-full" />
              )}
            </div>
          </GradientBorder>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-lg text-[#fff4e8]">vs {boss.opp} · {boss.diff}</div>
              <div className="font-mono text-[12px] text-dim">won {boss.score} · {boss.decisions.toLocaleString()} decisions · {boss.length}</div>
            </div>
            <button onClick={() => setAscii((v) => !v)} className="rounded-full border border-line px-4 py-2 font-mono text-[12px] text-[#fff4e8] transition hover:border-saffron hover:text-saffron">
              {ascii ? "[ back to video ]" : "[ replay it in ASCII ]"}
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-6">
          <div className="overflow-hidden rounded-2xl border border-line bg-black">
            <video src={media(rahul.file)} poster={media(rahul.poster)} controls playsInline preload="metadata" className="aspect-video w-full" />
          </div>
          <div>
            <div className="text-lg text-[#fff4e8]">vs {rahul.opp} · {rahul.diff}</div>
            <div className="font-mono text-[12px] text-dim">won {rahul.score} · {rahul.decisions} decisions · {rahul.length}</div>
          </div>
          <AsciiBox variant="round" title="final health" className="font-mono text-[12px] text-[#cbbcae]">
            <div className="space-y-2 p-1">
              <AsciiProgress value={boss.hp} label="vs boss" width={22} variant="blocks" className="text-saffron" />
              <AsciiProgress value={rahul.hp} label="vs rahul" width={22} variant="blocks" className="text-leaf" />
            </div>
          </AsciiBox>
          <p className="text-sm leading-relaxed text-dim">
            Nothing was edited. Each file is the browser tab's DevTools screencast, encoded with each frame's real timestamp. The net's only output is keyboard events.
          </p>
        </div>
      </div>
      <TOCBox />
    </Section>
  )
}

function TOCBox() {
  return (
    <AsciiBox variant="double" title="contents" className="mt-20 font-mono text-[13px]">
      <ol className="grid gap-x-10 gap-y-2 p-2 md:grid-cols-2">
        {TOC.slice(1).map(([id, n, t]) => (
          <li key={id}>
            <a href={`#${id}`} className="group flex gap-3 text-[#cbbcae] hover:text-saffron">
              <span className="text-saffron">{n}</span>
              <span className="flex-1 border-b border-dotted border-line group-hover:border-saffron">{t}</span>
            </a>
          </li>
        ))}
      </ol>
    </AsciiBox>
  )
}

function Sim() {
  return (
    <Section id="sim" n="01" kicker="simulator" title={<>The simulator <em className="text-saffron not-italic">is</em> the game, with the renderer stubbed out.</>}>
      <div className="grid gap-12 lg:grid-cols-2">
        <Prose>
          <p>The game ships as one JavaScript bundle. A short script cuts it just before the DOM bootstrapping and exports the classes the fight runs on: <code>Battle</code>, <code>Fighter</code>, <code>Bot</code>, <code>Match</code>, the character table and the boss profile.</p>
          <p>Node gets just enough fake browser to load it: a stub <code>document</code>, an in-memory <code>localStorage</code> and a 4×4 canvas. Rigs, audio and arena props become a recursive no-op <code>Proxy</code>. <strong>No physics was rewritten.</strong> The hitboxes, frame data and CPU behaviour are the shipping ones.</p>
          <p>Two changes make search possible. Gameplay randomness moves onto the battle object as a seeded generator, so a fight replays exactly from its seed. A deep clone copies all logic state and shares the read-only parts.</p>
        </Prose>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="ticks per second, one core" value="40k" color="orange" />
            <StatCard label="real time" value="666×" color="green" />
            <StatCard label="clone a battle" value="13 µs" good="down" color="pink" />
            <StatCard label="fixed tick" value="1/60 s" color="blue" />
          </div>
          <Code title="agent/sim/env.mjs">{`// gameplay RNG lives in battle state (cloneable)
b._rs = { a: (seed * 2654435761) >>> 0 };
b.rng = gameRng; b.bot.rng = gameRng;

export function tick(b, inp) {
  if (inp) b._input.cur = inp;
  b.update(G.DT); // the game's own update, 1/60 s
}`}</Code>
        </div>
      </div>
    </Section>
  )
}

function Search() {
  return (
    <Section id="search" n="02" kicker="search" title="First, a slow search player that wins.">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr]">
        <Prose>
          <p>There are seventeen moves, all relative to the opponent, so "forward" always means toward them. A decision lasts 4 ticks, which is 15 decisions a second. Directions are held for the whole window. Buttons fire only on the first tick, because the game reads key-down edges.</p>
          <p>For each legal move, the planner clones the fight and reseeds the clone's RNG so the CPU reacts differently in each sample. It plays the move, fast-forwards any super or grapple cinematic, and fills out a 48-tick horizon with a scripted guard-and-poke tail. Then it scores the end state and averages the score over 8 sampled futures.</p>
          <p>Losing health counts <strong>1.25×</strong> as much as dealing it, so the search punishes mistakes instead of trading hits. It's strong and very slow: <strong>81 ms per decision</strong>, or 3½ to 11 minutes of compute per boss match in these runs.</p>
        </Prose>
        <div className="space-y-6">
          <div>
            <Label>the 17 actions</Label>
            <div className="grid grid-cols-3 gap-2 font-mono text-[12px] sm:grid-cols-6">
              {ACTIONS.map(([name, key], i) => (
                <div key={name} className="rounded-lg border border-line bg-ink-2 px-2 py-2">
                  <div className="text-[10px] text-dim">{String(i).padStart(2, "0")}</div>
                  <div className="text-[#fff4e8]">{name}</div>
                  <div className="text-saffron">{key}</div>
                </div>
              ))}
            </div>
          </div>
          <Code title="agent/sim/planner.mjs · the score">{`let v = (opp HP lost) - 1.25 * (own HP lost);
if (op.hp <= 0) v += 60;   // knockout bonus
if (me.hp <= 0) v -= 80;   // getting knocked out costs more
v += 0.04 * me.meter - 0.03 * op.meter;`}</Code>
        </div>
      </div>
    </Section>
  )
}

function Distill() {
  return (
    <Section id="distill" n="03" kicker="distillation" title="Then, a small net trained to copy the search's choices.">
      <div className="grid gap-12 lg:grid-cols-2">
        <Prose>
          <p>Every search decision is logged with its observation, the value of <em>every</em> action and the winner. The observation is 130 numbers, mirrored so the opponent is always to the right. The same file builds it in Node and in the browser.</p>
          <p>The net is an MLP, <strong>130 → 256 → 256 → 256 → 17</strong>, with about 169k parameters. It learns from two targets. The <strong>soft</strong> one is a softmax of the planner's values at τ = 2, over legal moves only, so it learns how much worse each alternative is. The <strong>hard</strong> one is cross-entropy on the planner's pick, at weight 0.5.</p>
          <p>It trained for 30 epochs with AdamW and a cosine schedule on Apple MPS. The weights export to JSON and run in a fifteen-line forward pass in plain JS. One decision takes <strong>0.2 ms</strong>, against 81 ms for the search.</p>
        </Prose>
        <Card>
          <Label>what the net sees · 130 inputs</Label>
          <p className="mb-6 text-[13px] leading-relaxed text-dim">Self and rival: position, velocity, HP, meter, stun, flags, 14 states, 14 attacks, attack phase. Items: budget, bomb, mithai, boss flag. Round: timer, round, wins each side. Gap: distance and hit-stop.</p>
          <DonutChart data={obsGroups} label="inputs" unit="" colors={["orange", "pink", "purple", "green", "blue", "grey"]} size={220} legend />
        </Card>
      </div>
      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <Card>
          <Label>top-1 agreement with the search, held-out (%)</Label>
          <LineChart data={training} x="epoch" series={[{ label: "r1 imitation", value: "r1Top1", color: "grey" }, { label: "r2 + DAgger", value: "r2Top1", color: "orange" }]} height={220} format={{ maximumFractionDigits: 1 }} legend />
        </Card>
        <Card>
          <Label>regret · planner value lost by the net's pick</Label>
          <LineChart data={training} x="epoch" series={[{ label: "r1 imitation", value: "r1Regret", color: "grey" }, { label: "r2 + DAgger", value: "r2Regret", color: "green" }]} height={220} format={{ maximumFractionDigits: 2 }} legend />
        </Card>
      </div>
    </Section>
  )
}

function Dagger() {
  return (
    <Section id="dagger" n="04" kicker="dagger" title={<>Copying alone won 62 of 100 against the boss. <span className="text-saffron">One DAgger round raised it to 87.</span></>}>
      <div className="grid gap-12 lg:grid-cols-2">
        <Prose>
          <p>Pure imitation agreed with the search 94% of the time and still lost 38 boss matches out of 100. The problem is the classic one. The search never wanders into the awkward positions the student's small mistakes create, so the student never learns how to get out of them.</p>
          <p>DAgger fixes this by letting the student drive. Seven workers played matches where each move came from the net or the search with equal odds, 60% of them against the boss. <strong>The search labelled every state anyway.</strong> That added 17,338 labels from the states the net actually reaches. After retraining on 59,096 samples, agreement rose only 0.6 points, but boss wins jumped 25.</p>
        </Prose>
        <Card>
          <Label>win rate vs Hard opponents, 100 matches each (%)</Label>
          <BarChart data={dagger} x="label" series={[{ label: "vs boss", value: "boss", color: "orange" }, { label: "vs other 9", value: "mix", color: "green" }]} height={240} format={(v) => `${v}%`} legend />
        </Card>
      </div>
      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <Card>
          <Label>how the 100 boss matches ended (rounds won–lost)</Label>
          <AsciiColumnChart
            label="Round outcomes r1 versus r2"
            labels={roundOutcomes.labels}
            series={[{ label: "r1", data: roundOutcomes.r1, className: "text-dim" }, { label: "r2", data: roundOutcomes.r2, className: "text-saffron" }]}
            height={10}
            glyphs="shade"
            className="font-mono text-[22px] leading-[1.05] [&_*]:tracking-[0.08em]"
          />
        </Card>
        <Card>
          <Label>every policy vs the Hard boss</Label>
          <div className="space-y-3 font-mono text-[12px]">
            {winRates.map((w) => (
              <div key={w.policy}>
                <div className="mb-1 flex justify-between text-[#cbbcae]"><span>{w.policy}</span><span className="text-[#fff4e8]">{w.n}</span></div>
                <AsciiProgress value={w.boss} width={40} variant="shade" showValue={false} className={w.policy.startsWith("Net r2") ? "text-saffron" : "text-dim"} />
              </div>
            ))}
          </div>
          <p className="mt-5 text-[13px] leading-relaxed text-dim">The search was only tested on 5 seeds, since a single match costs minutes. The nets were tested on 100 seeds each. Hold the search percentages loosely.</p>
        </Card>
      </div>
      <Card className="mt-6">
        <Label>r2 vs the regular Hard roster</Label>
        <div className="grid gap-x-10 gap-y-2 font-mono text-[12px] md:grid-cols-3">
          {perOpponent.map((o) => (
            <div key={o.id} className="flex items-center gap-3">
              <span className="w-12 text-[#cbbcae]">{o.id}</span>
              <AsciiProgress value={(o.won / o.of) * 100} width={14} variant="blocks" showValue={false} className={o.won === o.of ? "text-leaf" : "text-saffron"} />
              <span className="text-[#fff4e8]">{o.won}/{o.of}</span>
            </div>
          ))}
        </div>
      </Card>
    </Section>
  )
}

const ALGOS: DitherAlgorithm[] = ["Atkinson", "Floyd-Steinberg", "Bayer", "Stucki"]

function Live() {
  const [algo, setAlgo] = useState<DitherAlgorithm>("Atkinson")
  return (
    <Section id="live" n="05" kicker="going live" title="In the real client, the net only presses keys.">
      <div className="grid gap-12 lg:grid-cols-2">
        <Prose>
          <p>The game has a read-only developer hook, <code>window.__game</code>, that's only switched on for <code>localhost</code>. So the live runs used a local copy of the published client, with the game code left unmodified.</p>
          <p>A small script injected into the page runs on every animation frame. It reads the battle, waits for the next 4-tick slot on the game's own clock, builds the same 130 inputs and runs the net. Then it masks illegal moves (super needs a full meter, budget needs the pickup) and turns the choice into keyboard events.</p>
          <p>Playwright drives Chrome, starts a Hard match and records the tab through the DevTools screencast. ffmpeg encodes each frame at its real timestamp.</p>
        </Prose>
        <div className="space-y-6">
          <Code title="agent/live-agent/agent.mjs · simplified">{`const q = forward(W, obs(b, A.last));
let a = argmaxLegal(q);
const s = ACT[a], want = new Set();
if (mx > 0) want.add("KeyD"); if (mx < 0) want.add("KeyA");
if (s.up) want.add("KeyW"); if (s.down) want.add("KeyS");
setHeld(want);                       // held directions
if (s.btn) tap(s.btn);               // J/K/I/L/B`}</Code>
          <AsciiBox variant="single" title="key map" className="font-mono text-[12px] text-[#cbbcae]">
            <div className="grid grid-cols-2 gap-2 p-1 sm:grid-cols-4">
              {[["A/D", "move"], ["W", "jump"], ["S", "crouch"], ["J", "punch"], ["K", "kick"], ["I", "grab"], ["L", "super"], ["B", "budget"]].map(([k, v]) => (
                <div key={k}><span className="text-saffron">{k}</span> {v}</div>
              ))}
            </div>
          </AsciiBox>
        </div>
      </div>

      <div className="mt-16">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <Label>frames from the boss fight · dithered in the browser with ditherkit</Label>
          <div className="flex gap-1 rounded-full border border-line p-1 font-mono text-[11px]">
            {ALGOS.map((a) => (
              <button key={a} onClick={() => setAlgo(a)} className={`rounded-full px-3 py-1 transition ${algo === a ? "bg-saffron text-night" : "text-dim hover:text-[#fff4e8]"}`}>{a}</button>
            ))}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {stills.map((s) => (
            <figure key={s.src} className="overflow-hidden rounded-2xl border border-line bg-black">
              <div className="[&_canvas]:block [&_canvas]:h-auto [&_canvas]:w-full [&_canvas]:[image-rendering:pixelated] [&_img]:block [&_img]:h-auto [&_img]:w-full">
                <DitheredImage src={media(s.src)} alt={s.caption} width={640} algorithm={algo} pixelSize={2} palette="#0b0806,#5a1406,#ff9933,#ffc24b,#fff4e8" />
              </div>
              <figcaption className="border-t border-line px-4 py-3 font-mono text-[12px] text-dim">{s.caption}</figcaption>
            </figure>
          ))}
        </div>
      </div>

      <div className="mt-16">
        <Label>the winning frame · drag to compare ASCII and pixels</Label>
        <div className="overflow-hidden rounded-2xl border border-line">
          <AsciiImageCompare src={media("boss_172.jpg")} alt="The fighter celebrates after beating the final boss" charset="standard" fontSize={10} color="source" backdrop={0.18} normalize className="w-full" />
        </div>
      </div>
    </Section>
  )
}

function Style() {
  const totalIdle = idleByState.reduce((s, x) => s + x.idle, 0)
  return (
    <Section id="style" n="06" kicker="behaviour" title={<>It stands still 95% of the time it's free to act. Then it punishes.</>}>
      <div className="grid gap-12 lg:grid-cols-2">
        <Prose>
          <p>Across 10 simulated boss matches, <strong>93.6%</strong> of the net's 11,685 decisions were <code>idle</code>. About 41% of those land while it's locked into its own attack, knocked down, mid-jump or in stun, where nothing it presses would matter.</p>
          <p>The other 59% are a real choice. In neutral, free to do anything, it waits 95% of the time and lets the boss commit. Then it answers with punch, forward kick, kick or grab, and spends super when the meter is full.</p>
          <p>That's a counter-puncher. Nobody told it to play that way. It falls out of the search's scoring, which counts its own health at 1.25×, and the net copied the style.</p>
        </Prose>
        <Card>
          <Label>idle decisions by the net's own state · {totalIdle.toLocaleString()} total</Label>
          <BarChart data={idleByState} x="state" series={[{ label: "idle", value: "idle", color: "orange" }, { label: "all decisions", value: "total", color: "grey" }]} height={260} legend />
        </Card>
      </div>
      <Card className="mt-6">
        <Label>the moves that aren't idle · 100 boss matches</Label>
        <BarChart data={actionMix} x="label" series={[{ label: "times chosen", value: "value", color: "pink" }]} height={220} />
      </Card>
    </Section>
  )
}

function Limits() {
  const items = [
    ["One live sample.", "The boss was beaten once live. The 87/100 rate comes from the simulator, which runs the same fight code but no renderer, so browser frame timing can differ slightly."],
    ["Bot opponents only.", "Every result is against the game's CPU on Hard. The net has never faced a human."],
    ["One character.", "Everything was trained as Mitraman. Other characters have different moves and would need their own data."],
    ["Read access via the dev hook.", "The live agent reads state through the developer's localhost hook rather than from pixels. Its only output is keyboard input."],
    ["Small search eval.", "The search player was tested on 5 seeds per setting, because each boss match costs minutes of CPU."],
  ]
  return (
    <Section id="limits" n="07" kicker="caveats" title="What this does and doesn't show.">
      <div className="grid gap-4 md:grid-cols-2">
        {items.map(([h, b]) => (
          <Card key={h}>
            <div className="text-[#fff4e8]">{h}</div>
            <p className="mt-2 text-[15px] leading-relaxed text-dim">{b}</p>
          </Card>
        ))}
      </div>
    </Section>
  )
}

function Footer() {
  return (
    <footer className="relative mt-10 overflow-hidden">
      <GrainGradient colors={["#0b0806", "#5a1406", "#ff9933", "#ff5fa2"]} background="#0b0806" className="relative">
        <div className="mx-auto max-w-6xl px-5 py-28 md:px-8">
          <h2 className="max-w-3xl text-4xl leading-[1.05] font-medium tracking-[-0.04em] text-[#fff4e8] md:text-6xl">The simulator, search, training, weights and every log are public.</h2>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <GradientButton onClick={() => { window.location.href = REPO }} kind="mesh" colors={["#fff4e8", "#ffc24b", "#ff9933"]} background="#ffc24b" className="text-night font-medium" size="lg">github.com/arjunkshah12345-hash/sansad-showdown-rl</GradientButton>
          </div>
          <p className="mt-16 max-w-3xl font-mono text-[12px] leading-relaxed text-[#fff4e8]/70">
            Sansad Showdown is made by its own authors at fightkaro.com, and all characters, art and code belong to them. It's a satire game, and this project is only about the AI. None of the game's code or assets are in the repo. Site built with dithercn, asciicn, gradients.sh and ditherkit.
          </p>
        </div>
      </GrainGradient>
    </footer>
  )
}
