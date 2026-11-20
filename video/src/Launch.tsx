import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";

const { fontFamily: SANS } = loadGeist("normal", { weights: ["400", "500", "600"], subsets: ["latin"] });
const { fontFamily: MONO } = loadMono("normal", { weights: ["400", "500"], subsets: ["latin"] });

const C = {
  night: "#0b0806",
  ink2: "#15100c",
  line: "#2a2018",
  text: "#f4ece2",
  dim: "#a8988a",
  saffron: "#ff9933",
  marigold: "#ffc24b",
  leaf: "#2fbf4a",
  lantern: "#ff5fa2",
};

const FPS = 30;
const s = (sec: number) => Math.round(sec * FPS);

// Timeline (frames)
const T = {
  hook: { from: 0, dur: s(5) },
  title: { from: s(5), dur: s(4) },
  path: { from: s(9), dur: s(20) },
  twist: { from: s(29), dur: s(7) },
  idle: { from: s(36), dur: s(5) },
  finale: { from: s(41), dur: s(11.5) },
  outro: { from: s(52.5), dur: s(4.5) },
};
export const TOTAL = T.outro.from + T.outro.dur;

const ease = Easing.bezier(0.16, 1, 0.3, 1);

/* ---------- shared bits ---------- */

const useIn = (delay = 0, dur = 18) => {
  const f = useCurrentFrame();
  return interpolate(f - delay, [0, dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
};

const Reveal: React.FC<{ delay?: number; y?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  delay = 0,
  y = 28,
  children,
  style,
}) => {
  const p = useIn(delay);
  return (
    <div style={{ opacity: p, transform: `translateY(${(1 - p) * y}px)`, filter: `blur(${(1 - p) * 8}px)`, ...style }}>
      {children}
    </div>
  );
};

/** Fades a whole scene out over its last `out` frames. */
const SceneFade: React.FC<{ dur: number; out?: number; inn?: number; children: React.ReactNode }> = ({
  dur,
  out = 10,
  inn = 8,
  children,
}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, inn, dur - out, dur], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

/** Ordered-dither dot screen, the site's signature texture. */
const Dither: React.FC<{ opacity?: number; cell?: number }> = ({ opacity = 0.5, cell = 4 }) => (
  <AbsoluteFill
    style={{
      opacity,
      backgroundImage: `radial-gradient(${C.night} 0.9px, transparent 1.4px), radial-gradient(${C.night} 0.9px, transparent 1.4px)`,
      backgroundSize: `${cell}px ${cell}px`,
      backgroundPosition: `0 0, ${cell / 2}px ${cell / 2}px`,
      pointerEvents: "none",
    }}
  />
);

const Vignette = () => (
  <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 45%, rgba(11,8,6,.85) 100%)" }} />
);

const Kicker: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = C.saffron }) => (
  <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: 4, textTransform: "uppercase", color }}>{children}</div>
);

