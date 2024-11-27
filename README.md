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
