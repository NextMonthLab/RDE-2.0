# Multi-stage Dockerfile for RDE 2.0 Hetzner Deployment
FROM node:20-bullseye-slim AS builder

# Install system dependencies for building
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Prune dev dependencies
RUN npm prune --production

# Production stage
FROM node:20-bullseye-slim AS production

# Create app user for security
RUN groupadd -g 1001 -r nodejs && \
    useradd -r -g nodejs -u 1001 nodejs

WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Create directories for persistent volumes
RUN mkdir -p /app/projects /app/system/audit && \
    chown -R nodejs:nodejs /app/projects /app/system

# Switch to non-root user
USER nodejs

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "const http = require('http'); http.get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Expose port
EXPOSE 3000

# Volume mount points
VOLUME ["/app/projects", "/app/system/audit"]

# Start the application
CMD ["node", "dist/index.js"]