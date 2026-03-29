import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SOURCE_BADGE = {
  library:   { bg: "#1DB95422", border: "#1DB954", text: "#1DB954", label: "LIBRARY" },
  discovery: { bg: "#A78BFA22", border: "#A78BFA", text: "#A78BFA", label: "DISCOVERY" },
};

const ARC_ROLE_COLORS = {
  opener:           "#F59E0B",
  sustain:          "#1DB954",
  discovery_moment: "#A78BFA",
  cool_down:        "#60A5FA",
  closer:           "#EF4444",
};

export default function QueuePanel({ data, onSkip }) {
  const queue = data.queue || [];
  const playing = queue.find((t) => t.status === "playing");
  const upcoming = queue.filter((t) => t.status === "upcoming");

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.dot} />
          <span style={styles.headerTitle}>NOW PLAYING</span>
        </div>
        <span style={styles.phase}>{data.trajectory?.current_phase?.replace(/_/g, " ")}</span>
      </div>

      {/* Now Playing */}
      {playing && (
        <div style={styles.nowPlaying}>
          <div style={styles.albumArt}>
            <div style={styles.albumPlaceholder}>
              <span style={{ fontSize: 28 }}>{"\u266B"}</span>
            </div>
            <div style={styles.playingIndicator}>
              {[1,2,3,4].map(i => (
                <motion.div
                  key={i}
                  style={styles.bar}
                  animate={{ height: [4, 12 + Math.random()*8, 4] }}
                  transition={{ repeat: Infinity, duration: 0.6 + Math.random()*0.4, delay: i*0.1 }}
                />
              ))}
            </div>
          </div>
          <div style={styles.trackInfo}>
            <div style={styles.trackTitle}>{playing.title}</div>
            <div style={styles.trackArtist}>{playing.artist}</div>
            <div style={styles.trackReasoning}>{playing.reasoning}</div>
            <div style={styles.badges}>
              <Badge source={playing.source} />
              <ArcBadge role={playing.arc_role} />
            </div>
          </div>
          <button style={styles.skipBtn} onClick={onSkip}>
            <span style={styles.skipIcon}>{"⏭"}</span>
            <span style={styles.skipLabel}>SKIP</span>
          </button>
        </div>
      )}

      {/* Queue */}
      <div style={styles.queueHeader}>
        <span style={styles.queueTitle}>UP NEXT</span>
        <span style={styles.queueCount}>{upcoming.length} tracks</span>
      </div>

      <div style={styles.queueList}>
        <AnimatePresence mode="popLayout">
          {upcoming.map((track, i) => (
            <motion.div
              key={track.title + track.artist}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -80, scale: 0.8, filter: "blur(4px)" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              style={styles.queueItem}
            >
              <div style={styles.queueIdx}>{i + 1}</div>
              <div style={styles.queueTrackInfo}>
                <div style={styles.queueTrackTitle}>{track.title}</div>
                <div style={styles.queueTrackArtist}>{track.artist}</div>
                <div style={styles.queueReasoning}>{track.reasoning}</div>
              </div>
              <div style={styles.queueBadges}>
                <Badge source={track.source} />
                <ArcBadge role={track.arc_role} />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Session Memory */}
      {data.session_memory?.pattern && (
        <div style={styles.memory}>
          <span style={styles.memoryIcon}>{"\uD83E\uDDE0"}</span>
          <span style={styles.memoryText}>{data.session_memory.pattern}</span>
        </div>
      )}
    </div>
  );
}

function Badge({ source }) {
  const s = SOURCE_BADGE[source] || SOURCE_BADGE.library;
  return (
    <span style={{
      ...styles.badge,
      background: s.bg,
      borderColor: s.border,
      color: s.text,
    }}>
      {s.label}
    </span>
  );
}

