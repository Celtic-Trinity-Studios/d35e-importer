Hooks.once('init', async function() {
    console.log('D35E Importer | Initializing D35E Character Importer module');
    
    // Set up PDF.js worker
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/modules/d35e-importer/scripts/lib/pdf.worker.min.js';
    }
});

Hooks.on('renderActorDirectory', (app, html, data) => {
    // Add a button to the Actor directory to launch the importer
    const button = $(`<button class="d35e-import-button"><i class="fas fa-file-import"></i> ${game.i18n.localize("D35EImporter.ImportButton")}</button>`);
    
    button.on('click', () => {
        new D35EImporterDialog().render(true);
    });

    // Append to the directory header actions
    html.find('.directory-header .action-buttons').append(button);
});

Hooks.on('renderActorSheet', (app, html, data) => {
    // Only show on PC/NPC sheets
    if (!app.actor.isOwner) return;

    const title = html.find('.window-title');
    const button = $(`<a class="d35e-import-sheet-button" title="${game.i18n.localize("D35EImporter.ImportToActor")}"><i class="fas fa-file-import"></i></a>`);
    
    button.on('click', () => {
        new D35EImporterDialog(app.actor).render(true);
    });

    title.after(button);
});
