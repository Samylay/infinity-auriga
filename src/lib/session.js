import { getName } from './auriga/auth.js';
import { getMarks, getMarksFilters } from './auriga/marks.js';
import { getUpdates } from './updates.js';

/**
 * Load initial session state: user name, filters, and saved filter values.
 */
export async function loadSession() {
    const name = await getName().catch(() => 'Etudiant');
    const filters = await getMarksFilters();

    let filtersValues = {};
    const saved = localStorage.getItem('auriga_filters');
    if (saved) {
        filtersValues = JSON.parse(saved);
    } else if (filters[0]?.values.length > 0) {
        filtersValues = { semester: filters[0].values.at(-1).value };
    }

    return { name, filters, filtersValues };
}

/**
 * Fetch marks and updates for the given filter values.
 * Returns the data needed to render the app.
 */
export async function fetchMarksAndUpdates(filtersValues) {
    const result = await getMarks(filtersValues);
    const updates = await getUpdates(filtersValues, result.marks);

    return {
        marks: result.marks,
        averages: { student: result.average, promo: result.classAverage },
        updates,
    };
}

/**
 * Persist semester filter selection to localStorage.
 */
export function saveSemesterFilter(value) {
    const filtersValues = { semester: value };
    localStorage.setItem('auriga_filters', JSON.stringify(filtersValues));
    return filtersValues;
}
