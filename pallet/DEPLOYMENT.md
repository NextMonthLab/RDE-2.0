# RDE v2.0 Hetzner Deployment Guide

## Quick Deployment

### 1. Prepare Hetzner VPS
```bash
# Update system
apt update && apt upgrade -y
apt install docker.io docker-compose git -y
systemctl enable docker
systemctl start docker

# Clone repository
git clone <your-repo-url>
cd rdev2-hetzner-pallet
```

### 2. Configure Environment
```bash
# Copy and configure environment
cp .env.example .env
nano .env

# Required variables:
ANTHROPIC_API_KEY=sk-ant-api03-...
NODE_ENV=production
PORT=5000
```

### 3. Deploy with Docker
```bash
# Build and run
docker-compose up -d

# Or build manually
docker build -t rdev2-hetzner-pallet .
docker run -d -p 5000:5000 \
  -v $(pwd)/system/audit:/app/system/audit \
  -v $(pwd)/projects:/app/projects \
  --env-file .env \
  rdev2-hetzner-pallet
```

### 4. Verify Deployment
```bash
# Check health
curl http://localhost:5000/api/health

# Check logs
docker logs <container-id>

# Check middleware status
curl http://localhost:5000/api/middleware/status
```

## Production Checklist

- [ ] Environment variables configured
- [ ] SSL/TLS certificates installed (nginx/caddy)
- [ ] Firewall configured (port 5000)
- [ ] Backup strategy for audit logs
- [ ] Log rotation configured
- [ ] Monitoring alerts set up

## Architecture

- **Frontend**: React 18 + TypeScript served statically
- **Backend**: Node.js + Express API server
- **Middleware**: AI-Governed Agent Bridge v2.0
- **Execution**: Event-driven file operations engine
- **Storage**: Persistent volumes for logs and projects

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/middleware/status` - Middleware status
- `GET /api/execution/stats` - Execution statistics
- `POST /api/chat/message` - AI chat interface
- `GET/POST /api/files/*` - File operations

## Troubleshooting

### Common Issues

1. **Permission errors**: Ensure proper volume permissions
2. **API key issues**: Verify ANTHROPIC_API_KEY is set
3. **Port conflicts**: Check if port 5000 is available
4. **Memory issues**: Ensure VPS has adequate RAM (2GB+)

### Logs Location
- Application: `docker logs <container>`
- Audit: `/app/system/audit/`
- File operations: Middleware dashboard

## Updates

To update the deployment:
```bash
git pull
docker-compose down
docker-compose up -d --build
```