// ===========================================
// FORMULAIRE - Soumission des témoignages
// ===========================================

document.addEventListener('DOMContentLoaded', () => {
    loadMassageTypes();
    setupForm();
    setDefaultDate();
});

// Charger les types de massage depuis l'API
async function loadMassageTypes() {
    const select = document.getElementById('massage');

    if (!CONFIG.API_URL) {
        // Mode démo - utiliser les types par défaut
        populateMassageSelect(CONFIG.MASSAGE_TYPES);
        return;
    }

    try {
        const response = await fetch(CONFIG.API_URL);
        const data = await response.json();

        if (data.massageTypes && data.massageTypes.length > 0) {
            populateMassageSelect(data.massageTypes);
        } else {
            // Fallback sur config locale
            populateMassageSelect(CONFIG.MASSAGE_TYPES);
        }
    } catch (error) {
        console.error('Erreur chargement types:', error);
        populateMassageSelect(CONFIG.MASSAGE_TYPES);
    }
}

// Remplir le select avec les types
function populateMassageSelect(types) {
    const select = document.getElementById('massage');
    select.innerHTML = '<option value="">Choisir...</option>';

    types.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        select.appendChild(option);
    });
}

function setDefaultDate() {
    const dateInput = document.getElementById('date');
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    dateInput.max = today; // Pas de date future
}

function setupForm() {
    const form = document.getElementById('review-form');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = form.querySelector('.submit-btn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');

        // État loading
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline';

        // Collecter les données
        const formData = {
            prenom: form.prenom.value.trim(),
            massage: form.massage.value,
            date: form.date.value,
            note: parseInt(form.note.value),
            commentaire: form.commentaire.value.trim(),
            trancheAge: form.trancheAge.value,
            lienClelia: form.lienClelia.value,
            timestamp: new Date().toISOString()
        };

        try {
            if (!CONFIG.API_URL) {
                // Mode démo - simuler un envoi
                await new Promise(resolve => setTimeout(resolve, 1000));
                showSuccess();
                return;
            }

            const response = await fetch(CONFIG.API_URL, {
                method: 'POST',
                mode: 'no-cors', // Nécessaire pour Google Apps Script
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            // Avec no-cors, on ne peut pas lire la réponse
            // On considère que c'est OK si pas d'erreur
            showSuccess();

        } catch (error) {
            console.error('Erreur envoi:', error);
            alert('Une erreur est survenue. Veuillez réessayer.');

            // Reset bouton
            submitBtn.disabled = false;
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
        }
    });
}

function showSuccess() {
    const form = document.getElementById('review-form');
    const successMessage = document.getElementById('success-message');

    form.style.display = 'none';
    successMessage.style.display = 'block';

    // Scroll vers le haut
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
