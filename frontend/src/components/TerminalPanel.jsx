import { motion, AnimatePresence } from "framer-motion";

export default function TerminalPanel({ data, visible, onClose }) {
  if (!visible) return null;

  const ctx = data.context || {};
  const emotion = data.emotion || {};
  const weights = data.agent_weights || {};
  const debate = data.debate || {};
  const queue = data.queue || [];
  const memory = data.session_memory || {};
  const skipImpact = data.skip_impact;

  const now = new Date();
  const ts = `${now.getHours().toString().padStart(2,"0")}:${now.getMinutes().toString().padStart(2,"0")}:${now.getSeconds().toString().padStart(2,"0")}`;

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      style={styles.container}
    >
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.termDot1} />
          <span style={styles.termDot2} />
          <span style={styles.termDot3} />
          <span style={styles.headerTitle}>VIBEENGINE // REASONING TRACE</span>
        </div>
        <button style={styles.closeBtn} onClick={onClose}>{"\u2715"}</button>
      </div>

      <div style={styles.body}>
        {/* Context Agents */}
        <Section title="CONTEXT AGENTS" ts={ts} model="gpt-4o-mini" latency="120ms">
          {Object.entries(ctx).map(([key, val]) => (
            <div key={key} style={styles.agentRow}>
              <span style={styles.agentKey}>{key.toUpperCase()}</span>
              <span style={styles.agentVal}>{val.value}</span>
              <span style={styles.agentInterp}>{"\u2192"} {val.interpretation}</span>
              <ConfidenceBar value={val.confidence} />
            </div>
          ))}
        </Section>

        {/* Agent Weights */}
        <Section title="AGENT WEIGHTS" ts={ts} model="internal" latency="2ms">
          {Object.entries(weights).map(([key, val]) => (
            <div key={key} style={styles.weightRow}>
              <span style={styles.weightKey}>{key.toUpperCase()}</span>
              <div style={styles.weightBarOuter}>
                <motion.div
                  style={{
                    ...styles.weightBarInner,
                    background: debate.winner === key ? "#1DB954" : debate.loser === key ? "#EF4444" : "#1DB95480",
                  }}
                  animate={{ width: `${val * 100 * 3}%` }}
                  transition={{ type: "spring", damping: 20 }}
                />
              </div>
              <span style={styles.weightVal}>{(val * 100).toFixed(0)}%</span>
              {debate.winner === key && <span style={styles.winTag}>WIN</span>}
              {debate.loser === key && <span style={styles.loseTag}>LOSE</span>}
            </div>
          ))}
        </Section>

        {/* Emotion Agent */}
        <Section title="EMOTION INFERENCE" ts={ts} model="claude-sonnet-4-6" latency="340ms">
          <div style={styles.emotionGrid}>
            <EmotionStat label="MOOD" value={emotion.primary_mood} />
            <EmotionStat label="ENERGY" value={emotion.energy_level?.toFixed(2)} />
            <EmotionStat label="VALENCE" value={emotion.emotional_valence?.toFixed(2)} />
            <EmotionStat label="DISCOVERY" value={emotion.discovery_openness?.toFixed(2)} />
          </div>
          <div style={styles.trace}>
            <span style={styles.traceLabel}>{"> reasoning_trace:"}</span>
            <span style={styles.traceText}>{emotion.reasoning_trace}</span>
          </div>
        </Section>

        {/* Debate Resolution */}
        <Section title="DEBATE RESOLUTION" ts={ts} model="claude-sonnet-4-6" latency="180ms">
          <div style={styles.debateBox}>
            <span style={styles.debateText}>{debate.resolution}</span>
          </div>
        </Section>

        {/* Skip Impact */}
        {skipImpact && (
          <Section title="SKIP IMPACT" ts={ts} model="internal" latency="5ms" highlight>
            <div style={styles.skipImpactBox}>
              <div style={styles.skipLine}>
                <span style={styles.skipLabel}>{"\u2B07"} DEMOTED:</span>
                <span style={styles.skipDemoted}>{skipImpact.demoted_agent?.toUpperCase()}</span>
              </div>
              <div style={styles.skipLine}>
                <span style={styles.skipLabel}>{"\u2B06"} PROMOTED:</span>
                <span style={styles.skipPromoted}>{skipImpact.promoted_agent?.toUpperCase()}</span>
              </div>
              <div style={styles.skipAction}>{skipImpact.queue_action}</div>
            </div>
          </Section>
        )}

        {/* Queue */}
        <Section title="TRACK QUEUE" ts={ts} model="dj-agent" latency="520ms">
          {queue.map((t, i) => (
            <div key={i} style={styles.trackRow}>
              <span style={styles.trackIdx}>{t.status === "playing" ? "\u25B6" : `${i}`}</span>
              <span style={styles.trackName}>{t.artist} — {t.title}</span>
              <span style={{
                ...styles.trackSource,
                color: t.source === "discovery" ? "#A78BFA" : "#1DB954",
              }}>{t.source}</span>
              <span style={styles.trackArc}>{t.arc_role}</span>
            </div>
          ))}
        </Section>

        {/* Session Memory */}
        {memory.pattern && (
          <Section title="SESSION MEMORY" ts={ts} model="memory-store" latency="8ms">
            <div style={styles.memoryRow}>
              <span style={styles.memoryPattern}>{"\uD83D\uDCBE"} {memory.pattern}</span>
            </div>
          </Section>
        )}
      </div>
    </motion.div>
  );
}

