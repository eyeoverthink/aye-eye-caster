# Aye Eye Caster - AI-Powered Podcast Platform

A modern, AI-driven podcast platform that allows users to discover, manage, and listen to their favorite podcasts with an intuitive interface and smart features.

## Features

- **Recent Podcasts**: Browse through the 10 most recent podcasts, sorted by creation date
- **Podcast Library**: Access your complete collection of podcasts
- **Audio Playback**: High-quality audio playback with React H5 Audio Player
- **Modern UI**: Clean and responsive interface built with React and Tailwind CSS
- **Error Handling**: Robust error handling for API calls and audio playback
- **Loading States**: Smooth loading animations for better user experience

## Technical Stack

### Frontend
- React with TypeScript
- Tailwind CSS for styling
- Axios for API requests
- React Router for navigation
- React H5 Audio Player for audio playback

### Backend
- Node.js server
- RESTful API endpoints
- Podcast content management system

## API Endpoints

- `/api/content/podcasts`: Fetch podcast listings
  - Used by both Recent and Library components
  - Returns podcast metadata including title, description, and audio URL

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/eyeoverthink/aye-eye-caster.git
```

2. Install dependencies:
```bash
cd aye-eye-caster
cd frontend && npm install
cd ../backend && npm install
```

3. Start the development servers:
```bash
# Start backend server (from backend directory)
npm start

# Start frontend development server (from frontend directory)
npm start
```

4. Access the application at `http://localhost:3000`

## Project Structure

```
aye-eye-caster/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Recent.tsx
│   │   │   ├── Library.tsx
│   │   │   └── ...
│   │   └── ...
├── backend/
│   ├── api/
│   └── ...
└── README.md
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License and Copyright

 2024 Eyeoverthink LLC. All rights reserved.

This project and its contents are protected by copyright law. Any use, reproduction, or distribution of this project without express written permission from Eyeoverthink LLC is strictly prohibited.
