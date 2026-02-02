const { OAuth2Client } = require('google-auth-library');
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { exec } = require('child_process');

// Configuración base
const configPath = path.join(__dirname, 'google-analytics.yaml');
// RESTAURANDO CREDENCIALES REALES
const CLIENT_ID = 'TU_CLIENT_ID';
const CLIENT_SECRET = 'TU_CLIENT_SECRET';
const REDIRECT_URI = 'http://localhost:3001/oauth2callback';

// Scopes para Analytics - AÑADIDO 'analytics.edit'
const SCOPES = [
    'https://www.googleapis.com/auth/analytics.readonly',
    'https://www.googleapis.com/auth/analytics.manage.users.readonly',
    'https://www.googleapis.com/auth/analytics.edit' 
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
            console.log('🚀 Abriendo navegador para actualizar permisos (Edit Access)...\n');
            openBrowser(authUrl);
        });
    });
}

(async () => {
    try {
        console.log("=".repeat(50));
        console.log("  GOOGLE ANALYTICS - UPDATE PERMISSIONS");
        console.log("=".repeat(50));
        
        const refreshToken = await getRefreshToken();
        
        // Actualizar credentials.json
        const credentialsPath = path.join(__dirname, 'credentials.json');
        let credentials = {};
        try {
            credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
        } catch (e) {}
        
        credentials.refresh_token = refreshToken;
        fs.writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2));

        console.log("\n✅ Nuevo Refresh Token con permisos de EDICIÓN guardado.");
        process.exit(0);
    } catch (e) {
        console.error("❌ Error:", e.message);
        process.exit(1);
    }
})();
