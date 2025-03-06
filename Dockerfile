# Use the Python image which present ur Desktop
FROM python:3.10

# Set the working directory inside the container
WORKDIR /python-flask-app

# Copy the requirements file into the container and dependies with libraries
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Set environment variables correctly and ensure u hve correct env path
ENV PYTHONUNBUFFERED=1 \
    ENV_FOLDER=env  

# Copy the application code 
COPY . .

# Expose the application port
EXPOSE 5000

# Start the application
CMD ["python", "-m", "uvicorn", "main:task", "--host", "0.0.0.0", "--port", "5000"]
