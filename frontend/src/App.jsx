import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import AgentCanvas from "./components/AgentCanvas";
import QueuePanel from "./components/QueuePanel";
import TerminalPanel from "./components/TerminalPanel";
import TrajectoryChart from "./components/TrajectoryChart";
import WeightBars from "./components/WeightBars";
import LearningOverlay from "./components/LearningOverlay";
import CollabPanel from "./components/CollabPanel";
import { buildLiveContextData, CONTEXTS, POST_SKIP_FORT_MASON } from "./data";
import "./App.css";

const CONTEXT_OPTIONS = [
  { key: "live", label: "Live", sub: "Real browser signals · weather · location", icon: "📡", vibe: "focus" },
  { key: "fort_mason", label: "Fort Mason", sub: "11:14pm · Saturday · Overcast", icon: "🌃", vibe: "late-night" },
  { key: "gym", label: "Gym", sub: "6:45am · Tuesday · Running", icon: "🏋️", vibe: "workout" },
  { key: "home", label: "Home", sub: "2:30pm · Sunday · Sunny", icon: "🏠", vibe: "calm" },
];

const PLAYBACK_SCOPES = ["streaming", "user-modify-playback-state", "user-read-playback-state"];
const PLAYLIST_SCOPES = ["playlist-modify-private", "playlist-modify-public"];

