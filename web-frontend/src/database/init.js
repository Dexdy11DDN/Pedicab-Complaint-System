import initSqlJs from 'sql.js';

let db = null;
let SQL = null;

export const initDatabase = async () => {
  try {
    // Initialize SQL.js
    SQL = await initSqlJs({
      locateFile: file => `https://sql.js.org/dist/${file}`
    });

    // Try to load existing database from localStorage
    const savedDb = localStorage.getItem('franchiseDb');
    if (savedDb) {
      try {
        const uint8Array = new Uint8Array(JSON.parse(savedDb));
        db = new SQL.Database(uint8Array);
        console.log('Loaded existing franchise database');
      } catch (error) {
        console.error('Error loading saved database:', error);
        db = new SQL.Database();
      }
    } else {
      db = new SQL.Database();
      console.log('Created new franchise database');
    }

    // Create franchises table if it doesn't exist
    db.run(`
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
        offenseCount INTEGER DEFAULT 0,
        hasThreeStrikes BOOLEAN DEFAULT 0,
        offenses TEXT,
        lastSynced DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Migration logic for existing databases
    try {
      const columns = db.exec("PRAGMA table_info(franchises)");
      const columnNames = columns[0].values.map(v => v[1]);

      if (!columnNames.includes('offenseCount')) {
        db.run("ALTER TABLE franchises ADD COLUMN offenseCount INTEGER DEFAULT 0");
        console.log('Added offenseCount column to franchises table');
      }
      if (!columnNames.includes('hasThreeStrikes')) {
        db.run("ALTER TABLE franchises ADD COLUMN hasThreeStrikes BOOLEAN DEFAULT 0");
        console.log('Added hasThreeStrikes column to franchises table');
      }
      if (!columnNames.includes('offenses')) {
        db.run("ALTER TABLE franchises ADD COLUMN offenses TEXT");
        console.log('Added offenses column to franchises table');
      }
    } catch (e) {
      console.error('Error during database migration:', e);
    }

    console.log('Franchise database initialized');
    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

export const saveDatabase = () => {
  if (!db) {
    console.error('Database not initialized');
    return;
  }

  try {
    const data = db.export();
    const buffer = JSON.stringify(Array.from(data));
    localStorage.setItem('franchiseDb', buffer);
    console.log('Database saved to localStorage');
  } catch (error) {
    console.error('Failed to save database:', error);
  }
};

export const getDatabase = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
};

export const closeDatabase = () => {
  if (db) {
    saveDatabase();
    db.close();
    db = null;
    console.log('Database closed');
  }
};
