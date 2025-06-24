# RDE v2.0 Hetzner Deployment Pallet

## Production-Ready Build Status

✅ **PALLET COMPILED: Docker-safe strict build complete. Ready for Hetzner.**

### Backend Compilation
- **Status**: ✅ COMPLETE
- **Entry Point**: `backend/dist/index.js`
- **Assets**: Compiled TypeScript with source maps
- **Dependencies**: Production-only isolation achieved

### Frontend Compilation  
- **Status**: ✅ COMPLETE
- **Output**: Static production assets in `frontend/dist/`
- **Build Tool**: Vite with React optimization
- **Assets**: Minified JS, CSS, and HTML with chunking

### Docker Optimization
- **Multi-stage build**: Development → Build → Production
- **Base Image**: node:18-alpine (minimal footprint)
- **Security**: Non-root user, health checks, volume persistence
- **Performance**: No runtime compilation, cached dependencies

## Quick Deploy

### Build Commands
```bash
# Backend
cd pallet/backend && npm run build

# Frontend  
cd pallet/frontend && npm run build
```

### Docker Deploy
```bash
# Build container
docker build -t rde-v2-hetzner .

# Deploy to production
docker run -d \
  -p 5000:5000 \
  -v /data/projects:/app/projects \
  -v /data/audit:/app/system/audit \
  --name rde-v2 \
  rde-v2-hetzner
```

## Architecture

### RDE v2.0 Components
- File Management with real-time sync
- Monaco Code Editor with syntax highlighting
- Terminal interface via WebSocket
- AI Chat Assistant with Claude
- Agent Bridge Middleware with governance
- Execution Engine for file operations
- Live Preview capabilities

### Production Features
- Strict TypeScript compliance
- Complete error handling with unknown types
- Security headers and CORS
- Health monitoring
- Graceful shutdown
- Audit logging with retention

## Environment

### Required Variables
```env
NODE_ENV=production
PORT=5000
ANTHROPIC_API_KEY=<your-key>
```

### Health Check
```
GET /api/health
200 OK - System operational
```

The RDE v2.0 Deployment Pallet delivers a complete AI-governed development environment ready for Hetzner cloud deployment with enterprise-grade reliability and security.