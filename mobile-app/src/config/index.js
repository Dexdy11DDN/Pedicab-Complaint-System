/**
 * App Configuration
 * 
 * IMPORTANT: Update the SERVER_IP when your network changes
 * Run 'ipconfig' in terminal to find your computer's IP address
 * 
 * For Physical Device: Use your computer's WiFi IP address
 * For Android Emulator: Use '10.0.2.2' (special alias for localhost)
 * For iOS Simulator: Use 'localhost'
 */

// ============================================================
// CHANGE THIS IP ADDRESS WHEN YOUR NETWORK CHANGES
// ============================================================
const SERVER_IP = '192.168.254.101';
// ============================================================

const SERVER_PORT = '5000';

// Environment detection
const isDev = __DEV__;

// Configuration object
const config = {
  // API Configuration
  api: {
    baseUrl: `http://${SERVER_IP}:${SERVER_PORT}/api`,
    timeout: 10000, // 10 seconds
  },
  
  // Server Configuration  
  server: {
    ip: SERVER_IP,
    port: SERVER_PORT,
    fullUrl: `http://${SERVER_IP}:${SERVER_PORT}`,
  },
  
  // Sync Configuration
  sync: {
    intervalMinutes: 0.5, // 30 seconds
    maxRetries: 3,
    retryDelayMs: 2000,
  },
  
  // Offline Mode Configuration
  offline: {
    maxQueueSize: 100,
    queueProcessIntervalMs: 5000,
  },
  
  // Debug Configuration
  debug: {
    enabled: isDev,
    logNetworkRequests: isDev,
    logDatabaseOperations: isDev,
  },
  
  // App Info
  app: {
    name: 'Pedicab Complaint System',
    version: '1.0.0',
    environment: isDev ? 'development' : 'production',
  },
};

// Helper to get API URL
export const getApiUrl = () => config.api.baseUrl;

// Helper to get server URL
export const getServerUrl = () => config.server.fullUrl;

// Helper to check if dev mode
export const isDevMode = () => config.debug.enabled;

// Export full config
export default config;

// Quick console log of config on app start (only in dev)
if (isDev) {
  console.log('=== App Configuration ===');
  console.log('Server IP:', SERVER_IP);
  console.log('API URL:', config.api.baseUrl);
  console.log('Sync Interval:', config.sync.intervalMinutes, 'minutes');
  console.log('=========================');
}
