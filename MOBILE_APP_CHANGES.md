# Mobile App Implementation Guide
**Based on Web Frontend Changes**
**Date:** January 28, 2026

---

## 📍 Location Selection - Autocomplete (Latest Update)

### 1. Predefined Barangays List
Create `src/utils/locations.js`:
```javascript
export const BARANGAYS = [
    'Bagacay', 'Bajumpandan', 'Balugo', 'Banilad', 'Bantayan', ...
];
```

### 2. Searchable Location Picker
**NEW (replacing free text):**
```javascript
const [filteredLocations, setFilteredLocations] = useState([]);
const [showLocationList, setShowLocationList] = useState(false);

const handleLocationChange = (text) => {
  setFormData({...formData, location: text});
  if (text.length > 0) {
    const filtered = BARANGAYS.filter(b => 
      b.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredLocations(filtered);
    setShowLocationList(true);
  } else {
    setShowLocationList(false);
  }
};
// TIP: Use zIndex: 1000 on the wrapper container to ensure the dropdown overlays other elements
```

---

## 🤖 Android Build System Optimization

### 1. Gradle 8.3 Compatibility
Update `android/build.gradle`:
```gradle
allprojects {
    repositories {
        maven { url("$rootDir/../node_modules/react-native/android") }
        google()
        mavenCentral()
        maven { url 'https://www.jitpack.io' }
    }
    // Modern syntax for build redirection
    layout.buildDirectory.set(file("C:/tmp/build/${rootProject.name}/${project.name}"))
}
```

---

## 🎨 Theme Changes - Apply to All Screens

### Color Palette Update
**OLD THEME (Purple):**
```javascript
primaryColor: '#667eea'
secondaryColor: '#764ba2'
```

**NEW THEME (Orange-Beige):**
```javascript
primaryColor: '#ff8c42'    // Orange
secondaryColor: '#f4a261'  // Beige
gradient: ['#ff8c42', '#f4a261']  // For gradient backgrounds
```

### Where to Apply:
- All button backgrounds
- Header/navbar backgrounds
- Status badges
- Active tab indicators
- Input focus borders
- Card accents
- Loading indicators

---

## 📱 Header/Navigation Changes - All Screens

### Streamlined Header Design

**Current Structure:**
- Simple title bar with logout

**New Structure (3 sections):**

```javascript
// Left Section
<View style={styles.headerLeft}>
  <PedicabIcon size={24} color="#fff" />
  <View>
    <Text style={styles.appName}>Pedicab Complaint System</Text>
    <Text style={styles.welcomeText}>Welcome, {user.firstName}</Text>
  </View>
</View>

// Right Section
<View style={styles.headerRight}>
  <View style={styles.connectivityStatus}>
    {isOnline ? (
      <>
        <Icon name="wifi" color="#4ade80" />
        <Text style={styles.statusText}>Online</Text>
      </>
    ) : (
      <>
        <Icon name="wifi-off" color="#ef4444" />
        <Text style={styles.statusText}>Offline</Text>
      </>
    )}
    <Text style={styles.syncStatus}>{syncStatus}</Text>
  </View>
  <TouchableOpacity onPress={logout}>
    <Text style={styles.signOutButton}>Sign Out</Text>
  </TouchableOpacity>
</View>
```

### Required State Variables:
```javascript
const [isOnline, setIsOnline] = useState(true);
const [syncStatus, setSyncStatus] = useState('synced');
```

### Network Monitoring (React Native):
```javascript
import NetInfo from '@react-native-community/netinfo';

useEffect(() => {
  const unsubscribe = NetInfo.addEventListener(state => {
    setIsOnline(state.isConnected);
    setSyncStatus(state.isConnected ? 'synced' : 'unable to sync');
  });
  
  return () => unsubscribe();
}, []);
```

### Sync Status Updates:
```javascript
// Before API calls
setSyncStatus('syncing...');

// After successful API calls
setSyncStatus('synced');

// On error
setSyncStatus('unable to sync');
```

---

## 🙋 Client Screen Changes

### 1. Franchise Number Input - Validation Update

**OLD:**
```javascript
<TextInput
  placeholder="Franchise Number (e.g., FR-2024-001)"
  value={formData.franchiseNumber}
  onChangeText={(text) => setFormData({...formData, franchiseNumber: text})}
/>
```

**NEW:**
```javascript
<TextInput
  placeholder="Franchise Number (4 digits, e.g., 1006)"
  value={formData.franchiseNumber}
  keyboardType="numeric"
  maxLength={4}
  onChangeText={(text) => {
    // Only allow digits
    const digits = text.replace(/[^0-9]/g, '');
    setFormData({...formData, franchiseNumber: digits});
  }}
/>

// Validation before submit:
if (formData.franchiseNumber.length !== 4) {
  Alert.alert('Error', 'Franchise number must be exactly 4 digits');
  return;
}
```

### 2. Remove Vehicle Number Field

**DELETE THIS:**
```javascript
<TextInput
  placeholder="Vehicle Number"
  value={formData.vehicleNumber}
  onChangeText={(text) => setFormData({...formData, vehicleNumber: text})}
/>
```

