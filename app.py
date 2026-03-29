import base64
import os
import re
import secrets
import time
from urllib.parse import urlencode

import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, redirect, render_template_string, request, session


load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "dev-secret-change-me")

SPOTIFY_CLIENT_ID = os.environ.get("SPOTIFY_CLIENT_ID", "")
SPOTIFY_CLIENT_SECRET = os.environ.get("SPOTIFY_CLIENT_SECRET", "")
SPOTIFY_REDIRECT_URI = os.environ.get(
    "SPOTIFY_REDIRECT_URI", "http://127.0.0.1:3001/callback"
)
SPOTIFY_SCOPES = os.environ.get(
    "SPOTIFY_SCOPES",
    "user-read-email user-read-private user-top-read user-read-playback-state user-modify-playback-state streaming playlist-modify-private playlist-modify-public",
)
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://127.0.0.1:5173")

SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize"
SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
SPOTIFY_API_BASE_URL = "https://api.spotify.com/v1"
PLAYLIST_WRITE_SCOPES = {"playlist-modify-private", "playlist-modify-public"}
PLAYBACK_SCOPES = {"streaming", "user-modify-playback-state", "user-read-playback-state"}

HOME_PAGE = """
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>VibeEngine</title>
  <style>
    :root {
      --bg: #f4efe6;
      --surface: rgba(255, 252, 247, 0.8);
      --ink: #1f1b16;
      --muted: #6e655b;
      --accent: #c7643b;
      --accent-2: #2f6f62;
      --line: rgba(31, 27, 22, 0.08);
      --shadow: 0 24px 60px rgba(83, 48, 29, 0.14);
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      font-family: "Avenir Next", "Segoe UI", sans-serif;
      color: var(--ink);
      background:
        radial-gradient(circle at top left, rgba(199, 100, 59, 0.18), transparent 30%),
        radial-gradient(circle at top right, rgba(47, 111, 98, 0.18), transparent 28%),
        linear-gradient(180deg, #f8f4ed 0%, var(--bg) 100%);
      min-height: 100vh;
    }

    .shell {
      width: min(1120px, calc(100vw - 32px));
      margin: 32px auto;
      display: grid;
      gap: 18px;
    }

    .hero, .panel {
      background: var(--surface);
      backdrop-filter: blur(12px);
      border: 1px solid var(--line);
      border-radius: 28px;
      box-shadow: var(--shadow);
    }

    .hero {
      padding: 32px;
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 24px;
    }

    .eyebrow {
      display: inline-flex;
      gap: 8px;
      align-items: center;
      padding: 8px 12px;
      border-radius: 999px;
      background: rgba(31, 27, 22, 0.06);
      color: var(--muted);
      font-size: 13px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    h1 {
      margin: 16px 0 12px;
      font-family: Georgia, "Times New Roman", serif;
      font-size: clamp(40px, 7vw, 72px);
      line-height: 0.95;
      letter-spacing: -0.04em;
    }

    .lede {
      margin: 0;
      max-width: 52ch;
      color: var(--muted);
      font-size: 18px;
      line-height: 1.55;
    }

    .hero-card {
      align-self: stretch;
      border-radius: 24px;
      background: linear-gradient(145deg, rgba(199, 100, 59, 0.1), rgba(47, 111, 98, 0.08));
      border: 1px solid rgba(31, 27, 22, 0.07);
      padding: 20px;
      display: grid;
      gap: 14px;
    }

    .hero-card h2, .panel h2 {
      margin: 0;
      font-size: 18px;
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }

    .stat {
      background: rgba(255, 255, 255, 0.56);
      border-radius: 18px;
      padding: 14px;
      border: 1px solid rgba(31, 27, 22, 0.06);
    }

    .stat-label {
      color: var(--muted);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 8px;
    }

    .stat-value {
      font-size: 18px;
      font-weight: 700;
      word-break: break-word;
    }

    .grid {
      display: grid;
      grid-template-columns: 1.1fr 0.9fr;
      gap: 18px;
    }

    .panel {
      padding: 24px;
    }

    form {
      display: grid;
      gap: 14px;
    }

    label {
      display: grid;
      gap: 8px;
      font-weight: 600;
    }

    input, textarea, select {
      width: 100%;
      border: 1px solid rgba(31, 27, 22, 0.12);
      background: rgba(255, 255, 255, 0.78);
      border-radius: 16px;
      padding: 14px 16px;
      font: inherit;
      color: var(--ink);
    }

    textarea {
      min-height: 128px;
      resize: vertical;
    }

    .row {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    button, .button {
      appearance: none;
      border: 0;
      border-radius: 999px;
      padding: 13px 18px;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: transform 160ms ease, box-shadow 160ms ease;
    }

    button:hover, .button:hover {
      transform: translateY(-1px);
    }

    .primary {
      background: var(--ink);
      color: white;
      box-shadow: 0 12px 24px rgba(31, 27, 22, 0.18);
    }

    .secondary {
      background: rgba(31, 27, 22, 0.06);
      color: var(--ink);
    }

    .ghost {
      background: transparent;
      color: var(--accent-2);
      border: 1px solid rgba(47, 111, 98, 0.24);
    }

    .status {
      min-height: 24px;
      color: var(--muted);
      font-size: 14px;
    }

    .pill-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .pill {
      padding: 8px 12px;
      border-radius: 999px;
      background: rgba(199, 100, 59, 0.09);
      color: var(--accent);
      font-size: 13px;
      font-weight: 700;
    }

    .tracks {
      display: grid;
      gap: 10px;
      margin-top: 16px;
    }

    .track {
      border: 1px solid rgba(31, 27, 22, 0.08);
      border-radius: 18px;
      background: rgba(255, 255, 255, 0.72);
      padding: 14px;
    }

    .track-title {
      font-weight: 700;
      margin-bottom: 4px;
    }

    .track-meta, .small {
      color: var(--muted);
      font-size: 14px;
    }

    .hidden { display: none; }

    @media (max-width: 900px) {
      .hero, .grid, .row {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <main class="shell">
    <section class="hero">
      <div>
        <div class="eyebrow">Spotify x Context Engine</div>
        <h1>Build playlists from real-life context.</h1>
        <p class="lede">
          Describe what is happening, how you want it to feel, and VibeEngine will
          shape a playlist around your Spotify taste profile instead of giving you a generic mood mix.
        </p>
        <div class="actions" style="margin-top: 20px;">
          <a class="button primary" href="/login">Connect Spotify</a>
          <button id="loadSession" class="secondary" type="button">Refresh Session</button>
        </div>
      </div>
      <aside class="hero-card">
        <h2>Session</h2>
        <div class="stats">
          <div class="stat">
            <div class="stat-label">Status</div>
            <div class="stat-value" id="sessionStatus">Checking...</div>
          </div>
          <div class="stat">
            <div class="stat-label">Redirect URI</div>
            <div class="stat-value small" id="redirectUri">Loading...</div>
          </div>
          <div class="stat">
            <div class="stat-label">User</div>
            <div class="stat-value" id="userName">Not connected</div>
          </div>
          <div class="stat">
            <div class="stat-label">Scopes</div>
            <div class="stat-value small" id="scopeList">Loading...</div>
          </div>
        </div>
        <div class="small">If playlist creation fails, check that your token includes playlist write scopes and re-login.</div>
      </aside>
    </section>

    <section class="grid">
      <section class="panel">
        <h2>Playlist Brief</h2>
        <p class="small">Example: “late-night coding before demo day, focused but still energized.”</p>
        <form id="playlistForm">
          <label>
            Context
            <textarea id="context" name="context" placeholder="Describe the moment, environment, and what the playlist should do for you."></textarea>
          </label>
          <div class="row">
            <label>
              Vibe
              <select id="vibe" name="vibe">
                <option value="focus">Focus</option>
                <option value="calm">Calm</option>
                <option value="workout">Workout</option>
                <option value="party">Party</option>
                <option value="romantic">Romantic</option>
                <option value="sad">Sad</option>
                <option value="travel">Travel</option>
                <option value="late-night">Late Night</option>
              </select>
            </label>
            <label>
              Time Range
              <select id="timeRange" name="time_range">
                <option value="short_term">Last 4 weeks</option>
                <option value="medium_term" selected>Last 6 months</option>
                <option value="long_term">All time</option>
              </select>
            </label>
          </div>
          <div class="row">
            <label>
              Playlist Name
              <input id="playlistName" name="playlist_name" placeholder="Optional custom name">
            </label>
            <label>
              Track Count
              <input id="limit" name="limit" type="number" min="5" max="30" value="20">
            </label>
          </div>
          <div class="actions">
            <button class="primary" type="submit">Create Playlist</button>
            <button class="ghost" id="previewButton" type="button">Preview Only</button>
          </div>
          <div class="status" id="formStatus"></div>
        </form>
      </section>

      <section class="panel">
        <h2>Result</h2>
        <div id="resultEmpty" class="small">Nothing generated yet. Connect Spotify, describe the moment, and create a playlist.</div>
        <div id="resultPanel" class="hidden">
          <div class="pill-row" id="profilePills"></div>
          <p class="small" id="profileSummary"></p>
          <div class="actions" id="playlistActions"></div>
          <div class="tracks" id="trackList"></div>
        </div>
      </section>
    </section>
  </main>

  <script>
    const form = document.getElementById("playlistForm");
    const formStatus = document.getElementById("formStatus");
    const resultEmpty = document.getElementById("resultEmpty");
    const resultPanel = document.getElementById("resultPanel");
    const profilePills = document.getElementById("profilePills");
    const profileSummary = document.getElementById("profileSummary");
    const playlistActions = document.getElementById("playlistActions");
    const trackList = document.getElementById("trackList");
    const previewButton = document.getElementById("previewButton");

    async function loadSession() {
      const [healthRes, sessionRes] = await Promise.all([
        fetch("/health"),
        fetch("/api/session")
      ]);
      const health = await healthRes.json();
      const session = await sessionRes.json();

      document.getElementById("redirectUri").textContent = health.redirect_uri || "Unknown";
      document.getElementById("sessionStatus").textContent = session.authenticated ? "Connected" : "Not connected";
      document.getElementById("userName").textContent = session.user ? session.user.display_name : "Not connected";
      document.getElementById("scopeList").textContent = session.scopes && session.scopes.length ? session.scopes.join(", ") : "No token scopes";
    }

    function setStatus(message, isError = false) {
      formStatus.textContent = message;
      formStatus.style.color = isError ? "#a33a20" : "";
    }

    function renderResult(data) {
      resultEmpty.classList.add("hidden");
      resultPanel.classList.remove("hidden");
      profilePills.innerHTML = "";
      playlistActions.innerHTML = "";
      trackList.innerHTML = "";

      const profile = data.profile || {};
      const pillEntries = [
        ["Mood", profile.name || "Custom"],
        ["Energy", profile.energy_label || "Balanced"],
        ["Seeds", String((data.seed_artists || []).length + (data.seed_tracks || []).length)],
        ["Tracks", String((data.tracks || []).length)],
      ];

      pillEntries.forEach(([label, value]) => {
        const el = document.createElement("div");
        el.className = "pill";
        el.textContent = `${label}: ${value}`;
        profilePills.appendChild(el);
      });

      profileSummary.textContent = data.profile_summary || "Generated from your Spotify taste profile.";

      if (data.playlist && data.playlist.external_url) {
        const open = document.createElement("a");
        open.className = "button primary";
        open.href = data.playlist.external_url;
        open.target = "_blank";
        open.rel = "noreferrer";
        open.textContent = "Open Playlist";
        playlistActions.appendChild(open);
      }

      if (!data.playlist) {
        const preview = document.createElement("div");
        preview.className = "small";
        preview.textContent = "Preview only. No playlist was saved to Spotify.";
        playlistActions.appendChild(preview);
      }

      (data.tracks || []).forEach((track) => {
        const item = document.createElement("div");
        item.className = "track";
        const artists = (track.artists || []).join(", ");
        item.innerHTML = `
          <div class="track-title">${track.name}</div>
          <div class="track-meta">${artists}</div>
          <div class="small">${track.album || ""}</div>
        `;
        trackList.appendChild(item);
      });
    }

    async function submitForm(previewOnly) {
      setStatus(previewOnly ? "Generating preview..." : "Creating playlist...");
      const payload = {
        context: document.getElementById("context").value,
        vibe: document.getElementById("vibe").value,
        time_range: document.getElementById("timeRange").value,
        playlist_name: document.getElementById("playlistName").value,
        limit: Number(document.getElementById("limit").value || 20),
        create_playlist: !previewOnly
      };

      const response = await fetch("/api/context-playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        setStatus(data.message || data.error || "Request failed.", true);
        return;
      }

      renderResult(data);
      setStatus(data.playlist ? "Playlist created in Spotify." : "Preview generated.");
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      submitForm(false);
    });

    previewButton.addEventListener("click", async () => {
      submitForm(true);
    });

    document.getElementById("loadSession").addEventListener("click", loadSession);
    loadSession();
  </script>
</body>
</html>
"""

