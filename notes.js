// ===========================================
// NOTES.JS - Logique page admin praticienne
// ===========================================

let allReviews = [];
let currentFilter = 'all';
let currentMassageFilter = 'all';

// Charger les avis au démarrage
document.addEventListener('DOMContentLoaded', () => {
    loadReviews();
    setupFilters();
    setupMassageFilter();
});

// Récupérer les avis avec les notes praticienne (mode admin)
async function loadReviews() {
    try {
        const response = await fetch(`${CONFIG.API_URL}?admin=true`);
        const data = await response.json();

        if (data.error) {
            showError(data.error);
            return;
        }

        allReviews = data.reviews || [];
        // Trier par date décroissante (plus récent en premier)
        allReviews.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        updateStats();
        populateMassageFilter();
        renderReviews();

    } catch (error) {
        showError('Erreur de connexion: ' + error.message);
    }
}

// Mettre à jour les statistiques
function updateStats() {
    const total = allReviews.length;
    const withNotes = allReviews.filter(r => r.notesPraticienne && r.notesPraticienne.trim()).length;
    const withoutNotes = total - withNotes;

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-with-notes').textContent = withNotes;
    document.getElementById('stat-without-notes').textContent = withoutNotes;
}

// Configurer les filtres (avec/sans notes)
function setupFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderReviews();
        });
    });
}

// Configurer le filtre par type de massage
function setupMassageFilter() {
    const select = document.getElementById('massage-filter');
    if (!select) return;

    select.addEventListener('change', () => {
        currentMassageFilter = select.value;
        updatePrintTitle();
        renderReviews();
    });
}

// Mettre à jour le titre pour l'impression
function updatePrintTitle() {
    const titleEl = document.getElementById('print-massage-type');

    if (currentMassageFilter === 'all') {
        titleEl.textContent = '';
    } else {
        titleEl.textContent = currentMassageFilter;
    }
}

// Remplir le select avec les types de massage trouvés
function populateMassageFilter() {
    const select = document.getElementById('massage-filter');
    if (!select) return;

    // Récupérer les types uniques depuis les avis
    const types = [...new Set(allReviews.map(r => r.massage).filter(Boolean))].sort();

    // Ajouter les options
    types.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        select.appendChild(option);
    });
}

// Filtrer les avis selon les filtres actifs (notes + massage)
function getFilteredReviews() {
    let filtered = allReviews;

    // Filtre par notes
    switch (currentFilter) {
        case 'with-notes':
            filtered = filtered.filter(r => r.notesPraticienne && r.notesPraticienne.trim());
            break;
        case 'without-notes':
            filtered = filtered.filter(r => !r.notesPraticienne || !r.notesPraticienne.trim());
            break;
    }

    // Filtre par type de massage
    if (currentMassageFilter !== 'all') {
        filtered = filtered.filter(r => r.massage === currentMassageFilter);
    }

    return filtered;
}

