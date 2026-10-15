FROM python:3.12-slim

WORKDIR /app

# Install system dependencies required by Chromium
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install Python dependencies
RUN uv sync --frozen --no-dev --no-install-project

# Make virtual environment packages available
ENV PATH="/app/.venv/bin:$PATH"

# Install Chromium and its required system dependencies
RUN python -m playwright install --with-deps chromium

# Copy application code
COPY . .

# Python environment settings
ENV PYTHONUNBUFFERED=1

EXPOSE 8081

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8081"]
