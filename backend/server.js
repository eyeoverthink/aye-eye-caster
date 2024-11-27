import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import OpenAI from 'openai';
import { v2 as cloudinary } from 'cloudinary';
import { connectDB } from './database/db.js';
import { Podcast } from './database/models/podcast.js';
import contentRoutes from './routes/content.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 3030;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`, {
    body: req.body,
    query: req.query,
    params: req.params
  });
  next();
});

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: false
});

// Initialize Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Connect to MongoDB
connectDB();

// ElevenLabs API endpoint
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

// Routes
app.use('/api/content', contentRoutes);

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// Get available voices from ElevenLabs
app.get('/voices', async (req, res) => {
  try {
    const response = await axios.get(`${ELEVENLABS_API_URL}/voices`, {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      }
    });

    // Extract relevant voice information
    const voices = response.data.voices.map(voice => ({
      id: voice.voice_id,
      name: voice.name,
      preview_url: voice.preview_url,
      labels: voice.labels
    }));

    res.json({ voices });
  } catch (error) {
    console.error('Error fetching voices:', error);
    res.status(500).json({ 
      error: 'Failed to fetch voices',
      details: error.response?.data || error.message 
    });
  }
});

// Generate podcast script using OpenAI
app.post('/generate-script', async (req, res) => {
  try {
    console.log('Received request for script generation:', req.body);
    const { topic, additionalContext } = req.body;

    if (!topic) {
      console.error('No topic provided');
      return res.status(400).json({ error: 'Topic is required' });
    }

    // Verify OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not found');
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // Construct the prompt
    const prompt = `Create an engaging podcast script about ${topic}.${
      additionalContext ? ` Consider this additional context: ${additionalContext}.` : ''
    }

    The script should:
    1. Have a clear introduction that hooks the listener
    2. Present information in a conversational, engaging way
    3. Include natural transitions between topics
    4. End with a strong conclusion
    5. Be around 500-800 words
    6. Use a friendly, informative tone
    7. Include appropriate pauses and emphasis points
    
    Format the script with clear paragraph breaks and natural pauses.`;

    console.log('Sending request to OpenAI with prompt:', prompt);

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert podcast script writer who creates engaging, well-structured content."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    console.log('Received response from OpenAI');
    const script = completion.choices[0].message.content;
    console.log('Generated script length:', script.length);

    res.json({ script });
  } catch (error) {
    console.error('Error generating script:', {
      message: error.message,
      name: error.name,
      code: error.code,
      response: error.response?.data,
      stack: error.stack
    });
    
    res.status(500).json({
      error: 'Failed to generate script',
      details: error.response?.data || error.message
    });
  }
});

// Generate audio with ElevenLabs
app.post('/generate-audio', async (req, res) => {
  try {
    const { script, voiceId, voiceSettings } = req.body;
    console.log('Generating audio for script:', { voiceId, voiceSettings });

    const response = await axios.post(
      `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`,
      {
        text: script,
        voice_settings: voiceSettings,
        model_id: 'eleven_monolingual_v1'
      },
      {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
        },
        responseType: 'arraybuffer'
      }
    );

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
          folder: 'podcast-audio'
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(response.data);
    });

    console.log('Audio uploaded to Cloudinary:', result.secure_url);
    res.json({ audio_url: result.secure_url });
  } catch (error) {
    console.error('Error generating audio:', error);
    res.status(500).json({
      error: 'Failed to generate audio',
      details: error.response?.data || error.message
    });
  }
});

// Generate image prompts from script
app.post('/generate-image-prompts', async (req, res) => {
  try {
    const { script, numberOfImages = 3 } = req.body;
    
    const prompt = `Given this podcast script, generate ${numberOfImages} image descriptions that would work well as visual accompaniments.
    The descriptions should:
    1. Capture key moments or themes from the script
    2. Be visually interesting and varied
    3. Work well with DALL-E image generation
    4. Be spaced throughout the podcast duration
    
    Format each description as a JSON array of objects with 'prompt' and 'timing' (in seconds) properties.
    
    Script:
    ${script}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert at creating visual descriptions for podcast content. Return only the JSON array."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7
    });

    const imagePrompts = JSON.parse(completion.choices[0].message.content);
    res.json({ imagePrompts });
  } catch (error) {
    console.error('Error generating image prompts:', error);
    res.status(500).json({
      error: 'Failed to generate image prompts',
      details: error.response?.data || error.message
    });
  }
});

// Generate images using DALL-E
async function generateImages(script, count = 3) {
  const imagePrompt = `Create a visually striking image for a podcast about: ${script.substring(0, 500)}. 
                      The image should be high quality, modern, and suitable for a podcast cover.`;
  
  const response = await openai.images.generate({
    prompt: imagePrompt,
    n: count,
    size: "1024x1024",
    quality: "standard",
    style: "vivid"
  });

  return response.data.map(img => ({
    url: img.url,
    timing: 0, // Default timing for now
    prompt: imagePrompt
  }));
}

app.post('/generate-images', async (req, res) => {
  try {
    const { prompts } = req.body;
    
    const generatedImages = await Promise.all(
      prompts.map(async (prompt) => {
        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: prompt.prompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
          style: "vivid"
        });

        // Upload to Cloudinary
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload(
            response.data[0].url,
            {
              folder: 'podcast-images'
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
        });

        return {
          url: result.secure_url,
          prompt: prompt.prompt,
          timing: prompt.timing
        };
      })
    );

    res.json({ images: generatedImages });
  } catch (error) {
    console.error('Error generating images:', error);
    res.status(500).json({
      error: 'Failed to generate images',
      details: error.response?.data || error.message
    });
  }
});

// Complete podcast generation endpoint
app.post('/generate-podcast', async (req, res) => {
  try {
    const { script, voiceId, voiceSettings, imageSettings } = req.body;
    console.log('Generating complete podcast:', { voiceId, voiceSettings, scriptLength: script.length });

    if (!script || !voiceId) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'Script and voiceId are required'
      });
    }

    // Clean up the script to remove any problematic characters
    const cleanScript = script.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');

    // Generate audio
    const audioResponse = await axios.post(
      `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`,
      {
        text: cleanScript,
        voice_settings: {
          stability: voiceSettings?.stability || 0.5,
          similarity_boost: voiceSettings?.similarityBoost || 0.5,
          style: voiceSettings?.style || 0.5,
        },
        model_id: 'eleven_monolingual_v1'
      },
      {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
        },
        responseType: 'arraybuffer'
      }
    ).catch(error => {
      console.error('ElevenLabs API Error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw new Error(`ElevenLabs API error: ${error.response?.data || error.message}`);
    });

    if (!audioResponse?.data) {
      throw new Error('No audio data received from ElevenLabs');
    }

    // Upload audio to Cloudinary
    const audioResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
          folder: 'podcast-audio'
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(audioResponse.data);
    });

    // Generate images
    let images = [];
    try {
      images = await generateImages(cleanScript);
    } catch (imageError) {
      console.error('Error generating images:', imageError);
      // Continue with podcast generation even if image generation fails
    }

    // Return the complete podcast data
    res.json({
      audioUrl: audioResult.secure_url,
      images: images
    });

  } catch (error) {
    console.error('Error generating podcast:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });
    
    const statusCode = error.response?.status || 500;
    res.status(statusCode).json({
      error: 'Failed to generate podcast',
      details: error.message
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log('Environment:', {
    port,
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    hasElevenLabsKey: !!process.env.ELEVENLABS_API_KEY,
    hasCloudinary: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
  });
});
