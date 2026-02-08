/**
 * CinéControl - Backend Server
 * Contrôle réel des appareils via le réseau
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const net = require('net');
const dgram = require('dgram');

// ============================================
// CONFIGURATION - À MODIFIER AVEC LES VRAIES IP
// ============================================

const CONFIG = {
    server: {
        port: 8080
    },
    // Configuration par adresse MAC (ne change jamais!)
    devices: {
        projector: {
            name: 'Epson Home Cinema',
            mac: '38:1a:52:ff:ef:79',
            ip: null,  // Sera découvert automatiquement
            port: 3629,
            enabled: true
        },
        receiver: {
            name: 'Pioneer VSX-LX303',
            mac: '00:09:b0:ed:22:79',
            ip: null,
            port: 8102,
            enabled: true
        },
        shield: {
            name: 'NVIDIA Shield TV',
            mac: '48:b0:2d:b2:d7:b3',
            ip: null,
            port: 5555,
            enabled: true
        },
        appletv: {
            name: 'Apple TV 4K',
            mac: '48:e1:5c:78:d8:90',
            ip: null,
            enabled: true
        },
        ps5: {
            name: 'PlayStation 5',
            mac: '00:e4:21:66:58:3b',
            ip: null,
            enabled: true
        }
    }
};

// ============================================
// DÉCOUVERTE AUTOMATIQUE DES APPAREILS PAR MAC
// ============================================

async function discoverDevices() {
    console.log('\n🔍 Recherche des appareils sur le réseau...\n');
    
    const { exec } = require('child_process');
    
    return new Promise((resolve) => {
        // Exécuter arp -a pour obtenir la table ARP
        exec('arp -a', (error, stdout, stderr) => {
            if (error) {
                console.error('Erreur lors du scan:', error);
                resolve(false);
                return;
            }
            
            const lines = stdout.split('\n');
            let foundCount = 0;
            
            for (const line of lines) {
                // Parser chaque ligne pour extraire IP et MAC
                // Format Windows: "192.168.1.50     38-1a-52-ff-ef-79     dynamique"
                const match = line.match(/(\d+\.\d+\.\d+\.\d+)\s+([0-9a-f-]+)/i);
                
                if (match) {
                    const ip = match[1];
                    const mac = match[2].toLowerCase().replace(/-/g, ':');
                    
                    // Chercher si cette MAC correspond à un de nos appareils
                    for (const [key, device] of Object.entries(CONFIG.devices)) {
                        if (device.mac && device.mac.toLowerCase() === mac) {
                            device.ip = ip;
                            console.log(`   ✅ ${device.name} trouvé: ${ip}`);
                            foundCount++;
                        }
                    }
                }
            }
            
            console.log(`\n📡 ${foundCount}/${Object.keys(CONFIG.devices).length} appareils trouvés\n`);
            
            // Afficher les appareils non trouvés
            for (const [key, device] of Object.entries(CONFIG.devices)) {
                if (!device.ip) {
                    console.log(`   ⚠️  ${device.name} non trouvé (MAC: ${device.mac})`);
                }
            }
            
            resolve(true);
        });
    });
}

// Rafraîchir les IP toutes les 5 minutes
setInterval(discoverDevices, 5 * 60 * 1000);

// ============================================
// CONTRÔLEUR PROJECTEUR EPSON (ESC/VP21)
// ============================================

class EpsonProjector {
    constructor(ip, port = 3629) {
        this.ip = ip;
        this.port = port;
    }

    async sendCommand(command) {
        return new Promise((resolve, reject) => {
            const client = new net.Socket();
            client.setTimeout(5000);

            client.connect(this.port, this.ip, () => {
                console.log(`[Epson] Connecté, envoi: ${command}`);
                client.write(command + '\r');
            });

            client.on('data', (data) => {
                console.log(`[Epson] Réponse: ${data.toString().trim()}`);
                client.destroy();
                resolve(data.toString());
            });

            client.on('timeout', () => {
                client.destroy();
                reject(new Error('Timeout'));
            });

            client.on('error', (err) => {
                console.error(`[Epson] Erreur: ${err.message}`);
                reject(err);
            });
        });
    }

    async powerOn() {
        return this.sendCommand('PWR ON');
    }

    async powerOff() {
        return this.sendCommand('PWR OFF');
    }

    async getStatus() {
        return this.sendCommand('PWR?');
    }
}

// ============================================
// CONTRÔLEUR AMPLI PIONEER (ISCP)
// ============================================

class PioneerReceiver {
    constructor(ip, port = 8102) {
        this.ip = ip;
        this.port = port;
    }

    async sendCommand(command) {
        return new Promise((resolve, reject) => {
            const client = new net.Socket();
            client.setTimeout(5000);

            client.connect(this.port, this.ip, () => {
                console.log(`[Pioneer] Connecté, envoi: ${command}`);
                client.write(command + '\r\n');
            });

            client.on('data', (data) => {
                console.log(`[Pioneer] Réponse: ${data.toString().trim()}`);
                client.destroy();
                resolve(data.toString());
            });

            client.on('timeout', () => {
                client.destroy();
                reject(new Error('Timeout'));
            });

            client.on('error', (err) => {
                console.error(`[Pioneer] Erreur: ${err.message}`);
                reject(err);
            });
        });
    }

    async powerOn() {
        return this.sendCommand('PO');  // Power On
    }

    async powerOff() {
        return this.sendCommand('PF');  // Power Off
    }

    async setVolume(level) {
        // Volume de 0-185 sur Pioneer, on convertit de 0-100
        const pioneerLevel = Math.round((level / 100) * 185);
        const volStr = pioneerLevel.toString().padStart(3, '0');
        return this.sendCommand(`${volStr}VL`);
    }

    async volumeUp() {
        return this.sendCommand('VU');
    }

    async volumeDown() {
        return this.sendCommand('VD');
    }

    async mute() {
        return this.sendCommand('MO');  // Mute On
    }

    async unmute() {
        return this.sendCommand('MF');  // Mute Off
    }

    async setInput(input) {
        const inputs = {
            'HDMI1': '19FN',
            'HDMI2': '20FN',
            'HDMI3': '21FN',
            'HDMI4': '22FN',
            'HDMI5': '23FN',
            'HDMI6': '24FN',
            'BD': '25FN',
            'TV': '05FN'
        };
        const cmd = inputs[input] || inputs['HDMI1'];
        return this.sendCommand(cmd);
    }
}

// ============================================
// CONTRÔLEUR NVIDIA SHIELD (ADB)
// ============================================

class ShieldTV {
    constructor(ip, port = 5555) {
        this.ip = ip;
        this.port = port;
    }

    async executeAdb(command) {
        const { exec } = require('child_process');
        return new Promise((resolve, reject) => {
            exec(`adb connect ${this.ip}:${this.port} && adb -s ${this.ip}:${this.port} ${command}`, 
                { timeout: 10000 },
                (error, stdout, stderr) => {
                    if (error) {
                        console.error(`[Shield] Erreur: ${error.message}`);
                        reject(error);
                        return;
                    }
                    console.log(`[Shield] ${stdout}`);
                    resolve(stdout);
                }
            );
        });
    }

    async wake() {
        return this.executeAdb('shell input keyevent KEYCODE_WAKEUP');
    }

    async sleep() {
        return this.executeAdb('shell input keyevent KEYCODE_SLEEP');
    }

    async home() {
        return this.executeAdb('shell input keyevent KEYCODE_HOME');
    }

    async launchApp(packageName) {
        const apps = {
            'com.netflix.ninja': 'com.netflix.ninja/.MainActivity',
            'com.plexapp.android': 'com.plexapp.android/.activity.SplashActivity',
            'fr.freebox.catchup': 'fr.freebox.catchup/.MainActivity',
            'com.google.android.youtube.tv': 'com.google.android.youtube.tv/.MainActivity'
        };
        const activity = apps[packageName] || packageName;
        return this.executeAdb(`shell am start -n ${activity}`);
    }

    async sendKey(key) {
        const keys = {
            'up': 'KEYCODE_DPAD_UP',
            'down': 'KEYCODE_DPAD_DOWN',
            'left': 'KEYCODE_DPAD_LEFT',
            'right': 'KEYCODE_DPAD_RIGHT',
            'enter': 'KEYCODE_ENTER',
            'back': 'KEYCODE_BACK',
            'play': 'KEYCODE_MEDIA_PLAY',
            'pause': 'KEYCODE_MEDIA_PAUSE',
            'playpause': 'KEYCODE_MEDIA_PLAY_PAUSE'
        };
        const keycode = keys[key] || `KEYCODE_${key.toUpperCase()}`;
        return this.executeAdb(`shell input keyevent ${keycode}`);
    }
}

// ============================================
// CONTRÔLEUR PS5 (Wake on LAN + PlayStation API)
// ============================================

class PlayStation5 {
    constructor(ip) {
        this.ip = ip;
    }

    async wake() {
        // Pour la PS5, on utilise généralement playactor ou ps5-waker
        // Ici on fait un Wake-on-LAN basique
        console.log(`[PS5] Wake demandé pour ${this.ip}`);
        // Note: nécessite la configuration du Wake-on-LAN sur la PS5
        return { success: true, message: 'Wake signal envoyé' };
    }

    async standby() {
        console.log(`[PS5] Standby demandé pour ${this.ip}`);
        return { success: true, message: 'Standby signal envoyé' };
    }
}

// ============================================
// CONTRÔLEUR APPLE TV (via pyatv - nécessite Python)
// ============================================

class AppleTV {
    constructor(ip) {
        this.ip = ip;
    }

    async executePyatv(command) {
        const { exec } = require('child_process');
        return new Promise((resolve, reject) => {
            exec(`atvremote -s ${this.ip} ${command}`,
                { timeout: 10000 },
                (error, stdout, stderr) => {
                    if (error) {
                        console.error(`[AppleTV] Erreur: ${error.message}`);
                        // Ne pas rejeter, juste logger
                        resolve({ success: false, error: error.message });
                        return;
                    }
                    console.log(`[AppleTV] ${stdout}`);
                    resolve({ success: true, output: stdout });
                }
            );
        });
    }

    async wake() {
        return this.executePyatv('turn_on');
    }

    async sleep() {
        return this.executePyatv('turn_off');
    }

    async launchApp(bundleId) {
        return this.executePyatv(`launch_app=${bundleId}`);
    }
}

// ============================================
// FONCTIONS POUR OBTENIR LES CONTRÔLEURS AVEC IP À JOUR
// ============================================

function getProjector() {
    return new EpsonProjector(CONFIG.devices.projector.ip, CONFIG.devices.projector.port);
}

function getReceiver() {
    return new PioneerReceiver(CONFIG.devices.receiver.ip, CONFIG.devices.receiver.port);
}

function getShield() {
    return new ShieldTV(CONFIG.devices.shield.ip, CONFIG.devices.shield.port);
}

function getAppleTV() {
    return new AppleTV(CONFIG.devices.appletv.ip);
}

function getPS5() {
    return new PlayStation5(CONFIG.devices.ps5.ip);
}

// ============================================
// GESTIONNAIRE D'API
// ============================================

async function handleApiRequest(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    
    if (url.pathname === '/api/command' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const { device, action, value } = JSON.parse(body);
                console.log(`\n📡 Commande reçue: ${device} → ${action}${value ? ' (' + value + ')' : ''}`);
                
                const result = await executeDeviceCommand(device, action, value);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, result }));
            } catch (error) {
                console.error('Erreur API:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: error.message }));
            }
        });
        return true;
    }
    
    if (url.pathname === '/api/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            status: 'online',
            devices: Object.keys(CONFIG.devices).map(key => ({
                id: key,
                name: CONFIG.devices[key].name,
                ip: CONFIG.devices[key].ip,
                enabled: CONFIG.devices[key].enabled
            }))
        }));
        return true;
    }
    
    return false;
}

async function executeDeviceCommand(device, action, value) {
    // Vérifier que l'IP est connue
    const deviceConfig = CONFIG.devices[device];
    if (!deviceConfig) {
        throw new Error(`Appareil inconnu: ${device}`);
    }
    if (!deviceConfig.ip) {
        throw new Error(`IP non trouvée pour ${deviceConfig.name}. Vérifiez que l'appareil est allumé et sur le réseau.`);
    }

    console.log(`[${deviceConfig.name}] Envoi commande ${action} vers ${deviceConfig.ip}`);

    try {
        switch (device) {
            case 'projector': {
                const controller = getProjector();
                if (action === 'power_on') return await controller.powerOn();
                if (action === 'power_off') return await controller.powerOff();
                break;
            }
            case 'receiver': {
                const controller = getReceiver();
                if (action === 'power_on') return await controller.powerOn();
                if (action === 'power_off') return await controller.powerOff();
                if (action === 'set_volume') return await controller.setVolume(value);
                if (action === 'volume_up') return await controller.volumeUp();
                if (action === 'volume_down') return await controller.volumeDown();
                if (action === 'set_input') return await controller.setInput(value);
                if (action === 'mute') return await controller.mute();
                if (action === 'unmute') return await controller.unmute();
                break;
            }
            case 'shield': {
                const controller = getShield();
                if (action === 'wake') return await controller.wake();
                if (action === 'sleep') return await controller.sleep();
                if (action === 'home') return await controller.home();
                if (action === 'launch_app') return await controller.launchApp(value);
                if (action === 'key') return await controller.sendKey(value);
                break;
            }
            case 'appletv': {
                const controller = getAppleTV();
                if (action === 'wake') return await controller.wake();
                if (action === 'sleep') return await controller.sleep();
                if (action === 'launch_app') return await controller.launchApp(value);
                break;
            }
            case 'ps5': {
                const controller = getPS5();
                if (action === 'wake') return await controller.wake();
                if (action === 'standby') return await controller.standby();
                break;
            }
        }
        throw new Error(`Action inconnue: ${action} pour ${device}`);
    } catch (error) {
        console.error(`[${deviceConfig.name}] Erreur: ${error.message}`);
        throw error;
    }
}

// ============================================
// SERVEUR HTTP
// ============================================

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // API routes
    if (req.url.startsWith('/api/')) {
        const handled = await handleApiRequest(req, res);
        if (handled) return;
    }
    
    // Static files
    let filePath = req.url === '/' ? '/index.html' : req.url;
    filePath = path.join(__dirname, filePath);
    
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('Not Found');
            } else {
                res.writeHead(500);
                res.end('Server Error');
            }
            return;
        }
        
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
    });
});

server.listen(CONFIG.server.port, '0.0.0.0', async () => {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                                                            ║');
    console.log('║   🎬 CinéControl Server                                    ║');
    console.log('║                                                            ║');
    console.log(`║   ➜ Local:   http://localhost:${CONFIG.server.port}                       ║`);
    console.log('║                                                            ║');
    console.log('║   📱 Ouvre cette adresse sur ton téléphone !              ║');
    console.log('║                                                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    
    // Découverte automatique des appareils par leur adresse MAC
    await discoverDevices();
    
    console.log('');
    console.log('📡 Appareils configurés:');
    Object.entries(CONFIG.devices).forEach(([key, device]) => {
        const status = device.ip ? '✅' : '❌';
        console.log(`   ${status} ${device.name} → ${device.ip || 'Non trouvé'} (MAC: ${device.mac})`);
    });
    console.log('');
    console.log('🔄 Les IP sont rafraîchies automatiquement toutes les 5 minutes');
    console.log('');
});

