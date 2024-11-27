import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Podcast from '../models/Podcast.js';

dotenv.config();

const cleanup = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find and remove podcasts that don't match our schema requirements
    const result = await Podcast.deleteMany({
      $or: [
        { topic: { $exists: false } },
        { audio_url: { $exists: false } },
        { thumbnail_url: { $exists: false } },
        { script: { $exists: false } },
        { createdAt: { $exists: false } },
        { topic: null },
        { audio_url: null },
        { thumbnail_url: null },
        { script: null },
        { createdAt: null }
      ]
    });

    console.log(`Cleaned up ${result.deletedCount} invalid podcast entries`);

    // Get remaining podcasts for verification
    const remainingPodcasts = await Podcast.find({});
    console.log(`Remaining valid podcasts: ${remainingPodcasts.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
};

cleanup();
