# Multi-stage Dockerfile for RDE v2.0 Hetzner Deployment Pallet
FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache git python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm ci --only=production --workspaces
RUN npm ci --workspace=frontend
RUN npm ci --workspace=backend

# Build stage
FROM base AS build

# Copy source code
COPY . .

# Build frontend
WORKDIR /app/frontend
RUN npm run build

# Build backend
WORKDIR /app/backend
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files for production dependencies
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install only production dependencies
RUN npm ci --only=production --workspace=backend && npm cache clean --force

# Copy built applications
COPY --from=build --chown=nodejs:nodejs /app/frontend/dist ./frontend/dist
COPY --from=build --chown=nodejs:nodejs /app/backend/dist ./backend/dist
COPY --from=build --chown=nodejs:nodejs /app/system ./system

# Create audit directory with proper permissions
RUN mkdir -p /app/system/audit && chown -R nodejs:nodejs /app/system

# Create non-root user directories
RUN mkdir -p /app/projects && chown -R nodejs:nodejs /app/projects

USER nodejs

# Environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Expose port
EXPOSE 5000

# Create volume mount points
VOLUME ["/app/system/audit", "/app/projects"]

# Start the application
CMD ["node", "backend/dist/index.js"]