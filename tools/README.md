# Dev Tools

## Auriga Capture

Tampermonkey script that captures Auriga API responses for local development.

### Setup

1. Install [`auriga-capture.user.js`](auriga-capture.user.js) in Tampermonkey
2. Go to [auriga.epita.fr](https://auriga.epita.fr) and log in
3. Navigate to your grades page
4. A purple panel appears in the bottom-right showing captured API calls
5. Click **Download** — saves as `auriga-capture.json`
6. Move the file here: `tools/auriga-capture.json`
7. Run `bun run dev` — done

### What it captures

- All requests to `/api/*` (grades, synthesis, menus, user info)
- POST request bodies (search filters)
- Skips static assets and non-API endpoints

The JSON contains your real grades and is gitignored.
