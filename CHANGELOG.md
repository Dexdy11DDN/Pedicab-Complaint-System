# Pedicab Complaint System - Change Log

## Version 2.1 - Location & Build Optimization (Current)
**Date:** January 28, 2026
**Status:** ✅ Completed

### 📍 Location & Autocomplete
- **New Feature:** Added a predefined list of 30 barangays for standardized location reporting.
- **Web Frontend:** Implemented custom autocomplete dropdown with "ghost text" suggestions and Tab-completion.
- **Mobile App:** Implemented searchable location picker with real-time filtering.
- **Location Filtering:** Added location-based filtering for Admins and Enforcers across all dashboard tabs (Complaints, Investigations, Tickets).

### 🤖 Android Build Optimization
- **Modern Gradle:** Updated `android/build.gradle` to modern Gradle 8.3 syntax (`layout.buildDirectory`).
- **Path Resolution:** Added standard repository paths to fix dependency resolution for native modules like `react-native-screens`.
- **Windows Fix:** Stabilized build redirection to `C:/tmp` to prevent "Long Path" errors on Windows.

---

## Version 2.0 - Complete System Overhaul
**Date:** November 27, 2025
**Status:** ✅ Completed and Deployed

### 🎨 Universal Design Changes

#### Color Theme - Applied Across All Dashboards
- **New Theme:** Orange-Beige combination
  - Primary: #ff8c42 (Orange)
  - Secondary: #f4a261 (Beige)
  - Gradient: linear-gradient(135deg, #ff8c42 0%, #f4a261 100%)
- **Applied to:**
  - Client Dashboard
  - Enforcer Dashboard
  - Admin Dashboard
  - All buttons, badges, and UI elements

#### Streamlined Header - Uniform Across All Roles
**Design Pattern:**
- **Left Side:** 
  - Pedicab icon
  - App name "Pedicab Complaint System"
  - Personalized welcome message
- **Right Side:**
  - Real-time connectivity status (● Online/● Offline)
  - Sync status indicator (synced/syncing.../unable to sync)
  - Sign Out button
- **Implementation:** Client, Enforcer, and Admin dashboards

---

## 📱 Client Dashboard Changes

### Functionality Improvements

#### Franchise Number Format
- **Changed from:** Free-text format
- **Changed to:** 4-digit numbers only (e.g., "1006")
- **Validation:** Must be exactly 4 digits
- **Removed field:** vehicleNumber (simplified to franchise-level)

#### Complaint History View
**Before:** Large card format with all details visible
**After:**
- **Compact table format** with columns:
  - Franchise Number
  - Complaint Type
  - Status (color-coded badge)
  - Submitted Time
  - Comment (truncated to 50 chars)
- **Click-to-expand:** Modal with full complaint details
- **Better UX:** Easier scanning and navigation

### New Features
- Real-time connectivity monitoring
- Automatic sync status updates
- Modal detail view for complaints
- Gradient orange "New Complaint" button
- Network state detection with browser events

---

## 🔍 Enforcer Dashboard Changes

### Major Feature Additions

#### Quest-Based Investigation System
- **Compact quest cards** with click-to-expand functionality
- **Three main tabs:**
  1. Available Investigations
  2. My Investigations  
  3. My Tickets
  4. Franchises (database access)

#### Investigation Display
- Investigation cards show:
  - Investigation number (INV-YYYY-NNNN)
  - Franchise number (with fallback for manual investigations)
  - Category or "Manual Investigation" label
  - Status badge
- **Expandable details:**
  - Complaint information (if linked)
  - Location
  - Description
  - Instructions (orange-highlighted)
  - Accept button

#### Manual Investigation Support
**Problem:** Manual investigations (created without complaints) showed "undefined" for franchise number
**Solution:**
- Added fallback: `investigation.franchiseNumber || investigation.complaint?.franchiseNumber`
- Display "Manual Investigation" when no complaint category exists
- Supports both complaint-based and franchise-level investigations

#### Photo Upload System - Per Violation
**Implementation:**
- Photo upload moved from global to per-violation
- Each violation type has its own photo upload section
- Features:
  - Multiple photo uploads per violation
  - Base64 encoding for storage
  - 80px thumbnail previews in grid layout
  - Photos stored within violation object
  - Support for large images (50MB backend limit)

#### Ticket Submission
- Pre-defined violation checklist (10 types)
- Individual notes per violation
- Photos attached to specific violations
- Additional general notes field
- Validation: At least one violation required
- Success feedback with auto-refresh

#### My Tickets Tab
- **Card-based layout** matching investigation quests
- Displays all submitted tickets
- Click to expand: Full ticket details in modal
- Shows:
  - Violations with photos grouped by type
  - Notes per violation
  - Additional notes
  - Submission timestamp
  - Current status

---

## 👨‍💼 Admin Dashboard Changes

### Complaint Management Enhancements

#### Two-Step Workflow
1. **Accept/Reject Complaint**
   - Changes status to "under_review"
   - Admin can review before creating investigation
2. **Create Investigation Request**
   - Auto-generates investigation with:
     - Franchise number from complaint
     - Linked complaint reference
     - 4-step investigation instructions
   - Changes complaint status to "investigating"

#### Investigation Management

**Manual Investigation Creation:**
- Create investigations without linked complaints
- Direct franchise number input
- Custom description and instructions
- Use case: Routine inspections, franchise-level issues

**Investigation Display:**
- View all investigations (open, accepted, completed)
- 📋 icon for complaint-linked investigations
- Click to view full details in modal:
  - Franchise information
  - Linked complaint (if applicable)
  - Category and location
  - **Complaint Description** section
  - **Investigation Instructions** section (orange-highlighted)
- Delete open investigations option

#### Ticket Management with Photo Viewing

**Enhanced Ticket Display:**
- Table view with violation count
- Click ticket to view modal with:
  - All violations grouped by type
  - **Photos displayed under each violation** (80px thumbnails)
  - Notes for each violation
  - Additional enforcer notes
  
**Photo Viewer Modal:**
- **Problem:** Clicking photos redirected to blank page
- **Solution:** Implemented inline modal viewer
  - Click photo thumbnail → Opens full-size modal
  - Clean display with large image view
  - Close by clicking X or outside
  - Works with base64 encoded images

**Forward to Higher Ups:**
- Button to escalate tickets
- Add admin notes when forwarding
- Track forwarding admin and date
- Status updates: Submitted → Forwarded → Closed

---

## 🗄️ Backend Changes

### Database Model Updates

#### Investigation Model
- `franchiseNumber`: Direct field (required)
- `complaint`: Optional reference (null for manual investigations)
- `description`: Investigation details
- `instructions`: Specific enforcer tasks (with default '')
- Supports both complaint-based and manual workflows

#### Ticket Model
**Major Structure Change:**
- `complaint`: Changed from required to optional
  - Reason: Manual investigations don't have complaints
- **Violations schema updated:**
  ```javascript
  violations: [{
    type: String (enum),
    notes: String,
    photos: [{           // NEW
      url: String,
      description: String,
      uploadedAt: Date
    }]
  }]
  ```
- `evidence`: Kept for backward compatibility (legacy tickets)

### API Enhancements

#### Increased Payload Limit
**Problem:** Base64 images caused "request entity too large" error
**Solution:**
- Updated express.json() limit: 100kb → 50MB
- Updated express.urlencoded() limit: default → 50MB
- File: `server.js`

#### Ticket Creation Endpoint
- Now accepts photos within violation objects
- Validates: At least one violation required
- Auto-updates investigation status to "completed"
- Auto-resolves linked complaint (if exists)

#### Debug Logging Added
- Role checking in middleware
- User info in ticket creation
- Helps troubleshoot permission issues

---

## 🎨 CSS Changes

### New Styles Added
- `.streamlined-header` - Uniform header across all dashboards
- `.quest-card` - Investigation card styling with expand animation
- `.evidence-grid` - Photo grid layout (80px thumbnails)
- `.violation-detail` - Violation cards with photo sections
- `.modal-overlay` - Photo viewer modal
- `.compact-status-badge` - Smaller status indicators
- Gradient buttons with hover effects
- Orange-beige color palette throughout

### Responsive Improvements
- Grid layouts adapt to screen sizes
- Modal viewers scroll on smaller screens
- Table layouts optimized for readability
- Thumbnail grids use auto-fill

---

## 🔧 Technical Implementation

### Files Modified

**Frontend:**
1. **ClientDashboard.js** (~400 lines)
   - Streamlined header
   - Table view with modal
   - Connectivity monitoring
   - 4-digit franchise validation

2. **EnforcerDashboard.js** (~700 lines)
   - Quest card system
   - Per-violation photo uploads
   - My Tickets tab
   - Manual investigation support
   - Fallback for franchise numbers

3. **AdminDashboard.js** (~980 lines)
   - Two-step complaint workflow
   - Manual investigation creation
   - Photo viewer modal
   - Violation-grouped photo display
   - Forward ticket functionality

4. **Dashboard.css** (~1440+ lines)
   - Orange-beige theme
   - Quest card animations
   - Evidence grid layouts
   - Modal styles
   - Responsive designs

**Backend:**
5. **server.js**
   - Increased body size limit to 50MB

6. **models/Ticket.js**
   - Added photos array to violations
   - Made complaint optional

7. **models/Investigation.js**
   - Added default value for instructions

8. **middleware/auth.js**
   - Added debug logging for role checks

9. **routes/tickets.js**
   - Updated to handle violation photos
   - Added user logging

---

## 🐛 Bug Fixes

### Fixed Issues

1. **Manual Investigations Display**
   - Problem: Showed "undefined •" for franchise number
   - Fix: Added fallback to direct franchiseNumber field
   - Impact: Both complaint-based and manual investigations now display correctly

2. **Photo Upload Errors**
   - Problem: "request entity too large" (500 error)
   - Fix: Increased backend payload limit to 50MB
   - Impact: Enforcers can now upload multiple photos

3. **Complaint Field Required Error**
   - Problem: Manual investigation tickets failed validation
   - Fix: Made complaint field optional in Ticket model
   - Impact: Tickets work for both complaint-based and manual investigations

4. **Photo Viewer Blank Page**
   - Problem: Clicking photos opened blank page with "#blocked" URL
   - Fix: Implemented inline modal viewer instead of window.open()
   - Impact: Photos now viewable in clean modal overlay

5. **Permission Denied (403)**
   - Problem: Enforcers couldn't create tickets
   - Fix: Added debug logging, verified role middleware
   - Solution: Required logout/login for fresh JWT token
   - Impact: Proper role-based access control

---

## ✨ New Features Summary

### Client Dashboard
✅ Streamlined header with connectivity status
✅ Orange-beige theme
✅ Compact table view for complaints
✅ Click-to-expand modal for details
✅ 4-digit franchise number validation
✅ Real-time sync status

### Enforcer Dashboard
✅ Quest-based investigation system
✅ Compact expandable cards
✅ Per-violation photo uploads
✅ My Tickets tab with submission history
✅ Manual investigation support
✅ Franchise database access
✅ 80px photo thumbnails in grids
✅ Streamlined header with connectivity

### Admin Dashboard  
✅ Two-step complaint approval workflow
✅ Manual investigation creation
✅ Photo viewer modal for evidence
✅ Violations grouped with photos
✅ Forward to higher authorities
✅ Delete open investigations
✅ Comprehensive ticket management
✅ Streamlined header matching other dashboards

### Backend
✅ 50MB payload limit for large images
✅ Optional complaint field in tickets
✅ Photos stored per violation
✅ Debug logging for troubleshooting
✅ Backward compatibility with legacy evidence

---

## 📊 System Status

### Working Features
- ✅ Client complaint submission and tracking
- ✅ Admin complaint review and investigation creation
- ✅ Enforcer quest acceptance and ticket submission
- ✅ Photo uploads with violation grouping
- ✅ Manual investigations (franchise-level)
- ✅ Ticket forwarding to authorities
- ✅ Real-time connectivity monitoring
- ✅ Full-size photo viewing in modals

### Data Structure
- ✅ Supports both complaint-based and manual investigations
- ✅ Photos stored within violation objects
- ✅ Legacy evidence field maintained for compatibility
- ✅ Optional complaint references

---

## 🚀 Deployment Notes

### Database Migration
- Existing tickets with old structure still work (backward compatible)
- New tickets use violation.photos structure
- No manual migration needed

### Environment Variables
- JWT_SECRET - Ensure this is set in production
- MONGODB_URI - Connection string
- PORT - Default 5000

### Backend Requirements
- Node.js v18+
- MongoDB v5.0+
- 50MB+ available memory for image processing

---

## 📝 Next Steps & Future Improvements

### Potential Enhancements
- [ ] Add sorting to complaint/ticket tables
- [ ] Add filtering by status, date range
- [ ] Export functionality (CSV/PDF)
- [ ] Search within tickets
- [ ] Pagination for large datasets
- [ ] Image compression before upload
- [ ] Multiple photo batch upload
- [ ] Photo captions/descriptions
- [ ] Mobile app sync (currently on hold)
- [ ] Email notifications for status changes
- [ ] Analytics dashboard
- [ ] Report generation

---

**Version:** 2.0.0
**Release Date:** November 27, 2025
**Contributors:** Development Team
**Status:** ✅ Production Ready
