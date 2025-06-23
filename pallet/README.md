# RDE v2.0 Hetzner Deployment Pallet

Production-grade Hetzner deployment package for the Resident Development Environment (RDE) v2.0 with AI-Governed Middleware architecture.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Docker and Docker Compose
- Git

### Development Setup

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd pallet
npm install
```

2. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start development servers:**
```bash
npm run dev
```

This starts:
- Frontend dev server on http://localhost:3000
- Backend API server on http://localhost:5000
- WebSocket server on ws://localhost:5000/ws

### Production Deployment

#### Docker Build & Run

```bash
# Build the Docker image
npm run docker:build

# Run with Docker Compose
docker-compose up -d

# Or run standalone
npm run docker:run
```

#### Direct Build & Deploy

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🏗️ Architecture

### Monorepo Structure
```
pallet/
├── frontend/          # React + TypeScript frontend
├── backend/           # Node.js + TypeScript backend
├── system/           # System configuration and protocols
│   ├── build-protocol.json
│   └── audit/        # Audit logs (persistent)
├── Dockerfile        # Multi-stage production build
├── docker-compose.yml # Production deployment
└── package.json      # Workspace configuration
```

### Core Components

#### Frontend (`/frontend/`)
- **React 18** with TypeScript
- **Monaco Editor** for code editing
- **File Explorer** with live tree view
- **WebSocket Terminal** interface
- **AI Chat Interface** (Claude integration)
- **Build Protocol Editor** for governance rules
- **Live Preview** window

#### Backend (`/backend/`)
- **Express.js** API server
- **Agent Bridge Middleware v2.0** for AI governance
- **Execution Engine v1.0** for file operations
- **WebSocket** server for real-time features
- **Audit Logger** with retention policies

#### Middleware Services
- **Intent Parser** - Extracts structured intents from AI chat
- **Governance Validator** - Enforces build protocol rules
- **Execution Router** - Routes validated intents to handlers
- **Audit Logger** - Comprehensive activity logging

## 🔧 Configuration

### Environment Variables

Key configuration options:

```bash
# Server
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# AI Service
ANTHROPIC_API_KEY=sk-ant-api03-...

# Middleware
MIDDLEWARE_ENABLE_GOVERNANCE=true
MIDDLEWARE_ENABLE_EXECUTION=true
MIDDLEWARE_ENABLE_AUDIT=true

# Paths
PROJECTS_PATH=/app/projects
AUDIT_LOG_PATH=/app/system/audit
BUILD_PROTOCOL_PATH=/app/system/build-protocol.json
```

### Build Protocol

The `/system/build-protocol.json` file defines governance rules:

- **Semi-automatic mode** for safe operations
- **Approval workflows** for destructive actions
- **File operation restrictions** and sandboxing
- **Audit settings** and retention policies

## 🐳 Docker Deployment

### Multi-stage Build Process

1. **Base stage** - Install dependencies
2. **Build stage** - Compile TypeScript and build frontend
3. **Production stage** - Clean runtime with only production dependencies

### Volume Mounts

- `/app/system/audit` - Persistent audit logs
- `/app/projects` - User project files
- `/app/system/build-protocol.json` - Governance configuration

### Health Checks

Automatic health monitoring with:
- HTTP health endpoint (`/api/health`)
- Container health checks every 30s
- Graceful shutdown handling

## 🔍 API Endpoints

### Core APIs
- `GET /api/health` - Health status
- `GET/POST /api/files/*` - File management
- `POST /api/chat/message` - AI chat interface

### Middleware APIs
- `GET /api/middleware/status` - Middleware health
- `GET /api/middleware/audit` - Audit statistics
- `GET /api/middleware/approvals` - Pending approvals
- `GET /api/middleware/config` - Current configuration

### Execution Engine APIs
- `GET /api/execution/stats` - Execution statistics
- `GET /api/execution/queue` - Processing queue status

## 🛡️ Security Features

- **Helmet.js** security headers
- **CORS** configuration
- **File system sandboxing**
- **Path traversal protection**
- **File size and type restrictions**
- **Comprehensive audit logging**

## 📊 Monitoring & Logging

### Audit System
- **30-day retention** by default
- **Structured JSON logging**
- **Intent tracking** with full lifecycle
- **Performance metrics**

### Health Monitoring
- Application health checks
- Middleware component status
- Execution engine metrics
- WebSocket connection monitoring

## 🚢 Deployment Guide

### Hetzner VPS Deployment

1. **Prepare server:**
```bash
apt update && apt upgrade -y
apt install docker.io docker-compose git -y
systemctl enable docker
```

2. **Deploy application:**
```bash
git clone <repository>
cd pallet
cp .env.example .env
# Configure .env
docker-compose up -d
```

3. **Configure reverse proxy** (nginx/caddy) for domain routing

### Production Checklist

- [ ] Environment variables configured
- [ ] SSL/TLS certificates installed
- [ ] Firewall rules configured
- [ ] Backup strategy for audit logs
- [ ] Log rotation configured
- [ ] Monitoring alerts set up

## 🔧 Development

### Available Scripts

```bash
npm run dev           # Start development servers
npm run build         # Build for production
npm run test          # Run test suites
npm run lint          # Lint code
npm run clean         # Clean build artifacts
npm run docker:build  # Build Docker image
npm run docker:run    # Run Docker container
```

### Project Standards

- **TypeScript** for type safety
- **ESLint** for code quality
- **Prettier** for formatting
- **Vitest** for testing
- **Conventional commits** for git history

## 📝 License

MIT License - see LICENSE file for details.

---

**RDEv2_Hetzner_Pallet** - Artifact ID: `rdev2-hetzner-pallet`  
Middleware v2.0 | Execution Engine v1.0 | Production Ready