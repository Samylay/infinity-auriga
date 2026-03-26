/**
 * Coefficients — S07 FISA 2025/2026
 * Filename: s07_2526_fisa.js
 * Set ECTS at module level (applies equally to all subjects).
 * If a module mixes UEs with different ECTS, uncomment the
 * subject lines below it and set their ECTS individually.
 */
export default {
    // ── UE CONCEVOIR (3 ECTS) ───────────────────────────────────
    '2526_I_INF_FISA_S07_CN': 3,          // Concevoir
    // '2526_I_INF_FISA_S07_CN_COCO': ?,     // └ Codes correcteurs
    // '2526_I_INF_FISA_S07_CN_AI4SEC': ?,   // └ Intelligence artificielle pour la cybersécurité
    // '2526_I_INF_FISA_S07_CN_PROD': ?,     // └ Probabilités discrètes
    // '2526_I_INF_FISA_S07_CN_COLIN': ?,    // └ Innovation collaborative

    // ── UE FORMALISER (2 ECTS) ──────────────────────────────────
    '2526_I_INF_FISA_S07_FR': 2,          // Formaliser

    // ── UE GERER (3 ECTS) ──────────────────────────────────────
    '2526_I_INF_FISA_S07_GR': 3,          // Gérer

    // ── UE PRODUIRE (3 ECTS) ───────────────────────────────────
    '2526_I_INF_FISA_S07_PR': 3,          // Produire

    // ── SAE Développement sécurisé (3 ECTS) ─────────────────────
    '2526_I_INF_FISA_S07_DEVSEC': 3,      // Développement sécurisé

    // ── SAE Tests d'Intrusions (4 ECTS) ─────────────────────────
    '2526_I_INF_FISA_S07_INT': 4,         // Tests d'intrusions

    // ── SAE 42SH (2 ECTS) — shares PR prefix, promoted to its own module
    '2526_I_INF_FISA_S07_PR_42SH': { ects: 2, module: 'SAE 42SH', name: 'Projet Shell' },

    // ── UE AGIR (1 ECTS) ───────────────────────────────────────
    // '2526_I_INF_FISA_S07_AG': 1,       // default

    // ── UE PILOTER (1 ECTS) ────────────────────────────────────
    // '2526_I_INF_FISA_S07_PL': 1,       // default

    // ── SAE Evaluation de l'apprentissage en entreprise (8 ECTS)
    '2526_I_INF_FISA_S07_AEE': 8,         // AEE
};
