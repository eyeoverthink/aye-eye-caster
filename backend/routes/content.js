import express from 'express';
import { Content } from '../database/models/content.js';
import { Podcast } from '../database/models/podcast.js';

const router = express.Router();

// Get trending podcasts
router.get('/trending-podcasts', async (req, res) => {
  try {
    console.log('Fetching trending podcasts...');
    
    // Get podcasts sorted by views and likes
    const trendingPodcasts = await Podcast.find({})
      .select('topic script audio_url thumbnail_url images voice_id views likes createdAt')
      .sort({ views: -1, likes: -1, createdAt: -1 }) // Sort by views, then likes, then newest
      .limit(12); // Limit to 12 trending podcasts

    console.log(`Found ${trendingPodcasts.length} trending podcasts`);
    
    if (!trendingPodcasts || trendingPodcasts.length === 0) {
      return res.status(404).json({ 
        message: 'No podcasts found',
        data: [] 
      });
    }

    res.json(trendingPodcasts);
  } catch (error) {
    console.error('Error fetching trending podcasts:', error);
    res.status(500).json({ 
      message: 'Error fetching trending podcasts',
      error: error.message 
    });
  }
});

// Get all podcasts
router.get('/podcasts', async (req, res) => {
  try {
    const podcasts = await Podcast.find().sort({ createdAt: -1 });
    res.json(podcasts);
  } catch (error) {
    console.error('Error fetching podcasts:', error);
    res.status(500).json({ error: 'Failed to fetch podcasts' });
  }
});

// Create a new podcast
router.post('/podcasts', async (req, res) => {
  try {
    const {
      topic,
      script,
      audio_url,
      images,
      voice_id,
      voice_settings,
      additional_context
    } = req.body;

    // Validate required fields
    if (!topic || !script || !audio_url || !voice_id) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'topic, script, audio_url, and voice_id are required'
      });
    }

    // Process images and set thumbnail
    const processedImages = images?.map(img => ({
      url: img.url,
      timestamp: img.timing || 0,
      prompt: img.prompt
    })) || [];

    // Use the first image as thumbnail, or null if no images
    const thumbnail_url = processedImages.length > 0 ? processedImages[0].url : null;

    const podcast = new Podcast({
      topic,
      script,
      audio_url,
      thumbnail_url,
      images: processedImages,
      voice_id,
      voice_settings,
      additional_context,
      views: 0,
      likes: 0
    });

    const savedPodcast = await podcast.save();
    res.status(201).json(savedPodcast);
  } catch (error) {
    console.error('Error saving podcast:', error);
    res.status(500).json({ 
      error: 'Failed to save podcast',
      details: error.message
    });
  }
});

// Get a single podcast by ID
router.get('/podcasts/:id', async (req, res) => {
  try {
    const podcast = await Podcast.findById(req.params.id);
    if (!podcast) {
      return res.status(404).json({ error: 'Podcast not found' });
    }
    res.json(podcast);
  } catch (error) {
    console.error('Error fetching podcast:', error);
    res.status(500).json({ error: 'Failed to fetch podcast' });
  }
});

// Update podcast views
router.put('/podcasts/:id/views', async (req, res) => {
  try {
    const podcast = await Podcast.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!podcast) {
      return res.status(404).json({ error: 'Podcast not found' });
    }
    res.json(podcast);
  } catch (error) {
    console.error('Error updating podcast views:', error);
    res.status(500).json({ error: 'Failed to update podcast views' });
  }
});

// Like/unlike a podcast
router.put('/podcasts/:id/like', async (req, res) => {
  try {
    const podcast = await Podcast.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: 1 } },
      { new: true }
    );
    if (!podcast) {
      return res.status(404).json({ error: 'Podcast not found' });
    }
    res.json(podcast);
  } catch (error) {
    console.error('Error updating podcast likes:', error);
    res.status(500).json({ error: 'Failed to update podcast likes' });
  }
});

// Create content entry for a podcast
router.post('/', async (req, res) => {
  try {
    const { podcastId, title, description, category, tags } = req.body;

    // Verify podcast exists
    const podcast = await Podcast.findById(podcastId);
    if (!podcast) {
      return res.status(404).json({ message: 'Podcast not found' });
    }

    const content = new Content({
      podcastId,
      title,
      description,
      category,
      tags
    });

    await content.save();
    res.status(201).json(content);
  } catch (error) {
    console.error('Error creating content:', error);
    res.status(500).json({ message: 'Error creating content entry', error: error.message });
  }
});

// Get content by ID
router.get('/:id', async (req, res) => {
  try {
    const content = await Content.findById(req.params.id)
      .populate('podcastId');
    
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    res.json(content);
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ message: 'Error fetching content', error: error.message });
  }
});

// List all content entries
router.get('/', async (req, res) => {
  try {
    const content = await Content.find()
      .populate('podcastId')
      .sort({ createdAt: -1 });
    res.json(content);
  } catch (error) {
    console.error('Error fetching content list:', error);
    res.status(500).json({ message: 'Error fetching content list', error: error.message });
  }
});

// Add a comment to content
router.post('/:id/comments', async (req, res) => {
  try {
    const { content: commentContent, author } = req.body;
    const content = await Content.findById(req.params.id);
    
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    content.comments.push({
      content: commentContent,
      author
    });

    await content.save();
    res.status(201).json(content.comments[content.comments.length - 1]);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Error adding comment', error: error.message });
  }
});

// Add a rating to content
router.post('/:id/ratings', async (req, res) => {
  try {
    const { rating, user } = req.body;
    const content = await Content.findById(req.params.id);
    
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    // Check if user has already rated
    const existingRating = content.ratings.find(r => r.user === user);
    if (existingRating) {
      existingRating.rating = rating;
    } else {
      content.ratings.push({ rating, user });
    }

    await content.save();
    res.json({ averageRating: content.averageRating });
  } catch (error) {
    console.error('Error adding rating:', error);
    res.status(500).json({ message: 'Error adding rating', error: error.message });
  }
});

export default router;