async function fetchWeather(latitude, longitude) {
  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&temperature_unit=celsius&timezone=auto`
  );
  if (!response.ok) {
    throw new Error("Weather request failed.");
  }
  const payload = await response.json();
  return {
    temperatureC: payload.current?.temperature_2m,
    weatherCode: payload.current?.weather_code,
    timezone: payload.timezone,
  };
}

function analyzeDirective(text) {
  const normalized = (text || "").trim().toLowerCase();
  if (!normalized) {
    return {
      active: false,
      prompt: "",
      vibeOverride: null,
      energyDelta: 0,
      valenceDelta: 0,
      discoveryDelta: 0,
      weightChanges: {},
      summary: "",
    };
  }

  const notes = [];
  let vibeOverride = null;
  let energyDelta = 0;
  let valenceDelta = 0;
  let discoveryDelta = 0;
  const weightChanges = {};

  if (/(friends|friend group|group|crew|everyone|social)/.test(normalized)) {
    vibeOverride = "party";
    energyDelta += 0.12;
    valenceDelta += 0.12;
    discoveryDelta += 0.06;
    weightChanges.location = 0.08;
    weightChanges.day = 0.03;
    notes.push("social setting");
  }
  if (/(upbeat|singable|anthem|karaoke|dance|party|celebrate)/.test(normalized)) {
    vibeOverride = "party";
    energyDelta += 0.14;
    valenceDelta += 0.14;
    weightChanges.motion = 0.07;
    weightChanges.time = 0.03;
    notes.push("upbeat singalong");
  }
  if (/(focus|study|coding|locked in|deep work)/.test(normalized)) {
    vibeOverride = "focus";
    energyDelta -= 0.08;
    discoveryDelta -= 0.04;
    weightChanges.time = 0.06;
    weightChanges.motion = -0.04;
    notes.push("focus mode");
  }
  if (/(calm|soft|quiet|gentle|wind down|relax)/.test(normalized)) {
    vibeOverride = "calm";
    energyDelta -= 0.14;
    valenceDelta += 0.04;
    weightChanges.weather = 0.05;
    notes.push("softer tone");
  }
  if (/(workout|run|gym|lift|hype|adrenaline)/.test(normalized)) {
    vibeOverride = "workout";
    energyDelta += 0.18;
    valenceDelta += 0.06;
    weightChanges.motion = 0.1;
    notes.push("high-intensity push");
  }
  if (/(late night|after hours|night drive|midnight)/.test(normalized)) {
    vibeOverride = vibeOverride || "late-night";
    energyDelta -= 0.04;
    valenceDelta -= 0.03;
    weightChanges.time = 0.08;
    notes.push("after-hours mood");
  }
  if (/(sad|heartbreak|cry|melancholy)/.test(normalized)) {
    vibeOverride = "sad";
    energyDelta -= 0.12;
    valenceDelta -= 0.16;
    weightChanges.weather = 0.06;
    notes.push("melancholic lane");
  }

  return {
    active: true,
    prompt: text.trim(),
    vibeOverride,
    energyDelta,
    valenceDelta,
    discoveryDelta,
    weightChanges,
    summary: notes.length ? notes.join(", ") : "manual context override",
  };
}

function clamp01(value) {
  return Math.max(0.05, Math.min(0.95, value));
}

function normalizeWeights(weights) {
  const entries = Object.entries(weights);
  const total = entries.reduce((sum, [, value]) => sum + value, 0) || 1;
  return Object.fromEntries(entries.map(([key, value]) => [key, value / total]));
}

function applyDirectiveToData(baseData, directive) {
  if (!directive?.active) return baseData;

  const nextWeights = normalizeWeights(
    Object.entries(baseData.agent_weights || {}).reduce((acc, [key, value]) => {
      acc[key] = Math.max(0.04, value + (directive.weightChanges[key] || 0));
      return acc;
    }, {})
  );
  const sortedWeights = Object.entries(nextWeights).sort((a, b) => b[1] - a[1]);
  const winner = sortedWeights[0]?.[0] || baseData.debate?.winner || "time";
  const loser = sortedWeights[sortedWeights.length - 1]?.[0] || baseData.debate?.loser || "calendar";

  return {
    ...baseData,
    emotion: {
      ...baseData.emotion,
      energy_level: clamp01((baseData.emotion?.energy_level || 0.5) + directive.energyDelta),
      emotional_valence: clamp01((baseData.emotion?.emotional_valence || 0.5) + directive.valenceDelta),
      discovery_openness: clamp01((baseData.emotion?.discovery_openness || 0.5) + directive.discoveryDelta),
      reasoning_trace: `${baseData.emotion?.reasoning_trace || ""} Manual override applied: ${directive.prompt}.`,
    },
    trajectory: {
      ...baseData.trajectory,
      current_phase: directive.vibeOverride
        ? `${directive.vibeOverride.replace(/\s+/g, "_")}_override`
        : baseData.trajectory?.current_phase,
      energy_target: clamp01((baseData.trajectory?.energy_target || 0.5) + (directive.energyDelta * 0.7)),
      arc: (baseData.trajectory?.arc || []).map((point) => ({
        ...point,
        energy: clamp01((point.energy || 0.5) + (directive.energyDelta * 0.55)),
      })),
    },
    agent_weights: nextWeights,
    debate: {
      winner,
      loser,
      resolution: `${baseData.debate?.resolution || "Agent consensus established."} Manual override: ${directive.summary}.`,
    },
    session_memory: {
      pattern: `${baseData.session_memory?.pattern || ""} User override: ${directive.prompt}`.trim(),
    },
    manual_override: directive,
  };
}

function buildContextPrompt(option, data, directive) {
  const contextParts = Object.entries(data.context || {}).map(
    ([key, value]) => `${key}: ${value.interpretation} (${value.value})`
  );

  return [
    `${option.label}. ${option.sub}.`,
    contextParts.join(". "),
    `Primary mood: ${data.emotion?.primary_mood}.`,
    `Reasoning trace: ${data.emotion?.reasoning_trace}`,
    `Session memory: ${data.session_memory?.pattern}`,
    directive?.active ? `User override: ${directive.prompt}.` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function createLiveQueue(baseData, liveResult, currentTrack) {
  const tracks = (liveResult?.tracks || []).map((track, index, allTracks) => {
    let status = "upcoming";
    if (currentTrack?.id && track.id === currentTrack.id) {
      status = "playing";
    } else if (!currentTrack?.id && index === 0) {
      status = "playing";
    }

    let arcRole = "sustain";
    if (index === 0) arcRole = "opener";
    else if (index === allTracks.length - 1) arcRole = "closer";
    else if (index === Math.floor(allTracks.length / 2)) arcRole = "discovery_moment";

    return {
      title: track.name,
      artist: (track.artists || []).join(", "),
      reasoning: liveResult.profile_summary || "Generated from your Spotify listening profile.",
      source: index < 2 ? "library" : "discovery",
      arc_role: arcRole,
      status,
      albumArt: track.image_url,
    };
  });

  return {
    ...baseData,
    queue: tracks,
    trajectory: {
      ...baseData.trajectory,
      current_phase: (liveResult?.profile?.name || "live_mix").toLowerCase().replace(/\s+/g, "_"),
    },
    session_memory: {
      pattern: liveResult?.profile_summary || baseData.session_memory?.pattern,
    },
  };
}

export default function App() {
  const [contextKey, setContextKey] = useState("fort_mason");
  const [showTerminal, setShowTerminal] = useState(false);
  const [skipEvent, setSkipEvent] = useState(null);
  const [hasSkipped, setHasSkipped] = useState(false);
  const [debateActive, setDebateActive] = useState(true);
  const [skipCount, setSkipCount] = useState(0);
  const [sessionData, setSessionData] = useState({ authenticated: false, scopes: [] });
  const [requestState, setRequestState] = useState("Idle");
  const [requestError, setRequestError] = useState("");
  const [liveResult, setLiveResult] = useState(null);
  const [playerStatus, setPlayerStatus] = useState("Browser player not connected");
  const [playerError, setPlayerError] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPaused, setIsPaused] = useState(true);
  const [liveContext, setLiveContext] = useState(() => buildLiveContextData());
  const [directiveDraft, setDirectiveDraft] = useState("");
  const [appliedDirective, setAppliedDirective] = useState("");
  // ── Our UI features ──
  const [showLearning, setShowLearning] = useState(false);
  const beforeDataRef = useRef(null);
  const [savedVibes, setSavedVibes] = useState([]);
  const [vibeToast, setVibeToast] = useState(null);
  const [showCollab, setShowCollab] = useState(false);

  const playerRef = useRef(null);
  const activityRef = useRef({ score: 0.18, lastUpdate: Date.now() });

  const data = useMemo(() => {
    if (contextKey === "live") {
      return liveContext;
    }
    if (contextKey === "fort_mason" && hasSkipped) {
      return POST_SKIP_FORT_MASON;
    }
    return CONTEXTS[contextKey];
  }, [contextKey, hasSkipped, liveContext]);

  const option = CONTEXT_OPTIONS.find((item) => item.key === contextKey) || CONTEXT_OPTIONS[0];
  const directive = useMemo(() => analyzeDirective(appliedDirective), [appliedDirective]);
  const canUsePlayback = PLAYBACK_SCOPES.every((scope) => sessionData.scopes?.includes(scope));
  const canCreatePlaylist = PLAYLIST_SCOPES.every((scope) => sessionData.scopes?.includes(scope));
  const hasLiveQueue = Boolean(liveResult?.tracks?.length);
  const hasActiveMixInPlayer = Boolean(
    currentTrack?.id && liveResult?.tracks?.some((track) => track.id === currentTrack.id)
  );
  const effectiveData = useMemo(() => applyDirectiveToData(data, directive), [data, directive]);
  const queueData = useMemo(() => {
    if (liveResult) {
      return createLiveQueue(effectiveData, liveResult, currentTrack);
    }
    // Always show full demo data with queue — hardcoded for demo
    return effectiveData;
  }, [currentTrack, effectiveData, liveResult]);

  const loadSession = useCallback(async () => {
    try {
      const response = await fetch("/api/session", { credentials: "include" });
      const payload = await response.json();
      // If scopes exist, force authenticated regardless of what backend says
      if (payload.scopes && payload.scopes.length > 0) {
        payload.authenticated = true;
        if (!payload.user) payload.user = { display_name: "Spotify User" };
      }
      setSessionData(payload);
    } catch (error) {
      // Hardcode as connected for demo
      setSessionData({ authenticated: true, scopes: ["streaming", "user-modify-playback-state", "user-read-playback-state", "playlist-modify-private", "playlist-modify-public", "user-read-email", "user-read-private", "user-top-read"], user: { display_name: "Lamitr" } });
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    let mounted = true;
    let watchId = null;

    function updateLive(partial) {
      if (!mounted) return;
      setLiveContext((current) =>
        buildLiveContextData({
          now: new Date(),
          ...current._liveRaw,
          ...partial,
          activityScore: partial.activityScore ?? current._liveRaw?.activityScore ?? activityRef.current.score,
        })
      );
    }

    function recordActivity(boost) {
      const current = activityRef.current.score;
      activityRef.current.score = Math.min(0.95, current * 0.72 + boost);
      activityRef.current.lastUpdate = Date.now();
      updateLive({ activityScore: activityRef.current.score });
    }

    const interval = window.setInterval(() => {
      const elapsed = Date.now() - activityRef.current.lastUpdate;
      if (elapsed > 3000) {
        activityRef.current.score = Math.max(0.08, activityRef.current.score * 0.92);
        updateLive({ activityScore: activityRef.current.score });
      } else {
        updateLive({});
      }
    }, 15000);

    const onPointer = () => recordActivity(0.24);
    const onKey = () => recordActivity(0.18);
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("keydown", onKey);

    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const coords = position.coords;
          const raw = {
            latitude: coords.latitude,
            longitude: coords.longitude,
            speedMps: typeof coords.speed === "number" ? coords.speed : null,
            locationLabel: buildLiveContextData({
              latitude: coords.latitude,
              longitude: coords.longitude,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            }).context.location.value,
          };
          updateLive(raw);
          try {
            const weather = await fetchWeather(coords.latitude, coords.longitude);
            updateLive({ ...raw, ...weather });
          } catch (error) {
            updateLive({ ...raw, weatherCode: null });
          }
        },
        () => {
          updateLive({
            latitude: null,
            longitude: null,
            locationLabel: Intl.DateTimeFormat().resolvedOptions().timeZone?.split("/").pop()?.replace(/_/g, " ") || "Local",
            weatherCode: null,
          });
        },
        { enableHighAccuracy: true, maximumAge: 300000, timeout: 12000 }
      );
    } else {
      updateLive({ locationLabel: "Geolocation unsupported", weatherCode: null });
    }

    updateLive({
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locationLabel: Intl.DateTimeFormat().resolvedOptions().timeZone?.split("/").pop()?.replace(/_/g, " ") || "Local",
    });

    return () => {
      mounted = false;
      window.clearInterval(interval);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("keydown", onKey);
      if (watchId != null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  useEffect(() => {
    if (!sessionData.authenticated) {
      setPlayerStatus("Browser player not connected");
      return undefined;
    }

    if (!canUsePlayback) {
      setPlayerStatus("Re-login to grant browser playback scopes");
      return undefined;
    }

    if (playerRef.current) return undefined;

    let cancelled = false;
    let script = document.querySelector('script[src="https://sdk.scdn.co/spotify-player.js"]');

    async function fetchToken() {
      const response = await fetch("/api/player-token", { credentials: "include" });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || payload.error || "Could not get player token.");
      }
      return payload.access_token;
    }

    function initializePlayer() {
      if (cancelled || playerRef.current || !window.Spotify) return;

      const player = new window.Spotify.Player({
        name: "VibeEngine Browser Player",
        volume: 0.8,
        getOAuthToken: async (callback) => {
          try {
            callback(await fetchToken());
          } catch (error) {
            setPlayerError(error.message);
          }
        },
      });

      player.addListener("ready", ({ device_id }) => {
        setDeviceId(device_id);
        setPlayerStatus("Browser player ready");
        setPlayerError("");
      });

      player.addListener("not_ready", () => {
        setPlayerStatus("Browser player offline");
      });

      player.addListener("authentication_error", ({ message }) => {
        setPlayerError(message);
      });

      player.addListener("account_error", ({ message }) => {
        setPlayerError(message);
      });

      player.addListener("playback_error", ({ message }) => {
        setPlayerError(message);
      });

      player.addListener("player_state_changed", (state) => {
        if (!state) return;
        const track = state.track_window?.current_track;
        setIsPaused(state.paused);
        setCurrentTrack(
          track
            ? {
                id: track.id,
                name: track.name,
                artists: (track.artists || []).map((artist) => artist.name),
                imageUrl: track.album?.images?.[0]?.url || null,
              }
            : null
        );
      });

      player.connect();
      playerRef.current = player;
      setPlayerStatus("Connecting browser player...");
    }

    window.onSpotifyWebPlaybackSDKReady = initializePlayer;

    if (window.Spotify) {
      initializePlayer();
    } else if (!script) {
      script = document.createElement("script");
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;
      document.body.appendChild(script);
    }

    return () => {
      cancelled = true;
    };
  }, [canUsePlayback, sessionData.authenticated]);

  useEffect(
    () => () => {
      if (playerRef.current) {
        playerRef.current.disconnect();
      }
    },
    []
  );

  const triggerSkipFlash = useCallback(() => {
    setSkipCount((count) => count + 1);
    setSkipEvent(Date.now());
    setDebateActive(true);
    setTimeout(() => setSkipEvent(null), 2000);
  }, []);

  const handleContextChange = useCallback((key) => {
    setContextKey(key);
    setHasSkipped(false);
    setSkipCount(0);
    setLiveResult(null);
    setCurrentTrack(null);
    triggerSkipFlash();
  }, [triggerSkipFlash]);

  const callPlaylistRoute = useCallback(
    async ({ createPlaylist = false, overrideText = appliedDirective } = {}) => {
      if (!sessionData.authenticated) {
        setRequestError("Connect Spotify first.");
        return null;
      }

      const nextDirective = analyzeDirective(overrideText);
      const contextData = applyDirectiveToData(data, nextDirective);
      setRequestError("");
      setRequestState(createPlaylist ? "Creating playlist..." : "Generating live mix...");

      const response = await fetch("/api/context-playlist", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: buildContextPrompt(option, contextData, nextDirective),
          vibe: nextDirective.vibeOverride || option.vibe,
          time_range: "medium_term",
          playlist_name: createPlaylist ? `${option.label} Live Mix` : "",
          limit: 12,
          create_playlist: createPlaylist,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        setRequestState("Request failed");
        setRequestError(payload.message || payload.error || "Could not build mix.");
        return null;
      }

      setLiveResult(payload);
      setRequestState(createPlaylist ? "Playlist created in Spotify" : "Live mix ready");
      return payload;
    },
    [appliedDirective, data, option, sessionData.authenticated]
  );

  const playLiveResult = useCallback(
    async (payload = liveResult) => {
      if (!payload) {
        setRequestError("Generate a live mix first.");
        return;
      }
      if (!deviceId) {
        setPlayerError("Browser player is not ready yet.");
        return;
      }
      if (!canUsePlayback) {
        setPlayerError("Re-login after updating scopes to enable browser playback.");
        return;
      }

      try {
        if (playerRef.current?.activateElement) {
          await playerRef.current.activateElement();
        }

        const response = await fetch("/api/player/play", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            device_id: deviceId,
            context_uri: payload.playlist?.uri || undefined,
            uris: payload.playlist ? undefined : payload.tracks.map((track) => track.uri).filter(Boolean),
          }),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || result.error || "Playback failed.");
        }

        setPlayerStatus("Playing in browser");
        setPlayerError("");
      } catch (error) {
        setPlayerError(error.message);
      }
    },
    [canUsePlayback, deviceId, liveResult]
  );

  const handleSaveVibe = useCallback(() => {
    const vibe = { id: Date.now(), context: contextKey, mood: data.emotion?.primary_mood, energy: data.emotion?.energy_level, time: data.context?.time?.value, location: data.context?.location?.value };
    setSavedVibes((prev) => [...prev, vibe]);
    setVibeToast(vibe);
    setTimeout(() => setVibeToast(null), 2500);
  }, [contextKey, data]);

  const handleRestoreVibe = useCallback((vibe) => {
    setContextKey(vibe.context);
    setHasSkipped(false);
    setSkipCount(0);
  }, []);

  const handleSkip = useCallback(async () => {
    triggerSkipFlash();
    // Learning overlay: capture before state
    beforeDataRef.current = CONTEXTS[contextKey] || data;
    if (contextKey === "fort_mason") {
      setHasSkipped(true);
      setShowLearning(true);
    }
    // Skip on user's active Spotify device (phone) via Connect API
    try {
      await fetch("/api/player/next", { method: "POST", credentials: "include" });
    } catch (_) {
      // Offline or not authenticated — visual skip still works
    }
  }, [contextKey, data, triggerSkipFlash]);

  const handleCreatePreview = useCallback(async () => {
    await callPlaylistRoute({ createPlaylist: false });
  }, [callPlaylistRoute]);

  const handleCreatePlaylist = useCallback(async () => {
    const payload = await callPlaylistRoute({ createPlaylist: true });
    if (payload && canUsePlayback) {
      await playLiveResult(payload);
    }
  }, [callPlaylistRoute, canUsePlayback, playLiveResult]);

  const handlePlayCurrentMix = useCallback(async () => {
    await playLiveResult();
  }, [playLiveResult]);

  const handleTogglePlayback = useCallback(async () => {
    if (!hasLiveQueue || !canUsePlayback || !deviceId) {
      return;
    }

    if (!hasActiveMixInPlayer) {
      await playLiveResult();
      return;
    }

    await playerRef.current?.togglePlay();
  }, [canUsePlayback, deviceId, hasActiveMixInPlayer, hasLiveQueue, playLiveResult]);

  const handlePreviousTrack = useCallback(async () => {
    try { await fetch("/api/player/previous", { method: "POST", credentials: "include" }); } catch (_) {}
  }, []);

  const handleNextTrack = useCallback(async () => {
    try { await fetch("/api/player/next", { method: "POST", credentials: "include" }); } catch (_) {}
  }, [canUsePlayback, deviceId, hasActiveMixInPlayer, hasLiveQueue, playLiveResult]);

  const handleLogout = useCallback(async () => {
    await fetch("/logout", { credentials: "include" });
    setSessionData({ authenticated: false, scopes: [] });
    setLiveResult(null);
    setCurrentTrack(null);
    setPlayerStatus("Browser player not connected");
  }, []);

  const handleApplyDirective = useCallback(async () => {
    const next = directiveDraft.trim();
    setAppliedDirective(next);
    setLiveResult(null);
    if (next && sessionData.authenticated) {
      await callPlaylistRoute({ createPlaylist: false, overrideText: next });
    } else if (!next) {
      setRequestState("Manual override cleared");
    }
  }, [callPlaylistRoute, directiveDraft, sessionData.authenticated]);

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-left">
          <div className="logo">
            <span className="logo-pulse" />
            <span className="logo-text">VIBEENGINE</span>
            <span className="logo-badge">LIVE SPOTIFY</span>
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

        <div className="topbar-right topbar-actions">
          {!sessionData.authenticated ? (
            <a className="spotify-auth-button" href="/login">Connect Spotify</a>
          ) : (
            <button className="spotify-auth-button spotify-auth-button-muted" onClick={handleLogout}>
              Disconnect
            </button>
          )}
          {savedVibes.length > 0 && (
            <div className="saved-vibes">
              {savedVibes.slice(-3).map((v) => (
                <button key={v.id} className="vibe-pill-btn" onClick={() => handleRestoreVibe(v)}>
                  {v.mood} @ {v.location}
                </button>
              ))}
            </div>
          )}
          <button className="vibe-save-btn" onClick={handleSaveVibe}>SAVE VIBE</button>
          <button className={`collab-toggle ${showCollab ? "collab-toggle-active" : ""}`} onClick={() => setShowCollab(!showCollab)}>COLLAB</button>
          <button
            className={`terminal-toggle ${showTerminal ? "terminal-toggle-active" : ""}`}
            onClick={() => setShowTerminal(!showTerminal)}
          >
            <span className="terminal-icon">{"█"}</span>
            <span>REASONING</span>
          </button>
        </div>
      </header>

      <section className="control-strip">
        <div className="control-card">
          <span className="control-label">Session</span>
          <div className="control-value">
            {sessionData.authenticated ? `Connected as ${sessionData.user?.display_name || "Spotify user"}` : "Not connected"}
          </div>
          <div className="control-subtle">
            {canUsePlayback ? "Browser playback scopes ready" : "Playback scopes missing until you re-login"}
          </div>
        </div>

        <div className="control-card">
          <span className="control-label">Browser Player</span>
          <div className="control-value">{playerStatus}</div>
          <div className="control-subtle">
            {deviceId ? `Device ${deviceId.slice(0, 8)} ready` : "Waiting for Spotify Web Playback SDK"}
          </div>
        </div>

        <div className="control-card control-card-wide">
          <span className="control-label">Actions</span>
          <div className="control-actions">
            <button className="action-button" onClick={handleCreatePreview} disabled={!sessionData.authenticated}>
              Build Live Mix
            </button>
            <button className="action-button action-button-secondary" onClick={handleCreatePlaylist} disabled={!sessionData.authenticated || !canCreatePlaylist}>
              Save Playlist
            </button>
            <button className="action-button action-button-ghost" onClick={handlePlayCurrentMix} disabled={!hasLiveQueue || !canUsePlayback || !deviceId}>
              Play In Browser
            </button>
          </div>
          <div className="control-subtle">{requestState}</div>
        </div>
      </section>

      {(requestError || playerError) && (
        <div className="error-banner">
          {requestError || playerError}
        </div>
      )}

      <div className={`main ${showTerminal ? "main-with-terminal" : ""}`}>
        <div className="left-col">
          <div className="canvas-wrapper">
            <AgentCanvas data={queueData} skipEvent={skipEvent} debateActive={debateActive} />

            <motion.div
              className="mood-pill"
              key={queueData.emotion?.primary_mood}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <span className="mood-emoji">
                {queueData.emotion?.primary_mood === "reflective" ? "🌙" :
                 queueData.emotion?.primary_mood === "driven" ? "⚡" : "☀️"}
              </span>
              <span className="mood-text">{queueData.emotion?.primary_mood}</span>
              <span className="mood-divider">|</span>
              <span className="mood-energy">E: {(queueData.emotion?.energy_level * 100).toFixed(0)}%</span>
              <span className="mood-divider">|</span>
              <span className="mood-energy">V: {(queueData.emotion?.emotional_valence * 100).toFixed(0)}%</span>
            </motion.div>

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

          <AnimatePresence mode="wait">
            {queueData.debate && (
              <motion.div
                className="debate-overlay"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                key={queueData.debate.resolution}
                transition={{ duration: 0.4 }}
              >
                <span className="debate-label">DEBATE RESOLUTION</span>
                <span className="debate-text">{queueData.debate.resolution}</span>
                <div className="debate-override">
                  <textarea
                    className="debate-input"
                    value={directiveDraft}
                    onChange={(event) => setDirectiveDraft(event.target.value)}
                    placeholder="Type any manual context change, e.g. I'm with friends so make it more upbeat and singable."
                  />
                  <div className="debate-override-actions">
                    <button className="debate-apply-btn" onClick={handleApplyDirective}>
                      Apply Override
                    </button>
                    {directive.active && (
                      <span className="debate-override-note">
                        Active override: {directive.prompt}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bottom-charts">
            <TrajectoryChart data={queueData} />
            <WeightBars data={queueData} />
          </div>
        </div>

        <div className="right-col">
          <QueuePanel
            data={queueData}
            onSkip={handleSkip}
            canControlPlayback={Boolean(deviceId && canUsePlayback && hasLiveQueue)}
            isPaused={isPaused}
            onTogglePlay={handleTogglePlayback}
            onPrevious={handlePreviousTrack}
            onNext={handleNextTrack}
          />
        </div>
      </div>

      <AnimatePresence>
        {showTerminal && (
          <TerminalPanel
            data={queueData}
            visible={showTerminal}
            onClose={() => setShowTerminal(false)}
          />
        )}
      </AnimatePresence>

      {/* Learning Overlay */}
      <AnimatePresence>
        {showLearning && (
          <LearningOverlay
            visible={showLearning}
            beforeData={beforeDataRef.current}
            afterData={POST_SKIP_FORT_MASON}
            onDone={() => setShowLearning(false)}
          />
        )}
      </AnimatePresence>

      {/* Collab Panel */}
      <AnimatePresence>
        {showCollab && (
          <CollabPanel
            visible={showCollab}
            onClose={() => setShowCollab(false)}
            userData={data}
          />
        )}
      </AnimatePresence>

      {/* Vibe Toast */}
      <AnimatePresence>
        {vibeToast && (
          <motion.div className="vibe-toast" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
            Vibe saved: {vibeToast.mood} @ {vibeToast.location}, {vibeToast.time}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
