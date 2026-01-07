import { getDatabase, saveDatabase } from './init';

export const addFranchises = (franchises) => {
  const db = getDatabase();
  
  franchises.forEach(franchise => {
    const photosJson = JSON.stringify(franchise.photos || []);
    
    db.run(
      `INSERT OR REPLACE INTO franchises 
       (franchiseNumber, ownerName, contactNumber, address, vehicleCount, licenseNumber, status, photos, lastSynced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [
        franchise.franchiseNumber,
        franchise.ownerName,
        franchise.contactNumber,
        franchise.address,
        franchise.vehicleCount,
        franchise.licenseNumber,
        franchise.status,
        photosJson
      ]
    );
  });
  
  saveDatabase();
  console.log(`Added/updated ${franchises.length} franchises`);
};

export const searchFranchises = (query = '') => {
  const db = getDatabase();
  
  let stmt;
  if (query.trim() === '') {
    // Return all franchises if no query
    stmt = db.prepare('SELECT * FROM franchises ORDER BY franchiseNumber');
  } else {
    stmt = db.prepare(`
      SELECT * FROM franchises 
      WHERE franchiseNumber LIKE ? 
      OR ownerName LIKE ? 
      OR licenseNumber LIKE ?
      ORDER BY franchiseNumber
    `);
    stmt.bind([`%${query}%`, `%${query}%`, `%${query}%`]);
  }
  
  const results = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    row.photos = JSON.parse(row.photos || '[]');
    results.push(row);
  }
  stmt.free();
  
  return results;
};

export const getFranchiseByNumber = (franchiseNumber) => {
  const db = getDatabase();
  
  const stmt = db.prepare(
    'SELECT * FROM franchises WHERE franchiseNumber = ?'
  );
  stmt.bind([franchiseNumber]);
  
  let franchise = null;
  if (stmt.step()) {
    franchise = stmt.getAsObject();
    franchise.photos = JSON.parse(franchise.photos || '[]');
  }
  stmt.free();
  
  return franchise;
};

export const updateFranchise = (franchiseNumber, updates) => {
  const db = getDatabase();
  
  const photosJson = updates.photos ? JSON.stringify(updates.photos) : null;
  
  const fields = [];
  const values = [];
  
  if (updates.ownerName !== undefined) {
    fields.push('ownerName = ?');
    values.push(updates.ownerName);
  }
  if (updates.contactNumber !== undefined) {
    fields.push('contactNumber = ?');
    values.push(updates.contactNumber);
  }
  if (updates.address !== undefined) {
    fields.push('address = ?');
    values.push(updates.address);
  }
  if (updates.vehicleCount !== undefined) {
    fields.push('vehicleCount = ?');
    values.push(updates.vehicleCount);
  }
  if (updates.licenseNumber !== undefined) {
    fields.push('licenseNumber = ?');
    values.push(updates.licenseNumber);
  }
  if (updates.status !== undefined) {
    fields.push('status = ?');
    values.push(updates.status);
  }
  if (photosJson !== null) {
    fields.push('photos = ?');
    values.push(photosJson);
  }
  
  fields.push("lastSynced = datetime('now')");
  values.push(franchiseNumber);
  
  const query = `UPDATE franchises SET ${fields.join(', ')} WHERE franchiseNumber = ?`;
  db.run(query, values);
  
  saveDatabase();
  console.log(`Updated franchise ${franchiseNumber}`);
};

export const deleteFranchise = (franchiseNumber) => {
  const db = getDatabase();
  
  db.run('DELETE FROM franchises WHERE franchiseNumber = ?', [franchiseNumber]);
  saveDatabase();
  console.log(`Deleted franchise ${franchiseNumber}`);
};

export const getFranchiseCount = () => {
  const db = getDatabase();
  
  const stmt = db.prepare('SELECT COUNT(*) as count FROM franchises');
  stmt.step();
  const result = stmt.getAsObject();
  stmt.free();
  
  return result.count;
};

export const clearAllFranchises = () => {
  const db = getDatabase();
  
  db.run('DELETE FROM franchises');
  saveDatabase();
  console.log('Cleared all franchises');
};