**UPDATE formData initialization:**
```javascript
const [formData, setFormData] = useState({
  franchiseNumber: '',
  category: '',
  location: '',
  incidentDate: new Date(),
  description: ''
  // REMOVED: vehicleNumber
});
```

### 3. Complaint History - Table/List View

**OLD:** Large cards showing all details

**NEW:** Compact list with tap-to-expand

```javascript
// Compact List Item
<TouchableOpacity 
  style={styles.complaintRow}
  onPress={() => setSelectedComplaint(complaint)}
>
  <View style={styles.rowCell}>
    <Text style={styles.franchiseNumber}>{complaint.franchiseNumber}</Text>
  </View>
  <View style={styles.rowCell}>
    <Text style={styles.category}>{complaint.category}</Text>
  </View>
  <View style={styles.rowCell}>
    <View style={[styles.statusBadge, {backgroundColor: getStatusColor(complaint.status)}]}>
      <Text style={styles.statusText}>{complaint.status}</Text>
    </View>
  </View>
  <View style={styles.rowCell}>
    <Text style={styles.timestamp}>
      {new Date(complaint.createdAt).toLocaleString()}
    </Text>
  </View>
  <View style={styles.rowCell}>
    <Text style={styles.description} numberOfLines={1}>
      {complaint.description}
    </Text>
  </View>
</TouchableOpacity>

// Modal for Full Details
<Modal visible={selectedComplaint !== null}>
  <View style={styles.modalContent}>
    <Text style={styles.modalTitle}>Complaint Details</Text>
    <Text>Complaint #: {selectedComplaint?.complaintNumber}</Text>
    <Text>Franchise: {selectedComplaint?.franchiseNumber}</Text>
    <Text>Category: {selectedComplaint?.category}</Text>
    <Text>Status: {selectedComplaint?.status}</Text>
    <Text>Location: {selectedComplaint?.location}</Text>
    <Text>Date: {new Date(selectedComplaint?.incidentDate).toLocaleString()}</Text>
    <Text>Description: {selectedComplaint?.description}</Text>
    <TouchableOpacity onPress={() => setSelectedComplaint(null)}>
      <Text style={styles.closeButton}>Close</Text>
    </TouchableOpacity>
  </View>
</Modal>
```

---

## 🔍 Enforcer Screen Changes

### 1. Quest Card System - Expandable Investigations

**NEW:** Compact cards with tap-to-expand

```javascript
const [expandedInvestigation, setExpandedInvestigation] = useState(null);

// Compact Card
<TouchableOpacity
  style={styles.questCard}
  onPress={() => setExpandedInvestigation(
    expandedInvestigation === investigation._id ? null : investigation._id
  )}
>
  <View style={styles.questHeader}>
    <View>
      <Text style={styles.investigationNumber}>
        {investigation.investigationNumber}
      </Text>
      <Text style={styles.franchiseInfo}>
        Franchise: {investigation.franchiseNumber || investigation.complaint?.franchiseNumber} • 
        {investigation.complaint?.category 
          ? investigation.complaint.category.replace('_', ' ')
          : 'Manual Investigation'}
      </Text>
    </View>
    <View style={[styles.statusBadge, {backgroundColor: getStatusColor(investigation.status)}]}>
      <Text>{investigation.status.toUpperCase()}</Text>
    </View>
  </View>

  {/* Expanded Details */}
  {expandedInvestigation === investigation._id && (
    <View style={styles.questDetails}>
      {investigation.complaint && (
        <>
          <Text>Complaint: {investigation.complaint.complaintNumber}</Text>
          <Text>Location: {investigation.complaint.location}</Text>
        </>
      )}
      <Text style={styles.descriptionTitle}>Description:</Text>
      <Text>{investigation.description || investigation.complaint?.description}</Text>
      
      <Text style={styles.instructionsTitle}>Instructions:</Text>
      <Text style={styles.instructions}>
        {investigation.instructions || 'No specific instructions provided'}
      </Text>
      
      <TouchableOpacity 
        style={styles.acceptButton}
        onPress={() => handleAcceptInvestigation(investigation._id)}
      >
        <Text style={styles.acceptButtonText}>Accept Quest</Text>
      </TouchableOpacity>
    </View>
  )}
</TouchableOpacity>
```

### 2. Photo Upload - Per Violation

**OLD:** Global photo upload section

**NEW:** Photo upload under each violation checkbox

```javascript
// Violation Checkbox with Photo Upload
<View style={styles.violationItem}>
  <View style={styles.violationHeader}>
    <CheckBox
      value={ticketForm.violations[violationType]?.checked}
      onValueChange={(checked) => handleViolationChange(violationType, checked)}
    />
    <Text style={styles.violationLabel}>
      {formatViolationType(violationType)}
    </Text>
  </View>

  {ticketForm.violations[violationType]?.checked && (
    <View style={styles.violationDetails}>
      <TextInput
        placeholder="Notes for this violation..."
        value={ticketForm.violations[violationType]?.notes}
        onChangeText={(text) => handleNotesChange(violationType, text)}
        multiline
      />
      
      {/* Photo Upload Section */}
      <TouchableOpacity
        style={styles.uploadButton}
        onPress={() => handlePhotoUpload(violationType)}
      >
        <Icon name="camera" />
        <Text>Add Photos</Text>
      </TouchableOpacity>

      {/* Photo Previews */}
      {ticketForm.violations[violationType]?.photos?.length > 0 && (
        <View style={styles.photoGrid}>
          {ticketForm.violations[violationType].photos.map((photo, index) => (
            <View key={index} style={styles.photoThumbnail}>
              <Image 
                source={{uri: photo.uri}} 
                style={styles.thumbnailImage}
              />
              <TouchableOpacity
                style={styles.removePhoto}
                onPress={() => handleRemovePhoto(violationType, index)}
              >
                <Icon name="close" color="red" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  )}
</View>
```

