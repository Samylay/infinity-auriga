# Dev Tools

## Auriga Capture

Tampermonkey script that captures Auriga API responses for local development.

### Install

> **Requires [Tampermonkey](https://www.tampermonkey.net/)**

[![Install Auriga Capture](https://img.shields.io/badge/Install-Auriga_Capture-673ab7?style=for-the-badge&logo=tampermonkey)](https://raw.githubusercontent.com/KazeTachinuu/infinity-auriga/master/tools/auriga-capture.user.js)

### Usage

1. Go to [auriga.epita.fr](https://auriga.epita.fr) and log in
2. Navigate to your grades page
3. A purple panel appears in the bottom-right showing captured API calls
4. Click **Download** — saves as `auriga-capture.json`
5. Move the file to `tools/auriga-capture.json`
6. Run `bun run dev`

### What it captures

- All requests to `/api/*` (grades, synthesis, menus, user info)
- POST request bodies (search filters)
- Skips static assets and non-API endpoints

The JSON contains your real grades and is gitignored.
