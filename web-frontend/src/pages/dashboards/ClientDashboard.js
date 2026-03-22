import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { complaintsAPI } from '../../services/api';
import { FaWifi, FaComments, FaStar } from 'react-icons/fa';
import { MdWifiOff } from 'react-icons/md';
import PedicabIcon from '../../components/PedicabIcon';
import Sidebar from '../../components/Sidebar';
import { useToast, handleApiError } from '../../components/ErrorToast';
import { BARANGAYS } from '../../utils/locations';
import ComplaintChatbot from '../../components/ComplaintChatbot';
import AppReview from '../../components/AppReview';
import './Dashboard.css';

const ClientDashboard = () => {
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useToast();
  const [activeSection, setActiveSection] = useState('myComplaints');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [editingComplaintId, setEditingComplaintId] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState('synced');
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [formData, setFormData] = useState({
    franchiseNumber: '',
    description: '',
    category: 'overcharging',
    location: '',
    incidentDate: ''
  });
  const [suggestion, setSuggestion] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredBarangays, setFilteredBarangays] = useState([]);

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

  const loadComplaints = useCallback(async () => {
    try {
      const response = await complaintsAPI.getMyComplaints();
      const sortedComplaints = (response.data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setComplaints(sortedComplaints);
      setSyncStatus('synced');
    } catch (error) {
      console.error('Error loading complaints:', error);
      setSyncStatus('unable to sync');
      showError(handleApiError(error));
    }
  }, [showError]);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate 4-digit franchise number
    if (!/^\d{4}$/.test(formData.franchiseNumber)) {
      showError('Franchise number must be exactly 4 digits');
      return;
    }

    try {
      if (editingComplaintId) {
        await complaintsAPI.update(editingComplaintId, formData);
        showSuccess('Complaint updated successfully!');
        setEditingComplaintId(null);
      } else {
        await complaintsAPI.create(formData);
        showSuccess('Complaint submitted successfully!');
      }

      setFormData({
        franchiseNumber: '',
        description: '',
        category: 'overcharging',
        location: '',
        incidentDate: ''
      });
      setActiveSection('myComplaints');
      loadComplaints();
    } catch (error) {
      showError(handleApiError(error));
    }
  };

  const handleEditComplaint = (complaint) => {
    setFormData({
      franchiseNumber: complaint.franchiseNumber,
      description: complaint.description,
      category: complaint.category,
      location: complaint.location,
      incidentDate: complaint.incidentDate ? new Date(complaint.incidentDate).toISOString().split('T')[0] : ''
    });
    setEditingComplaintId(complaint._id);
    setSelectedComplaint(null);
    setActiveSection('newComplaint');
  };

  const handleDeleteComplaint = async (id) => {
    if (!window.confirm('Are you sure you want to delete this complaint? This action cannot be undone.')) {
      return;
    }

    try {
      await complaintsAPI.delete(id);
      showSuccess('Complaint deleted successfully');
      setSelectedComplaint(null);
      loadComplaints();
    } catch (error) {
      showError(handleApiError(error));
    }
  };

  const handleChatbotSubmit = async (chatbotFormData) => {
    try {
      await complaintsAPI.create(chatbotFormData);
      showSuccess('Complaint submitted successfully via assistant!');
      loadComplaints();
    } catch (error) {
      showError(handleApiError(error));
      throw error;
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLocationChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, location: value });

    const matches = value
      ? BARANGAYS.filter(b => b.toLowerCase().includes(value.toLowerCase()))
      : BARANGAYS;

    setFilteredBarangays(matches);
    setShowDropdown(true);

    if (value) {
      const match = BARANGAYS.find(b => b.toLowerCase().startsWith(value.toLowerCase()));
      if (match && value.toLowerCase() !== match.toLowerCase()) {
        const remaining = match.slice(value.length);
        setSuggestion(value + remaining);
      } else {
        setSuggestion('');
      }
    } else {
      setSuggestion('');
    }
  };

  const handleLocationKeyDown = (e) => {
    if (e.key === 'Tab' && suggestion) {
      e.preventDefault();
      setFormData({ ...formData, location: suggestion });
      setSuggestion('');
      setShowDropdown(false);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const selectBarangay = (barangay) => {
    setFormData({ ...formData, location: barangay });
    setSuggestion('');
    setFilteredBarangays([]);
    setShowDropdown(false);
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
      {/* Sidebar Navigation */}
      <Sidebar
        activeSection={activeSection}
        onSectionChange={(section) => {
          setActiveSection(section);
          if (section === 'newComplaint' && !editingComplaintId) {
            // Clear form if switching to new complaint tab manually (not via Edit)
            setFormData({
              franchiseNumber: '',
              description: '',
              category: 'overcharging',
              location: '',
              incidentDate: ''
            });
          }
          if (section !== 'newComplaint') {
            setEditingComplaintId(null); // Cancel edit if navigating away
          }
        }}
        userRole="client"
        isCollapsed={sidebarCollapsed}
        toggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

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
          <button
            onClick={() => setChatbotOpen(true)}
            className="btn-chatbot-header"
            title="Need help filing a complaint?"
          >
            <FaComments size={18} />
            <span>Assistant</span>
          </button>
          <button
            onClick={() => setReviewOpen(true)}
            className="btn-chatbot-header"
            title="Rate your experience"
            style={{ marginLeft: '10px' }}
          >
            <FaStar size={18} />
            <span>Review App</span>
          </button>
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

      <div className={`dashboard-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>

        {/* New Complaint Section */}
        {activeSection === 'newComplaint' && (
          <div className="complaint-form-card">
            <h3>{editingComplaintId ? 'Edit Complaint' : 'Submit New Complaint'}</h3>
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
                    <option value="sexual_harassment">Sexual Harassment</option>
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
                  <div className="autocomplete-wrapper">
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleLocationChange}
                      onFocus={() => {
                        setFilteredBarangays(formData.location ? BARANGAYS.filter(b => b.toLowerCase().includes(formData.location.toLowerCase())) : BARANGAYS);
                        setShowDropdown(true);
                      }}
                      onKeyDown={handleLocationKeyDown}
                      onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                      required
                      placeholder="Where did the incident occur?"
                      autoComplete="off"
                    />
                    {suggestion && formData.location && (
                      <div className="suggestion-ghost">
                        {suggestion}
                      </div>
                    )}
                    {showDropdown && filteredBarangays.length > 0 && (
                      <div className="autocomplete-dropdown">
                        {filteredBarangays.map((b, index) => (
                          <div
                            key={index}
                            className="autocomplete-item"
                            onClick={() => selectBarangay(b)}
                          >
                            {b}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn-submit-orange">
                  {editingComplaintId ? 'Update Complaint' : 'Submit Complaint'}
                </button>
                {editingComplaintId && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setEditingComplaintId(null);
                      setFormData({
                        franchiseNumber: '',
                        description: '',
                        category: 'overcharging',
                        location: '',
                        incidentDate: ''
                      });
                      setActiveSection('myComplaints');
                    }}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* My Complaints Section */}
        {activeSection === 'myComplaints' && (
          <div className="complaint-history-section">
            <h2>My Complaints</h2>
            {complaints.length === 0 ? (
              <div className="no-complaints">
                <p>No complaints submitted yet.</p>
                <button
                  onClick={() => setActiveSection('newComplaint')}
                  className="btn-primary"
                  style={{ marginTop: '1rem' }}
                >
                  + Submit Your First Complaint
                </button>
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
        )}

        {/* Profile Section */}
        {activeSection === 'profile' && (
          <div className="complaint-form-card">
            <h3>My Profile</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="detail-row">
                <strong>Name:</strong>
                <span>{user.firstName} {user.lastName}</span>
              </div>
              <div className="detail-row">
                <strong>Email:</strong>
                <span>{user.email}</span>
              </div>
              <div className="detail-row">
                <strong>Role:</strong>
                <span style={{ textTransform: 'capitalize' }}>{user.role}</span>
              </div>
              <div className="detail-row">
                <strong>Total Complaints:</strong>
                <span>{complaints.length}</span>
              </div>
            </div>

            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #eee' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#333' }}>Help Us Improve</h4>
              <p style={{ color: '#666', marginBottom: '1rem' }}>
                We value your feedback! Rate your experience with the app.
              </p>
              <button
                className="btn-rate-app"
                onClick={() => setReviewOpen(true)}
              >
                <FaStar /> Rate This App
              </button>
            </div>
          </div>
        )}

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

                {selectedComplaint.status === 'submitted' && (
                  <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                    <button
                      className="btn-secondary"
                      onClick={() => handleEditComplaint(selectedComplaint)}
                    >
                      Edit Complaint
                    </button>
                    <button
                      className="btn-danger-small"
                      onClick={() => handleDeleteComplaint(selectedComplaint._id)}
                      style={{ padding: '0.5rem 1rem', fontSize: '1rem' }}
                    >
                      Delete Complaint
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Complaint Chatbot Assistant */}
      <ComplaintChatbot
        isOpen={chatbotOpen}
        onClose={() => setChatbotOpen(false)}
        onSubmitComplaint={handleChatbotSubmit}
      />

      {/* App Review Modal */}
      <AppReview
        isOpen={reviewOpen}
        onClose={() => setReviewOpen(false)}
      />
    </div>
  );
};

export default ClientDashboard;

