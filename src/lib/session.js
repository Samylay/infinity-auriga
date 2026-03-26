import { getName } from './auriga/auth.js';
import { getMarks, getMarksFilters } from './auriga/marks.js';
import { getUpdates } from './updates.js';
import { loadCoefficients, applyCoefficients, generateTemplate } from './coefficients/index.js';

const FILTERS_KEY = 'auriga_filters';

/** Detect track (e.g. "FISA") from grade codes. */
function detectTrack(marks) {
    const firstCode = marks.flatMap(m => m.subjects.flatMap(s => s.marks)).find(m => m._code)?._code;
    return firstCode?.split('_')[3] ?? null;
}

/** Load coefficients + generate template for a given marks tree. */
async function loadCoeffData(marks, filtersValues) {
    const track = detectTrack(marks);
    if (!track) return { coeffData: null, coeffTemplate: null };
    const coeffData = await loadCoefficients(filtersValues.semester, track);
    const coeffTemplate = generateTemplate(marks, filtersValues.semester, track, coeffData?.overrides ?? null);
    return { coeffData, coeffTemplate };
}

/**
 * Load initial session: user name, available filters, last selection.
 */
export async function loadSession(status) {
    status?.step('Récupération du profil...');
    const name = await getName().catch(() => 'Etudiant');
    status?.step('Récupération des filtres...');
    const filters = await getMarksFilters();

    const saved = localStorage.getItem(FILTERS_KEY);
    const filtersValues = saved
        ? JSON.parse(saved)
        : filters[0]?.values.length > 0
            ? { semester: filters[0].values[0].value }
            : {};

    return { name, filters, filtersValues };
}

/**
 * Fetch marks, apply coefficient overrides, compute updates.
 */
export async function fetchMarksAndUpdates(filtersValues, status) {
    status?.step('Récupération des notes...');
    const { marks, classAverage } = await getMarks(filtersValues);

    status?.step('Application des coefficients...');
    const { coeffData, coeffTemplate } = await loadCoeffData(marks, filtersValues);
    const { average } = applyCoefficients(marks, coeffData?.overrides ?? null);

    status?.step('Calcul des changements...');
    const updates = getUpdates(filtersValues, marks);

    return {
        marks,
        averages: { student: average, promo: classAverage },
        updates,
        coeffSource: coeffData?.file ?? null,
        coeffTemplate,
    };
}

/**
 * Try to load marks from localStorage cache (saved by the updates system).
 * Returns a render-ready data object, or null if no cache exists.
 */
export async function loadCachedMarks(filtersValues) {
    const save = JSON.parse(localStorage.getItem('auriga_marks_save') || '{}');
    const key = JSON.stringify(filtersValues);
    const marks = save[key];
    if (!marks || marks.length === 0) return null;

    // Coefficient files are bundled at build time — they work offline.
    // Re-apply coefficients to get correct averages (cached marks have stale normalization).
    const { coeffData, coeffTemplate } = await loadCoeffData(marks, filtersValues);
    const { average } = applyCoefficients(marks, coeffData?.overrides ?? null);

    const updates = JSON.parse(localStorage.getItem('auriga_updates') || '{}');

    return {
        marks,
        averages: { student: average, promo: null },
        updates: updates[key] || [],
        coeffSource: coeffData?.file ?? null,
        coeffTemplate,
    };
}

/**
 * Load saved semester filter from localStorage.
 */
export function loadSavedFilters() {
    const saved = localStorage.getItem(FILTERS_KEY);
    return saved ? JSON.parse(saved) : {};
}

/**
 * Persist semester selection.
 */
export function saveSemesterFilter(value) {
    const filtersValues = { semester: value };
    localStorage.setItem(FILTERS_KEY, JSON.stringify(filtersValues));
    return filtersValues;
}
