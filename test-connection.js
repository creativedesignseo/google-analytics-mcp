const { AnalyticsAdminServiceClient } = require('@google-analytics/admin');
const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const path = require('path');

// Configurar credenciales usando variable de entorno
process.env.GOOGLE_APPLICATION_CREDENTIALS = path.join(__dirname, 'credentials.json');
process.env.GOOGLE_CLOUD_PROJECT = 'amsip-com-152005';

async function test() {
    try {
        console.log('📊 Verificando conexión GA4...');
        console.log('🔑 Usando credenciales de:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
        console.log('🔍 Probando Admin API...');
        
        const adminClient = new AnalyticsAdminServiceClient();
        
        const [accounts] = await adminClient.listAccounts();
        console.log('✅ Éxito! Cuentas:', accounts.length);
        accounts.forEach(a => console.log(`   - ${a.displayName} (${a.name})`));
    } catch (e) {
        console.error('❌ Error en test:', e.message);
        if (e.code === 7) {
            console.log('\n⚠️ Posible causa: Las APIs de Analytics no están activadas en tu proyecto de Google Cloud.');
            console.log('   Ve a: https://console.cloud.google.com/apis/library/analyticsadmin.googleapis.com');
        }
    }
}

test();
