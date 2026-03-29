import { motion } from "framer-motion";

const ORDER = ["time", "weather", "location", "motion", "calendar", "day"];

const NAMES = {
  time: "TEMPO", weather: "HAZE", location: "SCOUT",
  motion: "PULSE", calendar: "SLATE", day: "RHYTHM",
};
const COLORS = {
  time: "#FFC83C", weather: "#50A0FF", location: "#1DB954",
  motion: "#FF7832", calendar: "#B4BED2", day: "#3CD2C8",
};

export default function WeightBars({ data }) {
  const weights = data.agent_weights || {};
  const debate = data.debate || {};

  return (
    <div style={styles.container}>
      <div style={styles.title}>AGENT INFLUENCE</div>
      <div style={styles.bars}>
        {ORDER.map((key) => {
          const val = weights[key] || 0;
          const isWinner = debate.winner === key;
          const isLoser = debate.loser === key;
          const baseColor = COLORS[key] || "#1DB954";
          const color = isLoser ? "#EF4444" : baseColor;

          return (
            <div key={key} style={styles.row}>
              <span style={{
                ...styles.label,
                color: isLoser ? "#EF4444" : baseColor,
              }}>
                {NAMES[key]}
              </span>
              <div style={styles.barOuter}>
                <motion.div
                  style={{ ...styles.barInner, background: color, boxShadow: `0 0 8px ${color}40` }}
                  animate={{ width: `${val * 100 * 2.5}%` }}
                  transition={{ type: "spring", damping: 15, stiffness: 100 }}
                />
              </div>
              <span style={styles.val}>{(val * 100).toFixed(0)}%</span>
              {isWinner && <span style={styles.winTag}>WIN</span>}
              {isLoser && <span style={styles.loseTag}>LOSE</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "12px 16px",
    background: "#ffffff03",
    border: "1px solid #ffffff08",
    borderRadius: 10,
  },
  title: {
    color: "#888",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 2,
    fontFamily: "monospace",
    marginBottom: 10,
  },
  bars: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  label: {
    fontSize: 9,
    fontWeight: 700,
    fontFamily: "monospace",
    letterSpacing: 1,
    width: 70,
  },
  barOuter: {
    flex: 1,
    height: 10,
    background: "#ffffff08",
    borderRadius: 5,
    overflow: "hidden",
  },
  barInner: {
    height: "100%",
    borderRadius: 5,
  },
  val: {
    color: "#888",
    fontSize: 10,
    fontFamily: "monospace",
    width: 32,
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
    fontFamily: "monospace",
  },
  loseTag: {
    fontSize: 7,
    fontWeight: 800,
    color: "#EF4444",
    background: "#EF444420",
    padding: "1px 4px",
    borderRadius: 3,
    letterSpacing: 1,
    fontFamily: "monospace",
  },
};