function Section({ title, ts, model, latency, highlight, children }) {
  return (
    <div style={{ ...styles.section, ...(highlight ? styles.sectionHighlight : {}) }}>
      <div style={styles.sectionHeader}>
        <span style={styles.sectionTitle}>{title}</span>
        <span style={styles.sectionMeta}>{ts} | {model} | {latency}</span>
      </div>
      {children}
    </div>
  );
}

function ConfidenceBar({ value }) {
  return (
    <div style={styles.confOuter}>
      <div style={{ ...styles.confInner, width: `${value * 100}%` }} />
      <span style={styles.confText}>{(value * 100).toFixed(0)}%</span>
    </div>
  );
}

function EmotionStat({ label, value }) {
  return (
    <div style={styles.emotionStat}>
      <span style={styles.emotionLabel}>{label}</span>
      <span style={styles.emotionValue}>{value}</span>
    </div>
  );
}

const styles = {
  container: {
    position: "fixed",
    top: 0,
    right: 0,
    width: 420,
    height: "100vh",
    background: "linear-gradient(180deg, #0a0a0f 0%, #0d0d12 100%)",
    borderLeft: "1px solid #1DB95420",
    display: "flex",
    flexDirection: "column",
    zIndex: 100,
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    borderBottom: "1px solid #ffffff10",
    background: "#0a0a0f",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 8 },
  termDot1: { width: 8, height: 8, borderRadius: "50%", background: "#EF4444" },
  termDot2: { width: 8, height: 8, borderRadius: "50%", background: "#F59E0B" },
  termDot3: { width: 8, height: 8, borderRadius: "50%", background: "#22C55E" },
  headerTitle: {
    color: "#1DB954",
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: 700,
    marginLeft: 8,
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#666",
    fontSize: 14,
    cursor: "pointer",
    padding: "4px 8px",
  },
  body: {
    flex: 1,
    overflowY: "auto",
    padding: "12px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  section: {
    padding: "10px 12px",
    background: "#ffffff03",
    border: "1px solid #ffffff06",
    borderRadius: 6,
  },
  sectionHighlight: {
    background: "#EF444410",
    border: "1px solid #EF444430",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    color: "#1DB954",
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 2,
  },
  sectionMeta: {
    color: "#444",
    fontSize: 8,
    letterSpacing: 1,
  },
  agentRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "3px 0",
  },
  agentKey: {
    color: "#1DB954",
    fontSize: 9,
    fontWeight: 700,
    width: 70,
    letterSpacing: 1,
  },
  agentVal: {
    color: "#ccc",
    fontSize: 10,
    width: 100,
  },
  agentInterp: {
    color: "#888",
    fontSize: 9,
    flex: 1,
  },
  confOuter: {
    width: 60,
    height: 4,
    background: "#ffffff10",
    borderRadius: 2,
    position: "relative",
    flexShrink: 0,
  },
  confInner: {
    height: "100%",
    background: "#1DB954",
    borderRadius: 2,
  },
  confText: {
    position: "absolute",
    right: -28,
    top: -3,
    color: "#666",
    fontSize: 8,
  },
  weightRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "3px 0",
  },
  weightKey: {
    color: "#999",
    fontSize: 9,
    fontWeight: 600,
    width: 70,
    letterSpacing: 1,
  },
  weightBarOuter: {
    flex: 1,
    height: 8,
    background: "#ffffff08",
    borderRadius: 4,
    overflow: "hidden",
  },
  weightBarInner: {
    height: "100%",
    borderRadius: 4,
    transition: "width 0.6s ease",
  },
  weightVal: {
    color: "#888",
    fontSize: 9,
    width: 30,
    textAlign: "right",
  },
  winTag: {
    fontSize: 7,
    fontWeight: 800,
    color: "#1DB954",
    background: "#1DB95420",
    padding: "1px 4px",
    borderRadius: 3,
    letterSpacing: 1,
  },
  loseTag: {
    fontSize: 7,
    fontWeight: 800,
    color: "#EF4444",
    background: "#EF444420",
    padding: "1px 4px",
    borderRadius: 3,
    letterSpacing: 1,
  },
  emotionGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 6,
    marginBottom: 8,
  },
  emotionStat: {
    display: "flex",
    justifyContent: "space-between",
    padding: "4px 8px",
    background: "#A78BFA08",
    borderRadius: 4,
  },
  emotionLabel: {
    color: "#A78BFA",
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: 1,
  },
  emotionValue: {
    color: "#ddd",
    fontSize: 10,
    fontWeight: 600,
  },
  trace: {
    padding: "6px 8px",
    background: "#00000040",
    borderRadius: 4,
  },
  traceLabel: {
    color: "#A78BFA",
    fontSize: 8,
    display: "block",
    marginBottom: 4,
  },
  traceText: {
    color: "#999",
    fontSize: 9,
    lineHeight: 1.5,
  },
  debateBox: {
    padding: "6px 8px",
    background: "#F59E0B08",
    border: "1px solid #F59E0B15",
    borderRadius: 4,
  },
  debateText: {
    color: "#F59E0B",
    fontSize: 9,
    lineHeight: 1.5,
  },
  skipImpactBox: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  skipLine: {
    display: "flex",
    gap: 8,
    alignItems: "center",
  },
  skipLabel: {
    color: "#888",
    fontSize: 9,
    fontWeight: 600,
  },
  skipDemoted: {
    color: "#EF4444",
    fontSize: 10,
    fontWeight: 700,
  },
  skipPromoted: {
    color: "#1DB954",
    fontSize: 10,
    fontWeight: 700,
  },
  skipAction: {
    color: "#F59E0B",
    fontSize: 9,
    marginTop: 4,
    fontStyle: "italic",
  },
  trackRow: {
    display: "flex",
    gap: 8,
    padding: "3px 0",
    alignItems: "center",
  },
  trackIdx: {
    color: "#1DB954",
    fontSize: 10,
    width: 16,
  },
  trackName: {
    color: "#ccc",
    fontSize: 9,
    flex: 1,
  },
  trackSource: {
    fontSize: 7,
    fontWeight: 700,
    letterSpacing: 1,
  },
  trackArc: {
    color: "#666",
    fontSize: 7,
    letterSpacing: 1,
  },
  memoryRow: {
    padding: "4px 0",
  },
  memoryPattern: {
    color: "#A78BFA",
    fontSize: 9,
  },
};
