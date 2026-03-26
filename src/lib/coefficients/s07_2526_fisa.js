/**
 * Coefficients — S07 FISA 2025/2026
 *
 * Override coefficients at any level of the hierarchy:
 *   - Module:  use the module code  (e.g. '2526_I_INF_FISA_S07_AEE')
 *   - Subject: use the subject code (e.g. '2526_I_INF_FISA_S07_CS_GR')
 *   - Mark:    use the full exam code (e.g. '2526_I_INF_FISA_S07_CS_GR_WS_EX')
 *
 * Only list entries whose coefficient is NOT 1 (default).
 *
 * To find codes: open Auriga → DevTools → Network tab →
 * look for POST requests to /api/menuEntries/.../searchResult →
 * each line's 4th value is the exam code. Trim segments for subject/module.
 */
export default {
    // --- Module-level overrides ---
    // Alternance / Evaluation en entreprise (coeff 8)
    '2526_I_INF_FISA_S07_AEE': 8,

    // --- Mark-level overrides ---
    // Gérer > Windows sécurité (coeff 2, vs LAN concepts coeff 1)
    '2526_I_INF_FISA_S07_CS_GR_WS_EX': 2,

    // SAE Développement sécurisé > Projet (coeff 3)
    '2526_I_INF_FISA_S07_CS_SAE_DEVSEC_PROJ_EX': 3,

    // SAE Tests d'intrusions > Méthodes d'audit (coeff 2)
    '2526_I_INF_FISA_S07_CS_SAE_INT_MAS_EX': 2,

    // SAE Tests d'intrusions > Pentest (coeff 2)
    '2526_I_INF_FISA_S07_CS_SAE_INT_PEN_EX': 2,

    // --- DEV module: subject-level weights (relative to each other within DEV) ---
    // CI (BADG1=2 + UXUI=1) = 3
    '2526_I_INF_FISA_S07_DEV_CI': 3,
    // OC (PPAR=2 + SOCRA=1) = 3
    '2526_I_INF_FISA_S07_DEV_OC': 3,
    // WMM (AWEB=3 + IANDO=2 + IJST=1.5 + J2E=2) = 8.5
    '2526_I_INF_FISA_S07_DEV_WMM': 8.5,
    // WEB1 (PWEB=1.5)
    '2526_I_INF_FISA_S07_DEV_WEB1': 1.5,

    // --- DEV mark-level: weights within their subject ---
    // DEV CI > Moteurs de jeux (coeff 2, vs UXUI coeff 1)
    '2526_I_INF_FISA_S07_DEV_CI_BADG1_EX': 2,

    // DEV OC > Intro prog. parallèle (coeff 2, vs SOCRA coeff 1)
    '2526_I_INF_FISA_S07_DEV_OC_PPAR_EX': 2,

    // DEV WMM > individual mark weights (all marks share DEV_WMM subject)
    '2526_I_INF_FISA_S07_DEV_WMM_AWEB_EX': 3,
    '2526_I_INF_FISA_S07_DEV_WMM_IANDO_EX': 2,
    '2526_I_INF_FISA_S07_DEV_WMM_IJST_EX': 1.5,
    // J2E total coeff 2, split 25%/75% → 0.5 / 1.5
    '2526_I_INF_FISA_S07_DEV_WMM_J2E_EX': 0.5,
    '2526_I_INF_FISA_S07_DEV_WMM_J2E_PROJET': 1.5,

    // --- Module-level overrides for single-subject modules ---
    // PR > Projet SHELL (coeff 2)
    '2526_I_INF_FISA_S07_PR': 2,
    // PL > Conduite de projet agile (coeff 3)
    '2526_I_INF_FISA_S07_PL': 3,
};
