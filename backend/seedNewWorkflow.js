const mongoose = require('mongoose');
const Investigation = require('./models/Investigation');
const Ticket = require('./models/Ticket');
const User = require('./models/User');
const Complaint = require('./models/Complaint');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI);

const seedNewWorkflow = async () => {
  try {
    // Find users
    const admin = await User.findOne({ role: 'admin' });
    const enforcer = await User.findOne({ role: 'enforcer' });
    const client = await User.findOne({ role: 'client' });

    if (!admin || !enforcer || !client) {
      console.log('Users not found. Please run npm run init-db first.');
      process.exit(1);
    }

    // Clear existing data
    await Investigation.deleteMany({});
    await Ticket.deleteMany({});
    console.log('Cleared existing investigations and tickets');

    // Find some complaints
    const complaints = await Complaint.find().limit(3);
    
    if (complaints.length === 0) {
      console.log('No complaints found. Creating sample complaint...');
      const newComplaint = await Complaint.create({
        complaintNumber: `CMP-${Date.now()}`,
        client: client._id,
        franchiseNumber: '1234',
        description: 'Multiple violations observed',
        category: 'vehicle_condition',
        location: 'Main Street',
        incidentDate: new Date(),
        status: 'submitted'
      });
      complaints.push(newComplaint);
    }

    // Create investigations (admin creates quests)
    const investigations = [];

    // Investigation 1 - Open (not yet accepted)
    const inv1 = new Investigation({
      franchiseNumber: complaints[0].franchiseNumber,
      complaint: complaints[0]._id,
      requestedBy: admin._id,
      description: 'Multiple complaints received about this franchise. Please investigate vehicle condition and driver behavior.',
      status: 'open'
    });
    await inv1.save();
    investigations.push(inv1);
    console.log(`Created investigation: ${inv1.investigationNumber} (Open)`);

    // Investigation 2 - Accepted by enforcer
    const inv2 = new Investigation({
      franchiseNumber: complaints[0].franchiseNumber,
      complaint: complaints[0]._id,
      requestedBy: admin._id,
      description: 'Reports of safety violations. Conduct thorough vehicle inspection.',
      status: 'accepted',
      acceptedBy: enforcer._id,
      acceptedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    });
    await inv2.save();
    investigations.push(inv2);
    console.log(`Created investigation: ${inv2.investigationNumber} (Accepted by ${enforcer.firstName} ${enforcer.lastName})`);

    // Investigation 3 - Completed with ticket
    const inv3 = new Investigation({
      franchiseNumber: complaints[0].franchiseNumber,
      complaint: complaints[0]._id,
      requestedBy: admin._id,
      description: 'Follow-up investigation on reported issues.',
      status: 'completed',
      acceptedBy: enforcer._id,
      acceptedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      completionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
    });
    await inv3.save();
    investigations.push(inv3);
    console.log(`Created investigation: ${inv3.investigationNumber} (Completed)`);

    // Create a ticket for the completed investigation
    const ticket1 = new Ticket({
      investigation: inv3._id,
      complaint: inv3.complaint,
      enforcer: enforcer._id,
      franchiseNumber: inv3.franchiseNumber,
      violations: [
        {
          type: 'Missing Headlights',
          notes: 'Both front headlights are not functional'
        },
        {
          type: 'Expired Registration',
          notes: 'Registration expired 3 months ago'
        },
        {
          type: 'No Side Mirrors',
          notes: 'Left side mirror is completely missing'
        },
        {
          type: 'Poor Vehicle Condition',
          notes: 'Multiple rust spots, torn seats, and broken canopy'
        }
      ],
      additionalNotes: 'Vehicle is in very poor condition and poses safety risks. Driver was cooperative during inspection. Recommend immediate suspension until all violations are corrected and vehicle passes safety inspection.',
      evidence: [
        {
          url: 'https://example.com/photos/headlights.jpg',
          description: 'Photo showing non-functional headlights'
        },
        {
          url: 'https://example.com/photos/registration.jpg',
          description: 'Expired registration document'
        },
        {
          url: 'https://example.com/photos/mirror.jpg',
          description: 'Missing left side mirror'
        },
        {
          url: 'https://example.com/photos/condition.jpg',
          description: 'Overall vehicle condition showing rust and damage'
        }
      ],
      status: 'submitted'
    });
    await ticket1.save();
    console.log(`\nCreated ticket: ${ticket1.ticketNumber}`);
    console.log(`  Franchise: ${ticket1.franchiseNumber}`);
    console.log(`  Violations: ${ticket1.violations.length}`);
    console.log(`  Evidence Photos: ${ticket1.evidence.length}`);

    console.log('\n✅ Database seeded successfully with new workflow!');
    console.log('\nWorkflow Summary:');
    console.log('1. Admin creates investigation requests (quests)');
    console.log('2. Enforcers view and accept available investigations');
    console.log('3. After investigating, enforcers submit tickets with violations and evidence');
    console.log('4. Admin reviews tickets and forwards to higher ups\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedNewWorkflow();
