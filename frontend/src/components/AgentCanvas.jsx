import { useRef, useEffect, useCallback } from "react";
import p5 from "p5";

// ── Agent identity ──────────────────────────────────────────────────
const AGENT_KEYS = ["time","weather","location","motion","calendar","day","emotion","dj"];

const AGENTS_META = {
  time:     { name: "TEMPO",   color: [255, 200, 60],  accent: [200, 160, 30],  zone: [40, 32, 10]  },
  weather:  { name: "HAZE",    color: [80, 160, 255],  accent: [50, 120, 200],  zone: [12, 22, 45]  },
  location: { name: "SCOUT",   color: [29, 185, 84],   accent: [20, 140, 60],   zone: [10, 30, 16]  },
  motion:   { name: "PULSE",   color: [255, 120, 50],  accent: [200, 80, 30],   zone: [40, 18, 10]  },
  calendar: { name: "SLATE",   color: [180, 190, 210], accent: [130, 140, 160], zone: [24, 26, 32]  },
  day:      { name: "RHYTHM",  color: [60, 210, 200],  accent: [40, 160, 150],  zone: [10, 30, 30]  },
  emotion:  { name: "CORE",    color: [180, 120, 255], accent: [140, 80, 220],  zone: [28, 14, 40]  },
  dj:       { name: "MAESTRO", color: [29, 185, 84],   accent: [255, 215, 0],   zone: [10, 28, 14]  },
};

// ── Station layout (fractions of w, h) ──
const STATION_LAYOUT = {
  time:     { hx: 0.10, hy: 0.42 },
  weather:  { hx: 0.20, hy: 0.34 },
  location: { hx: 0.32, hy: 0.28 },
  motion:   { hx: 0.44, hy: 0.26 },
  calendar: { hx: 0.56, hy: 0.26 },
  day:      { hx: 0.68, hy: 0.28 },
  emotion:  { hx: 0.80, hy: 0.34 },
  dj:       { hx: 0.50, hy: 0.58 },
};

// ── Pixel art sprite definitions (1=body, 2=accent, 3=eye, 4=highlight) ──
const PX = 3;

