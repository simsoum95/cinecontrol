/**
 * CinéControl - Smart Home Theater Controller
 * Main Application Logic
 */

// ============================================
// CONFIGURATION DES APPAREILS
// ============================================

const DEVICES = {
    projector: {
        name: 'Epson EH-TW9400',
        type: 'projector',
        ip: '192.168.1.100', // À configurer
        port: 3629,
        protocol: 'escvp21'
    },
    receiver: {
        name: 'Pioneer VSX-LX303',
        type: 'receiver',
        ip: '192.168.1.101', // À configurer
        port: 8102,
        protocol: 'pioneer'
    },
    shield: {
        name: 'NVIDIA Shield TV',
        type: 'androidtv',
        ip: '192.168.1.102', // À configurer
        port: 5555,
        protocol: 'adb'
    },
    appletv: {
        name: 'Apple TV 4K',
        type: 'appletv',
        ip: '192.168.1.103', // À configurer
        protocol: 'pyatv'
    },
    ps5: {
        name: 'PlayStation 5',
        type: 'ps5',
        ip: '192.168.1.104', // À configurer
        protocol: 'ps5waker'
    }
};

// ============================================
// CONFIGURATION DES SCÉNARIOS
// ============================================

const SCENARIOS = {
    netflix: {
        name: 'Netflix',
        description: 'Lancement de Netflix',
        steps: [
            { device: 'projector', action: 'power_on', label: 'Allumage projecteur' },
            { device: 'receiver', action: 'power_on', label: 'Allumage ampli' },
            { device: 'receiver', action: 'set_input', value: 'HDMI1', label: 'Sélection entrée Shield' },
            { device: 'shield', action: 'wake', label: 'Réveil Shield TV' },
            { device: 'shield', action: 'launch_app', value: 'com.netflix.ninja', label: 'Lancement Netflix' },
            { device: 'receiver', action: 'set_volume', value: 45, label: 'Réglage volume' }
        ]
    },
    plex: {
        name: 'Plex',
        description: 'Lancement de Plex',
        steps: [
            { device: 'projector', action: 'power_on', label: 'Allumage projecteur' },
            { device: 'receiver', action: 'power_on', label: 'Allumage ampli' },
            { device: 'receiver', action: 'set_input', value: 'HDMI1', label: 'Sélection entrée Shield' },
            { device: 'shield', action: 'wake', label: 'Réveil Shield TV' },
            { device: 'shield', action: 'launch_app', value: 'com.plexapp.android', label: 'Lancement Plex' },
            { device: 'receiver', action: 'set_volume', value: 45, label: 'Réglage volume' }
        ]
    },
    freetv: {
        name: 'FreeTV',
        description: 'TV en direct via FreeTV',
        steps: [
            { device: 'projector', action: 'power_on', label: 'Allumage projecteur' },
            { device: 'receiver', action: 'power_on', label: 'Allumage ampli' },
            { device: 'receiver', action: 'set_input', value: 'HDMI1', label: 'Sélection entrée Shield' },
            { device: 'shield', action: 'wake', label: 'Réveil Shield TV' },
            { device: 'shield', action: 'launch_app', value: 'fr.freebox.catchup', label: 'Lancement FreeTV' },
            { device: 'receiver', action: 'set_volume', value: 50, label: 'Réglage volume' }
        ]
    },
    appletv: {
        name: 'Apple TV+',
        description: 'Streaming Apple',
        steps: [
            { device: 'projector', action: 'power_on', label: 'Allumage projecteur' },
            { device: 'receiver', action: 'power_on', label: 'Allumage ampli' },
            { device: 'receiver', action: 'set_input', value: 'HDMI2', label: 'Sélection entrée Apple TV' },
            { device: 'appletv', action: 'wake', label: 'Réveil Apple TV' },
            { device: 'appletv', action: 'launch_app', value: 'com.apple.TVShows', label: 'Lancement Apple TV+' },
            { device: 'receiver', action: 'set_volume', value: 45, label: 'Réglage volume' }
        ]
    },
    ps5: {
        name: 'PlayStation 5',
        description: 'Mode Gaming',
        steps: [
            { device: 'projector', action: 'power_on', label: 'Allumage projecteur' },
            { device: 'receiver', action: 'power_on', label: 'Allumage ampli' },
            { device: 'receiver', action: 'set_input', value: 'HDMI3', label: 'Sélection entrée PS5' },
            { device: 'ps5', action: 'wake', label: 'Réveil PlayStation 5' },
            { device: 'receiver', action: 'set_volume', value: 50, label: 'Réglage volume' }
        ]
    },
    shield: {
        name: 'Shield TV',
        description: 'Android TV',
        steps: [
            { device: 'projector', action: 'power_on', label: 'Allumage projecteur' },
            { device: 'receiver', action: 'power_on', label: 'Allumage ampli' },
            { device: 'receiver', action: 'set_input', value: 'HDMI1', label: 'Sélection entrée Shield' },
            { device: 'shield', action: 'wake', label: 'Réveil Shield TV' },
            { device: 'shield', action: 'home', label: 'Affichage écran d\'accueil' },
            { device: 'receiver', action: 'set_volume', value: 45, label: 'Réglage volume' }
        ]
    },
    poweroff: {
        name: 'Tout éteindre',
        description: 'Arrêt complet du système',
        steps: [
            { device: 'shield', action: 'sleep', label: 'Mise en veille Shield' },
            { device: 'appletv', action: 'sleep', label: 'Mise en veille Apple TV' },
            { device: 'ps5', action: 'standby', label: 'Mise en veille PS5' },
            { device: 'receiver', action: 'power_off', label: 'Extinction ampli' },
            { device: 'projector', action: 'power_off', label: 'Extinction projecteur' }
        ]
    }
};

