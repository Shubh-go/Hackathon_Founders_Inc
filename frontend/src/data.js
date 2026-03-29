// ===== HARDCODED DEMO DATA — swap to live API later =====

export const CONTEXTS = {
  fort_mason: {
    context: {
      time:     { value: "11:14pm",           interpretation: "late night",       confidence: 1.0  },
      weather:  { value: "54\u00b0F overcast", interpretation: "moody",            confidence: 0.99 },
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
      { title: "Skinny Love",        artist: "Bon Iver",          reasoning: "Anchors session in acoustic indie mood. Low energy opener matching rainy night context.",     source: "library",   arc_role: "opener",           status: "playing",  bpm: 138, key: "Dm", energy: 0.28, transition_score: null },
      { title: "Scott Street",       artist: "Phoebe Bridgers",   reasoning: "Natural transition, similar emotional register. Keeps reflective lane without dropping energy too fast.", source: "library",   arc_role: "sustain",          status: "upcoming", bpm: 132, key: "Am", energy: 0.25, transition_score: 92 },
      { title: "Pink Moon",          artist: "Nick Drake",         reasoning: "Discovery pick — sonically adjacent to Bon Iver's acoustic intimacy. Introduces a new voice in familiar territory.", source: "discovery", arc_role: "discovery_moment",  status: "upcoming", bpm: 118, key: "Dm", energy: 0.20, transition_score: 85 },
      { title: "Motion Sickness",    artist: "Phoebe Bridgers",   reasoning: "Return to known artist after discovery moment. Slightly more energy to sustain engagement.", source: "library",   arc_role: "sustain",          status: "upcoming", bpm: 126, key: "Em", energy: 0.32, transition_score: 78 },
      { title: "Holocene",           artist: "Bon Iver",          reasoning: "Emotional peak of the set. Grand enough to feel like a climax, still introspective.", source: "library",   arc_role: "sustain",          status: "upcoming", bpm: 120, key: "Dm", energy: 0.30, transition_score: 88 },
      { title: "abysskiss",          artist: "Adrianne Lenker",   reasoning: "Second discovery — ultra-quiet folk, perfect wind-down. Adjacent to user's taste DNA.", source: "discovery", arc_role: "cool_down",        status: "upcoming", bpm: 96, key: "Am", energy: 0.15, transition_score: 81 },
      { title: "re: stacks",         artist: "Bon Iver",          reasoning: "Session closer. Quietest track in Bon Iver's catalog. Energy → near-zero. Perfect landing.", source: "library",   arc_role: "closer",           status: "upcoming", bpm: 84, key: "Dm", energy: 0.08, transition_score: 94 },
    ],
    debate: {
      winner: "weather",
      loser: "location",
      resolution: "Weather + Time aligned on moody, overriding Location's social-upbeat signal. Session memory confirmed: user always goes moody at Fort Mason late night.",
    },
  },

  gym: {
    context: {
      time:     { value: "6:45am",             interpretation: "early morning",    confidence: 1.0  },
      weather:  { value: "62\u00b0F clear",    interpretation: "crisp, energizing", confidence: 0.98 },
      location: { value: "Equinox Gym",        interpretation: "workout venue",    confidence: 0.99 },
      motion:   { value: "running 8min/mi",    interpretation: "high energy",      confidence: 0.95 },
      calendar: { value: "standup at 9am",     interpretation: "time-boxed",       confidence: 0.92 },
      day:      { value: "Tuesday",            interpretation: "work grind",       confidence: 1.0  },
    },
    emotion: {
      primary_mood: "driven",
      energy_level: 0.82,
      emotional_valence: 0.70,
      discovery_openness: 0.30,
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
        { time: "6:30", energy: 0.60 },
        { time: "6:45", energy: 0.80 },
        { time: "7:00", energy: 0.90 },
        { time: "7:15", energy: 0.85 },
        { time: "7:30", energy: 0.50 },
      ],
    },
    agent_weights: { time: 0.10, weather: 0.10, location: 0.25, motion: 0.30, calendar: 0.15, day: 0.10 },
    session_memory: { pattern: "gym sessions always high-energy, skips anything below 0.7 energy" },
    queue: [
      { title: "Myxomatosis",       artist: "Radiohead",         reasoning: "Driving alt-rock energy to match running pace. From user's top artists.", source: "library",   arc_role: "opener",           status: "playing",  albumArt: "https://i.scdn.co/image/ab67616d00001e02c8b444df094279e70d0ed856" },
      { title: "Bodysnatchers",     artist: "Radiohead",         reasoning: "High BPM, aggressive energy. Sustains workout intensity.",              source: "library",   arc_role: "sustain",          status: "upcoming", albumArt: "https://i.scdn.co/image/ab67616d00001e02c8b444df094279e70d0ed856" },
      { title: "I Will Follow You", artist: "Grizzly Bear",      reasoning: "Discovery adjacent to user's alt-rock lane. Uptempo and propulsive.",   source: "discovery", arc_role: "discovery_moment",  status: "upcoming", albumArt: "https://i.scdn.co/image/ab67616d00001e024e7a369b39c64bdd8ec75e3a" },
      { title: "15 Step",           artist: "Radiohead",         reasoning: "Peak energy track. Complex rhythm matches running cadence.",            source: "library",   arc_role: "sustain",          status: "upcoming", albumArt: "https://i.scdn.co/image/ab67616d00001e02c8b444df094279e70d0ed856" },
      { title: "Kyoto",             artist: "Phoebe Bridgers",   reasoning: "Her most upbeat track — fits workout while staying in taste DNA.",      source: "library",   arc_role: "sustain",          status: "upcoming", albumArt: "https://i.scdn.co/image/ab67616d00001e024b3e67e0f1ae0d1351a673ef" },
      { title: "Exit Music",        artist: "Radiohead",         reasoning: "Cool-down track as session nears end. Still Radiohead, lower energy.", source: "library",   arc_role: "cool_down",        status: "upcoming", albumArt: "https://i.scdn.co/image/ab67616d00001e02c8b444df094279e70d0ed856" },
    ],
    debate: {
      winner: "motion",
      loser: "weather",
      resolution: "Motion (running) dominates — high-energy signal overrides Weather's mild morning suggestion. Location (gym) reinforces Motion. Calendar adds urgency.",
    },
  },

  home: {
    context: {
      time:     { value: "2:30pm",              interpretation: "afternoon",        confidence: 1.0  },
      weather:  { value: "68\u00b0F sunny",     interpretation: "warm, pleasant",   confidence: 0.97 },
      location: { value: "Home",                interpretation: "personal space",   confidence: 0.99 },
      motion:   { value: "light activity",      interpretation: "moderate energy",  confidence: 0.80 },
      calendar: { value: "nothing until 6pm",   interpretation: "open afternoon",   confidence: 0.88 },
      day:      { value: "Sunday",              interpretation: "rest day",         confidence: 1.0  },
    },
    emotion: {
      primary_mood: "content",
      energy_level: 0.50,
      emotional_valence: 0.72,
      discovery_openness: 0.70,
      reasoning_trace:
        "Lazy Sunday afternoon at home. Sunny weather, no commitments until evening. User is in a content, open state — perfect for discovery. Moderate energy, high positivity. This is when the user historically explores new music the most.",
    },
    taste_dna: {
      top_genres: ["indie folk", "alt rock", "dream pop"],
      top_artists: ["Bon Iver", "Phoebe Bridgers", "Radiohead"],
    },
    trajectory: {
      current_phase: "afternoon_float",
      energy_target: 0.50,
      arc: [
        { time: "2pm", energy: 0.45 },
        { time: "2:30", energy: 0.50 },
        { time: "3pm", energy: 0.55 },
        { time: "3:30", energy: 0.55 },
        { time: "4pm", energy: 0.50 },
      ],
    },
    agent_weights: { time: 0.15, weather: 0.20, location: 0.15, motion: 0.10, calendar: 0.20, day: 0.20 },
    session_memory: { pattern: "Sunday afternoons at home: most skips are familiar tracks — user wants discovery" },
    queue: [
      { title: "Space Song",        artist: "Beach House",       reasoning: "Dream pop opener. Matches sunny afternoon energy perfectly. From user's genre taste.", source: "library",   arc_role: "opener",           status: "playing",  albumArt: "https://i.scdn.co/image/ab67616d00001e02a4c4fc76d2e2bbe7c0434654" },
      { title: "Myth",              artist: "Beach House",       reasoning: "Sustains the dream pop lane. Slightly more energy to match afternoon.",              source: "library",   arc_role: "sustain",          status: "upcoming", albumArt: "https://i.scdn.co/image/ab67616d00001e02a4c4fc76d2e2bbe7c0434654" },
      { title: "Drunk Drivers",     artist: "Car Seat Headrest", reasoning: "Discovery — alt rock adjacent to Radiohead, Sunday-appropriate energy.",             source: "discovery", arc_role: "discovery_moment",  status: "upcoming", albumArt: "https://i.scdn.co/image/ab67616d00001e02d35e857f3236bf0694a02cba" },
      { title: "Two Slow Dancers",  artist: "Mitski",            reasoning: "Discovery — emotional indie adjacent to Phoebe Bridgers. Beautiful afternoon track.", source: "discovery", arc_role: "discovery_moment",  status: "upcoming", albumArt: "https://i.scdn.co/image/ab67616d00001e02f6e6998c8e2e083f1e9ade0b" },
      { title: "Everything In Its Right Place", artist: "Radiohead", reasoning: "Return to familiar artist. Ambient energy matches float phase.",              source: "library",   arc_role: "sustain",          status: "upcoming", albumArt: "https://i.scdn.co/image/ab67616d00001e02c8b444df094279e70d0ed856" },
      { title: "For Emma",          artist: "Bon Iver",          reasoning: "Gentle closer. Sunday winding into evening. Familiar warmth.",                       source: "library",   arc_role: "closer",           status: "upcoming", albumArt: "https://i.scdn.co/image/ab67616d00001e02a2fde2bbc9e9a0709c68f804" },
    ],
    debate: {
      winner: "calendar",
      loser: "motion",
      resolution: "Calendar (open afternoon) + Day (Sunday rest) aligned on relaxed discovery mode. Motion signal was ambiguous — overridden by strong day/calendar consensus.",
    },
  },
};

