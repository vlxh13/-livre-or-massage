// ===========================================
// LIVRE D'OR - Affichage des témoignages
// ===========================================

document.addEventListener('DOMContentLoaded', () => {
    loadReviews();
});

// Données locales pour démo (utilisées si pas d'API configurée)
const DEMO_REVIEWS = [
    {
        prenom: 'Marie',
        massage: 'Californien',
        date: '2026-01-15',
        note: 5,
        commentaire: 'Un moment de pure détente. Je suis ressortie complètement apaisée, comme sur un nuage. Les gestes étaient fluides et enveloppants. Je recommande vivement !'
    },
    {
        prenom: 'Sophie',
        massage: 'Dos & Nuque',
        date: '2026-01-12',
        note: 5,
        commentaire: 'Exactement ce dont j\'avais besoin après des semaines de stress au bureau. Mes tensions ont fondu. Merci infiniment.'
    },
    {
        prenom: 'L.',
        massage: 'Relaxant',
        date: '2026-01-10',
        note: 4,
        commentaire: 'Très bon massage, atmosphère zen et reposante. Je reviendrai avec plaisir.'
    }
];

let allReviews = [];

async function loadReviews() {
    const container = document.getElementById('reviews-container');

    if (!CONFIG.API_URL) {
        // Mode démo
        allReviews = DEMO_REVIEWS;
        displayReviews(allReviews);
        setupFilters(CONFIG.MASSAGE_TYPES);
        return;
    }

    try {
        const response = await fetch(CONFIG.API_URL);
        const data = await response.json();
        allReviews = data.reviews || [];
        displayReviews(allReviews);

        // Charger les filtres avec les types depuis l'API ou fallback
        const types = data.massageTypes && data.massageTypes.length > 0
            ? data.massageTypes
            : CONFIG.MASSAGE_TYPES;
        setupFilters(types);
    } catch (error) {
        console.error('Erreur chargement:', error);
        container.innerHTML = `
            <div class="empty-state">
                <p>Impossible de charger les témoignages.</p>
                <p style="font-size: 0.85rem;">Vérifiez la configuration de l'API.</p>
            </div>
        `;
        setupFilters(CONFIG.MASSAGE_TYPES);
    }
}

function displayReviews(reviews) {
    const container = document.getElementById('reviews-container');

    if (reviews.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Aucun témoignage pour le moment.</p>
                <a href="avis.html" class="cta-button">Soyez le premier !</a>
            </div>
        `;
        return;
    }

    // Trier par date (plus récent en premier)
    const sorted = [...reviews].sort((a, b) => new Date(b.date) - new Date(a.date));

    container.innerHTML = sorted.map(review => createReviewCard(review)).join('');
}

function createReviewCard(review) {
    const stars = '★'.repeat(review.note) + '☆'.repeat(5 - review.note);
    const dateFormatted = formatDate(review.date);

    return `
        <article class="review-card" data-massage="${review.massage}">
            <div class="review-header">
                <div class="review-info">
                    <span class="review-name">${escapeHtml(review.prenom)}</span>
                    <span class="review-massage">${escapeHtml(review.massage)}</span>
                </div>
                <div>
                    <div class="review-stars">${stars}</div>
                    <span class="review-date">${dateFormatted}</span>
                </div>
            </div>
            <p class="review-text">${escapeHtml(review.commentaire)}</p>
        </article>
    `;
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===========================================
// FILTRES
// ===========================================

function setupFilters(massageTypes) {
    const filtersContainer = document.querySelector('.filters');

    // Ajouter les filtres par type de massage
    massageTypes.forEach(type => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.dataset.filter = type;
        btn.textContent = type;
        filtersContainer.appendChild(btn);
    });

    // Gestion des clics
    filtersContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-btn')) {
            // Mettre à jour l'état actif
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');

            // Filtrer
            const filter = e.target.dataset.filter;
            if (filter === 'all') {
                displayReviews(allReviews);
            } else {
                const filtered = allReviews.filter(r => r.massage === filter);
                displayReviews(filtered);
            }
        }
    });
}
