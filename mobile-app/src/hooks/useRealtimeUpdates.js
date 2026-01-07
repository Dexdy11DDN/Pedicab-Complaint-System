import { useEffect, useCallback, useRef } from 'react';
import socketService from '../services/socketService';

/**
 * Hook to subscribe to real-time updates from the server
 * @param {Object} callbacks - Object containing callback functions for different events
 * @param {Array} deps - Dependencies array to re-subscribe when changed
 */
export const useRealtimeUpdates = (callbacks = {}, deps = []) => {
  const callbacksRef = useRef(callbacks);
  
  // Keep callbacks ref updated
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => {
    // Create stable wrapper functions
    const wrappers = {};
    
    Object.keys(callbacksRef.current).forEach(key => {
      wrappers[key] = (data) => {
        if (callbacksRef.current[key]) {
          callbacksRef.current[key](data);
        }
      };
    });

    // Subscribe to updates
    socketService.subscribeToUpdates(wrappers);

    // Cleanup on unmount
    return () => {
      socketService.unsubscribeFromUpdates(wrappers);
    };
  }, deps);
};

/**
 * Hook to get socket connection status
 */
export const useSocketStatus = () => {
  return socketService.isConnected;
};

export default useRealtimeUpdates;