### 3. Photo Upload Handler

```javascript
import ImagePicker from 'react-native-image-picker';
import RNFS from 'react-native-fs';

const handlePhotoUpload = async (violationType) => {
  const options = {
    mediaType: 'photo',
    quality: 0.8,
    maxWidth: 1920,
    maxHeight: 1920,
  };

  ImagePicker.launchCamera(options, async (response) => {
    if (response.didCancel) return;
    if (response.error) {
      Alert.alert('Error', 'Failed to take photo');
      return;
    }

    // Convert to base64
    const base64 = await RNFS.readFile(response.assets[0].uri, 'base64');
    const photo = {
      uri: `data:image/jpeg;base64,${base64}`,
      name: response.assets[0].fileName,
      preview: `data:image/jpeg;base64,${base64}`
    };

    // Add to violation
    setTicketForm(prev => ({
      ...prev,
      violations: {
        ...prev.violations,
        [violationType]: {
          ...prev.violations[violationType],
          photos: [...(prev.violations[violationType]?.photos || []), photo]
        }
      }
    }));
  });
};
```

### 4. Ticket Submission Update

**OLD:**
```javascript
const ticketData = {
  investigationId,
  violations: checkedViolations,
  additionalNotes,
  evidence: allPhotos  // Global evidence array
};
```

**NEW:**
```javascript
const ticketData = {
  investigationId,
  violations: checkedViolations.map(v => ({
    type: v.type,
    notes: v.notes,
    photos: v.photos.map(p => ({
      url: p.preview,  // base64 string
      description: p.name
    }))
  })),
  additionalNotes
  // NO global evidence array
};
```

### 5. My Tickets Tab - New Feature

**ADD NEW TAB:**

```javascript
// Tab Navigation
<Tab.Navigator>
  <Tab.Screen name="Available" component={AvailableInvestigations} />
  <Tab.Screen name="My Investigations" component={MyInvestigations} />
  <Tab.Screen name="My Tickets" component={MyTickets} />  {/* NEW */}
  <Tab.Screen name="Franchises" component={Franchises} />
</Tab.Navigator>

// My Tickets Screen
const MyTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    loadMyTickets();
  }, []);

  const loadMyTickets = async () => {
    const response = await ticketsAPI.getAll();
    setTickets(response.data.tickets);
  };

  return (
    <View>
      <FlatList
        data={tickets}
        renderItem={({item}) => (
          <TouchableOpacity
            style={styles.ticketCard}
            onPress={() => setSelectedTicket(item)}
          >
            <Text style={styles.ticketNumber}>{item.ticketNumber}</Text>
            <Text>Investigation: {item.investigation.investigationNumber}</Text>
            <Text>Franchise: {item.franchiseNumber}</Text>
            <View style={[styles.statusBadge, {backgroundColor: getStatusColor(item.status)}]}>
              <Text>{item.status.toUpperCase()}</Text>
            </View>
            <Text>{new Date(item.createdAt).toLocaleString()}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Ticket Detail Modal */}
      <Modal visible={selectedTicket !== null}>
        <ScrollView style={styles.modalContent}>
          <Text style={styles.modalTitle}>Ticket Details</Text>
          
          <Text>Violations Reported:</Text>
          {selectedTicket?.violations.map((violation, index) => (
            <View key={index} style={styles.violationDetail}>
              <Text style={styles.violationType}>{violation.type}</Text>
              {violation.notes && <Text>{violation.notes}</Text>}
              
              {/* Photos for this violation */}
              {violation.photos?.length > 0 && (
                <View style={styles.photoGrid}>
                  {violation.photos.map((photo, i) => (
                    <Image 
                      key={i}
                      source={{uri: photo.url}}
                      style={styles.evidencePhoto}
                    />
                  ))}
                </View>
              )}
            </View>
          ))}

          {selectedTicket?.additionalNotes && (
            <View>
              <Text>Additional Notes:</Text>
              <Text>{selectedTicket.additionalNotes}</Text>
            </View>
          )}

          <TouchableOpacity onPress={() => setSelectedTicket(null)}>
            <Text style={styles.closeButton}>Close</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </View>
  );
};
```

---

## 👨‍💼 Admin Screen Changes

### 1. Two-Step Complaint Workflow

**UPDATE Complaint Detail Modal:**

