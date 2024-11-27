import jwt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify
import os
from dotenv import load_dotenv

load_dotenv()

JWT_SECRET = os.getenv('JWT_SECRET', 'your-secret-key')  # In production, always use environment variable
JWT_ALGORITHM = "HS256"
TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

def generate_token(user_data):
    """Generate JWT token for user"""
    # Extract only the fields we need
    user_dict = {
        "_id": str(user_data["_id"]) if "_id" in user_data else str(user_data.id) if hasattr(user_data, "id") else None,
        "email": user_data.get("email") if isinstance(user_data, dict) else user_data.email if hasattr(user_data, "email") else None,
        "username": user_data.get("username") if isinstance(user_data, dict) else user_data.username if hasattr(user_data, "username") else None,
        "role": user_data.get("role") if isinstance(user_data, dict) else user_data.role if hasattr(user_data, "role") else "user"
    }

    payload = {
        "user_id": user_dict["_id"],
        "email": user_dict["email"],
        "username": user_dict["username"],
        "role": user_dict["role"],
        "exp": datetime.utcnow() + timedelta(days=1)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

def verify_token(token: str) -> dict:
    """Verify a JWT token and return the payload"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise Exception("Token has expired")
    except jwt.InvalidTokenError:
        raise Exception("Invalid token")

def token_required(f):
    """Decorator to protect routes with JWT authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')

        if auth_header:
            try:
                token = auth_header.split(" ")[1]  # Bearer <token>
            except IndexError:
                return jsonify({"error": "Invalid token format"}), 401

        if not token:
            return jsonify({"error": "Token is missing"}), 401

        try:
            current_user = verify_token(token)
            return f(current_user, *args, **kwargs)
        except Exception as e:
            return jsonify({"error": str(e)}), 401

    return decorated
