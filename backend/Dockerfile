# Use an official lightweight Python image
FROM python:3.13.5-slim

# Prevent Python from writing .pyc files
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Create app directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt /app/requirements.txt
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy the backend source code
COPY . /app

# Expose the backend port
EXPOSE 5000

# Start the app with Gunicorn using the Eventlet worker
CMD ["gunicorn", "-k", "eventlet", "-w", "1", "run:app", "--bind", "0.0.0.0:5000"]