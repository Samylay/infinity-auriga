/**
 * Coefficient override system — flat weighted average.
 *
 * Auriga treats all exams as equally weighted (coefficient 100).
 * This module applies the real coefficients contributed by the community.
 *
 * The student average is a flat weighted average of all marks:
 *   Σ(mark × coef) / Σ(coef)
 *
 * Subject and module weights are derived from the sum of their children's
 * coefficients by default, but can be explicitly overridden if needed.
 *
 * Only entries whose coefficient is NOT 1 need to be listed.
 */

// Auto-discover all coefficient files at build time (Vite glob import)
const modules = import.meta.glob(['./*.js', '!./*.test.js'], { import: 'default' });

/**
 * Load coefficient overrides for a semester/track combo.
 * Returns { overrides: Map, file: string } or null.
 */
export async function loadCoefficients(semesterKey, track) {
    const file = `${semesterKey}_${track}`.toLowerCase() + '.js';
    const loader = modules[`./${file}`];
    if (!loader) return null;
    const data = await loader();
    return { overrides: new Map(Object.entries(data)), file };
}

/**
 * Generate a pre-filled coefficient template from the current grade tree.
 * All marks are listed with coefficient 1, organized by module/subject with
 * human-readable comments — ready for a contributor to fill in real values.
 *
 * @param {Module[]} marks - grade tree
 * @param {string} semesterKey - e.g. "S07_2526"
 * @param {string} track - e.g. "FISA"
 * @param {Map|null} [overrides] - existing coefficient overrides to pre-fill
 * @returns {{ filename: string, content: string }}
 */
export function generateTemplate(marks, semesterKey, track, overrides = null) {
    const [semester, year] = semesterKey.split('_');
    const filename = `${semesterKey}_${track}`.toLowerCase() + '.js';
    const yearLabel = `20${year.slice(0, 2)}/20${year.slice(2)}`;

    const allCodes = [];
    for (const mod of marks) {
        allCodes.push(mod._code);
        for (const sub of mod.subjects) allCodes.push(sub._code);
    }
    const maxLen = Math.max(...allCodes.map(c => c.length));

    const lines = [
        `/**`,
        ` * Coefficients — ${semester} ${track} ${yearLabel}`,
        ` * Filename: ${filename}`,
        ` * Set ECTS at module level (applies equally to all subjects).`,
        ` * If a module mixes UEs with different ECTS, uncomment the`,
        ` * subject lines below it and set their ECTS individually.`,
        ` */`,
        `export default {`,
    ];

    const modsWithMarks = marks.filter(m => m.subjects.some(s => s.marks.length > 0));

    for (let i = 0; i < modsWithMarks.length; i++) {
        const mod = modsWithMarks[i];
        const rawCoef = overrides?.get(mod._code) ?? 1;
        const coef = typeof rawCoef === 'object' ? JSON.stringify(rawCoef) : rawCoef;
        const pad = ' '.repeat(Math.max(1, maxLen - mod._code.length));
        lines.push(`    '${mod._code}': ${coef},${pad} // ${mod.name}`);
        if (mod.subjects.length > 1) {
            const anyOverridden = mod.subjects.some(s => overrides?.has(s._code));
            if (!anyOverridden) {
                lines.push(`    // Uncomment below to override individual subjects (when they have different ECTS):`);
            }
            for (const sub of mod.subjects) {
                const raw = overrides?.get(sub._code);
                const subPad = ' '.repeat(Math.max(1, maxLen - sub._code.length));
                if (raw != null) {
                    const val = typeof raw === 'object' ? JSON.stringify(raw) : raw;
                    lines.push(`    '${sub._code}': ${val},${subPad} // └ ${sub.name || sub.id}`);
                } else {
                    lines.push(`    // '${sub._code}': ?,${subPad} // └ ${sub.name || sub.id}`);
                }
            }
        }
        if (i < modsWithMarks.length - 1) lines.push('');
    }

    lines.push(`};`, '');

    return { filename, content: lines.join('\n') };
}

