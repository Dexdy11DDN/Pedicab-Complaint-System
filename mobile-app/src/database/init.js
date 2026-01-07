import SQLite from 'react-native-sqlite-storage';

SQLite.DEBUG(false);
SQLite.enablePromise(true);

let db = null;

export const initDatabase = async () => {
  try {
    if (db) {
      console.log('Database already initialized');
      return db;
    }

    db = await SQLite.openDatabase(
      {
        name: 'pedicab.db',
        location: 'default',
      },
      () => console.log('Database opened successfully'),
      error => console.error('Error opening database:', error)
    );

    // Create franchises table
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS franchises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        franchiseNumber TEXT UNIQUE NOT NULL,
        ownerName TEXT,
        contactNumber TEXT,
        address TEXT,
        vehicleCount INTEGER,
        licenseNumber TEXT,
        status TEXT,
        photos TEXT,
        lastSynced DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Franchise database initialized');
    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    // If database is corrupt, try to recreate
    if (error.code === 11) {
      console.log('Attempting to recreate database...');
      db = null;
      try {
        await SQLite.deleteDatabase({ name: 'pedicab.db', location: 'default' });
        return await initDatabase(); // Retry
      } catch (deleteError) {
        console.error('Failed to recreate database:', deleteError);
      }
    }
    throw error;
  }
};

export const getDatabase = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
};

export const closeDatabase = async () => {
  if (db) {
    await db.close();
    db = null;
    console.log('Database closed');
  }
};
