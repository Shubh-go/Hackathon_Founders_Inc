// ===== CONTEXT DATA =====

function createBaseContextData() {
  return {
    context: {
      time: { value: "Unknown", interpretation: "pending", confidence: 0.2 },
      weather: { value: "Unknown", interpretation: "pending", confidence: 0.2 },
      location: { value: "Unknown", interpretation: "pending", confidence: 0.2 },
      motion: { value: "Unknown", interpretation: "pending", confidence: 0.2 },
      calendar: { value: "No calendar connected", interpretation: "unavailable", confidence: 0.1 },
      day: { value: "Unknown", interpretation: "pending", confidence: 0.2 },
    },
    emotion: {
      primary_mood: "calibrating",
      energy_level: 0.45,
      emotional_valence: 0.5,
      discovery_openness: 0.5,
      reasoning_trace: "Waiting for live browser context signals.",
    },
    taste_dna: {
      top_genres: ["context-aware"],
      top_artists: ["Derived from Spotify profile"],
    },
    trajectory: {
      current_phase: "context_scan",
      energy_target: 0.5,
      arc: [
        { time: "now", energy: 0.50 },
        { time: "+15m", energy: 0.52 },
        { time: "+30m", energy: 0.50 },
        { time: "+45m", energy: 0.47 },
        { time: "+60m", energy: 0.45 },
      ],
    },
    agent_weights: { time: 0.18, weather: 0.18, location: 0.18, motion: 0.18, calendar: 0.10, day: 0.18 },
    session_memory: { pattern: "Live context will adapt as browser signals change." },
    queue: [],
    debate: {
      winner: "time",
      loser: "calendar",
      resolution: "Live context mode is active. Building agent consensus from browser-derived signals.",
    },
  };
}

function getTimeInterpretation(hour) {
  if (hour < 5) return { label: "deep night", energy: 0.18, valence: 0.36 };
  if (hour < 9) return { label: "early morning", energy: 0.62, valence: 0.58 };
  if (hour < 12) return { label: "morning", energy: 0.66, valence: 0.64 };
  if (hour < 17) return { label: "afternoon", energy: 0.54, valence: 0.68 };
  if (hour < 21) return { label: "evening", energy: 0.46, valence: 0.56 };
  return { label: "late night", energy: 0.28, valence: 0.42 };
}

function getDayInterpretation(dayName) {
  if (dayName === "Saturday" || dayName === "Sunday") {
    return { label: "weekend mode", weight: 0.16, openness: 0.68 };
  }
  if (dayName === "Friday") {
    return { label: "release valve", weight: 0.14, openness: 0.62 };
  }
  return { label: "work rhythm", weight: 0.12, openness: 0.44 };
}

function getWeatherInterpretation(code, temperatureF) {
  if (code == null) {
    return { label: "weather unavailable", mood: 0.5, energy: 0.48 };
  }

  if ([0, 1].includes(code)) {
    return { label: temperatureF >= 75 ? "bright and warm" : "clear and crisp", mood: 0.72, energy: 0.62 };
  }
  if ([2, 3, 45, 48].includes(code)) {
    return { label: "overcast", mood: 0.46, energy: 0.38 };
  }
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) {
    return { label: "rainy", mood: 0.34, energy: 0.28 };
  }
  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return { label: "snowy", mood: 0.4, energy: 0.26 };
  }
  if ([95, 96, 99].includes(code)) {
    return { label: "stormy", mood: 0.22, energy: 0.52 };
  }
  return { label: "mild weather", mood: 0.56, energy: 0.48 };
}

function describeMotion(activityScore, speedMps) {
  if (typeof speedMps === "number" && speedMps > 2.2) {
    return { value: `moving ${speedMps.toFixed(1)}m/s`, interpretation: "high energy", confidence: 0.84, energy: 0.82 };
  }
  if (activityScore > 0.72) {
    return { value: "active browser session", interpretation: "medium-high energy", confidence: 0.72, energy: 0.68 };
  }
  if (activityScore > 0.42) {
    return { value: "light interaction", interpretation: "moderate energy", confidence: 0.64, energy: 0.52 };
  }
  return { value: "mostly still", interpretation: "low energy", confidence: 0.62, energy: 0.26 };
}

