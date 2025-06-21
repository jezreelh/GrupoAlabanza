const mongoose = require('mongoose');
const Repertoire = require('../src/models/Repertoire');
const Song = require('../src/models/Song');

// Configuración de conexión con timeouts más largos
const connectOptions = {
  serverSelectionTimeoutMS: 30000, // 30 segundos
  socketTimeoutMS: 45000, // 45 segundos
  bufferMaxEntries: 0, // Desabilitar buffering
  maxPoolSize: 10, // Máximo 10 conexiones en el pool
};

async function connectToDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/grupo-alabanza';
    console.log('🔗 Intentando conectar a MongoDB...');
    console.log(`   URI: ${mongoUri}`);
    
    await mongoose.connect(mongoUri, connectOptions);
    console.log('✅ Conexión a MongoDB establecida exitosamente');
    return true;
  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error.message);
    console.log('');
    console.log('💡 Posibles soluciones:');
    console.log('   1. Verificar que MongoDB esté corriendo');
    console.log('   2. Revisar la URI de conexión');
    console.log('   3. Verificar las variables de entorno');
    return false;
  }
}

async function cleanPlayHistory() {
  try {
    console.log('🧹 Iniciando limpieza de historiales de reproducción...');
    console.log('');
    
    // Intentar conectar
    const connected = await connectToDatabase();
    if (!connected) {
      process.exit(1);
    }
    
    // Limpiar historiales de repertorios
    console.log('📚 Limpiando historiales de repertorios...');
    const repertoires = await Repertoire.find({}).timeout(30000);
    let repertoiresCleaned = 0;
    
    console.log(`   Encontrados ${repertoires.length} repertorios para revisar`);
    
    for (const repertoire of repertoires) {
      if (repertoire.playHistory && repertoire.playHistory.length > 3) {
        const originalLength = repertoire.playHistory.length;
        // Mantener solo los últimos 3
        repertoire.playHistory = repertoire.playHistory.slice(-3);
        await repertoire.save();
        repertoiresCleaned++;
        console.log(`  ✓ Repertorio "${repertoire.name}": ${originalLength} → ${repertoire.playHistory.length} registros`);
      }
    }
    
    // Limpiar historiales de canciones
    console.log('🎵 Limpiando historiales de canciones...');
    const songs = await Song.find({}).timeout(30000);
    let songsCleaned = 0;
    
    console.log(`   Encontradas ${songs.length} canciones para revisar`);
    
    for (const song of songs) {
      if (song.playHistory && song.playHistory.length > 3) {
        const originalLength = song.playHistory.length;
        // Mantener solo los últimos 3
        song.playHistory = song.playHistory.slice(-3);
        await song.save();
        songsCleaned++;
        console.log(`  ✓ Canción "${song.title}": ${originalLength} → ${song.playHistory.length} registros`);
      }
    }
    
    console.log('\n✅ Limpieza completada exitosamente:');
    console.log(`   • ${repertoiresCleaned} repertorios limpiados`);
    console.log(`   • ${songsCleaned} canciones limpiadas`);
    console.log('   • A partir de ahora solo se mantendrán los últimos 3 registros automáticamente');
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error.message);
    if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
      console.log('\n💡 El timeout sugiere que MongoDB no está disponible o tarda mucho en responder');
    }
    process.exit(1);
  } finally {
    try {
      await mongoose.connection.close();
      console.log('🔐 Conexión a la base de datos cerrada');
    } catch (error) {
      console.log('⚠️  Error al cerrar conexión:', error.message);
    }
    process.exit(0);
  }
}

// Verificar que estamos ejecutando el script directamente
if (require.main === module) {
  cleanPlayHistory();
} else {
  module.exports = { cleanPlayHistory };
} 