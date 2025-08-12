FROM pytorch/pytorch:2.3.0-cuda12.1-cudnn8-runtime

# Install system dependencies
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    apt-get install -y python3-venv && \
    rm -rf /var/lib/apt/lists/*

# Set work directory
WORKDIR /app

# Copy project files
COPY . /app

# Install Python dependencies



RUN /bin/bash -c "python -m venv /app/whisper-env && source /app/whisper-env/bin/activate && pip install -r requirements.txt && pip install openai-whisper"



# Use the virtual environment for all commands
ENV PATH="/app/whisper-env/bin:$PATH"

# Expose the backend port
EXPOSE 8765

# Start the backend server
CMD ["python", "palascribe_server.py"]

#########################################
# Setup for NVIDIA Container Toolkit (optional) on debian-based systems
#1. curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg \
#   && curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | \
#   sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
#   sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
#2. sudo sed -i -e '/experimental/ s/^#//g' /etc/apt/sources.list.d/nvidia-container-toolkit.list

#3. sudo apt-get update
#4. export NVIDIA_CONTAINER_TOOLKIT_VERSION=1.17.8-1
  #sudo apt-get install -y \
  #    nvidia-container-toolkit=${NVIDIA_CONTAINER_TOOLKIT_VERSION} \
  #    nvidia-container-toolkit-base=${NVIDIA_CONTAINER_TOOLKIT_VERSION} \
  #    libnvidia-container-tools=${NVIDIA_CONTAINER_TOOLKIT_VERSION} \
  #    libnvidia-container1=${NVIDIA_CONTAINER_TOOLKIT_VERSION}

#5. sudo systemctl restart docker


