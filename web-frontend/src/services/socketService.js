import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.isConnected = false;
  }

  connect() {
    if (this.socket && this.isConnected) {
      console.log('[Socket] Already connected');
      return;
    }

    try {
      const userData = localStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : null;

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const socketUrl = apiUrl.replace('/api', '');

      // Connect to Socket.IO server
      this.socket = io(socketUrl, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });

      const socket = this.socket;

      socket.on('connect', () => {
        // Safety check: verify this is still the active socket and not null
        if (!this.socket || this.socket !== socket) {
          console.log('[Socket] Connect event fired for obsolete or disconnected socket');
          return;
        }

        console.log('[Socket] Connected:', socket.id);
        this.isConnected = true;

        // Join user-specific rooms
        if (user) {
          socket.emit('join', {
            userId: user.id || user._id,
            role: user.role
          });
        }
      });

      socket.on('disconnect', (reason) => {
        console.log('[Socket] Disconnected:', reason);
        // Only set connected to false if this is still the active socket
        if (this.socket === socket) {
          this.isConnected = false;
        }
      });

      socket.on('connect_error', (error) => {
        console.log('[Socket] Connection error:', error.message);
        if (this.socket === socket) {
          this.isConnected = false;
        }
      });

      // Re-register all existing listeners
      this.listeners.forEach((callbacks, event) => {
        callbacks.forEach(callback => {
          socket.on(event, callback);
        });
      });

    } catch (error) {
      console.error('[Socket] Failed to connect:', error);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('[Socket] Disconnected manually');
    }
  }

  on(event, callback) {
    // Store listener for reconnection
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    // Add listener if already connected
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    // Remove from stored listeners
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }

    // Remove from socket
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn('[Socket] Cannot emit, not connected');
    }
  }

  // Helper to subscribe to data updates
  subscribeToUpdates(callbacks = {}) {
    const {
      onComplaintCreated,
      onComplaintUpdated,
      onComplaintStatusChanged,
      onInvestigationCreated,
      onInvestigationUpdated,
      onTicketCreated,
      onTicketUpdated,
    } = callbacks;

    if (onComplaintCreated) this.on('complaint:created', onComplaintCreated);
    if (onComplaintUpdated) this.on('complaint:updated', onComplaintUpdated);
    if (onComplaintStatusChanged) this.on('complaint:statusChanged', onComplaintStatusChanged);
    if (onInvestigationCreated) this.on('investigation:created', onInvestigationCreated);
    if (onInvestigationUpdated) this.on('investigation:updated', onInvestigationUpdated);
    if (onTicketCreated) this.on('ticket:created', onTicketCreated);
    if (onTicketUpdated) this.on('ticket:updated', onTicketUpdated);
  }

  unsubscribeFromUpdates(callbacks = {}) {
    const {
      onComplaintCreated,
      onComplaintUpdated,
      onComplaintStatusChanged,
      onInvestigationCreated,
      onInvestigationUpdated,
      onTicketCreated,
      onTicketUpdated,
    } = callbacks;

    if (onComplaintCreated) this.off('complaint:created', onComplaintCreated);
    if (onComplaintUpdated) this.off('complaint:updated', onComplaintUpdated);
    if (onComplaintStatusChanged) this.off('complaint:statusChanged', onComplaintStatusChanged);
    if (onInvestigationCreated) this.off('investigation:created', onInvestigationCreated);
    if (onInvestigationUpdated) this.off('investigation:updated', onInvestigationUpdated);
    if (onTicketCreated) this.off('ticket:created', onTicketCreated);
    if (onTicketUpdated) this.off('ticket:updated', onTicketUpdated);
  }
}

// Singleton instance
const socketService = new SocketService();
export default socketService;