VIBE_PROFILES = {
    "focus": {
        "name": "Focus",
        "energy": 0.42,
        "danceability": 0.45,
        "valence": 0.43,
        "acousticness": 0.38,
        "instrumentalness": 0.35,
        "energy_label": "steady",
        "keywords": ["focus", "study", "code", "coding", "deep work", "work", "locked in", "productive", "heads down"],
    },
    "calm": {
        "name": "Calm",
        "energy": 0.25,
        "danceability": 0.32,
        "valence": 0.48,
        "acousticness": 0.62,
        "instrumentalness": 0.28,
        "energy_label": "low",
        "keywords": ["calm", "quiet", "rain", "morning", "gentle", "breathe", "soft", "relax", "wind down"],
    },
    "workout": {
        "name": "Workout",
        "energy": 0.88,
        "danceability": 0.76,
        "valence": 0.68,
        "acousticness": 0.08,
        "instrumentalness": 0.02,
        "energy_label": "high",
        "keywords": ["gym", "lift", "run", "sprint", "workout", "training", "hype", "adrenaline", "push"],
    },
    "party": {
        "name": "Party",
        "energy": 0.84,
        "danceability": 0.84,
        "valence": 0.74,
        "acousticness": 0.05,
        "instrumentalness": 0.0,
        "energy_label": "high",
        "keywords": ["party", "dance", "celebrate", "girls night", "pregame", "club", "friends", "friend group", "social", "singable", "upbeat", "anthem", "karaoke"],
    },
    "romantic": {
        "name": "Romantic",
        "energy": 0.38,
        "danceability": 0.58,
        "valence": 0.58,
        "acousticness": 0.36,
        "instrumentalness": 0.04,
        "energy_label": "soft",
        "keywords": ["date", "romantic", "love", "sunset", "dinner", "intimate"],
    },
    "sad": {
        "name": "Sad",
        "energy": 0.24,
        "danceability": 0.34,
        "valence": 0.18,
        "acousticness": 0.54,
        "instrumentalness": 0.18,
        "energy_label": "low",
        "keywords": ["sad", "heartbreak", "cry", "melancholy", "grief"],
    },
    "travel": {
        "name": "Travel",
        "energy": 0.66,
        "danceability": 0.64,
        "valence": 0.63,
        "acousticness": 0.18,
        "instrumentalness": 0.04,
        "energy_label": "moving",
        "keywords": ["travel", "road trip", "flight", "drive", "city", "sunrise"],
    },
    "late-night": {
        "name": "Late Night",
        "energy": 0.46,
        "danceability": 0.57,
        "valence": 0.34,
        "acousticness": 0.22,
        "instrumentalness": 0.08,
        "energy_label": "smoldering",
        "keywords": ["late night", "midnight", "after hours", "2am", "night drive"],
    },
}


