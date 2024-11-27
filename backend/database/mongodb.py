from mongoengine import connect
from dotenv import load_dotenv
import os
import sys
from datetime import datetime
from .schemas import Podcast

# Load environment variables
load_dotenv()

def connect_db():
    try:
        # Get MongoDB URI from environment variables
        mongodb_uri = os.getenv('MONGODB_URI')
        if not mongodb_uri:
            raise ValueError("MongoDB URI not found in environment variables")
            
        # Connect to MongoDB
        conn = connect(host=mongodb_uri)
        print(f"Connected to MongoDB {conn.get_database().name}")
    except Exception as error:
        print("Failed to connect to MongoDB", error)
        sys.exit(1)  # 1 is failure, 0 is success

# Connect on import
connect_db()

class DatabaseOperations:
    @staticmethod
    def create_podcast(topic, script, audio_path, thumbnail_url, voice, language):
        """Create a new podcast entry"""
        podcast = Podcast(
            topic=topic,
            script=script,
            audio_path=audio_path,
            thumbnail_url=thumbnail_url,
            voice=voice,
            language=language
        )
        return podcast.save()

    @staticmethod
    def get_trending_podcasts(limit=10):
        """Get trending podcasts based on plays and likes"""
        return Podcast.objects().order_by('-plays', '-likes').limit(limit)

    @staticmethod
    def increment_podcast_stat(podcast_id, stat_name):
        """Increment a podcast statistic (plays, likes, or shares)"""
        podcast = Podcast.objects(id=podcast_id).first()
        if podcast:
            if stat_name == 'plays':
                podcast.plays += 1
            elif stat_name == 'likes':
                podcast.likes += 1
            elif stat_name == 'shares':
                podcast.shares += 1
            podcast.save()
            return True
        return False
