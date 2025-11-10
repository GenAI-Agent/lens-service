# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lens Service is an embeddable AI customer service widget library that provides intelligent customer support using Azure OpenAI. It can be embedded into any web application and includes both a customer-facing chat widget and an admin management panel.

The widget uses a hybrid search approach combining:
1. Manual indexes (knowledge base entries created by admins)
2. LLMs.txt content (website documentation formatted for AI agents)
3. Azure OpenAI for intelligent responses
4. Telegram notifications for questions requiring human support

## Development Commands

Use **bun** as the package manager for this project.

### Widget Development
```bash
# Install dependencies
bun install

# Development mode (Vite dev server)
bun run dev

# Build the widget library
bun run build

# Preview production build
bun run preview
```

### Backend Services
```bash
# Start the database API server (required for widget functionality)
bun run server          # Production mode
bun run server:dev      # Development mode with auto-reload

# Start database proxy (alternative database access layer)
bun run db:proxy        # Production mode
bun run db:proxy:dev    # Development mode with auto-reload
```

### Database Management
```bash
# Generate Prisma client
bun run db:generate

# Push schema changes to database
bun run db:push

# Run database migrations
bun run db:migrate
```

### PostgreSQL Database Setup
The database runs in Docker. Database files and setup scripts are in the `sql/` directory:

```bash
# Start PostgreSQL database
cd sql
docker-compose up -d

# Initialize database (after container starts)
docker exec -i lens-service-db psql -U postgres -d lens_service < init.sql

# Connect to database
docker exec -it lens-service-db psql -U postgres -d lens_service

# Stop database
docker-compose down
```

**Connection String**: `postgresql://postgres@localhost:5432/lens_service`

## Architecture

### Build System
- **TypeScript** with strict mode enabled
- **Vite** for bundling as both UMD and ES modules
- **Target**: ES2020 with DOM libraries
- **Output**: `dist/lens-service.umd.js`, `dist/lens-service.mjs`, and type definitions

### Core Components Structure

**src/index.ts** - Main widget class (`LensServiceWidget`)
- Entry point and initialization logic
- Manages conversation state and message flow
- Coordinates between UI components and backend services
- Handles Azure OpenAI API calls for both text and vision
- Implements screenshot capture mode (Q+Click)

**src/components/** - UI Components
- `SidePanel.ts` - Customer-facing chat interface
- `styles.ts` - Widget styling

**src/admin/** - Admin Panel
- `AdminPanel.ts` - Management interface for admins
- Accessible at `/lens-service` route

**src/services/** - Service Layer
- `DatabaseService.ts` - API client for database operations (calls db-server endpoints)
- `ConversationService.ts` - Conversation management
- `ManualIndexService.ts` - Knowledge base search (BM25 + vector search)
- `LlmsTxtService.ts` - LLMs.txt content search with fingerprint and chunk-based search
- `ConfigService.ts` - Configuration management
- `CustomerServiceManager.ts` - Customer service workflow orchestration
- `AdminUserManager.ts` - Admin authentication and user management

**src/types.ts** - TypeScript type definitions for all data structures

### Backend Architecture

**db-server.js** (port 3002)
- Express API server providing RESTful endpoints
- Executes PostgreSQL queries via Docker exec + psql
- Endpoints for: conversations, manual indexes, settings, admin users
- Frontend DatabaseService communicates with this server

**sql/** - Database Layer
- PostgreSQL database running in Docker
- Tables: `conversations`, `manual_indexes`, `settings`, `admin_users`
- `simple-db-server.js` - Alternative database server implementation
- `db-proxy.js` - Database proxy layer

### Database Schema

**conversations** - Stores customer service conversations
- Fields: id, conversation_id, user_id, status, messages (JSONB), timestamps

**manual_indexes** - Knowledge base entries
- Fields: id, title, description, content, url, timestamps
- Used for BM25 + semantic search

**settings** - System configuration
- Key-value pairs for: system_prompt, default_reply, llms_txt_url

**admin_users** - Admin authentication
- Fields: id, username, password, email, created_at
- Default users: lens/1234, admin/admin123

### Message Processing Flow

1. **User sends message** → Widget captures input
2. **Search phase**:
   - Search manual indexes (BM25 + vector)
   - Search LLMs.txt chunks (fingerprint search with context)
   - Merge and rank results
3. **LLM phase**:
   - Build context from search results
   - Call Azure OpenAI with enhanced prompt
   - Analyze response for confidence
4. **Response handling**:
   - If confident: Return AI response
   - If uncertain: Return default reply + send Telegram notification
5. **Save to database**: Store conversation with all metadata

### Widget Configuration

The widget accepts `ServiceModulerConfig` with:
- `azureOpenAI`: Azure OpenAI endpoint, API key, deployment name
- `telegram`: Bot token and chat ID for human escalation notifications
- `ui`: Position, width, icon placement, colors
- `database`: PostgreSQL connection details
- `features`: Enable/disable screenshot, rules, search

### Embedding in Applications

The widget is designed to be embedded in React/Next.js applications:

1. Install: `npm install GenAI-Agent/lens-service`
2. Import styles: `import 'lens-service/dist/style.css'`
3. Initialize widget in React component:
   ```typescript
   const { LensService } = await import('lens-service');
   new LensService({ container, apiBaseUrl, azureOpenAI, telegram });
   ```
4. For admin panel: Import `AdminPanel` and initialize similarly

## Key Features

### Screenshot Capture Mode
- Press and hold **Q** key while chat panel is open
- Click on any element to capture screenshot
- Screenshot is automatically attached to message input
- Uses html2canvas library (loaded dynamically)

### Search Technologies
- **BM25**: Keyword-based ranking for manual indexes
- **Vector Search**: Semantic search using embeddings
- **Fingerprint Search**: Fast chunk matching for LLMs.txt content
- **Context Window**: Returns chunks with surrounding context for better LLM understanding

### LLMs.txt Integration
- Fetches and caches content from configured URL (1 hour cache)
- Splits into 500-character chunks with 100-character overlap
- Creates fingerprints for fast similarity matching
- Returns matched chunks with before/after context

### Telegram Notifications
When AI cannot answer a question:
- Sends notification to configured Telegram chat
- Includes session ID, user message, timestamp
- Allows human agents to respond via admin panel

## Testing and Debugging

### Local Development Setup
1. Start PostgreSQL: `cd sql && docker-compose up -d`
2. Initialize database: See database commands above
3. Start db-server: `bun run server:dev` (port 3002)
4. Start widget dev server: `bun run dev`
5. Admin panel accessible at: `http://localhost:[dev-port]/lens-service`

### Default Test Credentials
- Username: lens, Password: 1234
- Username: admin, Password: admin123

### Debugging Tips
- Widget uses console logging with emoji prefixes (✅, ❌, 🔍, 📸, etc.)
- Check browser console for initialization and API call logs
- Database API logs appear in server:dev terminal
- Use `debug: true` in config for verbose logging

## Important Implementation Notes

- **Database Service**: Frontend `DatabaseService.ts` is an API client that calls `db-server.js` endpoints at `http://localhost:3002`
- **State Management**: Conversations stored in PostgreSQL, also maintained in localStorage for quick recovery
- **Session Management**: Each conversation gets unique session ID (`sm_${timestamp}_${random}`)
- **New Conversation**: Created on every panel open (not persisted from previous sessions by default)
- **External Dependencies**: html2canvas loaded dynamically only when screenshot feature is used
- **Build Output**: Generates both UMD (for script tag) and ES modules (for modern bundlers)
- **Type Definitions**: Generated in `dist/` directory during build
