// ==UserScript==
// @name         Auriga Page Capture v2
// @namespace    infinity-auriga
// @version      2.0
// @description  Capture Auriga API responses for Infinity Auriga development
// @match        https://auriga.epita.fr/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    const captures = [];

    // Key API paths we want FULL responses for (no truncation)
    const FULL_CAPTURE_PATTERNS = [
        '/api/me',
        '/api/menus',
        '/api/menuEntries/',
        '/api/searchResult',
        '/api/dataviz',
        '/api/academicCalendars',
        '/api/plannings',
        'openid-connect/token',
        'openid-connect/userinfo',
    ];

    // Skip SVG/asset captures entirely
    const SKIP_PATTERNS = [
        '/assets/icons/',
        '/assets/i18n/',
        '.svg',
        '.woff',
        '.ttf',
    ];

    function shouldSkip(url) {
        return SKIP_PATTERNS.some(p => url.includes(p));
    }

    function shouldFullCapture(url) {
        return FULL_CAPTURE_PATTERNS.some(p => url.includes(p));
    }

    function captureResponse(type, method, url, status, responseText, headers, requestBody) {
        if (shouldSkip(url)) return;

        const full = shouldFullCapture(url);
        const maxLen = full ? 500000 : 10000;

        const entry = {
            type,
            method,
            url,
            status,
            response: responseText ? responseText.substring(0, maxLen) : null,
            truncated: responseText ? responseText.length > maxLen : false,
            fullLength: responseText ? responseText.length : 0,
            timestamp: new Date().toISOString()
        };

        // Capture request body for POST requests (search filters, etc.)
        if (requestBody && method === 'POST') {
            try {
                entry.requestBody = typeof requestBody === 'string'
                    ? requestBody.substring(0, 50000)
                    : JSON.stringify(requestBody).substring(0, 50000);
            } catch (e) {
                entry.requestBody = '[could not serialize]';
            }
        }

        if (headers) {
            entry.responseHeaders = headers;
        }

        captures.push(entry);
    }

    // --- 1. Intercept XHR requests ---
    const origOpen = XMLHttpRequest.prototype.open;
    const origSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url, ...args) {
        this._captureMethod = method;
        this._captureUrl = url;
        return origOpen.call(this, method, url, ...args);
    };

    XMLHttpRequest.prototype.send = function (body) {
        const requestBody = body;
        this.addEventListener('load', function () {
            let responseText;
            try {
                responseText = this.responseText;
            } catch (e) {
                responseText = '[could not read response]';
            }
            captureResponse(
                'xhr', this._captureMethod, this._captureUrl,
                this.status, responseText, this.getAllResponseHeaders(), requestBody
            );
        });
        return origSend.call(this, body);
    };

    // --- 2. Intercept fetch() requests ---
    const origFetch = window.fetch;
    window.fetch = function (input, init) {
        const url = typeof input === 'string' ? input : input.url;
        const method = init?.method || 'GET';
        const requestBody = init?.body;

        return origFetch.call(this, input, init).then(response => {
            const cloned = response.clone();
            cloned.text().then(text => {
                captureResponse('fetch', method, url, response.status, text, null, requestBody);
            }).catch(() => {});
            return response;
        });
    };

    // --- 3. UI Panel ---
    function makeEl(tag, styles, text) {
        const el = document.createElement(tag);
        if (styles) Object.assign(el.style, styles);
        if (text) el.textContent = text;
        return el;
    }

    const container = makeEl('div', {
        position: 'fixed', bottom: '20px', right: '20px', zIndex: '99999',
        background: '#673ab7', color: 'white', padding: '12px 16px',
        borderRadius: '12px', fontFamily: 'sans-serif', fontSize: '13px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)', maxWidth: '360px'
    });

    const titleEl = makeEl('div', { fontWeight: 'bold', marginBottom: '8px' }, 'Auriga Capture v2');
    const statusEl = makeEl('div', { marginBottom: '8px' }, 'Monitoring API calls...');
    const btnRow = makeEl('div', { display: 'flex', gap: '8px', flexWrap: 'wrap' });

    const btnStyle = {
        padding: '6px 12px', border: 'none', borderRadius: '6px',
        background: 'white', color: '#673ab7', fontWeight: 'bold', cursor: 'pointer'
    };

    const downloadApiBtn = makeEl('button', btnStyle, 'Download API Only');
    const downloadAllBtn = makeEl('button', btnStyle, 'Download All + DOM');

    btnRow.appendChild(downloadApiBtn);
    btnRow.appendChild(downloadAllBtn);
    container.appendChild(titleEl);
    container.appendChild(statusEl);
    container.appendChild(btnRow);
    document.body.appendChild(container);

    setInterval(() => {
        const apiCount = captures.filter(c => c.type !== 'snapshot').length;
        const snapshotCount = captures.filter(c => c.type === 'snapshot').length;
        statusEl.textContent = `${apiCount} API calls | ${snapshotCount} snapshots | ${location.pathname}`;
    }, 1000);

    // Download API captures only (smaller file, what we mostly need)
    downloadApiBtn.addEventListener('click', () => {
        const apiOnly = captures.filter(c => c.type !== 'snapshot');
        const blob = new Blob([JSON.stringify(apiOnly, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `auriga-api-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        statusEl.textContent = `Downloaded ${apiOnly.length} API captures!`;
    });

    // Download everything including DOM snapshots
    downloadAllBtn.addEventListener('click', () => {
        // Auto-snapshot current page before downloading
        captures.push({
            type: 'snapshot',
            url: location.href,
            title: document.title,
            html: document.documentElement.outerHTML,
            timestamp: new Date().toISOString()
        });
        const blob = new Blob([JSON.stringify(captures, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `auriga-full-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        statusEl.textContent = `Downloaded ${captures.length} total captures!`;
    });

    console.log('[Auriga Capture v2] Ready. Navigate around, then download.');
    console.log('Key pages to visit:');
    console.log('  - Grades page (menuEntry/1036)');
    console.log('  - Pedagogical registrations (menuEntry/1144) - has averages');
    console.log('  - Try CSV export if available');
})();