def missing_config():
    missing = []
    if not SPOTIFY_CLIENT_ID:
        missing.append("SPOTIFY_CLIENT_ID")
    if not SPOTIFY_CLIENT_SECRET:
        missing.append("SPOTIFY_CLIENT_SECRET")
    if not SPOTIFY_REDIRECT_URI:
        missing.append("SPOTIFY_REDIRECT_URI")
    return missing


def spotify_basic_auth_header():
    raw = f"{SPOTIFY_CLIENT_ID}:{SPOTIFY_CLIENT_SECRET}".encode("utf-8")
    encoded = base64.b64encode(raw).decode("utf-8")
    return {"Authorization": f"Basic {encoded}"}


def store_token_payload(token_payload):
    session["spotify_token"] = {
        "access_token": token_payload["access_token"],
        "refresh_token": token_payload.get(
            "refresh_token",
            session.get("spotify_token", {}).get("refresh_token"),
        ),
        "expires_at": int(time.time()) + int(token_payload.get("expires_in", 3600)),
        "scope": token_payload.get("scope", ""),
        "token_type": token_payload.get("token_type", "Bearer"),
    }


def refresh_access_token():
    token = session.get("spotify_token")
    if not token or not token.get("refresh_token"):
        return None

    response = requests.post(
        SPOTIFY_TOKEN_URL,
        headers={
            **spotify_basic_auth_header(),
            "Content-Type": "application/x-www-form-urlencoded",
        },
        data={
            "grant_type": "refresh_token",
            "refresh_token": token["refresh_token"],
        },
        timeout=20,
    )
    response.raise_for_status()
    refreshed = response.json()
    store_token_payload(refreshed)
    return session.get("spotify_token")


