# 🚀 Guía de Despliegue de GHT-OCA para Producción

## Opción A: Despliegue en Render (Recomendado - Gratis integrado con GitHub)

### Pasos
1. **Conecta tu repositorio a Render:**
   - Ve a https://render.com/
   - Crea una cuenta o inicia sesión
   - Autoriza el acceso a GitHub

2. **Configura el despliegue:**
   - En Render Dashboard: **New** → **Blueprint**
   - Selecciona tu repositorio (GHT-OCA)
   - Render detectará automáticamente `render.yaml`
   - Haz clic en **Deploy**

3. **Configura las variables de entorno:**
   - Espera a que aparezca el formulario durante el deploy
   - Configura `FLIGHT_AWARE_KEY_1` y `FLIGHT_AWARE_KEY_2` (obtenlas de https://www.flightaware.com/commercial/aeroapi/)
   - Guarda y confirma
   - **Importante:** Si Render te pide un nombre para el servicio, cámbialo a `ght-oca-backend`

4. **¡Listo!**
   - Frontend en GitHub Pages: `https://ght-mvcs.github.io/GHT-OCA/`
   - Backend en Render: `https://ght-oca-backend.onrender.com/api/flights/ping`
   - Ambos se comunicarán automáticamente (el frontend detectará la URL de Render)

**Nota:** Si nombraste el servicio diferente en Render (ej: `ght-oca-api`), actualiza la variable `PROXY_BASE` en `index.html` y `docs/index.html` reemplazando `ght-oca-backend` por tu nombre. Alternativamente, pasa `?proxy=https://TU-SERVICIO.onrender.com` en la URL.

### Actualizaciones automáticas
- Cada `git push` a `main` redeploya automáticamente
- Los archivos en `docs/` se publican en GitHub Pages
- El backend en Render se redeploya si hay cambios en `flight-proxy/` o `render.yaml`

---

## Opción B: Despliegue en Railway.app (También gratis)

### Pasos
1. Conecta GitHub en https://railway.app/
2. Selecciona el repositorio `GHT-OCA`
3. Railway autoconfigura desde `Dockerfile`
4. Configura variables de entorno en Dashboard: `FLIGHT_AWARE_KEY_1`, `FLIGHT_AWARE_KEY_2`
5. Deploy automático en push

---

## Opción C: Despliegue en Fly.io

### Pasos
```bash
# Instala fly CLI
curl -L https://fly.io/install.sh | sh

# Inicia sesión
fly auth login

# Inicializa el app
cd /workspaces/GHT-OCA
fly launch

# Configura variables
fly secrets set FLIGHT_AWARE_KEY_1=tu_clave_1
fly secrets set FLIGHT_AWARE_KEY_2=tu_clave_2

# Deploy
fly deploy
```

---

## Local Development

### Ejecutar en local
```bash
cd /workspaces/GHT-OCA/flight-proxy

# Instalar dependencias
npm install

# Configurar .env
cp .env.example .env
# Edita .env con tus API keys

# Ejecutar en desarrollo
npm run start:dev

# Visitarí: http://localhost:3000
```

### Compilar para producción
```bash
cd flight-proxy
npm run build
node dist/main.js
```

---

## Troubleshooting

### El mapa dice "Failed to fetch"
- **Local**: Navega a `http://localhost:3000` (mismo origin que el mapa)
- **Render**: Usa la URL pública de Render (HTTPS automático)
- **Verificar CORS**: El backend ya permite todos los orígenes en desarrollo

### No aparecen vuelos en el mapa
- Verifica que las API keys  de FlightAware estén correctas
- Las matrículas deben estar activas en FlightAware para aparecer
- Comprueba en la consola el navegador si hay errores específicos

### El servicio web (web dyno) despliega pero no responde
- Verifica que el puerto sea 3000
- Revisa los logs en Render/Railway/Fly.io dashboard
- Confirma que `npm run build` debe funcionar sin errores

---

## URLs Útiles

- Render: https://render.com
- Railway: https://railway.app
- Fly.io: https://fly.io
- FlightAware AeroAPI: https://www.flightaware.com/commercial/aeroapi/

---

## Notas de Seguridad

- **Nunca** commits las API keys al repositorio
- Usa variables de entorno para todo lo sensible
- En producción, las claves se configuran en el dashboard del proveedor
- Para desarrollo local, usa `.env` (que está en `.gitignore`)

---

## Estructura del proyecto (para referencia)

```
GHT-OCA/
├── index.html                 # Frontend (servido desde flight-proxy/3000)
├── style.css
├── flight-proxy/              # Backend NestJS
│   ├── Dockerfile             # Para deployment
│   ├── src/
│   │   ├── main.ts            # Servidor + Express static
│   │   ├── flights/           # Controllers/Services de flight-proxy
│   │   └── app.module.ts
│   ├── package.json
│   └── tsconfig.json
├── render.yaml                # Configuración de deploy
└── ... otros archivos
```
