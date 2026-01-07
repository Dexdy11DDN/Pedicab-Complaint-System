const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  complaintNumber: {
    type: String,
    required: true,
    unique: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  franchiseNumber: {
    type: String,
    required: true
  },
  vehicleNumber: {
    type: String
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['overcharging', 'rude_behavior', 'reckless_driving', 'refusal_of_service', 'vehicle_condition', 'other'],
    required: true
  },
  location: {
    type: String,
    required: true
  },
  incidentDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['submitted', 'under_review', 'investigating', 'resolved', 'rejected'],
    default: 'submitted'
  },
  evidence: [{
    type: String // URLs to uploaded files
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

complaintSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Complaint', complaintSchema);
