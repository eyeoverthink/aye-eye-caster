# AI Podcast Generator

A modern, Spotify-inspired web application that generates AI-powered podcasts from any topic. Built with React, Node.js, and powered by OpenAI and ElevenLabs.

## Features

- 🎙️ Generate podcast scripts using GPT-3.5
- 🎨 Create custom podcast thumbnails with DALL-E 3
- 🗣️ Convert text to natural-sounding speech with ElevenLabs
- 💾 Store podcasts in MongoDB and media in Cloudinary
- 🎵 Spotify-like audio player interface
- 📱 Responsive design for all devices

## Tech Stack

### Frontend
- React with TypeScript
- TailwindCSS for styling
- React H5 Audio Player
- Axios for API calls

### Backend
- Node.js with Express
- MongoDB with Mongoose
- OpenAI API (GPT-3.5 & DALL-E 3)
- ElevenLabs API for voice synthesis
- Cloudinary for media storage

## Prerequisites

Before running this application, make sure you have:

1. Node.js (v14 or higher)
2. MongoDB installed and running
3. API keys for:
   - OpenAI
   - ElevenLabs
   - Cloudinary
   - MongoDB connection string

## Setup

1. Clone the repository:
```bash
git clone [repository-url]
```

2. Install dependencies for both frontend and backend:
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. Create a .env file in the backend directory with your API keys:
```env
OPENAI_API_KEY=your_openai_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
MONGODB_URI=your_mongodb_connection_string
```

4. Start the servers:
```bash
# Backend (from backend directory)
npm start

# Frontend (from frontend directory)
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:3030

## How It Works

The AI Podcast Generator uses a React frontend to interact with a Node.js backend that orchestrates the podcast generation process:

1. **Script Generation**
   - Input your podcast topic and preferences through the web interface
   - The backend uses OpenAI's GPT-3.5 to generate an engaging script
   - You can customize the length, style, and tone of the script

2. **Voice Selection**
   - Choose from a variety of AI voices provided by ElevenLabs
   - Customize voice settings like stability and style
   - Preview voices before generating the full podcast

3. **Image Generation**
   - Automatically generates podcast cover art using DALL-E 3
   - Option to customize image prompts or let AI generate them from the script
   - Multiple images can be generated with specific timings for visual storytelling

4. **Audio Processing**
   - Converts the script to natural-sounding speech using ElevenLabs
   - Handles audio processing and storage through Cloudinary
   - Provides a Spotify-like player interface for playback

## API Endpoints

The backend server (running on port 3030) provides the following REST endpoints:

### Script Generation
- `POST /generate-script`
  - Generates a podcast script based on your topic
  - Request body: 
    ```json
    {
      "topic": "Your podcast topic",
      "length": "short|medium|long",
      "tone": "casual|professional|entertaining"
    }
    ```

### Voice Management
- `GET /voices`
  - Fetches available voices from ElevenLabs
  - Returns list of voices with preview URLs

### Podcast Generation
- `POST /generate-podcast`
  - Creates a complete podcast with script, audio, and images
  - Request body:
    ```json
    {
      "script": "Generated or custom script",
      "voiceId": "selected_voice_id",
      "voiceSettings": {
        "stability": 0.5,
        "similarityBoost": 0.5,
        "style": 0.5
      },
      "imageSettings": {
        "generateFromScript": true,
        "customPrompts": []
      }
    }
    ```

## Usage

1. Enter a topic for your podcast in the input field
2. Click "Generate Podcast"
3. Wait while the system:
   - Generates a script using GPT-3.5
   - Creates a custom thumbnail with DALL-E
   - Converts the script to speech using ElevenLabs
4. Once complete, you can:
   - Play the podcast
   - Download the audio file
   - View the transcript
   - See the AI-generated thumbnail

## Common Workflows

1. **Quick Podcast Generation**
   - Visit http://localhost:3000
   - Enter your topic in the main input field
   - Click "Generate Podcast"
   - Wait for the complete podcast to be generated

2. **Custom Podcast Creation**
   - Use the advanced settings panel
   - Select specific voice and customize settings
   - Add custom image prompts if desired
   - Generate and preview the script
   - Proceed with podcast generation

3. **Managing Generated Content**
   - All generated podcasts are saved automatically
   - Access your podcast library from the main interface
   - Download, share, or delete podcasts as needed

## Recent Updates

- 🎨 Added Spotify-inspired dark theme
- 🔄 Improved error handling
- 🖼️ Enhanced image generation with DALL-E 3
- 🎵 Updated audio player styling
- 🚀 Optimized media upload process

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
