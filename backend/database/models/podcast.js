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
        required: false,
        default: null
    },
    images: [{
        url: String,
        timestamp: Number,
        prompt: String
    }],
    voice_id: {
        type: String,
        required: true
    },
    voice_settings: {
        stability: Number,
        similarityBoost: Number,
        style: Number
    },
    additional_context: String,
    views: {
        type: Number,
        default: 0
    },
    likes: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

export const Podcast = mongoose.model('Podcast', podcastSchema);