```javascript
<Modal visible={selectedComplaint !== null}>
  <View style={styles.modalContent}>
    <Text>Complaint Details</Text>
    {/* ... complaint info ... */}

    {/* Step 1: Accept/Reject */}
    {selectedComplaint?.status === 'submitted' && (
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.button, styles.acceptButton]}
          onPress={() => handleAcceptComplaint(selectedComplaint._id)}
        >
          <Text>✓ Accept Complaint</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.rejectButton]}
          onPress={() => handleRejectComplaint(selectedComplaint._id)}
        >
          <Text>✕ Reject</Text>
        </TouchableOpacity>
      </View>
    )}

    {/* Step 2: Create Investigation */}
    {selectedComplaint?.status === 'under_review' && (
      <TouchableOpacity
        style={[styles.button, styles.investigateButton]}
        onPress={() => handleCreateInvestigation(selectedComplaint)}
      >
        <Text>🔍 Create Investigation Request</Text>
      </TouchableOpacity>
    )}
  </View>
</Modal>

// Handlers
const handleAcceptComplaint = async (id) => {
  await complaintsAPI.updateStatus(id, 'under_review');
  loadComplaints();
};

const handleCreateInvestigation = async (complaint) => {
  const investigationData = {
    franchiseNumber: complaint.franchiseNumber,
    complaintId: complaint._id,
    description: complaint.description,
    instructions: `1. Locate and visit franchise #${complaint.franchiseNumber}
2. Document all violations using photos and the checklist
3. Interview the operator if present
4. Submit a detailed ticket with all findings and evidence`
  };
  
  await investigationsAPI.create(investigationData);
  await complaintsAPI.updateStatus(complaint._id, 'investigating');
  loadComplaints();
};
```

### 2. Manual Investigation Creation

**ADD NEW FORM:**

```javascript
const [showManualForm, setShowManualForm] = useState(false);
const [manualForm, setManualForm] = useState({
  franchiseNumber: '',
  description: '',
  instructions: ''
});

// Manual Investigation Form
<Modal visible={showManualForm}>
  <View style={styles.formContainer}>
    <Text style={styles.formTitle}>Create Manual Investigation</Text>
    
    <TextInput
      placeholder="Franchise Number (4 digits)"
      value={manualForm.franchiseNumber}
      keyboardType="numeric"
      maxLength={4}
      onChangeText={(text) => setManualForm({...manualForm, franchiseNumber: text})}
    />
    
    <TextInput
      placeholder="Investigation Description"
      value={manualForm.description}
      multiline
      onChangeText={(text) => setManualForm({...manualForm, description: text})}
    />
    
    <TextInput
      placeholder="Specific Instructions for Enforcer"
      value={manualForm.instructions}
      multiline
      onChangeText={(text) => setManualForm({...manualForm, instructions: text})}
    />
    
    <TouchableOpacity
      style={styles.submitButton}
      onPress={handleCreateManualInvestigation}
    >
      <Text>Create Investigation</Text>
    </TouchableOpacity>
  </View>
</Modal>

const handleCreateManualInvestigation = async () => {
  if (manualForm.franchiseNumber.length !== 4) {
    Alert.alert('Error', 'Franchise number must be 4 digits');
    return;
  }
  
  await investigationsAPI.create({
    ...manualForm,
    complaintId: null  // No linked complaint
  });
  
  setShowManualForm(false);
  setManualForm({franchiseNumber: '', description: '', instructions: ''});
  loadInvestigations();
};
```

### 3. Ticket Photo Viewer

**UPDATE Ticket Detail Modal:**

```javascript
const [selectedImage, setSelectedImage] = useState(null);

// Ticket Detail
<Modal visible={selectedTicket !== null}>
  <ScrollView>
    {selectedTicket?.violations.map((violation, index) => (
      <View key={index} style={styles.violationCard}>
        <Text style={styles.violationType}>✓ {violation.type}</Text>
        {violation.notes && <Text>{violation.notes}</Text>}
        
        {/* Photos grouped by violation */}
        {violation.photos?.length > 0 && (
          <View style={styles.photoSection}>
            <Text>Evidence Photos ({violation.photos.length}):</Text>
            <View style={styles.photoGrid}>
              {violation.photos.map((photo, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setSelectedImage(photo.url)}
                >
                  <Image
                    source={{uri: photo.url}}
                    style={styles.thumbnail}  // 80x80
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    ))}
  </ScrollView>
</Modal>

{/* Full-Size Image Viewer */}
<Modal visible={selectedImage !== null} transparent>
  <TouchableOpacity
    style={styles.imageViewerOverlay}
    onPress={() => setSelectedImage(null)}
  >
    <Image
      source={{uri: selectedImage}}
      style={styles.fullSizeImage}
      resizeMode="contain"
    />
  </TouchableOpacity>
</Modal>
```

---

## 📦 Required Dependencies

Add these to `package.json`:

```json
{
  "dependencies": {
    "@react-native-community/netinfo": "^11.0.0",
    "react-native-image-picker": "^7.0.0",
    "react-native-fs": "^2.20.0"
  }
}
```

Install:
```bash
npm install @react-native-community/netinfo react-native-image-picker react-native-fs
cd ios && pod install && cd ..
```

---

## 🎨 Styling Constants

Add to `styles.js` or theme file:

