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
import { launchImageLibrary } from 'react-native-image-picker';
import { Picker } from '@react-native-picker/picker';
import { BARANGAYS } from '../utils/locations';
import { investigationsAPI, ticketsAPI } from '../services/api';
import { initDatabase } from '../database/init';
import { searchFranchises, getFranchiseCount } from '../database/franchises';
import { syncWithAPI, loadInitialData } from '../database/sync';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';

const EnforcerScreen = ({ navigation }) => {
  const { user } = useAuth();

  // State management
  const [isSidebarVisible, setSidebarVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('available');
  const [availableInvestigations, setAvailableInvestigations] = useState([]);
  const [myInvestigations, setMyInvestigations] = useState([]);
  const [myTickets, setMyTickets] = useState([]);
  const [franchises, setFranchises] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Database states
  const [dbInitialized, setDbInitialized] = useState(false);
  const [franchiseCount, setFranchiseCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncStatus, setSyncStatus] = useState('synced');
  const [filterLocation, setFilterLocation] = useState('all');

  // UI states
  const [expandedInvestigation, setExpandedInvestigation] = useState(null);
  const [selectedInvestigation, setSelectedInvestigation] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

  // Orientation detection function
  const updateOrientation = () => {
    const { width, height } = Dimensions.get('window');
    setIsLandscape(width > height);
  };

  // Violation categories - separated by Driver and Vehicle
  const violationCategories = {
    'Driver Violations': [
      'No Valid License',
      'Expired Driver\'s License',
      'Failure to Bring License',
      'No Mayor\'s Permit (Driver)',
      'Student Driver Not Accompanied',
      'Reckless Driving',
      'Disregarding Traffic Sign',
      'Overcharging',
      'Refusal to Convey',
      'Discourtesy/Arrogance',
      'Rude Behavior',
      'Unauthorized Route',
      'No Fare Matrix Displayed',
      'Operating Under Influence',
      'No Uniform/ID',
      'Driving in Slippers/Sleeveless Shirt'
    ],
    'Vehicle Violations': [
      'No Plate Number',
      'Plate Improperly Displayed',
      'Obstructed Plate',
      'No Plate Sticker',
      'No Registration/Official Receipt',
      'Expired Franchise',
      'Expired Registration',
      'Invalid Registration',
      'Incomplete OR/CR',
      'Illegal Parking',
      'Parking on the Sidewalk',
      'Parking Infront of a Driveway',
      'Obstruction',
      'Missing Headlights',
      'Missing Taillights',
      'No Side Mirrors',
      'Poor Vehicle Condition',
      'Overloading',
      'Excessive Noise',
      'No Seatbelt',
      'Defective Brakes'
    ],
    'Others': [
      'Other Violation'
    ]
  };

  // Flatten for initialization
  const allViolationTypes = Object.values(violationCategories).flat();

  const [ticketForm, setTicketForm] = useState({
    violations: {},
    additionalNotes: ''
  });

  useEffect(() => {
    // Initialize violation form
    const initialViolations = {};
    allViolationTypes.forEach(type => {
      initialViolations[type] = { checked: false, notes: '', photos: [] };
    });
    setTicketForm(prev => ({ ...prev, violations: initialViolations }));

    setupDatabase();
    loadData();

    // Initialize orientation
    updateOrientation();
    const subscription = Dimensions.addEventListener('change', updateOrientation);
    return () => subscription?.remove();
  }, []);

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
            setLastSyncTime(syncResult.timestamp);
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
      setFranchises(Array.isArray(allFranchises) ? allFranchises : []);
      setDbInitialized(true);
    } catch (error) {
      console.error('Database setup failed:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      // Set database as initialized even on error to prevent blocking the UI
      setDbInitialized(true);
      setFranchises([]);
      setSyncStatus('database error');
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'available') {
        console.log('Loading available investigations...');
        const response = await investigationsAPI.getAll({ status: 'open' });
        console.log('Available investigations response:', response.data);
        // Backend returns { investigations: [...] }
        const data = response.data.investigations || response.data;
        // Filter to only show open investigations (not accepted or completed)
        let openOnly = Array.isArray(data) ? data.filter(inv => inv.status === 'open') : [];

        if (filterLocation !== 'all') {
          openOnly = openOnly.filter(inv => {
            const loc = inv.complaint?.location || inv.location;
            if (filterLocation === 'other') {
              return loc && !BARANGAYS.includes(loc);
            }
            return loc === filterLocation;
          });
        }

        setAvailableInvestigations(openOnly);
        console.log('Available investigations loaded:', openOnly.length);
      } else if (activeTab === 'myInvestigations') {
        console.log('Loading my investigations...');
        const response = await investigationsAPI.getAll({ acceptedByMe: true });
        console.log('My investigations response:', response.data);
        // Backend returns { investigations: [...] }
        const data = response.data.investigations || response.data;
        let myInv = Array.isArray(data) ? data : [];

        if (filterLocation !== 'all') {
          myInv = myInv.filter(inv => {
            const loc = inv.complaint?.location || inv.location;
            if (filterLocation === 'other') {
              return loc && !BARANGAYS.includes(loc);
            }
            return loc === filterLocation;
          });
        }

        setMyInvestigations(myInv);
        console.log('My investigations loaded:', myInv.length);
      } else if (activeTab === 'myTickets') {
        console.log('Loading my tickets...');
        const response = await ticketsAPI.getAll();
        console.log('My tickets response:', response.data);
        // Backend returns { tickets: [...] }
        const data = response.data.tickets || response.data;
        let tickets = Array.isArray(data) ? data : [];

        if (filterLocation !== 'all') {
          tickets = tickets.filter(ticket => {
            const loc = ticket.investigation?.complaint?.location || ticket.complaint?.location;
            if (filterLocation === 'other') {
              return loc && !BARANGAYS.includes(loc);
            }
            return loc === filterLocation;
          });
        }

        setMyTickets(tickets);
        console.log('My tickets loaded:', tickets.length);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      console.error('Error details:', error.response?.data || error.message);
      // Keep arrays as empty instead of showing alert
      setAvailableInvestigations([]);
      setMyInvestigations([]);
      setMyTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAcceptInvestigation = async (investigationId) => {
    try {
      await investigationsAPI.accept(investigationId);
      Alert.alert('Success', 'Investigation accepted!');
      loadData();
      setExpandedInvestigation(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to accept investigation');
    }
  };

  const handlePhotoUpload = async (violationType) => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        includeBase64: true,
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.8
      });

      if (!result.didCancel && result.assets && result.assets[0]) {
        const base64Image = `data:${result.assets[0].type};base64,${result.assets[0].base64}`;

        setTicketForm(prev => ({
          ...prev,
          violations: {
            ...prev.violations,
            [violationType]: {
              ...prev.violations[violationType],
              photos: [...prev.violations[violationType].photos, {
                url: base64Image,
                description: result.assets[0].fileName || 'photo',
                uploadedAt: new Date()
              }]
            }
          }
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload photo');
    }
  };

  const handleSubmitTicket = async () => {
    const selectedViolations = Object.entries(ticketForm.violations)
      .filter(([_, data]) => data.checked)
      .map(([type, data]) => ({
        type,
        notes: data.notes,
        photos: data.photos
      }));

    if (selectedViolations.length === 0) {
      Alert.alert('Error', 'Please select at least one violation');
      return;
    }

    try {
      await ticketsAPI.create({
        investigationId: selectedInvestigation._id,
        violations: selectedViolations,
        additionalNotes: ticketForm.additionalNotes
      });

      Alert.alert('Success', 'Ticket submitted successfully!');

      // Reset form
      const resetViolations = {};
      allViolationTypes.forEach(type => {
        resetViolations[type] = { checked: false, notes: '', photos: [] };
      });
      setTicketForm({ violations: resetViolations, additionalNotes: '' });

      setShowTicketForm(false);
      setSelectedInvestigation(null);
      setActiveTab('myTickets');
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to submit ticket');
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
    try {
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
    } catch (error) {
      console.error('handleSyncFranchises error:', error);
      setSyncStatus('unable to sync');
      Alert.alert('Sync Failed', error.message || 'Unknown error');
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
      <Sidebar
        visible={isSidebarVisible}
        onClose={() => setSidebarVisible(false)}
        onNavigate={setActiveTab}
        activeItem={activeTab}
        userRole="enforcer"
        userName={user?.firstName}
      />

      {/* Header */}
      <View style={[styles.header, isLandscape && styles.headerLandscape]}>
        <View style={[styles.headerLeft, isLandscape && styles.headerLeftLandscape]}>
          <TouchableOpacity onPress={() => setSidebarVisible(true)}>
            <Text style={styles.hamburgerIcon}>☰</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Pedicab Enforcer</Text>
            <Text style={styles.headerSubtitle}>Welcome, {user?.firstName || 'Enforcer'}!</Text>
          </View>
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

      {/* Tabs - Removed in favor of Sidebar */}

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ff8c42']} />}
      >
        {/* Available Investigations */}
        {activeTab === 'available' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Available Investigation Quests</Text>
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
            ) : availableInvestigations.length === 0 ? (
              <Text style={styles.noDataText}>No available investigations</Text>
            ) : (
              availableInvestigations.map((inv) => (
                <TouchableOpacity
                  key={inv._id}
                  style={styles.questCard}
                  onPress={() => setExpandedInvestigation(expandedInvestigation === inv._id ? null : inv._id)}
                >
                  <View style={styles.questHeader}>
                    <Text style={styles.invNumber}>{inv.investigationNumber}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(inv.status) }]}>
                      <Text style={styles.statusText}>{(inv.status || '').toUpperCase()}</Text>
                    </View>
                  </View>

                  <Text style={styles.category}>
                    {inv.complaint?.category || 'Manual Investigation'}
                  </Text>

                  {expandedInvestigation === inv._id && (
                    <View style={styles.expandedContent}>
                      {inv.complaint && (
                        <View style={styles.section}>
                          <Text style={styles.sectionLabel}>Complaint Details:</Text>
                          <Text style={styles.detailText}>📋 {inv.complaint.complaintNumber}</Text>
                          <Text style={styles.detailText}>📍 {inv.complaint.location}</Text>
                          <Text style={styles.detailText}>{inv.complaint.description}</Text>
                        </View>
                      )}

                      <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Investigation Instructions:</Text>
                        <Text style={styles.instructionText}>
                          {inv.description || 'Conduct thorough investigation of the franchise.'}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.acceptButton}
                        onPress={() => handleAcceptInvestigation(inv._id)}
                      >
                        <Text style={styles.acceptButtonText}>✓ Accept Investigation</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* My Investigations */}
        {activeTab === 'myInvestigations' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Active Investigations</Text>
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
            ) : myInvestigations.length === 0 ? (
              <Text style={styles.noDataText}>No active investigations</Text>
            ) : (
              myInvestigations.map((inv) => (
                <TouchableOpacity
                  key={inv._id}
                  style={styles.questCard}
                  onPress={() => setExpandedInvestigation(expandedInvestigation === inv._id ? null : inv._id)}
                >
                  <View style={styles.questHeader}>
                    <Text style={styles.invNumber}>{inv.investigationNumber}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(inv.status) }]}>
                      <Text style={styles.statusText}>{(inv.status || '').toUpperCase()}</Text>
                    </View>
                  </View>

                  <Text style={styles.franchiseNum}>
                    Franchise #{inv.franchiseNumber || inv.complaint?.franchiseNumber || 'N/A'}
                  </Text>
                  <Text style={styles.category}>
                    {inv.complaint?.category || 'Manual Investigation'}
                  </Text>

                  {expandedInvestigation === inv._id && (
                    <View style={styles.expandedContent}>
                      {inv.complaint && (
                        <View style={styles.section}>
                          <Text style={styles.sectionLabel}>Complaint Details:</Text>
                          <Text style={styles.detailText}>📋 {inv.complaint.complaintNumber}</Text>
                          <Text style={styles.detailText}>📍 {inv.complaint.location}</Text>
                          <Text style={styles.detailText}>{inv.complaint.description}</Text>
                        </View>
                      )}

                      <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Investigation Instructions:</Text>
                        <Text style={styles.instructionText}>
                          {inv.description || 'Conduct thorough investigation of the franchise.'}
                        </Text>
                      </View>
                    </View>
                  )}

                  {inv.status === 'accepted' && (
                    <TouchableOpacity
                      style={styles.submitButton}
                      onPress={() => {
                        setSelectedInvestigation(inv);
                        setShowTicketForm(true);
                      }}
                    >
                      <Text style={styles.submitButtonText}>📝 Submit Ticket</Text>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* My Tickets */}
        {activeTab === 'myTickets' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Submitted Tickets</Text>
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
            ) : myTickets.length === 0 ? (
              <Text style={styles.noDataText}>No tickets submitted yet</Text>
            ) : (
              myTickets.map((ticket) => (
                <TouchableOpacity
                  key={ticket._id}
                  style={styles.ticketCard}
                  onPress={() => setSelectedTicket(ticket)}
                >
                  <View style={styles.questHeader}>
                    <Text style={styles.invNumber}>{ticket.ticketNumber}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) }]}>
                      <Text style={styles.statusText}>{(ticket.status || '').toUpperCase()}</Text>
                    </View>
                  </View>

                  <Text style={styles.franchiseNum}>Franchise #{ticket.franchiseNumber}</Text>
                  <Text style={styles.detailText}>
                    {ticket.violations?.length || 0} violation(s) reported
                  </Text>
                  <Text style={styles.timestamp}>
                    Submitted: {new Date(ticket.createdAt).toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Franchises */}
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

      {/* Ticket Submission Modal */}
      <Modal
        visible={showTicketForm}
        animationType="slide"
        onRequestClose={() => setShowTicketForm(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Submit Violation Ticket</Text>
            <TouchableOpacity onPress={() => setShowTicketForm(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.formSectionTitle}>Select Violations (at least 1):</Text>

            {Object.entries(violationCategories).map(([category, violations]) => (
              <View key={category} style={styles.violationCategory}>
                <Text style={styles.violationCategoryTitle}>{category}</Text>

                {violations.map((violationType) => (
                  <View key={violationType} style={styles.violationSection}>
                    <TouchableOpacity
                      style={styles.checkboxContainer}
                      onPress={() => {
                        setTicketForm(prev => ({
                          ...prev,
                          violations: {
                            ...prev.violations,
                            [violationType]: {
                              ...prev.violations[violationType],
                              checked: !prev.violations[violationType]?.checked
                            }
                          }
                        }));
                      }}
                    >
                      <View style={[
                        styles.checkbox,
                        ticketForm.violations[violationType]?.checked && styles.checkboxChecked
                      ]}>
                        {ticketForm.violations[violationType]?.checked && (
                          <Text style={styles.checkmark}>✓</Text>
                        )}
                      </View>
                      <Text style={styles.violationLabel}>
                        {violationType}
                      </Text>
                    </TouchableOpacity>

                    {ticketForm.violations[violationType]?.checked && (
                      <View style={styles.violationDetails}>
                        <TextInput
                          style={styles.textArea}
                          placeholder="Notes for this violation..."
                          placeholderTextColor="#999"
                          multiline
                          numberOfLines={3}
                          value={ticketForm.violations[violationType]?.notes || ''}
                          onChangeText={(text) => {
                            setTicketForm(prev => ({
                              ...prev,
                              violations: {
                                ...prev.violations,
                                [violationType]: {
                                  ...prev.violations[violationType],
                                  notes: text
                                }
                              }
                            }));
                          }}
                        />

                        <TouchableOpacity
                          style={styles.photoButton}
                          onPress={() => handlePhotoUpload(violationType)}
                        >
                          <Text style={styles.photoButtonText}>
                            📷 Add Photo ({ticketForm.violations[violationType]?.photos?.length || 0})
                          </Text>
                        </TouchableOpacity>

                        {ticketForm.violations[violationType]?.photos?.length > 0 && (
                          <View style={styles.photoGrid}>
                            {ticketForm.violations[violationType].photos.map((photo, idx) => (
                              <Image
                                key={idx}
                                source={{ uri: photo.url }}
                                style={styles.photoThumbnail}
                              />
                            ))}
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            ))}

            <Text style={styles.formSectionTitle}>Additional Notes:</Text>
            <TextInput
              style={[styles.textArea, { minHeight: 100 }]}
              placeholder="General observations or comments..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              value={ticketForm.additionalNotes}
              onChangeText={(text) => setTicketForm(prev => ({ ...prev, additionalNotes: text }))}
            />

            <TouchableOpacity
              style={styles.submitTicketButton}
              onPress={handleSubmitTicket}
            >
              <Text style={styles.submitTicketButtonText}>Submit Ticket</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Ticket Details Modal */}
      <Modal
        visible={selectedTicket !== null}
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

            {selectedTicket && (
              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={true}>
                <View style={styles.modalBody}>
                  <View style={styles.detailRow}>
                    <Text style={styles.ticketDetailLabel}>Ticket Number:</Text>
                    <Text style={styles.ticketDetailValue}>{selectedTicket.ticketNumber}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.ticketDetailLabel}>Franchise:</Text>
                    <Text style={styles.ticketDetailValue}>#{selectedTicket.franchiseNumber}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.ticketDetailLabel}>Status:</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedTicket.status) }]}>
                      <Text style={styles.statusText}>{(selectedTicket.status || '').toUpperCase()}</Text>
                    </View>
                  </View>

                  <Text style={styles.formSectionTitle}>Violations Reported:</Text>
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
                    <>
                      <Text style={styles.formSectionTitle}>Additional Notes:</Text>
                      <Text style={styles.ticketDetailValue}>{selectedTicket.additionalNotes}</Text>
                    </>
                  )}

                  <Text style={styles.timestamp}>
                    Submitted: {new Date(selectedTicket.createdAt).toLocaleString()}
                  </Text>
                </View>
              </ScrollView>
            )}
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
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerLeftLandscape: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  hamburgerIcon: { fontSize: 30, marginRight: 15, color: 'white', fontWeight: 'bold' },
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
  tabText: { fontSize: 11, color: '#666' },
  activeTabText: { color: '#ff8c42', fontWeight: 'bold' },
  content: { flex: 1 },
  tabContent: { padding: 15 },
  sectionTitle: { fontSize: 19, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  noDataText: { textAlign: 'center', color: '#999', marginTop: 30, fontSize: 14 },
  questCard: { backgroundColor: 'white', borderRadius: 8, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: '#ddd' },
  questHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  invNumber: { fontSize: 15, fontWeight: 'bold', color: '#ff8c42' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  franchiseNum: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  category: { fontSize: 12, color: '#666', marginBottom: 8 },
  expandedContent: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#eee' },
  section: { marginBottom: 12 },
  sectionLabel: { fontSize: 13, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  detailText: { fontSize: 12, color: '#666', marginBottom: 2 },
  instructionText: { fontSize: 12, color: '#ff8c42', backgroundColor: '#fff3e0', padding: 10, borderRadius: 5 },
  acceptButton: { backgroundColor: '#4caf50', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  acceptButtonText: { color: 'white', fontSize: 15, fontWeight: 'bold' },
  submitButton: { backgroundColor: '#ff8c42', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  submitButtonText: { color: 'white', fontSize: 15, fontWeight: 'bold' },
  ticketCard: { backgroundColor: 'white', borderRadius: 8, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: '#ddd' },
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
  modalContainer: { flex: 1, backgroundColor: 'white' },
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
  modalContent: {},
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  formSectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginTop: 15, marginBottom: 10 },
  violationCategory: { marginBottom: 20 },
  violationCategoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff8c42',
    backgroundColor: '#fff3e0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 10,
    marginTop: 5
  },
  violationSection: { marginBottom: 12, marginLeft: 5 },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: { backgroundColor: '#ff8c42', borderColor: '#ff8c42' },
  checkmark: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  violationLabel: { fontSize: 14, color: '#333' },
  violationDetails: { marginLeft: 32, marginTop: 5 },
  textArea: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 13,
    color: '#333',
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  photoButton: { backgroundColor: '#2196f3', padding: 10, borderRadius: 8, alignItems: 'center', marginBottom: 8 },
  photoButtonText: { color: 'white', fontSize: 13, fontWeight: 'bold' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 5 },
  photoThumbnail: { width: 80, height: 80, borderRadius: 8, marginRight: 8, marginBottom: 8 },
  submitTicketButton: {
    backgroundColor: '#ff8c42',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  submitTicketButtonText: { color: 'white', fontSize: 17, fontWeight: 'bold' },
  detailRow: { marginBottom: 12 },
  ticketDetailLabel: { fontSize: 13, fontWeight: 'bold', color: '#666', marginBottom: 4 },
  ticketDetailValue: { fontSize: 14, color: '#333' },
  violationCard: { backgroundColor: '#f5f5f5', borderRadius: 8, padding: 12, marginBottom: 10 },
  violationType: { fontSize: 14, fontWeight: 'bold', color: '#ff8c42', marginBottom: 4 },
  violationNotes: { fontSize: 12, color: '#666', marginBottom: 8 },
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

export default EnforcerScreen;
