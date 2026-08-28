import { useEffect, useRef } from "react";
import "./ParticleField.css";

export type FieldVariant =
  | "home"
  | "lab"
  | "about"
  | "projects"
  | "writing"
  | "opensource"
  | "minimal";

interface ParticleFieldProps {
  variant: FieldVariant;
  className?: string;
}

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Edge {
  a: number;
  b: number;
}

interface Pulse {
  edge: number;
  t: number;
  speed: number;
}

interface VariantConfig {
  /** multiplier on the baseline node count */
  density: number;
  /** relative weight of accent / accent-2 / accent-3 in that order */
  mix: [number, number, number];
}

const VARIANTS: Record<FieldVariant, VariantConfig> = {
  home: { density: 1, mix: [0.68, 0.32, 0] },
  lab: { density: 1.5, mix: [0.42, 0.24, 0.34] },
  about: { density: 0.55, mix: [0.8, 0.2, 0] },
  projects: { density: 0.95, mix: [0.58, 0.42, 0] },
  writing: { density: 0.45, mix: [0.85, 0.15, 0] },
  opensource: { density: 0.85, mix: [0.48, 0.52, 0] },
  minimal: { density: 0.35, mix: [1, 0, 0] },
};

const MAX_EDGE_DIST = 190;
const EDGES_PER_NODE = 2;
const RECALC_EVERY_FRAMES = 50;

/**
 * A field of drifting nodes connected by hairline edges, with small glowing
 * pulses traveling along a subset of those edges — Web3 topology rendered
 * literally, and a literal visualization of the brand name. One persistent
 * canvas mounted once at the app root (see AnimatedBackground); the variant
 * (density + color mix) lerps smoothly whenever the route changes instead
 * of popping, so navigation feels continuous rather than re-triggered.
 */
