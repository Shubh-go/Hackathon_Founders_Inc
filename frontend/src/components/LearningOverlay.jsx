import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const AGENT_NAMES = {
  time: "TEMPO", weather: "HAZE", location: "SCOUT",
  motion: "PULSE", calendar: "SLATE", day: "RHYTHM",
};
const AGENT_HEX = {
  time: "#FFC83C", weather: "#50A0FF", location: "#1DB954",
  motion: "#FF7832", calendar: "#B4BED2", day: "#3CD2C8",
};

// Simulated log lines that type out one at a time
function buildLogLines(beforeData, afterData) {
  const bw = beforeData.agent_weights || {};
  const aw = afterData.agent_weights || {};
  const impact = afterData.skip_impact || {};
  const lines = [];

  lines.push({ text: "SKIP DETECTED — hard_reject (< 5 sec)", color: "#EF4444", delay: 0 });
  lines.push({ text: "Initiating feedback loop...", color: "#888", delay: 300 });
  lines.push({ text: "Logging correction to session memory", color: "#888", delay: 600 });

  // Weight changes
  const keys = ["time", "weather", "location", "motion", "calendar", "day"];
  let delay = 1000;
  keys.forEach((key) => {
    const before = bw[key] || 0;
    const after = aw[key] || 0;
    const diff = after - before;
    if (Math.abs(diff) > 0.01) {
      const sign = diff > 0 ? "+" : "";
      const color = diff > 0 ? "#1DB954" : "#EF4444";
      lines.push({
        text: `${AGENT_NAMES[key]}: ${(before * 100).toFixed(0)}% → ${(after * 100).toFixed(0)}% (${sign}${(diff * 100).toFixed(0)}%)`,
        color,
        delay,
      });
      delay += 250;
    }
  });

  if (impact.promoted_agent) {
    lines.push({
      text: `PROMOTED: ${AGENT_NAMES[impact.promoted_agent] || impact.promoted_agent.toUpperCase()} — signal confirmed by skip`,
      color: "#1DB954",
      delay,
    });
    delay += 300;
  }
  if (impact.demoted_agent) {
    lines.push({
      text: `DEMOTED: ${AGENT_NAMES[impact.demoted_agent] || impact.demoted_agent.toUpperCase()} — signal contradicted by skip`,
      color: "#EF4444",
      delay,
    });
    delay += 300;
  }

  // Reasoning trace comparison
  lines.push({ text: "─── REASONING TRACE COMPARISON ───", color: "#F59E0B", delay });
  delay += 200;
  lines.push({
    text: `BEFORE: "${beforeData.debate?.resolution || "—"}"`,
    color: "#666",
    delay,
  });
  delay += 400;
  lines.push({
    text: `AFTER:  "${afterData.debate?.resolution || "—"}"`,
    color: "#ccc",
    delay,
  });
  delay += 300;

  if (impact.queue_action) {
    lines.push({ text: `QUEUE: ${impact.queue_action}`, color: "#F59E0B", delay });
    delay += 250;
  }

  lines.push({ text: "Session memory updated. Weights persisted.", color: "#1DB954", delay });
  delay += 200;
  lines.push({ text: "Feedback loop complete. Rebuilding queue...", color: "#1DB954", delay });

  return lines;
}

