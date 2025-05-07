#!/bin/bash

# Script de compilación para Render.com

echo "Iniciando compilación del frontend..."

# Instalar dependencias
echo "Instalando dependencias..."
npm install

# Saltar la verificación de tipos de TypeScript y compilar
echo "Compilando la aplicación..."
VITE_SKIP_TS_CHECK=true npm run build

echo "¡Compilación completada!" 