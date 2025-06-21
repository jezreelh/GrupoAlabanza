#!/bin/bash

# Script de construcción para el frontend
echo "🚀 Iniciando construcción del frontend..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json. Asegúrate de estar en el directorio frontend."
    exit 1
fi

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
    du -sh dist/ 2>/dev/null || echo "No se pudo obtener el tamaño del directorio"
    ls -la dist/ 2>/dev/null || echo "No se pudo listar el contenido del directorio"
    
    # Verificar archivos de configuración de routing
    echo "🔍 Verificando archivos de configuración de routing..."
    
    # Verificar y copiar _redirects
    if [ -f "dist/_redirects" ]; then
        echo "✅ _redirects encontrado en dist/"
        echo "📄 Contenido de _redirects:"
        cat dist/_redirects
    elif [ -f "public/_redirects" ]; then
        echo "⚠️  _redirects no encontrado en dist/, copiando desde public/"
        cp public/_redirects dist/_redirects
        echo "✅ _redirects copiado exitosamente"
        cat dist/_redirects
    else
        echo "❌ _redirects no encontrado, creando uno básico..."
        echo "/* /index.html 200" > dist/_redirects
        echo "✅ _redirects creado"
    fi
    
    # Verificar otros archivos de configuración
    for file in "vercel.json" ".htaccess" "nginx.conf"; do
        if [ -f "dist/$file" ]; then
            echo "✅ $file encontrado en dist/"
        elif [ -f "public/$file" ]; then
            echo "⚠️  $file no encontrado en dist/, copiando desde public/"
            cp "public/$file" "dist/$file" 2>/dev/null && echo "✅ $file copiado" || echo "❌ No se pudo copiar $file"
        fi
    done
    
    # Verificar que index.html existe
    if [ -f "dist/index.html" ]; then
        echo "✅ index.html encontrado"
    else
        echo "❌ Error: index.html no encontrado en dist/"
        exit 1
    fi
    
    echo "📋 Archivos finales en dist/:"
    ls -la dist/ 2>/dev/null || echo "No se pudo listar el contenido final"
    
else
    echo "❌ Error en el build!"
  exit 1
fi 

echo "🎉 Frontend listo para despliegue!" 