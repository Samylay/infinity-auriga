import { installTokenInterceptor, waitForToken } from './lib/auriga/auth.js';
import { setApiRequestHook } from './lib/auriga/api.js';
import { loadSession, fetchMarksAndUpdates, saveSemesterFilter } from './lib/session.js';
import { isInfinityEnabled, setupToggle } from './lib/toggle.js';

installTokenInterceptor();

async function main() {
    if (document.readyState === 'loading') {
        await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
    }

    // If user prefers Classique, just show the toggle and leave Auriga alone
    if (!isInfinityEnabled()) {
        setupToggle('classic');
        return;
    }

    // Take over the page
    import('./style.css');

    document.title = 'Infinity Auriga';
    while (document.body.firstChild) document.body.removeChild(document.body.firstChild);
    for (const el of document.querySelectorAll('link[rel="stylesheet"], style:not([data-infinity])')) el.remove();

    const container = document.createElement('div');
    container.id = 'app';
    document.body.appendChild(container);

    setupToggle('infinity');

    const { renderLoadingScreen, renderApp } = await import('./render.js');

    const status = renderLoadingScreen(container, 'Attente du token d\'authentification...');
    setApiRequestHook((url) => status.request(url));

    const hasToken = await waitForToken(60000);
    if (!hasToken) {
        status.step('Impossible de récupérer le token. Rechargez la page.');
        return;
    }

    const session = await loadSession(status);
    let { filtersValues } = session;
    const { name, filters } = session;

    async function refresh() {
        const s = renderLoadingScreen(container);
        setApiRequestHook((url) => s.request(url));
        const data = await fetchMarksAndUpdates(filtersValues, s);
        renderApp(container, {
            name, filters, filtersValues,
            ...data,
            onSemesterChange(value) {
                filtersValues = saveSemesterFilter(value);
                refresh();
            },
        });
    }

    await refresh();
}

main().catch(err => console.error('[Infinity Auriga]', err));
