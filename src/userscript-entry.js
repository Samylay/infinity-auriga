import './style.css';
import { installTokenInterceptor, waitForToken } from './lib/auriga/auth.js';
import { loadSession, fetchMarksAndUpdates, saveSemesterFilter } from './lib/session.js';
import { renderApp } from './render.js';

installTokenInterceptor();

async function main() {
    const hasToken = await waitForToken(60000);
    if (!hasToken) return;

    if (document.readyState === 'loading') {
        await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
    }

    document.title = 'Infinity Auriga';
    while (document.body.firstChild) document.body.removeChild(document.body.firstChild);
    for (const el of document.querySelectorAll('link[rel="stylesheet"], style')) el.remove();

    const container = document.createElement('div');
    container.id = 'app';
    document.body.appendChild(container);

    const session = await loadSession();
    let { filtersValues } = session;
    const { name, filters } = session;

    async function refresh() {
        const data = await fetchMarksAndUpdates(filtersValues);
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
