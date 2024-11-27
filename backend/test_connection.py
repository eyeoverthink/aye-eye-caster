from dotenv import load_dotenv
import os
import openai
from elevenlabs import set_api_key
from mongoengine import connect
from pymongo.errors import ServerSelectionTimeoutError

def test_connections():
    # Load environment variables
    load_dotenv()
    
    # Test MongoDB Connection
    print("\nTesting MongoDB Connection...")
    mongodb_uri = os.getenv('MONGODB_URI')
    print(f"MongoDB URI exists: {'Yes' if mongodb_uri else 'No'}")
    
    try:
        connect(
            host=mongodb_uri,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000
        )
        print("✅ MongoDB connection successful")
    except ServerSelectionTimeoutError as e:
        print(f"❌ MongoDB connection failed: {str(e)}")
    except Exception as e:
        print(f"❌ MongoDB error: {str(e)}")
    
    # Test OpenAI API Key
    print("\nTesting OpenAI API Key...")
    openai_key = os.getenv('OPENAI_API_KEY')
    print(f"OpenAI API key exists: {'Yes' if openai_key else 'No'}")
    if openai_key:
        openai.api_key = openai_key
        try:
            openai.Model.list()
            print("✅ OpenAI API key is valid")
        except Exception as e:
            print(f"❌ OpenAI API key is invalid: {str(e)}")
    
    # Test ElevenLabs API Key
    print("\nTesting ElevenLabs API Key...")
    elevenlabs_key = os.getenv('ELEVENLABS_API_KEY')
    print(f"ElevenLabs API key exists: {'Yes' if elevenlabs_key else 'No'}")
    if elevenlabs_key:
        set_api_key(elevenlabs_key)
        # Note: We don't make an actual API call to ElevenLabs here
        # as it would consume credits
        print("✅ ElevenLabs API key is set (validity not tested)")

if __name__ == "__main__":
    test_connections()
