#!/usr/bin/env node
/**
 * Validate a coefficient file before submitting a PR.
 *
 * Usage:
 *   bun tools/validate-coefficients.js coefficients/s07_2526_fisa_cs.js
 *   node tools/validate-coefficients.js coefficients/s07_2526_fisa_cs.js
 */

import { readFileSync } from 'fs';
import { basename, resolve } from 'path';
import { parseExamCode } from '../src/auriga/hierarchy.js';

const file = process.argv[2];
if (!file) {
    console.error('Usage: bun tools/validate-coefficients.js coefficients/<file>.js');
    process.exit(1);
}

const errors = [];
const warnings = [];

// 1. Read source for text-based checks
const absPath = resolve(file);
const source = readFileSync(absPath, 'utf-8');
const name = basename(absPath, '.js');

// 2. Check for duplicate keys (JS silently takes last — text-based check)
//    This catches duplicates that Object.entries() would miss.
const keyPattern = /^\s+'([^']+)':/gm;
const seen = new Map();
let match;
while ((match = keyPattern.exec(source)) !== null) {
    const key = match[1];
    const line = source.substring(0, match.index).split('\n').length;
    if (seen.has(key)) {
        errors.push(`Duplicate key: '${key}' (line ~${seen.get(key)} and line ~${line})`);
    }
    seen.set(key, line);
}

// 3. Dynamic import to check meta + default
const mod = await import(absPath);

if (!mod.default || typeof mod.default !== 'object') {
    errors.push('Missing or invalid default export (expected an object of coefficients)');
}

// 4. Validate meta (required)
const meta = mod.meta;
if (!meta) {
    errors.push('Missing meta export. Add: export const meta = { semester, year, track, major }');
} else {
    for (const field of ['semester', 'year', 'track']) {
        if (!meta[field]) errors.push(`meta.${field} is missing or empty`);
    }
    if (!('major' in meta)) {
        errors.push('meta.major is missing (set to null if no major applies)');
    }

    // Check filename matches meta
    const expectedName = [
        meta.semester?.toLowerCase(),
        meta.year,
        meta.track?.toLowerCase(),
        ...(meta.major ? [meta.major.toLowerCase()] : []),
    ].join('_');

    if (name !== expectedName) {
        errors.push(`Filename '${name}.js' does not match meta. Expected '${expectedName}.js'`);
    }
}

// 5. Parse and validate each coefficient entry using the project's parser
const coefficients = mod.default || {};
const entries = Object.entries(coefficients);

if (entries.length === 0) {
    warnings.push('No coefficient entries found');
}

// Group entries by depth: module (path.length 1), subject (2), mark (3+)
const moduleEntries = [];   // path.length === 1 (e.g. _S07_CN)
const subjectEntries = [];  // path.length === 2 (e.g. _S07_CN_PROD)
const markEntries = [];     // path.length >= 3 (e.g. _S07_CS_FR_MSE_EX)

for (const [code, value] of entries) {
    const parsed = parseExamCode(code);

    if (!parsed) {
        errors.push(`Cannot parse exam code: '${code}'`);
        continue;
    }

    // Validate value type
    if (typeof value === 'number') {
        if (value <= 0) errors.push(`Coefficient must be positive: '${code}': ${value}`);
        if (value > 30) warnings.push(`Unusually high coefficient: '${code}': ${value}`);
    } else if (typeof value === 'object' && value !== null) {
        if (value.ects == null || typeof value.ects !== 'number') {
            errors.push(`Object override must have numeric 'ects': '${code}'`);
        }
    } else {
        errors.push(`Invalid coefficient value for '${code}': ${JSON.stringify(value)}`);
    }

    // Check code matches meta
    if (meta) {
        if (parsed.year !== meta.year) {
            warnings.push(`Code year '${parsed.year}' != meta.year '${meta.year}': '${code}'`);
        }
        if (parsed.track !== meta.track?.toUpperCase()) {
            warnings.push(`Code track '${parsed.track}' != meta.track '${meta.track}': '${code}'`);
        }
        if (parsed.semester !== meta.semester?.toUpperCase()) {
            warnings.push(`Code semester '${parsed.semester}' != meta.semester '${meta.semester}': '${code}'`);
        }
    }

    const entry = { code, value, parsed };
    if (parsed.path.length <= 1) moduleEntries.push(entry);
    else if (parsed.path.length === 2) subjectEntries.push(entry);
    else markEntries.push(entry);
}

// 6. Display results
const yearLabel = meta?.year
    ? `20${meta.year.slice(0, 2)}/20${meta.year.slice(2)}`
    : '?';

console.log('');
console.log(`  Validating: ${file}`);
console.log('');

// Show parsed meta
if (meta) {
    console.log('  Meta');
    console.log(`    Semester:  ${meta.semester}`);
    console.log(`    Year:      ${meta.year} (${yearLabel})`);
    console.log(`    Track:     ${meta.track}`);
    console.log(`    Major:     ${meta.major || '(none)'}`);
    console.log('');
}

// Format a coefficient value for display
function formatValue(value) {
    if (typeof value === 'number') return String(value);
    if (typeof value === 'object' && value !== null) {
        const parts = [`ects: ${value.ects}`];
        if (value.module) parts.push(`module: "${value.module}"`);
        if (value.name) parts.push(`name: "${value.name}"`);
        return `{ ${parts.join(', ')} }`;
    }
    return JSON.stringify(value);
}

// Show coefficient tree
if (moduleEntries.length > 0) {
    console.log(`  Modules (${moduleEntries.length})`);
    for (const { parsed, value } of moduleEntries) {
        const id = parsed.path.join('_') || '?';
        console.log(`    ${id.padEnd(12)} ${formatValue(value)}`);
    }
    console.log('');
}

if (subjectEntries.length > 0) {
    console.log(`  Subjects (${subjectEntries.length})`);
    for (const { parsed, value } of subjectEntries) {
        const id = parsed.path.join('_');
        console.log(`    ${id.padEnd(12)} ${formatValue(value)}`);
    }
    console.log('');
}

if (markEntries.length > 0) {
    console.log(`  Marks (${markEntries.length})`);
    for (const { parsed, value } of markEntries) {
        const path = parsed.path.join('_');
        const suffix = parsed.evalType ? ` (${parsed.evalType})` : '';
        console.log(`    ${(path + suffix).padEnd(24)} ${formatValue(value)}`);
    }
    console.log('');
}

console.log(`  Total: ${entries.length} entries`);

// Show warnings and errors
if (warnings.length) {
    console.log('');
    for (const w of warnings) console.log(`  ! ${w}`);
}
if (errors.length) {
    console.log('');
    for (const e of errors) console.log(`  x ${e}`);
}

if (errors.length === 0) {
    console.log(`\n  OK - Valid! Ready to submit.\n`);
    process.exit(0);
} else {
    console.log(`\n  FAIL - ${errors.length} error(s) found. Please fix before submitting.\n`);
    process.exit(1);
}