def get_valid_token():
    token = session.get("spotify_token")
    if not token:
        return None

    if token["expires_at"] <= int(time.time()) + 60:
        return refresh_access_token()

    return token


def get_token_scopes():
    token = session.get("spotify_token") or {}
    return {scope for scope in token.get("scope", "").split(" ") if scope}


def has_required_scopes(required_scopes):
    return required_scopes.issubset(get_token_scopes())


def spotify_api_request(method, path, params=None, json_body=None, data=None):
    token = get_valid_token()
    if not token:
        return None, (
            jsonify({"error": "not_authenticated", "message": "Log in with Spotify first."}),
            401,
        )

    headers = {"Authorization": f"Bearer {token['access_token']}"}
    if json_body is not None:
        headers["Content-Type"] = "application/json"

    response = requests.request(
        method=method,
        url=f"{SPOTIFY_API_BASE_URL}{path}",
        params=params,
        json=json_body,
        data=data,
        headers=headers,
        timeout=20,
    )

    if response.status_code == 401 and token.get("refresh_token"):
        token = refresh_access_token()
        headers["Authorization"] = f"Bearer {token['access_token']}"
        response = requests.request(
            method=method,
            url=f"{SPOTIFY_API_BASE_URL}{path}",
            params=params,
            json=json_body,
            data=data,
            headers=headers,
            timeout=20,
        )

    return response, None


def spotify_api_get(path, params=None):
    return spotify_api_request("GET", path, params=params)


def spotify_api_post(path, json_body=None, data=None):
    return spotify_api_request("POST", path, json_body=json_body, data=data)


def spotify_api_put(path, json_body=None, data=None, params=None):
    return spotify_api_request("PUT", path, params=params, json_body=json_body, data=data)


def spotify_json_or_text(response):
    try:
        return response.json()
    except ValueError:
        return {"raw": response.text}


def clamp(value):
    return max(0.0, min(1.0, value))


def extract_context_signals(context):
    context_lower = (context or "").lower()
    signals = {}
    for key in ("time", "weather", "location", "motion", "calendar", "day"):
        match = re.search(rf"{key}:\s*([^()\.]+)", context_lower)
        if match:
            signals[key] = match.group(1).strip()
    return signals


