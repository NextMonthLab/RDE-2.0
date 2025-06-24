# RDE 2.0 Hetzner Deployment Guide

## Repository Structure
```
├── client/           # Frontend React application
├── server/           # Backend Express application  
├── shared/           # Shared types and schemas
├── middleware/       # Agent Bridge Middleware
├── system/           # Build protocol and governance
├── Dockerfile        # Multi-stage production build
├── .dockerignore     # Docker build exclusions
└── package.json      # Unified build scripts
```

## Build Process

### Local Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
# Builds both client and server to /dist
```

### Docker Build
```bash
docker build -t rde-2.0 .
```

## Hetzner Deployment

### 1. VPS Setup
```bash
# Install Docker on Hetzner VPS
apt update && apt install docker.io docker-compose
systemctl start docker && systemctl enable docker
```

### 2. Deploy Application
```bash
# Clone repository
git clone https://github.com/NextMonthLab/RDE-2.0.git
cd RDE-2.0

# Build Docker image
docker build -t rde-2.0-production .

# Run container with persistent volumes
docker run -d \
  --name rde-2.0 \
  -p 3000:3000 \
  -v /data/projects:/app/projects \
  -v /data/audit:/app/system/audit \
  -e NODE_ENV=production \
  -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \
  --restart unless-stopped \
  rde-2.0-production
```

### 3. Health Monitoring
```bash
# Check application health
curl http://localhost:3000/api/health

# View logs
docker logs rde-2.0

# Monitor resources
docker stats rde-2.0
```

## Environment Variables
```env
NODE_ENV=production
PORT=3000
ANTHROPIC_API_KEY=<your-key>
DATABASE_URL=<postgres-connection>
```

## Security Features
- Non-root container user (nodejs:1001)
- Health check monitoring
- Persistent volume separation
- Production dependency isolation
- Resource constraints and restart policies

## Validation Checklist
- ✅ Multi-stage Docker build
- ✅ ESM module compatibility
- ✅ No host dependencies
- ✅ Persistent volume configuration
- ✅ Health monitoring endpoint
- ✅ Security hardening (non-root user)
- ✅ Production environment configuration