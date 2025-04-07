#!/bin/bash

# Create necessary directories
mkdir -p ~/.clara
chmod 755 ~/.clara

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is not installed. Please install it using:"
    echo "sudo apt-get install python3 python3-pip"
    exit 1
fi

# Install Python dependencies
if [ -f "/opt/Clara/resources/py_backend/requirements.txt" ]; then
    pip3 install -r /opt/Clara/resources/py_backend/requirements.txt --user
fi

# Set permissions
chmod -R 755 ~/.clara

echo "Clara installation completed successfully!" 