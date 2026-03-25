# Coefficients

Auriga treats all exams as equally weighted. This directory contains the **real** coefficients, contributed by the community.

The student average is a **flat weighted average** of all marks: `Σ(mark × coef) / Σ(coef)`. Subject and module weights are derived from the sum of their children's coefficients automatically.

## How to add coefficients for your semester

### 1. Find your codes

**Hover** any mark name in Infinity Auriga — a tooltip shows its full code. **Click** to copy it to your clipboard.

Every copyable name has a <u>dashed underline</u> to indicate it's clickable.

![Hover a name to see its code, click to copy](../../../docs/img/copy-code.png)

### Code anatomy

```
2526_I_INF_FISA_S07_CS_GR_WS_EX
│    │ │   │    │   │  │  │  └─ eval type (EX, PRJ, EXF, ...)
│    │ │   │    │   │  │  └──── exam
│    │ │   │    │   │  └─────── subject
│    │ │   │    │   └────────── module
│    │ │   │    └────────────── semester
│    │ │   └─────────────────── track (FISA, FISE, GISTRE, ...)
│    │ └─────────────────────── school
│    └───────────────────────── always I
└────────────────────────────── academic year (25/26)
```

### 2. Create a file

Filename: `s{semester}_{year}_{track}.js` (all lowercase)

| Semester | Year | Track | Filename |
|----------|------|-------|----------|
| S07 | 2025/2026 | FISA | `s07_2526_fisa.js` |
| S08 | 2025/2026 | FISE | `s08_2526_fise.js` |
| S09 | 2026/2027 | GISTRE | `s09_2627_gistre.js` |

### 3. Fill in your coefficients

Use the full exam code for each mark. Only list entries whose coefficient is NOT 1:

```js
/**
 * Coefficients — S?? TRACK YEAR
 * Only list entries whose coefficient is NOT 1.
 */
export default {
    'XXXX_I_INF_TRACK_SXX_AEE_EAE3_EX': 8,          // Alternance
    'XXXX_I_INF_TRACK_SXX_CS_GR_WS_EX': 2,           // Windows sécurité
};
```

See [`s07_2526_fisa.js`](s07_2526_fisa.js) for a real example.

### 4. Open a pull request

That's it. No other file to edit — coefficient files are auto-discovered at build time.
