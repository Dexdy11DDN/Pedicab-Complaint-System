import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import './dashboards/Dashboard.css';

const EnforcerManagement = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [enforcers, setEnforcers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showEnforcerForm, setShowEnforcerForm] = useState(false);
  const [enforcerForm, setEnforcerForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: ''
  });

  useEffect(() => {
    loadEnforcers();
  }, []);

  const loadEnforcers = async () => {
    try {
      setLoading(true);
      console.log('Loading enforcers...');
      const response = await authAPI.getEnforcers();
      console.log('Enforcers response:', response.data);
      setEnforcers(response.data.enforcers || []);
      setMessage('');
    } catch (error) {
      console.error('Error loading enforcers:', error);
      console.error('Error response:', error.response?.data);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to load enforcers';
      setMessage('Error: ' + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEnforcer = async (e) => {
    e.preventDefault();
    try {
      await authAPI.createEnforcer(enforcerForm);
      setMessage('Enforcer created successfully');
      setShowEnforcerForm(false);
      setEnforcerForm({ firstName: '', lastName: '', email: '', phoneNumber: '', password: '' });
      loadEnforcers();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error creating enforcer:', error);
      setMessage(error.response?.data?.message || 'Failed to create enforcer');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleToggleStatus = async (enforcer) => {
    try {
      await authAPI.updateUserStatus(enforcer._id, { isActive: enforcer.isActive === false });
      setMessage(`Enforcer ${enforcer.isActive !== false ? 'deactivated' : 'activated'} successfully`);
      loadEnforcers();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating enforcer status:', error);
      setMessage('Failed to update enforcer status');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>🛡️ Enforcer Management</h1>
        </div>
        <div className="header-right">
          <span className="user-info">
            {user?.firstName} {user?.lastName} ({user?.role})
          </span>
          <button onClick={() => navigate('/dashboard')} className="btn-secondary">
            ← Back to Dashboard
          </button>
          <button onClick={handleLogout} className="btn-secondary">
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        {message && (
          <div className={message.includes('Error') || message.includes('Failed') ? 'error-message' : 'success-message'}>
            {message}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: 0 }}>Registered Enforcers</h2>
            <p style={{ color: '#666', margin: '5px 0 0 0' }}>
              Create and manage enforcer accounts
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className="btn-secondary"
              onClick={loadEnforcers}
              style={{ padding: '12px 24px', fontSize: '16px' }}
            >
              🔄 Refresh
            </button>
            <button 
              className="btn-primary"
              onClick={() => setShowEnforcerForm(true)}
              style={{ padding: '12px 24px', fontSize: '16px' }}
            >
              + Add New Enforcer
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p>Loading enforcers...</p>
          </div>
        ) : message.includes('Error') ? (
          <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#ffebee', borderRadius: '8px' }}>
            <p style={{ fontSize: '1.2rem', color: '#c62828' }}>{message}</p>
            <button className="btn-primary" onClick={loadEnforcers} style={{ marginTop: '15px' }}>
              Try Again
            </button>
          </div>
        ) : enforcers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
            <p style={{ fontSize: '1.2rem', color: '#666' }}>No enforcers registered yet.</p>
            <p style={{ color: '#999' }}>Click "Add New Enforcer" to create the first enforcer account.</p>
          </div>
        ) : (
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
            {enforcers.map(enforcer => (
              <div key={enforcer._id} className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>
                      {enforcer.firstName} {enforcer.lastName}
                    </h3>
                    <p style={{ margin: '5px 0', color: '#666' }}>
                      <strong>📧 Email:</strong> {enforcer.email}
                    </p>
                    <p style={{ margin: '5px 0', color: '#666' }}>
                      <strong>📱 Phone:</strong> {enforcer.phoneNumber}
                    </p>
                    <p style={{ margin: '10px 0 0 0' }}>
                      <span 
                        style={{ 
                          backgroundColor: enforcer.isActive !== false ? '#4CAF50' : '#f44336',
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '0.85rem',
                          fontWeight: '500'
                        }}
                      >
                        {enforcer.isActive !== false ? '✓ ACTIVE' : '✗ INACTIVE'}
                      </span>
                    </p>
                    {enforcer.createdAt && (
                      <p style={{ margin: '10px 0 0 0', fontSize: '0.85rem', color: '#999' }}>
                        Joined: {new Date(enforcer.createdAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <button
                    className={enforcer.isActive !== false ? 'btn-secondary' : 'btn-primary'}
                    onClick={() => handleToggleStatus(enforcer)}
                    style={{ padding: '8px 16px', fontSize: '14px' }}
                  >
                    {enforcer.isActive !== false ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#fff3e0', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#ff8c42' }}>📊 Summary</h3>
          <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
            <div>
              <strong style={{ fontSize: '24px', color: '#333' }}>{enforcers.length}</strong>
              <p style={{ margin: '5px 0 0 0', color: '#666' }}>Total Enforcers</p>
            </div>
            <div>
              <strong style={{ fontSize: '24px', color: '#4CAF50' }}>
                {enforcers.filter(e => e.isActive !== false).length}
              </strong>
              <p style={{ margin: '5px 0 0 0', color: '#666' }}>Active</p>
            </div>
            <div>
              <strong style={{ fontSize: '24px', color: '#f44336' }}>
                {enforcers.filter(e => e.isActive === false).length}
              </strong>
              <p style={{ margin: '5px 0 0 0', color: '#666' }}>Inactive</p>
            </div>
          </div>
        </div>
      </main>

      {/* Add Enforcer Modal */}
      {showEnforcerForm && (
        <div className="modal-overlay" onClick={() => setShowEnforcerForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>Add New Enforcer</h2>
              <button className="close-button" onClick={() => setShowEnforcerForm(false)}>×</button>
            </div>
            <form onSubmit={handleCreateEnforcer} style={{ padding: '20px' }}>
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  value={enforcerForm.firstName}
                  onChange={(e) => setEnforcerForm({...enforcerForm, firstName: e.target.value})}
                  required
                  placeholder="Enter first name"
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  value={enforcerForm.lastName}
                  onChange={(e) => setEnforcerForm({...enforcerForm, lastName: e.target.value})}
                  required
                  placeholder="Enter last name"
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={enforcerForm.email}
                  onChange={(e) => setEnforcerForm({...enforcerForm, email: e.target.value})}
                  required
                  placeholder="enforcer@example.com"
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={enforcerForm.phoneNumber}
                  onChange={(e) => setEnforcerForm({...enforcerForm, phoneNumber: e.target.value})}
                  required
                  placeholder="09xxxxxxxxx"
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={enforcerForm.password}
                  onChange={(e) => setEnforcerForm({...enforcerForm, password: e.target.value})}
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  Create Enforcer
                </button>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setShowEnforcerForm(false)} 
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnforcerManagement;
