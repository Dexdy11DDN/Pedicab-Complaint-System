const mongoose = require('mongoose');
const Ticket = require('./models/Ticket');
const Investigation = require('./models/Investigation');
const Complaint = require('./models/Complaint');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const seedTickets = async () => {
  try {
    // Find an enforcer user
    const enforcer = await User.findOne({ role: 'enforcer' });
    if (!enforcer) {
      console.log('No enforcer found. Please seed users first.');
      process.exit(1);
    }

    // Find investigations
    const investigations = await Investigation.find({ status: 'in_progress' }).limit(3);
    if (investigations.length === 0) {
      console.log('No investigations found. Please create investigations first.');
      process.exit(1);
    }

    // Clear existing tickets
    await Ticket.deleteMany({});
    console.log('Cleared existing tickets');

    const tickets = [];

    // Ticket 1 - Multiple violations
    if (investigations[0]) {
      const complaint = await Complaint.findById(investigations[0].complaint);
      tickets.push({
        investigation: investigations[0]._id,
        complaint: investigations[0].complaint,
        enforcer: enforcer._id,
        franchiseNumber: complaint.franchiseNumber,
        violations: [
          {
            type: 'Overcharging',
            description: 'Driver charged 150 pesos instead of the standard 80 pesos fare',
            severity: 'severe'
          },
          {
            type: 'No Valid License',
            description: 'Driver could not produce valid driver\'s license during inspection',
            severity: 'critical'
          },
          {
            type: 'Expired Registration',
            description: 'Pedicab registration expired 3 months ago',
            severity: 'severe'
          }
        ],
        findings: 'Conducted on-site investigation at franchise 1234. Driver admitted to overcharging multiple passengers. Vehicle inspection revealed expired registration and driver failed to present valid license. Franchise operator was unaware of these violations. Recommend suspension of franchise pending license renewal and regulatory compliance training.',
        evidence: [
          {
            url: 'https://example.com/evidence/photo1.jpg',
            description: 'Photo of expired registration sticker'
          },
          {
            url: 'https://example.com/evidence/photo2.jpg',
            description: 'Receipt showing overcharge'
          }
        ],
        recommendation: 'Recommend immediate suspension of franchise operations until driver obtains valid license and vehicle registration is renewed. Mandatory compliance training for franchise operator. Fine of 5,000 pesos for multiple violations.',
        status: 'submitted'
      });
    }

    // Ticket 2 - Single violation
    if (investigations[1]) {
      const complaint = await Complaint.findById(investigations[1].complaint);
      tickets.push({
        investigation: investigations[1]._id,
        complaint: investigations[1].complaint,
        enforcer: enforcer._id,
        franchiseNumber: complaint.franchiseNumber,
        violations: [
          {
            type: 'Rude Behavior',
            description: 'Driver used inappropriate language towards passenger during fare dispute',
            severity: 'moderate'
          }
        ],
        findings: 'Interviewed both the complainant and driver. Driver acknowledged losing temper during disagreement over route. Driver has no prior complaints on record. Franchise operator agrees to implement customer service training.',
        evidence: [
          {
            url: 'https://example.com/evidence/witness1.pdf',
            description: 'Witness statement from nearby vendor'
          }
        ],
        recommendation: 'Recommend written warning for driver and mandatory customer service training within 30 days. No suspension required as this is a first offense.',
        status: 'submitted'
      });
    }

    // Ticket 3 - Vehicle condition violations
    if (investigations[2]) {
      const complaint = await Complaint.findById(investigations[2].complaint);
      tickets.push({
        investigation: investigations[2]._id,
        complaint: investigations[2].complaint,
        enforcer: enforcer._id,
        franchiseNumber: complaint.franchiseNumber,
        violations: [
          {
            type: 'Defective Brakes',
            description: 'Front brake pads worn down to less than 20% thickness',
            severity: 'critical'
          },
          {
            type: 'Torn Canopy',
            description: 'Passenger canopy has large tears providing insufficient weather protection',
            severity: 'minor'
          }
        ],
        findings: 'Safety inspection conducted at franchise location. Critical brake deficiency discovered that poses immediate safety risk. Canopy damage is cosmetic but violates passenger comfort standards. Vehicle has been red-tagged and removed from service pending repairs.',
        evidence: [
          {
            url: 'https://example.com/evidence/inspection1.jpg',
            description: 'Photo of worn brake pads'
          },
          {
            url: 'https://example.com/evidence/inspection2.jpg',
            description: 'Photo of damaged canopy'
          }
        ],
        recommendation: 'Vehicle must undergo certified brake repair and inspection before return to service. Canopy repair required within 7 days. Fine of 3,000 pesos for operating unsafe vehicle. Follow-up inspection required.',
        status: 'submitted'
      });
    }

    // Create tickets one by one to trigger pre-save hooks
    const createdTickets = [];
    for (const ticketData of tickets) {
      const ticket = new Ticket(ticketData);
      await ticket.save();
      createdTickets.push(ticket);
    }

    console.log(`Created ${createdTickets.length} test tickets`);

    // Display created tickets
    const allTickets = await Ticket.find()
      .populate('investigation')
      .populate('complaint')
      .populate('enforcer', 'firstName lastName email');
    
    console.log('\nCreated Tickets:');
    allTickets.forEach(ticket => {
      console.log(`\n${ticket.ticketNumber}`);
      console.log(`  Franchise: ${ticket.franchiseNumber}`);
      console.log(`  Enforcer: ${ticket.enforcer.firstName} ${ticket.enforcer.lastName}`);
      console.log(`  Violations: ${ticket.violations.length}`);
      console.log(`  Status: ${ticket.status}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding tickets:', error);
    process.exit(1);
  }
};

seedTickets();
