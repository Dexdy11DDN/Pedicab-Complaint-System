import axios from 'axios';
import RNFS from 'react-native-fs';
import Papa from 'papaparse';
import { addFranchises, clearAllFranchises } from './franchises';
import config from '../config';

// Use centralized config for API URL
// To change the server IP, edit: src/config/index.js
const API_URL = config.api.baseUrl;

export const syncWithAPI = async (token) => {
  try {
    console.log('Starting franchise sync with API...');
    console.log('API URL:', API_URL);
    
    const response = await axios.get(`${API_URL}/franchises`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params: {
        limit: 1000 // Get all franchises
      }
    });

    console.log('API response received');
    console.log('Response data keys:', Object.keys(response.data));
    
    // API returns {franchises: [...], totalPages, currentPage}
    const franchiseData = response.data?.franchises || response.data;
    
    console.log('Franchise data is array:', Array.isArray(franchiseData));
    console.log('Franchise count:', franchiseData?.length || 0);
    
    if (franchiseData && Array.isArray(franchiseData)) {
      console.log('First franchise:', franchiseData[0]);
      console.log('Last franchise:', franchiseData[franchiseData.length - 1]);
      
      // Clear existing franchises before syncing
      console.log('Clearing old franchise data...');
      await clearAllFranchises();
      
      console.log('Adding new franchise data...');
      const addResult = await addFranchises(franchiseData);
      console.log('Add franchises result:', addResult);
      
      console.log(`Synced ${franchiseData.length} franchises from API`);
      return {
        success: true,
        count: franchiseData.length,
        timestamp: new Date()
      };
    } else {
      console.error('Invalid franchise data format:', typeof franchiseData);
      throw new Error('Invalid response format from API');
    }
  } catch (error) {
    console.error('Sync failed:', error);
    console.error('Error message:', error.message);
    console.error('Error response:', error.response?.data);
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
    
    await addFranchises(sampleFranchises);
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
    
    await clearAllFranchises();
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

export const exportToCSV = async (franchises) => {
  try {
    // Prepare data for CSV
    const csvData = franchises.map(f => ({
      franchiseNumber: f.franchiseNumber,
      ownerName: f.ownerName,
      contactNumber: f.contactNumber,
      address: f.address,
      vehicleCount: f.vehicleCount,
      licenseNumber: f.licenseNumber,
      status: f.status,
      photos: f.photos && f.photos.length > 0 
        ? f.photos.map(p => p.url).join('|') 
        : ''
    }));
    
    // Convert to CSV
    const csv = Papa.unparse(csvData);
    
    // Save to Downloads folder
    const path = `${RNFS.DownloadDirectoryPath}/franchises_export_${Date.now()}.csv`;
    await RNFS.writeFile(path, csv, 'utf8');
    
    console.log(`Exported ${franchises.length} franchises to ${path}`);
    return { success: true, path };
  } catch (error) {
    console.error('Export failed:', error);
    return { success: false, error: error.message };
  }
};

export const importFromCSV = async (filePath) => {
  try {
    const csvData = await RNFS.readFile(filePath, 'utf8');
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            const franchises = results.data.map(row => {
              const photos = row.photos && row.photos.trim() 
                ? row.photos.split('|').map(url => ({ url: url.trim() }))
                : [];
              
              return {
                franchiseNumber: row.franchiseNumber,
                ownerName: row.ownerName,
                contactNumber: row.contactNumber,
                address: row.address,
                vehicleCount: parseInt(row.vehicleCount) || 1,
                licenseNumber: row.licenseNumber,
                status: row.status || 'active',
                photos: photos
              };
            });
            
            await addFranchises(franchises);
            console.log(`Imported ${franchises.length} franchises from CSV`);
            resolve({ success: true, count: franchises.length });
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('Import failed:', error);
    return { success: false, error: error.message };
  }
};

// Auto-sync setup
let syncInterval = null;

export const startAutoSync = (token, intervalMinutes = 0.5) => {
  if (syncInterval) {
    clearInterval(syncInterval);
  }
  
  console.log(`Starting auto-sync every ${intervalMinutes * 60} seconds`);
  
  syncInterval = setInterval(() => {
    // Check network connectivity before syncing
    syncWithAPI(token).catch(err => 
      console.log('Auto-sync skipped:', err.message)
    );
  }, intervalMinutes * 60 * 1000);
  
  // Initial sync
  syncWithAPI(token).catch(err => 
    console.log('Initial sync skipped:', err.message)
  );
};

export const stopAutoSync = () => {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log('Auto-sync stopped');
  }
};
