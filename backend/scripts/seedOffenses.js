/**
 * Seed test offense data for franchises
 * Run with: node scripts/seedOffenses.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Franchise = require('../models/Franchise');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pedicab_complaint_system';

const seedOffenses = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Franchise 1001 - 3 strikes (should be red)
        const franchise1001 = await Franchise.findOne({ franchiseNumber: '1001' });
        if (franchise1001) {
            franchise1001.offenses = [
                {
                    ticketNumber: 'TKT-2025-TEST-001',
                    violations: ['Reckless Driving', 'No License Plate'],
                    confirmedAt: new Date('2025-01-05')
                },
                {
                    ticketNumber: 'TKT-2025-TEST-002',
                    violations: ['Overcharging'],
                    confirmedAt: new Date('2025-01-10')
                },
                {
                    ticketNumber: 'TKT-2025-TEST-003',
                    violations: ['Missing Headlights', 'Poor Vehicle Condition'],
                    confirmedAt: new Date('2025-01-12')
                }
            ];
            franchise1001.offenseCount = 3;
            franchise1001.hasThreeStrikes = true;
            await franchise1001.save();
            console.log('✓ Franchise 1001: 3 offenses (3-strikes)');
        }

        // Franchise 1002 - 2 offenses (warning level)
        const franchise1002 = await Franchise.findOne({ franchiseNumber: '1002' });
        if (franchise1002) {
            franchise1002.offenses = [
                {
                    ticketNumber: 'TKT-2025-TEST-004',
                    violations: ['Illegal Parking'],
                    confirmedAt: new Date('2025-01-08')
                },
                {
                    ticketNumber: 'TKT-2025-TEST-005',
                    violations: ['Expired Registration', 'No Side Mirrors'],
                    confirmedAt: new Date('2025-01-11')
                }
            ];
            franchise1002.offenseCount = 2;
            franchise1002.hasThreeStrikes = false;
            await franchise1002.save();
            console.log('✓ Franchise 1002: 2 offenses (warning)');
        }

        // Franchise 1003 - 1 offense (minor)
        const franchise1003 = await Franchise.findOne({ franchiseNumber: '1003' });
        if (franchise1003) {
            franchise1003.offenses = [
                {
                    ticketNumber: 'TKT-2025-TEST-006',
                    violations: ['Excessive Noise'],
                    confirmedAt: new Date('2025-01-09')
                }
            ];
            franchise1003.offenseCount = 1;
            franchise1003.hasThreeStrikes = false;
            await franchise1003.save();
            console.log('✓ Franchise 1003: 1 offense (minor)');
        }

        console.log('\n✅ Test offense data seeded successfully!');
        console.log('\nOffense summary:');
        console.log('  - Franchise 1001: 3 strikes (RED)');
        console.log('  - Franchise 1002: 2 offenses (WARNING)');
        console.log('  - Franchise 1003: 1 offense (MINOR)');
        console.log('  - Franchises 1004+: 0 offenses (CLEAN)');

    } catch (error) {
        console.error('Error seeding offenses:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
    }
};

seedOffenses();
