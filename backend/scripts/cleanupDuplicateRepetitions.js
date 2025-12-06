import mongoose from 'mongoose';
import Problem from '../models/Problem.js';
import dotenv from 'dotenv';

dotenv.config();

async function cleanupDuplicateRepetitions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all incomplete repetition entries grouped by originalProblemId
    const duplicates = await Problem.aggregate([
      {
        $match: {
          type: 'repetition',
          isCompleted: false,
          originalProblemId: { $ne: null }
        }
      },
      {
        $group: {
          _id: '$originalProblemId',
          entries: {
            $push: {
              id: '$_id',
              scheduledDate: '$scheduledRepetitionDate',
              repetitionDate: '$repetitionDate',
              createdAt: '$createdAt',
              problemNumber: '$problemNumber'
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);

    console.log(`\nFound ${duplicates.length} anchor problems with duplicate repetition entries\n`);

    let totalDeleted = 0;
    let totalKept = 0;

    for (const group of duplicates) {
      const entries = group.entries;
      
      // Sort by scheduled date (oldest first), then by creation date
      entries.sort((a, b) => {
        const dateA = a.scheduledDate || a.repetitionDate || new Date(0);
        const dateB = b.scheduledDate || b.repetitionDate || new Date(0);
        
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA - dateB;
        }
        
        // If dates are same, prefer older creation date
        return (a.createdAt || new Date(0)) - (b.createdAt || new Date(0));
      });

      // Keep the first (oldest/most overdue) entry, delete the rest
      const toKeep = entries[0];
      const toDelete = entries.slice(1);

      console.log(`Problem #${toKeep.problemNumber} (Anchor ID: ${group._id}):`);
      console.log(`  Total duplicates: ${entries.length}`);
      console.log(`  Keeping: ${toKeep.id} (scheduled: ${toKeep.scheduledDate || toKeep.repetitionDate || 'N/A'})`);
      console.log(`  Deleting: ${toDelete.length} entries`);

      // Delete duplicates
      const idsToDelete = toDelete.map(e => e.id);
      const deleteResult = await Problem.deleteMany({
        _id: { $in: idsToDelete }
      });

      totalDeleted += deleteResult.deletedCount;
      totalKept += 1;

      console.log(`  ✓ Deleted ${deleteResult.deletedCount} duplicate(s)\n`);
    }

    console.log('\n=== Cleanup Summary ===');
    console.log(`Problems with duplicates: ${duplicates.length}`);
    console.log(`Repetition entries kept: ${totalKept}`);
    console.log(`Repetition entries deleted: ${totalDeleted}`);
    console.log('\nCleanup completed successfully!');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error during cleanup:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

cleanupDuplicateRepetitions();

