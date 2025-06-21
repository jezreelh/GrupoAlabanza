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
    
    # Verificar archivos de configuración de routing
    echo "🔍 Verificando archivos de configuración de routing..."
    if [ -f "dist/_redirects" ]; then
        echo "✅ _redirects encontrado"
        cat dist/_redirects
    else
        echo "⚠️  _redirects no encontrado, copiando manualmente..."
        cp public/_redirects dist/_redirects 2>/dev/null || echo "❌ No se pudo copiar _redirects"
    fi
    
    if [ -f "dist/vercel.json" ]; then
        echo "✅ vercel.json encontrado"
    else
        echo "⚠️  vercel.json no encontrado, copiando manualmente..."
        cp public/vercel.json dist/vercel.json 2>/dev/null || echo "❌ No se pudo copiar vercel.json"
    fi
    
    if [ -f "dist/.htaccess" ]; then
        echo "✅ .htaccess encontrado"
    else
        echo "⚠️  .htaccess no encontrado, copiando manualmente..."
        cp public/.htaccess dist/.htaccess 2>/dev/null || echo "❌ No se pudo copiar .htaccess"
    fi
    
else
    echo "❌ Error en el build!"
    exit 1
fi

echo "🎉 Frontend listo para despliegue!" 