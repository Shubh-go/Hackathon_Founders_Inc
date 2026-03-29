# Hackathon_Founders_Inc

Spotify context engine with:
- Flask backend for OAuth, recommendations, playlist creation, and browser playback handoff
- Vite/React frontend in `frontend/`

## Backend routes

- `GET /health`
- `GET /login`
- `GET /callback`
- `GET /api/session`
- `GET /api/player-token`
- `GET /api/me`
- `GET /api/top-tracks`
- `GET /api/top-artists`
- `GET /api/playlists`
- `POST /api/context-playlist`
- `POST /api/player/play`
- `GET /logout`

## Setup

1. Create `.env` from `.env.example`
2. Register this Spotify redirect URI:

```text
http://127.0.0.1:3001/callback
```

3. Start the backend:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python3 app.py
```

4. Start the frontend:

```bash
cd frontend
npm install
npm run dev
```

5. Open:

```text
http://127.0.0.1:5173
```

## Important

- `SPOTIFY_SCOPES` must include playback scopes and playlist scopes
- after changing scopes, hit `/logout` and log in again so Spotify issues a fresh token
- the Vite dev server proxies `/api`, `/login`, `/logout`, and `/health` to the Flask backend
