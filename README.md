# Pedicab Complaint System

**Repository:** [https://github.com/Dexdy11DDN/Pedicab-Complaint-System](https://github.com/Dexdy11DDN/Pedicab-Complaint-System)

# Don't mind the badapple file. Just don't.

A comprehensive complaint management system for pedicab services with web and mobile (Android) applications. The system features three user roles: Clients (submit complaints), Enforcers (investigate complaints and check franchise databases), and Admins (approve investigations and oversee the system).

## 🔐 Default Credentials

The system comes with three pre-seeded accounts for testing:

| Role | Email | Password |
|------|-------|----------|
| **Client** | client@pedicab.com | password123 |
| **Enforcer** | enforcer@pedicab.com | password123 |
| **Admin** | admin@pedicab.com | password123 |

## 👥 User Roles & Functions

### 🙋 Client
**Primary Function:** Submit and track complaints about pedicab franchises

**Dashboard Features:**
- **Orange-Beige Theme:** Modern, warm color scheme (#ff8c42, #f4a261) with gradient effects
- **Streamlined Header:** 
  - App name "Pedicab Complaint System" with personalized welcome message (top left)
  - 💬 Complaint Assistant chatbot button (top right)
  - ⭐ App Review button (top right)
  - Real-time connectivity status (● Online/● Offline) with sync indicator (top right)
  - Sign out button (top right)
- **Quick Actions:** 
  - Prominent "New Complaint" button with orange gradient
  - One-click access to complaint submission form
- **Complaint Submission Form:**
  - 4-digit franchise number (validated input, e.g., "1006")
  - Incident category dropdown (traffic violations, safety issues, etc.)
  - Date and time picker for incident
  - Location selection with real-time **autocomplete** and filtering (predefined barangay list)
  - Visual suggestion (ghost text) and Tab-completion support
  - Detailed description textarea
  - Form validation for all required fields
- **Compact Complaint History:**
  - **Table view** with sortable columns:
    - Franchise Number (4-digit format)
    - Type/Category
    - Status (color-coded badge)
    - Submitted Time (date + time)
    - Comment (truncated preview)
  - **Click-to-expand:** Click any row to view full details in modal
  - **Modal detail view** shows:
    - Complete complaint information
    - Full untruncated description
    - All timestamps
    - Current status with color coding
    - **Actions:**
      - **Cancel Complaint:** Option to cancel if status is 'submitted'.
      - **Edit Complaint:** Option to modify details if status is 'submitted'.
      - **Delete Complaint:** Option to permanently remove if status is 'submitted'.
    - **Complaint Categories:**
      - Includes new **"Sexual Harassment"** category for sensitive reporting.
  - **Status tracking:** Visual badges for submitted, under_review, investigating, resolved, rejected
- **Real-time Sync:** 
  - Automatic synchronization when online
  - Automatic synchronization when online
  - Sync status updates (syncing.../synced/unable to sync)
  - Network state detection
- **Complaint Chatbot Assistant (💬):**
  - Step-by-step guided complaint submission via conversational interface
  - Walks users through franchise number, category, date, location, and description
  - Smart location autocomplete with barangay suggestions
  - Confirmation summary before final submission
  - Available on both **web** and **mobile** platforms
- **App Review System (⭐):**
  - Star rating system (1-5 stars)
  - Written feedback/comments (up to 500 characters)
  - Update existing reviews
  - Available on both **web** and **mobile** platforms
  - Admin can view all reviews and average ratings on the web dashboard
- **Profile Management:**
  - View personal details (Name, Email, Role)
  - View total submitted complaints count
  - Secure Sign Out

### 🔍 Enforcer
**Primary Function:** Accept investigation quests and submit detailed violation tickets

**Dashboard Features:**
- **Orange-Beige Theme:** Consistent color scheme (#ff8c42, #f4a261) across all interfaces
- **Streamlined Header:**
  - Pedicab icon with app name and personalized welcome (top left)
  - Real-time connectivity status (● Online/● Offline) with sync indicator (top right)
  - Sign out button (top right)
- **Three Main Tabs:**
  1. **Available Investigations** - Browse open quests
  2. **My Investigations** - Track accepted assignments
  3. **My Tickets** - View submission history
  4. **Franchises** - Search franchise database
- **Location Filtering:** Filter investigation quests and submitted tickets by specific locations/barangays (Available across all tabs)

**Available Investigations (Quest System):**
- **Compact quest cards** with click-to-expand functionality
- Card displays:
  - Investigation number (e.g., INV-2025-0001)
  - Franchise number (supports both complaint-linked and manual investigations)
  - Category (or "Manual Investigation" for non-complaint cases)
  - Status badge (PENDING/OPEN)
- **Expandable details** on click:
  - Linked complaint number (if applicable)
  - Location information
  - Investigation description
  - Specific instructions (orange-highlighted)
  - Accept button to claim quest
- **Smart display:** Handles both complaint-based and manually created investigations
- **One-click accept:** Claims investigation for current enforcer

**My Investigations:**
- View all accepted investigations
- Same card format as Available Investigations
- Shows status: ACCEPTED/IN PROGRESS
- **Submit Ticket** functionality:
  - Pre-defined violation checklist (40+ types in 3 categories)
  - Checkbox selection for each violation
  - Individual notes field per violation
  - **Photo upload per violation** (multiple photos supported)
  - Photo preview thumbnails (80px grid)
  - Additional general notes textarea
  - Submit button with validation

**Violation Categories (Enforcer Tickets Only):**

*Driver Violations (16 types):*
- No Valid License
- Expired Driver's License
- Failure to Bring License
- No Mayor's Permit (Driver)
- Student Driver Not Accompanied
- Reckless Driving
- Disregarding Traffic Sign
- Overcharging
- Refusal to Convey
- Discourtesy/Arrogance
- Rude Behavior
- Unauthorized Route
- No Fare Matrix Displayed
- Operating Under Influence
- No Uniform/ID
- Driving in Slippers/Sleeveless Shirt

*Vehicle Violations (21 types):*
- No Plate Number
- Plate Improperly Displayed
- Obstructed Plate
- No Plate Sticker
- No Registration/Official Receipt
- Expired Franchise
- Expired Registration
- Invalid Registration
- Incomplete OR/CR
- Illegal Parking
- Parking on the Sidewalk
- Parking Infront of a Driveway
- Obstruction
- Missing Headlights
- Missing Taillights
- No Side Mirrors
- Poor Vehicle Condition
- Overloading
- Excessive Noise
- No Seatbelt
- Defective Brakes

*Others:*
- Other Violation

**My Tickets Tab:**
- **Card-based layout** matching investigation quest style
- Each ticket card shows:
  - Ticket number (e.g., TKT-2025-0001)
  - Investigation reference
  - Franchise number
  - Submission timestamp
  - Status badge (Submitted/Forwarded/Closed)
- **Click to expand:** View full ticket details in modal
- **Modal shows:**
  - All violations reported (grouped by type)
  - Photos attached to each specific violation
  - Notes for each violation
  - Additional general notes
  - Submission timestamp
  - Current status

**Franchise Database:**
- Search by franchise number, owner name, or license
- View franchise details:
  - Owner information
  - Contact details
  - Address
  - Vehicle count
  - License number
  - Current status (Active/Suspended/Revoked)

**Photo Management:**
- Base64 encoding for efficient storage
- Multiple photos per violation
- 80px thumbnail previews in grids
- Photos grouped by violation type
- Support for large images (50MB backend limit)

### 👨‍💼 Admin
**Primary Function:** Review complaints, create investigation requests, manage tickets, manage enforcers, and oversee system

**Dashboard Features:**
- **Orange-Beige Theme:** Consistent modern color scheme (#ff8c42, #f4a261) across all admin functions
- **Streamlined Header:**
  - Pedicab icon with app name and personalized admin welcome (top left)
  - Real-time connectivity status monitor (● Online/● Offline with sync indicator)
  - Sign out button (top right)
- **Five Main Tabs:**
  1. **Overview** - System statistics and activity (including enforcer count)
  2. **Manage Complaints** - Review and process client complaints
  3. **Manage Investigations** - Create and monitor investigation quests
  4. **Manage Tickets** - Review enforcer submissions and forward to authorities
  5. **Franchises** - Full database management
- **Separate Enforcer Management Screen** - Access via "🛡️ Manage Enforcers →" button

**Overview Tab:**
- System-wide statistics dashboard
- Total counts for complaints, investigations, tickets, **registered enforcers**
- Recent activity feed
- Status breakdowns with visual charts

**Manage Complaints Tab:**
- **View all complaints** submitted by clients
- **Sorting & Filtering:**
    - **Sort by:** Type, Status, Date (Clickable headers)
    - **Filter by:**
        - **Category:** Dropdown including "Sexual Harassment"
        - **Status:** Dropdown (Submitted, Under Review, etc.)
        - **Location:** Filter complaints by specific barangay
- **Table/List view** with complete complaint details
- **Two-step approval workflow:**
  1. **Review Stage:**
     - Click complaint to view full details in modal
     - "✓ Accept Complaint" button → Changes status to "under_review"
     - "✕ Reject" button → Changes status to "rejected"
  2. **Investigation Stage:**
     - "🔍 Create Investigation Request" button (for accepted complaints)
     - Auto-generates investigation with:
       - Franchise number from complaint
       - Linked complaint reference
       - Auto-generated 4-step instructions
       - Status changes to "investigating"
- **Status tracking:** Submitted → Under Review → Investigating → Resolved
- **Automatic resolution:** Complaint auto-resolves when enforcer submits ticket
- **Color-coded badges:** 
  - Submitted (orange)
  - Under Review (orange)
  - Investigating (orange-red)
  - Resolved (green)
  - Rejected (red)

**Manage Investigations Tab:**
- **Create new investigations:**
  - **From complaints:** One-click creation from Manage Complaints
  - **Manual creation:** Create franchise-level investigations without linked complaints
  - Manual form includes:
    - Franchise number input
    - Investigation description
    - Specific instructions for enforcer
    - Specific instructions for enforcer
- **Sorting & Filtering:**
    - **Sort by:** Status
    - **Filter by:** 
        - **Status:** (Open, Accepted, Completed)
        - **Location:** Filter quests by specific barangay
- **View all investigations** in list format
- **Investigation cards show:**
  - Investigation number (INV-YYYY-NNNN)
  - Franchise number
  - Status badge (Open/Accepted/Completed)
  - 📋 icon for complaint-linked investigations
  - Requester name
  - Acceptor name (when accepted)
  - Timestamps
- **Click to view details modal:**
  - Full investigation information
  - Franchise number and linked complaint (if applicable)
  - Complaint category and location (for linked investigations)
  - **Complaint Description** section (original complaint details)
  - **Investigation Instructions** section (orange-highlighted with specific tasks)
  - Requester and acceptor information
  - Status and dates
- **Delete functionality:** Remove open investigations before acceptance
- **Smart handling:** Supports both complaint-based and manual investigations

**Manage Tickets Tab:**
- **View all submitted tickets** from enforcers
- **Sorting & Filtering:**
    - **Sort by:** Status, Date
    - **Filter by:** 
        - **Status:** (Submitted, Under Review, Resolved, Rejected)
        - **Location:** Filter tickets by specific barangay
- **Table view** with columns:
  - Ticket ID (TKT-YYYY-NNNN)
  - Franchise Number
  - Enforcer Name
  - Violation Count
  - Status (Submitted/Forwarded/Closed)
  - Submitted Time
- **Click ticket to view full details modal:**
  - Ticket and investigation information
  - Franchise number
  - Enforcer details
  - **Violations section** (grouped by type):
    - Each violation shows:
      - Violation type (properly capitalized)
      - Specific notes from enforcer
      - **Evidence photos grouped by violation** (80px thumbnails in grid)
      - Click photos to view full-size in modal viewer
  - Additional enforcer notes
  - Submission timestamp
  - Current status
- **Photo viewer modal:**
  - Click any photo thumbnail to open full-size view
  - Clean modal with large image display
  - Close by clicking X or outside modal
- **Forward to Higher Ups:**
  - Button to escalate tickets to external authorities
  - Add admin notes when forwarding
  - Status changes to "Forwarded"
  - Track forwarding date and admin
- **Status management:**
  - Update ticket status (Submitted → Forwarded → Closed)
  - Proper capitalization throughout
- **Evidence management:**
  - Photos displayed in organized grids
  - Grouped under respective violations
  - Support for base64 images (50MB limit)
  - Legacy evidence support for backward compatibility

**Franchises Tab:**
- **Full database management:**
  - Add new franchises
  - Edit existing franchise information
  - Update franchise status (Active/Suspended/Revoked)
  - View complete franchise records:
    - Franchise number
    - Owner name and contact
    - License number
    - Address
    - Vehicle count
    - Current status
- **Search and filter capabilities**
- **Status color coding** for quick visual reference

**Enforcer Management (Separate Screen - /enforcers):**
- **Access:** Click "🛡️ Manage Enforcers →" button from dashboard header
- **Admin-only enforcer account creation:**
  - Regular registration only creates Client accounts
  - Enforcers can only be created by administrators
  - Form includes: First Name, Last Name, Email, Phone, Password
- **Enforcer list display:**
  - Card-based grid layout
  - Shows enforcer name, email, phone number
  - Active/Inactive status badge (green/red)
  - Account creation date
- **Account management:**
  - Activate/Deactivate enforcer accounts
  - Deactivated enforcers cannot log in
- **Summary statistics:**
  - Total enforcers count
  - Active enforcers count
  - Inactive enforcers count
  - Inactive enforcers count
- **Refresh button** for manual data reload
- **Back to Dashboard** navigation

**Advanced Database Features:**
- **Three Strikes Rule:**
  - Automated tracking of franchise offenses
  - Franchises with 3+ validated violations are flagged
  - Visual indicators for "Three Strikes" status
- **Offense Management:**
  - **Reset Offenses:** Admin can reset offense count for a franchise (e.g., after suspension served)
  - **View History:** Detailed history of all past tickets and resolutions
- **Offline Franchise Database:**
  - Full copy of franchise data stored locally (SQLite)
  - Allows franchise lookup even without internet connection
  - Auto-syncs when connection is restored

## 🔐 Registration & Account Security

### Public Registration (Clients Only)
- Web: `/register` page allows only **Client** account creation
- Mobile: Register screen creates only **Client** accounts
- Note displayed: "Enforcer accounts are created by administrators only"

### Admin-Only Enforcer Registration
- Enforcers cannot self-register
- Admin creates enforcer accounts via Enforcer Management screen
- Provides better control over who can perform investigations

### Account Deactivation
- Admins can deactivate user accounts
- Deactivated users see "Account is deactivated" error on login attempt
- Accounts can be reactivated by admin

## 🔄 Real-Time Synchronization

The system uses **Socket.IO** for real-time updates between web and mobile clients:

### Events Broadcasted:
- `complaint:created` - New complaint submitted
- `complaint:updated` - Complaint status changed
- `investigation:created` - New investigation created
- `investigation:updated` - Investigation accepted/completed
- `ticket:created` - New ticket submitted
- `ticket:updated` - Ticket status changed

### How It Works:
1. Backend emits events when data changes
2. Connected clients receive updates instantly
3. UI refreshes automatically without manual reload
4. Users join role-based rooms (admin, enforcer, client)

## 🏗️ System Architecture

```
├── backend/              # Node.js + Express API
│   ├── models/          # MongoDB data models
│   ├── routes/          # API endpoints
│   ├── middleware/      # Authentication & authorization
│   ├── utils/           # Socket emitter utilities
│   └── config/          # Database configuration
│
├── web-frontend/        # React web application
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   │   ├── ComplaintChatbot.js  # Guided complaint assistant
│   │   │   ├── AppReview.js        # App review/rating modal
│   │   │   └── Sidebar.js          # Navigation sidebar
│   │   ├── contexts/    # React contexts (Auth)
│   │   ├── pages/       # Page components
│   │   │   ├── dashboards/        # Role-specific dashboards
│   │   │   └── EnforcerManagement.js  # Admin enforcer management
│   │   ├── services/    # API services & Socket.IO client
│   │   ├── utils/       # Shared utilities (violations.js, locations.js)
│   │   └── database/    # SQLite (sql.js) for offline franchises
│   │       ├── init.js       # Database initialization
│   │       ├── franchises.js # Franchise queries
│   │       └── sync.js       # Sync with MongoDB
│
└── mobile-app/          # React Native Android app
    ├── src/
    │   ├── components/  # Reusable mobile components
    │   │   ├── ComplaintChatbotModal.js  # Mobile complaint assistant
    │   │   ├── AppReviewModal.js         # Mobile app review modal
    │   │   └── Sidebar.js               # Navigation sidebar
    │   ├── contexts/    # React contexts
    │   ├── screens/     # App screens
    │   ├── services/    # API services & Socket.IO client
    │   ├── utils/       # Shared utilities (locations.js)
    │   └── database/    # SQLite for offline franchises
    │       ├── init.js       # Database initialization
    │       ├── franchises.js # Franchise queries
    │       └── sync.js       # Sync with MongoDB
    └── assets/
        └── data/
            └── franchises_initial.csv  # Initial seed data
```

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (v5.0 or higher)
- **npm** or **yarn**
- **Android Studio** (for mobile app development)
- **JDK 17** (for React Native Android builds)

## 🛠️ Recommended VS Code Extensions

For the best development experience, install these VS Code extensions:

### Essential Extensions
- **ES7+ React/Redux/React-Native snippets** (`dsznajder.es7-react-js-snippets`) - React code snippets
- **ESLint** (`dbaeumer.vscode-eslint`) - JavaScript linting
- **Prettier - Code formatter** (`esbenp.prettier-vscode`) - Code formatting
- **MongoDB for VS Code** (`mongodb.mongodb-vscode`) - MongoDB database management
- **Thunder Client** (`rangav.vscode-thunder-client`) - API testing (alternative to Postman)
- **React Native Tools** (`msjsdiag.vscode-react-native-tools`) - React Native debugging and IntelliSense

### Helpful Extensions
- **Auto Rename Tag** (`formulahendry.auto-rename-tag`) - Auto rename paired HTML/JSX tags
- **Path Intellisense** (`christian-kohler.path-intellisense`) - Autocomplete filenames
- **GitLens** (`eamodio.gitlens`) - Enhanced Git capabilities
- **Error Lens** (`usernamehw.errorlens`) - Inline error highlighting
- **Material Icon Theme** (`pkief.material-icon-theme`) - File icons for better navigation

### Optional but Useful
- **REST Client** (`humao.rest-client`) - Test REST APIs directly in VS Code
- **Git Graph** (`mhutchie.git-graph`) - View Git repository history
- **Todo Tree** (`gruntfuggly.todo-tree`) - Highlight TODO, FIXME comments

## 📦 Project Dependencies

### Backend (Node.js/Express)
- **express** (^4.18.2) - Web framework for Node.js
- **mongoose** (^8.0.0) - MongoDB object modeling and database operations
- **bcryptjs** (^2.4.3) - Password hashing for secure authentication
- **jsonwebtoken** (^9.0.2) - JWT token generation and validation
- **dotenv** (^16.3.1) - Environment variable management
- **cors** (^2.8.5) - Cross-Origin Resource Sharing middleware
- **express-validator** (^7.0.1) - Request validation and sanitization
- **multer** (^1.4.5-lts.1) - File upload handling (photos/evidence)
- **socket.io** (^4.7.2) - Real-time bidirectional communication
- **nodemon** (^3.0.1) - Development auto-restart server

### Web Frontend (React)
- **react** (^18.3.1) & **react-dom** (^18.3.1) - React library for UI
- **react-router-dom** (^6.30.2) - Client-side routing and navigation
- **axios** (^1.13.2) - HTTP client for API requests
- **socket.io-client** (^4.7.2) - Real-time client for Socket.IO
- **react-icons** (^5.5.0) - Icon library (Font Awesome, Material Design, etc.)
- **papaparse** (^5.5.3) - CSV parsing for franchise data import
- **sql.js** (^1.13.0) - SQLite database in browser (offline franchise search)
- **react-scripts** (5.0.1) - Create React App build tooling
- **@craco/craco** (^7.1.0) - Override CRA webpack config without ejecting

### Mobile App (React Native)
- **react-native** (^0.73.11) - Mobile framework for iOS/Android
- **socket.io-client** (^4.7.2) - Real-time client for Socket.IO
- **@react-navigation/native** (^6.1.9) - Navigation container
- **@react-navigation/bottom-tabs** (^6.5.11) - Bottom tab navigation
- **@react-navigation/native-stack** (^6.9.17) - Stack-based navigation
- **@react-native-async-storage/async-storage** (^1.21.0) - Persistent key-value storage (auth tokens)
- **@react-native-picker/picker** (^2.11.4) - Dropdown picker component
- **axios** (^1.6.2) - HTTP client for backend API calls
- **react-native-fs** (^2.20.0) - File system access for data import/export
- **react-native-image-picker** (^8.2.1) - Camera/gallery integration for violation photos
- **react-native-linear-gradient** (^2.8.3) - Gradient backgrounds for UI styling
- **react-native-safe-area-context** (^4.8.2) - Safe area handling for notched devices
- **react-native-screens** (^3.31.1) - Native screen optimization for performance
- **react-native-sqlite-storage** (^6.0.1) - Offline SQLite database (100 franchises)
- **papaparse** (^5.4.1) - CSV parsing for franchise data sync

## 🚀 Quick Start Guide (New Device Setup)

If you've copied this project to a new device, follow these simple steps:

### Check Existing Prerequisites

Before installing, check what you already have:

```powershell
# Check Node.js (Required)
node --version
# ✅ If shows v18.x.x or higher = Already installed
# ❌ If error "not recognized" = Need to install

npm --version
# ✅ If shows 9.x.x or higher = Already installed

# Check MongoDB (Required)
# Option 1 - Check if running as Windows Service:
Get-Service -Name MongoDB -ErrorAction SilentlyContinue
# ✅ If shows "Status: Running" = Installed and running as service
# ❌ If shows nothing = Not installed or not running as service

# Option 2 - Check MongoDB installation:
mongod --version
# ✅ If shows "db version v7.x.x" = MongoDB installed
# ❌ If error "not recognized" = MongoDB not installed

# Option 3 - Check if MongoDB process is running:
Get-Process -Name mongod -ErrorAction SilentlyContinue
# ✅ If shows process = MongoDB is running
# ❌ If shows nothing = MongoDB not running

# Check Git (Optional)
git --version
# ✅ If shows version = Already installed
# ❌ If error = Need to install (optional but recommended)

# Check Android SDK (Only for mobile app development)
adb --version
# ✅ If shows version = Android SDK installed
# ❌ If error = Need to install Android Studio

# Check Java JDK (Only for mobile app development)
java -version
# ✅ If shows "openjdk version 17" or higher = Already installed
# ❌ If error or wrong version = Need to install JDK 17
```

**Quick Summary:**
- ✅ **All commands work?** → Skip to [Step 1: Install Project Dependencies](#step-1-install-project-dependencies-one-time-setup)
- ❌ **Some commands failed?** → Install missing prerequisites below

---

### Prerequisites Installation

#### 1. Install Node.js (Required)

Node.js is the JavaScript runtime needed for the backend and build tools.

**Download & Install:**
1. Go to [https://nodejs.org/](https://nodejs.org/)
2. Download the **LTS version** (e.g., v20.x.x)
3. Run the installer
4. **Important:** Check the box that says "Automatically install the necessary tools" (installs Python, Visual Studio Build Tools)
5. Click through the installer (keep all default settings)
6. Restart your computer after installation

**Verify Installation:**
```powershell
node --version
# Should show: v20.x.x or higher

npm --version
# Should show: 10.x.x or higher
```

#### 2. Install MongoDB (Required)

MongoDB is the database system that stores all application data.

**Download & Install:**
1. Go to [https://www.mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
2. Select:
   - **Version:** 7.0.x (current)
   - **Platform:** Windows
   - **Package:** MSI
3. Click **Download**
4. Run the installer
5. Choose **Complete** installation
6. **Important:** When prompted "Install MongoDB as a Service":
   - ✅ **Recommended:** Select **"Install MongoD as a Service"** 
   - Choose **"Run service as Network Service user"** (default - recommended for security)
   - OR choose **"Run service as a local or domain user"** (if you need specific user permissions)
   - **Leave "Service Name" as:** `MongoDB`
   - **Leave "Data Directory" as:** `C:\Program Files\MongoDB\Server\7.0\data\`
   - **Leave "Log Directory" as:** `C:\Program Files\MongoDB\Server\7.0\log\`
   - This makes MongoDB start automatically when Windows boots
7. **Important:** Check "Install MongoDB Compass" (GUI tool for viewing database)
8. Click Install and wait for completion

**Verify Installation:**
```powershell
# MongoDB should start automatically
# Check if it's running:
Get-Service -Name MongoDB

# Should show: Status = Running
```

**Access MongoDB Compass (GUI):**
- Open MongoDB Compass from Start Menu
- Connection string: `mongodb://localhost:27017`
- Click "Connect" to view your databases

#### 3. Install Git (Optional but Recommended)

Git helps with version control and updates.

**Download & Install:**
1. Go to [https://git-scm.com/download/win](https://git-scm.com/download/win)
2. Download the installer
3. Run installer with default settings
4. **Important:** On "Adjusting your PATH environment" screen, select "Git from the command line and also from 3rd-party software"

**Verify Installation:**
```powershell
git --version
# Should show: git version 2.x.x
```

#### 4. Install Android Studio (Only if developing mobile app)

Android Studio provides Android SDK and emulator for mobile development.

**Download & Install:**
1. Go to [https://developer.android.com/studio](https://developer.android.com/studio)
2. Download Android Studio
3. Run the installer
4. Choose **Standard** installation
5. Accept all SDK license agreements
6. Wait for SDK components to download (this takes a while, ~2-3 GB)

**Configure Android Environment:**

After installation, set up environment variables:

1. Open **Environment Variables:**
   - Press `Win + X` → System → Advanced system settings → Environment Variables

2. Add **ANDROID_HOME** (System Variables):
   - Click "New" under System Variables
   - Variable name: `ANDROID_HOME`
   - Variable value: `C:\Users\YourUsername\AppData\Local\Android\Sdk`
   - Click OK

3. Update **Path** variable:
   - Find "Path" under System Variables → Click Edit
   - Click "New" and add: `%ANDROID_HOME%\platform-tools`
   - Click "New" and add: `%ANDROID_HOME%\tools`
   - Click OK on all windows

4. **Restart PowerShell** and verify:
```powershell
adb --version
# Should show: Android Debug Bridge version x.x.x
```

**Install JDK 17 (Required for Android builds):**
1. Go to [https://adoptium.net/](https://adoptium.net/)
2. Download **JDK 17 LTS** for Windows
3. Run installer
4. Check "Set JAVA_HOME variable" and "Add to PATH"
5. Verify:
```powershell
java -version
# Should show: openjdk version "17.x.x"
```

---

### Step 1: Install Project Dependencies (One-Time Setup)

Open PowerShell in the project root directory and run:

```powershell
# Install backend dependencies
cd backend
npm install

# Install web frontend dependencies
cd ..\web-frontend
npm install

# Install mobile app dependencies (if developing mobile)
cd ..\mobile-app
npm install

# Return to project root
cd ..
```

### Step 2: Configure Environment

```powershell
# Navigate to backend directory (if not already there)
cd backend

# The .env file already exists, but verify it has the correct settings
notepad .env
```

**Verify these settings in .env:**
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/pedicab_complaint_system
JWT_SECRET=your_secure_secret_key_change_this
JWT_EXPIRE=7d
```

**Note:** If the .env file is missing, create it manually with the settings above.

### Step 3: Start MongoDB

Make sure MongoDB is installed and running:
```powershell
# MongoDB should start automatically, or run:
# net start MongoDB
# (or start MongoDB Compass)
```

### Step 4: Initialize Database

```powershell
# Still in backend directory
npm run init-db
```

This creates the database and adds default users:
- **Admin:** admin@pedicab.com / password123
- **Enforcer:** enforcer@pedicab.com / password123
- **Client:** client@pedicab.com / password123

### Step 5: Run the Application

**Open 2 PowerShell windows:**

**Window 1 - Backend:**
```powershell
cd "path\to\project\backend"
npm run dev
```
✅ Backend running at `http://localhost:5000`

**Window 2 - Web Frontend:**
```powershell
cd "path\to\project\web-frontend"
npm start
```
✅ Web app opens at `http://localhost:3000`

**That's it! You're ready to use the system.**

---

## 📱 Mobile App Setup (Optional)

### For Physical Android Device

**1. Update API URL for your network:**

Find your computer's IP address:
```powershell
ipconfig
# Look for "IPv4 Address" under your WiFi adapter (e.g., 192.168.1.23)
```

Edit `mobile-app/src/database/sync.js`:
```javascript
const API_URL = 'http://YOUR_IP_ADDRESS:5000/api';  // Replace YOUR_IP_ADDRESS
```

**2. Enable USB Debugging on phone:**
- Settings → About Phone → Tap "Build Number" 7 times
- Settings → Developer Options → Enable "USB Debugging"

**3. Connect phone and verify:**
```powershell
adb devices
# Should show your device
```

**4. Start everything:**

**Window 1 - Backend** (must be running):
```powershell
cd backend
npm run dev
```

**Window 2 - Metro Bundler:**
```powershell
cd mobile-app
$env:REACT_NATIVE_PACKAGER_HOSTNAME='YOUR_IP_ADDRESS'
npm start
```

**Window 3 - Install on phone:**
```powershell
cd mobile-app
npm run android
```

App installs and launches on your phone! 🎉

---

## 🔧 Detailed Installation & Setup

### 1. Backend Setup

```powershell
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file from example
Copy-Item .env.example .env

# Edit .env file and configure:
# - PORT=5000
# - MONGODB_URI=mongodb://localhost:27017/pedicab_complaint_system
# - JWT_SECRET=your_secure_secret_key_here
# - JWT_EXPIRE=7d

# Start MongoDB (if not running)
# Make sure MongoDB is installed and running on your system

# Initialize database with sample data
npm run init-db

# Start the server
npm run dev
```

The backend will run on `http://localhost:5000`

**Default Users Created:**
- Admin: `admin@pedicab.com` / `password123`
- Enforcer: `enforcer@pedicab.com` / `password123`
- Client: `client@pedicab.com` / `password123`

### 2. Web Frontend Setup

```powershell
# Navigate to web frontend directory
cd ..\web-frontend

# Install dependencies
npm install

# Start the development server
npm start
```

The web app will open at `http://localhost:3000`

**Local Franchise Database (Web):**
The web frontend uses sql.js (SQLite in browser) for offline franchise access:
- Database auto-initializes on first load
- Syncs with MongoDB API every 5 minutes
- Data persists in browser IndexedDB
- Export/import franchise data as CSV
- Supports base64 images for franchise photos

### 3. Mobile App Setup

#### A. Install Dependencies

```powershell
# Navigate to mobile app directory
cd ..\mobile-app

# Install all required packages
npm install
```

#### B. Configure for Physical Device Testing

**Step 1: Enable USB Debugging on Your Phone**
1. Open **Settings** on your Android phone
2. Scroll to **About Phone**
3. Tap **Build Number** 7 times (you'll see "You are now a developer!")
4. Go back to Settings → **System** → **Developer Options**
5. Enable **USB Debugging**

**Step 2: Update API URL for Your Network**
1. The API URL has already been updated to `http://192.168.1.23:5000/api`
2. Your computer's IP address: `192.168.1.23`
3. Make sure both your phone and computer are on the **same Wi-Fi network**

**Step 3: Connect Phone to Computer**
1. Connect your Android phone via **USB cable**
2. On your phone, allow **USB Debugging** when prompted
3. Verify connection by running:
   ```powershell
   adb devices
   ```
   You should see your device listed (e.g., `ABC123456789    device`)

**Step 4: Start Backend Server**
```powershell
# In a new PowerShell window, navigate to backend
cd "c:\Users\LENOVO\Desktop\Pedicab Complaint System\backend"

# Start the server (must be running for mobile app to work)
npm run dev
```
You should see: `Server running on port 5000`

**Step 5: Build and Install on Phone**
```powershell
# Navigate to mobile app directory
cd "c:\Users\LENOVO\Desktop\Pedicab Complaint System\mobile-app"

# Start Metro bundler (this compiles JavaScript)
npm start
```

**Step 6: Install App on Physical Device**
```powershell
# In another PowerShell window (keep Metro running)
cd "c:\Users\LENOVO\Desktop\Pedicab Complaint System\mobile-app"

# Build and install on your connected phone
npm run android
```

The app will automatically install and launch on your phone!

#### C. Troubleshooting Physical Device Setup

**If `adb devices` shows "unauthorized":**
- Disconnect and reconnect USB cable
- Make sure you tapped "Allow" on your phone when USB debugging prompt appeared
- Try a different USB cable (some cables are charge-only)

**If app doesn't connect to backend:**
- Verify both devices on same Wi-Fi network (run `ipconfig` on computer, check Wi-Fi settings on phone)
- Make sure backend server is running (`npm run dev` in backend folder)
- Check Windows Firewall isn't blocking port 5000
- Try restarting the app on your phone

**If Metro bundler shows errors:**
- Clear cache: `npm start -- --reset-cache`
- Delete `node_modules` and run `npm install` again
- Make sure Android SDK is installed (via Android Studio)

**If build fails:**
- Open Android Studio and install any missing SDK components
- Make sure JDK 17 is installed
- Check that `ANDROID_HOME` environment variable is set

**Note:** For Android Emulator instead of physical device, change API URL in `mobile-app/src/services/api.js` to `http://10.0.2.2:5000/api`

**Local Franchise Database (Mobile):**
The mobile app uses SQLite for offline franchise access:
- Install dependencies: `npm install react-native-sqlite-storage papaparse react-native-fs`
- Database auto-initializes on first app launch
- Syncs with MongoDB API every 5 minutes when online
- Export/import franchise data as CSV
- Supports base64 images for franchise photos
- CSV files saved to device Downloads folder

## � Wireless Debugging Setup (No USB Cable)

After initial setup with USB, you can debug your app wirelessly over Wi-Fi. This is convenient for testing without a physical cable connection.

### Prerequisites
- Android 11 or higher (for native wireless debugging)
- OR Android 5+ with ADB over TCP/IP (older method)
- Both phone and computer on the **same Wi-Fi network**

### Method 1: Android 11+ Native Wireless Debugging (Recommended)

**Step 1: Enable Wireless Debugging on Phone**
1. Go to **Settings** → **Developer Options**
2. Scroll down and enable **Wireless debugging**
3. Tap on **Wireless debugging** to open settings
4. Note down the **IP address and port** shown (e.g., `192.168.254.101:41233`)

**Step 2: Pair Your Computer (First Time Only)**
1. On your phone, tap **Pair device with pairing code**
2. Note the **pairing code** and **IP:Port** (different from connection port)
3. On your computer, run:
```powershell
adb pair <IP>:<PAIRING_PORT>
# Example: adb pair 192.168.254.101:37123
# Enter the pairing code when prompted
```

**Step 3: Connect Wirelessly**
```powershell
# Use the IP and port shown in Wireless debugging settings (NOT the pairing port)
adb connect <IP>:<PORT>
# Example: adb connect 192.168.254.101:41233

# Verify connection
adb devices
# Should show: 192.168.254.101:41233  device
```

**Step 4: Run Your App**
```powershell
cd "c:\Users\LENOVO\Desktop\Pedicab Complaint System\mobile-app"

# Start Metro bundler
npm start

# In another terminal, build and run
npm run android
```

### Method 2: ADB over TCP/IP (Android 5+, Older Method)

This method requires an initial USB connection to set up.

**Step 1: Connect Phone via USB First**
```powershell
# Verify USB connection
adb devices
# Should show your device with "device" status
```

**Step 2: Enable TCP/IP Mode**
```powershell
# Tell ADB to listen on TCP port 5555
adb tcpip 5555
# Output: restarting in TCP mode port: 5555
```

**Step 3: Disconnect USB and Connect Wirelessly**
1. Unplug the USB cable
2. Find your phone's IP address:
   - Go to **Settings** → **About Phone** → **Status** → **IP Address**
   - Or **Settings** → **Wi-Fi** → Tap connected network → View IP
3. Connect via Wi-Fi:
```powershell
adb connect <PHONE_IP>:5555
# Example: adb connect 192.168.254.105:5555

# Verify connection
adb devices
# Should show: 192.168.254.105:5555  device
```

**Step 4: Run Your App**
```powershell
cd "c:\Users\LENOVO\Desktop\Pedicab Complaint System\mobile-app"
npm start
# In another terminal:
npm run android
```

### Finding Your Phone's IP Address

**On Android:**
1. **Settings** → **Wi-Fi** → Tap your connected network → **IP Address**
2. Or **Settings** → **About Phone** → **Status** → **IP Address**

**On Windows (find your PC's IP):**
```powershell
# Get your computer's IP address
ipconfig | Select-String "IPv4"
# Look for the IP on your Wi-Fi adapter (e.g., 192.168.254.101)
```

### Configuring the App for Wireless Connection

**Important:** The mobile app needs to know your computer's IP to connect to the backend.

**Update API URL in mobile app:**

Edit `mobile-app/src/services/api.js`:
```javascript
// Change this line to your computer's IP address
const API_URL = 'http://192.168.254.101:5000/api';
//                   ^^^^^^^^^^^^^^^ Your PC's IP
```

**Update Socket.IO URL (if using real-time sync):**

Edit `mobile-app/src/services/socketService.js`:
```javascript
const SOCKET_URL = 'http://192.168.254.101:5000';
//                        ^^^^^^^^^^^^^^^ Your PC's IP
```

### Troubleshooting Wireless Debugging

**"error: device offline"**
```powershell
# Disconnect and reconnect
adb disconnect
adb connect <IP>:<PORT>
```

**"failed to connect to..."**
- Verify both devices are on the same Wi-Fi network
- Check if Windows Firewall is blocking ADB
- Try disabling VPN if enabled
- Restart ADB server:
```powershell
adb kill-server
adb start-server
adb connect <IP>:<PORT>
```

**Connection drops after a while (TCP/IP method)**
- The phone may have gone to sleep
- Re-run: `adb connect <IP>:5555`
- Consider keeping phone plugged into power

**"App can't connect to server" on phone**
1. Make sure backend is running: 
   ```powershell
   cd backend
   npm run dev
   ```
2. Check backend is binding to all interfaces (0.0.0.0):
   ```javascript
   // In server.js, verify:
   server.listen(PORT, '0.0.0.0', () => {...})
   ```
3. Add firewall exception for port 5000:
   ```powershell
   # Run as Administrator
   New-NetFirewallRule -DisplayName "Node Backend" -Direction Inbound -Port 5000 -Protocol TCP -Action Allow
   ```
4. Verify connection from phone browser:
   - Open Chrome on phone
   - Navigate to `http://<YOUR_PC_IP>:5000/api/health`
   - Should see: `{"status":"OK","message":"Server is running"}`

**Metro bundler not connecting**
- Metro runs on port 8081 by default
- Phone needs to access `http://<PC_IP>:8081`
- Add firewall rule for Metro:
```powershell
New-NetFirewallRule -DisplayName "Metro Bundler" -Direction Inbound -Port 8081 -Protocol TCP -Action Allow
```

### Quick Wireless Setup Checklist

1. ☐ Phone and PC on same Wi-Fi network
2. ☐ Developer Options enabled on phone
3. ☐ USB/Wireless debugging enabled on phone
4. ☐ `adb devices` shows your device
5. ☐ Backend running (`npm run dev` in backend folder)
6. ☐ API_URL in mobile app points to PC's IP (not localhost)
7. ☐ Windows Firewall allows ports 5000 (backend) and 8081 (Metro)
8. ☐ Phone browser can access `http://<PC_IP>:5000/api/health`

## ?? API Endpoints

### Authentication
- `POST /api/auth/register` - Register new client (public, clients only)
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info (verify token)
- `POST /api/auth/create-enforcer` - Create enforcer account (Admin only)
- `GET /api/auth/enforcers` - Get all enforcers (Admin only)
- `PATCH /api/auth/users/:id/status` - Activate/deactivate user (Admin only)

### Complaints
- `GET /api/complaints` - Get all complaints (Enforcer/Admin)
- `GET /api/complaints/my-complaints` - Get user's complaints (Client)
- `GET /api/complaints/:id` - Get complaint by ID
- `POST /api/complaints` - Submit new complaint (Client)
- `PATCH /api/complaints/:id/status` - Update complaint status (Enforcer/Admin)

### Franchises
- `GET /api/franchises` - Get all franchises (Enforcer/Admin)
- `GET /api/franchises/:franchiseNumber` - Get franchise details
- `POST /api/franchises` - Create franchise (Admin)
- `PUT /api/franchises/:franchiseNumber` - Update franchise (Admin)
- `PATCH /api/franchises/:franchiseNumber/status` - Update franchise status (Admin)

### Investigations (NEW WORKFLOW)
- `GET /api/investigations` - Get all investigations (filtered by role)
- `GET /api/investigations/:id` - Get investigation by ID
- `POST /api/investigations` - Create investigation request (Admin)
- `PATCH /api/investigations/:id/accept` - Accept investigation quest (Enforcer)
- `DELETE /api/investigations/:id` - Delete open investigation (Admin)

### Tickets (NEW)
- `GET /api/tickets` - Get all tickets (Admin)
- `GET /api/tickets/:id` - Get ticket by ID (Admin, own Enforcer)
- `POST /api/tickets` - Submit ticket after investigation (Enforcer)
- `PATCH /api/tickets/:id/forward` - Forward ticket to higher ups (Admin)
- `PATCH /api/tickets/:id/status` - Update ticket status (Admin)

## 🗄️ Database Models

### User
- email, password, firstName, lastName
- role: client | enforcer | admin
- phoneNumber, isActive

### Complaint
- complaintNumber (auto-generated)
- client (reference to User)
- franchiseNumber, vehicleNumber
- description, category, location, incidentDate
- status: submitted | under_review | investigating | resolved | rejected
- evidence (file URLs)

### Franchise
- franchiseNumber, ownerName, contactNumber
- address, vehicleCount, licenseNumber
- status: active | suspended | revoked
- photos (array of franchise vehicle/license images):
  - url (base64 encoded image data)
  - description (photo type: vehicle, license, etc.)
  - uploadedAt (timestamp)

**Local Database (SQLite):**
- Used for offline franchise lookup (mobile + web)
- Syncs with MongoDB when online
- Stores franchise data + base64 images
- CSV export/import for cross-device sharing
- Automatic sync every 5 minutes when connected

### Investigation (NEW WORKFLOW)
- investigationNumber (auto-generated: INV-YYYY-NNNN)
- franchiseNumber (4-digit franchise number)
- complaint (reference to Complaint, optional)
- requestedBy (admin who created the quest)
- acceptedBy (enforcer who accepted, optional)
- status: open | accepted | completed | closed
- description (investigation details/instructions)
- acceptedDate, completionDate

### Ticket (NEW)
- ticketNumber (auto-generated: TKT-YYYY-NNNN)
- investigation (reference to Investigation)
- complaint (reference to Complaint, optional - null for manual investigations)
- enforcer (reference to User who submitted)
- franchiseNumber (4-digit franchise number)
- violations (array of):
  - type (predefined: Missing Headlights, Illegal Parking, Expired Registration, Overloading, No Side Mirrors, Missing Taillights, No License Plate, Reckless Driving, Poor Vehicle Condition, Excessive Noise)
  - notes (specific notes for this violation)
  - photos (array of violation-specific evidence):
    - url (base64 encoded image data)
    - description (photo filename/description)
    - uploadedAt (timestamp)
- additionalNotes (general enforcer comments)
- evidence (legacy array for backward compatibility):
  - url (photo URL)
  - description
  - uploadedAt
- status (submitted | forwarded | closed)
- forwardedBy (admin reference), forwardedDate
- notes (admin notes when forwarding)

## 🔒 Authentication & Authorization

- **JWT-based authentication** with token expiration
- **Role-based access control** (RBAC)
- Protected routes for each user role
- Secure password hashing with bcrypt

## 🎨 Technology Stack

### Backend
- Node.js
- Express.js
- MongoDB + Mongoose (Primary Database)
- JWT for authentication
- bcryptjs for password hashing

### Web Frontend
- React 18
- React Router
- Axios
- CSS3
- sql.js (SQLite in browser for offline franchise database)

### Mobile App
- React Native
- React Navigation
- AsyncStorage
- Axios
- react-native-sqlite-storage (Offline franchise database)
- papaparse (CSV import/export)
- react-native-fs (File system access)

## 📝 Usage Guide

### For Clients
1. Register/Login to the mobile app or website
2. Submit a complaint with franchise details
3. Track complaint status updates
4. View complaint history

### For Enforcers
1. Login to the system
2. View "Available Investigations" - open quests posted by admin
3. Click "Accept" on an investigation to claim it
4. Conduct on-site investigation at the franchise
5. Submit ticket with:
   - Select violations from predefined checklist
   - Add notes for each violation
   - Upload evidence photos
   - Add general observations
6. Track ticket status after submission

### For Admins
1. Login to admin portal
2. **Complaint Review & Investigation Workflow:**
   - Go to "Manage Complaints" tab
   - Click on any complaint to view details
   - **First:** Click "✓ Accept Complaint" or "✕ Reject" (changes status to "under review")
   - **Then:** Click "🔍 Create Investigation Request" (changes status to "investigating")
   - Investigation is created with auto-filled franchise number and linked complaint
   - When enforcer completes investigation, complaint automatically resolves
3. Alternative: Manually create investigations in "Manage Investigations" tab
4. Monitor investigation status (open/accepted/completed)
5. Review submitted tickets in "Manage Tickets" tab
6. Forward tickets to higher authorities
7. Manage franchise database
8. View system overview and statistics

**Complaint Status Flow (Client will see these updates):**
- **Submitted** → Admin reviews complaint
- **Under Review** → Admin accepts complaint
- **Investigating** → Admin creates investigation request
- **Resolved** → Enforcer submits ticket completing investigation

## 🔧 Development Commands

### Backend
```powershell
npm run dev        # Start development server with nodemon
npm start          # Start production server
npm run init-db    # Initialize database with sample data
```

### Web Frontend
```powershell
npm start          # Start development server
npm run build      # Build for production
npm test           # Run tests
```

### Mobile App
```powershell
npm start          # Start Metro bundler
npm run android    # Run on Android
npm run ios        # Run on iOS (macOS only)

# Reset Metro bundler cache (fixes most cache issues)
npm start -- --reset-cache

# Force complete Metro reset (for stubborn errors)
pushd android; .\gradlew clean; popd; npm start -- --reset-cache
```

## 🐛 Troubleshooting

### Backend Issues
- **MongoDB connection error:** Ensure MongoDB is running on port 27017
- **Port already in use:** Change PORT in `.env` file

### Web Frontend Issues
- **API connection error:** Verify backend is running on port 5000
- **Module not found:** Run `npm install` again

### Mobile App Issues
- **Android build fails:** Ensure Android SDK is properly installed
- **Metro bundler error:** Clear cache with `npm start -- --reset-cache`
- **Cannot connect to API:** Update API_URL to your computer's IP address
- **Port 8081 already in use (EADDRINUSE):**
  1. Find process using port: `netstat -ano | findstr :8081`
  2. Kill the process: `taskkill /PID <process_id> /F`
  3. Or kill all node processes: `Get-Process -Name node | Stop-Process -Force`
  4. Restart Metro: `npm start`
- **App crashes or shows errors after code changes:** 
  1. Stop Metro bundler (Ctrl+C)
  2. Clear Metro cache: `npm start -- --reset-cache`
  3. Rebuild app: `npm run android`
- **Changes not reflecting in app:**
  1. Reset cache: `npm start -- --reset-cache`
  2. Uninstall app from device
  3. Rebuild: `npm run android`
- **Persistent errors after cache reset:**
  1. Stop Metro bundler (Ctrl+C)
  2. Clean Gradle: `pushd android; .\gradlew clean; popd`
  3. Reset Metro: `npm start -- --reset-cache`
  4. Rebuild: `npm run android`

## � Changelog

### v1.2.0 (January 2026)
**Enforcer Management & Enhanced Violations**

- ✨ **Separated Enforcer Registration** - Enforcers can only be created by admins
- ✨ **New Enforcer Management Screen** (`/enforcers`) - Dedicated admin page for managing enforcers
- ✨ **Account Activation/Deactivation** - Admins can enable/disable enforcer accounts
- ✨ **Extended Violation List** - 40+ violations in 3 categories (Driver, Vehicle, Others)
- ✨ **Real-Time Sync with Socket.IO** - Instant updates across all connected clients
- 🔒 **Enhanced Security** - Public registration restricted to client accounts only
- 📝 **Improved Error Handling** - Better error messages and debugging info

**New Violations Added:**
- Driver: Failure to Bring License, No Mayor's Permit, Student Driver Not Accompanied, Disregarding Traffic Sign, Discourtesy/Arrogance, Driving in Slippers/Sleeveless Shirt
- Vehicle: Plate Improperly Displayed, No Registration/Official Receipt, Illegal Parking, Parking on Sidewalk, Parking Infront of Driveway, Obstruction
- Others: Other Violation (catch-all category)

### v1.1.0 (December 2025)
**Real-Time Features & UI Improvements**

- ✨ Socket.IO integration for real-time data sync
- ✨ Violation categories separated by Driver and Vehicle
- 🐛 Fixed "Invalid token" errors on mobile app
- 🐛 Fixed "Available Investigations" to show only open status
- 📱 Improved mobile app networking for wireless debugging

### v1.0.0 (Initial Release)
- Full complaint submission system for clients
- Investigation quest system for enforcers
- Admin dashboard with complaint/investigation/ticket management
- Offline franchise database with SQLite
- Photo evidence support with base64 encoding

## �📄 License

This project is for educational/demonstration purposes.

## 👥 Support

For issues and questions, please refer to the documentation or contact the development team.

---

**Note:** Remember to change the JWT_SECRET in production and never commit `.env` files to version control.
