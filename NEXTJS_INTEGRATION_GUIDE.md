# Lens Service - Next.js Integration Guide

Complete guide for integrating Lens Service widget into your Next.js application with proper server/client separation.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Database Setup](#database-setup)
4. [Server-Side Setup](#server-side-setup)
5. [Client-Side Setup](#client-side-setup)
6. [API Endpoints](#api-endpoints)
7. [Authentication](#authentication)
8. [Environment Variables](#environment-variables)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)

---

## Overview

### Features

- 🤖 AI-powered customer service chat
- 📚 Knowledge base management
- 💬 Conversation history
- 🔍 Hybrid search (Vector + BM25)
- 🌐 Multi-language support
- 📊 Admin panel for content management
- 🔒 JWT authentication
- ⚡ Real-time streaming responses
- 📝 Markdown rendering

### Architecture

Lens Service provides two separate entry points:

- **Client-side** (`lens-service`): Browser widget bundle
- **Server-side** (`lens-service/server`): Node.js services for API routes

---

## Installation

### 1. Install Lens Service

```bash
# Using Yarn (Recommended)
yarn add git+https://github.com/GenAI-Agent/lens-service.git

# Using NPM
npm install git+https://github.com/GenAI-Agent/lens-service.git
```

### 2. Install Dependencies

```bash
# Core dependencies
yarn add @prisma/client prisma pg openai axios cheerio pdf-parse marked

# Development dependencies
yarn add -D @types/node @types/pg typescript ignore-loader
```

### 3. Configure Next.js

Update `next.config.ts`:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // Exclude lens-service source files from webpack processing
    config.module.rules.push({
      test: /node_modules\/lens-service\/src\/.+\.ts$/,
      use: 'ignore-loader',
    });
    return config;
  },
};

export default nextConfig;
```

---

## Database Setup

### 1. Prisma Schema

Create or update `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  extensions = [vector]
}

// Conversations
model Conversation {
  id         String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  user_id    String?   @db.Uuid
  messages   Json      @default("[]")
  status     String?   @default("active") @db.VarChar(50)
  created_at DateTime? @default(now()) @db.Timestamp(6)
  updated_at DateTime? @default(now()) @db.Timestamp(6)

  @@index([user_id], map: "idx_conversations_user_id")
  @@index([created_at(sort: Desc)], map: "idx_conversations_created_at")
  @@map("conversations")
}

// Manual Indexes & Knowledge Base
model ManualIndex {
  id          String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name        String    @db.VarChar(255)
  description String?
  content     String
  url         String?
  type        String    @default("manual") @db.VarChar(50)
  file_type   String?   @db.VarChar(50)
  status      String?   @default("active") @db.VarChar(50)
  last_check  DateTime? @db.Timestamp(6)
  keywords    Json?
  fingerprint String    @unique
  embedding   Unsupported("vector(1536)")?
  metadata    Json?     @default("{}")
  created_at  DateTime? @default(now()) @db.Timestamp(6)
  updated_at  DateTime? @default(now()) @db.Timestamp(6)

  @@index([created_at(sort: Desc)], map: "idx_manual_indexes_created_at")
  @@index([fingerprint], map: "idx_manual_indexes_fingerprint")
  @@index([type], map: "idx_manual_indexes_type")
  @@index([status], map: "idx_manual_indexes_status")
  @@map("manual_indexes")
}

// Settings
model Setting {
  id         String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  key        String    @unique @db.VarChar(255)
  value      String
  created_at DateTime? @default(now()) @db.Timestamp(6)
  updated_at DateTime? @default(now()) @db.Timestamp(6)

  @@map("settings")
}

// Users (for authentication)
model User {
  id            String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email         String    @unique
  name          String?
  password_hash String?
  provider      String?   @default("credentials")
  created_at    DateTime? @default(now()) @db.Timestamp(6)
  updated_at    DateTime? @default(now()) @db.Timestamp(6)

  @@map("users")
}

// Sessions (for JWT)
model Session {
  id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  sessionToken String   @unique @map("session_token")
  userId       String   @map("user_id") @db.Uuid
  expires      DateTime
  createdAt    DateTime @default(now()) @map("created_at")

  @@map("sessions")
}
```

### 2. Enable pgvector Extension

Run this SQL command in your PostgreSQL database:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 3. Run Migrations

```bash
npx prisma migrate dev --name init
npx prisma generate
```

---

## Server-Side Setup

### 1. Prisma Client

Create `src/lib/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### 2. API Routes

#### Chat Endpoint

Create `src/app/api/widget/chat/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { prisma } from '@/lib/prisma';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { message, conversationId, userId } = await request.json();

    // Search knowledge base
    const searchResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/widget/manual-indexes/search`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: message, limit: 5 }),
      }
    );

    const { results } = await searchResponse.json();
    
    // Build context from search results
    const context = results
      .map((r: any) => `${r.name}: ${r.description || r.content.substring(0, 200)}`)
      .join('\n\n');

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a helpful customer service assistant. Use the following context to answer questions:\n\n${context}`,
        },
        { role: 'user', content: message },
      ],
      stream: false,
    });

    const response = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    return NextResponse.json({
      success: true,
      response,
      sources: results.slice(0, 3),
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process chat' },
      { status: 500 }
    );
  }
}
```

#### Knowledge Base Search

