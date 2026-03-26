# Coefficients

Auriga treats all exams as equally weighted. This directory contains **ECTS weights** from the official syllabus, contributed by the community.

The student average is computed hierarchically — matching the official bulletin:
1. Marks within a subject are averaged equally
2. Subject averages are weighted by their coefficient
3. Module averages are weighted by their ECTS

## File naming

Each file targets a specific **semester + year + track + major** combination:

```
s07_2526_fisa_cs.js     ← S07, year 25/26, FISA, Cybersécurité
s07_2526_fisa_dev.js    ← S07, year 25/26, FISA, Développement
s08_2627_gistre.js      ← S08, year 26/27, GISTRE (no major)
```

Every file must have a `meta` export declaring what it targets, and a `default` export with the coefficients.

## How to add coefficients for your semester

### 1. Get your ECTS from the syllabus

Check your official bulletin or syllabus for the ECTS per UE/SAE.

### 2. Copy the template

In Infinity Auriga, click **Copier les codes** — a pre-filled template with all your module codes is copied to your clipboard. The template includes the correct filename and a `meta` export, both auto-detected from your grades.

### 3. Fill in the ECTS

Replace the `1`s with the ECTS from your syllabus. Delete or comment out lines where the ECTS is 1 (the default).

```js
export const meta = {
    semester: 'S07',
    year: '2526',
    track: 'FISA',
    major: 'CS',
};

export default {
    '2526_I_INF_FISA_S07_CN': 3,          // Concevoir
    '2526_I_INF_FISA_S07_FR': 2,          // Formaliser
    '2526_I_INF_FISA_S07_GR': 3,          // Gérer
    '2526_I_INF_FISA_S07_AEE': 8,         // SAE Evaluation
    // AG and PL are 1 ECTS — default, not listed
};
```

The ECTS applies to the **module** (UE/SAE). All subjects within a module are weighted equally.

### Promoting a subject to its own module

Sometimes Auriga groups subjects from **different UEs** under the same code prefix. For example, "Projet Shell" (SAE 42SH, 2 ECTS) shares the `PR` prefix with "Assembleur" (UE Produire, 3 ECTS).

To separate them, use an object override with `module` and `name` to promote the subject to its own module in the UI:

```js
    '2526_I_INF_FISA_S07_PR': 3,          // Produire (keeps Assembleur)
    '2526_I_INF_FISA_S07_PR_42SH': { ects: 2, module: 'SAE 42SH', name: 'Projet Shell' },
```

This detaches "Projet Shell" from "Produire" and gives it its own module header "SAE 42SH" with 2 ECTS. Subjects promoted to the same `module` name are merged together.

### 4. Validate your file

```bash
bun tools/validate-coefficients.js coefficients/your_file.js
```

This checks for duplicate keys, valid coefficients, and consistency between meta and filename.

### 5. Create a pull request

Create the file on GitHub (click **Contribuer** in the app) and open a PR. No other file to edit — coefficient files are auto-discovered at build time.

See [`s07_2526_fisa_cs.js`](s07_2526_fisa_cs.js) for a real example.
