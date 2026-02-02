# Google Analytics MCP Server

🚀 **MCP Server para Google Analytics 4 (GA4)** - Permite a agentes de IA consultar datos de Analytics en tiempo real.

## ✨ Características

- 📊 **Listar cuentas** de Google Analytics
- 🌐 **Listar propiedades** (sitios web) por cuenta
- 📈 **Reportes históricos** con métricas y dimensiones personalizables
- ⚡ **Reportes en tiempo real** - usuarios activos ahora mismo

## 📋 Requisitos Previos

1. **Node.js** v18 o superior
2. **Proyecto en Google Cloud** con las siguientes APIs habilitadas:
   - Google Analytics Admin API
   - Google Analytics Data API
3. **Credenciales OAuth 2.0** (Client ID y Client Secret)

## 🔧 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/google-analytics-mcp.git
cd google-analytics-mcp
npm install
```

### 2. Configurar Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un proyecto o selecciona uno existente
3. Habilita las APIs:
   - [Google Analytics Admin API](https://console.cloud.google.com/apis/library/analyticsadmin.googleapis.com)
   - [Google Analytics Data API](https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com)
4. Ve a **APIs & Services > Credentials**
5. Crea credenciales **OAuth 2.0 Client ID** (tipo: Desktop App)
6. Descarga el archivo JSON

### 3. Obtener Refresh Token

Edita `get-refresh-token.js` con tu Client ID y Client Secret, luego:

```bash
node get-refresh-token.js
```

Esto abrirá el navegador para autenticarte y generará `google-analytics.yaml`.

### 4. Crear credentials.json

Crea un archivo `credentials.json` con este formato:

```json
{
  "type": "authorized_user",
  "client_id": "TU_CLIENT_ID",
  "client_secret": "TU_CLIENT_SECRET",
  "refresh_token": "TU_REFRESH_TOKEN",
  "quota_project_id": "TU_PROJECT_ID"
}
```

### 5. Verificar conexión

```bash
node test-connection.js
```

## 🔌 Integración con Antigravity/Claude

Añade a tu `mcp_config.json`:

```json
{
  "mcpServers": {
    "google-analytics": {
      "command": "node",
      "args": ["C:/ruta/a/google-analytics-mcp/mcp-server.js"]
    }
  }
}
```

## 🛠️ Herramientas Disponibles

| Herramienta | Descripción |
|-------------|-------------|
| `list_accounts` | Lista todas las cuentas de Analytics |
| `list_properties` | Lista propiedades de una cuenta |
| `run_report` | Ejecuta un reporte con métricas/dimensiones |
| `run_realtime_report` | Usuarios activos en tiempo real |

### Ejemplos de uso

```
"¿Cuántos usuarios tuvo mi sitio ayer?"
"Dame un reporte de países de los últimos 7 días"
"¿Cuánta gente hay navegando ahora?"
```

## 📁 Estructura del Proyecto

```
google-analytics-mcp/
├── mcp-server.js          # Servidor MCP principal
├── get-refresh-token.js   # Script para obtener credenciales
├── test-connection.js     # Test de conexión
├── credentials.json       # (No subir) Credenciales OAuth
├── google-analytics.yaml  # (No subir) Configuración
└── package.json
```

## 🔒 Seguridad

> ⚠️ **IMPORTANTE**: Nunca subas `credentials.json` o `google-analytics.yaml` a Git.

Estos archivos contienen tokens de acceso a tus cuentas de Analytics.

## 📄 Licencia

MIT