function getZonedDateParts(date, timezone) {
  const formatter = new Intl.DateTimeFormat([], {
    weekday: "long",
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
    timeZone: timezone,
  });
  const parts = formatter.formatToParts(date);
  return {
    weekday: parts.find((part) => part.type === "weekday")?.value || "Unknown",
    hour: Number(parts.find((part) => part.type === "hour")?.value || 0),
    minute: parts.find((part) => part.type === "minute")?.value || "00",
  };
}

function formatTime(date, timezone) {
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: timezone,
  }).toLowerCase();
}

function formatCoord(value, positive, negative) {
  const abs = Math.abs(value).toFixed(2);
  return `${abs}°${value >= 0 ? positive : negative}`;
}

function buildLiveLocation(latitude, longitude, timezone) {
  const zoneParts = (timezone || "").split("/");
  const zoneLabel = zoneParts[zoneParts.length - 1]?.replace(/_/g, " ") || "Local";
  return `${zoneLabel} · ${formatCoord(latitude, "N", "S")} ${formatCoord(longitude, "E", "W")}`;
}

export function buildLiveContextData(liveContext = {}) {
  const now = liveContext.now || new Date();
  const timezone = liveContext.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const zonedParts = getZonedDateParts(now, timezone);
  const timeInfo = getTimeInterpretation(zonedParts.hour);
  const dayName = zonedParts.weekday;
  const dayInfo = getDayInterpretation(dayName);
  const motionInfo = describeMotion(liveContext.activityScore || 0.24, liveContext.speedMps);
  const temperatureF = typeof liveContext.temperatureC === "number"
    ? (liveContext.temperatureC * 9) / 5 + 32
    : null;
  const weatherInfo = getWeatherInterpretation(liveContext.weatherCode, temperatureF);

  const locationValue = liveContext.locationLabel
    || (typeof liveContext.latitude === "number" && typeof liveContext.longitude === "number"
      ? buildLiveLocation(liveContext.latitude, liveContext.longitude, liveContext.timezone)
      : "Location permission unavailable");
  const locationInterpretation = liveContext.locationLabel
    ? "personal zone"
    : (typeof liveContext.latitude === "number" ? "precise coordinates" : "permission denied");

  const energyLevel = Math.max(
    0.15,
    Math.min(
      0.9,
      (timeInfo.energy * 0.3)
      + (motionInfo.energy * 0.4)
      + (weatherInfo.energy * 0.2)
      + (dayInfo.weight * 0.6)
    )
  );
  const emotionalValence = Math.max(
    0.12,
    Math.min(0.88, (timeInfo.valence * 0.35) + (weatherInfo.mood * 0.45) + (dayInfo.openness * 0.2))
  );
  const discovery = Math.max(
    0.2,
    Math.min(0.9, (dayInfo.openness * 0.5) + (weatherInfo.mood * 0.15) + ((1 - motionInfo.energy) * 0.35))
  );

  let primaryMood = "balanced";
  if (energyLevel > 0.72) primaryMood = "driven";
  else if (emotionalValence > 0.64) primaryMood = "content";
  else if (emotionalValence < 0.4) primaryMood = "reflective";

  const base = createBaseContextData();
  const timeline = Array.from({ length: 5 }, (_, index) => {
    const pointTime = new Date(now.getTime() + index * 30 * 60 * 1000);
    const slope = Math.max(0.12, Math.min(0.92, energyLevel - (index * 0.05) + (discovery * 0.04)));
    return {
      time: formatTime(pointTime, timezone),
      energy: Number(slope.toFixed(2)),
    };
  });

  const weights = {
    time: 0.19,
    weather: liveContext.weatherCode == null ? 0.1 : 0.18,
    location: typeof liveContext.latitude === "number" ? 0.17 : 0.12,
    motion: 0.2,
    calendar: 0.08,
    day: 0.18,
  };

  let winner = "motion";
  let loser = "calendar";
  if (weatherInfo.mood < 0.4) winner = "weather";
  if (timeInfo.label === "late night" || timeInfo.label === "deep night") winner = "time";
  if (typeof liveContext.latitude !== "number") loser = "location";

  return {
    ...base,
    _liveRaw: {
      ...liveContext,
      now,
      timezone,
    },
    context: {
      time: { value: formatTime(now, timezone), interpretation: timeInfo.label, confidence: 0.98 },
      weather: {
        value: temperatureF == null ? "Weather unavailable" : `${Math.round(temperatureF)}°F · ${weatherInfo.label}`,
        interpretation: weatherInfo.label,
        confidence: liveContext.weatherCode == null ? 0.35 : 0.86,
      },
      location: {
        value: locationValue,
        interpretation: locationInterpretation,
        confidence: typeof liveContext.latitude === "number" ? 0.9 : 0.28,
      },
      motion: {
        value: motionInfo.value,
        interpretation: motionInfo.interpretation,
        confidence: motionInfo.confidence,
      },
      calendar: {
        value: "Calendar not connected",
        interpretation: "neutral signal",
        confidence: 0.15,
      },
      day: { value: dayName, interpretation: dayInfo.label, confidence: 0.98 },
    },
    emotion: {
      primary_mood: primaryMood,
      energy_level: Number(energyLevel.toFixed(2)),
      emotional_valence: Number(emotionalValence.toFixed(2)),
      discovery_openness: Number(discovery.toFixed(2)),
      reasoning_trace:
        `${timeInfo.label} + ${weatherInfo.label} + ${motionInfo.interpretation}. `
        + `${typeof liveContext.latitude === "number" ? "Location confirmed from browser geolocation." : "Location permission unavailable, using timezone fallback."} `
        + `Live context is tuning the mix toward ${primaryMood} energy.`,
    },
    trajectory: {
      current_phase: `${timeInfo.label.replace(/\s+/g, "_")}_live`,
      energy_target: Number(energyLevel.toFixed(2)),
      arc: timeline,
    },
    agent_weights: weights,
    session_memory: {
      pattern: `${dayInfo.label} with ${weatherInfo.label} conditions. Live browser context updated at ${formatTime(now, timezone)}.`,
    },
    debate: {
      winner,
      loser,
      resolution:
        `${winner.toUpperCase()} dominated the current context read. `
        + `${loser.toUpperCase()} contributed the weakest signal, so the mix leans on the strongest live inputs first.`,
    },
  };
}

