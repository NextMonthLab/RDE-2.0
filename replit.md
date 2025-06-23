# RDE v2.0 - Resident Development Environment

## Overview

RDE v2.0 is a comprehensive web-based development environment built with Node.js, React, and TypeScript. It provides a complete IDE experience with file management, code editing, terminal access, AI-powered chat assistance, and live preview capabilities. The application follows a full-stack architecture with a PostgreSQL database for persistence and real-time features via WebSockets.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: Radix UI components with Tailwind CSS styling
- **State Management**: TanStack Query for server state and local React state
- **Routing**: Wouter for lightweight client-side routing
- **Code Editor**: Monaco Editor for syntax highlighting and IntelliSense

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Real-time Communication**: WebSocket server for terminal and live updates
- **AI Integration**: Anthropic Claude API for chat assistance
- **Development Server**: Vite middleware integration for seamless development

### Database Schema
- **Users**: Authentication and user management
- **Files**: Project file storage with hierarchical structure
- **Chat Messages**: AI conversation history (temporary storage)

## Key Components

### RDE Core Interface
- **File Management System**: Virtual file system with database persistence, real-time synchronization, hierarchical structure
- **Code Editor**: Monaco Editor with syntax highlighting, multi-tab support, auto-save, language detection
- **Terminal Interface**: WebSocket-based terminal emulation, multi-session support, real-time command execution
- **AI Chat Assistant**: Claude-powered development assistance with context awareness and code generation
- **Live Preview**: Integrated preview window with automatic refresh and external browser support

### Agent Bridge Middleware (v2.0)
- **Intent Parser**: Extracts structured intents from AI chat outputs using pattern matching and NLP
- **Governance Validator**: Enforces rules from build protocol, validates intents against security policies
- **Execution Router**: Routes validated intents to appropriate handlers (file system, terminal, external APIs)
- **Audit Logger**: Comprehensive logging of all AI intents, validation results, and execution outcomes
- **Agent Bridge Core**: Central coordinator managing the AI → middleware → execution pipeline

### Security & Governance Framework
- **Build Protocol**: Configuration-driven governance rules with approval workflows
- **Intent Validation**: Multi-layer validation with rule-based filtering and modification
- **Audit Trail**: Complete tracking of all AI-generated actions with retention and analysis
- **Safety Mechanisms**: All middleware components disabled by default, require explicit activation

## Data Flow

### Current (Direct Execution)
1. **File Operations**: Client requests → Express API → Storage → File system sync
2. **Code Editing**: Monaco Editor → Auto-save → API → Storage → File system
3. **Terminal Commands**: WebSocket client → Terminal service → Shell execution → Real-time output
4. **AI Chat**: User input → Chat service → Anthropic API → Response streaming → UI update
5. **Live Preview**: File changes → Vite HMR → Preview window refresh

### Future (Agent Bridge Middleware)
1. **AI Intent Processing**: Chat input → Intent Parser → Governance Validator → Execution Router
2. **Validated Execution**: Intent → Security checks → Approved execution → Audit logging
3. **Approval Workflow**: Flagged intents → Pending approval queue → Manual review → Authorized execution
4. **Audit & Compliance**: All actions → Audit logger → Retention → Analysis & reporting

## External Dependencies

### Core Dependencies
- **@anthropic-ai/sdk**: AI chat functionality using Claude
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database ORM
- **monaco-editor**: Code editor component
- **ws**: WebSocket server for real-time features

### UI Dependencies
- **@radix-ui/***: Accessible UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **@tanstack/react-query**: Server state management
- **wouter**: Lightweight routing

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Type safety and development experience
- **tsx**: TypeScript execution for server development

## Deployment Strategy

### Development Environment
- Replit-optimized configuration with auto-detection
- Vite development server with HMR
- WebSocket support for real-time features
- Database provisioning via environment variables

### Production Build
- Vite production build for optimized client bundle
- ESBuild server bundling for Node.js deployment
- Static asset serving via Express
- Environment-based configuration

### Database Management
- Drizzle migrations for schema versioning
- PostgreSQL connection via environment variables
- Development and production database separation

## Recent Changes

### June 23, 2025 - Execution Engine v1.0 LIVE INTEGRATION COMPLETE

✓ **Execution Engine v1.0 Fully Operational**
- Event-driven architecture actively subscribed to Agent Bridge Middleware approval events
- Real-time processing of approved CREATE_FILE and UPDATE_FILE intents
- Automatic directory creation and safe file path resolution
- Complete audit trail integration with system logging
- Live operational flow: AI Chat → Middleware Validation → Execution Engine → File System

✓ **Complete AI-Governed Build Loop Active**
- Agent Bridge Middleware emits 'intent-approved' events for validated file operations
- Execution Engine subscribes to approval stream and processes approved intents immediately
- Full governance enforcement maintained - no execution without middleware approval
- Semi-automatic mode enables streamlined development with safety guardrails
- Real-time monitoring via middleware dashboard and execution engine APIs

✓ **Core Components Implemented**
- `intentParser.ts` - Extracts structured intents from AI chat outputs
- `governanceValidator.ts` - Enforces governance rules from build protocol
- `executionRouter.ts` - Routes validated intents to execution handlers
- `auditLogger.ts` - Records all AI intents, validation, and execution outcomes
- `agentBridge.ts` - Core coordinator linking AI chat → middleware → execution

✓ **Type System & Configuration**
- Comprehensive type definitions in `types.ts` for all intent schemas
- Build protocol configuration created at `/system/build-protocol.json`
- Default governance rules with security safeguards established
- All middleware components disabled by default for safety

✓ **Integration Points Ready**
- Skeleton Manager integration prepared
- SEO Manager integration prepared  
- Migration Manager integration prepared
- Audit and approval workflow systems in place

### June 23, 2025 - RDE v2.0 Foundation Complete

✓ **Full-Stack Development Environment**
- File Explorer with real-time tree, create/delete functionality
- Monaco Editor with syntax highlighting, multi-tab support, auto-save
- Terminal with WebSocket-based shell interface and real-time output
- AI Chat Interface powered by Claude with context awareness
- Live Preview window for application testing

✓ **Default Project Template**
- Clean React/Vite project template created and synchronized
- Project files properly structured in `/projects/default-app/`
- File system operations fully operational

## User Preferences

```
Preferred communication style: Simple, everyday language.
```