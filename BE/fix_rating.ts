import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import Court from './src/models/courtModel.js';
import { ReviewModel } from './src/models/reviewModel.js';

dotenv.config();

async function fixAvgRating() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected to MongoDB');

    const courts = await Court.find();
    for (const court of courts) {
      const stats = await ReviewModel.aggregate([
        { $match: { court_id: court._id } },
        { $group: { _id: null, avgRating: { $avg: '$rating' } } },
      ]);
      const avg = stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0;
      await Court.updateOne({ _id: court._id }, { $set: { avg_rating: avg } });
      console.log(`Court ${court.name} updated to avg_rating: ${avg}`);
    }

    console.log('Finished updating avg_rating');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixAvgRating();
