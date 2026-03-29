import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceDot } from "recharts";

export default function TrajectoryChart({ data }) {
  const arc = data.trajectory?.arc || [];
  const target = data.trajectory?.energy_target || 0;

  const chartData = arc.map((p) => ({
    time: p.time,
    energy: p.energy,
  }));

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>ENERGY TRAJECTORY</span>
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
            <Area
              type="monotone"
              dataKey="energy"
              stroke="#1DB954"
              strokeWidth={2}
              fill="url(#energyGrad)"
              dot={{ fill: "#1DB954", r: 3, strokeWidth: 0 }}
              activeDot={{ fill: "#fff", stroke: "#1DB954", strokeWidth: 2, r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
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
  },
  title: {
    color: "#888",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 2,
    fontFamily: "monospace",
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
};
