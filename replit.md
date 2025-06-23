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

### File Management System
- Virtual file system with database persistence
- Real-time file synchronization to the filesystem
- Hierarchical folder structure with support for nested directories
- File creation, editing, deletion, and navigation
- Auto-refresh capabilities for detecting external changes

### Code Editor
- Monaco Editor integration with syntax highlighting
- Multi-tab support for simultaneous file editing
- Auto-save functionality with unsaved changes tracking
- Language detection based on file extensions
- Custom dark theme optimized for development

### Terminal Interface
- WebSocket-based terminal emulation
- Multi-session support for concurrent terminal instances
- Command execution with real-time output streaming
- Cross-platform shell compatibility (bash/cmd)
- Terminal history and session management

### AI Chat Assistant
- Integration with Anthropic Claude for development assistance
- Context-aware responses based on current file and project state
- Code generation, debugging, and explanation capabilities
- Real-time message streaming
- Conversation history persistence

### Live Preview
- Integrated preview window for web applications
- Automatic refresh on file changes
- External browser opening capabilities
- Development server proxy for seamless preview

## Data Flow

1. **File Operations**: Client requests → Express API → Drizzle ORM → PostgreSQL → File system sync
2. **Code Editing**: Monaco Editor → Auto-save → API → Database → File system
3. **Terminal Commands**: WebSocket client → Terminal service → Shell execution → Real-time output
4. **AI Chat**: User input → Chat service → Anthropic API → Response streaming → UI update
5. **Live Preview**: File changes → Vite HMR → Preview window refresh

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

## Changelog

```
Changelog:
- June 23, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```