import { motion, AnimatePresence } from "framer-motion";
import { COLLAB_USER, COLLAB_OVERLAP } from "../data";

const TAG_STYLES = {
  user1:  { bg: "#1DB95418", border: "#1DB954", color: "#1DB954", label: "YOU" },
  user2:  { bg: "#50A0FF18", border: "#50A0FF", color: "#50A0FF", label: "ALEX" },
  both:   { bg: "#F59E0B18", border: "#F59E0B", color: "#F59E0B", label: "BOTH" },
};

export default function CollabPanel({ visible, onClose, userData }) {
  if (!visible) return null;

  const overlap = COLLAB_OVERLAP;
  const collab = COLLAB_USER;
  const userTaste = userData?.taste_dna || {};

  return (
    <motion.div
      style={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        style={styles.container}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
      >
        <div style={styles.header}>
          <span style={styles.headerTitle}>COLLABORATIVE SESSION</span>
          <span style={styles.headerSub}>Merging taste profiles via overlap agent</span>
          <button style={styles.closeBtn} onClick={onClose}>{"\u2715"}</button>
        </div>

        <div style={styles.body}>
          {/* Two profiles + overlap */}
          <div style={styles.profiles}>
            {/* User 1 */}
            <div style={{ ...styles.profileCard, borderColor: "#1DB95430" }}>
              <div style={styles.profileName}>
                <span style={{ ...styles.dot, background: "#1DB954" }} />
                YOU
              </div>
              <div style={styles.profileGenres}>
                {userTaste.top_genres?.map((g) => (
                  <span key={g} style={{ ...styles.genrePill, borderColor: "#1DB95430", color: "#1DB954" }}>{g}</span>
                ))}
              </div>
              <div style={styles.profileArtists}>
                {userTaste.top_artists?.map((a) => (
                  <span key={a} style={styles.artistName}>{a}</span>
                ))}
              </div>
              <div style={styles.moodLine}>
                <span style={styles.moodLabel}>Mood:</span>
                <span style={{ color: "#1DB954" }}>{userData?.emotion?.primary_mood}</span>
              </div>
            </div>

            {/* Overlap zone */}
            <div style={styles.overlapZone}>
              <div style={styles.overlapTitle}>OVERLAP</div>
              <div style={styles.overlapItems}>
                {overlap.shared_genres.map((g) => (
                  <span key={g} style={{ ...styles.genrePill, borderColor: "#F59E0B40", color: "#F59E0B" }}>{g}</span>
                ))}
                {overlap.shared_artists.map((a) => (
                  <span key={a} style={{ ...styles.genrePill, borderColor: "#F59E0B40", color: "#F59E0B" }}>{a}</span>
                ))}
              </div>
              <div style={styles.overlapMood}>
                <span style={styles.moodLabel}>Zone:</span>
                <span style={{ color: "#F59E0B" }}>{overlap.shared_mood_zone}</span>
              </div>
              <div style={styles.overlapMood}>
                <span style={styles.moodLabel}>Energy:</span>
                <span style={{ color: "#F59E0B" }}>{(overlap.merged_energy_target * 100).toFixed(0)}%</span>
              </div>
            </div>

            {/* User 2 */}
            <div style={{ ...styles.profileCard, borderColor: "#50A0FF30" }}>
              <div style={styles.profileName}>
                <span style={{ ...styles.dot, background: "#50A0FF" }} />
                {collab.name.toUpperCase()}
              </div>
              <div style={styles.profileGenres}>
                {collab.taste_dna.top_genres.map((g) => (
                  <span key={g} style={{ ...styles.genrePill, borderColor: "#50A0FF30", color: "#50A0FF" }}>{g}</span>
                ))}
              </div>
              <div style={styles.profileArtists}>
                {collab.taste_dna.top_artists.map((a) => (
                  <span key={a} style={styles.artistName}>{a}</span>
                ))}
              </div>
              <div style={styles.moodLine}>
                <span style={styles.moodLabel}>Mood:</span>
                <span style={{ color: "#50A0FF" }}>{collab.emotion.primary_mood}</span>
              </div>
            </div>
          </div>

          {/* Merged queue */}
          <div style={styles.queueSection}>
            <div style={styles.queueTitle}>MERGED QUEUE</div>
            {overlap.merged_queue.map((t, i) => {
              const tag = TAG_STYLES[t.tag];
              return (
                <motion.div
                  key={i}
                  style={styles.queueRow}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <span style={{ ...styles.tagBadge, background: tag.bg, borderColor: tag.border, color: tag.color }}>
                    {tag.label}
                  </span>
                  <div style={styles.trackInfo}>
                    <span style={styles.trackTitle}>{t.title}</span>
                    <span style={styles.trackArtist}>{t.artist}</span>
                  </div>
                  <span style={styles.trackReason}>{t.reasoning}</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

const styles = {
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200,
  },
  container: {
    width: "88%", maxWidth: 780, maxHeight: "82vh",
    background: "linear-gradient(180deg, #0d0d14 0%, #0a0a10 100%)",
    border: "1px solid #50A0FF25", borderRadius: 12, overflow: "hidden",
    boxShadow: "0 0 40px rgba(80,160,255,0.08)",
  },
  header: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "12px 18px", borderBottom: "1px solid #ffffff08",
    position: "relative",
  },
  headerTitle: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700,
    letterSpacing: 2, color: "#50A0FF",
  },
  headerSub: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: 8,
    color: "#555", letterSpacing: 1, flex: 1,
  },
  closeBtn: {
    background: "none", border: "none", color: "#555", fontSize: 14,
    cursor: "pointer", padding: "4px 8px",
  },
  body: {
    padding: "16px 18px", overflowY: "auto", maxHeight: "calc(82vh - 50px)",
    display: "flex", flexDirection: "column", gap: 16,
  },
  profiles: {
    display: "flex", gap: 10, alignItems: "stretch",
  },
  profileCard: {
    flex: 1, padding: "12px 14px",
    background: "#ffffff03", border: "1px solid",
    borderRadius: 8, display: "flex", flexDirection: "column", gap: 8,
  },
  profileName: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700,
    letterSpacing: 2, color: "#ccc",
    display: "flex", alignItems: "center", gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: "50%" },
  profileGenres: { display: "flex", flexWrap: "wrap", gap: 4 },
  genrePill: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: 8, fontWeight: 600,
    letterSpacing: 1, padding: "2px 6px", borderRadius: 4,
    border: "1px solid", textTransform: "uppercase",
  },
  profileArtists: { display: "flex", flexDirection: "column", gap: 2 },
  artistName: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#888",
  },
  moodLine: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
    display: "flex", gap: 6, marginTop: "auto",
  },
  moodLabel: { color: "#555" },
  overlapZone: {
    flex: "0 0 130px", padding: "12px 10px",
    background: "#F59E0B06", border: "1px solid #F59E0B15",
    borderRadius: 8, display: "flex", flexDirection: "column", gap: 8,
    alignItems: "center", justifyContent: "center",
  },
  overlapTitle: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 800,
    letterSpacing: 2, color: "#F59E0B",
  },
  overlapItems: { display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center" },
  overlapMood: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: 8,
    display: "flex", gap: 4, textAlign: "center",
  },
  queueSection: {
    display: "flex", flexDirection: "column", gap: 6,
  },
  queueTitle: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700,
    letterSpacing: 2, color: "#888",
  },
  queueRow: {
    display: "flex", gap: 10, padding: "8px 10px", alignItems: "center",
    background: "#ffffff03", border: "1px solid #ffffff06", borderRadius: 6,
  },
  tagBadge: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: 7, fontWeight: 800,
    letterSpacing: 1, padding: "2px 6px", borderRadius: 3,
    border: "1px solid", flexShrink: 0,
  },
  trackInfo: { display: "flex", flexDirection: "column", minWidth: 0, flex: "0 0 180px" },
  trackTitle: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#ddd", fontWeight: 500 },
  trackArtist: { fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: "#666" },
  trackReason: { fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: "#555", flex: 1 },
};