// ============================================
// ÉTAT DE L'APPLICATION
// ============================================

let currentVolume = 45;
let isExecuting = false;

// ============================================
// ÉLÉMENTS DOM
// ============================================

const loadingOverlay = document.getElementById('loading-overlay');
const loadingText = document.getElementById('loading-text');
const loadingSteps = document.getElementById('loading-steps');
const successOverlay = document.getElementById('success-overlay');
const successText = document.getElementById('success-text');
const volumeLevel = document.getElementById('volume-level');
const volumeValue = document.getElementById('volume-value');

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function updateVolumeDisplay() {
    volumeLevel.style.width = `${currentVolume}%`;
    volumeValue.textContent = `${currentVolume}%`;
}

// ============================================
// ENVOI DES COMMANDES AU SERVEUR
// ============================================

const API_URL = window.location.origin;

async function executeCommand(device, action, value) {
    console.log(`[${DEVICES[device]?.name || device}] ${action}${value ? ': ' + value : ''}`);
    
    try {
        const response = await fetch(`${API_URL}/api/command`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ device, action, value })
        });
        
        const result = await response.json();
        
        if (!result.success) {
            console.warn(`[${device}] Commande échouée:`, result.error);
        }
        
        return result;
    } catch (error) {
        console.error(`[${device}] Erreur réseau:`, error);
        // On continue quand même pour ne pas bloquer le scénario
        return { success: false, error: error.message };
    }
}

// ============================================
// EXÉCUTION DES SCÉNARIOS
// ============================================

