# Infinity Auriga

Enhanced grades UI for [Auriga](https://auriga.epita.fr) (EPITA).

Fork of [infinity-pegasus](https://github.com/Litarvan/infinity-pegasus) by the GOATed [Litarvan](https://github.com/Litarvan).

![Infinity Auriga](docs/img/screenshot.png)

## Install

> **Requires [Tampermonkey](https://www.tampermonkey.net/)** (Chrome / Firefox / Edge)

[![Install Infinity Auriga](https://img.shields.io/badge/Install-Infinity_Auriga-44b732?style=for-the-badge&logo=tampermonkey)](https://raw.githubusercontent.com/KazeTachinuu/infinity-auriga/master/dist-userscript/infinity-auriga.user.js)

Click the button above — Tampermonkey will open an install page. Click **Install**. Done.

Auto-updates are built-in. A toggle in the bottom-left lets you switch back to classic Auriga anytime.

## Features

- Clean grade display with module/subject hierarchy
- Weighted averages with community-contributed coefficients
- Change tracking — new/updated grades since your last visit
- Live loading screen
- One-click toggle to classic Auriga

## Coefficients

Auriga treats all exams as equally weighted. Infinity fixes this with community-contributed coefficient files.

The app shows whether corrected coefficients are active for your semester. If not, you can contribute them — see the [coefficient guide](coefficients/README.md).

**Quick version:**

1. Create `coefficients/s{semester}_{year}_{track}.js`
2. Export exam codes with their real coefficients
3. Open a PR — no other file to edit

## Development

### First time setup

```bash
bun install
```

### Get mock data

The dev server replays real Auriga API responses. You need to capture them once — see the [capture tool guide](tools/README.md).

### Run

```bash
bun run dev                # Dev server with mock API (localhost:5173)
bun run build:userscript   # Build Tampermonkey script
```

## License

[MIT](LICENSE)
