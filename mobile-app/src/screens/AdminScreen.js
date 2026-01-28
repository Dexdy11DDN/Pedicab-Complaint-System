import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  Image,
  RefreshControl,
  Dimensions
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { complaintsAPI, investigationsAPI, ticketsAPI } from '../services/api';
import { initDatabase } from '../database/init';
import { searchFranchises, getFranchiseCount } from '../database/franchises';
import { syncWithAPI, loadInitialData } from '../database/sync';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { BARANGAYS } from '../utils/locations';

const AdminScreen = ({ navigation }) => {
  const { user } = useAuth();

  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [complaints, setComplaints] = useState([]);
  const [investigations, setInvestigations] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [franchises, setFranchises] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ complaints: 0, investigations: 0, tickets: 0, franchises: 0 });

  // Database states
  const [dbInitialized, setDbInitialized] = useState(false);
  const [franchiseCount, setFranchiseCount] = useState(0);
  const [syncStatus, setSyncStatus] = useState('synced');
  const [filterLocation, setFilterLocation] = useState('all');

  // UI states
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [selectedInvestigation, setSelectedInvestigation] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showManualInvForm, setShowManualInvForm] = useState(false);
  const [showForwardForm, setShowForwardForm] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

  // Manual investigation form
  const [manualInvForm, setManualInvForm] = useState({
    franchiseNumber: '',
    description: '',
    instructions: ''
  });

  // Forward ticket form
  const [forwardNotes, setForwardNotes] = useState('');

  useEffect(() => {
    setupDatabase();
    loadData();
    updateOrientation();
    const subscription = Dimensions.addEventListener('change', updateOrientation);
    return () => subscription?.remove();
  }, []);

  const updateOrientation = () => {
    const { width, height } = Dimensions.get('window');
    setIsLandscape(width > height);
  };

  useEffect(() => {
    if (activeTab !== 'franchises') {
      loadData();
    }
  }, [activeTab, filterLocation]);

  const setupDatabase = async () => {
    try {
      await initDatabase();
      const count = await getFranchiseCount();
      setFranchiseCount(count);

      if (count === 0) {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          setSyncStatus('syncing...');
          const syncResult = await syncWithAPI(token);

          if (syncResult.success && syncResult.count > 0) {
            setFranchiseCount(syncResult.count);
            setSyncStatus('synced');
          } else {
            const loadResult = await loadInitialData();
            if (loadResult.success) {
              setFranchiseCount(loadResult.count);
              setSyncStatus('synced');
            }
          }
        } else {
          const loadResult = await loadInitialData();
          if (loadResult.success) setFranchiseCount(loadResult.count);
        }
      }

      const allFranchises = await searchFranchises('');
      setFranchises(allFranchises);
      setDbInitialized(true);
    } catch (error) {
      console.error('Database setup failed:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview' || activeTab === 'complaints') {
        const compResponse = await complaintsAPI.getAll();
        let comps = compResponse.data || [];

        if (filterLocation !== 'all') {
          comps = comps.filter(item => {
            const loc = item.location;
            if (filterLocation === 'other') {
              return loc && !BARANGAYS.includes(loc);
            }
            return loc === filterLocation;
          });
        }

        setComplaints(comps);
        setStats(prev => ({ ...prev, complaints: compResponse.data.length }));
      }

      if (activeTab === 'overview' || activeTab === 'investigations') {
        const invResponse = await investigationsAPI.getAll();
        let invs = invResponse.data || [];

        if (filterLocation !== 'all') {
          invs = invs.filter(item => {
            const loc = item.complaint?.location || item.location;
            if (filterLocation === 'other') {
              return loc && !BARANGAYS.includes(loc);
            }
            return loc === filterLocation;
          });
        }

        setInvestigations(invs);
        setStats(prev => ({ ...prev, investigations: invResponse.data.length }));
      }

      if (activeTab === 'overview' || activeTab === 'tickets') {
        const ticketResponse = await ticketsAPI.getAll();
        let tickets = ticketResponse.data || [];

        if (filterLocation !== 'all') {
          tickets = tickets.filter(item => {
            const loc = item.investigation?.complaint?.location || item.complaint?.location;
            if (filterLocation === 'other') {
              return loc && !BARANGAYS.includes(loc);
            }
            return loc === filterLocation;
          });
        }

        setTickets(tickets);
        setStats(prev => ({ ...prev, tickets: ticketResponse.data.length }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAcceptComplaint = async (complaintId) => {
    try {
      await complaintsAPI.updateStatus(complaintId, 'under_review');
      Alert.alert('Success', 'Complaint accepted');
      loadData();
      setSelectedComplaint(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to accept complaint');
    }
  };

  const handleRejectComplaint = async (complaintId) => {
    try {
      await complaintsAPI.updateStatus(complaintId, 'rejected');
      Alert.alert('Success', 'Complaint rejected');
      loadData();
      setSelectedComplaint(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to reject complaint');
    }
  };

  const handleCreateInvestigation = async (complaint) => {
    try {
      await investigationsAPI.create({
        franchiseNumber: complaint.franchiseNumber,
        complaintId: complaint._id,
        description: `Investigation for complaint ${complaint.complaintNumber}`,
        instructions: `1. Visit franchise location\n2. Verify complaint details\n3. Document evidence\n4. Submit ticket with findings`
      });

      Alert.alert('Success', 'Investigation created successfully');
      loadData();
      setSelectedComplaint(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to create investigation');
    }
  };

  const handleCreateManualInvestigation = async () => {
    if (!manualInvForm.franchiseNumber || !manualInvForm.description) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    try {
      await investigationsAPI.create({
        franchiseNumber: manualInvForm.franchiseNumber,
        description: manualInvForm.description,
        instructions: manualInvForm.instructions || 'Conduct thorough investigation.'
      });

      Alert.alert('Success', 'Manual investigation created');
      setManualInvForm({ franchiseNumber: '', description: '', instructions: '' });
      setShowManualInvForm(false);
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to create investigation');
    }
  };

  const handleDeleteInvestigation = async (investigationId) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this investigation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await investigationsAPI.delete(investigationId);
              Alert.alert('Success', 'Investigation deleted');
              loadData();
              setSelectedInvestigation(null);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete investigation');
            }
          }
        }
      ]
    );
  };

  const handleForwardTicket = async () => {
    if (!selectedTicket) return;

    try {
      await ticketsAPI.forward(selectedTicket._id, forwardNotes);
      Alert.alert('Success', 'Ticket forwarded to higher authorities');
      setShowForwardForm(false);
      setForwardNotes('');
      setSelectedTicket(null);
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to forward ticket');
    }
  };

  const handleSearchFranchises = async () => {
    if (!dbInitialized) {
      Alert.alert('Please Wait', 'Database is still initializing...');
      return;
    }
    try {
      const results = await searchFranchises(searchTerm);
      setFranchises(results);
    } catch (error) {
      Alert.alert('Error', 'Failed to search franchises');
    }
  };

  const handleSyncFranchises = async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      Alert.alert('Error', 'Not authenticated');
      return;
    }

    setSyncStatus('syncing...');
    const result = await syncWithAPI(token);

    if (result.success) {
      setFranchiseCount(result.count);
      setSyncStatus('synced');
      const allFranchises = await searchFranchises(searchTerm);
      setFranchises(allFranchises);
      Alert.alert('Success', `Synced ${result.count} franchises`);
    } else {
      setSyncStatus('unable to sync');
      Alert.alert('Sync Failed', result.error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      submitted: '#ffc107', under_review: '#2196f3', investigating: '#ff9800',
      resolved: '#4caf50', rejected: '#f44336', open: '#ff8c42',
      accepted: '#2196f3', completed: '#4caf50', active: '#4caf50',
      suspended: '#ff9800', revoked: '#f44336', forwarded: '#9c27b0'
    };
    return colors[status] || '#999';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, isLandscape && styles.headerLandscape]}>
        <View style={isLandscape && styles.headerLeftLandscape}>
          <Text style={styles.headerTitle}>🚲 Admin Dashboard</Text>
          <Text style={styles.headerSubtitle}>Welcome, {user?.firstName || 'Admin'}!</Text>
        </View>
        <View style={[styles.headerRight, isLandscape && styles.headerRightLandscape]}>
          <View style={[styles.connectivityStatus, isLandscape && styles.connectivityStatusLandscape]}>
            <View style={[styles.wifiCircle, styles.online]}>
              <Text style={styles.wifiIcon}>📶</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => {
            AsyncStorage.multiRemove(['token', 'user']);
            navigation.replace('Login');
          }}>
            <Text style={styles.signOutButton}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'complaints', label: 'Complaints' },
          { key: 'investigations', label: 'Investigations' },
          { key: 'tickets', label: 'Tickets' },
          { key: 'franchises', label: 'Franchises' }
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ff8c42']} />}
      >
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>System Overview</Text>
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: '#fff3e0' }]}>
                <Text style={styles.statNumber}>{stats.complaints}</Text>
                <Text style={styles.statLabel}>Total Complaints</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#e3f2fd' }]}>
                <Text style={styles.statNumber}>{stats.investigations}</Text>
                <Text style={styles.statLabel}>Investigations</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#f3e5f5' }]}>
                <Text style={styles.statNumber}>{stats.tickets}</Text>
                <Text style={styles.statLabel}>Tickets</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#e8f5e9' }]}>
                <Text style={styles.statNumber}>{franchiseCount}</Text>
                <Text style={styles.statLabel}>Franchises</Text>
              </View>
            </View>

            <Text style={styles.subsectionTitle}>Recent Activity</Text>
            <Text style={styles.infoText}>All systems operational. Use tabs above to manage different areas.</Text>
          </View>
        )}

        {/* Complaints Tab */}
        {activeTab === 'complaints' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Manage Complaints</Text>
              <View style={styles.filterContainer}>
                <Picker
                  selectedValue={filterLocation}
                  onValueChange={(itemValue) => setFilterLocation(itemValue)}
                  style={styles.filterPicker}
                >
                  <Picker.Item label="📍 All Locations" value="all" />
                  <Picker.Item label="📍 Other / Not in list" value="other" />
                  {BARANGAYS.map(b => (
                    <Picker.Item key={b} label={b} value={b} />
                  ))}
                </Picker>
              </View>
            </View>
            {loading ? (
              <ActivityIndicator size="large" color="#ff8c42" style={{ marginTop: 30 }} />
            ) : complaints.length === 0 ? (
              <Text style={styles.noDataText}>No complaints to review</Text>
            ) : (
              complaints.map((complaint) => (
                <TouchableOpacity
                  key={complaint._id}
                  style={styles.card}
                  onPress={() => setSelectedComplaint(complaint)}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardNumber}>{complaint.complaintNumber}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(complaint.status) }]}>
                      <Text style={styles.statusText}>{(complaint.status || '').toUpperCase()}</Text>
                    </View>
                  </View>

                  <Text style={styles.cardTitle}>Franchise #{complaint.franchiseNumber}</Text>
                  <Text style={styles.cardDetail}>{complaint.category}</Text>
                  <Text style={styles.cardDetail}>📍 {complaint.location}</Text>
                  <Text style={styles.timestamp}>
                    {new Date(complaint.createdAt).toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Investigations Tab */}
        {activeTab === 'investigations' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Manage Investigations</Text>
                <View style={styles.filterContainer}>
                  <Picker
                    selectedValue={filterLocation}
                    onValueChange={(itemValue) => setFilterLocation(itemValue)}
                    style={styles.filterPicker}
                  >
                    <Picker.Item label="📍 All Locations" value="all" />
                    <Picker.Item label="📍 Other / Not in list" value="other" />
                    {BARANGAYS.map(b => (
                      <Picker.Item key={b} label={b} value={b} />
                    ))}
                  </Picker>
                </View>
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowManualInvForm(true)}
              >
                <Text style={styles.addButtonText}>+ Manual</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color="#ff8c42" style={{ marginTop: 30 }} />
            ) : investigations.length === 0 ? (
              <Text style={styles.noDataText}>No investigations</Text>
            ) : (
              investigations.map((inv) => (
                <TouchableOpacity
                  key={inv._id}
                  style={styles.card}
                  onPress={() => setSelectedInvestigation(inv)}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardNumber}>
                      {inv.complaint ? '📋 ' : ''}{inv.investigationNumber}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(inv.status) }]}>
                      <Text style={styles.statusText}>{(inv.status || '').toUpperCase()}</Text>
                    </View>
                  </View>

                  <Text style={styles.cardTitle}>
                    Franchise #{inv.franchiseNumber || inv.complaint?.franchiseNumber}
                  </Text>
                  <Text style={styles.cardDetail}>
                    {inv.complaint?.category || 'Manual Investigation'}
                  </Text>
                  {inv.acceptedBy && (
                    <Text style={styles.cardDetail}>👮 {inv.acceptedBy.firstName} {inv.acceptedBy.lastName}</Text>
                  )}
                  <Text style={styles.timestamp}>
                    Created: {new Date(inv.createdAt).toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Tickets Tab */}
        {activeTab === 'tickets' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Manage Tickets</Text>
              <View style={styles.filterContainer}>
                <Picker
                  selectedValue={filterLocation}
                  onValueChange={(itemValue) => setFilterLocation(itemValue)}
                  style={styles.filterPicker}
                >
                  <Picker.Item label="📍 All Locations" value="all" />
                  <Picker.Item label="📍 Other / Not in list" value="other" />
                  {BARANGAYS.map(b => (
                    <Picker.Item key={b} label={b} value={b} />
                  ))}
                </Picker>
              </View>
            </View>
            {loading ? (
              <ActivityIndicator size="large" color="#ff8c42" style={{ marginTop: 30 }} />
            ) : tickets.length === 0 ? (
              <Text style={styles.noDataText}>No tickets submitted</Text>
            ) : (
              tickets.map((ticket) => (
                <TouchableOpacity
                  key={ticket._id}
                  style={styles.card}
                  onPress={() => setSelectedTicket(ticket)}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardNumber}>{ticket.ticketNumber}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) }]}>
                      <Text style={styles.statusText}>{(ticket.status || '').toUpperCase()}</Text>
                    </View>
                  </View>

                  <Text style={styles.cardTitle}>Franchise #{ticket.franchiseNumber}</Text>
                  <Text style={styles.cardDetail}>
                    👮 {ticket.enforcer?.firstName} {ticket.enforcer?.lastName}
                  </Text>
                  <Text style={styles.cardDetail}>
                    {ticket.violations?.length || 0} violation(s)
                  </Text>
                  <Text style={styles.timestamp}>
                    Submitted: {new Date(ticket.createdAt).toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Franchises Tab */}
        {activeTab === 'franchises' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Franchise Database (Offline Mode)</Text>

            <View style={styles.statusBar}>
              <Text style={styles.statusBarText}>
                {franchiseCount} franchises • {syncStatus}
              </Text>
              <TouchableOpacity onPress={handleSyncFranchises} style={styles.syncButton}>
                <Text style={styles.syncButtonText}>🔄 Sync</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search by number, owner, or license..."
                placeholderTextColor="#999"
                value={searchTerm}
                onChangeText={setSearchTerm}
                onSubmitEditing={handleSearchFranchises}
              />
              <TouchableOpacity style={styles.searchButton} onPress={handleSearchFranchises}>
                <Text style={styles.searchButtonText}>🔍</Text>
              </TouchableOpacity>
            </View>

            {franchises.length === 0 ? (
              <Text style={styles.noDataText}>
                {dbInitialized ? 'No franchises found' : 'Initializing database...'}
              </Text>
            ) : (
              franchises.map((franchise, index) => (
                <View key={index} style={styles.franchiseCard}>
                  <View style={styles.franchiseHeader}>
                    <Text style={styles.franchiseNumber}>#{franchise.franchiseNumber}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(franchise.status) }]}>
                      <Text style={styles.statusText}>{(franchise.status || '').toUpperCase()}</Text>
                    </View>
                  </View>

                  <Text style={styles.ownerName}>{franchise.ownerName}</Text>
                  <Text style={styles.franchiseDetail}>📞 {franchise.contactNumber}</Text>
                  <Text style={styles.franchiseDetail}>📍 {franchise.address}</Text>
                  <Text style={styles.franchiseDetail}>🚗 {franchise.vehicleCount} vehicles</Text>
                  <Text style={styles.franchiseDetail}>📄 {franchise.licenseNumber}</Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Complaint Details Modal */}
      <Modal
        visible={selectedComplaint !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedComplaint(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Complaint Details</Text>
              <TouchableOpacity onPress={() => setSelectedComplaint(null)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {selectedComplaint && (
                <>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Complaint Number:</Text>
                    <Text style={styles.detailValue}>{selectedComplaint.complaintNumber}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Franchise:</Text>
                    <Text style={styles.detailValue}>#{selectedComplaint.franchiseNumber}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Category:</Text>
                    <Text style={styles.detailValue}>{selectedComplaint.category}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Location:</Text>
                    <Text style={styles.detailValue}>{selectedComplaint.location}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Description:</Text>
                    <Text style={styles.detailValue}>{selectedComplaint.description}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedComplaint.status) }]}>
                      <Text style={styles.statusText}>{(selectedComplaint.status || '').toUpperCase()}</Text>
                    </View>
                  </View>

                  <Text style={styles.timestamp}>
                    Submitted: {new Date(selectedComplaint.createdAt).toLocaleString()}
                  </Text>

                  {selectedComplaint.status === 'submitted' && (
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#4caf50' }]}
                        onPress={() => handleAcceptComplaint(selectedComplaint._id)}
                      >
                        <Text style={styles.actionButtonText}>✓ Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#f44336' }]}
                        onPress={() => handleRejectComplaint(selectedComplaint._id)}
                      >
                        <Text style={styles.actionButtonText}>✕ Reject</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {selectedComplaint.status === 'under_review' && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: '#ff8c42', width: '100%' }]}
                      onPress={() => handleCreateInvestigation(selectedComplaint)}
                    >
                      <Text style={styles.actionButtonText}>🔍 Create Investigation</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Investigation Details Modal */}
      <Modal
        visible={selectedInvestigation !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedInvestigation(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Investigation Details</Text>
              <TouchableOpacity onPress={() => setSelectedInvestigation(null)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {selectedInvestigation && (
                <>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Investigation Number:</Text>
                    <Text style={styles.detailValue}>{selectedInvestigation.investigationNumber}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Franchise:</Text>
                    <Text style={styles.detailValue}>
                      #{selectedInvestigation.franchiseNumber || selectedInvestigation.complaint?.franchiseNumber}
                    </Text>
                  </View>

                  {selectedInvestigation.complaint && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Linked Complaint:</Text>
                      <Text style={styles.detailValue}>{selectedInvestigation.complaint.complaintNumber}</Text>
                    </View>
                  )}

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Description:</Text>
                    <Text style={styles.detailValue}>{selectedInvestigation.description}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Instructions:</Text>
                    <Text style={[styles.detailValue, styles.instructionBox]}>
                      {selectedInvestigation.instructions || 'No specific instructions'}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedInvestigation.status) }]}>
                      <Text style={styles.statusText}>{(selectedInvestigation.status || '').toUpperCase()}</Text>
                    </View>
                  </View>

                  {selectedInvestigation.acceptedBy && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Accepted By:</Text>
                      <Text style={styles.detailValue}>
                        {selectedInvestigation.acceptedBy.firstName} {selectedInvestigation.acceptedBy.lastName}
                      </Text>
                    </View>
                  )}

                  <Text style={styles.timestamp}>
                    Created: {new Date(selectedInvestigation.createdAt).toLocaleString()}
                  </Text>

                  {selectedInvestigation.status === 'open' && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: '#f44336', width: '100%' }]}
                      onPress={() => handleDeleteInvestigation(selectedInvestigation._id)}
                    >
                      <Text style={styles.actionButtonText}>🗑️ Delete Investigation</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Ticket Details Modal */}
      <Modal
        visible={selectedTicket !== null && !showForwardForm}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedTicket(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ticket Details</Text>
              <TouchableOpacity onPress={() => setSelectedTicket(null)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {selectedTicket && (
                <>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Ticket Number:</Text>
                    <Text style={styles.detailValue}>{selectedTicket.ticketNumber}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Franchise:</Text>
                    <Text style={styles.detailValue}>#{selectedTicket.franchiseNumber}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Enforcer:</Text>
                    <Text style={styles.detailValue}>
                      {selectedTicket.enforcer?.firstName} {selectedTicket.enforcer?.lastName}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedTicket.status) }]}>
                      <Text style={styles.statusText}>{(selectedTicket.status || '').toUpperCase()}</Text>
                    </View>
                  </View>

                  <Text style={styles.subsectionTitle}>Violations Reported:</Text>
                  {selectedTicket.violations?.map((violation, idx) => (
                    <View key={idx} style={styles.violationCard}>
                      <Text style={styles.violationType}>
                        {violation.type.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                      </Text>
                      {violation.notes && (
                        <Text style={styles.violationNotes}>{violation.notes}</Text>
                      )}
                      {violation.photos?.length > 0 && (
                        <View style={styles.photoGrid}>
                          {violation.photos.map((photo, photoIdx) => (
                            <Image
                              key={photoIdx}
                              source={{ uri: photo.url }}
                              style={styles.photoThumbnail}
                            />
                          ))}
                        </View>
                      )}
                    </View>
                  ))}

                  {selectedTicket.additionalNotes && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Additional Notes:</Text>
                      <Text style={styles.detailValue}>{selectedTicket.additionalNotes}</Text>
                    </View>
                  )}

                  <Text style={styles.timestamp}>
                    Submitted: {new Date(selectedTicket.createdAt).toLocaleString()}
                  </Text>

                  {selectedTicket.status === 'submitted' && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: '#9c27b0', width: '100%' }]}
                      onPress={() => setShowForwardForm(true)}
                    >
                      <Text style={styles.actionButtonText}>📤 Forward to Higher Ups</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Forward Ticket Modal */}
      <Modal
        visible={showForwardForm}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowForwardForm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Forward Ticket</Text>
              <TouchableOpacity onPress={() => setShowForwardForm(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <Text style={styles.subsectionTitle}>Add Notes:</Text>
              <TextInput
                style={[styles.textArea, { minHeight: 120 }]}
                placeholder="Admin notes for higher authorities..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={5}
                value={forwardNotes}
                onChangeText={setForwardNotes}
              />

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#9c27b0', width: '100%' }]}
                onPress={handleForwardTicket}
              >
                <Text style={styles.actionButtonText}>Forward Ticket</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Manual Investigation Form Modal */}
      <Modal
        visible={showManualInvForm}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowManualInvForm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Manual Investigation</Text>
              <TouchableOpacity onPress={() => setShowManualInvForm(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <Text style={styles.subsectionTitle}>Franchise Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 1001"
                placeholderTextColor="#999"
                value={manualInvForm.franchiseNumber}
                onChangeText={(text) => setManualInvForm(prev => ({ ...prev, franchiseNumber: text }))}
                keyboardType="numeric"
              />

              <Text style={styles.subsectionTitle}>Description *</Text>
              <TextInput
                style={[styles.textArea, { minHeight: 100 }]}
                placeholder="Investigation description..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                value={manualInvForm.description}
                onChangeText={(text) => setManualInvForm(prev => ({ ...prev, description: text }))}
              />

              <Text style={styles.subsectionTitle}>Instructions for Enforcer</Text>
              <TextInput
                style={[styles.textArea, { minHeight: 100 }]}
                placeholder="Specific tasks for enforcer..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                value={manualInvForm.instructions}
                onChangeText={(text) => setManualInvForm(prev => ({ ...prev, instructions: text }))}
              />

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#ff8c42', width: '100%' }]}
                onPress={handleCreateManualInvestigation}
              >
                <Text style={styles.actionButtonText}>Create Investigation</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: '#ff8c42',
    padding: 20,
    paddingTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLandscape: {
    paddingVertical: 12,
    paddingTop: 12,
  },
  headerLeftLandscape: {
    flex: 1,
  },
  headerRight: { alignItems: 'flex-end' },
  headerRightLandscape: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  connectivityStatus: { alignItems: 'center', marginBottom: 12 },
  connectivityStatusLandscape: { flexDirection: 'row', alignItems: 'center', marginBottom: 0, gap: 8 },
  wifiCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  online: { backgroundColor: '#4caf50' },
  wifiIcon: { fontSize: 18 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: 'white' },
  headerSubtitle: { fontSize: 13, color: 'white', marginTop: 5 },
  signOutButton: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
  },
  tabs: { flexDirection: 'row', backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#ddd' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#ff8c42' },
  tabText: { fontSize: 10, color: '#666' },
  activeTabText: { color: '#ff8c42', fontWeight: 'bold' },
  content: { flex: 1 },
  tabContent: { padding: 15 },
  sectionTitle: { fontSize: 19, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  subsectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginTop: 10, marginBottom: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  addButton: { backgroundColor: '#4caf50', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 5 },
  addButtonText: { color: 'white', fontSize: 13, fontWeight: 'bold' },
  noDataText: { textAlign: 'center', color: '#999', marginTop: 30, fontSize: 14 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  statCard: { width: '48%', padding: 15, borderRadius: 8, margin: '1%', alignItems: 'center' },
  statNumber: { fontSize: 32, fontWeight: 'bold', color: '#333' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 5 },
  infoText: { fontSize: 13, color: '#666', textAlign: 'center', marginTop: 10 },
  card: { backgroundColor: 'white', borderRadius: 8, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: '#ddd' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardNumber: { fontSize: 14, fontWeight: 'bold', color: '#ff8c42' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  cardDetail: { fontSize: 12, color: '#666', marginBottom: 2 },
  timestamp: { fontSize: 11, color: '#999', marginTop: 4 },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  statusBarText: { fontSize: 13, color: '#666' },
  syncButton: { backgroundColor: '#ff8c42', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 5 },
  syncButtonText: { color: 'white', fontSize: 13, fontWeight: 'bold' },
  searchContainer: { flexDirection: 'row', marginBottom: 15 },
  searchInput: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#ddd',
    color: '#333',
  },
  searchButton: { backgroundColor: '#ff8c42', paddingHorizontal: 18, borderRadius: 8, justifyContent: 'center', marginLeft: 8 },
  searchButtonText: { fontSize: 18 },
  franchiseCard: { backgroundColor: 'white', borderRadius: 8, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: '#ddd' },
  franchiseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  franchiseNumber: { fontSize: 17, fontWeight: 'bold', color: '#ff8c42' },
  ownerName: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 6 },
  franchiseDetail: { fontSize: 13, color: '#666', marginBottom: 3 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: 'white', borderRadius: 12, width: '90%', maxHeight: '80%', padding: 20 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: { fontSize: 19, fontWeight: 'bold', color: '#333' },
  closeButton: { fontSize: 24, color: '#999', fontWeight: 'bold' },
  modalContent: { flex: 1 },
  detailRow: { marginBottom: 12 },
  detailLabel: { fontSize: 13, fontWeight: 'bold', color: '#666', marginBottom: 4 },
  detailValue: { fontSize: 14, color: '#333' },
  instructionBox: { backgroundColor: '#fff3e0', padding: 10, borderRadius: 5, color: '#ff8c42' },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  actionButton: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 5, marginTop: 15 },
  actionButtonText: { color: 'white', fontSize: 15, fontWeight: 'bold' },
  violationCard: { backgroundColor: '#f5f5f5', borderRadius: 8, padding: 12, marginBottom: 10 },
  violationType: { fontSize: 14, fontWeight: 'bold', color: '#ff8c42', marginBottom: 4 },
  violationNotes: { fontSize: 12, color: '#666', marginBottom: 8 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 5 },
  photoThumbnail: { width: 80, height: 80, borderRadius: 8, marginRight: 8, marginBottom: 8 },
  textArea: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 13,
    color: '#333',
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  filterContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    minWidth: 150,
  },
  filterPicker: {
    height: 40,
    width: 180,
    color: '#333',
  },
});

export default AdminScreen;