function ArcBadge({ role }) {
  const color = ARC_ROLE_COLORS[role] || "#888";
  return (
    <span style={{
      ...styles.badge,
      background: color + "18",
      borderColor: color,
      color: color,
    }}>
      {role?.replace(/_/g, " ")}
    </span>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    padding: "16px",
    gap: 12,
    overflowY: "auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 8 },
  dot: {
    width: 8, height: 8, borderRadius: "50%",
    background: "#1DB954",
    boxShadow: "0 0 8px #1DB954",
    animation: "pulse 2s infinite",
  },
  headerTitle: {
    color: "#1DB954",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 2,
    fontFamily: "monospace",
  },
  phase: {
    color: "#666",
    fontSize: 10,
    fontFamily: "monospace",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  nowPlaying: {
    display: "flex",
    gap: 14,
    padding: 14,
    background: "linear-gradient(135deg, #1DB95410, #0a0a0f)",
    border: "1px solid #1DB95430",
    borderRadius: 10,
    alignItems: "center",
  },
  albumArt: { position: "relative", flexShrink: 0 },
  albumPlaceholder: {
    width: 64, height: 64,
    borderRadius: 8,
    background: "linear-gradient(135deg, #1DB95430, #0d0d12)",
    border: "1px solid #1DB95420",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#1DB954",
  },
  playingIndicator: {
    position: "absolute",
    bottom: -6,
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    gap: 2,
    alignItems: "flex-end",
    height: 16,
  },
  bar: {
    width: 3,
    background: "#1DB954",
    borderRadius: 1,
  },
  trackInfo: { flex: 1, minWidth: 0 },
  trackTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: 600,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  trackArtist: {
    color: "#999",
    fontSize: 12,
    marginTop: 2,
  },
  trackReasoning: {
    color: "#666",
    fontSize: 10,
    marginTop: 6,
    lineHeight: 1.4,
    fontFamily: "monospace",
  },
  badges: {
    display: "flex",
    gap: 6,
    marginTop: 8,
    flexWrap: "wrap",
  },
  badge: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 1,
    padding: "2px 6px",
    borderRadius: 4,
    border: "1px solid",
    fontFamily: "monospace",
    textTransform: "uppercase",
  },
  skipBtn: {
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    padding: "10px 14px",
    background: "transparent",
    border: "1px solid #333",
    borderRadius: 8,
    cursor: "pointer",
    transition: "all 0.2s",
    color: "#fff",
  },
  skipIcon: { fontSize: 20 },
  skipLabel: {
    fontSize: 8,
    letterSpacing: 2,
    fontFamily: "monospace",
    color: "#888",
  },
  queueHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  queueTitle: {
    color: "#888",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 2,
    fontFamily: "monospace",
  },
  queueCount: {
    color: "#555",
    fontSize: 10,
    fontFamily: "monospace",
  },
  queueList: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    flex: 1,
    overflowY: "auto",
  },
  queueItem: {
    display: "flex",
    gap: 10,
    padding: "10px 12px",
    background: "#ffffff04",
    border: "1px solid #ffffff08",
    borderRadius: 8,
    alignItems: "flex-start",
  },
  queueIdx: {
    color: "#444",
    fontSize: 14,
    fontWeight: 700,
    fontFamily: "monospace",
    minWidth: 20,
    paddingTop: 2,
  },
  queueTrackInfo: { flex: 1, minWidth: 0 },
  queueTrackTitle: {
    color: "#ddd",
    fontSize: 13,
    fontWeight: 500,
  },
  queueTrackArtist: {
    color: "#888",
    fontSize: 11,
    marginTop: 1,
  },
  queueReasoning: {
    color: "#555",
    fontSize: 9,
    marginTop: 4,
    lineHeight: 1.3,
    fontFamily: "monospace",
  },
  queueBadges: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    flexShrink: 0,
    alignItems: "flex-end",
  },
  memory: {
    display: "flex",
    gap: 8,
    padding: "10px 12px",
    background: "#A78BFA10",
    border: "1px solid #A78BFA20",
    borderRadius: 8,
    alignItems: "center",
    marginTop: "auto",
  },
  memoryIcon: { fontSize: 16 },
  memoryText: {
    color: "#A78BFA",
    fontSize: 10,
    fontFamily: "monospace",
    lineHeight: 1.3,
  },
};
