import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import openai
from elevenlabs import generate, save, set_api_key
from bson import ObjectId, json_util
import json
from database.mongodb import DatabaseOperations
from database.schemas import User, Podcast
from datetime import datetime
import traceback
from auth.routes import auth
from werkzeug.security import generate_password_hash
from auth.jwt_handler import generate_token
import cloudinary
import cloudinary.uploader

# Load environment variables
load_dotenv()

# Configure Cloudinary
cloudinary.config(
    cloud_name = "dvgyv4sgq",
    api_key = os.getenv('CLOUDINARY_API_KEY'),
    api_secret = os.getenv('CLOUDINARY_API_SECRET')
)

# Initialize Flask app
app = Flask(__name__)
app.config['CORS_HEADERS'] = 'Content-Type'
CORS(app, resources={r"/*": {"origins": "http://localhost:3010"}})

# Register the auth blueprint
app.register_blueprint(auth, url_prefix='/auth')

# API Keys Configuration
openai.api_key = os.getenv('OPENAI_API_KEY')
set_api_key(os.getenv('ELEVENLABS_API_KEY'))

@app.route('/seed-sample-podcasts', methods=['POST'])
def seed_sample_podcasts():
    try:
        print("Starting sample podcast seeding process...")
        
        # Create a test user if it doesn't exist
        test_user = User.objects(email="eyeoverthink@gmail.com").first()
        if not test_user:
            print("Creating test user...")
            try:
                test_user = DatabaseOperations.create_user(
                    username="eyeoverthink",
                    email="eyeoverthink@gmail.com",
                    password_hash="test_password_hash"
                )
                print("Test user created successfully")
            except Exception as user_error:
                print(f"Error creating test user: {str(user_error)}")
                print(traceback.format_exc())
                return jsonify({"error": f"Failed to create test user: {str(user_error)}"}), 500

        # Sample topics for diverse content
        sample_topics = [
            {
                "topic": "Introduction to Python Programming",
                "voice": "Rachel",
                "language": "English"
            }
        ]  # Single topic for testing

        created_podcasts = []
        for topic_data in sample_topics:
            try:
                print(f"\n=== Starting podcast generation for topic: {topic_data['topic']} ===")
                
                # Generate script using OpenAI
                print("\n1. Generating script with OpenAI...")
                try:
                    response = openai.ChatCompletion.create(
                        model="gpt-3.5-turbo",
                        messages=[
                            {"role": "system", "content": "You are a professional podcast script writer. Write a short, engaging script about programming topics."},
                            {"role": "user", "content": f"Write a 2-minute podcast script about {topic_data['topic']}. Include a brief introduction and 2-3 main points."}
                        ]
                    )
                    script = response.choices[0].message.content
                    print("✅ Script generated successfully")
                    print(f"Script length: {len(script)} characters")
                except Exception as openai_error:
                    print(f"❌ OpenAI Error: {str(openai_error)}")
                    print(traceback.format_exc())
                    continue

                # Generate thumbnail using DALL-E
                print("\n2. Generating thumbnail with DALL-E...")
                try:
                    image_response = openai.Image.create(
                        prompt=f"A minimalist, modern podcast cover art about Python programming. Use cool blue colors and simple Python logo.",
                        n=1,
                        size="1024x1024"
                    )
                    thumbnail_url = image_response['data'][0]['url']
                    print("✅ Thumbnail generated successfully")
                    print(f"Thumbnail URL: {thumbnail_url}")
                except Exception as dalle_error:
                    print(f"❌ DALL-E Error: {str(dalle_error)}")
                    print(traceback.format_exc())
                    continue

                # Generate audio file path
                audio_filename = f"sample_python_intro.mp3"
                audio_path = os.path.join('podcasts', audio_filename)
                
                # Generate audio using ElevenLabs
                print(f"\n3. Generating audio file: {audio_filename}")
                try:
                    audio = generate(
                        text=script,
                        voice=topic_data['voice']
                    )
                    save(audio, audio_path)
                    print("✅ Audio generated and saved successfully")
                    print(f"Audio saved to: {audio_path}")
                except Exception as audio_error:
                    print(f"❌ ElevenLabs Error: {str(audio_error)}")
                    print(traceback.format_exc())
                    continue

                # Create podcast document
                print("\n4. Creating podcast document in MongoDB...")
                try:
                    podcast = DatabaseOperations.create_podcast(
                        user_id=test_user.id,
                        topic=topic_data['topic'],
                        script=script,
                        audio_path=audio_path,
                        thumbnail_url=thumbnail_url,
                        voice=topic_data['voice'],
                        language=topic_data['language']
                    )
                    created_podcasts.append(podcast)
                    print(f"✅ Podcast '{topic_data['topic']}' created successfully")
                    print(f"Podcast ID: {podcast.id}")
                except Exception as db_error:
                    print(f"❌ Database Error: {str(db_error)}")
                    print(traceback.format_exc())
                    continue

            except Exception as topic_error:
                print(f"❌ Error processing topic '{topic_data['topic']}': {str(topic_error)}")
                print(traceback.format_exc())
                continue

        if not created_podcasts:
            error_msg = "Failed to create any podcasts. Check server logs for details."
            print(error_msg)
            return jsonify({"error": error_msg}), 500

        print(f"Successfully created {len(created_podcasts)} sample podcasts")
        return jsonify({
            "message": f"Created {len(created_podcasts)} sample podcasts",
            "podcasts": json.loads(json_util.dumps([p.to_mongo() for p in created_podcasts]))
        }), 200

    except Exception as e:
        print(f"Error in seed_sample_podcasts: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route('/generate-podcast', methods=['POST'])
def generate_podcast():
    try:
        data = request.json
        topic = data.get('topic')
        voice = data.get('voice', 'Rachel')
        language = data.get('language', 'English')

        # Generate script using OpenAI
        try:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a professional podcast script writer. Create engaging, well-structured content that flows naturally when spoken."},
                    {"role": "user", "content": f"""Write a podcast script about {topic}. Include:
                    - A catchy introduction
                    - Clear main points
                    - Engaging examples or stories
                    - A strong conclusion
                    Keep it under 5 minutes when read aloud."""}
                ]
            )
            script = response.choices[0].message.content
        except Exception as openai_error:
            print(f"OpenAI Error: {str(openai_error)}")
            return jsonify({"error": str(openai_error)}), 500

        # Generate audio using ElevenLabs
        try:
            audio = generate(
                text=script,
                voice=voice
            )
            
            # Save temporarily
            temp_path = f"temp_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.mp3"
            save(audio, temp_path)
            
            # Upload to Cloudinary
            upload_result = cloudinary.uploader.upload(
                temp_path,
                resource_type="video",  # Cloudinary uses "video" for audio files
                folder="podcasts"
            )
            
            # Clean up temp file
            os.remove(temp_path)
            
            audio_url = upload_result['secure_url']
            
        except Exception as audio_error:
            print(f"Audio Generation Error: {str(audio_error)}")
            return jsonify({"error": str(audio_error)}), 500

        # Create podcast document
        try:
            # Generate a thumbnail using DALL-E
            thumbnail_response = openai.Image.create(
                prompt=f"A professional podcast cover art for a podcast about {topic}. Modern, minimal style.",
                n=1,
                size="1024x1024"
            )
            thumbnail_url = thumbnail_response['data'][0]['url']
            
            # Upload thumbnail to Cloudinary
            thumbnail_upload = cloudinary.uploader.upload(
                thumbnail_url,
                folder="podcast_thumbnails"
            )
            
            podcast = DatabaseOperations.create_podcast(
                topic=topic,
                script=script,
                audio_path=audio_url,
                thumbnail_url=thumbnail_upload['secure_url'],
                voice=voice,
                language=language
            )
        except Exception as db_error:
            print(f"Database Error: {str(db_error)}")
            return jsonify({"error": str(db_error)}), 500

        return jsonify({
            "message": "Podcast generated successfully",
            "podcast": {
                "id": str(podcast.id),
                "topic": podcast.topic,
                "audio_url": podcast.audio_path,
                "thumbnail_url": podcast.thumbnail_url,
                "script": podcast.script
            }
        }), 200
    except Exception as e:
        print(f"Error in generate_podcast: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/trending-podcasts', methods=['GET'])
def get_trending_podcasts():
    try:
        limit = int(request.args.get('limit', 10))
        podcasts = DatabaseOperations.get_trending_podcasts(limit=limit)
        return jsonify(json.loads(json_util.dumps([p.to_mongo() for p in podcasts]))), 200
    except Exception as e:
        print(f"Error in get_trending_podcasts: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route('/user-podcasts/<user_id>', methods=['GET'])
def get_user_podcasts(user_id):
    try:
        limit = int(request.args.get('limit', 10))
        skip = int(request.args.get('skip', 0))
        podcasts = DatabaseOperations.get_user_podcasts(user_id, limit=limit, skip=skip)
        return jsonify(json.loads(json_util.dumps([p.to_mongo() for p in podcasts]))), 200
    except Exception as e:
        print(f"Error in get_user_podcasts: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route('/podcast/<podcast_id>/<action>', methods=['POST'])
def update_podcast_stats(podcast_id, action):
    try:
        if action not in ['play', 'like', 'share']:
            return jsonify({"error": "Invalid action"}), 400
        
        success = DatabaseOperations.increment_podcast_stat(podcast_id, f"{action}s")
        if success:
            return jsonify({"message": f"Updated {action} count"}), 200
        return jsonify({"error": "Podcast not found"}), 404
    except Exception as e:
        print(f"Error in update_podcast_stats: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route('/setup-admin', methods=['GET'])
def setup_admin():
    try:
        # Check if admin user already exists
        admin_email = "eyeoverthink@gmail.com"
        existing_user = User.objects(email=admin_email).first()
        
        if existing_user:
            # Update role to admin if not already
            if existing_user.role != 'admin':
                existing_user.role = 'admin'
                existing_user.save()
            
            # Generate new token with User object
            token = generate_token(existing_user)
            
            return jsonify({
                "message": "Admin user already exists",
                "token": token,
                "user": {
                    "id": str(existing_user.id),
                    "email": existing_user.email,
                    "username": existing_user.username,
                    "role": existing_user.role
                }
            }), 200
        
        # Create new admin user
        password_hash = generate_password_hash("EyeCastr2024!")
        new_user = User(
            username="EyeThink",
            email=admin_email,
            password_hash=password_hash,
            role='admin'
        ).save()
        
        # Generate token with User object
        token = generate_token(new_user)
        
        return jsonify({
            "message": "Admin user created successfully",
            "token": token,
            "user": {
                "id": str(new_user.id),
                "email": new_user.email,
                "username": new_user.username,
                "role": new_user.role
            }
        }), 201
        
    except Exception as e:
        print(f"Error in setup_admin: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    os.makedirs('podcasts', exist_ok=True)
    app.run(debug=True, port=3030)
