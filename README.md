# Obsidian Dashboard

Premium macOS-inspired dashboard built with HTML, CSS, and JavaScript.

## Run with Node.js (recommended)

```bash
npm install
npm start
```

Open: `http://127.0.0.1:8080`

## Static fallback (no Node.js)

```bash
python3 -m http.server 8080 --bind 127.0.0.1
```

## Features

- Fullscreen mode toggle (YouTube-style full-page immersive mode)
- Live weather from Open-Meteo API (no key required)
- Customizable graduation date synced to a dedicated countdown
- Persistent widget layout and settings via `localStorage`