const Count: React.FC<{ from: number; to: number; delay?: number; dur?: number; decimals?: number; suffix?: string }> = ({
  from,
  to,
  delay = 0,
  dur = 30,
  decimals = 0,
  suffix = "",
}) => {
  const f = useCurrentFrame();
  const v = interpolate(f - delay, [0, dur], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  return (
    <>
      {v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </>
  );
};

/* ---------- footage ---------- */

const Footage: React.FC<{ at: number; volume?: number | ((f: number) => number); dim?: number; blur?: number }> = ({
  at,
  volume = 1,
  dim = 1,
  blur = 0,
}) => (
  <AbsoluteFill style={{ background: C.night }}>
    <OffthreadVideo
      src={staticFile("boss.mp4")}
      trimBefore={s(at)}
      volume={volume}
      style={{ width: "100%", height: "100%", objectFit: "cover", filter: `brightness(${dim}) saturate(${0.5 + dim * 0.5}) blur(${blur}px)` }}
    />
  </AbsoluteFill>
);

/* ---------- 1. hook ---------- */

const Hook = () => {
  const f = useCurrentFrame();
  const { dur } = T.hook;
  const vol = interpolate(f, [0, 6, dur - 12, dur], [0, 1, 1, 0.25], { extrapolateRight: "clamp" });
  const line2 = f >= 70;
  return (
    <AbsoluteFill>
      <Footage at={26} volume={vol} />
      <AbsoluteFill style={{ background: "linear-gradient(0deg, rgba(11,8,6,.92) 0%, rgba(11,8,6,0) 45%)" }} />
      <AbsoluteFill style={{ justifyContent: "flex-end", padding: "0 120px 110px" }}>
        {!line2 ? (
          <Reveal delay={6}>
            <div style={{ fontFamily: SANS, fontSize: 76, fontWeight: 500, color: C.text, letterSpacing: -1.5 }}>
              The orange fighter is a neural network.
            </div>
          </Reveal>
        ) : (
          <Sequence from={70} layout="none">
            <Reveal>
              <div style={{ fontFamily: SANS, fontSize: 76, fontWeight: 500, color: C.text, letterSpacing: -1.5, lineHeight: 1.1 }}>
                It's beating the game's secret <span style={{ color: C.saffron }}>final boss</span>.
                <br />
                <span style={{ color: C.dim, fontWeight: 400 }}>Using only the keyboard.</span>
              </div>
            </Reveal>
          </Sequence>
        )}
      </AbsoluteFill>
      <AbsoluteFill style={{ padding: 56, alignItems: "flex-end" }}>
        <Reveal delay={4} y={0}>
          <div style={{ fontFamily: MONO, fontSize: 22, color: C.text, background: "rgba(11,8,6,.7)", padding: "10px 16px", border: `1px solid ${C.line}` }}>
            <span style={{ color: C.lantern }}>●</span> LIVE · REAL GAME · HARD
          </div>
        </Reveal>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ---------- background bed for the explainer ---------- */

const Bed = () => {
  const f = useCurrentFrame();
  const dur = T.idle.from + T.idle.dur - T.title.from;
  const vol = interpolate(f, [0, 15, dur - 15, dur], [0.25, 0.22, 0.22, 0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <Footage at={40} volume={vol} dim={0.22} blur={3} />
      <Dither opacity={0.55} />
      <Vignette />
    </AbsoluteFill>
  );
};

/* ---------- 2. title ---------- */

const Title = () => (
  <SceneFade dur={T.title.dur}>
    <AbsoluteFill style={{ justifyContent: "center", padding: "0 160px" }}>
      <Reveal delay={0}>
        <Kicker>The recipe</Kicker>
      </Reveal>
      <Reveal delay={8} style={{ marginTop: 28 }}>
        <div style={{ fontFamily: SANS, fontSize: 104, fontWeight: 500, color: C.text, letterSpacing: -3, lineHeight: 1.02 }}>
          From a browser game's own code
          <br />
          to a net that <span style={{ color: C.saffron }}>beats its final boss</span>.
        </div>
      </Reveal>
      <Reveal delay={22} style={{ marginTop: 36 }}>
        <div style={{ fontFamily: SANS, fontSize: 36, color: C.dim }}>Five steps. No game hacks. Just keypresses.</div>
      </Reveal>
    </AbsoluteFill>
  </SceneFade>
);

/* ---------- 3. the path ---------- */

type Step = { n: string; label: string; title: string; body: string; stat: string; statSub: string; Visual: React.FC };

const CodeVisual = () => {
  const f = useCurrentFrame();
  const lines = [
    ["// cut the shipped bundle before the DOM", C.dim],
    ["const { Battle, Fighter, Bot } = game;", C.text],
    ["const b = new Battle(seed);", C.text],
    ["for (;;) b.tick(1 / 60);", C.marigold],
  ] as const;
  return (
    <div style={{ fontFamily: MONO, fontSize: 26, lineHeight: 1.7 }}>
      {lines.map(([t, col], i) => {
        const chars = Math.floor(interpolate(f - 8 - i * 14, [0, 14], [0, t.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
        return (
          <div key={i} style={{ color: col, whiteSpace: "pre" }}>
            {t.slice(0, chars)}
            {chars > 0 && chars < t.length ? <span style={{ color: C.saffron }}>▍</span> : null}
          </div>
        );
      })}
      <div style={{ marginTop: 18, color: C.leaf }}>
        ticks/s <Count from={0} to={40000} delay={50} dur={40} />
      </div>
    </div>
  );
};

const SearchVisual = () => {
  const f = useCurrentFrame();
  const n = 17;
  const best = 11;
  const vals = [0.2, 0.35, 0.6, 0.3, 0.45, 0.25, 0.4, 0.5, 0.55, 0.38, 0.62, 0.92, 0.48, 0.3, 0.66, 0.42, 0.2];
  return (
    <svg width={620} height={360} viewBox="0 0 620 360">
      {Array.from({ length: n }).map((_, i) => {
        const p = interpolate(f - 6 - i * 2, [0, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
        const y = 20 + (i * 320) / (n - 1);
        const x2 = 60 + 300 * p;
        const isBest = i === best && f > 60;
        const barP = interpolate(f - 40 - i, [0, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
        return (
          <g key={i}>
            <line x1={30} y1={180} x2={x2} y2={180 + (y - 180) * p} stroke={isBest ? C.leaf : "#6b5a4a"} strokeWidth={isBest ? 4 : 1.5} />
            <rect x={380} y={y - 6} width={220 * vals[i] * barP} height={12} fill={isBest ? C.leaf : C.dim} opacity={isBest ? 1 : 0.45} />
          </g>
        );
      })}
      <circle cx={30} cy={180} r={12} fill={C.saffron} />
    </svg>
  );
};

const NetVisual = () => {
  const f = useCurrentFrame();
  const cols = [9, 12, 12, 12, 5];
  const labels = ["130", "256", "256", "256", "17"];
  const X = (c: number) => 40 + c * 140;
  const Y = (c: number, r: number) => 180 + (r - (cols[c] - 1) / 2) * 26;
  const pulse = (f % 40) / 40;
  return (
    <svg width={640} height={380} viewBox="0 0 640 380">
      {cols.slice(0, -1).map((cnt, c) =>
        Array.from({ length: cnt }).map((_, r) =>
          Array.from({ length: cols[c + 1] }).map((__, r2) =>
            (r + r2) % 3 === 0 ? (
              <line key={`${c}-${r}-${r2}`} x1={X(c)} y1={Y(c, r)} x2={X(c + 1)} y2={Y(c + 1, r2)} stroke="#5a4a3c" strokeWidth={1.2}
                opacity={interpolate(f - c * 8, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
            ) : null,
          ),
        ),
      )}
      {cols.map((cnt, c) =>
        Array.from({ length: cnt }).map((_, r) => {
          const hot = Math.abs(pulse * 4 - c) < 0.5 && (r * 7 + c) % 3 === 0;
          const win = c === 4 && r === 2 && f > 40;
          return (
            <circle key={`${c}-${r}`} cx={X(c)} cy={Y(c, r)} r={win ? 9 : 6}
              fill={win ? C.leaf : hot ? C.saffron : C.dim}
              opacity={interpolate(f - c * 8, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
          );
        }),
      )}
      {labels.map((l, c) => (
        <text key={l + c} x={X(c)} y={370} fill={C.dim} fontFamily={MONO} fontSize={20} textAnchor="middle">
          {l}
        </text>
      ))}
    </svg>
  );
};

const DaggerVisual = () => {
  const f = useCurrentFrame();
  const r = 120;
  const cx = 200;
  const cy = 190;
  const items = [
    { a: -90, t: "net plays", c: C.saffron },
    { a: 30, t: "teacher labels", c: C.leaf },
    { a: 150, t: "retrain", c: C.marigold },
  ];
  const sweep = interpolate(f, [5, 90], [0, 360 * 1.5], { extrapolateRight: "clamp" });
  const dot = ((sweep - 90) * Math.PI) / 180;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
      <svg width={420} height={380} viewBox="0 0 420 380">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#6b5a4a" strokeWidth={3} strokeDasharray="6 10" />
        <circle cx={cx + r * Math.cos(dot)} cy={cy + r * Math.sin(dot)} r={9} fill={C.saffron} />
        {items.map((it, i) => {
          const rad = (it.a * Math.PI) / 180;
          const x = cx + (r + 0) * Math.cos(rad);
          const y = cy + (r + 0) * Math.sin(rad);
          return (
            <g key={i} opacity={interpolate(f - i * 10, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}>
              <rect x={x - 92} y={y - 22} width={184} height={44} fill={C.ink2} stroke={it.c} />
              <text x={x} y={y + 7} textAnchor="middle" fill={it.c} fontFamily={MONO} fontSize={20}>
                {it.t}
              </text>
            </g>
          );
        })}
      </svg>
      <div style={{ fontFamily: MONO, color: C.dim, fontSize: 24, lineHeight: 1.6 }}>
        training pairs
        <div style={{ fontSize: 44, color: C.text }}>
          <Count from={41758} to={59096} delay={30} dur={50} />
        </div>
      </div>
    </div>
  );
};

const KeysVisual = () => {
  const f = useCurrentFrame();
  const rows = [
    ["W", "", "I", ""],
    ["A", "S", "D", "J", "K", "L"],
    ["B"],
  ];
  const seq = ["D", "J", "K", "A", "L", "S", "I", "J", "W", "K", "D", "B"];
  const active = seq[Math.floor(f / 6) % seq.length];
  const names: Record<string, string> = { W: "jump", A: "back", S: "crouch", D: "fwd", J: "punch", K: "kick", I: "grab", L: "super", B: "budget" };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {rows.map((row, i) => (
        <div key={i} style={{ display: "flex", gap: 14 }}>
          {row.map((k, j) =>
            k ? (
              <div key={j} style={{
                width: 92, height: 92, border: `2px solid ${k === active ? C.saffron : C.line}`,
                background: k === active ? C.saffron : C.ink2, color: k === active ? C.night : C.text,
                fontFamily: MONO, fontSize: 34, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                transform: k === active ? "translateY(4px)" : "none",
              }}>
                {k}
                <span style={{ fontSize: 13, opacity: 0.7 }}>{names[k]}</span>
              </div>
            ) : (
              <div key={j} style={{ width: 92 }} />
            ),
          )}
        </div>
      ))}
      <div style={{ fontFamily: MONO, fontSize: 22, color: C.dim, marginTop: 10 }}>
        keydown <span style={{ color: C.saffron }}>{active}</span> · 15 decisions / s
      </div>
    </div>
  );
};

const STEPS: Step[] = [
  {
    n: "01", label: "Simulator", title: "Run the game's real code, headless",
    body: "Cut the shipped JS bundle before it touches the page. Fake just enough browser to load it in Node. Seed the randomness.",
    stat: "40,000", statSub: "ticks / s · 666× real time", Visual: CodeVisual,
  },
  {
    n: "02", label: "Teacher", title: "A search player that looks ahead",
    body: "Clone the fight in 13 µs, try all 17 moves, simulate 48 ticks of 8 futures, score what's left.",
    stat: "4 / 5", statSub: "wins vs Hard boss · 81 ms per move", Visual: SearchVisual,
  },
  {
    n: "03", label: "Student", title: "Distil it into a tiny net",
    body: "A 169k-parameter MLP learns the value of every move, not just the best one.",
    stat: "0.2 ms", statSub: "per move · ~400× cheaper", Visual: NetVisual,
  },
  {
    n: "04", label: "DAgger", title: "Let it fail. Let the teacher correct it.",
    body: "The net drives, the search labels every state it stumbles into, and the net retrains.",
    stat: "62 → 87", statSub: "boss wins out of 100", Visual: DaggerVisual,
  },
  {
    n: "05", label: "Keyboard", title: "Play the real game with keys",
    body: "Read the fight, build the same 130 numbers, run the net in plain JS, press keys.",
    stat: "130 → 17", statSub: "numbers in · moves out", Visual: KeysVisual,
  },
];

const STEP_DUR = T.path.dur / STEPS.length;

const Path = () => {
  const f = useCurrentFrame();
  const idx = Math.min(STEPS.length - 1, Math.floor(f / STEP_DUR));
  const prog = interpolate(f, [0, T.path.dur - 20], [0, 1], { extrapolateRight: "clamp" });
  const out = interpolate(f, [T.path.dur - 10, T.path.dur], [1, 0], { extrapolateLeft: "clamp" });
  const inn = interpolate(f, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const railTop = 230;
  const railH = 620;
  return (
    <AbsoluteFill style={{ opacity: Math.min(out, inn) }}>
      {/* rail */}
      <div style={{ position: "absolute", left: 120, top: 130 }}>
        <Kicker>The path</Kicker>
      </div>
      <div style={{ position: "absolute", left: 140, top: railTop, width: 2, height: railH, background: C.line }} />
      <div style={{ position: "absolute", left: 140, top: railTop, width: 2, height: railH * prog, background: C.saffron, boxShadow: `0 0 18px ${C.saffron}` }} />
      {STEPS.map((st, i) => {
        const y = railTop + (i * railH) / (STEPS.length - 1);
        const on = i <= idx;
        const cur = i === idx;
        return (
          <div key={st.n} style={{ position: "absolute", left: 120, top: y - 21, display: "flex", alignItems: "center", gap: 22 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 21, background: cur ? C.saffron : on ? C.ink2 : C.night,
              border: `2px solid ${on ? C.saffron : C.line}`, color: cur ? C.night : on ? C.saffron : C.dim,
              fontFamily: MONO, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {st.n}
            </div>
            <div style={{ fontFamily: SANS, fontSize: 30, color: cur ? C.text : on ? C.dim : "#5a4c40", fontWeight: cur ? 500 : 400 }}>{st.label}</div>
          </div>
        );
      })}
      {/* card */}
      {STEPS.map((st, i) => (
        <Sequence key={st.n} from={i * STEP_DUR} durationInFrames={STEP_DUR}>
          <StepCard step={st} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

const StepCard: React.FC<{ step: Step }> = ({ step }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 8, STEP_DUR - 8, STEP_DUR], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const V = step.Visual;
  return (
    <AbsoluteFill style={{ opacity: o, left: 560, right: 110, top: 150, bottom: 120, width: "auto", height: "auto", display: "flex", flexDirection: "column" }}>
      <Reveal delay={0}>
        <Kicker color={C.dim}>Step {step.n}</Kicker>
      </Reveal>
      <Reveal delay={4} style={{ marginTop: 16 }}>
        <div style={{ fontFamily: SANS, fontSize: 64, fontWeight: 500, color: C.text, letterSpacing: -1.5, lineHeight: 1.05 }}>{step.title}</div>
      </Reveal>
      <Reveal delay={9} style={{ marginTop: 18, maxWidth: 1100 }}>
        <div style={{ fontFamily: SANS, fontSize: 30, color: C.dim, lineHeight: 1.4 }}>{step.body}</div>
      </Reveal>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 40, marginTop: 20 }}>
        <Reveal delay={12}>
          <V />
        </Reveal>
        <Reveal delay={30} style={{ textAlign: "right" }}>
          <div style={{ fontFamily: SANS, fontSize: 110, fontWeight: 500, color: C.saffron, letterSpacing: -3, fontVariantNumeric: "tabular-nums" }}>{step.stat}</div>
          <div style={{ fontFamily: MONO, fontSize: 24, color: C.dim, marginTop: 4 }}>{step.statSub}</div>
        </Reveal>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- 4. the twist ---------- */

const Bar: React.FC<{ label: string; from: number; to: number; max: number; delay: number; color: string; unit: string; decimals?: number }> = ({
  label, from, to, max, delay, color, unit, decimals = 0,
}) => {
  const f = useCurrentFrame();
  const a = interpolate(f - delay, [0, 20], [0, from], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const b = interpolate(f - delay - 50, [0, 30], [a, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const v = f - delay - 50 > 0 ? b : a;
  const W = 1100;
  return (
    <div style={{ marginBottom: 56 }}>
      <div style={{ display: "flex", justifyContent: "space-between", width: W + 220, fontFamily: SANS, fontSize: 30, color: C.dim, marginBottom: 14 }}>
        <span>{label}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
        <div style={{ width: W, height: 46, background: C.ink2, border: `1px solid ${C.line}`, position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, width: (W * from) / max, borderRight: `2px dashed ${C.dim}`, opacity: f - delay - 50 > 0 ? 0.6 : 0 }} />
          <div style={{ height: "100%", width: (W * v) / max, background: color }} />
        </div>
        <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 64, color, minWidth: 240, fontVariantNumeric: "tabular-nums" }}>
          {v.toFixed(decimals)}
          {unit}
        </div>
      </div>
    </div>
  );
};

const Twist = () => {
  const f = useCurrentFrame();
  return (
    <SceneFade dur={T.twist.dur}>
      <AbsoluteFill style={{ padding: "130px 160px" }}>
        <Reveal>
          <Kicker>The twist</Kicker>
        </Reveal>
        <Reveal delay={6} style={{ marginTop: 22, marginBottom: 70 }}>
          <div style={{ fontFamily: SANS, fontSize: 60, fontWeight: 500, color: C.text, letterSpacing: -1.5, lineHeight: 1.08 }}>
            One round of DAgger. <span style={{ color: C.dim, fontWeight: 400 }}>Before → after.</span>
          </div>
        </Reveal>
        <Bar label="How often it copies the teacher" from={94.3} to={94.9} max={100} delay={14} color={C.dim} unit="%" decimals={1} />
        <Bar label="Wins vs the Hard final boss (of 100)" from={62} to={87} max={100} delay={22} color={C.leaf} unit="" />
        <div style={{ marginTop: 10, opacity: interpolate(f, [120, 140], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
          <div style={{ fontFamily: SANS, fontSize: 44, color: C.text }}>
            It didn't need to copy better. <span style={{ color: C.saffron }}>It needed to see more.</span>
          </div>
        </div>
      </AbsoluteFill>
    </SceneFade>
  );
};

/* ---------- 5. patience ---------- */

const Idle = () => (
  <SceneFade dur={T.idle.dur}>
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", textAlign: "center" }}>
      <Reveal>
        <Kicker>What it learned</Kicker>
      </Reveal>
      <Reveal delay={4} style={{ marginTop: 10 }}>
        <div style={{ fontFamily: SANS, fontSize: 260, fontWeight: 500, color: C.saffron, letterSpacing: -10, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
          <Count from={0} to={93.6} delay={6} dur={36} decimals={1} suffix="%" />
        </div>
      </Reveal>
      <Reveal delay={20}>
        <div style={{ fontFamily: SANS, fontSize: 52, color: C.text, fontWeight: 500 }}>of its moves are "do nothing".</div>
      </Reveal>
      <Reveal delay={50} style={{ marginTop: 18 }}>
        <div style={{ fontFamily: SANS, fontSize: 36, color: C.dim }}>It waits for the boss to commit. Then it punishes.</div>
      </Reveal>
    </AbsoluteFill>
  </SceneFade>
);

/* ---------- 6. finale ---------- */

const Finale = () => {
  const f = useCurrentFrame();
  const dur = T.finale.dur;
  const vol = interpolate(f, [0, 10, dur - 20, dur], [0, 1, 1, 0], { extrapolateRight: "clamp" });
  const inn = interpolate(f, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  const out = interpolate(f, [dur - 15, dur], [1, 0], { extrapolateLeft: "clamp" });
  // KO lands ~2.5 s in (source 157 s); "YOU WIN" ~8.5 s in (source 163 s)
  return (
    <AbsoluteFill style={{ opacity: Math.min(inn, out) }}>
      <Footage at={154.5} volume={vol} />
      <AbsoluteFill style={{ background: "linear-gradient(0deg, rgba(11,8,6,.95) 0%, rgba(11,8,6,.6) 25%, rgba(11,8,6,0) 50%)" }} />
      <Sequence from={s(3.4)} layout="none">
        <AbsoluteFill style={{ justifyContent: "flex-end", padding: "0 120px 100px" }}>
          <Reveal>
            <Kicker color={C.leaf}>Hard final boss · live</Kicker>
          </Reveal>
          <Reveal delay={6} style={{ marginTop: 14 }}>
            <div style={{ fontFamily: SANS, fontSize: 92, fontWeight: 500, color: C.text, letterSpacing: -2.5, lineHeight: 1 }}>
              Won 2–1. <span style={{ color: C.saffron }}>98 HP left.</span>
            </div>
          </Reveal>
          <Reveal delay={14} style={{ marginTop: 16 }}>
            <div style={{ fontFamily: MONO, fontSize: 26, color: C.text, opacity: 0.85 }}>1,154 decisions · 0 game edits · keyboard only</div>
          </Reveal>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};

/* ---------- 7. outro ---------- */

const Outro = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: f, fps, config: { damping: 200 } });
  const chain = ["game code", "simulator", "search", "net", "DAgger", "keyboard"];
  return (
    <AbsoluteFill style={{ background: C.night }}>
      <Dither opacity={0.25} cell={5} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", textAlign: "center", transform: `scale(${0.96 + pop * 0.04})` }}>
        <Reveal>
          <div style={{ display: "flex", gap: 16, alignItems: "center", fontFamily: MONO, fontSize: 26, color: C.dim }}>
            {chain.map((c, i) => (
              <React.Fragment key={c}>
                <span style={{ color: i === chain.length - 1 ? C.saffron : C.dim }}>{c}</span>
                {i < chain.length - 1 ? <span style={{ color: "#5a4c40" }}>→</span> : null}
              </React.Fragment>
            ))}
          </div>
        </Reveal>
        <Reveal delay={6} style={{ marginTop: 30 }}>
          <div style={{ fontFamily: SANS, fontSize: 120, fontWeight: 500, color: C.text, letterSpacing: -4 }}>Sansad Showdown RL</div>
        </Reveal>
        <Reveal delay={14} style={{ marginTop: 18 }}>
          <div style={{ fontFamily: MONO, fontSize: 34, color: C.saffron }}>arjunkshah12345-hash.github.io/sansad-showdown-rl</div>
        </Reveal>
        <Reveal delay={24} style={{ marginTop: 50 }}>
          <div style={{ fontFamily: MONO, fontSize: 24, color: C.dim }}>
            87/100 in simulation · 2 of 4 live boss matches so far · write-up, videos and code are open
          </div>
        </Reveal>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ---------- composition ---------- */

export const Launch = () => (
  <AbsoluteFill style={{ background: C.night }}>
    <Sequence from={T.hook.from} durationInFrames={T.hook.dur}>
      <Hook />
    </Sequence>
    <Sequence from={T.title.from} durationInFrames={T.idle.from + T.idle.dur - T.title.from}>
      <Bed />
    </Sequence>
    <Sequence from={T.title.from} durationInFrames={T.title.dur}>
      <Title />
    </Sequence>
    <Sequence from={T.path.from} durationInFrames={T.path.dur}>
      <Path />
    </Sequence>
    <Sequence from={T.twist.from} durationInFrames={T.twist.dur}>
      <Twist />
    </Sequence>
    <Sequence from={T.idle.from} durationInFrames={T.idle.dur}>
      <Idle />
    </Sequence>
    <Sequence from={T.finale.from} durationInFrames={T.finale.dur}>
      <Finale />
    </Sequence>
    <Sequence from={T.outro.from} durationInFrames={T.outro.dur}>
      <Outro />
    </Sequence>
  </AbsoluteFill>
);
