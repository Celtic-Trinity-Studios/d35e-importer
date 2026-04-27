Hooks.once('init', async function() {
    console.log('D35E Importer | Initializing D35E Character Importer module');
    
    // Set up PDF.js worker
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/modules/d35e-importer/scripts/lib/pdf.worker.min.js';
    }
});

// ---- Actor Directory Button ----
// V13 uses ApplicationV2 so `html` is a plain DOM Element, not jQuery.
// V12 and earlier used jQuery. We handle both.

Hooks.on('renderActorDirectory', (app, html, data) => {
    // Normalize to a plain DOM element
    const element = html instanceof jQuery ? html[0] : (html?.element ?? html);
    if (!element || !(element instanceof HTMLElement)) {
        console.warn('D35E Importer | Could not find Actor Directory element');
        return;
    }

    // Avoid duplicate buttons
    if (element.querySelector('.d35e-import-button')) return;

    const button = document.createElement('button');
    button.className = 'd35e-import-button';
    button.type = 'button';
    button.innerHTML = `<i class="fas fa-file-import"></i> ${game.i18n.localize("D35EImporter.ImportButton")}`;
    button.addEventListener('click', () => {
        new D35EImporterDialog().render(true);
    });

    // Try multiple selectors for different Foundry versions
    const target = element.querySelector('.directory-header .action-buttons')
                || element.querySelector('.header-actions')
                || element.querySelector('.directory-header')
                || element.querySelector('header');
    
    if (target) {
        target.appendChild(button);
    } else {
        // Fallback: prepend to the element itself
        element.prepend(button);
    }
});

// ---- Actor Sheet Button ----
Hooks.on('renderActorSheet', (app, html, data) => {
    if (!app.actor.isOwner) return;

    // Normalize to a plain DOM element
    const element = html instanceof jQuery ? html[0] : (html?.element ?? html);
    if (!element || !(element instanceof HTMLElement)) return;

    // Avoid duplicate buttons
    if (element.querySelector('.d35e-import-sheet-button')) return;

    const button = document.createElement('a');
    button.className = 'd35e-import-sheet-button';
    button.title = game.i18n.localize("D35EImporter.ImportToActor");
    button.innerHTML = '<i class="fas fa-file-import"></i>';
    button.addEventListener('click', () => {
        new D35EImporterDialog(app.actor).render(true);
    });

    // Try multiple selectors for the title bar area
    const title = element.querySelector('.window-title');
    if (title && title.parentNode) {
        title.parentNode.insertBefore(button, title.nextSibling);
    } else {
        // Fallback: look for a header area
        const header = element.querySelector('.window-header') || element.querySelector('header');
        if (header) {
            header.appendChild(button);
        }
    }
});