export const CONTEXTS = {
  fort_mason: {
    context: {
      time:     { value: "11:14pm",           interpretation: "late night",       confidence: 1.0  },
      weather:  { value: "54°F overcast", interpretation: "moody",            confidence: 0.99 },
      location: { value: "Fort Mason",         interpretation: "social venue",     confidence: 0.96 },
      motion:   { value: "stationary 45min",   interpretation: "low energy",       confidence: 0.85 },
      calendar: { value: "free tomorrow",      interpretation: "no curfew",        confidence: 0.90 },
      day:      { value: "Saturday",           interpretation: "weekend mode",     confidence: 1.0  },
    },
    emotion: {
      primary_mood: "reflective",
      energy_level: 0.22,
      emotional_valence: 0.58,
      discovery_openness: 0.45,
      reasoning_trace:
        "Rainy Saturday night, stationary 45 min at Fort Mason. Acoustic indie streak with zero skips — user is deep in a reflective zone. Low energy, moderate positivity, slight openness to discovery but only within the moody lane. Session memory confirms: user always goes acoustic here on late Saturday nights.",
    },
    taste_dna: {
      top_genres: ["indie folk", "alt rock", "dream pop"],
      top_artists: ["Bon Iver", "Phoebe Bridgers", "Radiohead"],
    },
    trajectory: {
      current_phase: "late_night_wind_down",
      energy_target: 0.25,
      arc: [
        { time: "10pm", energy: 0.50 },
        { time: "10:30", energy: 0.42 },
        { time: "11pm", energy: 0.35 },
        { time: "11:30", energy: 0.25 },
        { time: "12am", energy: 0.15 },
      ],
    },
    agent_weights: { time: 0.25, weather: 0.30, location: 0.15, motion: 0.10, calendar: 0.10, day: 0.10 },
    session_memory: { pattern: "last Saturday 11pm skipped all upbeat, leaned acoustic" },
    queue: [
      { title: "Skinny Love", artist: "Bon Iver", reasoning: "Anchors session in acoustic indie mood. Low energy opener matching rainy night context.", source: "library", arc_role: "opener", status: "playing", albumArt: "https://i.scdn.co/image/ab67616d00001e02a2fde2bbc9e9a0709c68f804" },
      { title: "Scott Street", artist: "Phoebe Bridgers", reasoning: "Natural transition, similar emotional register. Keeps reflective lane without dropping energy too fast.", source: "library", arc_role: "sustain", status: "upcoming", albumArt: "https://i.scdn.co/image/ab67616d00001e024b3e67e0f1ae0d1351a673ef" },
      { title: "Pink Moon", artist: "Nick Drake", reasoning: "Discovery pick — sonically adjacent to Bon Iver's acoustic intimacy. Introduces a new voice in familiar territory.", source: "discovery", arc_role: "discovery_moment", status: "upcoming", albumArt: "https://i.scdn.co/image/ab67616d00001e0283e260553ab2ddd469890e35" },
      { title: "Motion Sickness", artist: "Phoebe Bridgers", reasoning: "Return to known artist after discovery moment. Slightly more energy to sustain engagement.", source: "library", arc_role: "sustain", status: "upcoming", albumArt: "https://i.scdn.co/image/ab67616d00001e024b3e67e0f1ae0d1351a673ef" },
      { title: "Holocene", artist: "Bon Iver", reasoning: "Emotional peak of the set. Grand enough to feel like a climax, still introspective.", source: "library", arc_role: "sustain", status: "upcoming", albumArt: "https://i.scdn.co/image/ab67616d00001e02a2fde2bbc9e9a0709c68f804" },
      { title: "abysskiss", artist: "Adrianne Lenker", reasoning: "Second discovery — ultra-quiet folk, perfect wind-down. Adjacent to user's taste DNA.", source: "discovery", arc_role: "cool_down", status: "upcoming", albumArt: "https://i.scdn.co/image/ab67616d00001e0256da8e32e32eb6e68c7b%20tried" },
      { title: "re: stacks", artist: "Bon Iver", reasoning: "Session closer. Quietest track in Bon Iver's catalog. Energy → near-zero. Perfect landing.", source: "library", arc_role: "closer", status: "upcoming", albumArt: "https://i.scdn.co/image/ab67616d00001e02a2fde2bbc9e9a0709c68f804" },
    ],
    debate: {
      winner: "weather",
      loser: "location",
      resolution: "Weather + Time aligned on moody, overriding Location's social-upbeat signal. Session memory confirmed: user always goes moody at Fort Mason late night.",
    },
  },
  gym: {
    context: {
      time: { value: "6:45am", interpretation: "early morning", confidence: 1.0 },
      weather: { value: "62°F clear", interpretation: "crisp, energizing", confidence: 0.98 },
      location: { value: "Equinox Gym", interpretation: "workout venue", confidence: 0.99 },
      motion: { value: "running 8min/mi", interpretation: "high energy", confidence: 0.95 },
      calendar: { value: "standup at 9am", interpretation: "time-boxed", confidence: 0.92 },
      day: { value: "Tuesday", interpretation: "work grind", confidence: 1.0 },
    },
    emotion: {
      primary_mood: "driven",
      energy_level: 0.82,
      emotional_valence: 0.7,
      discovery_openness: 0.3,
      reasoning_trace:
        "Early morning gym session, actively running. High motion signal dominates. User is in a focused, high-energy state. Low discovery openness — wants reliable bangers, not experiments. Calendar pressure means the session is time-boxed.",
    },
    taste_dna: {
      top_genres: ["indie folk", "alt rock", "dream pop"],
      top_artists: ["Bon Iver", "Phoebe Bridgers", "Radiohead"],
    },
    trajectory: {
      current_phase: "workout_peak",
      energy_target: 0.85,
      arc: [
        { time: "6:30", energy: 0.6 },
        { time: "6:45", energy: 0.8 },
        { time: "7:00", energy: 0.9 },
        { time: "7:15", energy: 0.85 },
        { time: "7:30", energy: 0.5 },
      ],
    },
    agent_weights: { time: 0.1, weather: 0.1, location: 0.25, motion: 0.3, calendar: 0.15, day: 0.1 },
    session_memory: { pattern: "gym sessions always high-energy, skips anything below 0.7 energy" },
    queue: [
      { title: "Myxomatosis", artist: "Radiohead", reasoning: "Driving alt-rock energy to match running pace. From user's top artists.", source: "library", arc_role: "opener", status: "playing", albumArt: "https://i.scdn.co/image/ab67616d00001e02c8b444df094279e70d0ed856" },
      { title: "Bodysnatchers", artist: "Radiohead", reasoning: "High BPM, aggressive energy. Sustains workout intensity.", source: "library", arc_role: "sustain", status: "upcoming", albumArt: "https://i.scdn.co/image/ab67616d00001e02c8b444df094279e70d0ed856" },
      { title: "I Will Follow You", artist: "Grizzly Bear", reasoning: "Discovery adjacent to user's alt-rock lane. Uptempo and propulsive.", source: "discovery", arc_role: "discovery_moment", status: "upcoming", albumArt: "https://i.scdn.co/image/ab67616d00001e024e7a369b39c64bdd8ec75e3a" },
      { title: "15 Step", artist: "Radiohead", reasoning: "Peak energy track. Complex rhythm matches running cadence.", source: "library", arc_role: "sustain", status: "upcoming", albumArt: "https://i.scdn.co/image/ab67616d00001e02c8b444df094279e70d0ed856" },
      { title: "Kyoto", artist: "Phoebe Bridgers", reasoning: "Her most upbeat track — fits workout while staying in taste DNA.", source: "library", arc_role: "sustain", status: "upcoming", albumArt: "https://i.scdn.co/image/ab67616d00001e024b3e67e0f1ae0d1351a673ef" },
      { title: "Exit Music", artist: "Radiohead", reasoning: "Cool-down track as session nears end. Still Radiohead, lower energy.", source: "library", arc_role: "cool_down", status: "upcoming", albumArt: "https://i.scdn.co/image/ab67616d00001e02c8b444df094279e70d0ed856" },
    ],
    debate: {
      winner: "motion",
      loser: "weather",
      resolution: "Motion (running) dominates — high-energy signal overrides Weather's mild morning suggestion. Location (gym) reinforces Motion. Calendar adds urgency.",
    },
  },
  home: {
    context: {
      time: { value: "2:30pm", interpretation: "afternoon", confidence: 1.0 },
      weather: { value: "68°F sunny", interpretation: "warm, pleasant", confidence: 0.97 },
      location: { value: "Home", interpretation: "personal space", confidence: 0.99 },
      motion: { value: "light activity", interpretation: "moderate energy", confidence: 0.8 },
      calendar: { value: "nothing until 6pm", interpretation: "open afternoon", confidence: 0.88 },
      day: { value: "Sunday", interpretation: "rest day", confidence: 1.0 },
    },
    emotion: {
      primary_mood: "content",
      energy_level: 0.5,
      emotional_valence: 0.72,
      discovery_openness: 0.7,
      reasoning_trace:
        "Lazy Sunday afternoon at home. Sunny weather, no commitments until evening. User is in a content, open state — perfect for discovery. Moderate energy, high positivity. This is when the user historically explores new music the most.",
    },
    taste_dna: {
      top_genres: ["indie folk", "alt rock", "dream pop"],
      top_artists: ["Bon Iver", "Phoebe Bridgers", "Radiohead"],
    },
    trajectory: {
      current_phase: "afternoon_float",
      energy_target: 0.5,
      arc: [
        { time: "2pm", energy: 0.45 },
        { time: "2:30", energy: 0.5 },
        { time: "3pm", energy: 0.55 },
        { time: "3:30", energy: 0.55 },
        { time: "4pm", energy: 0.5 },
      ],
    },
    agent_weights: { time: 0.15, weather: 0.2, location: 0.15, motion: 0.1, calendar: 0.2, day: 0.2 },
    session_memory: { pattern: "Sunday afternoons at home: most skips are familiar tracks — user wants discovery" },
    queue: [
      { title: "Space Song", artist: "Beach House", reasoning: "Dream pop opener. Matches sunny afternoon energy perfectly. From user's genre taste.", source: "library", arc_role: "opener", status: "playing", albumArt: "https://i.scdn.co/image/ab67616d00001e02a4c4fc76d2e2bbe7c0434654" },
      { title: "Myth", artist: "Beach House", reasoning: "Sustains the dream pop lane. Slightly more energy to match afternoon.", source: "library", arc_role: "sustain", status: "upcoming", albumArt: "https://i.scdn.co/image/ab67616d00001e02a4c4fc76d2e2bbe7c0434654" },
      { title: "Drunk Drivers", artist: "Car Seat Headrest", reasoning: "Discovery — alt rock adjacent to Radiohead, Sunday-appropriate energy.", source: "discovery", arc_role: "discovery_moment", status: "upcoming", albumArt: "https://i.scdn.co/image/ab67616d00001e02d35e857f3236bf0694a02cba" },
      { title: "Two Slow Dancers", artist: "Mitski", reasoning: "Discovery — emotional indie adjacent to Phoebe Bridgers. Beautiful afternoon track.", source: "discovery", arc_role: "discovery_moment", status: "upcoming", albumArt: "https://i.scdn.co/image/ab67616d00001e02f6e6998c8e2e083f1e9ade0b" },
      { title: "Everything In Its Right Place", artist: "Radiohead", reasoning: "Return to familiar artist. Ambient energy matches float phase.", source: "library", arc_role: "sustain", status: "upcoming", albumArt: "https://i.scdn.co/image/ab67616d00001e02c8b444df094279e70d0ed856" },
      { title: "For Emma", artist: "Bon Iver", reasoning: "Gentle closer. Sunday winding into evening. Familiar warmth.", source: "library", arc_role: "closer", status: "upcoming", albumArt: "https://i.scdn.co/image/ab67616d00001e02a2fde2bbc9e9a0709c68f804" },
    ],
    debate: {
      winner: "calendar",
      loser: "motion",
      resolution: "Calendar (open afternoon) + Day (Sunday rest) aligned on relaxed discovery mode. Motion signal was ambiguous — overridden by strong day/calendar consensus.",
    },
  },
  live: createBaseContextData(),
};

