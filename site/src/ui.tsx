import type { ReactNode } from "react"
import { AsciiScramble } from "@/components/ascii/ascii-scramble"
import { Divider } from "@/components/dithercn/divider"
import { cn } from "@/lib/utils"

export function Section({ id, n, title, kicker, children, className }: { id: string; n: string; title: ReactNode; kicker: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={cn("relative mx-auto w-full max-w-6xl scroll-mt-20 px-5 py-24 md:px-8 md:py-32", className)}>
      <Divider label={<span className="font-mono text-[11px] tracking-[0.2em] text-saffron uppercase">{n} · {kicker}</span>} color="orange" className="mb-10" />
      <h2 className="max-w-3xl text-3xl leading-[1.08] font-medium tracking-[-0.03em] text-[#fff4e8] md:text-5xl">{title}</h2>
      <div className="mt-10">{children}</div>
    </section>
  )
}

export function Prose({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("prose-x max-w-2xl space-y-5 text-[17px]", className)}>{children}</div>
}

export function Label({ children }: { children: ReactNode }) {
  return <div className="mb-3 font-mono text-[11px] tracking-[0.18em] text-dim uppercase">{children}</div>
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-2xl border border-line bg-ink-2/80 p-6 backdrop-blur", className)}>{children}</div>
}

export function Scramble({ text }: { text: string }) {
  return <AsciiScramble text={text} trigger="mount" duration={900} />
}

export function Code({ children, title }: { children: string; title?: string }) {
  return (
    <div>
      {title && <Label>{title}</Label>}
      <pre className="code" dangerouslySetInnerHTML={{ __html: highlight(children) }} />
    </div>
  )
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
function highlight(src: string) {
  return src
    .split("\n")
    .map((line) => {
      const ci = line.indexOf("//")
      const code = ci >= 0 ? line.slice(0, ci) : line
      const comment = ci >= 0 ? `<span class="c">${esc(line.slice(ci))}</span>` : ""
      const body = esc(code)
        .replace(/(&quot;|"[^"]*")/g, '<span class="s">$1</span>')
        .replace(/\b(const|let|for|if|return|export|function|import|from|of|new|while|else)\b/g, '<span class="k">$1</span>')
        .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="n">$1</span>')
      return body + comment
    })
    .join("\n")
}
