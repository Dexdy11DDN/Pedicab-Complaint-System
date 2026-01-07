// Socket.IO event emitter helper
// Used to broadcast real-time updates to connected clients

const emitToAll = (req, event, data) => {
  const io = req.app.get('io');
  if (io) {
    io.emit(event, data);
    console.log(`[Socket] Emitted ${event} to all clients`);
  }
};

const emitToRole = (req, role, event, data) => {
  const io = req.app.get('io');
  if (io) {
    io.to(`role-${role}`).emit(event, data);
    console.log(`[Socket] Emitted ${event} to role: ${role}`);
  }
};

const emitToUser = (req, userId, event, data) => {
  const io = req.app.get('io');
  if (io) {
    io.to(`user-${userId}`).emit(event, data);
    console.log(`[Socket] Emitted ${event} to user: ${userId}`);
  }
};

// Emit to multiple roles
const emitToRoles = (req, roles, event, data) => {
  const io = req.app.get('io');
  if (io) {
    roles.forEach(role => {
      io.to(`role-${role}`).emit(event, data);
    });
    console.log(`[Socket] Emitted ${event} to roles: ${roles.join(', ')}`);
  }
};

module.exports = {
  emitToAll,
  emitToRole,
  emitToUser,
  emitToRoles
};
