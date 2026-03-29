import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import AgentCanvas from "./components/AgentCanvas";
import QueuePanel from "./components/QueuePanel";
import TerminalPanel from "./components/TerminalPanel";
import TrajectoryChart from "./components/TrajectoryChart";
import WeightBars from "./components/WeightBars";
import { CONTEXTS, POST_SKIP_FORT_MASON } from "./data";
import "./App.css";

const CONTEXT_OPTIONS = [
  { key: "fort_mason", label: "Fort Mason", sub: "11:14pm \u00b7 Saturday \u00b7 Overcast", icon: "\uD83C\uDF03" },
  { key: "gym",        label: "Gym",        sub: "6:45am \u00b7 Tuesday \u00b7 Running",    icon: "\uD83C\uDFCB\uFE0F" },
  { key: "home",       label: "Home",       sub: "2:30pm \u00b7 Sunday \u00b7 Sunny",       icon: "\uD83C\uDFE0" },
];

export default function App() {
  const [contextKey, setContextKey] = useState("fort_mason");
  const [showTerminal, setShowTerminal] = useState(false);
  const [skipEvent, setSkipEvent] = useState(null);
  const [hasSkipped, setHasSkipped] = useState(false);
  const [debateActive, setDebateActive] = useState(true);
  const [skipCount, setSkipCount] = useState(0);

  const data = (contextKey === "fort_mason" && hasSkipped)
    ? POST_SKIP_FORT_MASON
    : CONTEXTS[contextKey];

  const handleSkip = useCallback(() => {
    setSkipCount((c) => c + 1);
    setSkipEvent(Date.now());
    setDebateActive(true);
    if (contextKey === "fort_mason") setHasSkipped(true);
    setTimeout(() => setSkipEvent(null), 2000);
  }, [contextKey]);

  const handleContextChange = useCallback((key) => {
    setContextKey(key);
    setHasSkipped(false);
    setSkipCount(0);
    setSkipEvent(Date.now());
    setTimeout(() => setSkipEvent(null), 2000);
  }, []);

  return (
    <div className="app">
      {/* Top Bar */}
      <header className="topbar">
        <div className="topbar-left">
          <div className="logo">
            <span className="logo-pulse" />
            <span className="logo-text">VIBEENGINE</span>
            <span className="logo-badge">MULTI-AGENT</span>
          </div>
        </div>

        <div className="context-switcher">
          {CONTEXT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              className={`ctx-btn ${contextKey === opt.key ? "ctx-btn-active" : ""}`}
              onClick={() => handleContextChange(opt.key)}
            >
              <span className="ctx-icon">{opt.icon}</span>
              <div className="ctx-info">
                <span className="ctx-label">{opt.label}</span>
                <span className="ctx-sub">{opt.sub}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="topbar-right">
          <button
            className={`terminal-toggle ${showTerminal ? "terminal-toggle-active" : ""}`}
            onClick={() => setShowTerminal(!showTerminal)}
          >
            <span className="terminal-icon">{"\u2588"}</span>
            <span>REASONING</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className={`main ${showTerminal ? "main-with-terminal" : ""}`}>
        {/* Left: Canvas + Charts */}
        <div className="left-col">
          <div className="canvas-wrapper">
            <AgentCanvas
              data={data}
              skipEvent={skipEvent}
              debateActive={debateActive}
            />

            {/* Debate overlay */}
            <AnimatePresence mode="wait">
              {data.debate && (
                <motion.div
                  className="debate-overlay"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  key={data.debate.resolution}
                  transition={{ duration: 0.4 }}
                >
                  <span className="debate-label">DEBATE RESOLUTION</span>
                  <span className="debate-text">{data.debate.resolution}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mood pill */}
            <motion.div
              className="mood-pill"
              key={data.emotion?.primary_mood}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <span className="mood-emoji">
                {data.emotion?.primary_mood === "reflective" ? "\uD83C\uDF19" :
                 data.emotion?.primary_mood === "driven" ? "\u26A1" : "\u2600\uFE0F"}
              </span>
              <span className="mood-text">{data.emotion?.primary_mood}</span>
              <span className="mood-divider">|</span>
              <span className="mood-energy">E: {(data.emotion?.energy_level * 100).toFixed(0)}%</span>
              <span className="mood-divider">|</span>
              <span className="mood-energy">V: {(data.emotion?.emotional_valence * 100).toFixed(0)}%</span>
            </motion.div>

            {/* Skip counter */}
            {skipCount > 0 && (
              <motion.div
                className="skip-counter"
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                key={skipCount}
              >
                {skipCount} SKIP{skipCount > 1 ? "S" : ""}
              </motion.div>
            )}
          </div>

          <div className="bottom-charts">
            <TrajectoryChart data={data} />
            <WeightBars data={data} />
          </div>
        </div>

        {/* Right: Queue */}
        <div className="right-col">
          <QueuePanel data={data} onSkip={handleSkip} />
        </div>
      </div>

      {/* Terminal Panel */}
      <AnimatePresence>
        {showTerminal && (
          <TerminalPanel
            data={data}
            visible={showTerminal}
            onClose={() => setShowTerminal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