```javascript
export const Colors = {
  primary: '#ff8c42',
  secondary: '#f4a261',
  success: '#4ade80',
  error: '#ef4444',
  warning: '#fbbf24',
  
  // Status colors
  submitted: '#ff8c42',
  under_review: '#ff8c42',
  investigating: '#f97316',
  resolved: '#4ade80',
  rejected: '#ef4444',
  
  // Background
  background: '#f9fafb',
  cardBackground: '#ffffff',
  
  // Text
  textPrimary: '#1f2937',
  textSecondary: '#6b7280',
  textLight: '#9ca3af'
};

export const Gradients = {
  primary: ['#ff8c42', '#f4a261'],
  header: ['#ff8c42', '#f4a261']
};
```

---

## ⚙️ Backend Configuration

**IMPORTANT:** Backend must be configured:

1. **Update server.js payload limits:**
```javascript
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
```

2. **Ticket model - complaint is optional:**
```javascript
complaint: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Complaint',
  required: false  // Changed from true
}
```

3. **Ticket model - violations with photos:**
```javascript
violations: [{
  type: String,
  notes: String,
  photos: [{
    url: String,
    description: String,
    uploadedAt: Date
  }]
}]
```

---

## 🔍 Data Structure Changes

### Ticket Submission Format

**OLD:**
```javascript
{
  investigationId: "...",
  violations: [
    {type: "Missing Headlights", notes: "..."}
  ],
  evidence: [  // Global array
    {url: "data:image...", description: "Photo 1"}
  ]
}
```

**NEW:**
```javascript
{
  investigationId: "...",
  violations: [
    {
      type: "Missing Headlights",
      notes: "...",
      photos: [  // Per violation
        {url: "data:image...", description: "Photo 1"}
      ]
    }
  ],
  additionalNotes: "..."
  // NO global evidence array
}
```

### Investigation Display

**Handle both types:**
```javascript
// Franchise number
const franchiseNumber = investigation.franchiseNumber || investigation.complaint?.franchiseNumber;

// Category
const category = investigation.complaint?.category 
  ? formatCategory(investigation.complaint.category)
  : 'Manual Investigation';
```

---

## 🧪 Testing Checklist

### Client App
- [ ] Can submit complaint with 4-digit franchise number
- [ ] Cannot submit with invalid franchise number
- [ ] Complaint history shows compact list
- [ ] Tap complaint opens detail modal
- [ ] Status badges show correct colors
- [ ] Online/offline status updates
- [ ] Sync status shows during API calls

### Enforcer App
- [ ] Available investigations show correctly
- [ ] Both complaint-linked and manual investigations display
- [ ] Tap to expand quest cards
- [ ] Can accept investigations
- [ ] Photo upload works per violation
- [ ] Photo thumbnails display correctly
- [ ] Can submit ticket with photos
- [ ] My Tickets tab shows submissions
- [ ] Tap ticket shows detail with photos grouped

### Admin App
- [ ] Can accept/reject complaints
- [ ] Can create investigation from complaint
- [ ] Can create manual investigation
- [ ] Manual investigation form validates 4 digits
- [ ] Ticket details show violations with photos
- [ ] Can tap photo to view full size
- [ ] Full-size image viewer works
- [ ] Can forward tickets
- [ ] Status updates correctly

---

## 🚨 Known Issues & Solutions

### Issue 1: Base64 Images Too Large
**Problem:** App crashes with large images
**Solution:** Compress images before converting to base64
```javascript
import ImageResizer from 'react-native-image-resizer';

const resized = await ImageResizer.createResizedImage(
  photo.uri,
  1920,
  1920,
  'JPEG',
  80  // quality
);
```

### Issue 2: Manual Investigations Not Showing
**Problem:** Franchise number shows as undefined
**Solution:** Use fallback pattern
```javascript
investigation.franchiseNumber || investigation.complaint?.franchiseNumber
```

### Issue 3: Old JWT Tokens
**Problem:** 403 Permission denied after backend changes
**Solution:** User must logout and login again to get fresh token

---

## 📋 Summary of Key Changes

