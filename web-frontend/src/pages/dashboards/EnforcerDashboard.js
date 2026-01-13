import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { franchisesAPI, investigationsAPI, ticketsAPI } from '../../services/api';
import { FaWifi } from 'react-icons/fa';
import { MdWifiOff } from 'react-icons/md';
import PedicabIcon from '../../components/PedicabIcon';
import Sidebar from '../../components/Sidebar';
import { useToast } from '../../components/ErrorToast';
import { initDatabase } from '../../database/init';
import { searchFranchises as searchLocalFranchises, getFranchiseCount } from '../../database/franchises';
import { syncWithAPI, startAutoSync, stopAutoSync, exportToCSV, loadInitialData } from '../../database/sync';
import './Dashboard.css';

const EnforcerDashboard = () => {
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState('available');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [availableInvestigations, setAvailableInvestigations] = useState([]);
  const [myInvestigations, setMyInvestigations] = useState([]);
  const [myTickets, setMyTickets] = useState([]);
  const [franchises, setFranchises] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [dbInitialized, setDbInitialized] = useState(false);
  const [franchiseCount, setFranchiseCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncStatus, setSyncStatus] = useState('synced');
  const [selectedInvestigation, setSelectedInvestigation] = useState(null);
  const [expandedInvestigation, setExpandedInvestigation] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);


  // Violation categories - separated by Driver and Vehicle
  const violationCategories = {
    'Driver Violations': [
      'no_valid_license',
      'expired_drivers_license',
      'failure_to_bring_license',
      'no_mayors_permit_driver',
      'student_driver_not_accompanied',
      'reckless_driving',
      'disregarding_traffic_sign',
      'overcharging',
      'refusal_to_convey',
      'discourtesy_arrogance',
      'rude_behavior',
      'unauthorized_route',
      'no_fare_matrix',
      'operating_under_influence',
      'no_uniform_id',
      'driving_in_slippers_sleeveless'
    ],
    'Vehicle Violations': [
      'no_plate_number',
      'plate_improperly_displayed',
      'obstructed_plate',
      'no_plate_sticker',
      'no_registration_official_receipt',
      'expired_franchise',
      'expired_registration',
      'invalid_registration',
      'incomplete_or_cr',
      'illegal_parking',
      'parking_on_sidewalk',
      'parking_infront_driveway',
      'obstruction',
      'missing_headlights',
      'missing_taillights',
      'no_side_mirrors',
      'poor_vehicle_condition',
      'overloading',
      'excessive_noise',
      'no_seatbelt',
      'defective_brakes'
    ],
    'Others': [
      'other_violation'
    ]
  };

  // Flatten and create initial state
  const allViolationTypes = Object.values(violationCategories).flat();
  const initialViolations = {};
  allViolationTypes.forEach(type => {
    initialViolations[type] = { checked: false, notes: '', photos: [] };
  });

  const [ticketForm, setTicketForm] = useState({
    violations: initialViolations,
    additionalNotes: ''
  });

  useEffect(() => {
    const setupDatabase = async () => {
      try {
        await initDatabase();
        setDbInitialized(true);
        console.log('SQLite database initialized');

        // Check if database is empty (first run)
        const currentCount = getFranchiseCount();

        // Start auto-sync every 5 minutes
        const token = localStorage.getItem('token');
        if (token) {
          startAutoSync(token);

          // If database is empty, try to sync from API first, then load sample data as fallback
          if (currentCount === 0) {
            console.log('Empty database detected - attempting to sync from API...');
            const syncResult = await syncWithAPI(token);
            if (syncResult.success && syncResult.count > 0) {
              setLastSyncTime(syncResult.timestamp);
              setFranchiseCount(syncResult.count);
            } else {
              // If sync fails or returns no data, load sample data
              console.log('API sync returned no data - loading sample franchises...');
              const loadResult = await loadInitialData();
              if (loadResult.success) {
                setFranchiseCount(loadResult.count);
              }
            }
          } else {
            // Database has data, just do a regular sync
            const syncResult = await syncWithAPI(token);
            if (syncResult.success) {
              setLastSyncTime(syncResult.timestamp);
            }
          }
        } else if (currentCount === 0) {
          // No token and empty database - load sample data
          const loadResult = await loadInitialData();
          if (loadResult.success) {
            setFranchiseCount(loadResult.count);
          }
        }

        // Update franchise count
        const count = getFranchiseCount();
        setFranchiseCount(count);

        // Pre-load franchises for instant display when tab is clicked
        if (count > 0) {
          const results = searchLocalFranchises('');
          setFranchises(results);
          console.log(`Pre-loaded ${results.length} franchises for instant display`);
        }
      } catch (error) {
        console.error('Database setup failed:', error);
      }
    };

    setupDatabase();

    // Cleanup on unmount
    return () => {
      stopAutoSync();
    };
  }, []);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus('synced');
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadData = async () => {
    try {
      setSyncStatus('syncing...');
      if (activeTab === 'available') {
        const response = await investigationsAPI.getAll({ status: 'open' });
        const openOnly = (response.data.investigations || [])
          .filter(inv => inv.status === 'open')
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setAvailableInvestigations(openOnly);
      } else if (activeTab === 'myInvestigations' || activeTab === 'completedInvestigations') {
        const response = await investigationsAPI.getAll({ acceptedByMe: true });
        const allMyInvestigations = response.data.investigations || [];

        // Split into active and completed
        const active = allMyInvestigations
          .filter(inv => !['resolved', 'closed', 'cancelled', 'submitted', 'pending_approval', 'under_review', 'rejected', 'approved', 'completed'].includes(inv.status))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const completed = allMyInvestigations
          .filter(inv => ['resolved', 'closed', 'cancelled', 'submitted', 'pending_approval', 'under_review', 'rejected', 'approved', 'completed'].includes(inv.status))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setMyInvestigations(activeTab === 'myInvestigations' ? active : completed);
      } else if (activeTab === 'myTickets') {
        const response = await ticketsAPI.getAll();
        const tickets = (response.data.tickets || response.data)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setMyTickets(tickets);
      } else if (activeTab === 'franchises') {
        if (dbInitialized) {
          const results = searchLocalFranchises(searchTerm);
          setFranchises(results);
          const count = getFranchiseCount();
          setFranchiseCount(count);
        } else {
          const response = await franchisesAPI.getAll({ search: searchTerm });
          setFranchises(response.data.franchises);
        }
      }
      setSyncStatus('synced');
    } catch (error) {
      console.error('Error loading data:', error);
      setSyncStatus('error');
    }
  };

  const handleAcceptInvestigation = async (investigationId) => {
    try {
      await investigationsAPI.accept(investigationId);
      showSuccess('Investigation accepted successfully!');
      loadData();
    } catch (error) {
      console.error('Error accepting investigation:', error);
      showError('Failed to accept investigation');
    }
  };

  const handleSearchFranchises = () => {
    try {
      if (dbInitialized) {
        const results = searchLocalFranchises(searchTerm);
        setFranchises(results);
      } else {
        // Fallback to API
        searchFranchisesAPI();
      }
    } catch (error) {
      console.error('Error searching franchises:', error);
    }
  };

  const searchFranchisesAPI = async () => {
    try {
      const response = await franchisesAPI.getAll({ search: searchTerm });
      setFranchises(response.data.franchises);
    } catch (error) {
      console.error('Error searching franchises:', error);
    }
  };

  const handleSyncNow = async () => {
    try {
      setSyncStatus('syncing...');
      const token = localStorage.getItem('token');
      const result = await syncWithAPI(token);
      if (result.success) {
        showSuccess(`Synced ${result.count} franchises from server`);
        setLastSyncTime(result.timestamp);
        const count = getFranchiseCount();
        setFranchiseCount(count);
        // Refresh franchise list
        const results = searchLocalFranchises(searchTerm);
        setFranchises(results);
      } else {
        showError('Sync failed: ' + result.error);
      }
      setSyncStatus('synced');
    } catch (error) {
      console.error('Sync error:', error);
      showError('Sync failed');
      setSyncStatus('error');
    }
  };

  const handleExportCSV = () => {
    try {
      const success = exportToCSV(franchises);
      if (success) {
        showSuccess('Franchise data exported to CSV');
      } else {
        showError('Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      showError('Export failed');
    }
  };

  const handleViolationChange = (violationType, field, value) => {
    setTicketForm(prev => ({
      ...prev,
      violations: {
        ...prev.violations,
        [violationType]: {
          ...prev.violations[violationType],
          [field]: value
        }
      }
    }));
  };

  const handleFileUpload = (violationType, event) => {
    const files = Array.from(event.target.files);
    const fileReaders = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            file,
            preview: reader.result,
            name: file.name,
            size: file.size
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(fileReaders).then(newFiles => {
      setTicketForm(prev => ({
        ...prev,
        violations: {
          ...prev.violations,
          [violationType]: {
            ...prev.violations[violationType],
            photos: [...prev.violations[violationType].photos, ...newFiles]
          }
        }
      }));
    });
  };

  const removeEvidence = (violationType, photoIndex) => {
    setTicketForm(prev => ({
      ...prev,
      violations: {
        ...prev.violations,
        [violationType]: {
          ...prev.violations[violationType],
          photos: prev.violations[violationType].photos.filter((_, i) => i !== photoIndex)
        }
      }
    }));
  };

  const handleSubmitTicket = async (investigationId) => {
    try {
      console.log('Submitting ticket for investigation:', investigationId);

      const checkedViolations = Object.entries(ticketForm.violations)
        .filter(([_, data]) => data.checked)
        .map(([type, data]) => ({
          type: formatViolationType(type),
          notes: data.notes,
          photos: data.photos.map(photo => ({
            url: photo.preview,
            description: photo.name
          }))
        }));

      console.log('Checked violations:', checkedViolations);


      if (checkedViolations.length === 0) {
        showError('Please select at least one violation');
        return;
      }


      console.log('Submitting ticket data:', {
        investigationId,
        violations: checkedViolations,
        additionalNotes: ticketForm.additionalNotes
      });

      const response = await ticketsAPI.create({
        investigationId,
        violations: checkedViolations,
        additionalNotes: ticketForm.additionalNotes
      });

      console.log('Ticket submitted successfully:', response.data);

      showSuccess('Ticket submitted successfully!');
      setSelectedInvestigation(null);
      setTicketForm({
        violations: {
          'missing_headlights': { checked: false, notes: '', photos: [] },
          'illegal_parking': { checked: false, notes: '', photos: [] },
          'expired_registration': { checked: false, notes: '', photos: [] },
          'overloading': { checked: false, notes: '', photos: [] },
          'no_side_mirrors': { checked: false, notes: '', photos: [] },
          'missing_taillights': { checked: false, notes: '', photos: [] },
          'no_license_plate': { checked: false, notes: '', photos: [] },
          'reckless_driving': { checked: false, notes: '', photos: [] },
          'poor_vehicle_condition': { checked: false, notes: '', photos: [] },
          'excessive_noise': { checked: false, notes: '', photos: [] }
        },
        additionalNotes: ''
      });
      loadData();
    } catch (error) {
      console.error('Error submitting ticket:', error);
      console.error('Error response:', error.response?.data);
      showError(error.response?.data?.message || 'Failed to submit ticket');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      submitted: '#ffc107',
      under_review: '#2196f3',
      open: '#ff8c42',
      accepted: '#ff8c42',
      investigating: '#ff9800',
      resolved: '#4caf50',
      rejected: '#f44336',
      pending_approval: '#ff9800',
      approved: '#4caf50',
      in_progress: '#2196f3',
      completed: '#4caf50',
      active: '#4caf50'
    };
    return colors[status] || '#999';
  };

  const formatViolationType = (type) => {
    return type.replace(/_/g, ' ').split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="streamlined-header">
        <div className="header-left">
          <div className="header-title-section">
            <PedicabIcon size={45} color="#ffffff" />
            <div className="title-text">
              <h1>Enforcer Portal</h1>
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
          <button onClick={logout} className="btn-logout">Sign Out</button>
        </div>
      </div>

      <div className={`dashboard-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Sidebar Navigation */}
        <Sidebar
          activeSection={activeTab}
          onSectionChange={setActiveTab}
          userRole="enforcer"
          isCollapsed={sidebarCollapsed}
          toggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {activeTab === 'available' && (
          <div>
            <h2>Available Investigation Quests</h2>
            <div className="complaints-list">
              {availableInvestigations.map(investigation => {
                const isExpanded = expandedInvestigation === investigation._id;
                return (
                  <div
                    key={investigation._id}
                    className="card complaint-card quest-card"
                    onClick={() => setExpandedInvestigation(isExpanded ? null : investigation._id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="complaint-header">
                      <div>
                        <h3 style={{ marginBottom: '0.25rem' }}>{investigation.investigationNumber}</h3>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
                          Franchise: {investigation.franchiseNumber || investigation.complaint?.franchiseNumber} • {investigation.complaint?.category ? investigation.complaint.category.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Manual Investigation'}
                        </p>
                      </div>
                      <span
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(investigation.status) }}
                      >
                        {investigation.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                    {isExpanded && (
                      <div className="complaint-details" onClick={(e) => e.stopPropagation()}>
                        <p><strong>Complaint:</strong> {investigation.complaint?.complaintNumber}</p>
                        <p><strong>Location:</strong> {investigation.complaint?.location}</p>
                        <div className="description-section">
                          <p><strong>Complaint Description:</strong></p>
                          <p>{investigation.description}</p>
                        </div>
                        <div className="instructions-section">
                          <p><strong>Investigation Instructions:</strong></p>
                          <p>{investigation.instructions || `Conduct on-site investigation of franchise #${investigation.complaint?.franchiseNumber} and verify all reported issues.`}</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAcceptInvestigation(investigation._id);
                          }}
                          className="btn-primary"
                          style={{ marginTop: '0.75rem' }}
                        >
                          Accept Quest
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              {availableInvestigations.length === 0 && (
                <p className="empty-state">
                  No available investigations at this time.
                </p>
              )}
            </div>
          </div>
        )}

        {(activeTab === 'myInvestigations' || activeTab === 'completedInvestigations') && (
          <div>
            <h2>{activeTab === 'myInvestigations' ? 'My Active Investigations' : 'Completed Investigations'}</h2>
            <div className="investigations-list">
              {myInvestigations.map(investigation => {
                const isExpanded = expandedInvestigation === investigation._id;
                return (
                  <div
                    key={investigation._id}
                    className="card quest-card"
                    onClick={() => setExpandedInvestigation(isExpanded ? null : investigation._id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="complaint-header">
                      <div>
                        <h3 style={{ marginBottom: '0.25rem' }}>{investigation.investigationNumber}</h3>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
                          Franchise: {investigation.franchiseNumber || investigation.complaint?.franchiseNumber} • {investigation.complaint?.category ? investigation.complaint.category.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Manual Investigation'}
                        </p>
                      </div>
                      <span
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(investigation.status) }}
                      >
                        {investigation.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                    {isExpanded && (
                      <div className="investigation-details" onClick={(e) => e.stopPropagation()}>
                        <p><strong>Complaint:</strong> {investigation.complaint?.complaintNumber}</p>
                        <p><strong>Location:</strong> {investigation.complaint?.location}</p>
                        <div className="description-section">
                          <p><strong>Complaint Description:</strong></p>
                          <p>{investigation.description}</p>
                        </div>
                        <div className="instructions-section">
                          <p><strong>Investigation Instructions:</strong></p>
                          <p>{investigation.instructions || `Conduct on-site investigation of franchise #${investigation.complaint?.franchiseNumber} and verify all reported issues.`}</p>
                        </div>

                        {selectedInvestigation === investigation._id ? (
                          <div className="ticket-form" onClick={(e) => e.stopPropagation()}>
                            <h4>Submit Violation Ticket</h4>

                            <div>
                              <h5>Violations Checklist:</h5>
                              <div className="violations-list">
                                {Object.entries(violationCategories).map(([category, violations]) => (
                                  <div key={category} className="violation-category">
                                    <h6 className="violation-category-title">{category}</h6>
                                    {violations.map(violationType => (
                                      <div key={violationType} className="violation-item">
                                        <label className="violation-checkbox">
                                          <input
                                            type="checkbox"
                                            checked={ticketForm.violations[violationType]?.checked || false}
                                            onChange={(e) => handleViolationChange(violationType, 'checked', e.target.checked)}
                                          />
                                          <strong>{formatViolationType(violationType)}</strong>
                                        </label>
                                        {ticketForm.violations[violationType]?.checked && (
                                          <div className="violation-expanded">
                                            <textarea
                                              className="violation-notes"
                                              placeholder="Notes about this violation..."
                                              value={ticketForm.violations[violationType].notes}
                                              onChange={(e) => handleViolationChange(violationType, 'notes', e.target.value)}
                                              rows="2"
                                            />

                                            <div className="violation-photo-upload">
                                              <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                onChange={(e) => handleFileUpload(violationType, e)}
                                                className="file-input"
                                                id={`evidence-${violationType}`}
                                              />
                                              <label htmlFor={`evidence-${violationType}`} className="file-upload-btn-small">
                                                📷 Add Photos
                                              </label>
                                            </div>

                                            {ticketForm.violations[violationType].photos.length > 0 && (
                                              <div className="violation-photos-grid">
                                                {ticketForm.violations[violationType].photos.map((photo, photoIndex) => (
                                                  <div key={photoIndex} className="violation-photo-item">
                                                    <img src={photo.preview} alt={photo.name} />
                                                    <button
                                                      type="button"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeEvidence(violationType, photoIndex);
                                                      }}
                                                      className="remove-photo-btn"
                                                    >
                                                      ✕
                                                    </button>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="additional-notes-section">
                              <label>Additional Notes:</label>
                              <textarea
                                className="additional-notes-textarea"
                                value={ticketForm.additionalNotes}
                                onChange={(e) => setTicketForm(prev => ({ ...prev, additionalNotes: e.target.value }))}
                                placeholder="Any additional observations or notes..."
                                rows="3"
                              />
                            </div>

                            <div className="ticket-actions">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSubmitTicket(investigation._id);
                                }}
                                className="btn-primary"
                              >
                                Submit Ticket
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedInvestigation(null);
                                }}
                                className="btn-secondary"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedInvestigation(investigation._id);
                            }}
                            className="btn-primary"
                            style={{ marginTop: '1rem' }}
                          >
                            Create Violation Ticket
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {myInvestigations.length === 0 && (
                <p className="empty-state">
                  You have no active investigations. Accept one from the Available Investigations tab.
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'myTickets' && (
          <div>
            <h2>My Submitted Tickets</h2>
            <div className="complaints-list">
              {myTickets.length > 0 ? (
                <>
                  {myTickets.map(ticket => (
                    <div
                      key={ticket._id}
                      className="card complaint-card quest-card"
                      onClick={() => setSelectedTicket(ticket)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="complaint-header">
                        <div>
                          <h3 style={{ marginBottom: '0.25rem' }}>{ticket.ticketNumber}</h3>
                          <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
                            Franchise: {ticket.franchiseNumber} • {ticket.violations?.length || 0} Violations
                          </p>
                        </div>
                        <span
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(ticket.status) }}
                        >
                          {ticket.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: '#777' }}>
                        <p style={{ margin: '0.25rem 0' }}>
                          <strong>Investigation:</strong> {ticket.investigation?.investigationNumber || 'N/A'}
                        </p>
                        <p style={{ margin: '0.25rem 0' }}>
                          <strong>Submitted:</strong> {new Date(ticket.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <p className="empty-state">
                  You haven't submitted any tickets yet.
                </p>
              )}
            </div>

            {selectedTicket && (
              <div className="modal-overlay" onClick={() => setSelectedTicket(null)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h2>Ticket Details</h2>
                    <button className="modal-close" onClick={() => setSelectedTicket(null)}>×</button>
                  </div>
                  <div className="modal-body">
                    <div className="ticket-info">
                      <p><strong>Ticket Number:</strong> {selectedTicket.ticketNumber}</p>
                      <p><strong>Franchise Number:</strong> {selectedTicket.franchiseNumber}</p>
                      <p><strong>Investigation:</strong> {selectedTicket.investigation?.investigationNumber || 'N/A'}</p>
                      <p><strong>Status:</strong>
                        <span
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(selectedTicket.status), marginLeft: '0.5rem' }}
                        >
                          {selectedTicket.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </p>
                      <p><strong>Submitted:</strong> {new Date(selectedTicket.createdAt).toLocaleString()}</p>
                    </div>

                    <div className="violations-section">
                      <h3>Violations Reported</h3>
                      {selectedTicket.violations?.map((violation, index) => (
                        <div key={index} className="violation-detail" style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
                          <h4>{violation.type.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}</h4>
                          {violation.notes && <p>{violation.notes}</p>}
                          {violation.photos && violation.photos.length > 0 && (
                            <div style={{ marginTop: '10px' }}>
                              <strong style={{ fontSize: '0.9rem', color: '#666' }}>Evidence Photos ({violation.photos.length}):</strong>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '8px', marginTop: '8px' }}>
                                {violation.photos.map((photo, photoIndex) => (
                                  <div key={photoIndex}>
                                    <img
                                      src={photo.url}
                                      alt={`Evidence ${photoIndex + 1}`}
                                      style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '2px solid #ddd' }}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {selectedTicket.additionalNotes && (
                      <div className="notes-section">
                        <h3>Additional Notes</h3>
                        <p>{selectedTicket.additionalNotes}</p>
                      </div>
                    )}

                    {/* Legacy evidence support */}
                    {selectedTicket.evidence && selectedTicket.evidence.length > 0 && (
                      <div className="evidence-section">
                        <h3>Evidence Photos</h3>
                        <div className="evidence-grid">
                          {selectedTicket.evidence.map((photo, index) => (
                            <div key={index} className="evidence-item">
                              <img src={photo.url} alt={photo.description} />
                              <p>{photo.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'franchises' && (
          <div>
            <h2>Franchise Database (Offline Mode)</h2>
            <div className="database-info" style={{
              background: '#f4a261',
              padding: '10px',
              borderRadius: '5px',
              marginBottom: '15px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <strong>Local Database:</strong> {franchiseCount} franchises
                {lastSyncTime && (
                  <span style={{ marginLeft: '15px', fontSize: '0.9em' }}>
                    Last synced: {lastSyncTime.toLocaleTimeString()}
                  </span>
                )}
              </div>
              <div>
                <button
                  onClick={handleSyncNow}
                  className="btn-secondary"
                  style={{ marginRight: '10px', padding: '5px 15px' }}
                  disabled={!isOnline}
                >
                  🔄 Sync Now
                </button>
                <button
                  onClick={handleExportCSV}
                  className="btn-secondary"
                  style={{ padding: '5px 15px' }}
                >
                  📥 Export CSV
                </button>
              </div>
            </div>
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search by franchise number, owner name, or license..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchFranchises()}
              />
              <button onClick={handleSearchFranchises} className="btn-primary">Search</button>
            </div>
            <div className="franchises-list">
              {franchises.map(franchise => (
                <div key={franchise._id} className="card">
                  <h3>{franchise.franchiseNumber}</h3>
                  <div className="franchise-details">
                    <p><strong>Owner:</strong> {franchise.ownerName}</p>
                    <p><strong>License:</strong> {franchise.licenseNumber}</p>
                    <p><strong>Contact:</strong> {franchise.contactNumber}</p>
                    <p><strong>Address:</strong> {franchise.address}</p>
                    <p><strong>Vehicles:</strong> {franchise.vehicleCount}</p>
                    <p>
                      <strong>Status:</strong>{' '}
                      <span
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(franchise.status) }}
                      >
                        {franchise.status.charAt(0).toUpperCase() + franchise.status.slice(1)}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnforcerDashboard;
