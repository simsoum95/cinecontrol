/**
 * EXEMPLE DE CONFIGURATION
 * 
 * 1. Copie ce fichier en "config.js"
 * 2. Remplace les adresses IP par celles de tes appareils
 * 3. Pour trouver les IP :
 *    - Va dans les paramètres réseau de chaque appareil
 *    - Ou regarde sur l'interface de ta box internet (rubrique "Appareils connectés")
 */

module.exports = {
    // Port du serveur web
    serverPort: 8080,

    // Configuration des appareils
    devices: {
        // PROJECTEUR EPSON EH-TW9400
        // L'IP se trouve dans : Menu > Réseau > Config réseau
        projector: {
            ip: '192.168.1.XXX',
            port: 3629,
            enabled: true
        },

        // AMPLI PIONEER VSX-LX303
        // L'IP se trouve dans : Menu > Réseau > Information
        receiver: {
            ip: '192.168.1.XXX',
            port: 8102,
            enabled: true
        },

        // NVIDIA SHIELD TV
        // L'IP se trouve dans : Paramètres > Réseau et Internet > (nom du WiFi)
        shield: {
            ip: '192.168.1.XXX',
            port: 5555,
            enabled: true
        },

        // APPLE TV 4K
        // L'IP se trouve dans : Réglages > Réseau > WiFi
        appletv: {
            ip: '192.168.1.XXX',
            enabled: true
        },

        // PLAYSTATION 5
        // L'IP se trouve dans : Paramètres > Réseau > Afficher l'état de la connexion
        ps5: {
            ip: '192.168.1.XXX',
            enabled: true
        }
    },

    // Configuration des entrées HDMI sur l'ampli Pioneer
    // Modifie selon comment c'est branché chez toi
    hdmiInputs: {
        shield: 'HDMI1',    // Sur quelle entrée est branchée la Shield ?
        appletv: 'HDMI2',   // Sur quelle entrée est branchée l'Apple TV ?
        ps5: 'HDMI3'        // Sur quelle entrée est branchée la PS5 ?
    }
};

