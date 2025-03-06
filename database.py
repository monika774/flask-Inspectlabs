from flask_sqlalchemy import SQLAlchemy
from flask import Flask
import os

app = Flask(__name__)

# database setup with postgressql 
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'devops-vm.pem') #'dev-secret-key',
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get(
    'DB_URL', 'postgresql://postgres:root@localhost:5432/db_task_manager'
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize Database
db = SQLAlchemy(app)
