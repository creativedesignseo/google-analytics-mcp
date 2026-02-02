const { OAuth2Client } = require('google-auth-library');
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { exec } = require('child_process');

// Configuración base
const configPath = path.join(__dirname, 'google-analytics.yaml');
const CLIENT_ID = 'TU_CLIENT_ID';
const CLIENT_SECRET = 'TU_CLIENT_SECRET';
const REDIRECT_URI = 'http://localhost:3001/oauth2callback';

// Scopes para Analytics
const SCOPES = [
    'https://www.googleapis.com/auth/analytics.readonly',
    'https://www.googleapis.com/auth/analytics.manage.users.readonly'
];

const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

function openBrowser(url) {
    exec(`start "" "${url}"`);
}

async function getRefreshToken() {
    return new Promise((resolve, reject) => {
        const server = http.createServer(async (req, res) => {
            if (req.url.startsWith('/oauth2callback')) {
                const q = url.parse(req.url, true).query;
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('<h1>✅ Autenticación de Analytics Exitosa!</h1><p>Vuelve a la terminal.</p>');
                
                const { tokens } = await oauth2Client.getToken(q.code);
                server.close();
                resolve(tokens.refresh_token);
            }
        });

        server.listen(3001, () => {
            const authUrl = oauth2Client.generateAuthUrl({
                access_type: 'offline',
                scope: SCOPES,
                prompt: 'consent'
            });
            console.log('🚀 Abriendo navegador para Google Analytics...\n');
            openBrowser(authUrl);
        });
    });
}

(async () => {
    try {
        console.log("=".repeat(50));
        console.log("  GOOGLE ANALYTICS - AUTH SETUP");
        console.log("=".repeat(50));
        
        const refreshToken = await getRefreshToken();
        
        const config = {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            refresh_token: refreshToken,
            property_id: 'TU_PROPERTY_ID_AQUI'
        };
        
        fs.writeFileSync(configPath, yaml.dump(config));
        console.log("\n✅ Refresh Token obtenido y guardado en google-analytics.yaml");
        process.exit(0);
    } catch (e) {
        console.error("❌ Error:", e.message);
        process.exit(1);
    }
})();
