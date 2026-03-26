import { describe, it, expect } from 'vitest';
import { generateTemplate, applyCoefficients } from './index.js';

// Minimal grade tree matching the structure built by buildGradeTree
function makeMarks() {
    return [
        {
            id: 'CS', _code: '2526_I_INF_FISA_S07_CS', name: 'Cybersécurité',
            average: null, classAverage: null, coefficient: 1,
            subjects: [
                {
                    id: 'CS_FR', _code: '2526_I_INF_FISA_S07_CS_FR', name: 'Forensique',
                    average: null, classAverage: null, coefficient: 1,
                    marks: [
                        { id: 0, _code: '2526_I_INF_FISA_S07_CS_FR_MSE_EX', name: 'Forensique MSE', value: 15, classAverage: 14, coefficient: 100 },
                        { id: 1, _code: '2526_I_INF_FISA_S07_CS_GR_WS_EX', name: 'Windows sécurité', value: 12, classAverage: 13, coefficient: 100 },
                    ],
                },
            ],
        },
        {
            id: 'PR', _code: '2526_I_INF_FISA_S07_PR', name: 'Programmation',
            average: null, classAverage: null, coefficient: 1,
            subjects: [
                {
                    id: 'PR_42SH', _code: '2526_I_INF_FISA_S07_PR_42SH', name: '42sh',
                    average: null, classAverage: null, coefficient: 1,
                    marks: [
                        { id: 0, _code: '2526_I_INF_FISA_S07_PR_42SH_EX', name: '42sh', value: 18, classAverage: 15, coefficient: 100 },
                    ],
                },
            ],
        },
    ];
}

describe('generateTemplate', () => {
    it('generates a valid JS module with module-level codes', () => {
        const { filename, content } = generateTemplate(makeMarks(), 'S07_2526', 'FISA');

        expect(filename).toBe('s07_2526_fisa.js');
        expect(content).toContain('export default {');
        expect(content).toContain("'2526_I_INF_FISA_S07_CS': 1,");
        expect(content).toContain("'2526_I_INF_FISA_S07_PR': 1,");
        expect(content).toContain('};');
    });

    it('includes module names as inline comments', () => {
        const { content } = generateTemplate(makeMarks(), 'S07_2526', 'FISA');

        expect(content).toContain('// Cybersécurité');
        expect(content).toContain('// Programmation');
    });

    it('includes semester/track/year in the header comment', () => {
        const { content } = generateTemplate(makeMarks(), 'S07_2526', 'FISA');
        expect(content).toContain('S07 FISA 2025/2026');
    });

    it('handles different semester/track combos', () => {
        const { filename, content } = generateTemplate(makeMarks(), 'S08_2627', 'GISTRE');
        expect(filename).toBe('s08_2627_gistre.js');
        expect(content).toContain('S08 GISTRE 2026/2027');
    });

    it('skips modules with no marks', () => {
        const marks = makeMarks();
        marks[0].subjects[0].marks = [];
        const { content } = generateTemplate(marks, 'S07_2526', 'FISA');

        expect(content).not.toContain('Cybersécurité');
        expect(content).toContain('Programmation');
    });

    it('pre-fills existing overrides', () => {
        const overrides = new Map([['2526_I_INF_FISA_S07_CS', 3]]);
        const { content } = generateTemplate(makeMarks(), 'S07_2526', 'FISA', overrides);
        expect(content).toContain("'2526_I_INF_FISA_S07_CS': 3,");
    });
});

describe('applyCoefficients', () => {
    it('applies module-level overrides and computes hierarchical average', () => {
        const marks = makeMarks();
        const overrides = new Map([
            ['2526_I_INF_FISA_S07_CS', 5],
            ['2526_I_INF_FISA_S07_PR', 2],
        ]);

        const { average } = applyCoefficients(marks, overrides);

        // CS module avg = (15 + 12) / 2 = 13.5, weight 5
        // PR module avg = 18, weight 2
        // Overall = (13.5*5 + 18*2) / (5+2) = (67.5 + 36) / 7 = 103.5/7
        expect(average).toBeCloseTo(103.5 / 7);
    });

    it('applies mark-level overrides within subjects', () => {
        const marks = makeMarks();
        const overrides = new Map([
            ['2526_I_INF_FISA_S07_CS_FR_MSE_EX', 2],
            ['2526_I_INF_FISA_S07_CS_GR_WS_EX', 3],
        ]);

        applyCoefficients(marks, overrides);

        // Subject avg = (15*2 + 12*3) / (2+3) = 66/5 = 13.2
        expect(marks[0].subjects[0].average).toBeCloseTo(13.2);
    });

    it('marks overridden items with _overridden flag', () => {
        const marks = makeMarks();
        const overrides = new Map([['2526_I_INF_FISA_S07_CS_FR_MSE_EX', 5]]);

        applyCoefficients(marks, overrides);

        expect(marks[0].subjects[0].marks[0]._overridden).toBe(true);
        expect(marks[0].subjects[0].marks[1]._overridden).toBeUndefined();
    });

    it('normalizes API default coefficient 100 to 1', () => {
        const marks = makeMarks();
        applyCoefficients(marks, null);
        expect(marks[0].subjects[0].marks[0]._rawCoefficient).toBe(1);
    });

    it('computes equal average when all coefficients are 1', () => {
        const marks = makeMarks();
        const { average } = applyCoefficients(marks, null);

        // CS avg = (15+12)/2 = 13.5, weight 2
        // PR avg = 18, weight 1
        // Overall = (13.5*2 + 18*1) / 3 = 45/3 = 15
        expect(average).toBeCloseTo(15);
    });

    it('handles null overrides gracefully', () => {
        const marks = makeMarks();
        const { average } = applyCoefficients(marks, null);
        expect(average).toBeCloseTo(15);
    });
});