// Post-skip data for Fort Mason scenario
export const POST_SKIP_FORT_MASON = {
  ...CONTEXTS.fort_mason,
  agent_weights: { time: 0.20, weather: 0.40, location: 0.08, motion: 0.12, calendar: 0.10, day: 0.10 },
  queue: [
    { title: "Skinny Love",       artist: "Bon Iver",          reasoning: "Anchors session in acoustic indie mood.",                                     source: "library",   arc_role: "opener",           status: "playing",  albumArt: "https://i.scdn.co/image/ab67616d00001e02a2fde2bbc9e9a0709c68f804" },
    { title: "Pink Moon",         artist: "Nick Drake",         reasoning: "Weather agent doubled down on moody — more acoustic discovery.",              source: "discovery", arc_role: "sustain",          status: "upcoming", albumArt: "https://i.scdn.co/image/ab67616d00001e0283e260553ab2ddd469890e35" },
    { title: "The Night We Met",  artist: "Lord Huron",         reasoning: "Deep moody pick after Location agent demotion. Weather-driven selection.",    source: "discovery", arc_role: "sustain",          status: "upcoming", albumArt: "https://i.scdn.co/image/ab67616d00001e0286ddf2db8dd20ad8cfbe7bdb" },
    { title: "Holocene",          artist: "Bon Iver",          reasoning: "Emotional peak — grand and introspective. Safe library pick after purge.",     source: "library",   arc_role: "sustain",          status: "upcoming", albumArt: "https://i.scdn.co/image/ab67616d00001e02a2fde2bbc9e9a0709c68f804" },
    { title: "abysskiss",         artist: "Adrianne Lenker",   reasoning: "Ultra-quiet folk for deep wind-down. Weather confidence at maximum.",          source: "discovery", arc_role: "cool_down",        status: "upcoming", albumArt: "https://i.scdn.co/image/ab67616d00001e0256da8e32e32eb6e68c7b tried" },
    { title: "re: stacks",        artist: "Bon Iver",          reasoning: "Session closer. Quietest track. Energy → zero.",                              source: "library",   arc_role: "closer",           status: "upcoming", albumArt: "https://i.scdn.co/image/ab67616d00001e02a2fde2bbc9e9a0709c68f804" },
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
  time: "\u23f0",
  weather: "\u26c5",
  location: "\ud83d\udccd",
  motion: "\ud83c\udfc3",
  calendar: "\ud83d\udcc5",
  day: "\ud83d\udcc6",
  emotion: "\ud83d\udc9c",
  dj: "\ud83c\udfb5",
};

export const AGENT_COLORS = {
  time:     "#FFC83C",
  weather:  "#50A0FF",
  location: "#1DB954",
  motion:   "#FF7832",
  calendar: "#B4BED2",
  day:      "#3CD2C8",
  emotion:  "#B478FF",
  dj:       "#1DB954",
};

// ── Collaborative context: second user profile ──
export const COLLAB_USER = {
  name: "Alex",
  taste_dna: {
    top_genres: ["alt rock", "electronic", "shoegaze"],
    top_artists: ["Radiohead", "Tame Impala", "Beach House"],
  },
  emotion: {
    primary_mood: "energized",
    energy_level: 0.55,
  },
  context: {
    location: { value: "Fort Mason" },
    time: { value: "11:14pm" },
  },
};

export const COLLAB_OVERLAP = {
  shared_genres: ["alt rock"],
  shared_artists: ["Radiohead"],
  shared_mood_zone: "moderate introspective",
  merged_energy_target: 0.38,
  merged_queue: [
    { title: "Skinny Love",               artist: "Bon Iver",        tag: "user1", reasoning: "Anchors Lamitr's acoustic mood" },
    { title: "Everything In Its Right Place", artist: "Radiohead",   tag: "both",  reasoning: "Shared artist — ambient energy bridges both profiles" },
    { title: "Space Song",                 artist: "Beach House",    tag: "user2", reasoning: "Alex's dream pop — matches shared introspective zone" },
    { title: "Scott Street",               artist: "Phoebe Bridgers", tag: "user1", reasoning: "Lamitr's reflective lane" },
    { title: "Let It Happen",              artist: "Tame Impala",    tag: "user2", reasoning: "Alex's psych-rock — moderate energy compromise" },
    { title: "Holocene",                   artist: "Bon Iver",       tag: "both",  reasoning: "Both users' taste DNA converges here" },
  ],
};
