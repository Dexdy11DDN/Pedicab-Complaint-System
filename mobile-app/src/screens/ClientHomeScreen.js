import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, Modal, RefreshControl, Dimensions } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { complaintsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { BARANGAYS } from '../utils/locations';
import Sidebar from '../components/Sidebar';

const ClientHomeScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('myComplaints');
  const [isSidebarVisible, setSidebarVisible] = useState(false);
  const [complaints, setComplaints] = useState([]);
  // showForm state removed in favor of activeSection
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState('synced');
  const [message, setMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [editingComplaintId, setEditingComplaintId] = useState(null);
  const [formData, setFormData] = useState({
    franchiseNumber: '',
    description: '',
    category: 'overcharging',
    location: '',
    incidentDate: new Date().toISOString().split('T')[0]
  });
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [showLocationList, setShowLocationList] = useState(false);

  const updateOrientation = () => {
    const { width, height } = Dimensions.get('window');
    setIsLandscape(width > height);
  };

  useEffect(() => {
    loadComplaints();
    updateOrientation();
    const subscription = Dimensions.addEventListener('change', updateOrientation);
    return () => subscription?.remove();
  }, []);

  const loadComplaints = async () => {
    try {
      const response = await complaintsAPI.getMyComplaints();
      // Backend returns array directly for /my-complaints
      const data = response.data.complaints || response.data;
      setComplaints(Array.isArray(data) ? data : []);
      setSyncStatus('synced');
      setIsOnline(true);
    } catch (error) {
      console.error('Error loading complaints:', error);
      setSyncStatus('unable to sync');
      setIsOnline(false);
      setComplaints([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadComplaints();
    setRefreshing(false);
  };

  const handleSubmit = async () => {
    // Validate 4-digit franchise number
    if (!/^\d{4}$/.test(formData.franchiseNumber)) {
      setMessage('Franchise number must be exactly 4 digits');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    if (!formData.description || !formData.location || !formData.incidentDate) {
      setMessage('Please fill in all required fields');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      if (editingComplaintId) {
        await complaintsAPI.update(editingComplaintId, formData);
        setMessage('Complaint updated successfully!');
        setEditingComplaintId(null);
      } else {
        await complaintsAPI.create(formData);
        setMessage('Complaint submitted successfully!');
      }

      setActiveSection('myComplaints');
      setFormData({
        franchiseNumber: '',
        description: '',
        category: 'overcharging',
        location: '',
        incidentDate: new Date().toISOString().split('T')[0]
      });
      loadComplaints();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error submitting/updating complaint');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleEditComplaint = (complaint) => {
    setFormData({
      franchiseNumber: complaint.franchiseNumber,
      description: complaint.description,
      category: complaint.category,
      location: complaint.location,
      incidentDate: complaint.incidentDate ? new Date(complaint.incidentDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setEditingComplaintId(complaint._id);
    setSelectedComplaint(null);
    setActiveSection('newComplaint');
  };

  const handleDeleteComplaint = (id) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this complaint?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await complaintsAPI.delete(id);
              setMessage('Complaint deleted successfully');
              setSelectedComplaint(null);
              loadComplaints();
              setTimeout(() => setMessage(''), 3000);
            } catch (error) {
              setMessage('Error deleting complaint');
              setTimeout(() => setMessage(''), 3000);
            }
          }
        }
      ]
    );
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



  const formatCategory = (category) => {
    return category.replace('_', ' ').split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatStatus = (status) => {
    return status.replace('_', ' ').split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleLocationChange = (text) => {
    setFormData({ ...formData, location: text });
    if (text) {
      const filtered = BARANGAYS.filter(l => l.toLowerCase().includes(text.toLowerCase()));
      setFilteredLocations(filtered);
      setShowLocationList(true);
    } else {
      setFilteredLocations([]);
      setShowLocationList(false);
    }
  };

  const selectLocation = (location) => {
    setFormData({ ...formData, location: location });
    setShowLocationList(false);
  };

  return (
    <View style={styles.container}>
      <Sidebar
        visible={isSidebarVisible}
        onClose={() => setSidebarVisible(false)}
        onNavigate={setActiveSection}
        activeItem={activeSection}
        userRole="client"
        userName={user?.firstName}
      />

      {/* Streamlined Header */}
      <View style={[styles.header, isLandscape && styles.headerLandscape]}>
        <View style={[styles.headerLeft, isLandscape && styles.headerLeftLandscape]}>
          <TouchableOpacity onPress={() => setSidebarVisible(true)}>
            <Text style={styles.hamburgerIcon}>☰</Text>
          </TouchableOpacity>
          <View style={styles.titleSection}>
            <Text style={styles.headerTitle}>Pedicab Complaint System</Text>
            <Text style={styles.welcomeText}>Welcome, {user?.firstName}</Text>
          </View>
        </View>
        <View style={[styles.headerRight, isLandscape && styles.headerRightLandscape]}>
          <View style={[styles.connectivityStatus, isLandscape && styles.connectivityStatusLandscape]}>
            <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
            <View style={[styles.wifiCircle, isOnline ? styles.online : styles.offline]}>
              <Text style={styles.wifiIcon}>{isOnline ? '📶' : '🚫'}</Text>
            </View>
            <Text style={styles.syncStatus}>{syncStatus}</Text>
          </View>
        </View>
      </View>

      {/* Action Section */}
      {/* Action Section - Removed as it's now in sidebar */}
      {/* 
      <View style={styles.actionSection}>
        <TouchableOpacity 
          style={styles.newComplaintButton}
          onPress={() => setShowForm(!showForm)}
          activeOpacity={0.9}
        >
          <Text style={styles.newComplaintText}>{showForm ? '✕ Cancel' : '+ New Complaint'}</Text>
        </TouchableOpacity>
      </View>
      */}

      {message ? (
        <View style={styles.messageAlert}>
          <Text style={styles.messageText}>{message}</Text>
        </View>
      ) : null}

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ff8c42']} />
        }
      >

        {/* New Complaint Form */}
        {activeSection === 'newComplaint' && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>{editingComplaintId ? 'Edit Complaint' : 'Submit New Complaint'}</Text>

            <View style={styles.formRow}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Franchise Number (4 digits) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 1234"
                  placeholderTextColor="#999"
                  value={formData.franchiseNumber}
                  onChangeText={(text) => setFormData({ ...formData, franchiseNumber: text })}
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>

              <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Category *</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                    style={styles.picker}
                  >
                    <Picker.Item label="Overcharging" value="overcharging" />
                    <Picker.Item label="Rude Behavior" value="rude_behavior" />
                    <Picker.Item label="Reckless Driving" value="reckless_driving" />
                    <Picker.Item label="Refusal of Service" value="refusal_of_service" />
                    <Picker.Item label="Vehicle Condition" value="vehicle_condition" />
                    <Picker.Item label="Sexual Harassment" value="sexual_harassment" />
                    <Picker.Item label="Other" value="other" />
                  </Picker>
                </View>
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Incident Date *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#999"
                  value={formData.incidentDate}
                  onChangeText={(text) => setFormData({ ...formData, incidentDate: text })}
                />
              </View>

              <View style={[styles.inputContainer, { flex: 1, marginLeft: 8, zIndex: 1000 }]}>
                <Text style={styles.label}>Location *</Text>
                <View style={{ position: 'relative' }}>
                  <TextInput
                    style={styles.input}
                    placeholder="Where did it occur?"
                    placeholderTextColor="#999"
                    value={formData.location}
                    onChangeText={handleLocationChange}
                    onFocus={() => {
                      if (formData.location) setShowLocationList(true);
                    }}
                  />
                  {showLocationList && filteredLocations.length > 0 && (
                    <View style={styles.mobileDropdown}>
                      <ScrollView style={{ maxHeight: 150 }} keyboardShouldPersistTaps="handled">
                        {filteredLocations.map((loc, index) => (
                          <TouchableOpacity
                            key={index}
                            onPress={() => selectLocation(loc)}
                            style={styles.mobileDropdownItem}
                          >
                            <Text style={styles.mobileDropdownText}>{loc}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe the incident in detail..."
                placeholderTextColor="#999"
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={4}
              />
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} activeOpacity={0.9}>
              <Text style={styles.submitButtonText}>{editingComplaintId ? 'Update Complaint' : 'Submit Complaint'}</Text>
            </TouchableOpacity>

            {editingComplaintId && (
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: '#757575', marginTop: 10 }]}
                onPress={() => {
                  setEditingComplaintId(null);
                  setFormData({
                    franchiseNumber: '',
                    description: '',
                    category: 'overcharging',
                    location: '',
                    incidentDate: new Date().toISOString().split('T')[0]
                  });
                  setActiveSection('myComplaints');
                }}
                activeOpacity={0.9}
              >
                <Text style={styles.submitButtonText}>Cancel Edit</Text>
              </TouchableOpacity>
            )}
          </View>
        )}



        {/* My Complaints History Section */}
        {activeSection === 'myComplaints' && (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>Complaint History</Text>

            {complaints.length === 0 ? (
              <View style={styles.noComplaints}>
                <Text style={styles.noComplaintsText}>No complaints submitted yet.</Text>
              </View>
            ) : (
              <View>
                {/* Table Header */}
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderText, { flex: 0.8 }]}>Franchise</Text>
                  <Text style={[styles.tableHeaderText, { flex: 1 }]}>Type</Text>
                  <Text style={[styles.tableHeaderText, { flex: 1 }]}>Status</Text>
                  <Text style={[styles.tableHeaderText, { flex: 1.2 }]}>Submitted</Text>
                </View>

                {/* Table Rows */}
                {complaints.map((complaint) => (
                  <TouchableOpacity
                    key={complaint._id}
                    style={styles.tableRow}
                    onPress={() => setSelectedComplaint(complaint)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.tableCell, { flex: 0.8 }]}>{complaint.franchiseNumber}</Text>
                    <Text style={[styles.tableCell, { flex: 1 }]} numberOfLines={1}>
                      {formatCategory(complaint.category)}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <View style={[styles.compactStatusBadge, { backgroundColor: getStatusColor(complaint.status) }]}>
                        <Text style={styles.compactStatusText} numberOfLines={1}>
                          {formatStatus(complaint.status)}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.tableCell, { flex: 1.2, fontSize: 11 }]}>
                      {new Date(complaint.createdAt).toLocaleDateString()}{'\n'}
                      {new Date(complaint.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Profile Section */}
        {activeSection === 'profile' && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>My Profile</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Name:</Text>
              <Text style={styles.detailValue}>{user.firstName} {user.lastName}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email:</Text>
              <Text style={styles.detailValue}>{user.email}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Role:</Text>
              <Text style={styles.detailValue}>{user.role}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Complaints:</Text>
              <Text style={styles.detailValue}>{complaints.length}</Text>
            </View>

            <TouchableOpacity onPress={logout} style={[styles.submitButton, { backgroundColor: '#d32f2f', marginTop: 30 }]}>
              <Text style={styles.submitButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Complaint Detail Modal */}
      <Modal
        visible={selectedComplaint !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedComplaint(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Complaint Details</Text>
              <TouchableOpacity onPress={() => setSelectedComplaint(null)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedComplaint && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={true}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Complaint Number:</Text>
                  <Text style={styles.detailValue}>{selectedComplaint.complaintNumber}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Franchise Number:</Text>
                  <Text style={styles.detailValue}>{selectedComplaint.franchiseNumber}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Category:</Text>
                  <Text style={styles.detailValue}>{formatCategory(selectedComplaint.category)}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <View style={[styles.compactStatusBadge, { backgroundColor: getStatusColor(selectedComplaint.status) }]}>
                    <Text style={styles.compactStatusText}>{formatStatus(selectedComplaint.status)}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Incident Date:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedComplaint.incidentDate).toLocaleDateString()}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Location:</Text>
                  <Text style={styles.detailValue}>{selectedComplaint.location}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Submitted:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedComplaint.createdAt).toLocaleString()}
                  </Text>
                </View>

                <View style={styles.detailFull}>
                  <Text style={styles.detailLabel}>Description:</Text>
                  <Text style={styles.descriptionBox}>{selectedComplaint.description}</Text>
                </View>

                {selectedComplaint.status === 'submitted' && (
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20, gap: 10 }}>
                    <TouchableOpacity
                      style={[styles.compactStatusBadge, { backgroundColor: '#757575', padding: 10 }]}
                      onPress={() => handleEditComplaint(selectedComplaint)}
                    >
                      <Text style={[styles.compactStatusText, { fontSize: 14 }]}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.compactStatusBadge, { backgroundColor: '#d32f2f', padding: 10 }]}
                      onPress={() => handleDeleteComplaint(selectedComplaint._id)}
                    >
                      <Text style={[styles.compactStatusText, { fontSize: 14 }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                )}
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

  // Header Styles
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
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerLeftLandscape: { flex: 2 },
  hamburgerIcon: { fontSize: 30, marginRight: 15, color: 'white', fontWeight: 'bold' },
  iconEmoji: { fontSize: 45, marginRight: 12 },
  titleSection: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: 'white' },
  welcomeText: { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 2 },
  headerRight: { alignItems: 'flex-end' },
  headerRightLandscape: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  connectivityStatus: { alignItems: 'center', marginBottom: 12 },
  connectivityStatusLandscape: { flexDirection: 'row', alignItems: 'center', marginBottom: 0, gap: 8 },
  statusText: { fontSize: 10, color: 'white', marginBottom: 5 },
  wifiCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  online: { backgroundColor: '#4caf50' },
  offline: { backgroundColor: '#f44336' },
  wifiIcon: { fontSize: 18 },
  syncStatus: { fontSize: 9, color: 'rgba(255,255,255,0.8)' },
  logoutButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
  },
  logoutText: { color: 'white', fontSize: 12, fontWeight: 'bold' },

  // Action Section
  actionSection: { padding: 15, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  newComplaintButton: {
    backgroundColor: '#ff8c42',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#ff8c42',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  newComplaintText: { color: 'white', fontSize: 15, fontWeight: 'bold' },

  // Message Alert
  messageAlert: {
    backgroundColor: '#fff3e0',
    padding: 12,
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ff8c42',
  },
  messageText: { color: '#ff8c42', fontSize: 13, fontWeight: '500' },

  // Content
  content: { flex: 1 },

  // Form Card
  formCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    margin: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  formTitle: { fontSize: 19, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  formRow: { flexDirection: 'row' },
  inputContainer: { marginBottom: 15 },
  label: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 6 },
  input: {
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  pickerWrapper: {
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: { backgroundColor: 'transparent', color: '#333' },
  submitButton: {
    backgroundColor: '#ff8c42',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#ff8c42',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },

  // History Section
  historySection: { margin: 15 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  noComplaints: {
    backgroundColor: 'white',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  noComplaintsText: { fontSize: 15, color: '#999' },

  // Table Styles
  tableHeader: {
    backgroundColor: '#ff8c42',
    padding: 12,
    flexDirection: 'row',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  tableHeaderText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  tableRow: {
    backgroundColor: 'white',
    padding: 12,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  tableCell: { fontSize: 12, color: '#333' },
  compactStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  compactStatusText: { color: 'white', fontSize: 10, fontWeight: 'bold' },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  modalClose: { fontSize: 28, color: '#999', fontWeight: 'bold' },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  detailRow: { marginBottom: 15 },
  detailLabel: { fontSize: 13, fontWeight: 'bold', color: '#666', marginBottom: 4 },
  detailValue: { fontSize: 15, color: '#333' },
  detailFull: { marginBottom: 15 },
  descriptionBox: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginTop: 8,
  },
  mobileDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 2000,
  },
  mobileDropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  mobileDropdownText: {
    fontSize: 14,
    color: '#333',
  },
});

export default ClientHomeScreen;
