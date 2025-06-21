#!/bin/bash

# Script de construcción para el frontend
echo "🚀 Iniciando construcción del frontend..."

# Limpiar directorio de build anterior
echo "🧹 Limpiando directorio de build anterior..."
rm -rf dist/

# Instalar dependencias si es necesario
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

# Construir la aplicación
echo "🔨 Construyendo la aplicación..."
npm run build

# Verificar que el build fue exitoso
if [ $? -eq 0 ]; then
    echo "✅ Build completado exitosamente!"
    echo "📁 Los archivos están en el directorio 'dist/'"
    
    # Mostrar información del build
    echo "📊 Información del build:"
    du -sh dist/
    ls -la dist/
else
    echo "❌ Error en el build!"
    exit 1
fi

echo "🎉 Frontend listo para despliegue!" 