Create `src/app/api/widget/manual-indexes/search/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { query, limit = 10 } = await request.json();

    // Generate embedding for query
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: query,
    });

    const embedding = embeddingResponse.data[0].embedding;
    const embeddingStr = `[${embedding.join(',')}]`;

    // Hybrid search using vector similarity + BM25
    const results = await prisma.$queryRawUnsafe(`
      WITH vector_search AS (
        SELECT
          id, name, description, content, url, type, file_type, status,
          1 - (embedding <=> $1::vector) as vector_score,
          ROW_NUMBER() OVER (ORDER BY embedding <=> $1::vector) as vector_rank
        FROM manual_indexes
        WHERE status = 'active' AND embedding IS NOT NULL
        ORDER BY embedding <=> $1::vector
        LIMIT 20
      ),
      bm25_search AS (
        SELECT
          id,
          ts_rank_cd(
            setweight(to_tsvector('simple', COALESCE(name, '')), 'A') ||
            setweight(to_tsvector('simple', COALESCE(description, '')), 'B') ||
            setweight(to_tsvector('simple', COALESCE(content, '')), 'C'),
            plainto_tsquery('simple', $2)
          ) as bm25_score,
          ROW_NUMBER() OVER (ORDER BY ts_rank_cd(...) DESC) as bm25_rank
        FROM manual_indexes
        WHERE status = 'active'
        ORDER BY bm25_score DESC
        LIMIT 20
      )
      SELECT
        v.id, v.name, v.description, v.content, v.url, v.type, v.file_type, v.status,
        v.vector_score,
        COALESCE(b.bm25_score, 0) as bm25_score,
        (1.0 / (60 + v.vector_rank) + 1.0 / (60 + COALESCE(b.bm25_rank, 1000))) as hybrid_score
      FROM vector_search v
      LEFT JOIN bm25_search b ON v.id = b.id
      ORDER BY hybrid_score DESC
      LIMIT $3
    `, embeddingStr, query, limit) as any[];

    return NextResponse.json({
      success: true,
      results,
      count: results.length,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { success: false, error: 'Search failed' },
      { status: 500 }
    );
  }
}
```

#### URL Import (Server-side Service Usage)

Create `src/app/api/widget/manual-indexes/import-urls-batch/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ContentExtractorService } from 'lens-service/server';
import crypto from 'crypto';

function generateFingerprint(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex').substring(0, 64);
}

export async function POST(request: NextRequest) {
  try {
    const { urls } = await request.json();

    const extractor = new ContentExtractorService();
    const results = [];

    for (const url of urls) {
      try {
        const extracted = await extractor.extractFromUrl(url);
        const chunks = await extractor.createChunks(extracted);

        for (const chunk of chunks) {
          const fingerprint = generateFingerprint(chunk.content);

          await prisma.manualIndex.upsert({
            where: { fingerprint },
            update: {
              name: chunk.name,
              content: chunk.content,
              url,
              type: 'url',
              status: 'active',
              metadata: chunk.metadata || {},
            },
            create: {
              name: chunk.name,
              description: chunk.description,
              content: chunk.content,
              url,
              type: 'url',
              fingerprint,
              metadata: chunk.metadata || {},
            },
          });
        }

        results.push({ url, success: true, chunks: chunks.length });
      } catch (error) {
        results.push({ url, success: false, error: String(error) });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      indexes: results.filter(r => r.success),
      totalChunks: results.reduce((sum, r) => sum + (r.chunks || 0), 0),
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { success: false, error: 'Import failed' },
      { status: 500 }
    );
  }
}
```

---

## Client-Side Setup

### 1. Widget Demo Page

Create `src/app/lens-service/page.tsx`:

```typescript
'use client';

import { useEffect } from 'react';

export default function LensServicePage() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '/lens-service.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = async () => {
      const LensService = (window as any).LensService;

      await LensService.init({
        apiBaseUrl: '/api/widget',
        ui: {
          width: '400px',
          position: 'right',
          primaryColor: '#3b82f6',
        },
        user: {
          id: 'demo-user-123',
          name: 'Demo User',
          email: 'demo@example.com',
        },
        debug: true,
      });
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-4">Lens Service Widget Demo</h1>
      <p className="text-gray-600">
        The widget should appear in the bottom right corner.
      </p>
    </div>
  );
}
```

### 2. Copy Widget Bundle

```bash
cp node_modules/lens-service/dist/lens-service.js public/
```

Or add postinstall script in `package.json`:

```json
{
  "scripts": {
    "postinstall": "cp node_modules/lens-service/dist/lens-service.js public/"
  }
}
```

---

## Authentication

### JWT Utilities

Create `src/lib/auth.ts`:

```typescript
import { SignJWT, jwtVerify } from 'jose';
import { NextRequest } from 'next/server';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function signToken(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    return null;
  }
}

export async function getUserFromRequest(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  return {
    id: payload.userId as string,
    email: payload.email as string,
    name: payload.name as string,
  };
}
```

---

## Environment Variables

Create `.env.local`:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/lens_db"
OPENAI_API_KEY="sk-..."
JWT_SECRET="your-super-secret-jwt-key"
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

---

## Deployment

1. **Generate Prisma Client**: `npx prisma generate`
2. **Build**: `yarn build`
3. **Migrate Database**: `npx prisma migrate deploy`
4. **Enable pgvector**: `CREATE EXTENSION IF NOT EXISTS vector;`

---

## Troubleshooting

### Module not found: 'lens-service/server'

```bash
yarn upgrade lens-service
yarn add -D ignore-loader
```

### Widget not appearing

1. Check `/lens-service.js` is accessible
2. Verify `apiBaseUrl` configuration
3. Check browser console for errors

### Search returns no results

```bash
curl -X POST http://localhost:3000/api/widget/manual-indexes/generate-embeddings
```

---

## Support

- GitHub: https://github.com/GenAI-Agent/lens-service
- Documentation: WIDGET_INTEGRATION_GUIDE.md