export default function ParticleField({ variant, className = "" }: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const variantRef = useRef<FieldVariant>(variant);

  useEffect(() => {
    variantRef.current = variant;
  }, [variant]);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const ctxEl = canvasEl.getContext("2d");
    if (!ctxEl) return;
    const canvas: HTMLCanvasElement = canvasEl;
    const ctx: CanvasRenderingContext2D = ctxEl;

    const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduceMotion = reduceMotionQuery.matches;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    let nodes: Node[] = [];
    let edges: Edge[] = [];
    let pulses: Pulse[] = [];
    let frame = 0;
    let raf = 0;
    let lastTime = performance.now();

    // current (lerped) values so switching pages never pops the field
    const current = { density: VARIANTS[variant].density, mix: [...VARIANTS[variant].mix] as [number, number, number] };

    function colorTokens() {
      const style = getComputedStyle(document.documentElement);
      return [
        style.getPropertyValue("--accent").trim() || "#4d7dff",
        style.getPropertyValue("--accent-2").trim() || "#2fd8e8",
        style.getPropertyValue("--accent-3").trim() || "#8b7bff",
      ];
    }
    let colors = colorTokens();

    function hexToRgb(hex: string): [number, number, number] {
      const clean = hex.replace("#", "");
      const bigint = parseInt(clean.length === 3
        ? clean.split("").map((c) => c + c).join("")
        : clean, 16);
      return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
    }

    function pickColorRgb(mix: [number, number, number]): [number, number, number] {
      const r = Math.random();
      const idx = r < mix[0] ? 0 : r < mix[0] + mix[1] ? 1 : 2;
      return hexToRgb(colors[idx]);
    }

    function targetNodeCount() {
      const area = width * height;
      const baseline = Math.min(64, Math.max(18, Math.round(area / 26000)));
      return Math.round(baseline * current.density);
    }

    function seedNodes() {
      const count = targetNodeCount();
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.14,
        vy: (Math.random() - 0.5) * 0.14,
      }));
      recalcEdges();
    }

    function recalcEdges() {
      const found = new Set<string>();
      const result: Edge[] = [];
      for (let i = 0; i < nodes.length; i++) {
        const dists: { j: number; d: number }[] = [];
        for (let j = 0; j < nodes.length; j++) {
          if (i === j) continue;
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const d = Math.hypot(dx, dy);
          if (d < MAX_EDGE_DIST) dists.push({ j, d });
        }
        dists.sort((a, b) => a.d - b.d);
        for (const { j } of dists.slice(0, EDGES_PER_NODE)) {
          const key = i < j ? `${i}-${j}` : `${j}-${i}`;
          if (!found.has(key)) {
            found.add(key);
            result.push({ a: Math.min(i, j), b: Math.max(i, j) });
          }
        }
      }
      edges = result;

      const pulseCount = Math.min(edges.length, Math.round(16 * current.density));
      pulses = Array.from({ length: pulseCount }, () => ({
        edge: Math.floor(Math.random() * edges.length),
        t: Math.random(),
        speed: 0.12 + Math.random() * 0.16,
      }));
    }

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedNodes();
    }

    function step(now: number) {
      const dt = Math.min(now - lastTime, 48);
      lastTime = now;
      frame++;

      // lerp current density/mix toward the active variant's target
      const target = VARIANTS[variantRef.current];
      current.density += (target.density - current.density) * 0.02;
      for (let i = 0; i < 3; i++) {
        current.mix[i] += (target.mix[i] - current.mix[i]) * 0.02;
      }

      if (frame % RECALC_EVERY_FRAMES === 0) recalcEdges();

      ctx.clearRect(0, 0, width, height);

      // drift nodes
      for (const n of nodes) {
        n.x += n.vx * (dt / 16);
        n.y += n.vy * (dt / 16);
        if (n.x < -20) n.x = width + 20;
        if (n.x > width + 20) n.x = -20;
        if (n.y < -20) n.y = height + 20;
        if (n.y > height + 20) n.y = -20;
      }

      // edges
      ctx.lineWidth = 1;
      for (const e of edges) {
        const a = nodes[e.a];
        const b = nodes[e.b];
        if (!a || !b) continue;
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        const alpha = Math.max(0, 1 - d / MAX_EDGE_DIST) * 0.16;
        if (alpha <= 0.002) continue;
        ctx.strokeStyle = `rgba(150, 175, 255, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      // nodes
      for (const n of nodes) {
        ctx.beginPath();
        ctx.fillStyle = "rgba(180, 200, 255, 0.35)";
        ctx.arc(n.x, n.y, 1.1, 0, Math.PI * 2);
        ctx.fill();
      }

      // pulses — the "light" traveling through the network
      for (const p of pulses) {
        const e = edges[p.edge];
        if (!e) continue;
        const a = nodes[e.a];
        const b = nodes[e.b];
        if (!a || !b) continue;

        if (!reduceMotion) {
          p.t += p.speed * (dt / 1000);
          if (p.t > 1) {
            p.t = 0;
            p.edge = Math.floor(Math.random() * edges.length);
          }
        }

        const x = a.x + (b.x - a.x) * p.t;
        const y = a.y + (b.y - a.y) * p.t;
        const [r, g, bch] = pickColorRgbCached(p);

        const glow = ctx.createRadialGradient(x, y, 0, x, y, 7);
        glow.addColorStop(0, `rgba(${r}, ${g}, ${bch}, 0.9)`);
        glow.addColorStop(1, `rgba(${r}, ${g}, ${bch}, 0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = `rgba(${r}, ${g}, ${bch}, 0.95)`;
        ctx.arc(x, y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reduceMotion) {
        raf = requestAnimationFrame(step);
      }
    }

    // cache each pulse's chosen color so it doesn't flicker between colors
    // every frame — only re-rolled when it respawns on a new edge
    const pulseColorCache = new WeakMap<Pulse, [number, number, number]>();
    function pickColorRgbCached(p: Pulse): [number, number, number] {
      let c = pulseColorCache.get(p);
      if (!c || p.t < 0.01) {
        c = pickColorRgb(current.mix);
        pulseColorCache.set(p, c);
      }
      return c;
    }

    function handleVisibility() {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else if (!reduceMotion) {
        lastTime = performance.now();
        raf = requestAnimationFrame(step);
      }
    }

    function handleReduceMotionChange() {
      reduceMotion = reduceMotionQuery.matches;
      cancelAnimationFrame(raf);
      lastTime = performance.now();
      step(lastTime);
    }

    const themeObserver = new MutationObserver(() => {
      colors = colorTokens();
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    let resizeTimeout = 0;
    function onResize() {
      window.clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(resize, 150);
    }

    resize();
    lastTime = performance.now();
    if (!reduceMotion) {
      raf = requestAnimationFrame(step);
    } else {
      step(lastTime);
    }

    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", handleVisibility);
    reduceMotionQuery.addEventListener("change", handleReduceMotionChange);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimeout);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", handleVisibility);
      reduceMotionQuery.removeEventListener("change", handleReduceMotionChange);
      themeObserver.disconnect();
    };
    // Mount once for the lifetime of the app — variant updates flow in via
    // variantRef so the canvas + listeners are never torn down on navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={canvasRef} className={`particle-field ${className}`.trim()} aria-hidden="true" />;
}
