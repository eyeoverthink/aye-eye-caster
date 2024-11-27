import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';
import { connectDB } from './database/db.js';
import { Podcast } from './database/models/podcast.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Configure OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Connect to MongoDB
connectDB();

// Generate Podcast Endpoint
app.post('/generate-podcast', async (req, res) => {
    try {
        console.log('Received request:', req.body);
        const { topic, voice = '21m00Tcm4TlvDq8ikWAM', language = 'English' } = req.body;

        if (!topic) {
            return res.status(400).json({ error: 'Topic is required' });
        }

        console.log('Generating script with OpenAI...');
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a professional podcast script writer. Create engaging, well-structured content that flows naturally when spoken."
                },
                {
                    role: "user",
                    content: `Write a podcast script about ${topic}. Include:
                    - A catchy introduction
                    - Clear main points
                    - Engaging examples or stories
                    - A strong conclusion
                    Keep it under 5 minutes when read aloud.`
                }
            ]
        });

        const script = completion.choices[0].message.content;
        console.log('Script generated successfully');

        console.log('Generating audio with ElevenLabs...');
        const response = await axios({
            method: 'POST',
            url: `https://api.elevenlabs.io/v1/text-to-speech/${voice}`,
            headers: {
                'Accept': 'audio/mpeg',
                'xi-api-key': process.env.ELEVENLABS_API_KEY,
                'Content-Type': 'application/json'
            },
            data: {
                text: script,
                model_id: 'eleven_monolingual_v1',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.5
                }
            },
            responseType: 'arraybuffer'
        });

        console.log('Audio generated successfully');

        // Save audio temporarily
        const tempPath = path.join(__dirname, `temp_${Date.now()}.mp3`);
        fs.writeFileSync(tempPath, response.data);
        console.log('Audio saved temporarily');

        console.log('Uploading audio to Cloudinary...');
        const audioUpload = await cloudinary.uploader.upload(tempPath, {
            resource_type: "video",
            folder: "podcasts"
        });
        console.log('Audio uploaded to Cloudinary');

        // Clean up temp file
        fs.unlinkSync(tempPath);

        console.log('Generating thumbnail with DALL-E...');
        const thumbnailResponse = await openai.images.generate({
            prompt: `A professional podcast cover art for a podcast about ${topic}. Modern, minimal style.`,
            n: 1,
            size: "1024x1024"
        });
        console.log('Thumbnail generated');

        console.log('Uploading thumbnail to Cloudinary...');
        const thumbnailUpload = await cloudinary.uploader.upload(thumbnailResponse.data[0].url, {
            folder: "podcast_thumbnails"
        });
        console.log('Thumbnail uploaded');

        console.log('Saving to MongoDB...');
        const podcast = await Podcast.create({
            topic,
            script,
            audio_path: audioUpload.secure_url,
            thumbnail_url: thumbnailUpload.secure_url,
            voice,
            language
        });
        console.log('Saved to MongoDB');

        res.json({
            message: "Podcast generated successfully",
            podcast: {
                id: podcast._id,
                topic: podcast.topic,
                audio_url: podcast.audio_path,
                thumbnail_url: podcast.thumbnail_url,
                script: podcast.script
            }
        });
    } catch (error) {
        console.error('Error generating podcast:', error);
        res.status(500).json({ 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Get trending podcasts
app.get('/trending-podcasts', async (req, res) => {
    try {
        const podcasts = await Podcast.find()
            .sort({ plays: -1, likes: -1 })
            .limit(10);
        res.json(podcasts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update podcast stats
app.post('/podcast/:id/stats', async (req, res) => {
    try {
        const { action } = req.body;
        const update = {};
        
        if (action === 'play') update.plays = 1;
        if (action === 'like') update.likes = 1;
        if (action === 'share') update.shares = 1;
        
        const podcast = await Podcast.findByIdAndUpdate(
            req.params.id,
            { $inc: update },
            { new: true }
        );
        
        res.json(podcast);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3030;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