async function executeScenario(scenarioId) {
    if (isExecuting) return;
    
    const scenario = SCENARIOS[scenarioId];
    if (!scenario) {
        console.error('Scénario inconnu:', scenarioId);
        return;
    }
    
    isExecuting = true;
    
    // Afficher l'overlay de chargement
    loadingText.textContent = scenario.description;
    loadingSteps.innerHTML = '';
    loadingOverlay.classList.add('active');
    
    // Exécuter chaque étape
    for (let i = 0; i < scenario.steps.length; i++) {
        const step = scenario.steps[i];
        
        // Ajouter l'étape à l'affichage
        const stepElement = document.createElement('div');
        stepElement.className = 'loading-step';
        stepElement.style.animationDelay = `${i * 0.1}s`;
        stepElement.innerHTML = `
            <span class="step-icon pending"></span>
            <span class="step-text">${step.label}</span>
        `;
        loadingSteps.appendChild(stepElement);
        
        // Attendre un peu pour l'animation
        await sleep(100);
        
        try {
            // Exécuter la commande
            await executeCommand(step.device, step.action, step.value);
            
            // Marquer comme terminé
            stepElement.classList.add('done');
            stepElement.querySelector('.step-icon').classList.remove('pending');
            stepElement.querySelector('.step-icon').textContent = '✓';
        } catch (error) {
            console.error('Erreur lors de l\'exécution:', error);
            stepElement.style.color = 'var(--danger)';
            stepElement.querySelector('.step-icon').textContent = '✗';
        }
    }
    
    // Attendre un peu puis afficher le succès
    await sleep(500);
    loadingOverlay.classList.remove('active');
    
    // Afficher le message de succès
    successText.textContent = scenarioId === 'poweroff' 
        ? 'Système éteint !' 
        : `${scenario.name} est prêt !`;
    successOverlay.classList.add('active');
    
    // Masquer le succès après 1.5 secondes
    await sleep(1500);
    successOverlay.classList.remove('active');
    
    isExecuting = false;
}

// ============================================
// CONTRÔLE DU VOLUME
// ============================================

async function changeVolume(delta) {
    const newVolume = Math.max(0, Math.min(100, currentVolume + delta));
    if (newVolume !== currentVolume) {
        currentVolume = newVolume;
        updateVolumeDisplay();
        
        // Envoyer la commande à l'ampli
        await executeCommand('receiver', 'set_volume', currentVolume);
    }
}

// ============================================
// GESTIONNAIRES D'ÉVÉNEMENTS
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialiser l'affichage du volume
    updateVolumeDisplay();
    
    // Gestionnaires pour les cartes de scénario
    document.querySelectorAll('.scenario-card').forEach(card => {
        card.addEventListener('click', () => {
            const scenarioId = card.dataset.scenario;
            if (scenarioId) {
                executeScenario(scenarioId);
            }
        });
    });
    
    // Gestionnaires pour le volume
    document.getElementById('volume-down').addEventListener('click', () => {
        changeVolume(-5);
    });
    
    document.getElementById('volume-up').addEventListener('click', () => {
        changeVolume(5);
    });
    
    // Support du clavier pour le volume
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowUp') {
            changeVolume(5);
        } else if (e.key === 'ArrowDown') {
            changeVolume(-5);
        }
    });
});

// ============================================
// API POUR LE BACKEND (à implémenter)
// ============================================

/*
 * Pour connecter les vrais appareils, il faudra :
 * 
 * 1. PROJECTEUR EPSON (ESC/VP21 via TCP):
 *    - Connexion TCP sur le port 3629
 *    - Commandes: "PWR ON", "PWR OFF", etc.
 * 
 * 2. AMPLI PIONEER (ISCP via TCP):
 *    - Connexion TCP sur le port 8102  
 *    - Commandes ISCP pour power, volume, input
 * 
 * 3. NVIDIA SHIELD (ADB over network):
 *    - adb connect <ip>:5555
 *    - adb shell am start -n <package>/<activity>
 * 
 * 4. APPLE TV (pyatv):
 *    - Utiliser la librairie pyatv en Python
 *    - Ou node-appletv pour Node.js
 * 
 * 5. PS5 (playactor):
 *    - Utiliser playactor pour le wake/standby
 *    - npm install playactor
 */

console.log('🎬 CinéControl initialisé');
console.log('📡 Appareils configurés:', Object.keys(DEVICES).length);
console.log('🎯 Scénarios disponibles:', Object.keys(SCENARIOS).length);

