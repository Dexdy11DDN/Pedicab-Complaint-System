const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    unique: true
  },
  investigation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Investigation',
    required: true
  },
  complaint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
    required: false // Optional - manual investigations don't have complaints
  },
  enforcer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  franchiseNumber: {
    type: String,
    required: true
  },
  violations: [{
    type: {
      type: String,
      enum: [
        // Driver Violations
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
        'Driving in Slippers/Sleeveless Shirt',
        // Vehicle Violations
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
        'Defective Brakes',
        // Others
        'Other Violation'
      ],
      required: true
    },
    notes: String, // Additional notes for this specific violation
    photos: [{
      url: String,
      description: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  additionalNotes: {
    type: String // General notes/comments from enforcer
  },
  evidence: [{
    url: {
      type: String,
      required: true
    },
    description: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['submitted', 'under_review', 'forwarded', 'closed'],
    default: 'submitted'
  },
  forwardedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  forwardedDate: {
    type: Date
  },
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-generate ticket number
ticketSchema.pre('save', async function(next) {
  if (!this.ticketNumber) {
    const count = await mongoose.model('Ticket').countDocuments();
    this.ticketNumber = `TKT-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
  }
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Ticket', ticketSchema);
