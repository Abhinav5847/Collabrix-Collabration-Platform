# Use Python 3.11-slim for a balance of speed and small image size
FROM python:3.11-slim

# 1. Set environment variables
# Prevent Python from writing .pyc files and ensure output is logged immediately
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/src

# 2. Set working directory
WORKDIR /src

# 3. Install system dependencies
# We need build-essential for packages like uvloop or uvicorn[standard] 
# that may need to compile C extensions during install.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 4. Install Python dependencies
# Copy requirements first to leverage Docker layer caching
COPY requirements.txt .

# Upgrade pip and install requirements
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 5. Copy the rest of your application code
COPY . .

# 6. Expose the port FastAPI runs on
EXPOSE 8001

# 7. Start the application
# We use uvicorn with the standard worker to match your requirements.txt
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]