export default function LearningOverlay({ visible, beforeData, afterData, onDone }) {
  const [visibleLines, setVisibleLines] = useState([]);
  const [weightBars, setWeightBars] = useState(null);
  const logRef = useRef(null);
  const timersRef = useRef([]);

  useEffect(() => {
    if (!visible || !beforeData || !afterData) {
      setVisibleLines([]);
      setWeightBars(null);
      return;
    }

    // Clear old timers
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setVisibleLines([]);

    const lines = buildLogLines(beforeData, afterData);

    // Show weight bars after 800ms
    timersRef.current.push(setTimeout(() => {
      setWeightBars({ before: beforeData.agent_weights, after: afterData.agent_weights });
    }, 800));

    // Type out lines
    lines.forEach((line, i) => {
      timersRef.current.push(setTimeout(() => {
        setVisibleLines((prev) => [...prev, line]);
      }, line.delay));
    });

    // Auto-close after all lines + pause
    const totalTime = lines[lines.length - 1].delay + 2500;
    timersRef.current.push(setTimeout(() => {
      if (onDone) onDone();
    }, totalTime));

    return () => timersRef.current.forEach(clearTimeout);
  }, [visible, beforeData, afterData, onDone]);

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [visibleLines]);

  if (!visible) return null;

  const bw = beforeData?.agent_weights || {};
  const aw = afterData?.agent_weights || {};
  const impact = afterData?.skip_impact || {};

  return (
    <motion.div
      style={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerDot} />
          <span style={styles.headerTitle}>LEARNING LAYER — FEEDBACK LOOP</span>
          <span style={styles.headerBadge}>LIVE</span>
        </div>

        <div style={styles.body}>
          {/* Left: Weight comparison */}
          <div style={styles.weightsCol}>
            <div style={styles.sectionTitle}>AGENT WEIGHT CORRECTION</div>
            <AnimatePresence>
              {weightBars && Object.keys(bw).map((key, i) => {
                const before = bw[key] || 0;
                const after = aw[key] || 0;
                const diff = after - before;
                const color = AGENT_HEX[key] || "#888";
                const isPromoted = impact.promoted_agent === key;
                const isDemoted = impact.demoted_agent === key;

                return (
                  <motion.div
                    key={key}
                    style={styles.weightRow}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <span style={{ ...styles.weightLabel, color }}>{AGENT_NAMES[key]}</span>
                    <div style={styles.weightBarGroup}>
                      {/* Before bar */}
                      <div style={styles.barTrack}>
                        <div style={{ ...styles.barBefore, width: `${before * 300}%`, background: color + "40" }} />
                      </div>
                      {/* After bar */}
                      <div style={styles.barTrack}>
                        <motion.div
                          style={{ ...styles.barAfter, background: isDemoted ? "#EF4444" : color }}
                          initial={{ width: `${before * 300}%` }}
                          animate={{ width: `${after * 300}%` }}
                          transition={{ delay: 0.8 + i * 0.15, type: "spring", damping: 15 }}
                        />
                      </div>
                    </div>
                    <span style={styles.weightVals}>
                      <span style={{ color: "#666" }}>{(before * 100).toFixed(0)}</span>
                      <span style={{ color: "#444" }}>{" → "}</span>
                      <motion.span
                        style={{ color: isDemoted ? "#EF4444" : isPromoted ? "#1DB954" : "#ccc", fontWeight: 700 }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 + i * 0.15 }}
                      >
                        {(after * 100).toFixed(0)}%
                      </motion.span>
                    </span>
                    {isPromoted && <span style={styles.promoBadge}>+</span>}
                    {isDemoted && <span style={styles.demoBadge}>-</span>}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Right: Log output */}
          <div style={styles.logCol} ref={logRef}>
            <div style={styles.sectionTitle}>CORRECTION LOG</div>
            {visibleLines.map((line, i) => (
              <motion.div
                key={i}
                style={styles.logLine}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <span style={styles.logTs}>{new Date().toLocaleTimeString("en-US", { hour12: false })}</span>
                <span style={{ ...styles.logText, color: line.color }}>{line.text}</span>
              </motion.div>
            ))}
            <span style={styles.cursor}>_</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.75)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 200,
  },
  container: {
    width: "85%",
    maxWidth: 820,
    maxHeight: "80vh",
    background: "linear-gradient(180deg, #0d0d14 0%, #0a0a10 100%)",
    border: "1px solid #EF444430",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 0 60px rgba(239,68,68,0.1), 0 0 120px rgba(239,68,68,0.05)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 18px",
    borderBottom: "1px solid #ffffff08",
    background: "#EF444408",
  },
  headerDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#EF4444",
    boxShadow: "0 0 8px #EF4444",
    animation: "pulse 1s ease-in-out infinite",
  },
  headerTitle: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 2,
    color: "#EF4444",
    flex: 1,
  },
  headerBadge: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 8,
    fontWeight: 800,
    letterSpacing: 2,
    color: "#fff",
    background: "#EF4444",
    padding: "2px 8px",
    borderRadius: 3,
    animation: "pulse 1s ease-in-out infinite",
  },
  body: {
    display: "flex",
    gap: 1,
    height: "100%",
    maxHeight: "calc(80vh - 50px)",
  },
  weightsCol: {
    flex: "0 0 320px",
    padding: "14px 18px",
    borderRight: "1px solid #ffffff06",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  logCol: {
    flex: 1,
    padding: "14px 18px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  sectionTitle: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 2,
    color: "#F59E0B",
    marginBottom: 6,
  },
  weightRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  weightLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 1,
    width: 56,
  },
  weightBarGroup: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  barTrack: {
    height: 5,
    background: "#ffffff06",
    borderRadius: 3,
    overflow: "hidden",
  },
  barBefore: {
    height: "100%",
    borderRadius: 3,
    opacity: 0.5,
  },
  barAfter: {
    height: "100%",
    borderRadius: 3,
  },
  weightVals: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9,
    width: 65,
    textAlign: "right",
  },
  promoBadge: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    fontWeight: 900,
    color: "#1DB954",
    background: "#1DB95420",
    width: 16,
    height: 16,
    borderRadius: 3,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  demoBadge: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    fontWeight: 900,
    color: "#EF4444",
    background: "#EF444420",
    width: 16,
    height: 16,
    borderRadius: 3,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logLine: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
  },
  logTs: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 8,
    color: "#333",
    flexShrink: 0,
    letterSpacing: 0.5,
    paddingTop: 1,
  },
  logText: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    lineHeight: 1.5,
    wordBreak: "break-word",
  },
  cursor: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    color: "#EF4444",
    animation: "blink 1s step-end infinite",
    marginLeft: 50,
  },
};
