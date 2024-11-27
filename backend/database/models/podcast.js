import mongoose from 'mongoose';

const podcastSchema = new mongoose.Schema({
    topic: {
        type: String,
        required: true
    },
    script: {
        type: String,
        required: true
    },
    audio_url: {
        type: String,
        required: true
    },
    thumbnail_url: {
        type: String,
        required: true
    },
    voice: {
        type: String,
        default: 'adam'
    },
    language: {
        type: String,
        default: 'english'
    },
    plays: {
        type: Number,
        default: 0
    },
    likes: {
        type: Number,
        default: 0
    },
    shares: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

export const Podcast = mongoose.model('Podcast', podcastSchema);