/**
 * Apply coefficient overrides and compute all averages.
 *
 * @param {Module[]} marks - grade tree (mutated in place)
 * @param {Map|null} overrides - from loadCoefficients
 * @returns {{ average: number|null }}
 */
export function applyCoefficients(marks, overrides) {
    // Override value can be:
    //   number:  ECTS weight (e.g. 3)
    //   object:  { ects, module?, name? }
    //     - ects:   ECTS weight
    //     - module: promotes this subject to its own module with this name
    //     - name:   renames the subject/course
    function applyOverride(node) {
        if (!overrides?.has(node._code)) return;
        const val = overrides.get(node._code);
        if (typeof val === 'object' && val !== null) {
            node.coefficient = val.ects;
            if (val.name) node.name = val.name;
            if (val.module) node._promoteTo = val.module;
        } else {
            node.coefficient = val;
        }
        node._overridden = true;
    }

    for (const mod of marks) {
        applyOverride(mod);
        if (!mod.coefficient || mod.coefficient === 100) mod.coefficient = 1;

        for (const sub of mod.subjects) {
            applyOverride(sub);
            if (sub.coefficient === 100) sub.coefficient = 1;

            for (const mark of sub.marks) {
                applyOverride(mark);
                if (mark.coefficient === 100) mark.coefficient = 1;
            }
        }
    }

    // Promote subjects that have a `_promoteTo` module name to top-level modules.
    // This detaches them from their parent and gives them their own ECTS in the overall average.
    // Subjects promoted to the same module name are merged.
    const promoted = new Map();
    for (const mod of marks) {
        const detached = mod.subjects.filter(s => s._promoteTo);
        if (detached.length === 0) continue;
        mod.subjects = mod.subjects.filter(s => !s._promoteTo);
        for (const sub of detached) {
            const modName = sub._promoteTo;
            if (promoted.has(modName)) {
                promoted.get(modName).subjects.push(sub);
            } else {
                const newMod = {
                    id: sub.id, _code: sub._code, name: modName,
                    average: null, classAverage: sub.classAverage,
                    coefficient: sub.coefficient, _overridden: true,
                    subjects: [sub],
                };
                promoted.set(modName, newMod);
                marks.push(newMod);
            }
        }
    }

    // Compute averages bottom-up:
    // 1. Subject average = mean of its marks (weighted by mark coefficients)
    // 2. Module average = mean of its subjects (weighted by subject coefficients)
    // 3. Overall average = mean of modules (weighted by module ECTS)
    for (const mod of marks) {
        for (const sub of mod.subjects) {
            let subTotal = 0;
            let subWeight = 0;

            for (const mark of sub.marks) {
                if (mark.value != null && mark.value !== 0.01) {
                    subTotal += mark.value * mark.coefficient;
                    subWeight += mark.coefficient;
                }
            }

            sub.average = subWeight > 0 ? subTotal / subWeight : null;
            if (!sub._overridden) sub.coefficient = subWeight || 1;

            if (subWeight > 0) {
                for (const mark of sub.marks) {
                    mark._rawCoefficient = mark.coefficient;
                    mark.coefficient = mark.coefficient / subWeight;
                }
            }
        }

        let modTotal = 0;
        let modWeight = 0;
        for (const sub of mod.subjects) {
            if (sub.average != null) {
                modTotal += sub.average * sub.coefficient;
                modWeight += sub.coefficient;
            }
        }
        mod.average = modWeight > 0 ? modTotal / modWeight : null;
        if (!mod._overridden) mod.coefficient = modWeight || 1;
    }

    // Overall: ECTS-weighted average of module averages
    let totalSum = 0;
    let totalWeight = 0;
    for (const mod of marks) {
        if (mod.average != null) {
            totalSum += mod.average * mod.coefficient;
            totalWeight += mod.coefficient;
        }
    }

    return { average: totalWeight > 0 ? totalSum / totalWeight : null };
}
