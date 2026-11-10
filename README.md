# DHA Learning Games

Browser games for Years 1–4. One folder per game, nothing to install, no logins. Hosted free on GitHub Pages.

## Add a game (about 5 minutes)

1. Copy `games/_template/` to `games/<year>/<game-name>/` (year is `y1`, `y2`, `y3` or `y4`; use lowercase and hyphens).
2. Edit `index.html` (the game) and `info.json` (the card text). Optional: add `thumb.png` / `.jpg` for the card picture; otherwise the card shows the emoji tile.
3. Commit and push to `main`. The site rebuilds in about a minute.

The landing page picks the game up by itself: `build.js` scans `games/` and writes `games.json`. Nothing else to register.

## What the shared files give you

Load them from any game at `games/<year>/<game>/index.html`:

```html
<link rel="stylesheet" href="../../../shared/game-core.css">
<script src="../../../shared/game-core.js"></script>
```

| API | What it does |
|---|---|
| `DHA.speak(text)` | Reads aloud, en-GB voice preferred, slowed for young children |
| `DHA.stopSpeaking()` | Cancels speech |
| `DHA.sfx('ok' \| 'no' \| 'win' \| 'open')` | Preset sound effects (WebAudio, no files) |
| `DHA.tone(freq, start, dur, type, vol)` | Custom beeps |
| `DHA.teacherMenu({restart, items})` | Press **T** for voice on/off, sound on/off, restart and any extra buttons you pass |
| `DHA.store('name')` | `get(key, default)` / `set(key, value)` on localStorage, namespaced, never throws |
| `DHA.confetti()`, `DHA.el()`, `DHA.shuffle()` | Small helpers |

`shared/game-core.css` supplies the palette (navy, teal, coral, sand, sun), the card, big picture buttons, `.say` replay button, score pills, `#ov` question overlay and the teacher menu look. Put only game-specific styles in the game's own `<style>`.

Fix a bug in `shared/` and every game gets it.

## Conventions for the series

- Picture-first: every prompt is spoken, no reading needed. Always include a 🔊 replay button.
- Speech needs a first tap in most browsers: never speak before the child has pressed something.
- No accounts, no network calls, no tracking. Saved progress stays in localStorage on that device.
- Fonts: Baloo 2 (display) and Nunito (body).
- `info.json` fields: `title`, `by`, `years`, `emoji`, `description`, `strand`, `tc` (Teach Computing unit/lessons), `added` (shows NEW for 14 days).
- Add a new year group or change a colour in `site.json`.

## Hosting

Repo → Settings → Pages → Source: **GitHub Actions**. `.github/workflows/pages.yml` runs `node build.js` and deploys on every push to `main`. `games/_template` is not published.

Local preview: `node build.js && python3 -m http.server 8000`, then open http://localhost:8000.
