#!/bin/bash

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 DIAGNÓSTICO DE FLIGHT-PROXY"
echo "================================"

# Check if .env exists
echo -e "\n1️⃣  Verificando archivo .env..."
if [ -f "flight-proxy/.env" ]; then
    echo -e "${GREEN}✅ Archivo .env encontrado${NC}"
    
    # Check if keys are present
    KEY1=$(grep "FLIGHT_AWARE_KEY_1" flight-proxy/.env | cut -d'=' -f2)
    KEY2=$(grep "FLIGHT_AWARE_KEY_2" flight-proxy/.env | cut -d'=' -f2)
    
    if [ -z "$KEY1" ]; then
        echo -e "${RED}❌ FLIGHT_AWARE_KEY_1 no está configurada${NC}"
    else
        if [[ "$KEY1" == *"REEMPLAZA"* ]] || [[ "$KEY1" == *"your_"* ]]; then
            echo -e "${RED}❌ FLIGHT_AWARE_KEY_1 aún tiene valor de placeholder${NC}"
        else
            echo -e "${GREEN}✅ FLIGHT_AWARE_KEY_1 configurada${NC}"
        fi
    fi
    
    if [ -z "$KEY2" ]; then
        echo -e "${RED}❌ FLIGHT_AWARE_KEY_2 no está configurada${NC}"
    else
        if [[ "$KEY2" == *"REEMPLAZA"* ]] || [[ "$KEY2" == *"your_"* ]]; then
            echo -e "${RED}❌ FLIGHT_AWARE_KEY_2 aún tiene valor de placeholder${NC}"
        else
            echo -e "${GREEN}✅ FLIGHT_AWARE_KEY_2 configurada${NC}"
        fi
    fi
else
    echo -e "${RED}❌ Archivo .env NO encontrado${NC}"
    echo -e "${YELLOW}   Copia .env.example a .env y configura tus API keys${NC}"
fi

# Check if server is running
echo -e "\n2️⃣  Verificando si el servidor está corriendo en puerto 3000..."
RESPONSE=$(curl -s -m 5 http://localhost:3000/api/flights/ping 2>/dev/null)

if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}✅ Servidor está respondiendo${NC}"
    
    # Parse response
    API_KEYS_LOADED=$(echo $RESPONSE | grep -o '"apiKeysLoaded":[0-9]*' | cut -d':' -f2)
    if [ -z "$API_KEYS_LOADED" ]; then
        API_KEYS_LOADED="?"
    fi
    
    echo "   API Keys cargadas: $API_KEYS_LOADED"
    echo "   Respuesta completa: $RESPONSE"
else
    echo -e "${RED}❌ Servidor NO está respondiendo${NC}"
    echo -e "${YELLOW}   Inicia el servidor con: cd flight-proxy && npm run start:dev${NC}"
fi

# Check dependencies
echo -e "\n3️⃣  Verificando dependencias..."
if [ -d "flight-proxy/node_modules" ]; then
    echo -e "${GREEN}✅ node_modules existe${NC}"
else
    echo -e "${RED}❌ node_modules NO existe${NC}"
    echo -e "${YELLOW}   Ejecuta: cd flight-proxy && npm install${NC}"
fi

# Summary
echo -e "\n📋 RESUMEN:"
echo "===========
echo -e "${YELLOW}Si todo está en verde (✅), Cargar Mapa debería funcionar.${NC}"
echo -e "${YELLOW}Si hay algo en rojo (❌), sigue las instrucciones arriba.${NC}"
echo ""
echo "📖 Para más detalles, lee: flight-proxy/MAP_ERRORS_GUIDE.md"
