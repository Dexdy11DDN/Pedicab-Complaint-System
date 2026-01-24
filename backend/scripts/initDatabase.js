require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Franchise = require('../models/Franchise');
const Ticket = require('../models/Ticket');
const Investigation = require('../models/Investigation');
const Complaint = require('../models/Complaint');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const initDatabase = async () => {
  await connectDB();

  try {
    // Clear existing data
    await User.deleteMany({});
    await Franchise.deleteMany({});
    await Ticket.deleteMany({});
    await Investigation.deleteMany({});
    await Complaint.deleteMany({});

    console.log('Creating default users...');

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // Create admin user
    const admin = new User({
      email: 'admin@pedicab.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      phoneNumber: '09171234567'
    });
    await admin.save();
    console.log('Admin user created');

    // Create enforcer user
    const enforcer = new User({
      email: 'enforcer@pedicab.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Enforcer',
      role: 'enforcer',
      phoneNumber: '09181234567'
    });
    await enforcer.save();
    console.log('Enforcer user created');

    // Create client user
    const client = new User({
      email: 'client@pedicab.com',
      password: hashedPassword,
      firstName: 'Jane',
      lastName: 'Client',
      role: 'client',
      phoneNumber: '09191234567'
    });
    await client.save();
    console.log('Client user created');

    console.log('\nCreating sample franchises...');

    // Create sample franchises (1001-1100)
    const franchises = [];
    const ownerNames = ['Juan Dela Cruz', 'Maria Santos', 'Pedro Garcia', 'Ana Reyes', 'Jose Mendoza',
      'Carmen Lopez', 'Roberto Aquino', 'Elena Torres', 'Miguel Ramos', 'Sofia Fernandez'];
    const cities = ['Manila', 'Quezon City', 'Makati', 'Pasay', 'Taguig', 'Paranaque', 'Mandaluyong', 'Pasig'];
    const streets = ['Rizal Ave', 'Quezon Blvd', 'EDSA', 'Taft Ave', 'España', 'Roxas Blvd', 'Makati Ave', 'Ortigas'];
    const statuses = ['active', 'active', 'active', 'active', 'active', 'active', 'suspended', 'active', 'active', 'revoked'];

    for (let i = 1001; i <= 1100; i++) {
      const ownerIndex = (i - 1001) % ownerNames.length;
      const cityIndex = (i - 1001) % cities.length;
      const streetIndex = (i - 1001) % streets.length;
      const statusIndex = (i - 1001) % statuses.length;

      franchises.push({
        franchiseNumber: i.toString(),
        ownerName: ownerNames[ownerIndex],
        contactNumber: `0917${1234567 + (i - 1001)}`,
        address: `${100 + i} ${streets[streetIndex]} ${cities[cityIndex]}`,
        vehicleCount: Math.floor(Math.random() * 8) + 2, // 2-9 vehicles
        licenseNumber: `LIC-2024-${String(i - 1000).padStart(3, '0')}`,
        status: statuses[statusIndex]
      });
    }

    await Franchise.insertMany(franchises);
    console.log(`Created ${franchises.length} sample franchises (1001-1100)`);

    console.log('\n=== Database initialized successfully ===');
    console.log('\nDefault credentials:');
    console.log('Admin: admin@pedicab.com / password123');
    console.log('Enforcer: enforcer@pedicab.com / password123');
    console.log('Client: client@pedicab.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
};

initDatabase();
