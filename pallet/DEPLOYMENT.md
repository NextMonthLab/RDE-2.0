# RDE v2.0 Hetzner Deployment Pallet

## Overview

This is the production-ready RDE v2.0 Deployment Pallet with strict Docker compliance for Hetzner VPS deployment. The system follows a precompiled build pipeline where all TypeScript compilation happens outside the Docker container for maximum reliability and performance.

## Build Architecture

### ✅ Backend Build (`/pallet/backend/dist/`)
- **Entry Point**: `/pallet/backend/dist/index.js`
- **Compiled from**: `/pallet/backend/src/`
- **Docker Path**: `/app/backend/dist/`
- **Status**: ✅ COMPILED

### ✅ Frontend Build (`/pallet/frontend/dist/`)
- **Output**: Static production assets
- **Compiled from**: `/pallet/frontend/src/`
- **Docker Path**: `/app/frontend/dist/`
- **Status**: ✅ COMPILED

## Docker Compliance

### Pre-Compilation Strategy
```bash
# Build outside Docker in Replit
cd pallet/backend && npm run build
cd pallet/frontend && npm run build
```

### Docker Runtime
```dockerfile
# No TypeScript compilation inside container
COPY backend/dist ./backend/dist
COPY frontend/dist ./frontend/dist
CMD ["node", "./backend/dist/index.js"]
```

## Environment Configuration

### Production Environment Variables
```env
NODE_ENV=production
PORT=5000
FRONTEND_PATH=/app/frontend/dist
```

### Directory Structure in Container
```
/app/
├── backend/
│   ├── dist/           # Compiled backend
│   ├── node_modules/   # Production deps only
│   └── package.json
├── frontend/
│   └── dist/           # Built frontend assets
├── system/
│   ├── build-protocol.json
│   └── audit/          # Persistent volume
└── projects/           # Persistent volume
```

## Deployment Process

### 1. Replit Build Phase
```bash
# Backend compilation
cd pallet/backend
npm run build

# Frontend compilation  
cd pallet/frontend
npm run build
```

### 2. Docker Build Phase
```bash
# Build container with pre-compiled assets
docker build -t rde-v2-hetzner .
```

### 3. Hetzner Deployment
```bash
# Deploy to Hetzner VPS
docker run -d \
  -p 5000:5000 \
  -v /data/projects:/app/projects \
  -v /data/audit:/app/system/audit \
  --name rde-v2 \
  rde-v2-hetzner
```

## Health Monitoring

### Health Check Endpoint
```
GET /api/health
```

### Expected Response
```json
{
  "status": "healthy",
  "timestamp": "2025-06-24T06:50:00.000Z",
  "version": "2.0.0",
  "environment": "production",
  "middleware": "active",
  "executionEngine": "active"
}
```

## Features Included

### Core RDE v2.0 Components
- ✅ File Management System with database persistence
- ✅ Monaco Code Editor with multi-tab support
- ✅ Terminal interface with WebSocket connectivity
- ✅ AI Chat Assistant with Claude integration
- ✅ Live Preview capabilities
- ✅ Agent Bridge Middleware v2.0 with governance
- ✅ Execution Engine v1.0 for file operations

### Production Security
- ✅ Helmet security headers
- ✅ CORS configuration
- ✅ Non-root container user
- ✅ Health check monitoring
- ✅ Graceful shutdown handling
- ✅ Error boundaries and logging

## Strict Compliance Achieved

### ✅ TypeScript Compliance
- All error handling with proper unknown typing
- Strict nullability checks enforced
- Production-ready without compilation warnings

### ✅ Docker Compliance  
- No import.meta.dirname or dynamic paths
- Absolute paths for container layout
- Production dependencies only
- Multi-stage optimized builds

### ✅ Hetzner Ready
- Port 5000 external configuration
- Volume persistence for audit and projects
- Health checks for monitoring
- Resource-optimized Alpine base

## Deployment Status

```
✅ PALLET COMPILED: Docker-safe strict build complete. Ready for Hetzner.
```

The RDE v2.0 system is now production-ready for deployment to Hetzner VPS infrastructure with complete AI governance, file management, and development environment capabilities.