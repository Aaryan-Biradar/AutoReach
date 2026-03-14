# Start from an official Python base image
FROM python:3.11-slim

# Set the working directory inside the container
WORKDIR /app

# Copy dependency files first (this is a caching trick — 
# Docker won't reinstall packages unless these files change)
COPY pyproject.toml .

# Install uv and use it to install dependencies
RUN pip install uv && uv sync

# Copy the rest of your backend code
COPY . .

# Start the FastAPI server
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]