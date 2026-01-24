import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { complaintsAPI, franchisesAPI, investigationsAPI, ticketsAPI, authAPI } from '../../services/api';
import { FaWifi } from 'react-icons/fa';
import { MdWifiOff } from 'react-icons/md';
import PedicabIcon from '../../components/PedicabIcon';
import Sidebar from '../../components/Sidebar';
import { useToast, handleApiError } from '../../components/ErrorToast';
import { initDatabase } from '../../database/init';
import { searchFranchises as searchLocalFranchises, getFranchiseCount } from '../../database/franchises';
import { syncWithAPI, startAutoSync, stopAutoSync, loadInitialData } from '../../database/sync';
import { groupViolationsByCategory, formatViolationType } from '../../utils/violations';
import './Dashboard.css';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [investigations, setInvestigations] = useState([]);
  const [franchises, setFranchises] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [enforcers, setEnforcers] = useState([]);
  const [message, setMessage] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState('synced');
  const [searchTerm, setSearchTerm] = useState('');
  const [offenseFilter, setOffenseFilter] = useState('all');
  const [dbInitialized, setDbInitialized] = useState(false);
  const [franchiseCount, setFranchiseCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedInvestigation, setSelectedInvestigation] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedFranchise, setSelectedFranchise] = useState(null);
  const [showInvestigationForm, setShowInvestigationForm] = useState(false);
  const [investigationForm, setInvestigationForm] = useState({ franchiseNumber: '', description: '', instructions: '', complaintId: '' });
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all'); // specific for complaints

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortedAndFilteredData = (data, type) => {
    let filtered = [...data];

    // Apply Status Filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(item => item.status === filterStatus);
    }

    // Apply Category Filter (only for complaints)
    if (type === 'complaints' && filterCategory !== 'all') {
      filtered = filtered.filter(item => item.category === filterCategory);
    }

    // Apply Sorting
    return filtered.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      // Handle nested properties (e.g., client.firstName)
      if (sortField.includes('.')) {
        const parts = sortField.split('.');
        valA = parts.reduce((obj, key) => obj && obj[key], a);
        valB = parts.reduce((obj, key) => obj && obj[key], b);
      }

      // Handle dates
      if (sortField === 'createdAt' || sortField === 'incidentDate') {
        valA = new Date(valA || 0).getTime();
        valB = new Date(valB || 0).getTime();
      }

      // Handle strings (case-insensitive)
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Reset filters when tab changes
  useEffect(() => {
    setFilterStatus('all');
    setFilterCategory('all');
    setSortField('createdAt');
    setSortOrder('desc');
  }, [activeTab]);

  useEffect(() => {
    const setupDatabase = async () => {
      try {
        await initDatabase();
        setDbInitialized(true);
        console.log('Admin: SQLite database initialized');

        // Check if database is empty (first run)
        const currentCount = getFranchiseCount();

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

        const count = getFranchiseCount();
        setFranchiseCount(count);

        // Pre-load franchises for instant display when tab is clicked
        if (count > 0) {
          const results = searchLocalFranchises('');
          setFranchises(results);
          console.log(`Pre-loaded ${results.length} franchises for instant display`);
        }
      } catch (error) {
        console.error('Admin: Database setup failed:', error);
      }
    };

    setupDatabase();

    return () => {
      stopAutoSync();
    };
  }, []);

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
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadData = async () => {
    try {
      if (activeTab === 'investigations') {
        const response = await investigationsAPI.getAll();
        setInvestigations(response.data.investigations || []);
      } else if (activeTab === 'franchises') {
        // Use local SQLite database for franchises
        if (dbInitialized) {
          const results = searchLocalFranchises('');
          setFranchises(results);
          const count = getFranchiseCount();
          setFranchiseCount(count);
        } else {
          // Fallback to API if database not initialized
          const response = await franchisesAPI.getAll();
          setFranchises(response.data.franchises || []);
        }
      } else if (activeTab === 'complaints') {
        const response = await complaintsAPI.getAll();
        console.log('Complaints response:', response.data);
        const sorted = (response.data.complaints || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setComplaints(sorted);
      } else if (activeTab === 'tickets') {
        const response = await ticketsAPI.getAll();
        const sorted = (response.data.tickets || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setTickets(sorted);
      } else if (activeTab === 'overview') {
        const [investigationsRes, complaintsRes, ticketsRes, enforcersRes] = await Promise.all([
          investigationsAPI.getAll(),
          complaintsAPI.getAll(),
          ticketsAPI.getAll(),
          authAPI.getEnforcers().catch(() => ({ data: { enforcers: [] } }))
        ]);
        console.log('Overview data loaded:', {
          investigations: investigationsRes.data.investigations?.length || 0,
          complaints: complaintsRes.data.complaints?.length || 0,
          tickets: ticketsRes.data.tickets?.length || 0
        });
        setInvestigations((investigationsRes.data.investigations || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        setComplaints((complaintsRes.data.complaints || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        setTickets((ticketsRes.data.tickets || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        setEnforcers(enforcersRes.data.enforcers || []);
      }
      setSyncStatus('synced');
    } catch (error) {
      console.error('Error loading data:', error);
      console.error('Error details:', error.response?.data || error.message);
      setSyncStatus('unable to sync');
      setMessage('Error loading data: ' + (error.response?.data?.message || error.message));
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const handleCreateInvestigationFromComplaint = async () => {
    if (!selectedComplaint) {
      console.error('No complaint selected');
      return;
    }

    console.log('Selected complaint:', selectedComplaint);

    if (selectedComplaint.status === 'submitted') {
      setMessage('Please accept the complaint first before creating an investigation');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    // Validate required fields
    if (!selectedComplaint.franchiseNumber) {
      setMessage('Complaint is missing franchise number');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    if (!selectedComplaint._id) {
      setMessage('Complaint ID is missing');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      const descriptionText = selectedComplaint.description || 'No description provided';
      const investigationData = {
        franchiseNumber: selectedComplaint.franchiseNumber,
        complaintId: selectedComplaint._id,
        description: descriptionText.length > 200 ? descriptionText.substring(0, 200) + '...\n\n(Full details available in linked complaint)' : descriptionText,
        instructions: `1. Locate and visit franchise #${selectedComplaint.franchiseNumber} at the reported location\n2. Document all violations using photos and the checklist\n3. Interview the operator if present\n4. Submit a detailed ticket with all findings and evidence`
      };

      console.log('Creating investigation with data:', investigationData);

      const response = await investigationsAPI.create(investigationData);
      console.log('Investigation created:', response.data);

      // Update complaint status to investigating
      await complaintsAPI.updateStatus(selectedComplaint._id, 'investigating');
      console.log('Complaint status updated to investigating');

      setMessage('Investigation request created successfully');
      setSelectedComplaint(null);
      loadData();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error creating investigation:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      console.error('Selected complaint:', selectedComplaint);

      const errorMessage = error.response?.data?.message || error.message || 'Error creating investigation';
      setMessage(errorMessage);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const handleCreateInvestigation = async (e) => {
    e.preventDefault();
    if (!investigationForm.franchiseNumber || !investigationForm.description || !investigationForm.instructions) {
      setMessage('Please fill in all required fields');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      await investigationsAPI.create(investigationForm);
      setMessage('Investigation request created successfully');
      setShowInvestigationForm(false);
      setInvestigationForm({ franchiseNumber: '', description: '', instructions: '', complaintId: '' });
      loadData();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error creating investigation');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDeleteInvestigation = async (id) => {
    if (!window.confirm('Are you sure you want to delete this investigation?')) return;

    try {
      await investigationsAPI.delete(id);
      setMessage('Investigation deleted successfully');
      loadData();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error deleting investigation');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleAcceptComplaint = async () => {
    try {
      await complaintsAPI.updateStatus(selectedComplaint._id, 'under_review');
      setMessage('Complaint accepted and under review');
      // Update the selected complaint locally
      setSelectedComplaint({ ...selectedComplaint, status: 'under_review' });
      loadData();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error accepting complaint');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleComplaintStatus = async (complaintId, newStatus) => {
    try {
      await complaintsAPI.updateStatus(complaintId, newStatus);
      setMessage(`Complaint ${newStatus === 'resolved' ? 'resolved' : 'closed'} successfully`);
      setSelectedComplaint(null);
      loadData();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error updating complaint status');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const truncateText = (text, maxLength = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getViolationSummary = (franchise) => {
    const summary = {};
    const confirmedOffenses = (franchise.offenses || []).filter(o => o.status === 'confirmed' || (o.status === 'pending' && o.confirmedAt));
    confirmedOffenses.forEach(offense => {
      offense.violations?.forEach(vType => {
        summary[vType] = (summary[vType] || 0) + 1;
      });
    });
    return Object.entries(summary).sort((a, b) => b[1] - a[1]);
  };

  const handleForwardTicket = async (ticketId) => {
    try {
      await ticketsAPI.forward(ticketId);
      setMessage('Ticket forwarded to higher ups successfully');
      setSelectedTicket(null);
      loadData();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error forwarding ticket');
      setTimeout(() => setMessage(''), 3000);
    }
  };



  const getStatusColor = (status) => {
    const colors = {
      submitted: '#ffa500',
      under_review: '#ff8c42',
      investigating: '#ff7629',
      resolved: '#2e7d32',
      rejected: '#d32f2f',
      pending_approval: '#ff8c42',
      approved: '#2e7d32',
      active: '#2e7d32',
      suspended: '#ff9800',
      revoked: '#d32f2f'
    };
    return colors[status] || '#999';
  };

  const handleSearchFranchises = () => {
    try {
      if (dbInitialized) {
        const results = searchLocalFranchises(searchTerm);
        setFranchises(results);
      } else {
        // Fallback to API
        loadData();
      }
    } catch (error) {
      console.error('Error searching franchises:', error);
      showError(handleApiError(error));
    }
  };

  const handleResetOffenses = async (franchiseNumber) => {
    if (!window.confirm(`Are you sure you want to reset all offenses for franchise ${franchiseNumber}?`)) return;

    try {
      const response = await franchisesAPI.resetOffenses(franchiseNumber);
      showSuccess(response.data.message);
      setSelectedFranchise(null);
      loadData();
    } catch (error) {
      console.error('Error resetting offenses:', error);
      showError(handleApiError(error));
    }
  };

  const handleSectionChange = (section) => {
    if (section === 'enforcers') {
      navigate('/enforcers');
    } else {
      setActiveTab(section);
    }
  };

  // Filter franchises by offense status
  const filteredFranchises = franchises.filter(f => {
    if (offenseFilter === 'all') return true;
    if (offenseFilter === 'threeStrikes') return f.hasThreeStrikes;
    if (offenseFilter === 'hasOffenses') return (f.offenseCount || 0) > 0;
    if (offenseFilter === 'clean') return (f.offenseCount || 0) === 0;
    return true;
  });

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="streamlined-header">
        <div className="header-left">
          <div className="header-title-section">
            <PedicabIcon size={45} color="#ffffff" />
            <div className="title-text">
              <h1>Admin Portal</h1>
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

      <div className={`dashboard-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Sidebar Navigation */}
        <Sidebar
          activeSection={activeTab}
          onSectionChange={handleSectionChange}
          userRole="admin"
          isCollapsed={sidebarCollapsed}
          toggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {message && <div className="success-message">{message}</div>}

        {activeTab === 'overview' && (
          <div>
            <h2>System Overview</h2>
            <div className="stats-grid">
              <div className="stat-card stat-card-orange">
                <h3>{complaints.length}</h3>
                <p>Total Complaints</p>
              </div>
              <div className="stat-card stat-card-orange">
                <h3>{complaints.filter(c => c.status === 'submitted').length}</h3>
                <p>Pending Review</p>
              </div>
              <div className="stat-card stat-card-orange">
                <h3>{investigations.filter(i => i.status === 'open').length}</h3>
                <p>Open Investigations</p>
              </div>
              <div className="stat-card stat-card-orange">
                <h3>{investigations.filter(i => i.status === 'accepted').length}</h3>
                <p>Active Investigations</p>
              </div>
              <div className="stat-card stat-card-orange">
                <h3>{tickets.filter(t => t.status === 'submitted').length}</h3>
                <p>Tickets Pending</p>
              </div>
              <div className="stat-card stat-card-orange">
                <h3>{complaints.filter(c => c.status === 'resolved').length}</h3>
                <p>Resolved Complaints</p>
              </div>
              <div className="stat-card stat-card-orange">
                <h3>{enforcers.length}</h3>
                <p>Registered Enforcers</p>
              </div>
            </div>

            <h3>Recent Complaints</h3>
            {complaints.length === 0 ? (
              <div className="no-complaints">
                <p>No complaints submitted yet.</p>
              </div>
            ) : (
              <div className="complaint-table">
                <div className="table-header table-header-compact">
                  <div className="col-complaint-id-compact">ID</div>
                  <div className="col-franchise">Franchise</div>
                  <div className="col-type">Type</div>
                  <div className="col-status">Status</div>
                  <div className="col-time">Submitted</div>
                </div>
                {complaints.slice(0, 5).map(complaint => (
                  <div
                    key={complaint._id}
                    className="table-row table-row-compact"
                    onClick={() => setSelectedComplaint(complaint)}
                  >
                    <div className="col-complaint-id-compact">{complaint.complaintNumber}</div>
                    <div className="col-franchise">{complaint.franchiseNumber}</div>
                    <div className="col-type">{complaint.category.replace('_', ' ')}</div>
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
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'complaints' && (
          <div>
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2>Manage Complaints</h2>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="status-filter-select"
                >
                  <option value="all">All Categories</option>
                  <option value="overcharging">Overcharging</option>
                  <option value="rude_behavior">Rude Behavior</option>
                  <option value="reckless_driving">Reckless Driving</option>
                  <option value="refusal_of_service">Refusal of Service</option>
                  <option value="vehicle_condition">Vehicle Condition</option>
                  <option value="sexual_harassment">Sexual Harassment</option>
                  <option value="other">Other</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="status-filter-select"
                >
                  <option value="all">All Statuses</option>
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under Review</option>
                  <option value="investigating">Investigating</option>
                  <option value="resolved">Resolved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            {complaints.length === 0 ? (
              <div className="no-complaints">
                <p>No complaints found.</p>
              </div>
            ) : (
              <div className="complaint-table">
                <div className="table-header">
                  <div className="col-complaint-id">ID</div>
                  <div className="col-franchise">Franchise</div>
                  <div
                    className="col-type sortable-header"
                    onClick={() => handleSort('category')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Type {sortField === 'category' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </div>
                  <div className="col-client">Client</div>
                  <div
                    className="col-status sortable-header"
                    onClick={() => handleSort('status')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Status {sortField === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </div>
                  <div
                    className="col-time sortable-header"
                    onClick={() => handleSort('createdAt')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Submitted {sortField === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </div>
                  <div className="col-comment">Description</div>
                </div>
                {getSortedAndFilteredData(complaints, 'complaints').map(complaint => (
                  <div
                    key={complaint._id}
                    className="table-row"
                    onClick={() => setSelectedComplaint(complaint)}
                  >
                    <div className="col-complaint-id">{complaint.complaintNumber}</div>
                    <div className="col-franchise">{complaint.franchiseNumber}</div>
                    <div className="col-type">{complaint.category.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</div>
                    <div className="col-client">{complaint.client?.firstName} {complaint.client?.lastName}</div>
                    <div className="col-status">
                      <span
                        className="compact-status-badge"
                        style={{ backgroundColor: getStatusColor(complaint.status) }}
                      >
                        {complaint.status.replace('_', ' ')}
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

        {activeTab === 'tickets' && (
          <div>
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2>Investigation Tickets</h2>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="status-filter-select"
              >
                <option value="all">All Statuses</option>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {tickets.length === 0 ? (
              <div className="no-complaints">
                <p>No tickets submitted yet.</p>
              </div>
            ) : (
              <div className="complaint-table">
                <div className="table-header">
                  <div className="col-ticket-id">Ticket ID</div>
                  <div className="col-franchise">Franchise</div>
                  <div className="col-enforcer">Enforcer</div>
                  <div className="col-violations">Violations</div>
                  <div
                    className="col-status sortable-header"
                    onClick={() => handleSort('status')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Status {sortField === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </div>
                  <div
                    className="col-time sortable-header"
                    onClick={() => handleSort('createdAt')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Submitted {sortField === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </div>
                </div>
                {getSortedAndFilteredData(tickets, 'tickets').map(ticket => (
                  <div
                    key={ticket._id}
                    className="table-row"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <div className="col-ticket-id">{ticket.ticketNumber}</div>
                    <div className="col-franchise">{ticket.franchiseNumber}</div>
                    <div className="col-enforcer">{ticket.enforcer?.firstName} {ticket.enforcer?.lastName}</div>
                    <div className="col-violations">{ticket.violations?.length || 0} violation(s)</div>
                    <div className="col-status">
                      <span
                        className="compact-status-badge"
                        style={{ backgroundColor: getStatusColor(ticket.status) }}
                      >
                        {ticket.status.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </span>
                    </div>
                    <div className="col-time">
                      {new Date(ticket.createdAt).toLocaleDateString()} {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'investigations' && (
          <div>
            <div className="section-header">
              <h2>Manage Investigations</h2>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="status-filter-select"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="accepted">Accepted</option>
                  <option value="completed">Completed</option>
                </select>
                <button
                  onClick={() => setShowInvestigationForm(!showInvestigationForm)}
                  className="btn-new-complaint"
                >
                  {showInvestigationForm ? 'Cancel' : 'Create Investigation'}
                </button>
              </div>
            </div>

            {showInvestigationForm && (
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h3>Create New Investigation Request</h3>
                <form onSubmit={handleCreateInvestigation}>
                  <div className="form-group">
                    <label>Franchise Number *</label>
                    <input
                      type="text"
                      value={investigationForm.franchiseNumber}
                      onChange={(e) => setInvestigationForm({ ...investigationForm, franchiseNumber: e.target.value })}
                      placeholder="Enter 4-digit franchise number"
                      maxLength="4"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Complaint ID (Optional)</label>
                    <input
                      type="text"
                      value={investigationForm.complaintId}
                      onChange={(e) => setInvestigationForm({ ...investigationForm, complaintId: e.target.value })}
                      placeholder="Related complaint ID (if any)"
                    />
                  </div>
                  <div className="form-group">
                    <label>Complaint Description *</label>
                    <textarea
                      value={investigationForm.description}
                      onChange={(e) => setInvestigationForm({ ...investigationForm, description: e.target.value })}
                      placeholder="Describe the complaint or issue details..."
                      rows="3"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Investigation Instructions *</label>
                    <textarea
                      value={investigationForm.instructions}
                      onChange={(e) => setInvestigationForm({ ...investigationForm, instructions: e.target.value })}
                      placeholder="Provide specific instructions for the enforcer (e.g., 'Conduct on-site inspection and verify all safety equipment...')"
                      rows="3"
                      required
                    />
                  </div>
                  <button type="submit" className="btn-submit-orange">Create Investigation Quest</button>
                </form>
              </div>
            )}

            <div className="table-container">
              {investigations.length === 0 ? (
                <p className="no-data">No investigations found</p>
              ) : (
                <>
                  <div className="table-header" style={{ gridTemplateColumns: '140px 100px 200px 150px 120px 80px' }}>
                    <div>Investigation #</div>
                    <div>Franchise</div>
                    <div>Description</div>
                    <div>Accepted By</div>
                    <div
                      onClick={() => handleSort('status')}
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      Status {sortField === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </div>
                    <div>Actions</div>
                  </div>
                  {getSortedAndFilteredData(investigations, 'investigations').map(inv => (
                    <div
                      key={inv._id}
                      className="table-row"
                      style={{ gridTemplateColumns: '140px 100px 200px 150px 120px 80px', cursor: 'pointer' }}
                      onClick={() => setSelectedInvestigation(inv)}
                    >
                      <div className="col-complaint-id">
                        {inv.investigationNumber}
                        {inv.complaint && <span style={{ marginLeft: '0.3rem', fontSize: '0.85rem' }} title={`Linked to complaint ${inv.complaint.complaintNumber}`}>📋</span>}
                      </div>
                      <div className="col-franchise">{inv.franchiseNumber}</div>
                      <div>
                        {truncateText(inv.description, 35)}
                      </div>
                      <div>
                        {inv.acceptedBy ?
                          `${inv.acceptedBy.firstName} ${inv.acceptedBy.lastName}` :
                          <span style={{ color: '#999', fontStyle: 'italic' }}>Not accepted yet</span>
                        }
                      </div>
                      <div className="col-status">
                        <span
                          className="compact-status-badge"
                          style={{ backgroundColor: getStatusColor(inv.status) }}
                        >
                          {inv.status}
                        </span>
                      </div>
                      <div>
                        {inv.status === 'open' && (
                          <button
                            onClick={() => handleDeleteInvestigation(inv._id)}
                            className="btn-danger-small"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
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
                  onClick={async () => {
                    try {
                      setSyncStatus('syncing...');
                      const token = localStorage.getItem('token');
                      const result = await syncWithAPI(token);
                      if (result.success) {
                        showSuccess(`Synced ${result.count} franchises from server`);
                        setLastSyncTime(result.timestamp);
                        const count = getFranchiseCount();
                        setFranchiseCount(count);
                        const results = searchLocalFranchises('');
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
                  }}
                  className="btn-secondary"
                  style={{ padding: '5px 15px' }}
                  disabled={!isOnline}
                >
                  🔄 Sync Now
                </button>
              </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="search-bar" style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <input
                type="text"
                placeholder="Search by franchise number, owner name, or license..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchFranchises()}
                style={{ flex: 1 }}
              />
              <select
                value={offenseFilter}
                onChange={(e) => setOffenseFilter(e.target.value)}
                className="offense-filter-select"
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
              >
                <option value="all">All Franchises</option>
                <option value="threeStrikes">⚠️ 3 Strikes Only</option>
                <option value="hasOffenses">Has Offenses</option>
                <option value="clean">Clean Record</option>
              </select>
              <button onClick={handleSearchFranchises} className="btn-primary">Search</button>
            </div>

            {/* Franchise Cards */}
            <div className="franchises-list">
              {filteredFranchises.map(franchise => (
                <div
                  key={franchise._id}
                  className={`card franchise-card ${franchise.hasThreeStrikes ? 'three-strikes' : ''} ${(franchise.offenseCount || 0) > 0 && !franchise.hasThreeStrikes ? 'has-offenses' : ''}`}
                  onClick={() => setSelectedFranchise(franchise)}
                  style={{
                    cursor: 'pointer',
                    borderLeft: franchise.hasThreeStrikes ? '4px solid #d32f2f' : (franchise.offenseCount || 0) > 0 ? '4px solid #ff9800' : '4px solid #4caf50'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>{franchise.franchiseNumber}</h3>
                    {(franchise.offenseCount || 0) > 0 && (
                      <span
                        className="offense-badge"
                        style={{
                          background: franchise.hasThreeStrikes ? '#d32f2f' : '#ff9800',
                          color: 'white',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: 'bold'
                        }}
                      >
                        {franchise.hasThreeStrikes ? '⚠️ 3 STRIKES' : `${franchise.offenseCount} offense(s)`}
                      </span>
                    )}
                  </div>
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
                        {franchise.status.toUpperCase()}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
              {filteredFranchises.length === 0 && (
                <p className="empty-state">No franchises match the current filter.</p>
              )}
            </div>
          </div>
        )}

        {/* Franchise Offense History Modal */}
        {selectedFranchise && (
          <div className="modal-overlay" onClick={() => setSelectedFranchise(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
              <div className="modal-header">
                <h2>Franchise #{selectedFranchise.franchiseNumber}</h2>
                <button className="modal-close" onClick={() => setSelectedFranchise(null)}>✕</button>
              </div>
              <div className="modal-body">
                <div style={{ marginBottom: '1rem' }}>
                  <p><strong>Owner:</strong> {selectedFranchise.ownerName}</p>
                  <p><strong>License:</strong> {selectedFranchise.licenseNumber}</p>
                  <p><strong>Contact:</strong> {selectedFranchise.contactNumber}</p>
                </div>

                <div style={{
                  background: selectedFranchise.hasThreeStrikes ? '#ffebee' : '#fff3e0',
                  padding: '1rem',
                  borderRadius: '8px',
                  marginBottom: '1rem'
                }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: selectedFranchise.hasThreeStrikes ? '#d32f2f' : '#ff9800' }}>
                    {selectedFranchise.hasThreeStrikes ? '⚠️ 3 STRIKES - REPETITIVE VIOLATIONS' : `Offense History (${selectedFranchise.offenseCount || 0})`}
                  </h3>

                  {getViolationSummary(selectedFranchise).length > 0 && (
                    <details style={{ marginBottom: '1rem', cursor: 'pointer' }}>
                      <summary style={{ fontWeight: 'bold', color: '#666', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                        📊 Violation Breakdown (Click to View)
                      </summary>
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.5)',
                        padding: '0.75rem',
                        borderRadius: '6px',
                        display: 'grid',
                        gap: '0.5rem'
                      }}>
                        {getViolationSummary(selectedFranchise).map(([type, count]) => (
                          <div key={type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                            <span style={{ color: '#444' }}>{formatViolationType(type)}</span>
                            <span style={{
                              background: count >= 3 ? '#d32f2f' : '#ff8c42',
                              color: 'white',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              fontWeight: 'bold',
                              fontSize: '0.75rem'
                            }}>
                              {count} {count >= 3 ? 'strikes' : 'counts'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}

                  {(selectedFranchise.offenses && selectedFranchise.offenses.length > 0) ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {selectedFranchise.offenses.map((offense, idx) => (
                        <div key={idx} style={{
                          background: 'white',
                          padding: '0.75rem',
                          borderRadius: '6px',
                          borderLeft: '3px solid #ff8c42'
                        }}>
                          <p style={{ margin: '0 0 0.25rem 0', fontWeight: 'bold' }}>
                            📋 {offense.ticketNumber || 'Unknown Ticket'}
                          </p>
                          <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', color: '#666' }}>
                            {new Date(offense.confirmedAt).toLocaleDateString()}
                          </p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                            {offense.violations?.map((v, vIdx) => (
                              <span key={vIdx} style={{
                                background: '#ffe0b2',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.8rem'
                              }}>
                                {v}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ margin: 0, color: '#666' }}>No offense records found.</p>
                  )}
                </div>

                {(selectedFranchise.offenseCount || 0) > 0 && (
                  <button
                    onClick={() => handleResetOffenses(selectedFranchise.franchiseNumber)}
                    className="btn-danger-orange"
                    style={{ width: '100%' }}
                  >
                    🗑️ Reset All Offenses (Testing)
                  </button>
                )}
              </div>
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
                  <strong>Client:</strong>
                  <span>{selectedComplaint.client?.firstName} {selectedComplaint.client?.lastName}</span>
                </div>
                <div className="detail-row">
                  <strong>Email:</strong>
                  <span>{selectedComplaint.client?.email}</span>
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
                  <div className="modal-actions">
                    <button
                      onClick={handleAcceptComplaint}
                      className="btn-success-orange"
                      style={{ flex: 1 }}
                    >
                      ✓ Accept Complaint
                    </button>
                    <button
                      onClick={() => handleComplaintStatus(selectedComplaint._id, 'rejected')}
                      className="btn-danger-orange"
                      style={{ flex: 1 }}
                    >
                      ✕ Reject
                    </button>
                  </div>
                )}

                {(selectedComplaint.status === 'under_review' || selectedComplaint.status === 'investigating') && (
                  <div className="modal-actions">
                    <button
                      onClick={handleCreateInvestigationFromComplaint}
                      className="btn-submit-orange"
                      style={{ flex: 1 }}
                      disabled={selectedComplaint.status === 'investigating'}
                    >
                      {selectedComplaint.status === 'investigating' ? '✓ Investigation In Progress' : '🔍 Create Investigation Request'}
                    </button>
                  </div>
                )}

                {selectedComplaint.status !== 'resolved' && selectedComplaint.status !== 'rejected' && selectedComplaint.status !== 'submitted' && (
                  <div className="modal-actions" style={{ marginTop: '0.5rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                    <button
                      onClick={() => handleComplaintStatus(selectedComplaint._id, 'resolved')}
                      className="btn-success-orange"
                    >
                      Mark as Resolved
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Ticket Detail Modal */}
        {selectedTicket && (
          <div className="modal-overlay" onClick={() => setSelectedTicket(null)}>
            <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Ticket Details</h2>
                <button className="modal-close" onClick={() => setSelectedTicket(null)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="detail-row">
                  <strong>Ticket Number:</strong>
                  <span>{selectedTicket.ticketNumber}</span>
                </div>
                <div className="detail-row">
                  <strong>Investigation:</strong>
                  <span>{selectedTicket.investigation?.investigationNumber}</span>
                </div>
                <div className="detail-row">
                  <strong>Complaint:</strong>
                  <span>{selectedTicket.complaint?.complaintNumber}</span>
                </div>
                <div className="detail-row">
                  <strong>Franchise Number:</strong>
                  <span>{selectedTicket.franchiseNumber}</span>
                </div>
                <div className="detail-row">
                  <strong>Enforcer:</strong>
                  <span>{selectedTicket.enforcer?.firstName} {selectedTicket.enforcer?.lastName} ({selectedTicket.enforcer?.email})</span>
                </div>
                <div className="detail-row">
                  <strong>Status:</strong>
                  <span
                    className="compact-status-badge"
                    style={{ backgroundColor: getStatusColor(selectedTicket.status) }}
                  >
                    {selectedTicket.status.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </span>
                </div>
                <div className="detail-row">
                  <strong>Submitted:</strong>
                  <span>{new Date(selectedTicket.createdAt).toLocaleString()}</span>
                </div>

                {selectedTicket.violations && selectedTicket.violations.length > 0 && (
                  <div className="detail-section">
                    <strong>Violations Found ({selectedTicket.violations.length}):</strong>
                    <div className="violations-list">
                      {Object.entries(groupViolationsByCategory(selectedTicket.violations)).map(([category, violations]) => (
                        <div key={category} className="violation-category">
                          <h6 className="violation-category-title">{category}</h6>
                          {violations.map((violation, index) => (
                            <div key={index} className="violation-item" style={{ marginBottom: '15px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
                              <div className="violation-header">
                                <span className="violation-type">✓ {formatViolationType(violation.type)}</span>
                              </div>
                              {violation.notes && (
                                <p className="violation-description">{violation.notes}</p>
                              )}
                              {violation.photos && violation.photos.length > 0 && (
                                <div style={{ marginTop: '10px' }}>
                                  <strong style={{ fontSize: '0.9rem', color: '#666' }}>Evidence Photos ({violation.photos.length}):</strong>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '8px', marginTop: '8px' }}>
                                    {violation.photos.map((photo, photoIndex) => (
                                      <div key={photoIndex} style={{ textAlign: 'center' }}>
                                        <img
                                          src={photo.url}
                                          alt={`${violation.type} evidence ${photoIndex + 1}`}
                                          style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px', cursor: 'pointer', border: '2px solid #ddd' }}
                                          onClick={() => setSelectedImage(photo.url)}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTicket.additionalNotes && (
                  <div className="detail-full">
                    <strong>Additional Notes from Enforcer:</strong>
                    <p>{selectedTicket.additionalNotes}</p>
                  </div>
                )}

                {/* Legacy evidence support - will be removed once all tickets use violation photos */}
                {selectedTicket.evidence && selectedTicket.evidence.length > 0 && (
                  <div className="detail-section">
                    <strong>Evidence Photos ({selectedTicket.evidence.length}):</strong>
                    <div className="evidence-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px', marginTop: '10px' }}>
                      {selectedTicket.evidence.map((item, index) => (
                        <div key={index} style={{ textAlign: 'center' }}>
                          <img
                            src={item.url}
                            alt={`Evidence ${index + 1}`}
                            style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer', border: '2px solid #ddd' }}
                            onClick={() => setSelectedImage(item.url)}
                          />
                          <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
                            Photo {index + 1}
                          </small>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTicket.notes && (
                  <div className="detail-full">
                    <strong>Admin Notes:</strong>
                    <p>{selectedTicket.notes}</p>
                  </div>
                )}

                {selectedTicket.forwardedBy && (
                  <div className="detail-row">
                    <strong>Forwarded By:</strong>
                    <span>{selectedTicket.forwardedBy?.firstName} {selectedTicket.forwardedBy?.lastName} on {new Date(selectedTicket.forwardedDate).toLocaleString()}</span>
                  </div>
                )}

                {selectedTicket.status === 'submitted' && (
                  <div className="modal-actions">
                    <button
                      onClick={() => handleForwardTicket(selectedTicket._id)}
                      className="btn-submit-orange"
                    >
                      Forward to Higher Ups
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Investigation Detail Modal */}
        {selectedInvestigation && (
          <div className="modal-overlay" onClick={() => setSelectedInvestigation(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Investigation Details</h2>
                <button className="modal-close" onClick={() => setSelectedInvestigation(null)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="detail-row">
                  <strong>Investigation Number:</strong>
                  <span>{selectedInvestigation.investigationNumber}</span>
                </div>
                <div className="detail-row">
                  <strong>Franchise Number:</strong>
                  <span>{selectedInvestigation.franchiseNumber}</span>
                </div>
                {selectedInvestigation.complaint && (
                  <>
                    <div className="detail-row">
                      <strong>Linked Complaint:</strong>
                      <span>{selectedInvestigation.complaint.complaintNumber}</span>
                    </div>
                    <div className="detail-row">
                      <strong>Complaint Category:</strong>
                      <span>{selectedInvestigation.complaint.category?.replace('_', ' ')}</span>
                    </div>
                    <div className="detail-row">
                      <strong>Location:</strong>
                      <span>{selectedInvestigation.complaint.location}</span>
                    </div>
                  </>
                )}
                <div className="detail-row">
                  <strong>Requested By:</strong>
                  <span>{selectedInvestigation.requestedBy?.firstName} {selectedInvestigation.requestedBy?.lastName}</span>
                </div>
                <div className="detail-row">
                  <strong>Status:</strong>
                  <span
                    className="compact-status-badge"
                    style={{ backgroundColor: getStatusColor(selectedInvestigation.status) }}
                  >
                    {selectedInvestigation.status}
                  </span>
                </div>
                {selectedInvestigation.acceptedBy && (
                  <>
                    <div className="detail-row">
                      <strong>Accepted By:</strong>
                      <span>{selectedInvestigation.acceptedBy.firstName} {selectedInvestigation.acceptedBy.lastName}</span>
                    </div>
                    <div className="detail-row">
                      <strong>Accepted Date:</strong>
                      <span>{new Date(selectedInvestigation.acceptedDate).toLocaleString()}</span>
                    </div>
                  </>
                )}
                {selectedInvestigation.completionDate && (
                  <div className="detail-row">
                    <strong>Completion Date:</strong>
                    <span>{new Date(selectedInvestigation.completionDate).toLocaleString()}</span>
                  </div>
                )}
                <div className="detail-row">
                  <strong>Created:</strong>
                  <span>{new Date(selectedInvestigation.createdAt).toLocaleString()}</span>
                </div>

                <div className="detail-full">
                  <strong>Complaint Description:</strong>
                  <p style={{
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.6',
                    padding: '0.75rem',
                    backgroundColor: '#f9f9f9',
                    borderRadius: '4px',
                    margin: '0.5rem 0'
                  }}>
                    {selectedInvestigation.description}
                  </p>
                </div>

                {selectedInvestigation.instructions && (
                  <div className="detail-full">
                    <strong>Investigation Instructions:</strong>
                    <p style={{
                      whiteSpace: 'pre-wrap',
                      lineHeight: '1.6',
                      padding: '0.75rem',
                      backgroundColor: '#fff3e0',
                      borderRadius: '4px',
                      margin: '0.5rem 0',
                      borderLeft: '3px solid #ff8c42'
                    }}>
                      {selectedInvestigation.instructions}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Image Viewer Modal */}
        {selectedImage && (
          <div className="modal-overlay" onClick={() => setSelectedImage(null)}>
            <div className="modal-content" style={{ maxWidth: '90%', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Evidence Photo</h2>
                <button className="close-button" onClick={() => setSelectedImage(null)}>×</button>
              </div>
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <img
                  src={selectedImage}
                  alt="Evidence"
                  style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
