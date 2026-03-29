import { useRef, useEffect, useCallback } from "react";
import p5 from "p5";

// ── Agent identity ──────────────────────────────────────────────────
const AGENT_KEYS = ["time","weather","location","motion","calendar","day","emotion","dj"];

const AGENTS_META = {
  time:     { name: "TEMPO",   color: [255, 200, 60],  accent: [200, 160, 30]  },
  weather:  { name: "HAZE",    color: [80, 160, 255],  accent: [50, 120, 200]  },
  location: { name: "SCOUT",   color: [29, 185, 84],   accent: [20, 140, 60]   },
  motion:   { name: "PULSE",   color: [255, 120, 50],  accent: [200, 80, 30]   },
  calendar: { name: "SLATE",   color: [180, 190, 210], accent: [130, 140, 160] },
  day:      { name: "RHYTHM",  color: [60, 210, 200],  accent: [40, 160, 150]  },
  emotion:  { name: "CORE",    color: [180, 120, 255], accent: [140, 80, 220]  },
  dj:       { name: "MAESTRO", color: [29, 185, 84],   accent: [255, 215, 0]   },
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
  time: {
    idle: [
      [0,0,0,1,1,1,1,0,0,0],
      [0,0,1,1,1,1,1,1,0,0],
      [0,1,1,2,1,1,2,1,1,0],
      [1,1,1,1,2,1,1,1,1,1],
      [1,1,3,1,2,1,1,3,1,1],
      [1,1,1,1,1,1,1,1,1,1],
      [0,1,1,1,4,4,1,1,1,0],
      [0,0,1,1,1,1,1,1,0,0],
      [0,0,0,1,1,1,1,0,0,0],
      [0,0,1,0,0,0,0,1,0,0],
      [0,1,0,0,0,0,0,0,1,0],
    ],
    fire: [
      [0,0,4,1,1,1,1,4,0,0],
      [0,4,1,1,1,1,1,1,4,0],
      [4,1,1,2,4,1,2,1,1,4],
      [1,1,1,1,2,4,1,1,1,1],
      [1,1,3,1,2,1,1,3,1,1],
      [1,1,1,1,1,1,1,1,1,1],
      [0,1,1,4,4,4,4,1,1,0],
      [0,0,1,1,1,1,1,1,0,0],
      [0,0,0,1,1,1,1,0,0,0],
      [0,0,1,0,0,0,0,1,0,0],
      [0,1,0,0,0,0,0,0,1,0],
    ],
  },
  weather: {
    idle: [
      [0,0,1,1,1,1,0,0,0,0],
      [0,1,1,1,1,1,1,1,0,0],
      [1,1,3,1,1,3,1,1,1,0],
      [1,1,1,1,1,1,1,1,1,1],
      [1,1,1,4,4,1,1,1,1,1],
      [0,1,1,1,1,1,1,1,1,0],
      [0,0,2,2,1,1,2,2,0,0],
      [0,2,2,2,2,2,2,2,2,0],
      [0,0,2,0,0,0,0,2,0,0],
      [0,0,2,0,0,0,0,2,0,0],
      [0,0,1,1,0,0,1,1,0,0],
    ],
    fire: [
      [0,4,1,1,1,1,4,0,0,0],
      [4,1,1,1,1,1,1,1,4,0],
      [1,1,3,1,1,3,1,1,1,4],
      [1,1,1,1,1,1,1,1,1,1],
      [1,1,1,4,4,1,1,1,1,1],
      [0,1,1,1,1,1,1,1,1,0],
      [0,0,2,2,1,1,2,2,0,0],
      [0,2,2,2,2,2,2,2,2,0],
      [0,4,2,0,0,0,0,2,4,0],
      [0,0,2,0,0,0,0,2,0,0],
      [0,0,1,1,0,0,1,1,0,0],
    ],
  },
  location: {
    idle: [
      [0,0,0,0,2,2,0,0,0,0],
      [0,0,0,2,2,2,2,0,0,0],
      [0,0,1,1,1,1,1,1,0,0],
      [0,1,1,3,1,1,3,1,1,0],
      [0,1,1,1,1,1,1,1,1,0],
      [0,0,1,1,4,4,1,1,0,0],
      [0,0,0,1,1,1,1,0,0,0],
      [0,0,2,2,1,1,2,2,0,0],
      [0,0,2,0,1,1,0,2,0,0],
      [0,0,0,0,1,1,0,0,0,0],
      [0,0,0,1,1,1,1,0,0,0],
    ],
    fire: [
      [0,0,0,4,2,2,4,0,0,0],
      [0,0,4,2,2,2,2,4,0,0],
      [0,0,1,1,1,1,1,1,0,0],
      [0,1,1,3,1,1,3,1,1,0],
      [0,1,1,1,1,1,1,1,1,0],
      [0,0,1,4,4,4,4,1,0,0],
      [0,0,0,1,1,1,1,0,0,0],
      [0,2,2,2,1,1,2,2,2,0],
      [0,0,2,0,1,1,0,2,0,0],
      [0,0,0,0,1,1,0,0,0,0],
      [0,0,0,1,1,1,1,0,0,0],
    ],
  },
  motion: {
    idle: [
      [0,0,0,2,0,0,2,0,0,0],
      [0,0,2,1,2,2,1,2,0,0],
      [0,0,1,1,1,1,1,1,0,0],
      [0,1,1,3,1,1,3,1,1,0],
      [2,1,1,1,1,1,1,1,1,2],
      [0,1,1,1,4,4,1,1,1,0],
      [0,0,1,1,1,1,1,1,0,0],
      [0,0,0,1,1,1,1,0,0,0],
      [0,0,1,1,0,0,1,1,0,0],
      [0,1,1,0,0,0,0,1,1,0],
      [0,2,0,0,0,0,0,0,2,0],
    ],
    fire: [
      [0,4,0,2,0,0,2,0,4,0],
      [0,0,2,1,2,2,1,2,0,0],
      [4,0,1,1,1,1,1,1,0,4],
      [0,1,1,3,1,1,3,1,1,0],
      [2,1,1,1,4,4,1,1,1,2],
      [0,1,1,4,4,4,4,1,1,0],
      [4,0,1,1,1,1,1,1,0,4],
      [0,0,0,1,1,1,1,0,0,0],
      [0,0,1,1,0,0,1,1,0,0],
      [0,1,1,0,0,0,0,1,1,0],
      [4,2,0,0,0,0,0,0,2,4],
    ],
  },
  calendar: {
    idle: [
      [0,2,2,2,2,2,2,2,2,0],
      [0,2,1,1,1,1,1,1,2,0],
      [0,1,1,1,1,1,1,1,1,0],
      [0,1,1,3,1,1,3,1,1,0],
      [0,1,1,1,1,1,1,1,1,0],
      [0,1,1,1,4,4,1,1,1,0],
      [0,1,1,1,1,1,1,1,1,0],
      [0,0,2,2,2,2,2,2,0,0],
      [0,0,0,1,1,1,1,0,0,0],
      [0,0,1,1,0,0,1,1,0,0],
      [0,0,1,1,0,0,1,1,0,0],
    ],
    fire: [
      [4,2,2,2,2,2,2,2,2,4],
      [0,2,1,1,1,1,1,1,2,0],
      [0,1,1,1,4,4,1,1,1,0],
      [0,1,1,3,1,1,3,1,1,0],
      [0,1,1,1,1,1,1,1,1,0],
      [0,1,1,4,4,4,4,1,1,0],
      [0,1,1,1,1,1,1,1,1,0],
      [0,4,2,2,2,2,2,2,4,0],
      [0,0,0,1,1,1,1,0,0,0],
      [0,0,1,1,0,0,1,1,0,0],
      [0,0,1,1,0,0,1,1,0,0],
    ],
  },
  day: {
    idle: [
      [0,0,0,1,1,1,0,0,0,0],
      [0,0,1,1,1,1,1,0,0,0],
      [0,1,1,3,1,3,1,1,0,0],
      [0,1,1,1,1,1,1,1,0,0],
      [0,0,1,4,4,4,1,0,0,0],
      [0,0,1,1,1,1,1,0,0,0],
      [0,2,2,1,1,1,2,2,0,0],
      [0,0,0,1,1,1,0,0,0,0],
      [0,0,0,1,0,1,0,0,0,0],
      [0,0,2,2,0,2,2,0,0,0],
      [0,0,2,0,0,0,2,0,0,0],
    ],
    fire: [
      [0,0,4,1,1,1,4,0,0,0],
      [0,4,1,1,1,1,1,4,0,0],
      [0,1,1,3,4,3,1,1,0,0],
      [0,1,1,1,1,1,1,1,0,0],
      [0,0,1,4,4,4,1,0,0,0],
      [0,0,1,1,1,1,1,0,0,0],
      [4,2,2,1,1,1,2,2,4,0],
      [0,0,0,1,1,1,0,0,0,0],
      [0,0,0,1,0,1,0,0,0,0],
      [0,0,2,2,0,2,2,0,0,0],
      [0,4,2,0,0,0,2,4,0,0],
    ],
  },
  emotion: {
    idle: [
      [0,1,1,0,0,0,1,1,0,0],
      [1,1,1,1,0,1,1,1,1,0],
      [1,1,1,1,1,1,1,1,1,0],
      [1,1,3,1,1,1,3,1,1,0],
      [1,1,1,1,4,1,1,1,1,0],
      [0,1,1,4,4,4,1,1,0,0],
      [0,0,1,1,1,1,1,0,0,0],
      [0,0,0,1,1,1,0,0,0,0],
      [0,0,0,0,2,0,0,0,0,0],
      [0,0,0,2,2,2,0,0,0,0],
      [0,0,0,0,2,0,0,0,0,0],
    ],
    fire: [
      [4,1,1,0,0,0,1,1,4,0],
      [1,1,1,1,4,1,1,1,1,0],
      [1,4,1,1,1,1,1,4,1,0],
      [1,1,3,1,4,1,3,1,1,0],
      [1,1,1,4,4,4,1,1,1,0],
      [0,1,4,4,4,4,4,1,0,0],
      [0,0,1,1,1,1,1,0,0,0],
      [0,0,0,1,1,1,0,0,0,0],
      [0,0,4,0,2,0,4,0,0,0],
      [0,0,0,2,2,2,0,0,0,0],
      [0,0,0,4,2,4,0,0,0,0],
    ],
  },
  dj: {
    idle: [
      [0,2,0,0,0,0,0,2,0,0],
      [2,2,1,1,1,1,1,2,2,0],
      [2,1,1,1,1,1,1,1,2,0],
      [0,1,1,3,1,3,1,1,0,0],
      [0,1,1,1,1,1,1,1,0,0],
      [0,0,1,4,4,4,1,0,0,0],
      [0,0,1,1,1,1,1,0,0,0],
      [0,2,2,1,1,1,2,2,0,0],
      [0,0,2,1,1,1,2,0,0,0],
      [0,0,0,1,0,1,0,0,0,0],
      [0,0,1,1,0,1,1,0,0,0],
    ],
    fire: [
      [4,2,0,0,4,0,0,2,4,0],
      [2,2,1,1,1,1,1,2,2,0],
      [2,1,4,1,1,1,4,1,2,0],
      [0,1,1,3,4,3,1,1,0,0],
      [0,1,1,1,1,1,1,1,0,0],
      [0,0,4,4,4,4,4,0,0,0],
      [0,0,1,1,1,1,1,0,0,0],
      [4,2,2,1,1,1,2,2,4,0],
      [0,0,2,1,1,1,2,0,0,0],
      [0,0,0,1,0,1,0,0,0,0],
      [0,0,1,1,0,1,1,0,0,0],
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
    let envBuffer = null; // cached static environment

    // ── Draw a pixel sprite ──
    function drawSprite(sprite, cx, cy, scale, color, accent, glow, dimmed) {
      const rows = sprite.length;
      const cols = sprite[0].length;
      const sx = cx - (cols * scale) / 2;
      const sy = cy - (rows * scale) / 2;
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
    // ── ENVIRONMENT DRAWING FUNCTIONS ──
    // ═══════════════════════════════════════════════════════════════════

    function drawFloor(g, W, H) {
      const floorY = H * 0.65;
      const ts = 16;
      for (let ty = floorY; ty < H; ty += ts) {
        for (let tx = 0; tx < W; tx += ts) {
          const c = ((Math.floor(tx / ts) + Math.floor(ty / ts)) % 2 === 0);
          g.noStroke();
          g.fill(c ? 13 : 17, c ? 13 : 17, c ? 19 : 26);
          g.rect(tx, ty, ts, ts);
        }
      }
      // Horizon glow
      g.stroke(29, 185, 84, 22);
      g.strokeWeight(1);
      g.line(0, floorY, W, floorY);
      g.stroke(29, 185, 84, 8);
      g.line(0, floorY + 1, W, floorY + 1);
    }

    function drawWall(g, W, H) {
      const wallH = H * 0.18;
      // Wall gradient
      for (let y = 0; y < wallH; y += 2) {
        const t = y / wallH;
        g.stroke(10 + t * 6, 10 + t * 6, 16 + t * 10);
        g.strokeWeight(2);
        g.line(0, y, W, y);
      }
      // Wall bottom edge
      g.stroke(30, 32, 45);
      g.strokeWeight(2);
      g.line(0, wallH, W, wallH);
      g.stroke(20, 22, 32);
      g.strokeWeight(1);
      g.line(0, wallH + 2, W, wallH + 2);
    }

    function drawMonitor(g, x, y, mw, mh, type, idx) {
      // Bezel
      g.fill(22, 24, 32);
      g.noStroke();
      g.rect(x - 3, y - 3, mw + 6, mh + 6);
      g.fill(28, 30, 40);
      g.rect(x - 2, y - 2, mw + 4, mh + 4);
      // Screen
      g.fill(4, 5, 12);
      g.rect(x, y, mw, mh);
      // Stand
      g.fill(22, 24, 32);
      g.rect(x + mw / 2 - 4, y + mh + 3, 8, 6);
      g.rect(x + mw / 2 - 8, y + mh + 9, 16, 3);
    }

    function drawMonitorContent(x, y, mw, mh, type, fc) {
      if (type === "wave") {
        for (let i = 0; i < mw - 4; i += PX) {
          const val = Math.sin((i + fc * 1.5) * 0.12) * mh * 0.25;
          p.noStroke();
          p.fill(29, 185, 84, 100);
          p.rect(x + 2 + i, y + mh / 2 + val, PX, PX);
        }
      } else if (type === "bars") {
        const numBars = 5;
        const barW = Math.floor((mw - 8) / numBars);
        for (let i = 0; i < numBars; i++) {
          const bh = (Math.sin(fc * 0.06 + i * 1.2) + 1) * 0.5 * (mh - 8);
          p.noStroke();
          p.fill(29, 185, 84, 80 + i * 15);
          p.rect(x + 4 + i * barW, y + mh - 4 - bh, barW - 2, bh);
        }
      } else if (type === "spectrum") {
        // 8 bars colored per agent
        const d = dataRef.current;
        const weights = d.agent_weights || {};
        const barW = Math.floor((mw - 8) / 8);
        AGENT_KEYS.forEach((key, i) => {
          const wt = key === "emotion" ? 0.15 : key === "dj" ? 0.20 : (weights[key] || 0.1);
          const bh = wt * 3 * (mh - 8) + Math.sin(fc * 0.08 + i) * 3;
          const [cr, cg, cb] = AGENTS_META[key].color;
          p.noStroke();
          p.fill(cr, cg, cb, 140);
          p.rect(x + 4 + i * barW, y + mh - 4 - bh, barW - 1, bh);
        });
      }
      // Scanlines on monitor
      p.fill(0, 0, 0, 20);
      for (let sy = y; sy < y + mh; sy += 2) {
        p.rect(x, sy, mw, 1);
      }
    }

    function drawLEDStrip(g, x, y, stripW, fc) {
      const count = Math.floor(stripW / 8);
      for (let i = 0; i < count; i++) {
        const lit = (Math.floor(fc / 8) + i) % 6 === 0;
        const color = i % 3 === 0 ? [29, 185, 84] : i % 3 === 1 ? [255, 200, 60] : [255, 80, 60];
        g.noStroke();
        g.fill(lit ? color[0] : 15, lit ? color[1] : 15, lit ? color[2] : 18, lit ? 200 : 40);
        g.rect(x + i * 8, y, 3, 3);
      }
    }

    function drawConsole(cx, cy, fc) {
      const cw = 170, ch = 42;
      const x = cx - cw / 2;
      const y = cy;
      const d = dataRef.current;
      const weights = d.agent_weights || {};

      // Shadow
      p.noStroke();
      p.fill(0, 0, 0, 30);
      p.rect(x + 3, y + 3, cw, ch);

      // Console body
      p.fill(18, 20, 28);
      p.rect(x, y, cw, ch);
      // Top surface highlight
      p.fill(30, 33, 45);
      p.rect(x, y, cw, 4);
      // Side edges
      p.fill(14, 15, 22);
      p.rect(x, y, 3, ch);
      p.rect(x + cw - 3, y, 3, ch);

      // Label
      p.fill(29, 185, 84, 60);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(6);
      p.textFont("monospace");
      p.text("VIBEENGINE MIX", cx, y + ch + 8);

      // 8 fader tracks
      for (let i = 0; i < 8; i++) {
        const fx = x + 12 + i * 19;
        const key = AGENT_KEYS[i];
        const wt = key === "emotion" ? 0.15 : key === "dj" ? 0.20 : (weights[key] || 0.1);
        const [cr, cg, cb] = AGENTS_META[key].color;

        // Track groove
        p.fill(8, 8, 12);
        p.rect(fx, y + 8, 5, 26);
        // Fader knob position (higher weight = higher knob)
        const knobY = y + 8 + (1 - wt * 3) * 20;
        p.fill(cr, cg, cb, 180);
        p.rect(fx - 1, knobY, 7, 5);
        // Tiny LED above fader
        p.fill(cr, cg, cb, 60 + Math.sin(fc * 0.1 + i) * 40);
        p.rect(fx + 1, y + 5, 3, 2);
      }

      // Bottom button row
      for (let i = 0; i < 14; i++) {
        const blink = (Math.floor(fc / 25) + i) % 7 === 0;
        p.fill(blink ? 60 : 12, blink ? 220 : 18, blink ? 60 : 12);
        p.rect(x + 8 + i * 11, y + ch - 6, 4, 3);
      }
    }

    function drawStation(x, y, agentKey) {
      const dw = 28, dh = 8;
      const dx = x - dw / 2;
      const dy = y + 20;
      const [cr, cg, cb] = AGENTS_META[agentKey].color;

      // Desk surface
      p.noStroke();
      p.fill(22, 24, 34);
      p.rect(dx, dy, dw, dh);
      p.fill(30, 33, 45);
      p.rect(dx, dy, dw, 2);
      // Legs
      p.fill(16, 17, 24);
      p.rect(dx + 2, dy + dh, 3, 5);
      p.rect(dx + dw - 5, dy + dh, 3, 5);

      // Unique desk item
      switch (agentKey) {
        case "time":     // clock
          p.fill(cr, cg, cb, 130); p.rect(dx + 3, dy - 6, 7, 7);
          p.fill(8, 8, 12); p.rect(dx + 4, dy - 5, 5, 5);
          p.fill(cr, cg, cb, 200); p.rect(dx + 6, dy - 4, 1, 3);
          break;
        case "weather":  // cloud
          p.fill(cr, cg, cb, 110); p.rect(dx + 4, dy - 4, 9, 3);
          p.fill(cr, cg, cb, 90); p.rect(dx + 6, dy - 6, 5, 2);
          break;
        case "location": // compass
          p.fill(cr, cg, cb, 130); p.rect(dx + 8, dy - 7, 6, 6);
          p.fill(8, 8, 12); p.rect(dx + 9, dy - 6, 4, 4);
          p.fill(255, 60, 60, 150); p.rect(dx + 10, dy - 5, 2, 2);
          break;
        case "motion":   // bolt
          p.fill(cr, cg, cb, 150); p.rect(dx + 10, dy - 7, 4, 3);
          p.fill(cr, cg, cb, 120); p.rect(dx + 8, dy - 4, 4, 3);
          break;
        case "calendar": // grid
          p.fill(cr, cg, cb, 120); p.rect(dx + 3, dy - 7, 8, 6);
          p.fill(8, 8, 12); p.rect(dx + 4, dy - 6, 2, 2);
          p.fill(8, 8, 12); p.rect(dx + 7, dy - 6, 2, 2);
          p.fill(8, 8, 12); p.rect(dx + 4, dy - 3, 2, 2);
          p.fill(8, 8, 12); p.rect(dx + 7, dy - 3, 2, 2);
          break;
        case "day":      // sun
          p.fill(cr, cg, cb, 130); p.rect(dx + 16, dy - 6, 5, 5);
          p.fill(cr, cg, cb, 60);
          p.rect(dx + 15, dy - 4, 1, 1);
          p.rect(dx + 22, dy - 4, 1, 1);
          p.rect(dx + 18, dy - 8, 1, 1);
          p.rect(dx + 18, dy, 1, 1);
          break;
        case "emotion":  // heart
          p.fill(cr, cg, cb, 140);
          p.rect(dx + 15, dy - 6, 3, 3);
          p.rect(dx + 19, dy - 6, 3, 3);
          p.rect(dx + 16, dy - 3, 5, 2);
          p.rect(dx + 17, dy - 1, 3, 1);
          break;
      }
    }

    function drawSpeaker(x, y, fc, side) {
      // Cabinet
      p.noStroke();
      p.fill(15, 15, 22);
      p.rect(x, y, 32, 48);
      p.fill(22, 22, 32);
      p.rect(x + 2, y + 2, 28, 44);

      // Woofer
      p.fill(8, 8, 14);
      p.rect(x + 6, y + 22, 20, 18);
      const pulse = Math.sin(fc * 0.12 + side * 2) * 1.5;
      p.fill(16, 16, 24);
      p.rect(x + 10 + pulse, y + 26 + pulse, 12 - pulse * 2, 10 - pulse * 2);
      p.fill(22, 22, 30);
      p.rect(x + 13, y + 29, 6, 4);

      // Tweeter
      p.fill(8, 8, 14);
      p.rect(x + 9, y + 5, 14, 12);
      p.fill(16, 16, 24);
      p.rect(x + 12, y + 8, 8, 6);

      // LED
      const blink = Math.sin(fc * 0.07 + side * 3) > 0.4;
      p.fill(blink ? 29 : 8, blink ? 185 : 15, blink ? 84 : 8);
      p.rect(x + 14, y + 43, 4, 2);
    }

    function drawVinyl(x, y, fc) {
      // Record
      p.noStroke();
      p.fill(6, 6, 10);
      for (let r = 10; r > 0; r -= 2) {
        p.fill(6 + (10 - r), 6 + (10 - r), 10 + (10 - r));
        p.rect(x - r, y - r, r * 2, r * 2);
      }
      // Label
      p.fill(160, 40, 40);
      p.rect(x - 3, y - 3, 6, 6);
      // Spinning line
      const ang = fc * 0.025;
      const lx = Math.cos(ang) * 8;
      const ly = Math.sin(ang) * 8;
      p.stroke(35, 35, 45);
      p.strokeWeight(1);
      p.line(x, y, x + lx, y + ly);
      p.noStroke();
    }

    function buildEnvironmentBuffer() {
      if (envBuffer) envBuffer.remove();
      envBuffer = p.createGraphics(w, h);
      envBuffer.noSmooth();
      envBuffer.background(8, 8, 12);

      // Scanlines
      for (let y = 0; y < h; y += 3) {
        envBuffer.stroke(0, 0, 0, 12);
        envBuffer.strokeWeight(1);
        envBuffer.line(0, y, w, y);
      }

      drawFloor(envBuffer, w, h);
      drawWall(envBuffer, w, h);

      // Monitors
      const monTypes = ["wave","bars","spectrum","bars","wave"];
      const wallH = h * 0.18;
      const monW = 55, monH = 30;
      const monSpacing = w / 6;
      for (let i = 0; i < 5; i++) {
        const mx = monSpacing * (i + 1) - monW / 2;
        const my = wallH - monH - 18;
        const mw = i === 2 ? 70 : monW;
        drawMonitor(envBuffer, mx, my, mw, monH, monTypes[i], i);
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // ── AGENT CLASS ──
    // ═══════════════════════════════════════════════════════════════════

    class Agent {
      constructor(key, idx) {
        this.key = key;
        this.idx = idx;
        this.meta = AGENTS_META[key];
        this.sprite = SPRITES[key];
        this.x = 0; this.y = 0;
        this.homeX = 0; this.homeY = 0;
        this.stageX = 0; this.stageY = 0;
        this.targetX = 0; this.targetY = 0;
        this.atStation = true;
        this.scale = PX;
        this.targetScale = PX;
        this.pulse = 0;
        this.glowIntensity = 0.5;
        this.targetGlow = 0.5;
        this.bobPhase = Math.random() * Math.PI * 2;
        this.bobSpeed = 0.012 + Math.random() * 0.008;
        this.isWinner = false;
        this.isLoser = false;
        this.scatter = { active: false, vx: 0, vy: 0, timer: 0 };
        this.weight = 0.1;
        this.fireTimer = 0;
      }

      setHomePosition(W, H) {
        const layout = STATION_LAYOUT[this.key];
        this.homeX = W * layout.hx;
        this.homeY = H * layout.hy;
        // Stage positions: fan out around center
        const stageSpread = this.key === "dj" ? 0 : (this.idx - 3) * 28;
        this.stageX = W * 0.5 + stageSpread;
        this.stageY = this.key === "dj" ? H * 0.52 : H * 0.44;
      }

      updateFromData(d) {
        const weights = d.agent_weights || {};
        const debate = d.debate || {};
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
        this.scatter = {
          active: true,
          vx: Math.cos(away) * (5 + Math.random() * 8),
          vy: Math.sin(away) * (5 + Math.random() * 8),
          timer: 50 + Math.floor(Math.random() * 25),
        };
      }

      fire() {
        this.fireTimer = 40;
        this.pulse = 2.0;
        this.atStation = false;
      }

      returnHome() {
        this.atStation = true;
      }

      update() {
        this.bobPhase += this.bobSpeed;

        // Target position
        const tx = this.atStation ? this.homeX : this.stageX;
        const ty = this.atStation ? this.homeY : this.stageY;
        this.targetX = tx;
        this.targetY = ty;

        if (this.scatter.active) {
          this.x += this.scatter.vx;
          this.y += this.scatter.vy;
          this.scatter.vx *= 0.93;
          this.scatter.vy *= 0.93;
          this.scatter.timer--;
          if (this.scatter.timer <= 0) this.scatter.active = false;
        } else {
          const bobY = Math.sin(this.bobPhase) * 3;
          const bobX = Math.cos(this.bobPhase * 0.6) * 1.5;
          this.x += (this.targetX + bobX - this.x) * 0.035;
          this.y += (this.targetY + bobY - this.y) * 0.035;
        }

        this.scale += (this.targetScale - this.scale) * 0.06;
        this.glowIntensity += (this.targetGlow - this.glowIntensity) * 0.05;
        if (this.pulse > 0) this.pulse *= 0.92;
        if (this.fireTimer > 0) this.fireTimer--;

        // Particles
        if (Math.random() < 0.03 * this.glowIntensity) {
          const [cr, cg, cb] = this.meta.color;
          particles.push({
            x: this.x + (Math.random() - 0.5) * 16,
            y: this.y + (Math.random() - 0.5) * 16,
            vx: (Math.random() - 0.5) * 0.8,
            vy: -0.4 - Math.random() * 0.8,
            life: 25 + Math.random() * 20,
            maxLife: 45,
            color: [cr, cg, cb],
            size: 2 + Math.random() * 2,
          });
        }
      }

      draw() {
        const isFiring = this.fireTimer > 0;
        const spriteData = isFiring ? this.sprite.fire : this.sprite.idle;
        const breathe = 1 + Math.sin(this.bobPhase * 2) * 0.025;
        const s = this.scale * breathe + this.pulse * 0.4;

        // Floor shadow
        p.noStroke();
        p.fill(0, 0, 0, 20);
        p.ellipse(this.x, this.y + 18 + s * 2, 22, 6);

        drawSprite(spriteData, this.x, this.y, s, this.meta.color, this.meta.accent, this.glowIntensity + this.pulse, this.isLoser);

        // Name label
        const [cr, cg, cb] = this.meta.color;
        p.fill(cr, cg, cb, this.isLoser ? 70 : 190);
        p.noStroke();
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(8);
        p.textFont("monospace");
        p.text(this.meta.name, this.x, this.y + 24 + this.scale * 2);

        // Weight bar
        const barW = 26, barH = 2;
        const barX = this.x - barW / 2;
        const barY = this.y + 30 + this.scale * 2;
        p.fill(255, 255, 255, 10);
        p.rect(barX, barY, barW, barH, 1);
        p.fill(cr, cg, cb, this.isLoser ? 35 : 120);
        p.rect(barX, barY, barW * this.weight * 3.3, barH, 1);

        // Winner star
        if (this.isWinner && debateRef.current) {
          p.fill(255, 215, 0, 210);
          p.textSize(11);
          p.text("\u2B50", this.x, this.y - 22 - this.scale * 2);
        }

        // Fire ring
        if (isFiring) {
          const t = this.fireTimer / 40;
          p.noFill();
          p.stroke(cr, cg, cb, t * 150);
          p.strokeWeight(2 * t);
          p.circle(this.x, this.y, 45 + (1 - t) * 35);
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // ── P5 LIFECYCLE ──
    // ═══════════════════════════════════════════════════════════════════

    p.setup = () => {
      const c = containerRef.current;
      w = c.offsetWidth;
      h = c.offsetHeight;
      p.createCanvas(w, h);
      p.textFont("monospace");
      p.noSmooth();

      AGENT_KEYS.forEach((key, i) => {
        const agent = new Agent(key, i);
        agent.setHomePosition(w, h);
        agent.x = agent.homeX;
        agent.y = agent.homeY;
        agents.push(agent);
      });

      buildEnvironmentBuffer();
    };

    p.windowResized = () => {
      const c = containerRef.current;
      if (!c) return;
      w = c.offsetWidth;
      h = c.offsetHeight;
      p.resizeCanvas(w, h);
      agents.forEach(a => {
        a.setHomePosition(w, h);
      });
      buildEnvironmentBuffer();
    };

    let lastSkipTime = 0;
    let debateBeamTimer = 0;
    let sequencePhase = 0;
    let sequenceTimer = 0;
    let firingIdx = 0;

    p.draw = () => {
      const fc = p.frameCount;
      const d = dataRef.current;
      const cx = w / 2;
      const consoleY = h * 0.52;

      // ── Layer 1: Static environment (cached) ──
      if (envBuffer) p.image(envBuffer, 0, 0);

      // ── Layer 2: Animated monitor content ──
      const monTypes = ["wave","bars","spectrum","bars","wave"];
      const wallH = h * 0.18;
      const monW = 55, monH = 30;
      const monSpacing = w / 6;
      for (let i = 0; i < 5; i++) {
        const mx = monSpacing * (i + 1) - monW / 2;
        const my = wallH - monH - 18;
        const mw = i === 2 ? 70 : monW;
        drawMonitorContent(mx, my, mw, monH, monTypes[i], fc);
      }

      // ── LED strip ──
      const ledY = wallH - 6;
      drawLEDStrip(p, w * 0.15, ledY, w * 0.7, fc);

      // ── Layer 3: Agent stations/desks (non-DJ) ──
      AGENT_KEYS.forEach((key) => {
        if (key === "dj") return;
        const layout = STATION_LAYOUT[key];
        drawStation(w * layout.hx, h * layout.hy, key);
      });

      // ── Handle skip scatter ──
      const skip = skipRef.current;
      if (skip && skip.time !== lastSkipTime) {
        lastSkipTime = skip.time;
        agents.forEach(a => a.scatter_away(cx, h * 0.42));
        for (let i = 0; i < 70; i++) {
          const ang = Math.random() * Math.PI * 2;
          const spd = 2 + Math.random() * 6;
          particles.push({
            x: cx, y: h * 0.42,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            life: 25 + Math.random() * 35,
            maxLife: 50,
            color: [255, 70, 50],
            size: PX,
          });
        }
      }

      // ── Update agents ──
      agents.forEach(a => {
        a.updateFromData(d);
        a.update();
      });

      // ── Auto-fire sequence ──
      sequenceTimer++;
      if (sequenceTimer % 110 === 0 && sequencePhase === 0) {
        sequencePhase = 1;
        firingIdx = 0;
      }
      if (sequencePhase === 1) {
        if (sequenceTimer % 16 === 0 && firingIdx < 6) {
          agents[firingIdx].fire();
          firingIdx++;
        }
        if (firingIdx >= 6) {
          sequencePhase = 2;
          debateBeamTimer = 80;
          const emo = agents.find(a => a.key === "emotion");
          if (emo) emo.fire();
        }
      }
      if (sequencePhase === 2) {
        debateBeamTimer--;
        if (debateBeamTimer <= 0) {
          const dj = agents.find(a => a.key === "dj");
          if (dj) dj.fire();
          // Return everyone home
          agents.forEach(a => a.returnHome());
          sequenceTimer = 0;
          sequencePhase = 0;
        }
      }

      // ── Connection lines (pixelated dashes) ──
      for (let i = 0; i < agents.length; i++) {
        for (let j = i + 1; j < agents.length; j++) {
          const a1 = agents[i], a2 = agents[j];
          const dist = p.dist(a1.x, a1.y, a2.x, a2.y);
          if (dist < 180) {
            const alpha = p.map(dist, 0, 180, 18, 1);
            p.stroke(29, 185, 84, alpha);
            p.strokeWeight(1);
            const steps = Math.floor(dist / 6);
            for (let s = 0; s < steps; s += 2) {
              const t1 = s / steps;
              const t2 = Math.min((s + 1) / steps, 1);
              p.line(
                p.lerp(a1.x, a2.x, t1), p.lerp(a1.y, a2.y, t1),
                p.lerp(a1.x, a2.x, t2), p.lerp(a1.y, a2.y, t2)
              );
            }
          }
        }
      }

      // ── Debate beams (anchored to console) ──
      if (debateRef.current || sequencePhase === 2) {
        const winner = agents.find(a => a.isWinner);
        const loser = agents.find(a => a.isLoser);
        if (winner && loser) {
          const t = (Math.sin(fc * 0.12) + 1) / 2;
          const [wr, wg, wb] = winner.meta.color;
          const [lr, lg, lb] = loser.meta.color;
          const mx = cx + Math.sin(fc * 0.08) * 6;
          const my = consoleY - 4 + Math.cos(fc * 0.11) * 4;

          // Winner beam (3 pixel thick)
          for (let offset = -PX; offset <= PX; offset += PX) {
            p.stroke(wr, wg, wb, 100 + t * 100);
            p.strokeWeight(PX);
            p.line(winner.x, winner.y + offset, mx, my + offset);
          }
          // Loser beam (thin)
          p.stroke(lr, lg, lb, 35 + t * 35);
          p.strokeWeight(PX);
          p.line(loser.x, loser.y, mx, my);

          // Clash point pixels
          const cs = 5 + Math.sin(fc * 0.25) * 3;
          for (let dy = -cs; dy <= cs; dy += PX) {
            for (let dx = -cs; dx <= cs; dx += PX) {
              if (Math.random() > 0.45) continue;
              p.noStroke();
              p.fill(255, 220, 80, (90 + t * 110) * Math.random());
              p.rect(mx + dx, my + dy, PX, PX);
            }
          }
          if (Math.random() < 0.35) {
            particles.push({
              x: mx, y: my,
              vx: (Math.random() - 0.5) * 3.5,
              vy: (Math.random() - 0.5) * 3.5,
              life: 12 + Math.random() * 12,
              maxLife: 22,
              color: [255, 220, 80],
              size: PX,
            });
          }
        }
      }

      // ── Mixing console ──
      drawConsole(cx, consoleY, fc);

      // ── Vinyls ──
      drawVinyl(cx - 110, consoleY + 12, fc);
      drawVinyl(cx + 110, consoleY + 12, fc);

      // ── Draw agents (z-sorted by y) ──
      const sorted = [...agents].sort((a, b) => a.y - b.y);
      sorted.forEach(a => a.draw());

      // ── Speakers ──
      drawSpeaker(w * 0.04, h * 0.72, fc, 0);
      drawSpeaker(w * 0.92, h * 0.72, fc, 1);
      // Speaker sound particles
      if (fc % 3 === 0) {
        particles.push(
          { x: w * 0.04 + 16, y: h * 0.72 + 20, vx: -0.8, vy: (Math.random() - 0.5) * 0.5, life: 20, maxLife: 20, color: [255, 255, 255], size: 1.5 },
          { x: w * 0.92 + 16, y: h * 0.72 + 20, vx: 0.8, vy: (Math.random() - 0.5) * 0.5, life: 20, maxLife: 20, color: [255, 255, 255], size: 1.5 },
        );
      }

      // ── Particles ──
      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.vy += 0.012;
        pt.life--;
        const alpha = (pt.life / pt.maxLife) * 180;
        p.noStroke();
        p.fill(pt.color[0], pt.color[1], pt.color[2], alpha);
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
    return () => {
      if (p5Ref.current) {
        p5Ref.current.remove();
        p5Ref.current = null;
      }
    };
  }, [sketch]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%", borderRadius: 12, overflow: "hidden" }} />;
}
