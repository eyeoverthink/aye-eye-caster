import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true
    },
    author: {
        type: String,
        default: 'Anonymous'
    },
    likes: {
        type: Number,
        default: 0
    },
    replies: [{
        content: String,
        author: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const contentSchema = new mongoose.Schema({
    podcastId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Podcast',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['Technology', 'Science', 'History', 'Business', 'Entertainment', 'Education', 'Other'],
        default: 'Other'
    },
    tags: [{
        type: String
    }],
    stats: {
        views: {
            type: Number,
            default: 0
        },
        likes: {
            type: Number,
            default: 0
        },
        dislikes: {
            type: Number,
            default: 0
        },
        shares: {
            type: Number,
            default: 0
        }
    },
    ratings: [{
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        user: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    comments: [commentSchema],
    averageRating: {
        type: Number,
        default: 0
    },
    featured: {
        type: Boolean,
        default: false
    },
    playlist: {
        type: String,
        default: null
    },
    nextUp: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Content'
    }],
    relatedContent: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Content'
    }]
}, {
    timestamps: true
});

// Calculate average rating before saving
contentSchema.pre('save', function(next) {
    if (this.ratings && this.ratings.length > 0) {
        const totalRating = this.ratings.reduce((acc, curr) => acc + curr.rating, 0);
        this.averageRating = totalRating / this.ratings.length;
    }
    next();
});

export const Content = mongoose.model('Content', contentSchema);