export const POST_SKIP_FORT_MASON = {
  ...CONTEXTS.fort_mason,
  agent_weights: { time: 0.2, weather: 0.4, location: 0.08, motion: 0.12, calendar: 0.1, day: 0.1 },
  queue: [
    { title: "Skinny Love", artist: "Bon Iver", reasoning: "Anchors session in acoustic indie mood.", source: "library", arc_role: "opener", status: "playing", albumArt: "https://i.scdn.co/image/ab67616d00001e02a2fde2bbc9e9a0709c68f804" },
    { title: "Pink Moon", artist: "Nick Drake", reasoning: "Weather agent doubled down on moody — more acoustic discovery.", source: "discovery", arc_role: "sustain", status: "upcoming", albumArt: "https://i.scdn.co/image/ab67616d00001e0283e260553ab2ddd469890e35" },
    { title: "The Night We Met", artist: "Lord Huron", reasoning: "Deep moody pick after Location agent demotion. Weather-driven selection.", source: "discovery", arc_role: "sustain", status: "upcoming", albumArt: "https://i.scdn.co/image/ab67616d00001e0286ddf2db8dd20ad8cfbe7bdb" },
    { title: "Holocene", artist: "Bon Iver", reasoning: "Emotional peak — grand and introspective. Safe library pick after purge.", source: "library", arc_role: "sustain", status: "upcoming", albumArt: "https://i.scdn.co/image/ab67616d00001e02a2fde2bbc9e9a0709c68f804" },
    { title: "abysskiss", artist: "Adrianne Lenker", reasoning: "Ultra-quiet folk for deep wind-down. Weather confidence at maximum.", source: "discovery", arc_role: "cool_down", status: "upcoming", albumArt: "https://i.scdn.co/image/ab67616d00001e0256da8e32e32eb6e68c7b%20tried" },
    { title: "re: stacks", artist: "Bon Iver", reasoning: "Session closer. Quietest track. Energy → zero.", source: "library", arc_role: "closer", status: "upcoming", albumArt: "https://i.scdn.co/image/ab67616d00001e02a2fde2bbc9e9a0709c68f804" },
  ],
  debate: {
    winner: "weather",
    loser: "location",
    resolution: "HARD SKIP confirmed Weather's read. Location demoted -0.07. Weather promoted +0.10. Purged social-energy tracks, doubled down on moody acoustic.",
  },
  skip_impact: {
    demoted_agent: "location",
    promoted_agent: "weather",
    queue_action: "purged 2 upbeat tracks, replaced with moody discovery picks",
  },
};

