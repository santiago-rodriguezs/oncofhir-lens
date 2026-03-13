#!/bin/bash
# OncoLens — Development environment
# Levanta HAPI FHIR (Docker) + Next.js dev server

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}  OncoLens — Entorno de desarrollo     ${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"

# 1. Verificar Docker
if ! command -v docker &> /dev/null; then
  echo -e "${RED}Docker no está instalado. Instalalo con: sudo apt install docker.io${NC}"
  exit 1
fi

# 2. Levantar HAPI FHIR si no está corriendo
if docker ps --format '{{.Names}}' | grep -q '^hapi-fhir$'; then
  echo -e "${GREEN}✓ HAPI FHIR ya está corriendo${NC}"
elif docker ps -a --format '{{.Names}}' | grep -q '^hapi-fhir$'; then
  echo -e "${YELLOW}→ Iniciando contenedor HAPI FHIR existente...${NC}"
  sudo docker start hapi-fhir
  echo -e "${GREEN}✓ HAPI FHIR iniciado${NC}"
else
  echo -e "${YELLOW}→ Descargando e iniciando HAPI FHIR...${NC}"
  sudo docker run -d --name hapi-fhir -p 8080:8080 hapiproject/hapi:latest
  echo -e "${GREEN}✓ HAPI FHIR iniciado${NC}"
fi

# 3. Esperar a que HAPI FHIR esté listo
echo -e "${YELLOW}→ Esperando a que HAPI FHIR responda...${NC}"
for i in $(seq 1 30); do
  if curl -s http://localhost:8080/fhir/metadata > /dev/null 2>&1; then
    echo -e "${GREEN}✓ HAPI FHIR listo en http://localhost:8080${NC}"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo -e "${RED}HAPI FHIR no respondió después de 30s. Verificá con: sudo docker logs hapi-fhir${NC}"
    exit 1
  fi
  sleep 1
done

# 4. Verificar .env.local
if [ ! -f .env.local ]; then
  echo -e "${RED}.env.local no encontrado. Copiá .env.example y configurá las variables.${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}  Servicios:                           ${NC}"
echo -e "${GREEN}  • HAPI FHIR:  http://localhost:8080  ${NC}"
echo -e "${GREEN}  • OncoLens:   http://localhost:3000  ${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""

# 5. Levantar Next.js
npm run dev
