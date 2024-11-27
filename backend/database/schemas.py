from mongoengine import Document, StringField, IntField, DateTimeField, URLField
from datetime import datetime

class Podcast(Document):
    topic = StringField(required=True)
    script = StringField(required=True)
    audio_path = URLField(required=True)  # Cloudinary URL
    thumbnail_url = URLField(required=True)  # Cloudinary URL
    voice = StringField(required=True)
    language = StringField(required=True)
    created_at = DateTimeField(default=datetime.utcnow)
    likes = IntField(default=0)
    plays = IntField(default=0)
    shares = IntField(default=0)
    
    meta = {
        'collection': 'podcasts',
        'indexes': [
            'created_at',
            'topic',
            '-likes',
            '-plays'
        ],
        'ordering': ['-created_at']
    }
