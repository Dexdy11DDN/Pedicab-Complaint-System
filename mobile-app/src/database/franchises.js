import { getDatabase } from './init';

export const addFranchises = async (franchises) => {
  try {
    console.log(`Starting to add ${franchises.length} franchises to database...`);
    const db = getDatabase();
    
    let successCount = 0;
    let errorCount = 0;
    
    // Use regular transaction instead of async transaction
    return new Promise((resolve, reject) => {
      db.transaction(
        tx => {
          for (const franchise of franchises) {
            try {
              const photosJson = JSON.stringify(franchise.photos || []);
              
              tx.executeSql(
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
                ],
                () => { successCount++; },
                (tx, error) => {
                  errorCount++;
                  console.error(`Error adding franchise ${franchise.franchiseNumber}:`, error);
                  return false; // Continue transaction
                }
              );
            } catch (franchiseError) {
              errorCount++;
              console.error(`Error preparing franchise ${franchise.franchiseNumber}:`, franchiseError);
            }
          }
        },
        error => {
          console.error('Transaction error:', error);
          reject(error);
        },
        () => {
          console.log(`Finished: ${successCount} successful, ${errorCount} errors out of ${franchises.length} total`);
          resolve(true);
        }
      );
    });
  } catch (error) {
    console.error('Error adding franchises:', error);
    console.error('Error details:', error.message, error.code);
    return false;
  }
};

export const searchFranchises = async (query = '') => {
  try {
    const db = getDatabase();
    let results;
    
    if (query.trim() === '') {
      // Return all franchises if no query
      results = await db.executeSql(
        'SELECT * FROM franchises ORDER BY franchiseNumber'
      );
    } else {
      results = await db.executeSql(
        `SELECT * FROM franchises 
         WHERE franchiseNumber LIKE ? 
         OR ownerName LIKE ? 
         OR licenseNumber LIKE ?
         ORDER BY franchiseNumber`,
        [`%${query}%`, `%${query}%`, `%${query}%`]
      );
    }
    
    const franchises = [];
    if (results && results.length > 0) {
      const rows = results[0].rows;
      for (let i = 0; i < rows.length; i++) {
        const row = rows.item(i);
        row.photos = JSON.parse(row.photos || '[]');
        franchises.push(row);
      }
    }
    
    return franchises;
  } catch (error) {
    console.error('Error searching franchises:', error);
    return [];
  }
};

export const getFranchiseByNumber = async (franchiseNumber) => {
  try {
    const db = getDatabase();
    const results = await db.executeSql(
      'SELECT * FROM franchises WHERE franchiseNumber = ?',
      [franchiseNumber]
    );
    
    if (results && results.length > 0 && results[0].rows.length > 0) {
      const franchise = results[0].rows.item(0);
      franchise.photos = JSON.parse(franchise.photos || '[]');
      return franchise;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting franchise:', error);
    return null;
  }
};

export const updateFranchise = async (franchiseNumber, updates) => {
  try {
    const db = getDatabase();
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
    if (updates.photos !== undefined) {
      fields.push('photos = ?');
      values.push(JSON.stringify(updates.photos));
    }
    
    fields.push("lastSynced = datetime('now')");
    values.push(franchiseNumber);
    
    const query = `UPDATE franchises SET ${fields.join(', ')} WHERE franchiseNumber = ?`;
    await db.executeSql(query, values);
    
    console.log(`Updated franchise ${franchiseNumber}`);
    return true;
  } catch (error) {
    console.error('Error updating franchise:', error);
    return false;
  }
};

export const deleteFranchise = async (franchiseNumber) => {
  try {
    const db = getDatabase();
    await db.executeSql(
      'DELETE FROM franchises WHERE franchiseNumber = ?',
      [franchiseNumber]
    );
    
    console.log(`Deleted franchise ${franchiseNumber}`);
    return true;
  } catch (error) {
    console.error('Error deleting franchise:', error);
    return false;
  }
};

export const getFranchiseCount = async () => {
  try {
    const db = getDatabase();
    const results = await db.executeSql(
      'SELECT COUNT(*) as count FROM franchises'
    );
    
    if (results && results.length > 0 && results[0].rows.length > 0) {
      return results[0].rows.item(0).count;
    }
    
    return 0;
  } catch (error) {
    console.error('Error getting franchise count:', error);
    return 0;
  }
};

export const clearAllFranchises = async () => {
  try {
    const db = getDatabase();
    await db.executeSql('DELETE FROM franchises');
    console.log('Cleared all franchises');
    return true;
  } catch (error) {
    console.error('Error clearing franchises:', error);
    return false;
  }
};
