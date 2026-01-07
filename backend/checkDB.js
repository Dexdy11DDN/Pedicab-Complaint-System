// Database check utility script
// Run with: node checkDB.js

require('dotenv').config();
const mongoose = require('mongoose');

const checkDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    console.log('URI:', process.env.MONGODB_URI);
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ MongoDB connected successfully\n');
    
    const db = mongoose.connection.db;
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('Collections in database:');
    collections.forEach(c => console.log('  -', c.name));
    console.log('');
    
    // Count documents in each collection
    console.log('Document counts:');
    
    const users = await db.collection('users').countDocuments();
    console.log('  Users:', users);
    
    const complaints = await db.collection('complaints').countDocuments();
    console.log('  Complaints:', complaints);
    
    const investigations = await db.collection('investigations').countDocuments();
    console.log('  Investigations:', investigations);
    
    const tickets = await db.collection('tickets').countDocuments();
    console.log('  Tickets:', tickets);
    
    const franchises = await db.collection('franchises').countDocuments();
    console.log('  Franchises:', franchises);
    
    console.log('');
    
    // Show recent complaints
    if (complaints > 0) {
      console.log('Recent complaints:');
      const recentComplaints = await db.collection('complaints')
        .find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray();
      
      recentComplaints.forEach(c => {
        console.log(`  - ${c.complaintNumber}: ${c.category} (${c.status})`);
      });
    } else {
      console.log('No complaints in database.');
    }
    
    console.log('\n✓ Database check complete');
    
  } catch (error) {
    console.error('✗ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

checkDatabase();