def derive_profile(context, vibe):
    context = (context or "").strip()
    context_lower = context.lower()
    signals = extract_context_signals(context)
    selected_key = vibe if vibe in VIBE_PROFILES else "focus"
    match_reason = "Selected vibe"

    for key, profile in VIBE_PROFILES.items():
      for keyword in profile["keywords"]:
        if keyword in context_lower:
          selected_key = key
          match_reason = f"Matched keyword: {keyword}"
          break
      if match_reason != "Selected vibe":
        break

    profile = dict(VIBE_PROFILES[selected_key])
    context_influences = []

    time_signal = signals.get("time", "")
    if "late night" in time_signal or "deep night" in time_signal:
        profile["energy"] = clamp(profile["energy"] - 0.08)
        profile["valence"] = clamp(profile["valence"] - 0.06)
        profile["danceability"] = clamp(profile["danceability"] + 0.03)
        context_influences.append("late-night timing")
    elif "morning" in time_signal:
        profile["energy"] = clamp(profile["energy"] + 0.07)
        profile["valence"] = clamp(profile["valence"] + 0.05)
        context_influences.append("morning lift")
    elif "evening" in time_signal:
        profile["energy"] = clamp(profile["energy"] - 0.02)
        profile["valence"] = clamp(profile["valence"] + 0.02)
        context_influences.append("evening pacing")

    weather_signal = signals.get("weather", "")
    if any(word in weather_signal for word in ("rain", "overcast", "storm", "snow")):
        profile["energy"] = clamp(profile["energy"] - 0.08)
        profile["valence"] = clamp(profile["valence"] - 0.10)
        profile["acousticness"] = clamp(profile["acousticness"] + 0.14)
        profile["instrumentalness"] = clamp(profile["instrumentalness"] + 0.08)
        context_influences.append("moody weather")
    elif any(word in weather_signal for word in ("clear", "bright", "warm", "sunny", "crisp")):
        profile["energy"] = clamp(profile["energy"] + 0.06)
        profile["valence"] = clamp(profile["valence"] + 0.10)
        context_influences.append("bright weather")

    location_signal = signals.get("location", "")
    if any(word in location_signal for word in ("social venue", "friends", "party", "club")):
        profile["danceability"] = clamp(profile["danceability"] + 0.12)
        profile["energy"] = clamp(profile["energy"] + 0.08)
        profile["valence"] = clamp(profile["valence"] + 0.07)
        context_influences.append("social location")
    elif any(word in location_signal for word in ("home", "personal zone")):
        profile["acousticness"] = clamp(profile["acousticness"] + 0.10)
        profile["energy"] = clamp(profile["energy"] - 0.04)
        context_influences.append("home setting")

    motion_signal = signals.get("motion", "")
    if any(word in motion_signal for word in ("high energy", "medium-high", "moving", "running", "active")):
        profile["energy"] = clamp(profile["energy"] + 0.15)
        profile["danceability"] = clamp(profile["danceability"] + 0.08)
        profile["valence"] = clamp(profile["valence"] + 0.04)
        context_influences.append("active motion")
    elif any(word in motion_signal for word in ("low energy", "mostly still", "stationary")):
        profile["energy"] = clamp(profile["energy"] - 0.10)
        profile["acousticness"] = clamp(profile["acousticness"] + 0.08)
        context_influences.append("stillness")

    day_signal = signals.get("day", "")
    if any(word in day_signal for word in ("weekend", "release valve")):
        profile["danceability"] = clamp(profile["danceability"] + 0.06)
        profile["valence"] = clamp(profile["valence"] + 0.05)
        context_influences.append("weekend context")
    elif "work rhythm" in day_signal:
        profile["instrumentalness"] = clamp(profile["instrumentalness"] + 0.06)
        context_influences.append("weekday focus")

    calendar_signal = signals.get("calendar", "")
    if any(word in calendar_signal for word in ("no curfew", "free tomorrow")):
        profile["energy"] = clamp(profile["energy"] + 0.05)
        profile["danceability"] = clamp(profile["danceability"] + 0.05)
        context_influences.append("open schedule")
    elif any(word in calendar_signal for word in ("meeting", "deadline", "early")):
        profile["energy"] = clamp(profile["energy"] - 0.04)
        profile["instrumentalness"] = clamp(profile["instrumentalness"] + 0.08)
        context_influences.append("calendar pressure")

    if "high energy" in context_lower or "hype" in context_lower:
        profile["energy"] = clamp(profile["energy"] + 0.08)
        profile["danceability"] = clamp(profile["danceability"] + 0.06)
    if "soft" in context_lower or "quiet" in context_lower:
        profile["energy"] = clamp(profile["energy"] - 0.07)
        profile["acousticness"] = clamp(profile["acousticness"] + 0.08)
    if "happy" in context_lower or "optimistic" in context_lower:
        profile["valence"] = clamp(profile["valence"] + 0.10)
    if "dark" in context_lower or "moody" in context_lower:
        profile["valence"] = clamp(profile["valence"] - 0.10)

    profile["match_reason"] = match_reason
    profile["context_influences"] = context_influences
    profile["context_signals"] = signals
    return profile