1. **Theme:** Purple → Orange-Beige (#ff8c42, #f4a261)
2. **Header:** Added connectivity status and sync indicator
3. **Franchise Number:** Free text → 4-digit validation
4. **Vehicle Number:** Removed completely
5. **Complaint View:** Large cards → Compact list with tap-to-expand
6. **Quest Cards:** Added expandable investigation cards
7. **Photo Upload:** Global → Per violation
8. **My Tickets:** New tab added for enforcers
9. **Manual Investigations:** Support for non-complaint investigations
10. **Photo Viewer:** Full-size modal viewer for evidence
11. **Two-Step Workflow:** Accept complaint → Create investigation
12. **Backend:** 50MB payload limit, optional complaint field

---

**Implementation Priority:**
1. Theme changes (visual, non-breaking)
2. Header/connectivity (UI enhancement)
3. Franchise number validation (data integrity)
4. Photo per violation (core feature)
5. My Tickets tab (new feature)
6. Manual investigation support (workflow enhancement)

**Estimated Effort:** 2-3 days for full implementation

---

## 📊 Local Database Implementation - Franchise Data

### Requirement
The mobile app needs offline-first capability with local franchise database that can:
- Work across multiple devices
- Be imported/exported
- Sync with central MongoDB
- Provide fast search without network

### Recommended Solutions

**✅ CHOSEN SOLUTION: SQLite (Option 2)**
- Implementing on both mobile app AND web frontend
- Best performance with image storage support
- Full CRUD operations with offline-first architecture
- CSV import/export for cross-device sharing

---

#### Option 1: CSV + AsyncStorage (Simplest)
**Use Case:** Read-only franchise lookup
**Status:** ❌ Not selected (limited functionality)

```javascript
import RNFS from 'react-native-fs';
import Papa from 'papaparse';

// Store CSV in assets
const FRANCHISE_CSV_PATH = `${RNFS.DocumentDirectoryPath}/franchises.csv`;

// Load CSV on app start
const loadFranchisesFromCSV = async () => {
  try {
    const csvData = await RNFS.readFile(FRANCHISE_CSV_PATH, 'utf8');
    const parsed = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true
    });
    
    // Store in AsyncStorage for quick access
    await AsyncStorage.setItem('franchises', JSON.stringify(parsed.data));
    return parsed.data;
  } catch (error) {
    console.error('Failed to load franchises:', error);
    return [];
  }
};

// Search franchises locally
const searchFranchises = async (query) => {
  const franchises = JSON.parse(await AsyncStorage.getItem('franchises') || '[]');
  return franchises.filter(f => 
    f.franchiseNumber.includes(query) ||
    f.ownerName.toLowerCase().includes(query.toLowerCase()) ||
    f.licenseNumber.includes(query)
  );
};

// Export franchises to CSV (for sharing between devices)
const exportFranchisesToCSV = async (franchises) => {
  const csv = Papa.unparse(franchises);
  const path = `${RNFS.DownloadDirectoryPath}/franchises_${Date.now()}.csv`;
  await RNFS.writeFile(path, csv, 'utf8');
  return path;
};

// Import CSV from device
const importFranchisesFromFile = async (filePath) => {
  const csvData = await RNFS.readFile(filePath, 'utf8');
  const parsed = Papa.parse(csvData, { header: true });
  await AsyncStorage.setItem('franchises', JSON.stringify(parsed.data));
  return parsed.data;
};
```

**CSV Format:**
```csv
franchiseNumber,ownerName,contactNumber,address,vehicleCount,licenseNumber,status
1001,Juan Dela Cruz,09171234567,Manila City,5,LIC-2024-001,active
1002,Maria Santos,09181234567,Quezon City,3,LIC-2024-002,active
1003,Pedro Garcia,09191234567,Makati City,7,LIC-2024-003,suspended
```

**Dependencies:**
```bash
npm install papaparse react-native-fs
```

#### Option 2: SQLite ✅ SELECTED FOR IMPLEMENTATION
**Use Case:** Full CRUD operations, complex queries, offline-first, image storage
**Platform:** Mobile App + Web Frontend (using sql.js)

```javascript
import SQLite from 'react-native-sqlite-storage';

// Initialize database
const db = SQLite.openDatabase(
  { name: 'pedicab.db', location: 'default' },
  () => console.log('Database opened'),
  error => console.error('Database error:', error)
);

// Create franchises table
const initDatabase = () => {
  db.transaction(tx => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS franchises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        franchiseNumber TEXT UNIQUE NOT NULL,
        ownerName TEXT,
        contactNumber TEXT,
        address TEXT,
        vehicleCount INTEGER,
        licenseNumber TEXT,
        status TEXT,
        lastSynced DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    );
  });
};

// Import franchises from API
const syncFranchisesFromAPI = async () => {
  const response = await franchisesAPI.getAll();
  const franchises = response.data;
  
  db.transaction(tx => {
    franchises.forEach(f => {
      tx.executeSql(
        `INSERT OR REPLACE INTO franchises 
         (franchiseNumber, ownerName, contactNumber, address, vehicleCount, licenseNumber, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [f.franchiseNumber, f.ownerName, f.contactNumber, f.address, 
         f.vehicleCount, f.licenseNumber, f.status]
      );
    });
  });
};

// Search franchises (works offline)
const searchFranchises = (query) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM franchises 
         WHERE franchiseNumber LIKE ? 
         OR ownerName LIKE ? 
         OR licenseNumber LIKE ?`,
        [`%${query}%`, `%${query}%`, `%${query}%`],
        (tx, results) => {
          const franchises = [];
          for (let i = 0; i < results.rows.length; i++) {
            franchises.push(results.rows.item(i));
          }
          resolve(franchises);
        },
        (tx, error) => reject(error)
      );
    });
  });
};

// Export to CSV
const exportDatabaseToCSV = async () => {
  const franchises = await new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM franchises',
        [],
        (tx, results) => {
          const data = [];
          for (let i = 0; i < results.rows.length; i++) {
            data.push(results.rows.item(i));
          }
          resolve(data);
        },
        (tx, error) => reject(error)
      );
    });
  });

  const csv = Papa.unparse(franchises);
  const path = `${RNFS.DownloadDirectoryPath}/franchises_backup_${Date.now()}.csv`;
  await RNFS.writeFile(path, csv, 'utf8');
  return path;
};

// Import from CSV
const importCSVToDatabase = async (filePath) => {
  const csvData = await RNFS.readFile(filePath, 'utf8');
  const parsed = Papa.parse(csvData, { header: true });
  
  db.transaction(tx => {
    parsed.data.forEach(f => {
      tx.executeSql(
        `INSERT OR REPLACE INTO franchises 
         (franchiseNumber, ownerName, contactNumber, address, vehicleCount, licenseNumber, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [f.franchiseNumber, f.ownerName, f.contactNumber, f.address, 
         f.vehicleCount, f.licenseNumber, f.status]
      );
    });
  });
};
```

**Dependencies (Mobile):**
```bash
npm install react-native-sqlite-storage papaparse react-native-fs
```

**Dependencies (Web Frontend):**
```bash
npm install sql.js papaparse
```

**Web Frontend Implementation (sql.js):**
```javascript
import initSqlJs from 'sql.js';