const SPRITES = {
  // TEMPO — Joy-inspired: big round head, upward hair spikes, radiant
  time: {
    idle: [
      [0,0,0,2,0,2,0,0,0,0],
      [0,0,2,1,2,1,2,0,0,0],
      [0,1,1,1,1,1,1,1,0,0],
      [1,1,1,1,1,1,1,1,1,0],
      [1,1,3,3,1,3,3,1,1,0],
      [1,1,1,1,1,1,1,1,1,0],
      [0,1,1,4,4,4,1,1,0,0],
      [0,0,1,1,1,1,1,0,0,0],
      [0,0,0,1,1,1,0,0,0,0],
      [0,0,2,1,1,1,2,0,0,0],
      [0,0,0,1,0,1,0,0,0,0],
      [0,0,0,1,0,1,0,0,0,0],
      [0,0,1,1,0,1,1,0,0,0],
    ],
    fire: [
      [0,4,0,2,4,2,0,4,0,0],
      [0,0,2,1,2,1,2,0,0,0],
      [4,1,1,1,1,1,1,1,4,0],
      [1,1,1,1,4,1,1,1,1,0],
      [1,1,3,3,1,3,3,1,1,0],
      [1,1,1,4,4,4,1,1,1,0],
      [0,1,4,4,4,4,4,1,0,0],
      [0,0,1,1,1,1,1,0,0,0],
      [0,4,0,1,1,1,0,4,0,0],
      [0,0,2,1,1,1,2,0,0,0],
      [0,0,0,1,0,1,0,0,0,0],
      [0,0,0,1,0,1,0,0,0,0],
      [0,0,1,1,0,1,1,0,0,0],
    ],
  },
  // HAZE — Sadness-inspired: droopy oval, glasses, hunched, heavy bottom
  weather: {
    idle: [
      [0,0,1,1,1,1,1,0,0,0],
      [0,1,1,1,1,1,1,1,0,0],
      [1,1,1,1,1,1,1,1,1,0],
      [1,1,2,3,2,2,3,2,1,0],
      [1,1,1,1,1,1,1,1,1,0],
      [0,1,1,1,4,1,1,1,0,0],
      [0,0,1,1,1,1,1,0,0,0],
      [0,1,1,1,1,1,1,1,0,0],
      [0,1,1,1,1,1,1,1,0,0],
      [0,0,1,1,1,1,1,0,0,0],
      [0,0,1,1,0,1,1,0,0,0],
      [0,0,1,0,0,0,1,0,0,0],
      [0,1,1,0,0,0,1,1,0,0],
    ],
    fire: [
      [0,4,1,1,1,1,1,4,0,0],
      [0,1,1,1,4,1,1,1,0,0],
      [1,1,1,1,1,1,1,1,1,0],
      [1,1,2,3,2,2,3,2,1,0],
      [1,1,1,1,1,1,1,1,1,0],
      [0,1,1,4,4,4,1,1,0,0],
      [0,0,1,1,1,1,1,0,0,0],
      [0,1,1,1,1,1,1,1,0,0],
      [4,1,1,1,1,1,1,1,4,0],
      [0,0,1,1,1,1,1,0,0,0],
      [0,0,1,1,0,1,1,0,0,0],
      [0,0,1,0,0,0,1,0,0,0],
      [0,1,1,0,0,0,1,1,0,0],
    ],
  },
  // SCOUT — Disgust-inspired: angular head, swept hair, sleek
  location: {
    idle: [
      [0,0,0,0,2,2,2,2,0,0],
      [0,0,0,2,2,2,2,0,0,0],
      [0,0,1,1,1,1,1,0,0,0],
      [0,1,1,1,1,1,1,1,0,0],
      [0,1,3,3,1,3,3,1,0,0],
      [0,1,1,1,1,1,1,1,0,0],
      [0,0,1,4,4,4,1,0,0,0],
      [0,0,0,1,1,1,0,0,0,0],
      [0,0,2,1,1,1,2,0,0,0],
      [0,2,0,1,1,1,0,0,0,0],
      [0,0,0,1,0,1,0,0,0,0],
      [0,0,0,1,0,1,0,0,0,0],
      [0,0,1,1,0,1,1,0,0,0],
    ],
    fire: [
      [0,0,0,4,2,2,2,2,4,0],
      [0,0,4,2,2,2,2,0,0,0],
      [0,0,1,1,1,1,1,0,0,0],
      [0,1,1,1,4,1,1,1,0,0],
      [0,1,3,3,1,3,3,1,0,0],
      [0,1,1,4,4,4,1,1,0,0],
      [0,0,1,4,4,4,1,0,0,0],
      [0,0,0,1,1,1,0,0,0,0],
      [0,4,2,1,1,1,2,4,0,0],
      [0,2,0,1,1,1,0,0,0,0],
      [0,0,0,1,0,1,0,0,0,0],
      [0,0,0,1,0,1,0,0,0,0],
      [0,0,1,1,0,1,1,0,0,0],
    ],
  },
  // PULSE — Anger-inspired: wide flat-top square head, broad, stocky
  motion: {
    idle: [
      [0,2,2,2,2,2,2,2,0,0],
      [0,1,1,1,1,1,1,1,0,0],
      [1,1,1,1,1,1,1,1,1,0],
      [1,1,3,3,1,3,3,1,1,0],
      [1,1,1,1,1,1,1,1,1,0],
      [1,1,1,4,4,4,1,1,1,0],
      [0,1,1,1,1,1,1,1,0,0],
      [0,0,1,1,1,1,1,0,0,0],
      [0,2,1,1,1,1,1,2,0,0],
      [0,2,0,1,1,1,0,2,0,0],
      [0,0,0,1,0,1,0,0,0,0],
      [0,0,1,1,0,1,1,0,0,0],
      [0,1,1,0,0,0,1,1,0,0],
    ],
    fire: [
      [4,2,2,2,2,2,2,2,4,0],
      [4,1,1,1,4,1,1,1,4,0],
      [1,1,1,1,1,1,1,1,1,0],
      [1,1,3,3,1,3,3,1,1,0],
      [1,1,1,4,4,4,1,1,1,0],
      [1,1,4,4,4,4,4,1,1,0],
      [0,1,1,1,1,1,1,1,0,0],
      [4,0,1,1,1,1,1,0,4,0],
      [0,2,1,1,1,1,1,2,0,0],
      [0,2,0,1,1,1,0,2,0,0],
      [0,0,0,1,0,1,0,0,0,0],
      [0,0,1,1,0,1,1,0,0,0],
      [0,1,1,0,0,0,1,1,0,0],
    ],
  },
  // SLATE — Nostalgia-inspired: big soft rounded, gentle, wide
  calendar: {
    idle: [
      [0,0,1,1,1,1,1,0,0,0],
      [0,1,1,1,1,1,1,1,0,0],
      [1,1,1,1,1,1,1,1,1,0],
      [1,1,1,1,1,1,1,1,1,0],
      [1,1,3,3,1,3,3,1,1,0],
      [1,1,1,1,1,1,1,1,1,0],
      [0,1,1,4,4,4,1,1,0,0],
      [0,1,1,1,1,1,1,1,0,0],
      [0,2,1,1,1,1,1,2,0,0],
      [0,2,1,1,1,1,1,2,0,0],
      [0,0,1,1,0,1,1,0,0,0],
      [0,0,1,0,0,0,1,0,0,0],
      [0,1,1,0,0,0,1,1,0,0],
    ],
    fire: [
      [0,4,1,1,1,1,1,4,0,0],
      [0,1,1,1,4,1,1,1,0,0],
      [1,1,1,1,1,1,1,1,1,0],
      [1,1,4,1,1,1,4,1,1,0],
      [1,1,3,3,1,3,3,1,1,0],
      [1,1,1,4,4,4,1,1,1,0],
      [0,1,4,4,4,4,4,1,0,0],
      [0,1,1,1,1,1,1,1,0,0],
      [4,2,1,1,1,1,1,2,4,0],
      [0,2,1,1,1,1,1,2,0,0],
      [0,0,1,1,0,1,1,0,0,0],
      [0,0,1,0,0,0,1,0,0,0],
      [0,1,1,0,0,0,1,1,0,0],
    ],
  },
  // RHYTHM — Embarrassment-inspired: very round head, compact, shy
  day: {
    idle: [
      [0,0,1,1,1,1,0,0,0,0],
      [0,1,1,1,1,1,1,0,0,0],
      [1,1,1,1,1,1,1,1,0,0],
      [1,1,3,3,1,3,3,1,0,0],
      [1,1,1,1,1,1,1,1,0,0],
      [0,1,1,4,4,1,1,0,0,0],
      [0,0,1,1,1,1,0,0,0,0],
      [0,2,1,1,1,1,2,0,0,0],
      [0,2,0,1,1,0,2,0,0,0],
      [0,0,0,1,1,0,0,0,0,0],
      [0,0,0,1,0,1,0,0,0,0],
      [0,0,1,1,0,1,1,0,0,0],
      [0,0,1,0,0,0,1,0,0,0],
    ],
    fire: [
      [0,4,1,1,1,1,4,0,0,0],
      [0,1,1,1,1,1,1,0,0,0],
      [1,1,1,4,4,1,1,1,0,0],
      [1,1,3,3,1,3,3,1,0,0],
      [1,1,1,4,4,4,1,1,0,0],
      [0,1,4,4,4,4,1,0,0,0],
      [0,0,1,1,1,1,0,0,0,0],
      [4,2,1,1,1,1,2,4,0,0],
      [0,2,0,1,1,0,2,0,0,0],
      [0,0,0,1,1,0,0,0,0,0],
      [0,0,0,1,0,1,0,0,0,0],
      [0,0,1,1,0,1,1,0,0,0],
      [0,0,1,0,0,0,1,0,0,0],
    ],
  },
  // CORE — Fear-inspired: tall thin head, huge eyes, skinny, nervous
  emotion: {
    idle: [
      [0,0,0,2,2,0,0,0,0,0],
      [0,0,1,1,1,1,0,0,0,0],
      [0,0,1,1,1,1,0,0,0,0],
      [0,1,1,1,1,1,1,0,0,0],
      [0,1,3,3,3,3,1,0,0,0],
      [0,1,3,1,3,1,1,0,0,0],
      [0,1,1,1,1,1,1,0,0,0],
      [0,0,1,4,4,1,0,0,0,0],
      [0,0,0,1,1,0,0,0,0,0],
      [0,0,2,1,1,2,0,0,0,0],
      [0,0,0,1,1,0,0,0,0,0],
      [0,0,0,1,0,1,0,0,0,0],
      [0,0,1,1,0,1,1,0,0,0],
    ],
    fire: [
      [0,4,0,2,2,0,4,0,0,0],
      [0,0,1,1,1,1,0,0,0,0],
      [0,4,1,1,1,1,4,0,0,0],
      [0,1,1,4,4,1,1,0,0,0],
      [0,1,3,3,3,3,1,0,0,0],
      [0,1,3,4,3,4,1,0,0,0],
      [0,1,1,1,1,1,1,0,0,0],
      [0,0,4,4,4,4,0,0,0,0],
      [0,0,0,1,1,0,0,0,0,0],
      [0,4,2,1,1,2,4,0,0,0],
      [0,0,0,1,1,0,0,0,0,0],
      [0,0,0,1,0,1,0,0,0,0],
      [0,0,1,1,0,1,1,0,0,0],
    ],
  },
  // MAESTRO — Anxiety-inspired: dynamic, headphones, confident wide stance
  dj: {
    idle: [
      [0,2,0,0,0,0,2,0,0,0],
      [2,2,1,1,1,1,2,2,0,0],
      [2,1,1,1,1,1,1,2,0,0],
      [0,1,1,1,1,1,1,0,0,0],
      [0,1,3,3,1,3,3,0,0,0],
      [0,1,1,1,1,1,1,0,0,0],
      [0,0,1,4,4,1,0,0,0,0],
      [0,0,1,1,1,1,0,0,0,0],
      [0,2,1,1,1,1,2,0,0,0],
      [0,2,0,1,1,0,2,0,0,0],
      [0,0,0,1,0,1,0,0,0,0],
      [0,0,1,1,0,1,1,0,0,0],
      [0,1,1,0,0,0,1,1,0,0],
    ],
    fire: [
      [4,2,0,0,4,0,2,4,0,0],
      [2,2,1,1,1,1,2,2,0,0],
      [2,1,4,1,1,4,1,2,0,0],
      [0,1,1,1,4,1,1,0,0,0],
      [0,1,3,3,1,3,3,0,0,0],
      [0,1,4,4,4,4,1,0,0,0],
      [0,0,4,4,4,4,0,0,0,0],
      [0,0,1,1,1,1,0,0,0,0],
      [4,2,1,1,1,1,2,4,0,0],
      [0,2,0,1,1,0,2,0,0,0],
      [0,0,0,1,0,1,0,0,0,0],
      [0,0,1,1,0,1,1,0,0,0],
      [0,1,1,0,0,0,1,1,0,0],
    ],
  },
};