def make_playlist_name(context, profile):
    context = (context or "").strip()
    if context:
        return f"{profile['name']} - {context[:40].strip()}"
    return f"{profile['name']} Mix"


def summarize_tracks(items):
    tracks = []
    for item in items:
        album = item.get("album") or {}
        images = album.get("images") or []
        tracks.append(
            {
                "id": item.get("id"),
                "uri": item.get("uri"),
                "name": item.get("name"),
                "artists": [artist.get("name") for artist in item.get("artists", [])],
                "album": album.get("name"),
                "image_url": images[0].get("url") if images else None,
                "external_url": (item.get("external_urls") or {}).get("spotify"),
            }
        )
    return tracks


def pick_seed_ids(items, limit):
    return [item.get("id") for item in items if item.get("id")][:limit]


def build_recommendation_params(profile, top_tracks, top_artists, profile_data, limit):
    seed_tracks = pick_seed_ids(top_tracks.get("items", []), 2)
    seed_artists = pick_seed_ids(top_artists.get("items", []), 3)
    combined = (seed_tracks + seed_artists)[:5]
    seed_tracks = combined[: min(2, len(seed_tracks))]
    seed_artists = combined[len(seed_tracks):]

    params = {
        "limit": limit,
        "target_energy": profile["energy"],
        "target_valence": profile["valence"],
        "target_danceability": profile["danceability"],
        "target_acousticness": profile["acousticness"],
        "target_instrumentalness": profile["instrumentalness"],
    }

    if seed_tracks:
        params["seed_tracks"] = ",".join(seed_tracks)
    if seed_artists:
        params["seed_artists"] = ",".join(seed_artists)
    if profile_data.get("country"):
        params["market"] = profile_data["country"]

    return params, seed_tracks, seed_artists


def fallback_tracks(top_tracks, top_artists, profile_data, limit):
    picked = []
    seen = set()

    for item in top_tracks.get("items", []):
        track_id = item.get("id")
        if not track_id or track_id in seen:
            continue
        picked.append(item)
        seen.add(track_id)
        if len(picked) >= limit:
            return picked

    market = profile_data.get("country")
    for artist in top_artists.get("items", [])[:3]:
        artist_name = artist.get("name")
        if not artist_name:
            continue

        response, error = spotify_api_get(
            "/search",
            params={
                "q": f"artist:{artist_name}",
                "type": "track",
                "limit": 6,
                "market": market,
            },
        )
        if error or not response.ok:
            continue

        for item in response.json().get("tracks", {}).get("items", []):
            track_id = item.get("id")
            if not track_id or track_id in seen:
                continue
            picked.append(item)
            seen.add(track_id)
            if len(picked) >= limit:
                return picked

    return picked


def create_playlist_for_user(playlist_name, description, track_uris):
    playlist_response, error = spotify_api_post(
        "/me/playlists",
        json_body={"name": playlist_name, "description": description, "public": False},
    )
    if error:
        return None, error
    if not playlist_response.ok:
        return (
            None,
            (
                jsonify(
                    {
                        "error": "playlist_create_failed",
                        "message": "Spotify rejected playlist creation.",
                        "details": spotify_json_or_text(playlist_response),
                    }
                ),
                playlist_response.status_code,
            ),
        )

    playlist_data = playlist_response.json()
    add_tracks_response, error = spotify_api_post(
        f"/playlists/{playlist_data['id']}/items",
        json_body={"uris": track_uris},
    )
    if error:
        return None, error
    if not add_tracks_response.ok:
        return (
            None,
            (
                jsonify(
                    {
                        "error": "playlist_add_tracks_failed",
                        "message": "Playlist was created, but adding tracks failed.",
                        "playlist": {
                            "id": playlist_data["id"],
                            "name": playlist_data["name"],
                            "external_url": playlist_data["external_urls"]["spotify"],
                        },
                        "details": spotify_json_or_text(add_tracks_response),
                    }
                ),
                add_tracks_response.status_code,
            ),
        )

    return (
        {
            "id": playlist_data["id"],
            "name": playlist_data["name"],
            "uri": playlist_data["uri"],
            "external_url": playlist_data["external_urls"]["spotify"],
        },
        None,
    )


@app.get("/")
def index():
    return render_template_string(HOME_PAGE)


@app.get("/health")
def health():
    return jsonify(
        {
            "ok": True,
            "configured": missing_config() == [],
            "missing": missing_config(),
            "redirect_uri": SPOTIFY_REDIRECT_URI,
        }
    )


@app.get("/login")
def login():
    missing = missing_config()
    if missing:
        return jsonify({"error": "missing_config", "missing": missing}), 500

    state = secrets.token_urlsafe(16)
    session["spotify_auth_state"] = state

    params = {
        "client_id": SPOTIFY_CLIENT_ID,
        "response_type": "code",
        "redirect_uri": SPOTIFY_REDIRECT_URI,
        "scope": SPOTIFY_SCOPES,
        "state": state,
        "show_dialog": "true",
    }
    return redirect(f"{SPOTIFY_AUTH_URL}?{urlencode(params)}")