// Initialize SQL.js
let db;
const initDatabase = async () => {
  const SQL = await initSqlJs({
    locateFile: file => `https://sql.js.org/dist/${file}`
  });
  
  // Load from IndexedDB or create new
  const savedDb = localStorage.getItem('franchiseDb');
  if (savedDb) {
    const uint8Array = new Uint8Array(JSON.parse(savedDb));
    db = new SQL.Database(uint8Array);
  } else {
    db = new SQL.Database();
  }
  
  // Create table
  db.run(`
    CREATE TABLE IF NOT EXISTS franchises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      franchiseNumber TEXT UNIQUE NOT NULL,
      ownerName TEXT,
      contactNumber TEXT,
      address TEXT,
      vehicleCount INTEGER,
      licenseNumber TEXT,
      status TEXT,
      photos TEXT,
      lastSynced DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  return db;
};

// Save database to localStorage
const saveDatabase = () => {
  const data = db.export();
  const buffer = JSON.stringify(Array.from(data));
  localStorage.setItem('franchiseDb', buffer);
};

// Add franchises with images
const addFranchises = (franchises) => {
  franchises.forEach(f => {
    const photosJson = JSON.stringify(f.photos || []);
    db.run(
      `INSERT OR REPLACE INTO franchises 
       (franchiseNumber, ownerName, contactNumber, address, vehicleCount, licenseNumber, status, photos)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [f.franchiseNumber, f.ownerName, f.contactNumber, f.address, 
       f.vehicleCount, f.licenseNumber, f.status, photosJson]
    );
  });
  saveDatabase();
};

// Search franchises
const searchFranchises = (query) => {
  const stmt = db.prepare(
    `SELECT * FROM franchises 
     WHERE franchiseNumber LIKE ? 
     OR ownerName LIKE ? 
     OR licenseNumber LIKE ?`
  );
  stmt.bind([`%${query}%`, `%${query}%`, `%${query}%`]);
  
  const results = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    row.photos = JSON.parse(row.photos || '[]');
    results.push(row);
  }
  stmt.free();
  return results;
};

// Export to CSV
const exportToCSV = () => {
  const stmt = db.prepare('SELECT * FROM franchises');
  const franchises = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    // Flatten photos for CSV
    row.photos = JSON.parse(row.photos || '[]').map(p => p.url).join('|');
    franchises.push(row);
  }
  stmt.free();
  
  const csv = Papa.unparse(franchises);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `franchises_${Date.now()}.csv`;
  a.click();
};