export default function AgentCanvas({ data, skipEvent, debateActive }) {
  const containerRef = useRef(null);
  const p5Ref = useRef(null);
  const dataRef = useRef(data);
  const skipRef = useRef(null);
  const debateRef = useRef(debateActive);

  useEffect(() => { dataRef.current = data; }, [data]);
  useEffect(() => { debateRef.current = debateActive; }, [debateActive]);
  useEffect(() => {
    if (skipEvent) skipRef.current = { time: Date.now(), type: skipEvent };
  }, [skipEvent]);

  const sketch = useCallback((p) => {
    let agents = [];
    let particles = [];
    let w, h;
    let envBuffer = null;

    // ── Draw a pixel sprite ──
    function drawSprite(sprite, cx, cy, scale, color, accent, glow, dimmed) {
      const rows = sprite.length, cols = sprite[0].length;
      const sx = cx - (cols * scale) / 2, sy = cy - (rows * scale) / 2;
      const [cr, cg, cb] = color;
      const [ar, ag, ab] = accent;
      if (glow > 0.3) {
        for (let g = 3; g > 0; g--) {
          p.noStroke();
          p.fill(cr, cg, cb, glow * 10 * (4 - g));
          p.ellipse(cx, cy + rows * scale * 0.25, cols * scale * (1.1 + g * 0.35), rows * scale * (0.5 + g * 0.15));
        }
      }
      const alpha = dimmed ? 80 : 255;
      p.noStroke();
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const v = sprite[r][c];
          if (v === 0) continue;
          if (v === 1) p.fill(cr, cg, cb, alpha);
          else if (v === 2) p.fill(ar, ag, ab, alpha);
          else if (v === 3) p.fill(255, 255, 255, alpha);
          else if (v === 4) p.fill(255, 255, 220, Math.min(255, alpha + 40));
          p.rect(sx + c * scale, sy + r * scale, scale, scale);
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // ── ENVIRONMENT ──
    // ═══════════════════════════════════════════════════════════════════

    function drawFloor(g, W, H) {
      const floorY = H * 0.62;
      const ts = 16;
      for (let ty = floorY; ty < H; ty += ts) {
        for (let tx = 0; tx < W; tx += ts) {
          const c = ((Math.floor(tx / ts) + Math.floor(ty / ts)) % 2 === 0);
          g.noStroke();
          g.fill(c ? 16 : 22, c ? 16 : 20, c ? 22 : 30);
          g.rect(tx, ty, ts, ts);
        }
      }
      g.stroke(29, 185, 84, 18);
      g.strokeWeight(1);
      g.line(0, floorY, W, floorY);
    }

    function drawWall(g, W, H) {
      const wallH = H * 0.16;
      for (let y = 0; y < wallH; y += 2) {
        const t = y / wallH;
        g.stroke(14 + t * 8, 14 + t * 6, 22 + t * 12);
        g.strokeWeight(2);
        g.line(0, y, W, y);
      }
      g.stroke(35, 35, 50);
      g.strokeWeight(2);
      g.line(0, wallH, W, wallH);
    }

    // ── Colored zone platform under each agent's station ──
    function drawAgentZone(g, x, y, agentKey) {
      const [zr, zg, zb] = AGENTS_META[agentKey].zone;
      const [cr, cg, cb] = AGENTS_META[agentKey].color;
      const zw = 70, zh = 50;
      // Colored floor pad
      for (let dy = 0; dy < zh; dy += 2) {
        const fade = 1 - (dy / zh) * 0.6;
        g.noStroke();
        g.fill(zr * fade, zg * fade, zb * fade, 180);
        g.rect(x - zw / 2 + dy * 0.15, y + 10 + dy, zw - dy * 0.3, 2);
      }
      // Colored rim light
      g.stroke(cr, cg, cb, 30);
      g.strokeWeight(1);
      g.noFill();
      g.rect(x - zw / 2, y + 10, zw, zh, 3);
      // Tiny colored accent line on top
      g.stroke(cr, cg, cb, 50);
      g.line(x - 20, y + 10, x + 20, y + 10);
    }

    function drawMonitor(g, x, y, mw, mh) {
      g.fill(22, 24, 32); g.noStroke(); g.rect(x - 3, y - 3, mw + 6, mh + 6);
      g.fill(28, 30, 40); g.rect(x - 2, y - 2, mw + 4, mh + 4);
      g.fill(4, 5, 12); g.rect(x, y, mw, mh);
      g.fill(22, 24, 32);
      g.rect(x + mw / 2 - 4, y + mh + 3, 8, 5);
      g.rect(x + mw / 2 - 8, y + mh + 8, 16, 3);
    }

    function drawMonitorContent(x, y, mw, mh, type, fc) {
      if (type === "wave") {
        for (let i = 0; i < mw - 4; i += PX) {
          const val = Math.sin((i + fc * 1.5) * 0.12) * mh * 0.25;
          p.noStroke(); p.fill(29, 185, 84, 100);
          p.rect(x + 2 + i, y + mh / 2 + val, PX, PX);
        }
      } else if (type === "bars") {
        const barW = Math.floor((mw - 8) / 5);
        for (let i = 0; i < 5; i++) {
          const bh = (Math.sin(fc * 0.06 + i * 1.2) + 1) * 0.5 * (mh - 8);
          p.noStroke(); p.fill(29, 185, 84, 80 + i * 15);
          p.rect(x + 4 + i * barW, y + mh - 4 - bh, barW - 2, bh);
        }
      } else if (type === "spectrum") {
        const d = dataRef.current;
        const weights = d.agent_weights || {};
        const barW = Math.floor((mw - 8) / 8);
        AGENT_KEYS.forEach((key, i) => {
          const wt = key === "emotion" ? 0.15 : key === "dj" ? 0.20 : (weights[key] || 0.1);
          const bh = wt * 3 * (mh - 8) + Math.sin(fc * 0.08 + i) * 3;
          const [cr, cg, cb] = AGENTS_META[key].color;
          p.noStroke(); p.fill(cr, cg, cb, 140);
          p.rect(x + 4 + i * barW, y + mh - 4 - bh, barW - 1, bh);
        });
      }
      p.fill(0, 0, 0, 18);
      for (let sy = y; sy < y + mh; sy += 2) p.rect(x, sy, mw, 1);
    }

    function drawConsole(cx, cy, fc) {
      const cw = 170, ch = 42, x = cx - cw / 2, y = cy;
      const d = dataRef.current;
      const weights = d.agent_weights || {};
      p.noStroke();
      p.fill(0, 0, 0, 25); p.rect(x + 3, y + 3, cw, ch);
      p.fill(18, 20, 28); p.rect(x, y, cw, ch);
      p.fill(30, 33, 45); p.rect(x, y, cw, 4);
      p.fill(14, 15, 22); p.rect(x, y, 3, ch); p.rect(x + cw - 3, y, 3, ch);
      p.fill(29, 185, 84, 50);
      p.textAlign(p.CENTER, p.CENTER); p.textSize(6); p.textFont("monospace");
      p.text("VIBEENGINE MIX", cx, y + ch + 8);
      for (let i = 0; i < 8; i++) {
        const fx = x + 12 + i * 19;
        const key = AGENT_KEYS[i];
        const wt = key === "emotion" ? 0.15 : key === "dj" ? 0.20 : (weights[key] || 0.1);
        const [cr, cg, cb] = AGENTS_META[key].color;
        p.fill(8, 8, 12); p.rect(fx, y + 8, 5, 26);
        const knobY = y + 8 + (1 - wt * 3) * 20;
        p.fill(cr, cg, cb, 180); p.rect(fx - 1, knobY, 7, 5);
        p.fill(cr, cg, cb, 60 + Math.sin(fc * 0.1 + i) * 40); p.rect(fx + 1, y + 5, 3, 2);
      }
      for (let i = 0; i < 14; i++) {
        const blink = (Math.floor(fc / 25) + i) % 7 === 0;
        p.fill(blink ? 60 : 12, blink ? 220 : 18, blink ? 60 : 12);
        p.rect(x + 8 + i * 11, y + ch - 6, 4, 3);
      }
    }

    function drawStation(x, y, agentKey, fc) {
      const dw = 28, dh = 8, dx = x - dw / 2, dy = y + 20;
      const [cr, cg, cb] = AGENTS_META[agentKey].color;
      p.noStroke();
      p.fill(22, 24, 34); p.rect(dx, dy, dw, dh);
      p.fill(30, 33, 45); p.rect(dx, dy, dw, 2);
      p.fill(16, 17, 24); p.rect(dx + 2, dy + dh, 3, 5); p.rect(dx + dw - 5, dy + dh, 3, 5);
      // Animated desk item glow
      const glow = Math.sin(fc * 0.04 + AGENT_KEYS.indexOf(agentKey) * 0.8) * 0.3 + 0.7;
      switch (agentKey) {
        case "time":
          p.fill(cr, cg, cb, 130 * glow); p.rect(dx + 3, dy - 6, 7, 7);
          p.fill(8, 8, 12); p.rect(dx + 4, dy - 5, 5, 5);
          p.fill(cr, cg, cb, 200 * glow); p.rect(dx + 6, dy - 4, 1, 3);
          break;
        case "weather":
          p.fill(cr, cg, cb, 110 * glow); p.rect(dx + 4, dy - 4, 9, 3);
          p.fill(cr, cg, cb, 90 * glow); p.rect(dx + 6, dy - 6, 5, 2);
          break;
        case "location":
          p.fill(cr, cg, cb, 130 * glow); p.rect(dx + 8, dy - 7, 6, 6);
          p.fill(8, 8, 12); p.rect(dx + 9, dy - 6, 4, 4);
          p.fill(255, 60, 60, 150 * glow); p.rect(dx + 10, dy - 5, 2, 2);
          break;
        case "motion":
          p.fill(cr, cg, cb, 150 * glow); p.rect(dx + 10, dy - 7, 4, 3);
          p.fill(cr, cg, cb, 120 * glow); p.rect(dx + 8, dy - 4, 4, 3);
          break;
        case "calendar":
          p.fill(cr, cg, cb, 120 * glow); p.rect(dx + 3, dy - 7, 8, 6);
          p.fill(8, 8, 12); p.rect(dx + 4, dy - 6, 2, 2); p.rect(dx + 7, dy - 6, 2, 2);
          p.fill(8, 8, 12); p.rect(dx + 4, dy - 3, 2, 2); p.rect(dx + 7, dy - 3, 2, 2);
          break;
        case "day":
          p.fill(cr, cg, cb, 130 * glow); p.rect(dx + 16, dy - 6, 5, 5);
          break;
        case "emotion":
          p.fill(cr, cg, cb, 140 * glow);
          p.rect(dx + 15, dy - 6, 3, 3); p.rect(dx + 19, dy - 6, 3, 3);
          p.rect(dx + 16, dy - 3, 5, 2);
          break;
      }
    }

    function drawSpeaker(x, y, fc, side) {
      p.noStroke();
      p.fill(15, 15, 22); p.rect(x, y, 32, 48);
      p.fill(22, 22, 32); p.rect(x + 2, y + 2, 28, 44);
      p.fill(8, 8, 14); p.rect(x + 6, y + 22, 20, 18);
      const pulse = Math.sin(fc * 0.12 + side * 2) * 1.5;
      p.fill(16, 16, 24); p.rect(x + 10 + pulse, y + 26 + pulse, 12 - pulse * 2, 10 - pulse * 2);
      p.fill(8, 8, 14); p.rect(x + 9, y + 5, 14, 12);
      p.fill(16, 16, 24); p.rect(x + 12, y + 8, 8, 6);
      const blink = Math.sin(fc * 0.07 + side * 3) > 0.4;
      p.fill(blink ? 29 : 8, blink ? 185 : 15, blink ? 84 : 8);
      p.rect(x + 14, y + 43, 4, 2);
    }

    function drawVinyl(x, y, fc) {
      p.noStroke();
      for (let r = 10; r > 0; r -= 2) {
        p.fill(6 + (10 - r), 6 + (10 - r), 10 + (10 - r));
        p.rect(x - r, y - r, r * 2, r * 2);
      }
      p.fill(160, 40, 40); p.rect(x - 3, y - 3, 6, 6);
      const ang = fc * 0.025, lx = Math.cos(ang) * 8, ly = Math.sin(ang) * 8;
      p.stroke(35, 35, 45); p.strokeWeight(1);
      p.line(x, y, x + lx, y + ly); p.noStroke();
    }

    // ── Signal beam: one agent sending data to console ──
    function drawSignalBeam(agent, consoleX, consoleY, progress, fc) {
      const [cr, cg, cb] = agent.meta.color;
      // Beam travels from agent to console over progress 0→1
      const endX = p.lerp(agent.x, consoleX, progress);
      const endY = p.lerp(agent.y, consoleY, progress);
      // Dotted beam
      const dist = p.dist(agent.x, agent.y, endX, endY);
      const steps = Math.floor(dist / 5);
      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        const bx = p.lerp(agent.x, endX, t);
        const by = p.lerp(agent.y, endY, t);
        const twinkle = Math.sin(fc * 0.3 + s * 0.5) * 0.3 + 0.7;
        p.noStroke();
        p.fill(cr, cg, cb, 140 * twinkle);
        p.rect(bx - 1, by - 1, 3, 3);
      }
      // Beam head (bright dot traveling)
      p.fill(cr, cg, cb, 240);
      p.rect(endX - 2, endY - 2, 5, 5);
      p.fill(255, 255, 255, 150);
      p.rect(endX - 1, endY - 1, 3, 3);
      // Mini text label floating with beam
      if (progress > 0.3 && progress < 0.9) {
        p.fill(cr, cg, cb, 160);
        p.textSize(7); p.textAlign(p.CENTER, p.CENTER); p.textFont("monospace");
        p.text(agent.meta.name, endX, endY - 10);
      }
    }

    function buildEnvironmentBuffer() {
      if (envBuffer) envBuffer.remove();
      envBuffer = p.createGraphics(w, h);
      envBuffer.noSmooth();
      // Base color: very dark blue-grey (not pure black)
      envBuffer.background(12, 13, 20);
      // Subtle scanlines
      for (let y = 0; y < h; y += 3) {
        envBuffer.stroke(0, 0, 0, 8); envBuffer.strokeWeight(1); envBuffer.line(0, y, w, y);
      }
      drawFloor(envBuffer, w, h);
      drawWall(envBuffer, w, h);
      // Colored agent zones
      AGENT_KEYS.forEach((key) => {
        if (key === "dj") return;
        const layout = STATION_LAYOUT[key];
        drawAgentZone(envBuffer, w * layout.hx, h * layout.hy, key);
      });
      // Monitors
      const monTypes = ["wave","bars","spectrum","bars","wave"];
      const wallH = h * 0.16, monW = 55, monH = 30, monSpacing = w / 6;
      for (let i = 0; i < 5; i++) {
        const mx = monSpacing * (i + 1) - monW / 2, my = wallH - monH - 16;
        drawMonitor(envBuffer, mx, my, i === 2 ? 70 : monW, monH);
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // ── AGENT CLASS ──
    // ═══════════════════════════════════════════════════════════════════

    class Agent {
      constructor(key, idx) {
        this.key = key; this.idx = idx;
        this.meta = AGENTS_META[key]; this.sprite = SPRITES[key];
        this.x = 0; this.y = 0;
        this.homeX = 0; this.homeY = 0;
        this.stageX = 0; this.stageY = 0;
        this.targetX = 0; this.targetY = 0;
        this.atStation = true;
        this.scale = PX; this.targetScale = PX;
        this.pulse = 0; this.glowIntensity = 0.5; this.targetGlow = 0.5;
        this.bobPhase = Math.random() * Math.PI * 2;
        this.bobSpeed = 0.012 + Math.random() * 0.008;
        this.isWinner = false; this.isLoser = false;
        this.scatter = { active: false, vx: 0, vy: 0, timer: 0 };
        this.weight = 0.1; this.fireTimer = 0;
        // Wander state
        this.wanderX = 0; this.wanderY = 0;
        this.wanderTimer = 60 + Math.floor(Math.random() * 120);
        this.wanderRadius = 25;
        // Signal state for one-at-a-time interaction
        this.signaling = false;
        this.signalProgress = 0;
      }

      setHomePosition(W, H) {
        const layout = STATION_LAYOUT[this.key];
        this.homeX = W * layout.hx; this.homeY = H * layout.hy;
        this.stageX = W * 0.5 + (this.key === "dj" ? 0 : (this.idx - 3) * 26);
        this.stageY = this.key === "dj" ? H * 0.52 : H * 0.44;
        this.wanderX = this.homeX; this.wanderY = this.homeY;
      }

      updateFromData(d) {
        const weights = d.agent_weights || {}; const debate = d.debate || {};
        if (this.key === "emotion") this.weight = 0.15;
        else if (this.key === "dj") this.weight = 0.20;
        else this.weight = weights[this.key] || 0.1;
        this.isWinner = debate.winner === this.key;
        this.isLoser = debate.loser === this.key;
        this.targetScale = PX + this.weight * 3.5;
        this.targetGlow = this.isWinner ? 1.2 : this.isLoser ? 0.15 : 0.4 + this.weight;
      }

      scatter_away(cx, cy) {
        const away = Math.atan2(this.y - cy, this.x - cx);
        this.scatter = { active: true, vx: Math.cos(away) * (5 + Math.random() * 8), vy: Math.sin(away) * (5 + Math.random() * 8), timer: 50 + Math.floor(Math.random() * 25) };
        this.signaling = false; this.signalProgress = 0;
      }

      fire() { this.fireTimer = 50; this.pulse = 2.0; }
      startSignal() { this.signaling = true; this.signalProgress = 0; this.fire(); }
      returnHome() { this.atStation = true; this.signaling = false; this.signalProgress = 0; }

      update() {
        this.bobPhase += this.bobSpeed;

        // Wander when at station
        if (this.atStation && !this.scatter.active) {
          this.wanderTimer--;
          if (this.wanderTimer <= 0) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * this.wanderRadius;
            this.wanderX = this.homeX + Math.cos(angle) * dist;
            this.wanderY = this.homeY + Math.sin(angle) * dist;
            this.wanderTimer = 80 + Math.floor(Math.random() * 160);
          }
        }

        // Signal beam progress
        if (this.signaling) {
          this.signalProgress = Math.min(this.signalProgress + 0.018, 1);
        }

        // Target
        let tx, ty;
        if (this.scatter.active) {
          // handled below
          tx = this.x; ty = this.y;
        } else if (!this.atStation) {
          tx = this.stageX; ty = this.stageY;
        } else {
          tx = this.wanderX; ty = this.wanderY;
        }
        this.targetX = tx; this.targetY = ty;

        if (this.scatter.active) {
          this.x += this.scatter.vx; this.y += this.scatter.vy;
          this.scatter.vx *= 0.93; this.scatter.vy *= 0.93;
          this.scatter.timer--;
          if (this.scatter.timer <= 0) this.scatter.active = false;
        } else {
          const bobY = Math.sin(this.bobPhase) * 2.5;
          const bobX = Math.cos(this.bobPhase * 0.6) * 1.2;
          this.x += (this.targetX + bobX - this.x) * 0.035;
          this.y += (this.targetY + bobY - this.y) * 0.035;
        }

        this.scale += (this.targetScale - this.scale) * 0.06;
        this.glowIntensity += (this.targetGlow - this.glowIntensity) * 0.05;
        if (this.pulse > 0) this.pulse *= 0.93;
        if (this.fireTimer > 0) this.fireTimer--;

        // Particles
        if (Math.random() < 0.025 * this.glowIntensity) {
          const [cr, cg, cb] = this.meta.color;
          particles.push({ x: this.x + (Math.random() - 0.5) * 14, y: this.y + (Math.random() - 0.5) * 14, vx: (Math.random() - 0.5) * 0.6, vy: -0.3 - Math.random() * 0.6, life: 20 + Math.random() * 20, maxLife: 40, color: [cr, cg, cb], size: 2 + Math.random() * 2 });
        }
      }

      draw() {
        const isFiring = this.fireTimer > 0;
        const spriteData = isFiring ? this.sprite.fire : this.sprite.idle;
        const breathe = 1 + Math.sin(this.bobPhase * 2) * 0.025;
        const s = this.scale * breathe + this.pulse * 0.4;
        // Shadow
        p.noStroke(); p.fill(0, 0, 0, 18);
        p.ellipse(this.x, this.y + 18 + s * 2, 20, 5);
        drawSprite(spriteData, this.x, this.y, s, this.meta.color, this.meta.accent, this.glowIntensity + this.pulse, this.isLoser);
        // Label
        const [cr, cg, cb] = this.meta.color;
        p.fill(cr, cg, cb, this.isLoser ? 70 : 180);
        p.noStroke(); p.textAlign(p.CENTER, p.CENTER); p.textSize(8); p.textFont("monospace");
        p.text(this.meta.name, this.x, this.y + 24 + this.scale * 2);
        // Weight bar
        const barW = 24, barH = 2, barX = this.x - barW / 2, barY = this.y + 30 + this.scale * 2;
        p.fill(255, 255, 255, 8); p.rect(barX, barY, barW, barH, 1);
        p.fill(cr, cg, cb, this.isLoser ? 30 : 110); p.rect(barX, barY, barW * this.weight * 3.3, barH, 1);
        // Winner star
        if (this.isWinner && debateRef.current) { p.fill(255, 215, 0, 200); p.textSize(11); p.text("\u2B50", this.x, this.y - 22 - this.scale * 2); }
        // Fire ring
        if (isFiring) {
          const t = this.fireTimer / 50;
          p.noFill(); p.stroke(cr, cg, cb, t * 120); p.strokeWeight(1.5 * t);
          p.circle(this.x, this.y, 40 + (1 - t) * 30);
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // ── P5 LIFECYCLE ──
    // ═══════════════════════════════════════════════════════════════════

    p.setup = () => {
      const c = containerRef.current; w = c.offsetWidth; h = c.offsetHeight;
      p.createCanvas(w, h); p.textFont("monospace"); p.noSmooth();
      AGENT_KEYS.forEach((key, i) => {
        const agent = new Agent(key, i);
        agent.setHomePosition(w, h);
        agent.x = agent.homeX; agent.y = agent.homeY;
        agents.push(agent);
      });
      buildEnvironmentBuffer();
    };

    p.windowResized = () => {
      const c = containerRef.current; if (!c) return;
      w = c.offsetWidth; h = c.offsetHeight;
      p.resizeCanvas(w, h);
      agents.forEach(a => a.setHomePosition(w, h));
      buildEnvironmentBuffer();
    };

    let lastSkipTime = 0;
    // Sequence: 0=idle, 1=signaling one-at-a-time, 2=debate (winner vs loser), 3=maestro resolves
    let seqPhase = 0;
    let seqTimer = 0;
    let seqAgentIdx = 0; // which agent is currently signaling
    let seqSignalTimer = 0;
    let debateTimer = 0;

    p.draw = () => {
      const fc = p.frameCount;
      const d = dataRef.current;
      const cx = w / 2;
      const consoleY = h * 0.52;

      // ── Static environment ──
      if (envBuffer) p.image(envBuffer, 0, 0);

      // ── Animated monitor content ──
      const monTypes = ["wave","bars","spectrum","bars","wave"];
      const wallH = h * 0.16, monW = 55, monH = 30, monSpacing = w / 6;
      for (let i = 0; i < 5; i++) {
        const mx = monSpacing * (i + 1) - monW / 2, my = wallH - monH - 16;
        drawMonitorContent(mx, my, i === 2 ? 70 : monW, monH, monTypes[i], fc);
      }

      // ── LED strip ──
      const ledY = wallH - 4;
      const ledCount = Math.floor(w * 0.7 / 8);
      for (let i = 0; i < ledCount; i++) {
        const lit = (Math.floor(fc / 10) + i) % 8 === 0;
        const colors = [[29,185,84],[255,200,60],[255,80,60],[80,160,255]];
        const c = colors[i % 4];
        p.noStroke(); p.fill(lit ? c[0] : 12, lit ? c[1] : 12, lit ? c[2] : 16, lit ? 180 : 30);
        p.rect(w * 0.15 + i * 8, ledY, 3, 3);
      }

      // ── Agent stations/desks ──
      AGENT_KEYS.forEach((key) => {
        if (key === "dj") return;
        const layout = STATION_LAYOUT[key];
        drawStation(w * layout.hx, h * layout.hy, key, fc);
      });

      // ── Handle skip ──
      const skip = skipRef.current;
      if (skip && skip.time !== lastSkipTime) {
        lastSkipTime = skip.time;
        agents.forEach(a => a.scatter_away(cx, h * 0.42));
        for (let i = 0; i < 50; i++) {
          const ang = Math.random() * Math.PI * 2, spd = 2 + Math.random() * 5;
          particles.push({ x: cx, y: h * 0.42, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, life: 25 + Math.random() * 30, maxLife: 45, color: [255, 70, 50], size: PX });
        }
        // Reset sequence
        seqPhase = 0; seqTimer = 0; seqAgentIdx = 0;
        agents.forEach(a => { a.returnHome(); });
      }

      // ── Update agents ──
      agents.forEach(a => { a.updateFromData(d); a.update(); });

      // ═══════════════════════════════════════════════════════════════
      // ── SLOW ONE-AT-A-TIME SEQUENCE ──
      // ═══════════════════════════════════════════════════════════════
      seqTimer++;

      if (seqPhase === 0) {
        // Idle — wait then start
        if (seqTimer > 180) { // ~3 seconds idle
          seqPhase = 1; seqAgentIdx = 0; seqSignalTimer = 0;
          agents[0].startSignal();
        }
      }

      if (seqPhase === 1) {
        // One agent at a time sends signal to console
        seqSignalTimer++;
        const currentAgent = agents[seqAgentIdx];
        if (currentAgent && seqAgentIdx < 6) {
          // Signal beam completes after ~70 frames (~1.2 sec per agent)
          if (seqSignalTimer > 70) {
            currentAgent.signaling = false;
            currentAgent.signalProgress = 0;
            seqAgentIdx++;
            seqSignalTimer = 0;
            if (seqAgentIdx < 6) {
              agents[seqAgentIdx].startSignal();
            } else {
              // All 6 done → emotion agent synthesizes
              seqPhase = 2;
              debateTimer = 0;
              const emo = agents.find(a => a.key === "emotion");
              if (emo) { emo.fire(); emo.atStation = false; }
            }
          }
        }
      }

      if (seqPhase === 2) {
        // Debate: winner and loser beams clash at console
        debateTimer++;
        // After 30 frames, show the debate beams
        if (debateTimer > 120) { // ~2 seconds of debate
          seqPhase = 3;
          const dj = agents.find(a => a.key === "dj");
          if (dj) dj.fire();
        }
      }

      if (seqPhase === 3) {
        // Maestro resolves — wait a beat, then everyone goes home
        debateTimer++;
        if (debateTimer > 170) {
          agents.forEach(a => a.returnHome());
          seqPhase = 0; seqTimer = 0; seqAgentIdx = 0; debateTimer = 0;
        }
      }

      // ── Draw signal beams (one at a time) ──
      agents.forEach(a => {
        if (a.signaling && a.signalProgress > 0) {
          drawSignalBeam(a, cx, consoleY, a.signalProgress, fc);
        }
      });

      // ── Debate beams (only during phase 2, between winner and loser) ──
      if (seqPhase === 2 && debateTimer > 20) {
        const winner = agents.find(a => a.isWinner);
        const loser = agents.find(a => a.isLoser);
        if (winner && loser) {
          const t = (Math.sin(fc * 0.1) + 1) / 2;
          const [wr, wg, wb] = winner.meta.color;
          const [lr, lg, lb] = loser.meta.color;
          const mx = cx + Math.sin(fc * 0.06) * 5;
          const my = consoleY - 6 + Math.cos(fc * 0.09) * 3;

          // Winner beam — strong
          const winDist = p.dist(winner.x, winner.y, mx, my);
          const winSteps = Math.floor(winDist / 4);
          for (let s = 0; s < winSteps; s++) {
            const st = s / winSteps;
            const bx = p.lerp(winner.x, mx, st), by = p.lerp(winner.y, my, st);
            p.noStroke(); p.fill(wr, wg, wb, 100 + t * 80 + Math.sin(fc * 0.2 + s) * 30);
            p.rect(bx - 1.5, by - 1.5, 4, 4);
          }
          // Loser beam — weaker
          const losDist = p.dist(loser.x, loser.y, mx, my);
          const losSteps = Math.floor(losDist / 6);
          for (let s = 0; s < losSteps; s++) {
            const st = s / losSteps;
            const bx = p.lerp(loser.x, mx, st), by = p.lerp(loser.y, my, st);
            p.noStroke(); p.fill(lr, lg, lb, 40 + t * 30);
            p.rect(bx - 1, by - 1, 3, 3);
          }
          // Clash sparks
          for (let i = 0; i < 3; i++) {
            p.fill(255, 220, 80, (80 + t * 100) * Math.random());
            p.rect(mx + (Math.random() - 0.5) * 12, my + (Math.random() - 0.5) * 12, PX, PX);
          }
          // "VS" label
          p.fill(255, 220, 80, 120 + t * 80);
          p.textSize(8); p.textAlign(p.CENTER, p.CENTER); p.textFont("monospace");
          p.text("VS", mx, my - 14);
          // Agent names
          p.fill(wr, wg, wb, 180); p.textSize(7);
          p.text(winner.meta.name, mx - 30, my - 14);
          p.fill(lr, lg, lb, 120);
          p.text(loser.meta.name, mx + 30, my - 14);
        }
      }

      // ── Mixing console ──
      drawConsole(cx, consoleY, fc);

      // ── Vinyls ──
      drawVinyl(cx - 110, consoleY + 12, fc);
      drawVinyl(cx + 110, consoleY + 12, fc);

      // ── Draw agents (z-sorted) ──
      const sorted = [...agents].sort((a, b) => a.y - b.y);
      sorted.forEach(a => a.draw());

      // ── Speakers ──
      drawSpeaker(w * 0.04, h * 0.72, fc, 0);
      drawSpeaker(w * 0.92, h * 0.72, fc, 1);
      if (fc % 4 === 0) {
        particles.push(
          { x: w * 0.04 + 16, y: h * 0.72 + 20, vx: -0.6, vy: (Math.random() - 0.5) * 0.4, life: 18, maxLife: 18, color: [255, 255, 255], size: 1.5 },
          { x: w * 0.92 + 16, y: h * 0.72 + 20, vx: 0.6, vy: (Math.random() - 0.5) * 0.4, life: 18, maxLife: 18, color: [255, 255, 255], size: 1.5 },
        );
      }

      // ── Particles ──
      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.01; pt.life--;
        const alpha = (pt.life / pt.maxLife) * 160;
        p.noStroke(); p.fill(pt.color[0], pt.color[1], pt.color[2], alpha);
        const sz = pt.size * (pt.life / pt.maxLife);
        p.rect(pt.x - sz / 2, pt.y - sz / 2, sz, sz);
        if (pt.life <= 0) particles.splice(i, 1);
      }
      if (particles.length > 500) particles.splice(0, particles.length - 500);
    };
  }, []);

  useEffect(() => {
    if (containerRef.current && !p5Ref.current) {
      p5Ref.current = new p5(sketch, containerRef.current);
    }
    return () => { if (p5Ref.current) { p5Ref.current.remove(); p5Ref.current = null; } };
  }, [sketch]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%", borderRadius: 12, overflow: "hidden" }} />;
}