@app.get("/callback")
def callback():
    if request.args.get("error"):
        return jsonify({"error": request.args["error"]}), 400

    state = request.args.get("state")
    code = request.args.get("code")

    if not code or not state:
        return jsonify({"error": "missing_code_or_state"}), 400

    if state != session.get("spotify_auth_state"):
        return jsonify({"error": "invalid_state"}), 400

    response = requests.post(
        SPOTIFY_TOKEN_URL,
        headers={
            **spotify_basic_auth_header(),
            "Content-Type": "application/x-www-form-urlencoded",
        },
        data={
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": SPOTIFY_REDIRECT_URI,
        },
        timeout=20,
    )

    if not response.ok:
        return jsonify({"error": "token_exchange_failed", "details": response.text}), 400

    store_token_payload(response.json())
    session.pop("spotify_auth_state", None)
    return redirect(f"{FRONTEND_URL.rstrip('/')}/?connected=1")


@app.get("/api/session")
def get_session_status():
    token = get_valid_token()
    if not token:
        return jsonify({"authenticated": False, "scopes": []})

    response, error = spotify_api_get("/me")
    if error:
        return error
    if not response.ok:
        return jsonify({"authenticated": False, "scopes": sorted(get_token_scopes())}), 200

    data = response.json()
    return jsonify(
        {
            "authenticated": True,
            "scopes": sorted(get_token_scopes()),
            "frontend_url": FRONTEND_URL,
            "user": {
                "display_name": data.get("display_name"),
                "id": data.get("id"),
                "product": data.get("product"),
            },
        }
    )


@app.get("/api/player-token")
def get_player_token():
    token = get_valid_token()
    if not token:
        return (
            jsonify({"error": "not_authenticated", "message": "Log in with Spotify first."}),
            401,
        )

    if not has_required_scopes(PLAYBACK_SCOPES):
        return (
            jsonify(
                {
                    "error": "missing_scope",
                    "message": "Re-login with playback scopes before using the browser player.",
                    "required_scopes": sorted(PLAYBACK_SCOPES),
                    "current_scopes": sorted(get_token_scopes()),
                }
            ),
            400,
        )

    return jsonify(
        {
            "access_token": token["access_token"],
            "scopes": sorted(get_token_scopes()),
            "expires_at": token["expires_at"],
        }
    )


@app.get("/api/me")
def get_current_user():
    response, error = spotify_api_get("/me")
    if error:
        return error
    return jsonify(response.json()), response.status_code


@app.get("/api/top-tracks")
def get_top_tracks():
    response, error = spotify_api_get(
        "/me/top/tracks",
        params={
            "time_range": request.args.get("time_range", "medium_term"),
            "limit": request.args.get("limit", "10"),
        },
    )
    if error:
        return error
    return jsonify(response.json()), response.status_code


@app.get("/api/top-artists")
def get_top_artists():
    response, error = spotify_api_get(
        "/me/top/artists",
        params={
            "time_range": request.args.get("time_range", "medium_term"),
            "limit": request.args.get("limit", "10"),
        },
    )
    if error:
        return error
    return jsonify(response.json()), response.status_code


@app.get("/api/playlists")
def get_playlists():
    response, error = spotify_api_get("/me/playlists")
    if error:
        return error
    return jsonify(response.json()), response.status_code


