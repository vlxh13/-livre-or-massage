// ===========================================
// GOOGLE APPS SCRIPT - Backend Livre d'Or
// ===========================================
//
// INSTRUCTIONS :
// 1. Créer un Google Sheet avec les colonnes :
//    A: Timestamp | B: Prénom | C: Massage | D: Date | E: Note | F: Commentaire
//
// 2. Dans le Google Sheet, aller dans Extensions > Apps Script
//
// 3. Copier-coller tout ce code
//
// 4. Cliquer sur "Déployer" > "Nouveau déploiement"
//    - Type: Application Web
//    - Exécuter en tant que: Moi
//    - Accès: Tout le monde
//
// 5. Copier l'URL du déploiement et la mettre dans config.js
// ===========================================

// Nom de la feuille (onglet) dans votre Google Sheet
const SHEET_NAME = 'Avis';

// GET - Récupérer tous les avis
function doGet(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

    if (!sheet) {
      return createJsonResponse({ error: 'Feuille non trouvée', reviews: [] });
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const reviews = [];

    // Parcourir les lignes (en sautant l'en-tête)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[1]) { // Si le prénom existe
        reviews.push({
          timestamp: row[0],
          prenom: row[1],
          massage: row[2],
          date: formatDateForOutput(row[3]),
          note: parseInt(row[4]) || 5,
          commentaire: row[5]
        });
      }
    }

    return createJsonResponse({ reviews: reviews });

  } catch (error) {
    return createJsonResponse({ error: error.message, reviews: [] });
  }
}

// POST - Ajouter un nouvel avis
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

    if (!sheet) {
      // Créer la feuille si elle n'existe pas
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const newSheet = ss.insertSheet(SHEET_NAME);
      newSheet.appendRow(['Timestamp', 'Prénom', 'Massage', 'Date', 'Note', 'Commentaire']);
      sheet = newSheet;
    }

    // Parser les données JSON
    const data = JSON.parse(e.postData.contents);

    // Ajouter la nouvelle ligne
    sheet.appendRow([
      new Date().toISOString(),
      data.prenom || '',
      data.massage || '',
      data.date || '',
      data.note || 5,
      data.commentaire || ''
    ]);

    return createJsonResponse({ success: true, message: 'Avis enregistré' });

  } catch (error) {
    return createJsonResponse({ success: false, error: error.message });
  }
}

// Helper pour formater la date
function formatDateForOutput(dateValue) {
  if (!dateValue) return '';

  if (dateValue instanceof Date) {
    return dateValue.toISOString().split('T')[0];
  }

  return String(dateValue);
}

// Helper pour créer une réponse JSON
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
