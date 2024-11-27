import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { BiTime, BiPlay, BiPause } from 'react-icons/bi';
import { format, isValid, parseISO } from 'date-fns';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import { RHAP_UI } from 'react-h5-audio-player';

interface Podcast {
  _id: string;
  topic: string;
  thumbnail_url: string;
  createdAt: string;
  plays: number;
  audio_url: string;
}

const Recent: React.FC = () => {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<{[key: string]: string}>({});

  useEffect(() => {
    const fetchRecentPodcasts = async () => {
      try {
        const response = await axios.get('http://localhost:3030/api/content/podcasts');
        // Sort by created date descending to show most recent first
        const sortedPodcasts = response.data.sort((a: Podcast, b: Podcast) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setPodcasts(sortedPodcasts.slice(0, 10)); // Show only the 10 most recent podcasts
        setLoading(false);
      } catch (err) {
        setError('Failed to load recent podcasts');
        setLoading(false);
      }
    };

    fetchRecentPodcasts();
  }, []);

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, 'MMM d, yyyy') : 'Invalid date';
    } catch {
      return 'Invalid date';
    }
  };

  const handlePlay = (podcastId: string) => {
    if (currentlyPlaying === podcastId) {
      setCurrentlyPlaying(null);
    } else {
      setCurrentlyPlaying(podcastId);
    }
  };

  const handleAudioError = (podcastId: string) => {
    setAudioError(prev => ({
      ...prev,
      [podcastId]: 'Audio content unavailable. Please try again later.'
    }));
  };

  if (loading) return <div className="flex justify-center items-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-spotify-green"></div>
  </div>;
  if (error) return <div className="text-red-500 text-center p-4">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Recently Added</h1>
      
      <div className="grid grid-cols-1 gap-4">
        {podcasts.map((podcast) => (
          <div
            key={podcast._id}
            className="bg-neutral-800 p-4 rounded-lg hover:bg-neutral-700 transition"
          >
            <div className="flex items-start gap-4">
              <div className="w-24 h-24 flex-shrink-0">
                <img
                  src={podcast.thumbnail_url}
                  alt={podcast.topic}
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://via.placeholder.com/96x96?text=No+Image';
                  }}
                />
              </div>
              <div className="flex-grow">
                <div className="flex justify-between items-start">
                  <div>
                    <Link
                      to={`/podcast/${podcast._id}`}
                      className="font-semibold hover:text-emerald-400 transition"
                    >
                      {podcast.topic}
                    </Link>
                    <div className="flex items-center gap-2 text-sm text-neutral-400 mt-1">
                      <BiTime className="h-4 w-4" />
                      <span>{formatDate(podcast.createdAt)}</span>
                      <span className="flex items-center ml-4">
                        <BiPlay className="h-4 w-4 mr-1" />
                        {podcast.plays || 0} plays
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handlePlay(podcast._id)}
                    className="p-2 rounded-full bg-emerald-600 hover:bg-emerald-500 transition"
                  >
                    {currentlyPlaying === podcast._id ? (
                      <BiPause className="h-5 w-5" />
                    ) : (
                      <BiPlay className="h-5 w-5" />
                    )}
                  </button>
                </div>

                {currentlyPlaying === podcast._id && (
                  <div className="mt-4">
                    <AudioPlayer
                      src={podcast.audio_url}
                      onError={() => handleAudioError(podcast._id)}
                      autoPlay
                      layout="horizontal"
                      className="rounded-lg overflow-hidden"
                      customProgressBarSection={[
                        RHAP_UI.PROGRESS_BAR,
                        RHAP_UI.CURRENT_TIME,
                        RHAP_UI.DURATION,
                      ]}
                      customControlsSection={[
                        RHAP_UI.MAIN_CONTROLS,
                        RHAP_UI.VOLUME,
                      ]}
                    />
                    {audioError[podcast._id] && (
                      <div className="text-red-400 text-sm mt-2">
                        {audioError[podcast._id]}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {podcasts.length === 0 && (
          <div className="text-center py-12 text-neutral-400">
            <p>No recently added podcasts.</p>
            <Link
              to="/"
              className="inline-block mt-4 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition"
            >
              Create New Podcast
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Recent;
