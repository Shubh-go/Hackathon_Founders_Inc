import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot, ReferenceLine } from "recharts";

const PHASE_LABELS = {
  late_night_wind_down: "WINDING DOWN",
  workout_peak: "PEAK ENERGY",
  afternoon_float: "FLOATING",
};

export default function TrajectoryChart({ data }) {
  const arc = data.trajectory?.arc || [];
  const target = data.trajectory?.energy_target || 0;
  const phase = data.trajectory?.current_phase || "";

  const chartData = arc.map((p, i) => ({
    time: p.time,
    energy: p.energy,
  }));

  // "You are here" — pick the middle point as current position
  const nowIdx = Math.floor(arc.length / 2);
  const nowPoint = arc[nowIdx];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>ENERGY TRAJECTORY</span>
        <span style={styles.phase}>{PHASE_LABELS[phase] || phase.replace(/_/g, " ").toUpperCase()}</span>
        <span style={styles.target}>TARGET: {(target * 100).toFixed(0)}%</span>
      </div>
      <div style={styles.chart}>
        <ResponsiveContainer width="100%" height={100}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1DB954" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#1DB954" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#ffffff08" strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              tick={{ fill: "#555", fontSize: 9, fontFamily: "monospace" }}
              axisLine={{ stroke: "#ffffff10" }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 1]}
              tick={{ fill: "#555", fontSize: 9, fontFamily: "monospace" }}
              axisLine={{ stroke: "#ffffff10" }}
              tickLine={false}
              tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
            />
            <Tooltip
              contentStyle={{
                background: "#0d0d12",
                border: "1px solid #1DB95430",
                borderRadius: 6,
                fontSize: 10,
                fontFamily: "monospace",
                color: "#1DB954",
              }}
              formatter={(v) => [`${(v * 100).toFixed(0)}%`, "Energy"]}
            />
            {/* Target energy line */}
            <ReferenceLine
              y={target}
              stroke="#F59E0B"
              strokeDasharray="4 4"
              strokeOpacity={0.4}
            />
            <Area
              type="monotone"
              dataKey="energy"
              stroke="#1DB954"
              strokeWidth={2}
              fill="url(#energyGrad)"
              dot={{ fill: "#1DB954", r: 3, strokeWidth: 0 }}
              activeDot={{ fill: "#fff", stroke: "#1DB954", strokeWidth: 2, r: 5 }}
            />
            {/* "You are here" marker */}
            {nowPoint && (
              <ReferenceDot
                x={nowPoint.time}
                y={nowPoint.energy}
                r={6}
                fill="#fff"
                stroke="#1DB954"
                strokeWidth={2}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {/* "You are here" label */}
      <div style={styles.nowLabel}>
        <span style={styles.nowDot} />
        <span style={styles.nowText}>YOU ARE HERE</span>
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
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  title: {
    color: "#888",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 2,
    fontFamily: "monospace",
  },
  phase: {
    color: "#F59E0B",
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: 1,
    fontFamily: "monospace",
    background: "#F59E0B15",
    padding: "2px 6px",
    borderRadius: 3,
  },
  target: {
    color: "#1DB954",
    fontSize: 9,
    fontFamily: "monospace",
    letterSpacing: 1,
  },
  chart: {
    width: "100%",
  },
  nowLabel: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    justifyContent: "center",
  },
  nowDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#fff",
    border: "2px solid #1DB954",
  },
  nowText: {
    fontFamily: "monospace",
    fontSize: 7,
    fontWeight: 700,
    letterSpacing: 2,
    color: "#1DB954",
  },
};
