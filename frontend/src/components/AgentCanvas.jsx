import { useRef, useEffect, useCallback } from "react";
import p5 from "p5";

const AGENT_KEYS = ["time", "weather", "location", "motion", "calendar", "day", "emotion", "dj"];
const AGENT_NAMES = {
  time: "TIME", weather: "WEATHER", location: "LOCATION",
  motion: "MOTION", calendar: "CALENDAR", day: "DAY",
  emotion: "EMOTION", dj: "DJ",
};
const AGENT_BASE_COLORS = {
  time:     [29, 185, 84],
  weather:  [30, 215, 96],
  location: [23, 163, 74],
  motion:   [21, 128, 61],
  calendar: [74, 222, 128],
  day:      [134, 239, 172],
  emotion:  [167, 139, 250],
  dj:       [245, 158, 11],
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
    let debateBeams = [];
    let w, h;

    class Agent {
      constructor(key, idx, total) {
        this.key = key;
        this.name = AGENT_NAMES[key];
        this.color = AGENT_BASE_COLORS[key] || [29, 185, 84];
        this.baseAngle = (idx / total) * p.TWO_PI - p.HALF_PI;
        this.orbitRadius = 0;
        this.targetOrbitRadius = 0;
        this.x = 0; this.y = 0;
        this.targetX = 0; this.targetY = 0;
        this.size = 28;
        this.targetSize = 28;
        this.pulse = 0;
        this.glowIntensity = 0.5;
        this.targetGlow = 0.5;
        this.angle = this.baseAngle;
        this.angleSpeed = 0.002 + Math.random() * 0.003;
        this.bobPhase = Math.random() * p.TWO_PI;
        this.bobSpeed = 0.01 + Math.random() * 0.01;
        this.isWinner = false;
        this.isLoser = false;
        this.scatter = { active: false, vx: 0, vy: 0, timer: 0 };
        this.confidence = 0;
        this.weight = 0;
        this.fireTimer = 0;
      }

      updateFromData(d) {
        const weights = d.agent_weights || {};
        const context = d.context || {};
        const debate = d.debate || {};

        if (this.key === "emotion") {
          this.confidence = 1;
          this.weight = 0.15;
        } else if (this.key === "dj") {
          this.confidence = 1;
          this.weight = 0.20;
        } else {
          this.confidence = context[this.key]?.confidence || 0;
          this.weight = weights[this.key] || 0.1;
        }

        this.isWinner = debate.winner === this.key;
        this.isLoser = debate.loser === this.key;

        this.targetSize = 20 + this.weight * 80;
        this.targetGlow = this.isWinner ? 1.0 : this.isLoser ? 0.2 : 0.4 + this.weight;
      }

      setPosition(cx, cy, radius) {
        this.targetOrbitRadius = radius;
        this.targetX = cx + Math.cos(this.angle) * this.targetOrbitRadius;
        this.targetY = cy + Math.sin(this.angle) * this.targetOrbitRadius;
      }

      scatter_away(cx, cy) {
        const away = Math.atan2(this.y - cy, this.x - cx);
        this.scatter = {
          active: true,
          vx: Math.cos(away) * (8 + Math.random() * 12),
          vy: Math.sin(away) * (8 + Math.random() * 12),
          timer: 40 + Math.floor(Math.random() * 20),
        };
      }

      fire() {
        this.fireTimer = 30;
        this.pulse = 1.5;
      }

      update() {
        this.angle += this.angleSpeed;
        this.bobPhase += this.bobSpeed;

        if (this.scatter.active) {
          this.x += this.scatter.vx;
          this.y += this.scatter.vy;
          this.scatter.vx *= 0.94;
          this.scatter.vy *= 0.94;
          this.scatter.timer--;
          if (this.scatter.timer <= 0) this.scatter.active = false;
        } else {
          const bob = Math.sin(this.bobPhase) * 3;
          const tx = this.targetX + bob;
          const ty = this.targetY + Math.cos(this.bobPhase * 0.7) * 2;
          this.x += (tx - this.x) * 0.04;
          this.y += (ty - this.y) * 0.04;
        }

        this.size += (this.targetSize - this.size) * 0.06;
        this.glowIntensity += (this.targetGlow - this.glowIntensity) * 0.05;
        this.orbitRadius += (this.targetOrbitRadius - this.orbitRadius) * 0.04;

        if (this.pulse > 0) this.pulse *= 0.93;
        if (this.fireTimer > 0) this.fireTimer--;

        // Ambient particles
        if (Math.random() < 0.03 * this.glowIntensity) {
          particles.push({
            x: this.x + (Math.random() - 0.5) * this.size,
            y: this.y + (Math.random() - 0.5) * this.size,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5 - 0.5,
            life: 40 + Math.random() * 30,
            maxLife: 40 + Math.random() * 30,
            color: [...this.color],
            size: 2 + Math.random() * 3,
          });
        }
      }

      draw() {
        const glow = this.glowIntensity + this.pulse;
        const [r, g, b] = this.color;

        // Outer glow
        for (let i = 4; i > 0; i--) {
          const a = glow * 25 * (1 - i / 5);
          p.noStroke();
          p.fill(r, g, b, a);
          p.circle(this.x, this.y, this.size * (1.5 + i * 0.6) + this.pulse * 20);
        }

        // Core
        p.fill(r, g, b, 180 + glow * 75);
        p.stroke(r, g, b, 220);
        p.strokeWeight(1.5);
        p.circle(this.x, this.y, this.size + this.pulse * 10);

        // Inner bright core
        p.noStroke();
        p.fill(255, 255, 255, 60 + glow * 80);
        p.circle(this.x, this.y, this.size * 0.4);

        // Label
        p.fill(255, 255, 255, 200);
        p.noStroke();
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(9);
        p.textFont("monospace");
        p.text(this.name, this.x, this.y + this.size * 0.7 + 10);

        // Winner crown / Loser dim overlay
        if (this.isWinner && debateRef.current) {
          p.fill(245, 158, 11, 200);
          p.textSize(14);
          p.text("\u2605", this.x, this.y - this.size * 0.7 - 10);
        }
      }
    }

    p.setup = () => {
      const container = containerRef.current;
      w = container.offsetWidth;
      h = container.offsetHeight;
      p.createCanvas(w, h);
      p.textFont("monospace");

      AGENT_KEYS.forEach((key, i) => {
        agents.push(new Agent(key, i, AGENT_KEYS.length));
      });
    };

    p.windowResized = () => {
      const container = containerRef.current;
      if (!container) return;
      w = container.offsetWidth;
      h = container.offsetHeight;
      p.resizeCanvas(w, h);
    };

    let lastSkipTime = 0;
    let debateBeamTimer = 0;
    let sequencePhase = 0;  // 0=idle, 1=firing agents, 2=debate, 3=resolve
    let sequenceTimer = 0;
    let firingIdx = 0;

    p.draw = () => {
      p.background(10, 10, 15);

      const cx = w / 2;
      const cy = h / 2;
      const radius = Math.min(w, h) * 0.32;
      const d = dataRef.current;

      // Draw subtle grid
      p.stroke(29, 185, 84, 12);
      p.strokeWeight(0.5);
      for (let i = 0; i < w; i += 40) p.line(i, 0, i, h);
      for (let i = 0; i < h; i += 40) p.line(0, i, w, i);

      // Draw orbit ring
      p.noFill();
      p.stroke(29, 185, 84, 20);
      p.strokeWeight(1);
      p.circle(cx, cy, radius * 2);
      p.stroke(29, 185, 84, 10);
      p.circle(cx, cy, radius * 2.5);

      // Center label
      p.fill(29, 185, 84, 100);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(11);
      p.text("VIBEENGINE", cx, cy - 8);
      p.textSize(8);
      p.fill(255, 255, 255, 40);
      p.text("MULTI-AGENT SYSTEM", cx, cy + 6);

      // Handle skip scatter
      const skip = skipRef.current;
      if (skip && skip.time !== lastSkipTime) {
        lastSkipTime = skip.time;
        agents.forEach((a) => a.scatter_away(cx, cy));
        // Burst of particles on skip
        for (let i = 0; i < 60; i++) {
          const angle = Math.random() * p.TWO_PI;
          const speed = 2 + Math.random() * 6;
          particles.push({
            x: cx, y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 30 + Math.random() * 40,
            maxLife: 50,
            color: [29, 185, 84],
            size: 2 + Math.random() * 4,
          });
        }
      }

      // Update agents with data
      agents.forEach((a) => {
        a.updateFromData(d);
        a.setPosition(cx, cy, radius);
        a.update();
      });

      // Auto-fire sequence (looping demo animation)
      sequenceTimer++;
      if (sequenceTimer % 90 === 0 && sequencePhase === 0) {
        sequencePhase = 1;
        firingIdx = 0;
      }
      if (sequencePhase === 1) {
        if (sequenceTimer % 12 === 0 && firingIdx < 6) {
          agents[firingIdx].fire();
          firingIdx++;
        }
        if (firingIdx >= 6) {
          sequencePhase = 2;
          debateBeamTimer = 60;
        }
      }
      if (sequencePhase === 2) {
        debateBeamTimer--;
        if (debateBeamTimer <= 0) {
          sequencePhase = 3;
          // DJ agent resolves
          const djAgent = agents.find(a => a.key === "dj");
          if (djAgent) djAgent.fire();
          sequenceTimer = 0;
          sequencePhase = 0;
        }
      }

      // Draw debate beams (energy clash between winner and loser)
      if (debateRef.current || sequencePhase === 2) {
        const winner = agents.find((a) => a.isWinner);
        const loser = agents.find((a) => a.isLoser);
        if (winner && loser) {
          const t = (Math.sin(p.frameCount * 0.15) + 1) / 2;
          // Beam from winner
          p.stroke(winner.color[0], winner.color[1], winner.color[2], 100 + t * 100);
          p.strokeWeight(2 + t * 3);
          const mx = (winner.x + loser.x) / 2 + Math.sin(p.frameCount * 0.1) * 10;
          const my = (winner.y + loser.y) / 2 + Math.cos(p.frameCount * 0.13) * 10;
          p.line(winner.x, winner.y, mx, my);
          // Beam from loser (weaker)
          p.stroke(loser.color[0], loser.color[1], loser.color[2], 40 + t * 40);
          p.strokeWeight(1 + t);
          p.line(loser.x, loser.y, mx, my);
          // Clash point
          for (let i = 3; i > 0; i--) {
            p.noStroke();
            p.fill(255, 200, 50, (40 - i * 10) * t);
            p.circle(mx, my, 10 + i * 8 + Math.sin(p.frameCount * 0.3) * 5);
          }
          // Clash particles
          if (Math.random() < 0.3) {
            particles.push({
              x: mx, y: my,
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4,
              life: 15 + Math.random() * 15,
              maxLife: 25,
              color: [255, 200, 50],
              size: 2 + Math.random() * 3,
            });
          }
        }
      }

      // Draw connection lines between agents (subtle)
      p.stroke(29, 185, 84, 8);
      p.strokeWeight(0.5);
      for (let i = 0; i < agents.length; i++) {
        for (let j = i + 1; j < agents.length; j++) {
          const d2 = p.dist(agents[i].x, agents[i].y, agents[j].x, agents[j].y);
          if (d2 < radius * 1.5) {
            const alpha = p.map(d2, 0, radius * 1.5, 20, 2);
            p.stroke(29, 185, 84, alpha);
            p.line(agents[i].x, agents[i].y, agents[j].x, agents[j].y);
          }
        }
      }

      // Draw agents
      agents.forEach((a) => a.draw());

      // Draw & update particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.vy += 0.01;
        pt.life--;
        const alpha = (pt.life / pt.maxLife) * 180;
        p.noStroke();
        p.fill(pt.color[0], pt.color[1], pt.color[2], alpha);
        p.circle(pt.x, pt.y, pt.size * (pt.life / pt.maxLife));
        if (pt.life <= 0) particles.splice(i, 1);
      }

      // Limit particles
      if (particles.length > 300) particles.splice(0, particles.length - 300);
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
