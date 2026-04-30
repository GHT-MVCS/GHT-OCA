# 🗺️ Solución: Error al Obtener Posiciones del Mapa

## Problema
Cuando haces clic en "🗺️ Cargar Mapa", ves un error: **"Error al obtener posiciones"**

## Causas Comunes y Soluciones

### 1️⃣ **API Keys No Configuradas** (MÁS COMÚN)

**Síntomas:**
- Consola del navegador: `❌ Error al obtener posiciones`
- Terminal del servidor: `⚠️ No se encontraron API keys de FlightAware`

**Solución:**

```bash
# Ve a flight-proxy y configura .env
cd flight-proxy

# Abre el archivo .env
nano .env
# O usa tu editor favorito
```

**Contenido de `/workspaces/GHT-OCA/flight-proxy/.env`:**
```env
# REEMPLAZA ESTAS CLAVES CON LAS TUYAS DE FlightAware
FLIGHT_AWARE_KEY_1=tu_primera_clave_aqui
FLIGHT_AWARE_KEY_2=tu_segunda_clave_aqui
PORT=3000
```

**¿Cómo obtener las API keys?**
1. Visita: https://www.flightaware.com/commercial/aeroapi/
2. Crea una cuenta o inicia sesión
3. Usa el dashboard para generar dos API keys
4. Copia y pega en el archivo `.env`

---

### 2️⃣ **Servidor No Está Corriendo**

**Síntomas:**
- Error de conexión en el navegador
- `net::ERR_CONNECTION_REFUSED`

**Solución:**

```bash
# En una terminal nueva, desde /workspaces/GHT-OCA/flight-proxy

# Instala dependencias (solo la primera vez)
npm install

# Iniciar el servidor en modo desarrollo
npm run start:dev

# Deberías ver:
# ✅ Cargadas 2 API keys de FlightAware
# [Nest] 12345  - 04/30/2026, 10:30:00 AM ... Nest application successfully started +456ms
```

---

### 3️⃣ **PROXY_BASE Incorrecto**

**Síntomas:**
- Error `net::ERR_INVALID_URL` en consola
- El botón "Cargar Mapa" intenta conectarse a una URL incorrecta

**Solución:**

Verifica en `index.html` (línea ~600) que `PROXY_BASE` coincida con tu servidor:

```javascript
// ❌ Esto puede estar expirado si usas GitHub Codespaces
const PROXY_BASE = 'https://opulent-doodle-g4g5577g7rvpf9q59-3000.app.github.dev';

// ✅ Si estás en local, cambia a:
const PROXY_BASE = 'http://localhost:3000';

// ✅ Si estás en Codespaces y la URL cambió, actualiza con la actual
```

Para obtener la URL correcta de Codespaces:
- Abre la terminal del servidor (flight-proxy)
- Presiona `Ctrl+Shift+P` en VS Code
- Busca: "Codespaces: Open in Browser"
- Copia la URL y reemplaza en `index.html`

---

### 4️⃣ **Verificar Salud del Servidor**

Para diagnosticar rápidamente, abre en el navegador:

```
http://localhost:3000/api/flights/ping
```

Deberías ver algo como:
```json
{
  "ok": true,
  "ts": "2026-04-30T10:30:00.000Z",
  "apiKeysLoaded": 2,
  "apiKeysStatus": [
    {"index": 1, "loaded": true, "status": "✅ válida"},
    {"index": 2, "loaded": true, "status": "✅ válida"}
  ],
  "mensaje": "✅ Dos API keys disponibles"
}
```

Si ves:
```json
{"mensaje": "🔴 CRÍTICO: No hay API keys..."}
```

→ **Ve al paso 1️⃣**

---

## 🚀 Flujo Completo (Desde Cero)

```bash
# 1. Abre terminal en flight-proxy
cd /workspaces/GHT-OCA/flight-proxy

# 2. Configura .env con tus API keys
nano .env
# (Edita y guarda)

# 3. Instala dependencias
npm install

# 4. Inicia el servidor
npm run start:dev

# 5. En otra terminal, verifica que está corriendo
curl http://localhost:3000/api/flights/ping

# 6. Abre index.html en el navegador
# 7. Haz clic en "🗺️ Cargar Mapa"
# 8. ¡Deberías ver vuelos en el mapa! ✈️
```

---

## 📋 Checklist de Diagnóstico

- [ ] `.env` existe en `/workspaces/GHT-OCA/flight-proxy/`
- [ ] `FLIGHT_AWARE_KEY_1` y `FLIGHT_AWARE_KEY_2` están bien configurados
- [ ] `npm run start:dev` está ejecutándose sin errores
- [ ] `/api/flights/ping` retorna `apiKeysLoaded: 2`
- [ ] `PROXY_BASE` en `index.html` coincide con la URL del servidor
- [ ] El navegador muestra consola sin errores de red (F12)

---

## 🔧 Desarrollo y Debugging

**Ver logs en tiempo real:**
```bash
cd flight-proxy
npm run start:dev
# Los logs aparecen con ✅, ⚠️, ❌ indicando estado
```

**Probar API directamente:**
```bash
# Probar con una matrícula conocida (ejemplo: N319CM)
curl "http://localhost:3000/api/flights/live?ids=N319CM"
```

---

## ❓ Preguntas Frecuentes

**P: ¿Qué pasa si solo tengo 1 API key?**
A: El sistema funciona pero con menos resiliencia. Lo ideal es tener 2 para alternancia automática.

**P: ¿Cómo sé si estoy en Codespaces o local?**
A: Abre la terminal y ejecuta `echo $GITHUB_CODESPACES` (si dice "true", estás en Codespaces)

**P: ¿Por qué dice "Mostrando datos anteriores"?**
A: El servidor tuvo un error pero tienes vuelos en caché. Intenta nuevamente o verifica los logs del servidor.

---

## 📞 Contacto de Soporte

Si aún tienes problemas:
1. Copia la salida completa de `npm run start:dev`
2. Va a la consola del navegador (F12) y copia los errores
3. Proporciona ambos para debugging
