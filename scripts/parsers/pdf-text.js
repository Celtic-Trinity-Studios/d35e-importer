class PDFTextParser {
    /**
     * Attempts to parse stats heuristically from a PDF character sheet.
     * @param {File|Blob} file The PDF file object
     * @returns {Object} An object containing D35E compatible update data
     */
    static async parse(file) {
        console.log("D35E Importer | Parsing PDF File heuristically...");
        if (typeof pdfjsLib === 'undefined') {
            throw new Error("PDF.js library is not loaded.");
        }

        const updateData = {
            name: "PDF Imported Character",
            system: {
                attributes: {},
                details: {}
            }
        };

        try {
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({data: arrayBuffer});
            const pdfDocument = await loadingTask.promise;
            
            let fullText = "";

            // Loop through all pages and extract text content
            for (let i = 1; i <= pdfDocument.numPages; i++) {
                const page = await pdfDocument.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(" ");
                fullText += pageText + "\n";
            }

            console.log("D35E Importer | Extracted PDF Text:", fullText);

            // --- HEURISTIC MATCHING ---
            // This is inherently flawed for non-standard sheets, but we try our best.
            // Example: "STR 16", "Strength 16 (+3)"
            const strMatch = fullText.match(/(?:STR|Strength)[\s\:\.]*(\d{1,2})/i);
            if (strMatch) updateData.system.attributes.str = { value: parseInt(strMatch[1]) };

            const dexMatch = fullText.match(/(?:DEX|Dexterity)[\s\:\.]*(\d{1,2})/i);
            if (dexMatch) updateData.system.attributes.dex = { value: parseInt(dexMatch[1]) };
            
            const conMatch = fullText.match(/(?:CON|Constitution)[\s\:\.]*(\d{1,2})/i);
            if (conMatch) updateData.system.attributes.con = { value: parseInt(conMatch[1]) };

            const intMatch = fullText.match(/(?:INT|Intelligence)[\s\:\.]*(\d{1,2})/i);
            if (intMatch) updateData.system.attributes.int = { value: parseInt(intMatch[1]) };

            const wisMatch = fullText.match(/(?:WIS|Wisdom)[\s\:\.]*(\d{1,2})/i);
            if (wisMatch) updateData.system.attributes.wis = { value: parseInt(wisMatch[1]) };

            const chaMatch = fullText.match(/(?:CHA|Charisma)[\s\:\.]*(\d{1,2})/i);
            if (chaMatch) updateData.system.attributes.cha = { value: parseInt(chaMatch[1]) };

            const hpMatch = fullText.match(/(?:HP|Hit Points)[\s\:\.]*(\d{1,3})/i);
            if (hpMatch) updateData.system.attributes.hp = { value: parseInt(hpMatch[1]), max: parseInt(hpMatch[1]) };

            console.log("D35E Importer | PDF Heuristic Parse Result:", updateData);
            return updateData;

        } catch (error) {
            console.error("D35E Importer | Failed to parse PDF:", error);
            throw new Error("Could not extract data from the PDF.");
        }
    }
}
