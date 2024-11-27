from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from database.mongodb import DatabaseOperations
from database.schemas import User
from .jwt_handler import generate_token, token_required
import re

auth = Blueprint('auth', __name__)

def is_valid_email(email: str) -> bool:
    """Check if email is valid"""
    pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    return re.match(pattern, email) is not None

def is_strong_password(password: str) -> bool:
    """Check if password meets security requirements"""
    # At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    if len(password) < 8:
        return False
    if not re.search(r'[A-Z]', password):
        return False
    if not re.search(r'[a-z]', password):
        return False
    if not re.search(r'\d', password):
        return False
    return True

@auth.route('/signup', methods=['POST'])
def signup():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    username = data.get('username')

    # Validate input
    if not all([email, password, username]):
        return jsonify({"error": "All fields are required"}), 400
    
    if not is_valid_email(email):
        return jsonify({"error": "Invalid email format"}), 400
    
    if not is_strong_password(password):
        return jsonify({"error": "Password must be at least 8 characters and contain uppercase, lowercase, and numbers"}), 400

    # Check if user already exists
    existing_user = User.objects(email=email).first()
    if existing_user:
        return jsonify({"error": "Email already registered"}), 409

    try:
        # Create new user
        password_hash = generate_password_hash(password)
        user = DatabaseOperations.create_user(
            username=username,
            email=email,
            password_hash=password_hash
        )
        
        # Generate token
        token = generate_token(user.to_mongo())
        
        return jsonify({
            "message": "User created successfully",
            "token": token,
            "user": {
                "id": str(user.id),
                "email": user.email,
                "username": user.username
            }
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@auth.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not all([email, password]):
        return jsonify({"error": "Email and password are required"}), 400

    try:
        user = User.objects(email=email).first()
        if not user or not check_password_hash(user.password_hash, password):
            return jsonify({"error": "Invalid email or password"}), 401

        token = generate_token(user.to_mongo())
        
        return jsonify({
            "message": "Login successful",
            "token": token,
            "user": {
                "id": str(user.id),
                "email": user.email,
                "username": user.username
            }
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@auth.route('/verify-token', methods=['GET'])
@token_required
def verify_token(current_user):
    """Verify if the current token is valid"""
    return jsonify({
        "valid": True,
        "user": current_user
    }), 200
