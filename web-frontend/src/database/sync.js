import axios from 'axios';
import { addFranchises, clearAllFranchises } from './franchises';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const syncWithAPI = async (token) => {
  try {
    console.log('Starting franchise sync with API...');
    
    const response = await axios.get(`${API_URL}/franchises`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params: {
        limit: 1000 // Get all franchises
      }
    });

    // API returns {franchises: [...], totalPages, currentPage}
    const franchiseData = response.data?.franchises || response.data;
    
    if (franchiseData && Array.isArray(franchiseData)) {
      addFranchises(franchiseData);
      console.log(`Synced ${franchiseData.length} franchises from API`);
      return {
        success: true,
        count: franchiseData.length,
        timestamp: new Date()
      };
    } else {
      throw new Error('Invalid response format from API');
    }
  } catch (error) {
    console.error('Sync failed:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date()
    };
  }
};

// Load initial sample data on first run
export const loadInitialData = async () => {
  try {
    console.log('Loading initial sample franchise data...');
    
    // Generate 100 sample franchises (1001-1100)
    const sampleFranchises = [];
    const filipinoNames = [
      'Juan Dela Cruz', 'Maria Santos', 'Jose Reyes', 'Ana Garcia', 'Pedro Martinez',
      'Rosa Hernandez', 'Carlos Lopez', 'Elena Gonzales', 'Miguel Torres', 'Sofia Ramos',
      'Antonio Cruz', 'Isabella Flores', 'Luis Rivera', 'Carmen Bautista', 'Diego Mendoza',
      'Victoria Silva', 'Fernando Castro', 'Gabriela Diaz', 'Ricardo Morales', 'Angelica Romero'
    ];
    
    const manilaAddresses = [
      'Tondo, Manila', 'Binondo, Manila', 'Quiapo, Manila', 'Sampaloc, Manila', 'Santa Cruz, Manila',
      'Sta. Mesa, Manila', 'Pandacan, Manila', 'Paco, Manila', 'Malate, Manila', 'Ermita, Manila',
      'Intramuros, Manila', 'San Miguel, Manila', 'Port Area, Manila', 'San Nicolas, Manila'
    ];
    
    for (let i = 1001; i <= 1100; i++) {
      const nameIndex = (i - 1001) % filipinoNames.length;
      const addressIndex = (i - 1001) % manilaAddresses.length;
      const vehicleCount = Math.floor(Math.random() * 5) + 1;
      const statusOptions = ['active', 'active', 'active', 'active', 'suspended', 'revoked'];
      const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
      
      sampleFranchises.push({
        franchiseNumber: String(i),
        ownerName: filipinoNames[nameIndex],
        contactNumber: `+63 9${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`,
        address: manilaAddresses[addressIndex],
        vehicleCount: vehicleCount,
        licenseNumber: `LIC-${i}-${new Date().getFullYear()}`,
        status: status,
        photos: []
      });
    }
    
    addFranchises(sampleFranchises);
    console.log(`Loaded ${sampleFranchises.length} sample franchises`);
    
    return {
      success: true,
      count: sampleFranchises.length,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Failed to load initial data:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date()
    };
  }
};

export const fullSync = async (token) => {
  try {
    console.log('Starting full sync (clearing local data)...');
    
    clearAllFranchises();
    return await syncWithAPI(token);
  } catch (error) {
    console.error('Full sync failed:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date()
    };
  }
};

export const exportToCSV = (franchises) => {
  try {
    // CSV header
    const header = 'franchiseNumber,ownerName,contactNumber,address,vehicleCount,licenseNumber,status,photos\n';
    
    // CSV rows
    const rows = franchises.map(f => {
      const photos = f.photos && f.photos.length > 0 
        ? f.photos.map(p => p.url).join('|') 
        : '';
      
      return `${f.franchiseNumber},"${f.ownerName}","${f.contactNumber}","${f.address}",${f.vehicleCount},"${f.licenseNumber}","${f.status}","${photos}"`;
    }).join('\n');
    
    const csv = header + rows;
    
    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `franchises_export_${new Date().getTime()}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    console.log(`Exported ${franchises.length} franchises to CSV`);
    return true;
  } catch (error) {
    console.error('Export failed:', error);
    return false;
  }
};

export const importFromCSV = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n');
        const franchises = [];
        
        // Skip header row
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          // Parse CSV line (handle quoted fields)
          const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
          const fields = line.split(regex).map(f => f.replace(/^"|"$/g, ''));
          
          if (fields.length >= 7) {
            const photos = fields[7] && fields[7].trim() 
              ? fields[7].split('|').map(url => ({ url: url.trim() }))
              : [];
            
            franchises.push({
              franchiseNumber: fields[0],
              ownerName: fields[1],
              contactNumber: fields[2],
              address: fields[3],
              vehicleCount: parseInt(fields[4]) || 1,
              licenseNumber: fields[5],
              status: fields[6] || 'active',
              photos: photos
            });
          }
        }
        
        addFranchises(franchises);
        console.log(`Imported ${franchises.length} franchises from CSV`);
        resolve({ success: true, count: franchises.length });
      } catch (error) {
        console.error('Import failed:', error);
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
};

// Auto-sync setup
let syncInterval = null;

export const startAutoSync = (token, intervalMinutes = 0.5) => {
  if (syncInterval) {
    clearInterval(syncInterval);
  }
  
  console.log(`Starting auto-sync every ${intervalMinutes * 60} seconds`);
  
  syncInterval = setInterval(() => {
    if (navigator.onLine) {
      syncWithAPI(token);
    } else {
      console.log('Offline - skipping auto-sync');
    }
  }, intervalMinutes * 60 * 1000);
  
  // Initial sync
  if (navigator.onLine) {
    syncWithAPI(token);
  }
};

export const stopAutoSync = () => {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log('Auto-sync stopped');
  }
};
