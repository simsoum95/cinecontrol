# 🎬 CinéControl

> Alternative open-source à Control4 - Contrôlez votre home cinéma en un clic !

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Fonctionnalités

- **Un clic = Tout s'allume** - Netflix, Plex, FreeTV, PS5...
- **Interface tactile** optimisée pour téléphone/tablette
- **Contrôle total** - Projecteur, Ampli, Streamer, Console
- **100% local** - Pas de cloud, pas d'abonnement

## 📱 Aperçu

L'interface permet de lancer des scénarios complets en un seul clic :
- 📺 **Netflix** - Allume projecteur + ampli + Shield + lance Netflix
- 🎬 **Plex** - Votre médiathèque personnelle
- 📡 **FreeTV** - TV en direct
- 🍎 **Apple TV+** - Streaming Apple
- 🎮 **PlayStation 5** - Mode gaming
- ⏹️ **Tout éteindre** - Extinction complète

## 🔧 Appareils supportés

| Type | Modèles testés | Protocole |
|------|----------------|-----------|
| Projecteur | Epson EH-TW9400 | ESC/VP21 (TCP) |
| Ampli | Pioneer VSX-LX303 | Pioneer (TCP) |
| Streamer | NVIDIA Shield TV | ADB over WiFi |
| Streamer | Apple TV 4K | pyATV |
| Console | PlayStation 5 | PS5 Wake |

## 🚀 Installation

### Prérequis

- Un PC ou Raspberry Pi sur le réseau local
- Node.js installé
- Les appareils connectés au même réseau WiFi

### Étapes

1. **Cloner le repo**
```bash
git clone https://github.com/VOTRE-USERNAME/cinecontrol.git
cd cinecontrol
```

2. **Configurer les adresses IP**

Ouvrez `server.js` et modifiez les IP des appareils :
```javascript
devices: {
    projector: {
        ip: '192.168.1.100',  // IP de votre projecteur
        // ...
    },
    // ...
}
```

3. **Lancer le serveur**
```bash
npm start
```

4. **Ouvrir l'interface**

Sur votre téléphone, ouvrez : `http://[IP-DU-SERVEUR]:8080`

## 📍 Trouver les adresses IP

| Appareil | Où trouver |
|----------|------------|
| Projecteur Epson | Menu → Réseau → Config réseau |
| Ampli Pioneer | Menu → Network → Information |
| Shield TV | Paramètres → Réseau → (nom WiFi) |
| Apple TV | Réglages → Réseau |
| PS5 | Paramètres → Réseau → État connexion |

## 🔌 Configuration de la Shield TV (ADB)

Pour contrôler la Shield TV, activez le débogage réseau :

1. Paramètres → Préférences de l'appareil → À propos
2. Cliquez 7 fois sur "Numéro de build" (active le mode développeur)
3. Retour → Préférences de l'appareil → Options pour les développeurs
4. Activez "Débogage réseau"

## 🌐 Accès depuis l'extérieur (optionnel)

Pour contrôler depuis l'extérieur de la maison :

### Option 1 : Tailscale (recommandé)
- Installez Tailscale sur le serveur et votre téléphone
- Accédez via l'IP Tailscale

### Option 2 : Cloudflare Tunnel
- Créez un tunnel gratuit vers votre serveur
- Accédez via un sous-domaine personnalisé

## 📁 Structure du projet

```
cinecontrol/
├── index.html          # Interface utilisateur
├── styles.css          # Design de l'interface
├── app.js              # Logique frontend
├── server.js           # Serveur backend (contrôle des appareils)
├── package.json        # Configuration npm
├── config.example.js   # Exemple de configuration
└── README.md           # Ce fichier
```

## 🛠️ Personnalisation

### Ajouter un scénario

Dans `app.js`, ajoutez un nouveau scénario :

```javascript
const SCENARIOS = {
    monScenario: {
        name: 'Mon Scénario',
        description: 'Description',
        steps: [
            { device: 'projector', action: 'power_on', label: 'Allumage projecteur' },
            // ... autres étapes
        ]
    }
};
```

### Ajouter un appareil

1. Créez une classe contrôleur dans `server.js`
2. Ajoutez l'appareil dans la configuration
3. Implémentez les actions nécessaires

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- 🐛 Signaler des bugs
- 💡 Proposer des améliorations
- 🔧 Soumettre des pull requests

## 📄 Licence

MIT License - Utilisez librement !

## 🙏 Remerciements

Inspiré par Control4, Logitech Harmony, et Home Assistant.

---

**Fait avec ❤️ pour simplifier la vie des utilisateurs de home cinéma**