// Import from CSV
const importFromCSV = (file) => {
  Papa.parse(file, {
    header: true,
    complete: (results) => {
      results.data.forEach(f => {
        const photos = f.photos ? f.photos.split('|').map(url => ({ url })) : [];
        db.run(
          `INSERT OR REPLACE INTO franchises 
           (franchiseNumber, ownerName, contactNumber, address, vehicleCount, licenseNumber, status, photos)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [f.franchiseNumber, f.ownerName, f.contactNumber, f.address, 
           f.vehicleCount, f.licenseNumber, f.status, JSON.stringify(photos)]
        );
      });
      saveDatabase();
    }
  });
};

// Sync with MongoDB API
const syncWithAPI = async () => {
  try {
    const response = await axios.get('/api/franchises');
    addFranchises(response.data);
    console.log('Franchises synced from API');
  } catch (error) {
    console.error('Sync failed:', error);
  }
};

// Auto-sync every 5 minutes
setInterval(() => {
  if (navigator.onLine) {
    syncWithAPI();
  }
}, 300000);
```

#### Option 3: Realm Database (Advanced - Real-time Sync)
**Status:** ❌ Not selected (overkill for current needs)
**Use Case:** Multi-device sync, offline-first with automatic cloud sync

```javascript
import Realm from 'realm';

// Define schema
const FranchiseSchema = {
  name: 'Franchise',
  primaryKey: 'franchiseNumber',
  properties: {
    franchiseNumber: 'string',
    ownerName: 'string',
    contactNumber: 'string',
    address: 'string',
    vehicleCount: 'int',
    licenseNumber: 'string',
    status: 'string',
    lastSynced: 'date'
  }
};

// Open realm
const realm = await Realm.open({
  schema: [FranchiseSchema],
  schemaVersion: 1
});

// Add franchises
const addFranchises = (franchises) => {
  realm.write(() => {
    franchises.forEach(f => {
      realm.create('Franchise', {
        ...f,
        lastSynced: new Date()
      }, Realm.UpdateMode.Modified);
    });
  });
};

// Query franchises
const searchFranchises = (query) => {
  return realm.objects('Franchise').filtered(
    `franchiseNumber CONTAINS[c] "${query}" OR 
     ownerName CONTAINS[c] "${query}" OR 
     licenseNumber CONTAINS[c] "${query}"`
  );
};

// Export to CSV
const exportToCSV = () => {
  const franchises = realm.objects('Franchise').map(f => ({
    franchiseNumber: f.franchiseNumber,
    ownerName: f.ownerName,
    contactNumber: f.contactNumber,
    address: f.address,
    vehicleCount: f.vehicleCount,
    licenseNumber: f.licenseNumber,
    status: f.status
  }));
  
  const csv = Papa.unparse(franchises);
  // Save to file...
};
```

**Dependencies:**
```bash
npm install realm papaparse
```

### Implementation Strategy

#### Hybrid Approach (Recommended)
1. **Primary Database:** MongoDB (central server)
2. **Local Cache:** SQLite (mobile app)
3. **Data Export/Import:** CSV format

**Workflow:**
```javascript
// On app launch
const initializeApp = async () => {
  initDatabase();
  
  // Check if online
  const isOnline = await NetInfo.fetch().then(state => state.isConnected);
  
  if (isOnline) {
    // Sync from MongoDB
    await syncFranchisesFromAPI();
  } else {
    // Use local SQLite data
    console.log('Offline mode - using cached data');
  }
};

// Periodic sync (when online)
useEffect(() => {
  const syncInterval = setInterval(async () => {
    const isOnline = await NetInfo.fetch().then(state => state.isConnected);
    if (isOnline) {
      await syncFranchisesFromAPI();
    }
  }, 300000); // Every 5 minutes

  return () => clearInterval(syncInterval);
}, []);

// Manual export for device transfer
const handleExportData = async () => {
  const csvPath = await exportDatabaseToCSV();
  Alert.alert('Success', `Data exported to: ${csvPath}`);
  // Can share via WhatsApp, Email, etc.
  Share.open({
    title: 'Share Franchise Database',
    url: `file://${csvPath}`,
    type: 'text/csv'
  });
};

// Manual import from another device
const handleImportData = async () => {
  DocumentPicker.pick({
    type: [DocumentPicker.types.csv]
  }).then(async (file) => {
    await importCSVToDatabase(file.uri);
    Alert.alert('Success', 'Franchise data imported successfully');
  });
};
```

### File Structure
```
mobile-app/
├── assets/
│   └── data/
│       └── franchises_initial.csv    # Initial seed data
├── database/
│   ├── sqlite/
│   │   ├── init.js                   # Database initialization
│   │   ├── franchises.js             # Franchise queries
│   │   └── sync.js                   # Sync logic
│   └── schemas/
│       └── franchise.js              # Data schema
└── utils/
    ├── csvImporter.js                # CSV import/export
    └── dataSync.js                   # Sync manager
```

### Settings Screen - Data Management

```javascript
const SettingsScreen = () => {
  return (
    <View>
      <Text style={styles.sectionTitle}>Data Management</Text>
      
      <TouchableOpacity 
        style={styles.settingItem}
        onPress={syncFranchisesFromAPI}
      >
        <Icon name="refresh" />
        <Text>Sync with Server</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.settingItem}
        onPress={handleExportData}
      >
        <Icon name="download" />
        <Text>Export Franchise Data (CSV)</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.settingItem}
        onPress={handleImportData}
      >
        <Icon name="upload" />
        <Text>Import Franchise Data (CSV)</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.settingItem}
        onPress={clearLocalDatabase}
      >
        <Icon name="trash" />
        <Text>Clear Local Data</Text>
      </TouchableOpacity>

      <View style={styles.infoSection}>
        <Text>Last synced: {lastSyncTime}</Text>
        <Text>Total franchises: {franchiseCount}</Text>
        <Text>Database size: {databaseSize} MB</Text>
      </View>
    </View>
  );
};
```

### Recommended Package Versions
```json
{
  "dependencies": {
    "react-native-sqlite-storage": "^6.0.1",
    "papaparse": "^5.4.1",
    "react-native-fs": "^2.20.0",
    "react-native-share": "^10.0.0",
    "react-native-document-picker": "^9.0.0"
  }
}
```

### Implementation Priority
1. ✅ **Phase 1:** SQLite setup with basic CRUD
2. ✅ **Phase 2:** CSV export/import functionality
3. ✅ **Phase 3:** Sync with MongoDB API
4. ✅ **Phase 4:** Offline-first architecture
5. ✅ **Phase 5:** Data sharing between devices

### Benefits
- **Offline Access:** Franchise lookup works without internet
- **Fast Search:** Local queries are instant
- **Cross-Device:** CSV export/import for easy sharing
- **Backup:** Users can backup their data
- **Sync:** Automatic sync when online
- **Scalability:** Can handle thousands of franchise records

---

**Implementation Effort:** 1-2 days for full local database system
