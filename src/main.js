import './style.css';
import { setAccessToken } from './lib/auriga/api';
import { isLogged, getName } from './lib/auriga/auth';
import { getMarks, getMarksFilters } from './lib/auriga/marks';
import { getUpdates } from './lib/updates';
import { renderApp } from './render';
import SpinnerSvg from './assets/images/spinner.svg?raw';

if (window.location.hostname === 'localhost') {
    setAccessToken('dev-mock-token');
}

const container = document.getElementById('app');
let state = { name: null, marks: [], averages: {}, filters: [], filtersValues: {}, updates: [] };

async function load() {
    showLoading('Chargement...');
    if (isLogged()) {
        state.name = await getName().catch(() => 'Etudiant');
        state.filters = await getMarksFilters();
        const saved = localStorage.getItem('auriga_filters');
        if (saved) state.filtersValues = JSON.parse(saved);
        else if (state.filters[0]?.values.length > 0) state.filtersValues = { semester: state.filters[0].values.at(-1).value };
        await refresh();
    }
}

async function refresh() {
    showLoading('Recuperation des notes...');
    const result = await getMarks(state.filtersValues);
    state.marks = result.marks;
    state.averages = { student: result.average, promo: result.classAverage };
    state.updates = await getUpdates(state.filtersValues, state.marks);
    render();
}

function changeSemester(val) {
    state.filtersValues = { semester: val };
    localStorage.setItem('auriga_filters', JSON.stringify(state.filtersValues));
    refresh();
}

function showLoading(msg) {
    while (container.firstChild) container.removeChild(container.firstChild);
    const div = document.createElement('div');
    div.className = 'loading';
    div.style.cssText = 'flex-direction:column;align-items:center;justify-content:center;flex-grow:1;';
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    spinner.innerHTML = SpinnerSvg;
    const text = document.createElement('div');
    text.className = 'subtitle';
    text.textContent = msg;
    div.appendChild(spinner);
    div.appendChild(text);
    container.appendChild(div);
}

function render() {
    renderApp(container, { ...state, onSemesterChange: changeSemester });
}

load().catch(err => {
    console.error('[Infinity Auriga]', err);
    container.textContent = 'Erreur: ' + err.message;
});
