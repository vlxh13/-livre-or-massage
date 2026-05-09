// ===========================================
// GOOGLE APPS SCRIPT - Backend Livre d'Or
// ===========================================
//
// INSTRUCTIONS :
// 1. Créer un Google Sheet avec les colonnes :
//    A: Timestamp | B: Prénom | C: Massage | D: Date | E: Note | F: Commentaire | G: Notes Praticienne | H: Tranche Age | I: Lien Clélia
//
// 2. Dans le Google Sheet, aller dans Extensions > Apps Script
//
// 3. Copier-coller tout ce code
//
// 4. ⚠️ SÉCURITÉ — Définir un token admin :
//    Project Settings (icône engrenage à gauche) > Script Properties > Add script property
//      Property : ADMIN_TOKEN
//      Value    : <token_random_long> (ex : openssl rand -hex 24, ou random.org)
//    Sans cette propriété, les notes praticienne et infos clients privées
//    restent inaccessibles, même avec ?admin=true.
//
// 5. Cliquer sur "Déployer" > "Nouveau déploiement"
//    - Type: Application Web
//    - Exécuter en tant que: Moi
//    - Accès: Tout le monde
//
// 6. Copier l'URL du déploiement et la mettre dans config.js
//
// 7. Au premier accès à notes.html, le navigateur demandera le token
//    (stocké ensuite dans le localStorage du navigateur).
// ===========================================

// Noms des feuilles (onglets)
const SHEET_NAME = 'Avis';
const CONFIG_SHEET_NAME = 'Config';

// Vérifie le token admin contre la Script Property ADMIN_TOKEN.
// Retourne true uniquement si la property est définie ET correspond au token fourni.
function isValidAdminToken(token) {
  if (!token) return false;
  const expected = PropertiesService.getScriptProperties().getProperty('ADMIN_TOKEN');
  if (!expected) return false; // Sécu par défaut : si pas configuré, jamais admin
  return token === expected;
}

// GET - Récupérer les avis ET les types de massage
// Paramètres: ?admin=true&token=<ADMIN_TOKEN> pour inclure les notes praticienne
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);
    const requestedAdmin = e && e.parameter && e.parameter.admin === 'true';
    const isAdmin = requestedAdmin && isValidAdminToken(e.parameter.token);

    // Récupérer les types de massage depuis l'onglet Config
    const massageTypes = getMassageTypes(ss);

    if (!sheet) {
      return createJsonResponse({ error: 'Feuille non trouvée', reviews: [], massageTypes: massageTypes });
    }

    const data = sheet.getDataRange().getValues();
    const reviews = [];

    // Parcourir les lignes (en sautant l'en-tête)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[1]) { // Si le prénom existe
        const review = {
          id: i + 1, // Numéro de ligne (pour update)
          timestamp: row[0],
          prenom: row[1],
          massage: row[2],
          date: formatDateForOutput(row[3]),
          note: parseInt(row[4]) || 5,
          commentaire: row[5]
        };

        // Inclure les notes praticienne et infos privées seulement en mode admin authentifié
        if (isAdmin) {
          review.notesPraticienne = row[6] || '';
          review.trancheAge = row[7] || '';
          review.lienClelia = row[8] || '';
        }

        reviews.push(review);
      }
    }

    // Si admin demandé sans token valide → flag pour que le frontend re-prompt
    const response = { reviews: reviews, massageTypes: massageTypes };
    if (requestedAdmin && !isAdmin) {
      response.adminAuthRequired = true;
    }
    return createJsonResponse(response);

  } catch (error) {
    return createJsonResponse({ error: error.message, reviews: [], massageTypes: [] });
  }
}

// Lire les types de massage depuis l'onglet Config
function getMassageTypes(ss) {
  const configSheet = ss.getSheetByName(CONFIG_SHEET_NAME);

  if (!configSheet) {
    // Fallback si pas d'onglet Config
    return ['Relaxant', 'Sportif', 'Californien', 'Dos & Nuque', 'Jambes légères', 'Visage', 'Autre'];
  }

  const data = configSheet.getDataRange().getValues();
  const types = [];

  // Lire colonne A (en sautant l'en-tête si présent)
  for (let i = 0; i < data.length; i++) {
    const value = data[i][0];
    if (value && typeof value === 'string' && value.trim() !== '' && value !== 'Types de massage') {
      types.push(value.trim());
    }
  }

  return types.length > 0 ? types : ['Relaxant', 'Sportif', 'Californien', 'Dos & Nuque', 'Jambes légères', 'Visage', 'Autre'];
}

// POST - Ajouter un nouvel avis OU mettre à jour les notes praticienne
function doPost(e) {
  try {
    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

    if (!sheet) {
      // Créer la feuille si elle n'existe pas
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const newSheet = ss.insertSheet(SHEET_NAME);
      newSheet.appendRow(['Timestamp', 'Prénom', 'Massage', 'Date', 'Note', 'Commentaire', 'Notes Praticienne', 'Tranche Age', 'Lien Clélia']);
      sheet = newSheet;
    }

    // Parser les données JSON
    const data = JSON.parse(e.postData.contents);

    // ACTION: Mettre à jour les notes praticienne — auth obligatoire
    if (data.action === 'updateNotes') {
      if (!isValidAdminToken(data.adminToken)) {
        return createJsonResponse({ success: false, error: 'Token admin invalide ou absent' });
      }
      const rowId = parseInt(data.id);
      if (!rowId || rowId < 2) {
        return createJsonResponse({ success: false, error: 'ID invalide' });
      }

      // Mettre à jour la colonne G (index 7) de la ligne spécifiée
      sheet.getRange(rowId, 7).setValue(data.notesPraticienne || '');

      return createJsonResponse({ success: true, message: 'Notes mises à jour' });
    }

    // ACTION PAR DÉFAUT: Ajouter un nouvel avis (publique, pas d'auth requise)
    sheet.appendRow([
      new Date().toISOString(),
      data.prenom || '',
      data.massage || '',
      data.date || '',
      data.note || 5,
      data.commentaire || '',
      '', // Notes praticienne vide au départ
      data.trancheAge || '',
      data.lienClelia || ''
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