// Afficher les avis
function renderReviews() {
    const container = document.getElementById('reviews-container');
    const reviews = getFilteredReviews();

    if (reviews.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Aucun massage ${currentFilter === 'without-notes' ? 'sans notes' : currentFilter === 'with-notes' ? 'avec notes' : ''} pour le moment.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = reviews.map(review => createReviewCard(review)).join('');
}

// Créer une carte de review avec zone de notes
function createReviewCard(review) {
    const hasNotes = review.notesPraticienne && review.notesPraticienne.trim();
    const stars = '★'.repeat(review.note) + '☆'.repeat(5 - review.note);
    const formattedDate = formatDate(review.date);

    // Tags pour tranche d'âge et lien
    const metaTags = [];
    if (review.trancheAge) {
        metaTags.push(`<span class="meta-tag">${escapeHtml(review.trancheAge)}</span>`);
    }
    if (review.lienClelia) {
        metaTags.push(`<span class="meta-tag">${escapeHtml(review.lienClelia)}</span>`);
    }
    const metaHtml = metaTags.length > 0 ? `<span class="client-meta">${metaTags.join('')}</span>` : '';

    return `
        <div class="review-card-admin ${hasNotes ? 'has-notes' : ''}" data-id="${review.id}" data-massage-type="${escapeHtml(review.massage || '')}">
            <div class="client-review">
                <div class="review-header">
                    <div class="review-info">
                        <span class="review-name">${escapeHtml(review.prenom)}</span>${metaHtml}
                        <span class="review-massage">${escapeHtml(review.massage)}</span>
                        <span class="review-date">${formattedDate}</span>
                    </div>
                    <div class="review-stars">${stars}</div>
                </div>
                <p class="review-text">${escapeHtml(review.commentaire)}</p>
            </div>

            ${hasNotes ? createSavedNotesView(review) : createEditNotesView(review)}
        </div>
    `;
}

// Vue lecture : notes enregistrées
function createSavedNotesView(review) {
    return `
        <div class="notes-section notes-saved" id="notes-section-${review.id}" data-massage-type="${escapeHtml(review.massage || '')}">
            <label>Mes notes personnelles :</label>
            <div class="notes-display" id="notes-display-${review.id}">${escapeHtml(review.notesPraticienne).replace(/\n/g, '<br>')}</div>
            <button class="edit-btn" onclick="switchToEditMode(${review.id})">Modifier</button>
        </div>
    `;
}

// Vue édition : textarea
function createEditNotesView(review) {
    return `
        <div class="notes-section notes-editing" id="notes-section-${review.id}" data-massage-type="${escapeHtml(review.massage || '')}">
            <label for="notes-${review.id}">Mes notes personnelles :</label>
            <textarea
                id="notes-${review.id}"
                class="notes-textarea"
                placeholder="Ce qui a bien marché, points à améliorer, tensions détectées..."
                data-id="${review.id}"
            >${escapeHtml(review.notesPraticienne || '')}</textarea>
            <div class="notes-actions">
                <button class="save-btn" onclick="saveNotes(${review.id})" id="save-btn-${review.id}">
                    Enregistrer
                </button>
                ${review.notesPraticienne ? '<button class="cancel-btn" onclick="cancelEdit(' + review.id + ')">Annuler</button>' : ''}
            </div>
        </div>
    `;
}

// Passer en mode édition
function switchToEditMode(reviewId) {
    const review = allReviews.find(r => r.id === reviewId);
    if (!review) return;

    const section = document.getElementById(`notes-section-${reviewId}`);
    section.outerHTML = createEditNotesView(review);

    // Focus sur le textarea
    document.getElementById(`notes-${reviewId}`).focus();
}

// Annuler l'édition et revenir en mode lecture
function cancelEdit(reviewId) {
    const review = allReviews.find(r => r.id === reviewId);
    if (!review || !review.notesPraticienne) return;

    const section = document.getElementById(`notes-section-${reviewId}`);
    section.outerHTML = createSavedNotesView(review);
}

// Sauvegarder les notes
async function saveNotes(reviewId) {
    const textarea = document.getElementById(`notes-${reviewId}`);
    const saveBtn = document.getElementById(`save-btn-${reviewId}`);
    const notes = textarea.value;

    // Désactiver le bouton pendant la sauvegarde
    saveBtn.disabled = true;
    saveBtn.textContent = 'Enregistrement...';

    try {
        // Utiliser no-cors pour contourner CORS de Google Apps Script
        await fetch(CONFIG.API_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({
                action: 'updateNotes',
                id: reviewId,
                notesPraticienne: notes
            })
        });

        // Avec no-cors on ne peut pas lire la réponse
        // On met à jour localement et on fait confiance
        const review = allReviews.find(r => r.id === reviewId);
        if (review) {
            review.notesPraticienne = notes;
        }

        // Mettre à jour les stats
        updateStats();

        // Mettre à jour le style de la carte
        const card = document.querySelector(`.review-card-admin[data-id="${reviewId}"]`);
        if (notes.trim()) {
            card.classList.add('has-notes');
            // Passer en mode lecture avec les notes affichées
            const section = document.getElementById(`notes-section-${reviewId}`);
            section.outerHTML = createSavedNotesView(review);
        } else {
            card.classList.remove('has-notes');
            // Rester en mode édition si pas de notes
            saveBtn.textContent = 'Enregistrer';
            saveBtn.disabled = false;
        }

    } catch (error) {
        saveBtn.textContent = 'Erreur !';
        saveBtn.disabled = false;
        console.error('Erreur sauvegarde:', error);

        setTimeout(() => {
            saveBtn.textContent = 'Réessayer';
        }, 2000);
    }
}

// Formater la date
function formatDate(dateStr) {
    if (!dateStr) return '';

    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    } catch {
        return dateStr;
    }
}

// Échapper le HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Afficher une erreur
function showError(message) {
    const container = document.getElementById('reviews-container');
    container.innerHTML = `
        <div class="empty-state">
            <p style="color: #c0392b;">Erreur: ${escapeHtml(message)}</p>
            <button class="cta-button" onclick="loadReviews()" style="margin-top: 16px;">Réessayer</button>
        </div>
    `;
}
