import mongoose from 'mongoose';

const podcastSchema = new mongoose.Schema({
  topic: {
    type: String,
    required: true,
  },
  audio_url: {
    type: String,
    required: true,
  },
  thumbnail_url: {
    type: String,
    required: true,
  },
  script: {
    type: String,
    required: true,
  },
}, {
  timestamps: true
});

export default mongoose.model('Podcast', podcastSchema);