export const AGENT_LABELS = {
  time: "Tempo",
  weather: "Haze",
  location: "Scout",
  motion: "Pulse",
  calendar: "Slate",
  day: "Rhythm",
  emotion: "Core",
  dj: "Maestro",
};

export const AGENT_ICONS = {
  time: "⏰",
  weather: "⛅",
  location: "📍",
  motion: "🏃",
  calendar: "📅",
  day: "📆",
  emotion: "💜",
  dj: "🎵",
};

export const AGENT_COLORS = {
  time: "#FFC83C",
  weather: "#50A0FF",
  location: "#1DB954",
  motion: "#FF7832",
  calendar: "#B4BED2",
  day: "#3CD2C8",
  emotion: "#B478FF",
  dj: "#1DB954",
};

// ── Collaborative context: second user profile ──
export const COLLAB_USER = {
  name: "Alex",
  taste_dna: {
    top_genres: ["alt rock", "electronic", "shoegaze"],
    top_artists: ["Radiohead", "Tame Impala", "Beach House"],
  },
  emotion: { primary_mood: "energized", energy_level: 0.55 },
  context: { location: { value: "Fort Mason" }, time: { value: "11:14pm" } },
};

export const COLLAB_OVERLAP = {
  shared_genres: ["alt rock"],
  shared_artists: ["Radiohead"],
  shared_mood_zone: "moderate introspective",
  merged_energy_target: 0.38,
  merged_queue: [
    { title: "Skinny Love", artist: "Bon Iver", tag: "user1", reasoning: "Anchors Lamitr's acoustic mood" },
    { title: "Everything In Its Right Place", artist: "Radiohead", tag: "both", reasoning: "Shared artist — bridges both profiles" },
    { title: "Space Song", artist: "Beach House", tag: "user2", reasoning: "Alex's dream pop — shared introspective zone" },
    { title: "Scott Street", artist: "Phoebe Bridgers", tag: "user1", reasoning: "Lamitr's reflective lane" },
    { title: "Let It Happen", artist: "Tame Impala", tag: "user2", reasoning: "Alex's psych-rock — energy compromise" },
    { title: "Holocene", artist: "Bon Iver", tag: "both", reasoning: "Both users' taste DNA converges here" },
  ],
};
