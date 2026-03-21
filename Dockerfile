# Multi-stage build for the game server
FROM node:20-alpine AS base

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --production

# Copy source files
COPY server/ ./server/
COPY src/game/data/ ./src/game/data/
COPY src/data/ ./src/data/
COPY src/types/ ./src/types/
COPY tsconfig.json ./

# Copy server-specific config
COPY server/tsconfig.json ./server/

# Build the server (we'll use tsx for direct TypeScript execution)
RUN npm install -g tsx

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start command
CMD ["tsx", "server/index.ts"]