require('dotenv').config();
const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');
const Franchise = require('../models/Franchise');

const repairDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected for repair...');

        // 1. Find all tickets with status 'forwarded'
        const forwardedTickets = await Ticket.find({ status: 'forwarded' });
        console.log(`Found ${forwardedTickets.length} forwarded tickets to check.`);

        let fixedCount = 0;

        for (const ticket of forwardedTickets) {
            // 2. Find the franchise
            const franchise = await Franchise.findOne({ franchiseNumber: ticket.franchiseNumber });

            if (!franchise) {
                console.warn(`[WARN] Franchise ${ticket.franchiseNumber} not found for ticket ${ticket.ticketNumber}`);
                continue;
            }

            // 3. Update or Add offense
            const existingOffense = franchise.offenses.find(o =>
                o.ticketId && o.ticketId.toString() === ticket._id.toString()
            );

            if (existingOffense) {
                // Fix legacy offenses missing status or stuck in 'pending' despite being confirmed
                const isLegacyConfirmed = (existingOffense.status === 'pending' || !existingOffense.status) && (existingOffense.confirmedAt || ticket.status === 'forwarded');

                if (isLegacyConfirmed) {
                    existingOffense.status = 'confirmed';
                    console.log(`[FIX] Migrated status to 'confirmed' for existing Ticket ${ticket.ticketNumber} in Franchise ${franchise.franchiseNumber}`);
                }
            } else {
                console.log(`[FIX] Adding missing offense for Franchise ${franchise.franchiseNumber} from Ticket ${ticket.ticketNumber}`);

                const violationTypes = ticket.violations.map(v => v.type);

                franchise.offenses.push({
                    ticketId: ticket._id,
                    ticketNumber: ticket.ticketNumber,
                    violations: violationTypes,
                    status: 'confirmed',
                    confirmedAt: ticket.forwardedDate || ticket.updatedAt,
                    confirmedBy: ticket.forwardedBy
                });
            }

            // 4. Always re-calculate totals for this franchise
            // A confirmed offense is one with status 'confirmed' OR (status 'pending' but has confirmedAt)
            const confirmedOffenses = franchise.offenses.filter(o => o.status === 'confirmed' || (o.status === 'pending' && o.confirmedAt));
            franchise.offenseCount = confirmedOffenses.length;

            const violationCounts = {};
            confirmedOffenses.forEach(offense => {
                // Ensure status is at least set if we matched the fallback
                offense.status = 'confirmed';

                offense.violations.forEach(vType => {
                    violationCounts[vType] = (violationCounts[vType] || 0) + 1;
                });
            });

            franchise.hasThreeStrikes = Object.values(violationCounts).some(count => count >= 3);

            await franchise.save();
            fixedCount++;
        }

        console.log(`\n=== Repair Complete ===`);
        console.log(`Checked: ${forwardedTickets.length} tickets`);
        console.log(`Fixed: ${fixedCount} franchises`);

        process.exit(0);
    } catch (error) {
        console.error('Repair failed:', error);
        process.exit(1);
    }
};

repairDatabase();
