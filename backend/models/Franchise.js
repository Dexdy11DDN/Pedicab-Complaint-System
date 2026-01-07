const mongoose = require('mongoose');

const franchiseSchema = new mongoose.Schema({
  franchiseNumber: {
    type: String,
    required: true,
    unique: true
  },
  ownerName: {
    type: String,
    required: true
  },
  contactNumber: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  vehicleCount: {
    type: Number,
    default: 1
  },
  licenseNumber: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'revoked'],
    default: 'active'
  },
  photos: [{
    url: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  registrationDate: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Franchise', franchiseSchema);
