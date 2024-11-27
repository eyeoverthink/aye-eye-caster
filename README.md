# AI Podcast Generator

## Overview
An AI-powered podcast generation platform that allows users to create custom podcasts with AI-generated scripts, voices, and thumbnails.

## Features
- 🎙️ AI-generated podcast scripts
- 🔊 Multiple voice and language options
- 🖼️ AI-generated podcast thumbnails
- 💾 MongoDB storage for podcast metadata

## Tech Stack
- Frontend: React with Tailwind CSS
- Backend: Flask
- Database: MongoDB
- AI Services: OpenAI, ElevenLabs

## Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 14+
- MongoDB
- OpenAI API Key
- ElevenLabs API Key

### Backend Setup
1. Navigate to `backend/`
2. Create a virtual environment
3. Install dependencies: `pip install -r requirements.txt`
4. Copy `.env.example` to `.env` and fill in API keys

### Frontend Setup
1. Navigate to `frontend/`
2. Install dependencies: `npm install`
3. Start development server: `npm start`

## Environment Variables
- `OPENAI_API_KEY`: OpenAI API authentication
- `MONGODB_URI`: MongoDB connection string
- `ELEVENLABS_API_KEY`: ElevenLabs voice generation key

## Contributing
Please read `CONTRIBUTING.md` for details on our code of conduct and the process for submitting pull requests.

## License
This project is licensed under the MIT License.
