#!/bin/bash
set -e

# Script de compilación para Render.com

echo "Iniciando compilación del frontend..."

# Instalar dependencias
echo "Instalando dependencias..."
npm install
npm install @tailwindcss/forms --save

# Saltar la verificación de tipos de TypeScript y compilar
echo "Compilando la aplicación..."
npm run build

echo "Verificando la carpeta dist..."
if [ -d "dist" ]; then
  echo "Compilación completada exitosamente ✅"
  exit 0
else
  echo "Error: La carpeta dist no fue creada. Revisa los logs para más información."
  exit 1
fi 