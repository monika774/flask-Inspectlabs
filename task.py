import logging
from flask import Flask, request, jsonify, make_response, render_template
from functools import wraps
import jwt
import datetime
import os
from flask_cors import CORS
from database import app, db
from models import User, Task

# Logging added to the appication if got some error due to that
logging.basicConfig(
    filename='task_manager.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Middleware created  for token authentication part 
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('x-access-token')
        if not token:
            logging.warning("Token is missing in request")
            return jsonify({'message': 'Token is missing!'}), 401
        
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.filter_by(id=data['user_id']).first()
            if not current_user:
                logging.warning("User not found for provided token")
                return jsonify({'message': 'User not found!'}), 401
        except jwt.ExpiredSignatureError:
            logging.error("Token has expired")
            return jsonify({'message': 'Token has expired!'}), 401
        except jwt.InvalidTokenError as e:
            logging.error(f"Invalid token error: {e}")
            return jsonify({'message': 'Invalid token!'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

# Register user
@app.route('/register', methods=['POST'])
def register():
    """Register  new User """
    data = request.get_json()
    if not data or not data.get('username') or not data.get('email') or not data.get('password'):
        logging.warning("Missing required fields during registration")
        return jsonify({'message': 'All the fiels are required!'}), 400
    
    if User.query.filter_by(email=data['email']).first():
        logging.warning("Attempt to register with existing email: %s", data['email'])
        return jsonify({'message': 'Email already exists'}), 400
    
    new_user = User(username=data['username'], email=data['email'])
    new_user.set_password(data['password'])
    db.session.add(new_user)
    db.session.commit()
    logging.info("New user registered: %s", data['username'])
    
    return jsonify({'message': 'User created', 'user': new_user.json()}), 201

# Login 
@app.route('/login', methods=['POST'])
def login():
    """Login to the system """
    data = request.get_json()
    if not data or not data.get('username') or not data.get('password'):
        logging.warning("Missing username or password during login")
        return jsonify({'message': 'Missing username or password'}), 400
    
    user = User.query.filter_by(username=data['username']).first()
    if not user or not user.check_password(data['password']):
        logging.warning("Invalid login attempt for username: %s", data['username'])
        return jsonify({'message': 'Invalid username or password'}), 401
    
    token = jwt.encode(
        {'user_id': user.id, 'exp': datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=12)}, 
        app.config['SECRET_KEY'], algorithm='HS256'
    )
    logging.info("User logged in: %s", data['username'])
    return jsonify({'message': 'Login successful', 'token': token}), 200

# Task Manager CRUD Operations
@app.route('/tasks', methods=['POST'])
@token_required
def create_task(current_user):
    """Logic For add task"""
    data = request.get_json()
    if not data or not data.get('title'):
        logging.warning("Task creation attempt with missing title by user: %s", current_user.username)
        return jsonify({'message': 'Task title is required'}), 400
    
    task = Task(title=data['title'], description=data.get('description', ''), user_id=current_user.id)
    db.session.add(task)
    db.session.commit()
    logging.info("Task created: %s by user: %s", data['title'], current_user.username)
    
    return jsonify({'message': 'Congratualation !Task created sucessfully.', 'task': task.json()}), 201


@app.route('/tasks', methods=['GET'])
@token_required
def get_tasks(current_user):
    """Read task data"""
    tasks = Task.query.filter_by(user_id=current_user.id).all()
    logging.info("Tasks retrieved for user: %s", current_user.username)
    return jsonify({'tasks': [task.json() for task in tasks]}), 200


@app.route('/tasks/<int:id>', methods=['PUT'])
@token_required
def update_task(current_user, id):
    """Logic For Update task"""
    task = Task.query.filter_by(id=id, user_id=current_user.id).first()
    if not task:
        logging.warning("Task update failed, task not found for user: %s", current_user.username)
        return jsonify({'message': 'Task not found'}), 404
    
    data = request.get_json()
    task.title = data.get('title', task.title)
    task.description = data.get('description', task.description)
    task.completed = data.get('completed', task.completed)
    db.session.commit()
    logging.info("Task updated: %s by user: %s", task.title, current_user.username)
    
    return jsonify({'message': 'Thank you! U have updated Task.', 'task': task.json()}), 200


@app.route('/tasks/<int:id>', methods=['DELETE'])
@token_required
def delete_task(current_user, id):
    """Logic For delete task"""
    task = Task.query.filter_by(id=id, user_id=current_user.id).first()
    if not task:
        logging.warning("Task deletion failed, task not found for user: %s", current_user.username)
        return jsonify({'message': 'Task not found'}), 404
    
    db.session.delete(task)
    db.session.commit()
    logging.info("Task deleted: %s by user: %s", task.title, current_user.username)
    
    return jsonify({'message': 'Task deleted'}), 200

#Enable to connection CORS
CORS(app)

# server render frontend
@app.route('/')
def index():
    return render_template('index.html')

# Run the application
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    logging.info("Starting Flask application...")
    app.run(host='0.0.0.0',debug = True)


