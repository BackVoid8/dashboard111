# Obsidian Dashboard (Static HTML/CSS/JS)

This project is a **pure static site** (no Node.js, no build tools).

## Run locally (no Node.js)

From this folder:

```bash
python3 -m http.server 8080 --bind 127.0.0.1
```

Then open:

- http://127.0.0.1:8080

> If `localhost:8080` does not connect on your machine, use `127.0.0.1:8080` explicitly.

## Alternative port

If 8080 is already in use:

```bash
python3 -m http.server 5500 --bind 127.0.0.1
```

Open http://127.0.0.1:5500

## Notes

- No Node.js required.
- No external API keys are required for the current weather placeholder.
- User settings (clock format, countdowns, notes, accent color, widget order) are saved in `localStorage`.
