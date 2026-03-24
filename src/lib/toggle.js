const PREF_KEY = 'infinity_auriga_enabled';

export function isInfinityEnabled() {
    return localStorage.getItem(PREF_KEY) !== '0';
}

/**
 * Create the view switcher. Switching modes reloads the page.
 */
export function setupToggle(active) {
    const style = document.createElement('style');
    style.textContent = `
        #view-switcher { display:flex; position:fixed; bottom:28px; left:28px; z-index:9999; padding:4px; border-radius:14px; background:#fff; box-shadow:0 4px 20px rgba(0,0,0,.18),0 0 0 1px rgba(0,0,0,.06); font-family:system-ui,-apple-system,sans-serif; }
        #view-switcher .switcher-pill { position:absolute; top:4px; left:4px; width:calc(50% - 4px); height:calc(100% - 8px); border-radius:11px; background:#151925; transition:transform .3s cubic-bezier(.4,0,.2,1); pointer-events:none; }
        #view-switcher .switcher-option { position:relative; z-index:1; padding:10px 24px; border-radius:11px; background:none; border:none; outline:none; color:#868DA0; font-size:14px; font-weight:600; font-family:inherit; letter-spacing:.3px; cursor:pointer; user-select:none; white-space:nowrap; transition:color .25s; }
        #view-switcher .switcher-option:hover { color:#151925; }
        #view-switcher .switcher-option.active { color:#fff; }
    `;
    document.head.appendChild(style);

    const switcher = document.createElement('div');
    switcher.id = 'view-switcher';

    const pill = document.createElement('div');
    pill.className = 'switcher-pill';

    const btnInfinity = document.createElement('button');
    btnInfinity.className = 'switcher-option' + (active === 'infinity' ? ' active' : '');
    btnInfinity.textContent = 'Infinity';

    const btnClassic = document.createElement('button');
    btnClassic.className = 'switcher-option' + (active === 'classic' ? ' active' : '');
    btnClassic.textContent = 'Classique';

    pill.style.transform = active === 'infinity' ? 'translateX(0)' : 'translateX(100%)';

    switcher.append(pill, btnInfinity, btnClassic);
    document.body.appendChild(switcher);

    btnInfinity.addEventListener('click', () => {
        if (active === 'infinity') return;
        localStorage.setItem(PREF_KEY, '1');
        window.location.reload();
    });

    btnClassic.addEventListener('click', () => {
        if (active === 'classic') return;
        localStorage.setItem(PREF_KEY, '0');
        window.location.reload();
    });
}
