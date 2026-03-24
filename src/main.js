import './style.css';
import { setAccessToken } from './lib/auriga/api.js';
import { isLogged } from './lib/auriga/auth.js';
import { loadSession, fetchMarksAndUpdates, saveSemesterFilter } from './lib/session.js';
import { renderApp, renderSpinner } from './render.js';

if (window.location.hostname === 'localhost') {
    setAccessToken('dev-mock-token');
}

const container = document.getElementById('app');
let state = { name: null, marks: [], averages: {}, filters: [], filtersValues: {}, updates: [] };

function showLoading(message) {
    container.replaceChildren(renderSpinner(message));
}

async function refresh() {
    showLoading('Recuperation des notes...');
    const data = await fetchMarksAndUpdates(state.filtersValues);
    Object.assign(state, data);
    renderApp(container, { ...state, onSemesterChange: changeSemester });
}

function changeSemester(value) {
    state.filtersValues = saveSemesterFilter(value);
    refresh();
}

async function load() {
    showLoading('Chargement...');
    if (!isLogged()) return;

    const session = await loadSession();
    Object.assign(state, session);
    await refresh();
}

load().catch(err => {
    console.error('[Infinity Auriga]', err);
    container.textContent = 'Erreur: ' + err.message;
});