@app.post("/api/context-playlist")
def create_context_playlist():
    payload = request.get_json(silent=True) or {}
    context = payload.get("context", "")
    vibe = payload.get("vibe", "focus")
    playlist_name = payload.get("playlist_name", "")
    time_range = payload.get("time_range", "medium_term")
    limit = max(5, min(int(payload.get("limit", 20)), 30))
    create_playlist = bool(payload.get("create_playlist", True))

    if create_playlist and not has_required_scopes(PLAYLIST_WRITE_SCOPES):
        return (
            jsonify(
                {
                    "error": "missing_scope",
                    "message": "Re-login with playlist write scopes before creating playlists.",
                    "required_scopes": sorted(PLAYLIST_WRITE_SCOPES),
                    "current_scopes": sorted(get_token_scopes()),
                }
            ),
            400,
        )

    me_response, error = spotify_api_get("/me")
    if error:
        return error
    if not me_response.ok:
        return jsonify(spotify_json_or_text(me_response)), me_response.status_code
    profile_data = me_response.json()

    top_tracks_response, error = spotify_api_get(
        "/me/top/tracks",
        params={"time_range": time_range, "limit": 8},
    )
    if error:
        return error
    top_artists_response, error = spotify_api_get(
        "/me/top/artists",
        params={"time_range": time_range, "limit": 8},
    )
    if error:
        return error

    if not top_tracks_response.ok or not top_artists_response.ok:
        return (
            jsonify(
                {
                    "error": "taste_profile_unavailable",
                    "message": "Could not load Spotify top tracks or artists.",
                    "top_tracks": spotify_json_or_text(top_tracks_response),
                    "top_artists": spotify_json_or_text(top_artists_response),
                }
            ),
            400,
        )

    top_tracks = top_tracks_response.json()
    top_artists = top_artists_response.json()
    profile = derive_profile(context, vibe)
    recommendation_params, seed_tracks, seed_artists = build_recommendation_params(
        profile, top_tracks, top_artists, profile_data, limit
    )

    recommendations_response, error = spotify_api_get(
        "/recommendations",
        params=recommendation_params,
    )
    if error:
        return error
    recommendation_details = None
    if recommendations_response.ok:
        recommended_tracks = recommendations_response.json().get("tracks", [])
    else:
        recommendation_details = spotify_json_or_text(recommendations_response)
        recommended_tracks = []

    if not recommended_tracks:
        recommended_tracks = fallback_tracks(top_tracks, top_artists, profile_data, limit)
        if not recommended_tracks:
            return (
                jsonify(
                    {
                        "error": "recommendations_failed",
                        "message": "Spotify did not return recommendations or fallback tracks.",
                        "details": recommendation_details,
                        "request": recommendation_params,
                    }
                ),
                400,
            )

    if not recommended_tracks:
        return jsonify({"error": "no_tracks", "message": "Spotify returned no tracks."}), 400

    result = {
        "success": True,
        "profile": profile,
        "profile_summary": (
            f"{profile['name']} profile tuned from your top artists and tracks. "
            f"{profile['match_reason']}. "
            + (
                f"Context influence: {', '.join(profile.get('context_influences', []))}."
                if profile.get("context_influences")
                else "No strong live context modifier was detected."
            )
        ),
        "recommendation_fallback_used": bool(recommendation_details),
        "context_signals": profile.get("context_signals", {}),
        "seed_tracks": seed_tracks,
        "seed_artists": seed_artists,
        "tracks": summarize_tracks(recommended_tracks),
        "playlist": None,
    }

    if create_playlist:
        final_name = (playlist_name or "").strip() or make_playlist_name(context, profile)
        playlist, playlist_error = create_playlist_for_user(
            final_name,
            f"Generated by VibeEngine from context: {context or profile['name']}",
            [track["uri"] for track in result["tracks"] if track.get("uri")],
        )
        if playlist_error:
            return playlist_error
        result["playlist"] = playlist

    return jsonify(result)


@app.post("/api/player/play")
def play_on_browser_device():
    if not has_required_scopes(PLAYBACK_SCOPES):
        return (
            jsonify(
                {
                    "error": "missing_scope",
                    "message": "Re-login with playback scopes before starting browser playback.",
                    "required_scopes": sorted(PLAYBACK_SCOPES),
                    "current_scopes": sorted(get_token_scopes()),
                }
            ),
            400,
        )

    payload = request.get_json(silent=True) or {}
    device_id = payload.get("device_id")
    context_uri = payload.get("context_uri")
    uris = payload.get("uris") or []

    if not device_id:
        return jsonify({"error": "missing_device_id"}), 400
    if not context_uri and not uris:
        return jsonify({"error": "missing_context"}), 400

    transfer_response, error = spotify_api_put(
        "/me/player",
        json_body={"device_ids": [device_id], "play": False},
    )
    if error:
        return error
    if transfer_response.status_code not in (200, 202, 204):
        return (
            jsonify(
                {
                    "error": "transfer_failed",
                    "message": "Spotify could not transfer playback to the browser device.",
                    "details": spotify_json_or_text(transfer_response),
                }
            ),
            transfer_response.status_code,
        )

    play_body = {"position_ms": 0}
    if context_uri:
        play_body["context_uri"] = context_uri
    else:
        play_body["uris"] = uris

    play_response, error = spotify_api_put(
        "/me/player/play",
        params={"device_id": device_id},
        json_body=play_body,
    )
    if error:
        return error
    if play_response.status_code not in (200, 202, 204):
        return (
            jsonify(
                {
                    "error": "playback_failed",
                    "message": "Spotify could not start playback on the browser device.",
                    "details": spotify_json_or_text(play_response),
                }
            ),
            play_response.status_code,
        )

    return jsonify({"success": True, "device_id": device_id})


@app.post("/api/player/next")
def player_next():
    """Skip to next track on the user's active Spotify device (phone)."""
    response, error = spotify_api_post("/me/player/next")
    if error:
        return error
    return jsonify({"success": True}), 204


@app.post("/api/player/previous")
def player_previous():
    """Go to previous track on the user's active Spotify device (phone)."""
    response, error = spotify_api_post("/me/player/previous")
    if error:
        return error
    return jsonify({"success": True}), 204


@app.get("/logout")
def logout():
    session.clear()
    return jsonify({"success": True, "message": "Local session cleared."})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3001))
    app.run(
        host="0.0.0.0",
        port=port,
        debug=os.environ.get("FLASK_DEBUG") == "1",
        use_reloader=False,
    )
