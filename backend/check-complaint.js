const mongoose = require('mongoose');
const Complaint = require('./models/Complaint');

mongoose.connect('mongodb://localhost:27017/pedicab_complaint_system');

async function checkComplaint() {
  try {
    const complaint = await Complaint.findOne({ complaintNumber: 'CMP-202511-00003' });
    console.log('\n=== COMPLAINT DATA ===');
    console.log('Complaint Number:', complaint?.complaintNumber);
    console.log('Description:', complaint?.description);
    console.log('\n=== FULL OBJECT ===');
    console.log(JSON.stringify(complaint, null, 2));
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    await mongoose.connection.close();
  }
}

checkComplaint();
