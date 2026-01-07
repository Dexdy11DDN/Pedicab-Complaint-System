import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { complaintsAPI } from '../../services/api';
import { FaWifi } from 'react-icons/fa';
import { MdWifiOff } from 'react-icons/md';
import PedicabIcon from '../../components/PedicabIcon';
import './Dashboard.css';

const ClientDashboard = () => {
  const { user, logout } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState('synced');
  const [formData, setFormData] = useState({
    franchiseNumber: '',
    description: '',
    category: 'overcharging',
    location: '',
    incidentDate: ''
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus('synced');
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('unable to sync');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    try {
      const response = await complaintsAPI.getMyComplaints();
      setComplaints(response.data);
      setSyncStatus('synced');
    } catch (error) {
      console.error('Error loading complaints:', error);
      setSyncStatus('unable to sync');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate 4-digit franchise number
    if (!/^\d{4}$/.test(formData.franchiseNumber)) {
      setMessage('Franchise number must be exactly 4 digits');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      await complaintsAPI.create(formData);
      setMessage('Complaint submitted successfully!');
      setShowForm(false);
      setFormData({
        franchiseNumber: '',
        description: '',
        category: 'overcharging',
        location: '',
        incidentDate: ''
      });
      loadComplaints();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error submitting complaint');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getStatusColor = (status) => {
    const colors = {
      submitted: '#ffa500',
      under_review: '#ff8c42',
      investigating: '#ff7629',
      resolved: '#2e7d32',
      rejected: '#d32f2f'
    };
    return colors[status] || '#999';
  };

  const truncateText = (text, maxLength = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="streamlined-header">
        <div className="header-left">
          <div className="header-title-section">
            <PedicabIcon size={45} color="#ffffff" />
            <div className="title-text">
              <h1>Pedicab Complaint System</h1>
              <p className="welcome-text">Welcome, {user.firstName}</p>
            </div>
          </div>
        </div>
        <div className="header-right">
          <div className="connectivity-status">
            <span className="status-text">{isOnline ? 'Online' : 'Offline'}</span>
            <div className={`wifi-circle ${isOnline ? 'online' : 'offline'}`}>
              {isOnline ? (
                <FaWifi size={24} color="white" />
              ) : (
                <MdWifiOff size={24} color="white" />
              )}
            </div>
            <p className="sync-status">{syncStatus}</p>
          </div>
          <button onClick={logout} className="btn-logout-orange">Sign Out</button>
        </div>
      </div>

      <div className="dashboard-content">
        {/* New Complaint Button */}
        <div className="action-section">
          <button onClick={() => setShowForm(!showForm)} className="btn-new-complaint">
            {showForm ? '✕ Cancel' : '+ New Complaint'}
          </button>
        </div>

        {message && <div className="message-alert">{message}</div>}

        {/* Complaint Form */}
        {showForm && (
          <div className="complaint-form-card">
            <h3>Submit New Complaint</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Franchise Number (4 digits) *</label>
                  <input
                    type="text"
                    name="franchiseNumber"
                    value={formData.franchiseNumber}
                    onChange={handleChange}
                    required
                    maxLength="4"
                    placeholder="e.g., 1234"
                  />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select name="category" value={formData.category} onChange={handleChange}>
                    <option value="overcharging">Overcharging</option>
                    <option value="rude_behavior">Rude Behavior</option>
                    <option value="reckless_driving">Reckless Driving</option>
                    <option value="refusal_of_service">Refusal of Service</option>
                    <option value="vehicle_condition">Vehicle Condition</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Incident Date *</label>
                  <input
                    type="date"
                    name="incidentDate"
                    value={formData.incidentDate}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Location *</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                    placeholder="Where did the incident occur?"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows="4"
                  placeholder="Describe the incident in detail..."
                ></textarea>
              </div>

              <button type="submit" className="btn-submit-orange">Submit Complaint</button>
            </form>
          </div>
        )}

        {/* Compact Complaint History */}
        <div className="complaint-history-section">
          <h2>Complaint History</h2>
          {complaints.length === 0 ? (
            <div className="no-complaints">
              <p>No complaints submitted yet.</p>
            </div>
          ) : (
            <div className="complaint-table">
              <div className="table-header">
                <div className="col-franchise">Franchise</div>
                <div className="col-type">Type</div>
                <div className="col-status">Status</div>
                <div className="col-time">Submitted</div>
                <div className="col-comment">Comment</div>
              </div>
              {complaints.map(complaint => (
                <div 
                  key={complaint._id} 
                  className="table-row"
                  onClick={() => setSelectedComplaint(complaint)}
                >
                  <div className="col-franchise">{complaint.franchiseNumber}</div>
                  <div className="col-type">{complaint.category.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</div>
                  <div className="col-status">
                    <span 
                      className="compact-status-badge" 
                      style={{ backgroundColor: getStatusColor(complaint.status) }}
                    >
                      {complaint.status.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </span>
                  </div>
                  <div className="col-time">
                    {new Date(complaint.createdAt).toLocaleDateString()} {new Date(complaint.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="col-comment">{truncateText(complaint.description)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Complaint Detail Modal */}
        {selectedComplaint && (
          <div className="modal-overlay" onClick={() => setSelectedComplaint(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Complaint Details</h2>
                <button className="modal-close" onClick={() => setSelectedComplaint(null)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="detail-row">
                  <strong>Complaint Number:</strong>
                  <span>{selectedComplaint.complaintNumber}</span>
                </div>
                <div className="detail-row">
                  <strong>Franchise Number:</strong>
                  <span>{selectedComplaint.franchiseNumber}</span>
                </div>
                <div className="detail-row">
                  <strong>Category:</strong>
                  <span>{selectedComplaint.category.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</span>
                </div>
                <div className="detail-row">
                  <strong>Status:</strong>
                  <span 
                    className="compact-status-badge" 
                    style={{ backgroundColor: getStatusColor(selectedComplaint.status) }}
                  >
                    {selectedComplaint.status.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </span>
                </div>
                <div className="detail-row">
                  <strong>Incident Date:</strong>
                  <span>{new Date(selectedComplaint.incidentDate).toLocaleDateString()}</span>
                </div>
                <div className="detail-row">
                  <strong>Location:</strong>
                  <span>{selectedComplaint.location}</span>
                </div>
                <div className="detail-row">
                  <strong>Submitted:</strong>
                  <span>{new Date(selectedComplaint.createdAt).toLocaleString()}</span>
                </div>
                <div className="detail-full">
                  <strong>Description:</strong>
                  <p style={{ 
                    whiteSpace: 'pre-wrap', 
                    lineHeight: '1.6',
                    padding: '0.75rem',
                    backgroundColor: '#f9f9f9',
                    borderRadius: '4px',
                    margin: '0.5rem 0'
                  }}>
                    {selectedComplaint.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDashboard;
