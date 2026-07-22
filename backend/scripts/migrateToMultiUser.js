/**
 * One-time migration: assign all pre-existing (single-user) data to an owner account.
 *
 * Usage:
 *   1. Start the backend once (this drops the obsolete practiceplans dayOfWeek_1 index).
 *   2. Register your owner account through the app (this seeds a fresh default plan).
 *   3. Run:  node scripts/migrateToMultiUser.js <owner-email>
 *            (or set OWNER_EMAIL in the environment)
 *
 * The script is idempotent: it only touches documents that have no userId yet.
 * For practice plans, it removes the owner's freshly-seeded default plan first so the
 * legacy (customized) plan is preserved without violating the { userId, dayOfWeek } index.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Problem from '../models/Problem.js';
import PracticePlan from '../models/PracticePlan.js';

dotenv.config();

async function run() {
  const ownerEmail = (process.argv[2] || process.env.OWNER_EMAIL || '').trim().toLowerCase();

  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined.');
    process.exit(1);
  }
  if (!ownerEmail) {
    console.error('❌ Provide the owner email: node scripts/migrateToMultiUser.js <owner-email>');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`✅ Connected to MongoDB (${mongoose.connection.name})`);

  try {
    const owner = await User.findOne({ email: ownerEmail });
    if (!owner) {
      console.error(`❌ No user found with email "${ownerEmail}". Register that account first, then re-run.`);
      process.exit(1);
    }
    console.log(`👤 Owner account: ${owner.email} (${owner._id})`);

    // --- Problems ---
    const legacyProblemCount = await Problem.countDocuments({ userId: { $exists: false } });
    if (legacyProblemCount > 0) {
      const res = await Problem.updateMany(
        { userId: { $exists: false } },
        { $set: { userId: owner._id } }
      );
      console.log(`📦 Problems migrated: ${res.modifiedCount} (found ${legacyProblemCount} legacy)`);
    } else {
      console.log('📦 No legacy problems to migrate.');
    }

    // --- Practice plans ---
    const legacyPlanCount = await PracticePlan.countDocuments({ userId: { $exists: false } });
    if (legacyPlanCount > 0) {
      // Remove the owner's freshly-seeded default plan so the legacy plan can take its place.
      const removed = await PracticePlan.deleteMany({ userId: owner._id });
      const res = await PracticePlan.updateMany(
        { userId: { $exists: false } },
        { $set: { userId: owner._id } }
      );
      console.log(
        `🗓️  Practice plans migrated: ${res.modifiedCount} (removed ${removed.deletedCount} seeded default entries first)`
      );
    } else {
      console.log('🗓️  No legacy practice plans to migrate.');
    }

    console.log('✅ Migration complete.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

run();
