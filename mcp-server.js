const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const { AnalyticsAdminServiceClient } = require('@google-analytics/admin');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const readline = require('readline');

// Configurar credenciales
process.env.GOOGLE_APPLICATION_CREDENTIALS = path.join(__dirname, 'credentials.json');
process.env.GOOGLE_CLOUD_PROJECT = 'amsip-com-152005';

// Cargar configuración adicional (property_id por defecto)
const configPath = path.join(__dirname, 'google-analytics.yaml');
let config = {};
try {
    config = yaml.load(fs.readFileSync(configPath, 'utf8'));
} catch (e) {}

const dataClient = new BetaAnalyticsDataClient();
const adminClient = new AnalyticsAdminServiceClient();

const tools = {
    // Listar Cuentas
    async listAccounts() {
        try {
            const [accounts] = await adminClient.listAccounts();
            return accounts.map(a => ({ name: a.name, displayName: a.displayName }));
        } catch (e) { return { error: e.message }; }
    },

    // Listar Propiedades de una cuenta
    async listProperties(accountName) {
        try {
            const [properties] = await adminClient.listProperties({ filter: `parent:${accountName}` });
            return properties.map(p => ({ name: p.name, displayName: p.displayName, propertyId: p.name.split('/')[1] }));
        } catch (e) { return { error: e.message }; }
    },

    // Reporte Core (histórico)
    async runReport(propertyId, startDate = '30daysAgo', endDate = 'today', metrics = ['activeUsers'], dimensions = ['country']) {
        try {
            const [response] = await dataClient.runReport({
                property: `properties/${propertyId}`,
                dateRanges: [{ startDate, endDate }],
                dimensions: dimensions.map(d => ({ name: d })),
                metrics: metrics.map(m => ({ name: m })),
            });
            
            // Formatear respuesta
            const headers = [...dimensions, ...metrics];
            const rows = response.rows?.map(row => {
                const obj = {};
                row.dimensionValues?.forEach((v, i) => obj[dimensions[i]] = v.value);
                row.metricValues?.forEach((v, i) => obj[metrics[i]] = v.value);
                return obj;
            }) || [];
            
            return { headers, rows, rowCount: response.rowCount };
        } catch (e) { return { error: e.message }; }
    },

    // Reporte en Tiempo Real
    async runRealtimeReport(propertyId, metrics = ['activeUsers'], dimensions = ['city']) {
        try {
            const [response] = await dataClient.runRealtimeReport({
                property: `properties/${propertyId}`,
                dimensions: dimensions.map(d => ({ name: d })),
                metrics: metrics.map(m => ({ name: m })),
            });
            
            const rows = response.rows?.map(row => {
                const obj = {};
                row.dimensionValues?.forEach((v, i) => obj[dimensions[i]] = v.value);
                row.metricValues?.forEach((v, i) => obj[metrics[i]] = v.value);
                return obj;
            }) || [];
            
            return { rows, totalUsers: rows.reduce((sum, r) => sum + parseInt(r.activeUsers || 0), 0) };
        } catch (e) { return { error: e.message }; }
    }
};

// Interface STDIO for MCP
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });

function sendResponse(id, result) {
    const response = { jsonrpc: '2.0', id, result };
    console.log(JSON.stringify(response));
}

function sendError(id, code, message) {
    const response = { jsonrpc: '2.0', id, error: { code, message } };
    console.log(JSON.stringify(response));
}

rl.on('line', async (line) => {
    try {
        const req = JSON.parse(line);
        
        // Handle notifications (no id = notification, no response needed)
        if (!req.id && req.method) {
            // notifications/initialized, etc. - just acknowledge silently
            return;
        }

        let res;

        switch (req.method) {
            case 'initialize':
                res = { 
                    protocolVersion: '2024-11-05', 
                    capabilities: { tools: {} }, 
                    serverInfo: { name: 'google-analytics-mcp', version: '1.0.0' } 
                };
                break;
                
            case 'tools/list':
                res = {
                    tools: [
                        { name: 'list_accounts', description: 'Lista todas las cuentas de Google Analytics a las que tienes acceso', inputSchema: { type: 'object', properties: {} } },
                        { name: 'list_properties', description: 'Lista las propiedades (sitios web) de una cuenta', inputSchema: { type: 'object', properties: { account_name: { type: 'string', description: 'Nombre de la cuenta (ej: accounts/123456)' } }, required: ['account_name'] } },
                        { name: 'run_report', description: 'Ejecuta un reporte de Analytics con métricas y dimensiones', inputSchema: { type: 'object', properties: { property_id: { type: 'string', description: 'ID de la propiedad (ej: 123456789)' }, start_date: { type: 'string' }, end_date: { type: 'string' }, metrics: { type: 'array', items: { type: 'string' } }, dimensions: { type: 'array', items: { type: 'string' } } }, required: ['property_id'] } },
                        { name: 'run_realtime_report', description: 'Muestra usuarios activos AHORA MISMO en tu sitio', inputSchema: { type: 'object', properties: { property_id: { type: 'string', description: 'ID de la propiedad' } }, required: ['property_id'] } }
                    ]
                };
                break;
                
            case 'tools/call':
                const args = req.params?.arguments || {};
                const toolName = req.params?.name;
                
                try {
                    let result;
                    switch (toolName) {
                        case 'list_accounts': 
                            result = await tools.listAccounts();
                            break;
                        case 'list_properties': 
                            result = await tools.listProperties(args.account_name);
                            break;
                        case 'run_report': 
                            result = await tools.runReport(
                                args.property_id, 
                                args.start_date || '30daysAgo', 
                                args.end_date || 'today',
                                args.metrics || ['activeUsers'],
                                args.dimensions || ['country']
                            );
                            break;
                        case 'run_realtime_report': 
                            result = await tools.runRealtimeReport(
                                args.property_id,
                                args.metrics || ['activeUsers'],
                                args.dimensions || ['city']
                            );
                            break;
                        default:
                            result = { error: 'Herramienta no encontrada: ' + toolName };
                    }
                    res = { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
                } catch (toolError) {
                    res = { content: [{ type: 'text', text: 'Error: ' + toolError.message }], isError: true };
                }
                break;
                
            default:
                sendError(req.id, -32601, 'Method not found: ' + req.method);
                return;
        }
        
        sendResponse(req.id, res);
    } catch (e) {
        // Parse error - ignore malformed JSON
    }
});
