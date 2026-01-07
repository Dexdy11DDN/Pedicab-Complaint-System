import { useEffect, useState, useRef, useCallback } from 'react';
import { Alert, AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import config from '../config';

/**
 * NetworkManager - Manages network connectivity and provides auto-recovery
 * 
 * Features:
 * - Real-time connectivity monitoring
 * - Auto-retry on connection restore
 * - Server health checks
 * - Offline mode detection
 */

const API_BASE_URL = config.api.baseUrl;

// Network state subscribers
let networkStateSubscribers = [];

// Current network state
let currentNetworkState = {
  isConnected: true,
  isInternetReachable: true,
  serverReachable: false,
  lastChecked: null,
};

/**
 * Subscribe to network state changes
 */
export const subscribeToNetworkState = (callback) => {
  networkStateSubscribers.push(callback);
  // Immediately call with current state
  callback(currentNetworkState);
  
  // Return unsubscribe function
  return () => {
    networkStateSubscribers = networkStateSubscribers.filter(sub => sub !== callback);
  };
};

/**
 * Notify all subscribers of state change
 */
const notifySubscribers = (state) => {
  currentNetworkState = { ...state, lastChecked: new Date().toISOString() };
  networkStateSubscribers.forEach(callback => callback(currentNetworkState));
};

/**
 * Check if the backend server is reachable
 */
export const checkServerHealth = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.log('Server health check failed:', error.message);
    return false;
  }
};

/**
 * Custom hook for network state management
 */
export const useNetworkStatus = () => {
  const [networkState, setNetworkState] = useState(currentNetworkState);
  const [isChecking, setIsChecking] = useState(false);
  const appState = useRef(AppState.currentState);
  const checkIntervalRef = useRef(null);

  const performNetworkCheck = useCallback(async () => {
    setIsChecking(true);
    try {
      const netInfo = await NetInfo.fetch();
      const serverReachable = await checkServerHealth();
      
      const newState = {
        isConnected: netInfo.isConnected,
        isInternetReachable: netInfo.isInternetReachable,
        serverReachable,
        connectionType: netInfo.type,
        lastChecked: new Date().toISOString(),
      };
      
      setNetworkState(newState);
      notifySubscribers(newState);
      
      return newState;
    } catch (error) {
      console.error('Network check failed:', error);
      return networkState;
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    // Initial check
    performNetworkCheck();

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(state => {
      const newState = {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        serverReachable: networkState.serverReachable,
        connectionType: state.type,
        lastChecked: new Date().toISOString(),
      };
      setNetworkState(newState);
      notifySubscribers(newState);
      
      // If connection restored, check server health
      if (state.isConnected && state.isInternetReachable) {
        checkServerHealth().then(serverReachable => {
          const updatedState = { ...newState, serverReachable };
          setNetworkState(updatedState);
          notifySubscribers(updatedState);
        });
      }
    });

    // App state listener for background/foreground
    const appStateSubscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground, check network
        performNetworkCheck();
      }
      appState.current = nextAppState;
    });

    // Periodic health check every 30 seconds
    checkIntervalRef.current = setInterval(() => {
      if (appState.current === 'active') {
        performNetworkCheck();
      }
    }, 30000);

    return () => {
      unsubscribe();
      appStateSubscription.remove();
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [performNetworkCheck]);

  return {
    ...networkState,
    isChecking,
    refresh: performNetworkCheck,
  };
};

/**
 * Retry wrapper for API calls
 */
export const withRetry = async (
  apiCall,
  options = {}
) => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onRetry = null,
    showAlert = true,
  } = options;

  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      console.log(`Attempt ${attempt}/${maxRetries} failed:`, error.message);
      
      if (attempt < maxRetries) {
        if (onRetry) {
          onRetry(attempt, error);
        }
        
        // Exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, retryDelay * Math.pow(2, attempt - 1))
        );
        
        // Check if network is available before retrying
        const netState = await NetInfo.fetch();
        if (!netState.isConnected) {
          if (showAlert) {
            Alert.alert(
              'No Internet Connection',
              'Please check your connection and try again.',
              [{ text: 'OK' }]
            );
          }
          throw new Error('No internet connection');
        }
      }
    }
  }
  
  throw lastError;
};

/**
 * Queue for offline operations
 */
class OfflineQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
  }

  add(operation) {
    this.queue.push({
      id: Date.now().toString(),
      operation,
      timestamp: new Date().toISOString(),
      retries: 0,
    });
    console.log(`Added operation to offline queue. Queue size: ${this.queue.length}`);
  }

  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    
    this.isProcessing = true;
    console.log(`Processing offline queue. ${this.queue.length} operations pending.`);
    
    const successfulIds = [];
    
    for (const item of this.queue) {
      try {
        await item.operation();
        successfulIds.push(item.id);
        console.log(`Successfully processed queued operation: ${item.id}`);
      } catch (error) {
        console.log(`Failed to process queued operation: ${item.id}`, error.message);
        item.retries++;
        
        // Remove if too many retries
        if (item.retries >= 5) {
          successfulIds.push(item.id);
          console.log(`Removing failed operation after 5 retries: ${item.id}`);
        }
      }
    }
    
    // Remove successful operations
    this.queue = this.queue.filter(item => !successfulIds.includes(item.id));
    this.isProcessing = false;
    
    console.log(`Queue processing complete. ${this.queue.length} operations remaining.`);
  }

  getQueueSize() {
    return this.queue.length;
  }

  clear() {
    this.queue = [];
  }
}

export const offlineQueue = new OfflineQueue();

// Auto-process queue when connection is restored
NetInfo.addEventListener(state => {
  if (state.isConnected && state.isInternetReachable) {
    offlineQueue.processQueue();
  }
});

export default {
  useNetworkStatus,
  checkServerHealth,
  withRetry,
  offlineQueue,
  subscribeToNetworkState,
};
