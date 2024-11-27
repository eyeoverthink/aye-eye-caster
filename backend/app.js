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

// Function to fetch and upload DALL-E image to Cloudinary
async function fetchAndUploadImage(imageUrl) {
    try {
        // Download the image as a buffer
        const imageResponse = await axios({
            url: imageUrl,
            responseType: 'arraybuffer',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            }
        });

        // Convert buffer to base64
        const base64Image = Buffer.from(imageResponse.data).toString('base64');
        const dataURI = `data:image/png;base64,${base64Image}`;

        // Upload to Cloudinary
        const uploadResult = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload(dataURI, {
                folder: 'podcast_thumbnails'
            }, (error, result) => {
                if (error) reject(error);
                else resolve(result);
            });
        });

        return uploadResult.secure_url;
    } catch (error) {
        console.error('Error in fetchAndUploadImage:', error);
        throw new Error('Failed to process image: ' + error.message);
    }
}

// Function to generate podcast script
async function generatePodcastScript(topic) {
    try {
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
        return script;
    } catch (error) {
        console.error('Error generating script:', error);
        throw new Error('Failed to generate script: ' + error.message);
    }
}

// Function to generate audio
async function generateAudio(script) {
    try {
        console.log('Generating audio with ElevenLabs...');
        const response = await axios({
            method: 'POST',
            url: `https://api.elevenlabs.io/v1/text-to-speech/${'21m00Tcm4TlvDq8ikWAM'}`,
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
        return response.data;
    } catch (error) {
        console.error('Error generating audio:', error);
        throw new Error('Failed to generate audio: ' + error.message);
    }
}

// Function to upload audio to Cloudinary
async function uploadAudioToCloudinary(audioBuffer) {
    try {
        console.log('Uploading audio to Cloudinary...');
        const uploadResponse = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    folder: "podcasts",
                    resource_type: "video"
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            ).end(audioBuffer);
        });

        console.log('Audio uploaded to Cloudinary');
        return uploadResponse;
    } catch (error) {
        console.error('Error uploading audio:', error);
        throw new Error('Failed to upload audio: ' + error.message);
    }
}

// Generate Podcast Endpoint
app.post('/generate-podcast', async (req, res) => {
    try {
        const { topic } = req.body;

        if (!topic) {
            return res.status(400).json({ error: 'Topic is required' });
        }

        console.log('Generating script...');
        const script = await generatePodcastScript(topic);

        console.log('Generating audio...');
        const audioBuffer = await generateAudio(script);

        console.log('Uploading audio to Cloudinary...');
        const audioUpload = await uploadAudioToCloudinary(audioBuffer);

        console.log('Generating thumbnail with DALL-E...');
        const thumbnailResponse = await openai.images.generate({
            model: "dall-e-3",
            prompt: `Create a podcast cover art for a topic about: ${topic}. Modern, professional style with subtle imagery.`,
            n: 1,
            size: "1024x1024",
            response_format: "b64_json"  // Request base64 format
        });

        console.log('Uploading thumbnail to Cloudinary...');
        // Upload base64 image directly to Cloudinary
        const thumbnailUpload = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload(
                `data:image/png;base64,${thumbnailResponse.data[0].b64_json}`,
                {
                    folder: "podcast_thumbnails",
                    resource_type: "image"
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
        });

        console.log('Creating podcast document...');
        const podcast = new Podcast({
            topic,
            audio_url: audioUpload.secure_url,
            thumbnail_url: thumbnailUpload.secure_url,
            script
        });

        await podcast.save();

        res.json({
            podcast: {
                id: podcast._id,
                topic: podcast.topic,
                audio_url: podcast.audio_url,
                thumbnail_url: podcast.thumbnail_url,
                script: podcast.script,
                createdAt: podcast.createdAt
            }
        });
    } catch (error) {
        console.error('Error in generate-podcast:', error);
        res.status(500).json({
            error: 'Failed to generate podcast',
            details: error.message
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

// Get all podcasts
app.get('/podcasts', async (req, res) => {
    try {
        const podcasts = await Podcast.find().sort({ createdAt: -1 }).limit(10);
        res.json(podcasts);
    } catch (error) {
        console.error('Error fetching podcasts:', error);
        res.status(500).json({ error: 'Failed to fetch podcasts' });
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
