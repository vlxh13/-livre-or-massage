// ===========================================
// NOTES.JS - Logique page admin praticienne
// ===========================================

let allReviews = [];
let currentFilter = 'all';

// Charger les avis au démarrage
document.addEventListener('DOMContentLoaded', () => {
    loadReviews();
    setupFilters();
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

// Configurer les filtres
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

// Filtrer les avis selon le filtre actif
function getFilteredReviews() {
    switch (currentFilter) {
        case 'with-notes':
            return allReviews.filter(r => r.notesPraticienne && r.notesPraticienne.trim());
        case 'without-notes':
            return allReviews.filter(r => !r.notesPraticienne || !r.notesPraticienne.trim());
        default:
            return allReviews;
    }
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

    return `
        <div class="review-card-admin ${hasNotes ? 'has-notes' : ''}" data-id="${review.id}">
            <div class="client-review">
                <div class="review-header">
                    <div class="review-info">
                        <span class="review-name">${escapeHtml(review.prenom)}</span>
                        <span class="review-massage">${escapeHtml(review.massage)}</span>
                        <span class="review-date">${formattedDate}</span>
                    </div>
                    <div class="review-stars">${stars}</div>
                </div>
                <p class="review-text">${escapeHtml(review.commentaire)}</p>
            </div>

            <div class="notes-section">
                <label for="notes-${review.id}">Mes notes personnelles :</label>
                <textarea
                    id="notes-${review.id}"
                    class="notes-textarea"
                    placeholder="Ce qui a bien marché, points à améliorer, tensions détectées..."
                    data-id="${review.id}"
                    data-original="${escapeHtml(review.notesPraticienne || '')}"
                >${escapeHtml(review.notesPraticienne || '')}</textarea>
                <button class="save-btn" onclick="saveNotes(${review.id})" id="save-btn-${review.id}">
                    Enregistrer
                </button>
                ${hasNotes ? '<span class="timestamp-small">Notes enregistrées</span>' : '<span class="empty-notes">Pas encore de notes</span>'}
            </div>
        </div>
    `;
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
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'updateNotes',
                id: reviewId,
                notesPraticienne: notes
            })
        });

        const data = await response.json();

        if (data.success) {
            // Mettre à jour les données locales
            const review = allReviews.find(r => r.id === reviewId);
            if (review) {
                review.notesPraticienne = notes;
            }

            // Feedback visuel
            saveBtn.textContent = 'Enregistré !';
            saveBtn.classList.add('saved');
            textarea.dataset.original = notes;

            // Mettre à jour les stats
            updateStats();

            // Mettre à jour le style de la carte
            const card = document.querySelector(`.review-card-admin[data-id="${reviewId}"]`);
            if (notes.trim()) {
                card.classList.add('has-notes');
            } else {
                card.classList.remove('has-notes');
            }

            // Reset du bouton après 2 secondes
            setTimeout(() => {
                saveBtn.textContent = 'Enregistrer';
                saveBtn.classList.remove('saved');
                saveBtn.disabled = false;
            }, 2000);

        } else {
            throw new Error(data.error || 'Erreur inconnue');
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
