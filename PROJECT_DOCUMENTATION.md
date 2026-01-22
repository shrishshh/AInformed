# AInformed - Complete Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Data Storage](#data-storage)
5. [Core Features](#core-features)
6. [Data Flow & How It Works](#data-flow--how-it-works)
7. [API Routes](#api-routes)
8. [Frontend Components](#frontend-components)
9. [Caching Strategy](#caching-strategy)
10. [Authentication System](#authentication-system)
11. [Cron Jobs & Scheduled Tasks](#cron-jobs--scheduled-tasks)
12. [Content Filtering & Scoring](#content-filtering--scoring)
13. [Environment Variables](#environment-variables)
14. [Setup & Deployment](#setup--deployment)

---

## Project Overview

**AInformed** is a Next.js-based AI news aggregation platform that collects, filters, scores, and displays the latest artificial intelligence news from multiple sources. The platform focuses on delivering high-quality, relevant AI/tech content while filtering out consumer shopping, marketing, and non-tech content.

### Key Goals
- Aggregate AI news from multiple sources (Perplexity, Tavily, RSS feeds, GDELT, HackerNews)
- Filter and score content for relevance and quality
- Provide user authentication and bookmarking
- Cache data efficiently to reduce API calls
- Display news in a modern, responsive UI

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │  Pages   │  │Components│  │  Hooks   │  │   UI     │     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Routes (Next.js API)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ /ai-news │  │ /auth/*  │  │ /cron/*  │  │ /cache/* │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   MongoDB    │  │   Supabase   │  │ External APIs│
│              │  │              │  │              │
│ - NewsCache  │  │ - Bookmarks  │  │ - Perplexity │
│ - Tavily     │  │ - Users      │  │ - Tavily     │
│ - Perplexity │  │              │  │ - RSS Feeds  │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # API routes
│   │   ├── ai-news/        # Main news aggregation endpoint
│   │   ├── auth/           # Authentication endpoints
│   │   ├── cron/           # Scheduled job endpoints
│   │   └── cache/          # Cache management
│   ├── auth/               # Auth pages (login, signup)
│   ├── bookmarks/          # Bookmarks page
│   ├── categories/         # Category pages
│   └── page.tsx            # Home page
├── components/             # React components
│   ├── news/               # News-related components
│   ├── ui/                 # UI primitives (shadcn/ui)
│   └── layout/             # Layout components
├── lib/                    # Utility libraries
│   ├── cacheService.ts     # Caching logic
│   ├── contentScoring.ts   # Content relevance scoring
│   ├── rssCron.ts          # RSS/News fetching & caching
│   ├── perplexityFetcher.ts # Perplexity API integration
│   └── mongodb.js          # MongoDB connection
├── models/                 # Database models (Mongoose)
│   ├── NewsCache.ts        # News cache schema
│   ├── TavilyArticle.ts    # Tavily articles schema
│   └── PerplexityArticle.ts # Perplexity articles schema
└── hooks/                  # React hooks
    ├── useSupabaseAuth.ts  # Supabase auth hook
    └── useSupabaseBookmarks.ts # Bookmarks hook
```

---

## Technology Stack

### Frontend
- **Next.js 14** (App Router) - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI component library
- **Framer Motion** - Animations
- **React Query** - Data fetching & caching

### Backend
- **Next.js API Routes** - Server-side API endpoints
- **Node.js** - Runtime environment

### Databases
- **MongoDB** (via Mongoose) - Primary database for:
  - News cache
  - Tavily articles
  - Perplexity articles
  - User data (legacy)
- **Supabase** (PostgreSQL) - For:
  - User authentication
  - Bookmarks storage

### External Services
- **Perplexity API** - AI-powered news search
- **Tavily API** - News aggregation
- **RSS Feeds** - Various AI news sources
- **GDELT** - Global news database
- **HackerNews API** - Tech news

### Caching
- **In-Memory Cache** - Fast access (5 min TTL)
- **MongoDB Cache** - Persistent cache (1 hour TTL)
- **HTTP Cache Headers** - Browser/CDN caching

---

## Data Storage

### MongoDB Collections

#### 1. `newscaches` Collection
**Purpose**: Cache aggregated news responses to avoid repeated API calls

**Schema** (`src/models/NewsCache.ts`):
```typescript
{
  cacheKey: string,        // Unique key: "news:category:AI|page:1|limit:50"
  data: object,            // Full API response with articles
  sources: {
    gnews: number,
    rss: number,
    gdelt: number,
    hn: number,
    tavily: number,
    perplexity: number,
    total: number
  },
  isMockData: boolean,
  timestamp: Date,         // When cache was created
  expiresAt: Date,         // Auto-delete after 1 hour
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `cacheKey` (unique)
- `expiresAt` (TTL index for auto-deletion)

#### 2. `tavilyarticles` Collection
**Purpose**: Store Tavily articles fetched by cron jobs

**Schema** (`src/models/TavilyArticle.ts`):
```typescript
{
  url: string,             // Unique article URL
  title: string,
  description: string,
  source: string,
  publishedAt: Date,
  group: string,           // Which query group (e.g., "Core AI")
  createdAt: Date,
  updatedAt: Date
}
```

#### 3. `perplexityarticles` Collection
**Purpose**: Store Perplexity articles fetched by cron jobs

**Schema** (`src/models/PerplexityArticle.ts`):
```typescript
{
  url: string,             // Unique article URL
  title: string,
  description: string,
  source: string,
  publishedAt: Date,
  group: string,           // Which query group (e.g., "Core AI")
  createdAt: Date,
  updatedAt: Date
}
```

#### 4. `users` Collection (Legacy)
**Purpose**: User accounts (currently using Supabase for auth)

**Schema** (`src/models/User.js`):
```javascript
{
  name: string,
  email: string (unique),
  password: string (hashed),
  isEmailVerified: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Supabase Tables

#### 1. `bookmarks` Table
**Purpose**: User bookmarks for articles

**Schema**:
```sql
CREATE TABLE bookmarks (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  article_id TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  image_url TEXT,
  source TEXT,
  description TEXT,
  summary TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes**:
- `user_id` + `article_id` (unique constraint)
- `user_id` (for fast queries)

#### 2. `auth.users` (Supabase Built-in)
**Purpose**: User authentication managed by Supabase

---

## Core Features

### 1. News Aggregation
- **Multi-source collection**: Fetches from Perplexity, Tavily, RSS, GDELT, HackerNews
- **Real-time updates**: Cron jobs update cache hourly
- **Category filtering**: Filter by AI categories (ML, NLP, CV, etc.)
- **Search functionality**: Query-based article filtering

### 2. Content Filtering
- **Consumer content filter**: Removes shopping/deals/marketing content
- **Relevance scoring**: AI-powered content scoring (0-100)
- **Quality indicators**: Flags for research, innovation, premium sources
- **Deduplication**: Removes duplicate articles by URL

### 3. User Features
- **Authentication**: Supabase-based auth (email/password + Google OAuth)
- **Bookmarks**: Save articles for later reading
- **Profile**: User profile management
- **Saved articles**: Access saved content

### 4. Caching System
- **Three-tier caching**:
  1. In-memory cache (5 min) - fastest
  2. MongoDB cache (1 hour) - persistent
  3. HTTP cache headers (10 min) - browser/CDN
- **Cache invalidation**: Automatic cleanup of expired caches
- **Force refresh**: `?refresh=true` parameter to bypass cache

### 5. AI Tools Section
- **AI Stocks**: Stock market data for AI companies
- **ArXiv Papers**: Latest research papers
- **Trending AI Jobs**: Job listings

### 6. Category Pages
- Pre-defined categories:
  - Artificial Intelligence
  - Machine Learning
  - Deep Learning
  - Natural Language Processing
  - Computer Vision
  - Robotics
  - Data Science
  - Cybersecurity
  - Quantum Computing
  - AI Ethics
  - Neural Networks
  - Automation
  - Big Data

---

## Data Flow & How It Works

### News Aggregation Flow

```
1. User visits homepage or searches
   │
   ▼
2. Frontend calls /api/ai-news?q=AI&category=...
   │
   ▼
3. API Route checks cache:
   ├─ Memory cache? → Return immediately
   ├─ MongoDB cache? → Return if < 1 hour old
   └─ No cache? → Continue to fetch
   │
   ▼
4. Fetch from sources (in parallel):
   ├─ Perplexity: From in-memory cache (updated by cron)
   ├─ Tavily: From in-memory cache (updated by cron)
   ├─ RSS: From in-memory cache (updated on-demand)
   ├─ GDELT: From in-memory cache (updated on-demand)
   └─ HackerNews: From in-memory cache (updated on-demand)
   │
   ▼
5. Merge & deduplicate articles (by URL)
   │
   ▼
6. Filter consumer content (shopping/deals/marketing)
   │
   ▼
7. Score articles for relevance (0-100)
   │
   ▼
8. Filter by query/category (semantic matching)
   │
   ▼
9. Sort by date (newest first) + score
   │
   ▼
10. Store in caches:
    ├─ Memory cache (5 min)
    └─ MongoDB cache (1 hour)
   │
   ▼
11. Return JSON response to frontend
   │
   ▼
12. Frontend displays articles in grid
```

### Cron Job Flow (Background Updates)

```
1. Railway/External cron triggers:
   ├─ /api/cron/perplexity?secret=...
   └─ /api/cron/tavily?secret=...
   │
   ▼
2. Cron endpoint authenticates (checks CRON_SECRET)
   │
   ▼
3. Determines query group based on hour:
   ├─ Perplexity: 7 groups rotated hourly
   └─ Tavily: 7 groups rotated hourly
   │
   ▼
4. Fetches articles from API:
   ├─ Perplexity API: POST /search
   └─ Tavily API: POST /search
   │
   ▼
5. Formats articles to standard format
   │
   ▼
6. Stores in MongoDB:
   ├─ Upsert by URL (prevents duplicates)
   └─ Tag with group name
   │
   ▼
7. Updates in-memory cache:
   ├─ Merges with existing cache
   └─ Deduplicates by URL
   │
   ▼
8. Invalidates old news caches:
   ├─ Deletes MongoDB news caches
   └─ Clears memory cache keys
   │
   ▼
9. Returns success response
```

### Bookmark Flow

```
1. User clicks bookmark icon on article
   │
   ▼
2. Frontend calls useSupabaseBookmarks hook
   │
   ▼
3. Hook checks if user is logged in (Supabase)
   │
   ▼
4. If not logged in → Show login prompt
   │
   ▼
5. If logged in → Insert into Supabase:
   INSERT INTO bookmarks (user_id, article_id, title, url, ...)
   │
   ▼
6. Update local state (React hook)
   │
   ▼
7. UI updates (bookmark icon filled)
```

### Authentication Flow

```
1. User visits /auth/login or /auth/signup
   │
   ▼
2. Frontend form submission
   │
   ▼
3. API call to /api/auth/login or /api/auth/signup
   │
   ▼
4. Backend:
   ├─ Signup: Create user in MongoDB + Supabase
   ├─ Login: Verify credentials (MongoDB or Supabase)
   └─ Google OAuth: Exchange code for user info
   │
   ▼
5. Generate JWT token (7-day expiry)
   │
   ▼
6. Return token to frontend
   │
   ▼
7. Frontend stores token in localStorage/cookie
   │
   ▼
8. Subsequent requests include token in headers
```

---

## API Routes

### `/api/ai-news` (Main News Endpoint)

**Method**: `GET`

**Query Parameters**:
- `q` (optional): Search query (default: "AI")
- `category` (optional): Category filter (e.g., "Machine Learning")
- `page` (optional): Page number (default: 1)
- `limit` (optional): Articles per page (default: 50)
- `refresh` (optional): Force refresh cache (`true`/`false`)

**Response**:
```json
{
  "articles": [
    {
      "title": "Article title",
      "description": "Article description",
      "url": "https://...",
      "imageUrl": "https://...",
      "publishedAt": "2024-01-01T00:00:00Z",
      "source": { "name": "Source Name" },
      "category": "Artificial Intelligence",
      "score": {
        "relevanceScore": 85,
        "aiFocusScore": 90,
        "innovationScore": 75
      }
    }
  ],
  "_sources": {
    "gnews": 0,
    "rss": 0,
    "gdelt": 0,
    "hn": 0,
    "tavily": 0,
    "perplexity": 15,
    "total": 15
  },
  "_isMockData": false,
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**Flow**:
1. Check memory cache → return if found
2. Check MongoDB cache → return if < 1 hour old
3. Fetch from sources (Perplexity, Tavily, etc.)
4. Filter, score, and sort articles
5. Store in caches
6. Return response

### `/api/auth/login`

**Method**: `POST`

**Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "message": "Login successful",
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "name": "User Name",
    "email": "user@example.com"
  }
}
```

### `/api/auth/signup`

**Method**: `POST`

**Body**:
```json
{
  "name": "User Name",
  "email": "user@example.com",
  "password": "password123"
}
```

### `/api/cron/perplexity`

**Method**: `GET` or `POST`

**Query Parameters**:
- `secret`: CRON_SECRET (required in production)
- `group` (optional): Override query group

**Purpose**: Update Perplexity article cache (called by external cron)

### `/api/cron/tavily`

**Method**: `GET` or `POST`

**Query Parameters**:
- `secret`: CRON_SECRET (required in production)
- `group` (optional): Override query group

**Purpose**: Update Tavily article cache (called by external cron)

### `/api/cache-status`

**Method**: `GET`

**Purpose**: Get cache statistics (memory + MongoDB)

---

## Frontend Components

### Key Components

#### 1. `NewsCardWithBookmark`
**Location**: `src/components/NewsCardWithBookmark.tsx`

**Props**:
- `id`: Article ID (URL)
- `title`: Article title
- `summary`: Article description
- `imageUrl`: Article image
- `source`: Source name
- `date`: Published date
- `url`: Article URL

**Features**:
- Bookmark button (saves to Supabase)
- Responsive card layout
- Image fallback
- Time ago display

#### 2. `HeroSection`
**Location**: `src/components/HeroSection.tsx`

**Purpose**: Homepage hero banner with search

#### 3. `AIToolsSection`
**Location**: `src/components/AIToolsSection.tsx`

**Purpose**: Displays AI tools and resources

#### 4. `AIStocksSidebar`
**Location**: `src/components/AIStocksSidebar.tsx`

**Purpose**: Shows AI company stock prices

#### 5. `LatestArxivPapers`
**Location**: `src/components/LatestArxivPapers.tsx`

**Purpose**: Displays latest ArXiv research papers

### Pages

#### 1. Home Page (`/`)
**File**: `src/app/page.tsx`

**Features**:
- Hero section
- AI tools section
- News feed (paginated)
- Sidebar (stocks + papers)

#### 2. Category Pages (`/categories/[category]`)
**File**: `src/app/categories/[category]/page.tsx`

**Features**:
- Filtered news by category
- Category-specific query mapping

#### 3. Bookmarks Page (`/bookmarks`)
**File**: `src/app/bookmarks/page.tsx`

**Features**:
- List of user's bookmarked articles
- Remove bookmark functionality

#### 4. Search Page (`/search`)
**File**: `src/app/search/page.tsx`

**Features**:
- Search input
- Results display
- Query-based filtering

---

## Caching Strategy

### Three-Tier Caching

#### 1. In-Memory Cache (Fastest)
- **Location**: Node.js process memory
- **TTL**: 5 minutes
- **Implementation**: `src/lib/cacheService.ts`
- **Use case**: Frequently accessed data

#### 2. MongoDB Cache (Persistent)
- **Location**: MongoDB `newscaches` collection
- **TTL**: 1 hour
- **Auto-cleanup**: TTL index deletes expired entries
- **Use case**: Survives server restarts

#### 3. HTTP Cache Headers (Browser/CDN)
- **Location**: Browser cache or CDN
- **TTL**: 10 minutes
- **Headers**: `Cache-Control: public, max-age=600, stale-while-revalidate=300`
- **Use case**: Reduce server load

### Cache Invalidation

**Automatic**:
- MongoDB TTL index deletes expired entries
- Memory cache checks TTL on access
- Cron jobs invalidate news caches after updates

**Manual**:
- `?refresh=true` parameter bypasses all caches
- Admin endpoints can clear specific caches

### Cache Keys

Format: `{prefix}:{param1}:{value1}|{param2}:{value2}`

Example: `news:category:Artificial Intelligence|page:1|limit:50`

---

## Authentication System

### Dual Authentication (Legacy + Supabase)

#### 1. MongoDB Auth (Legacy)
- **Location**: `src/models/User.js`
- **Endpoints**: `/api/auth/login`, `/api/auth/signup`
- **Token**: JWT (7-day expiry)
- **Status**: Still functional but migrating to Supabase

#### 2. Supabase Auth (Current)
- **Location**: Supabase `auth.users` table
- **Hook**: `src/hooks/useSupabaseAuth.ts`
- **Features**:
  - Email/password
  - Google OAuth
  - Session management
  - Password reset

### Authentication Flow

```
1. User submits login form
   │
   ▼
2. Frontend calls Supabase: supabase.auth.signInWithPassword()
   │
   ▼
3. Supabase validates credentials
   │
   ▼
4. Supabase returns session + user object
   │
   ▼
5. Frontend stores session (Supabase handles storage)
   │
   ▼
6. useSupabaseAuth hook provides user state
   │
   ▼
7. Protected routes check isLoggedIn
```

### Protected Routes

**Middleware**: `src/middleware.js` (if implemented)

**Hook-based protection**:
```typescript
const { user, isLoggedIn } = useSupabaseAuth();
if (!isLoggedIn) {
  router.push('/auth/login');
}
```

---

## Cron Jobs & Scheduled Tasks

### Perplexity Cron Job

**Endpoint**: `/api/cron/perplexity`

**Schedule**: Hourly (external cron service)

**Process**:
1. Authenticate with `CRON_SECRET`
2. Determine query group based on hour (7 groups, rotated)
3. Fetch articles from Perplexity API
4. Store in MongoDB `perplexityarticles` collection
5. Update in-memory cache
6. Invalidate old news caches

**Query Groups** (rotated hourly):
- `Core AI`: AI news, AI ethics
- `ML Foundation`: Machine learning, data science
- `Deep Learning Stack`: Deep learning, neural networks
- `NLP & LLMs`: Natural language processing, LLMs
- `Vision & Perception`: Computer vision
- `Automation & Robotics`: Robotics, automation
- `Advanced Topics`: Quantum computing, cybersecurity

### Tavily Cron Job

**Endpoint**: `/api/cron/tavily`

**Schedule**: Hourly (external cron service)

**Process**: Similar to Perplexity cron

### Setup

**Railway/External Cron**:
```bash
# Every hour
0 * * * * curl "https://your-domain.com/api/cron/perplexity?secret=YOUR_SECRET"
0 * * * * curl "https://your-domain.com/api/cron/tavily?secret=YOUR_SECRET"
```

**Local Testing**:
```bash
# Manual trigger
curl "http://localhost:3000/api/cron/perplexity?secret=your-secret-key"
```

---

## Content Filtering & Scoring

### Content Scoring System

**File**: `src/lib/contentScoring.ts`

**Scores**:
- `relevanceScore` (0-100): Overall relevance to AI/tech
- `aiFocusScore` (0-100): Specific AI focus
- `innovationScore` (0-100): Innovation/new development

**Scoring Factors**:

1. **High-Value Keywords** (+20 per match):
   - "breakthrough", "innovation", "ChatGPT", "GPT-4", "LLM", "transformer", etc.

2. **Medium-Value Keywords** (+8 per match):
   - "AI", "machine learning", "deep learning", "data science", etc.

3. **Premium Sources** (+15):
   - MIT, Stanford, Google AI, OpenAI, ArXiv, Nature, Science, etc.

4. **Research Indicators** (+20):
   - "research", "study", "paper", "arxiv", "peer review"

5. **Innovation Indicators** (+35):
   - "breakthrough", "discovery", "unveiled", "launched", "announced"

6. **Penalties**:
   - Consumer content: Score set to 0 (filtered out)
   - No strong AI keywords: -20
   - No industry focus: -10

### Consumer Content Filter

**Blocked Keywords**:
- Shopping: "black friday", "deal", "sale", "discount", "buy now"
- Reviews: "product review", "unboxing", "hands-on"
- Marketing: "marketing", "advertising", "sponsored"
- Price patterns: "$12", "under $50", "drops to $"

**Filtering**:
- Articles with consumer keywords → Score = 0 → Filtered out
- Price patterns detected → Filtered out
- Deal patterns in title → Filtered out

### Article Filtering Pipeline

```
1. Fetch articles from sources
   │
   ▼
2. Deduplicate by URL
   │
   ▼
3. Filter consumer content (score = 0)
   │
   ▼
4. Score articles (relevance, AI focus, innovation)
   │
   ▼
5. Filter by score thresholds:
   - relevanceScore >= 15
   - aiFocusScore >= 5
   - relevanceScore > 0 (blocks consumer content)
   │
   ▼
6. Filter by query/category (semantic matching)
   │
   ▼
7. Sort by date (newest first) + score
   │
   ▼
8. Return filtered articles
```

---

## Environment Variables

### Required Variables

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/ainformed

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Authentication
JWT_SECRET=your-jwt-secret-key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# External APIs
PERPLEXITY_API_KEY=your-perplexity-api-key
TAVILY_API_KEY=your-tavily-api-key
GNEWS_API_KEY=your-gnews-api-key (optional, currently disabled)

# Cron Jobs
CRON_SECRET=your-cron-secret-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### Optional Variables

```bash
# NextAuth (if using)
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000

# Google Search Console
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your-verification-code
```

---

## Setup & Deployment

### Local Development

1. **Clone repository**:
```bash
git clone <repository-url>
cd AInformed-1
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up environment variables**:
```bash
cp .env.example .env.local
# Edit .env.local with your values
```

4. **Start MongoDB** (if local):
```bash
mongod
```

5. **Run development server**:
```bash
npm run dev
```

6. **Access application**:
```
http://localhost:3000
```

### Production Deployment

#### Railway Deployment

1. **Connect Railway to GitHub repository**

2. **Set environment variables** in Railway dashboard

3. **Configure build**:
   - Build command: `npm run build`
   - Start command: `npm start`

4. **Set up cron jobs**:
   - Use Railway cron or external service (cron-job.org)
   - Schedule: Every hour
   - URL: `https://your-domain.com/api/cron/perplexity?secret=YOUR_SECRET`

#### Vercel Deployment

1. **Connect Vercel to GitHub**

2. **Set environment variables** in Vercel dashboard

3. **Deploy**: Automatic on push to main branch

4. **Set up cron jobs**: Use Vercel Cron or external service

### Database Setup

#### MongoDB

1. **Create database**: `ainformed`

2. **Collections are auto-created** on first use:
   - `newscaches`
   - `tavilyarticles`
   - `perplexityarticles`
   - `users` (if using MongoDB auth)

3. **Indexes are auto-created** by Mongoose schemas

#### Supabase

1. **Create Supabase project**

2. **Create bookmarks table**:
```sql
CREATE TABLE bookmarks (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  article_id TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  image_url TEXT,
  source TEXT,
  description TEXT,
  summary TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, article_id)
);

CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
```

3. **Enable Row Level Security (RLS)**:
```sql
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookmarks"
  ON bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks"
  ON bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON bookmarks FOR DELETE
  USING (auth.uid() = user_id);
```

### Monitoring & Debugging

#### Logs

**Console logs** are available in:
- Railway: Dashboard → Logs
- Vercel: Dashboard → Functions → Logs
- Local: Terminal output

**Key log patterns**:
- `📦 Database cache found`: Cache hit
- `🔄 Force refresh requested`: Cache bypass
- `✅ Perplexity cache updated`: Cron success
- `🚫 Filtered out X consumer content articles`: Content filtering

#### Cache Status

**Endpoint**: `/api/cache-status`

**Response**:
```json
{
  "memoryCache": {
    "size": 10,
    "keys": ["news:...", ...]
  },
  "mongodbCache": {
    "totalCaches": 50,
    "validCaches": 45,
    "expiredCaches": 5
  }
}
```

---

## Common Issues & Solutions

### Issue: No articles showing

**Possible causes**:
1. Perplexity/Tavily cache empty
2. API keys not set
3. Cron jobs not running

**Solutions**:
1. Check environment variables
2. Manually trigger cron: `curl "http://localhost:3000/api/cron/perplexity?secret=YOUR_SECRET"`
3. Check MongoDB connection
4. Review console logs

### Issue: Cache not updating

**Possible causes**:
1. Cache TTL too long
2. Cron jobs not running
3. Cache invalidation failing

**Solutions**:
1. Use `?refresh=true` to bypass cache
2. Check cron job logs
3. Manually clear MongoDB cache

### Issue: Authentication not working

**Possible causes**:
1. Supabase credentials incorrect
2. JWT_SECRET not set
3. CORS issues

**Solutions**:
1. Verify Supabase environment variables
2. Check browser console for errors
3. Verify Supabase project settings

---

## Future Improvements

### Planned Features
- [ ] Real-time notifications for breaking news
- [ ] Personalized news feed based on user preferences
- [ ] Article recommendations
- [ ] Social sharing
- [ ] Newsletter subscription
- [ ] Advanced search filters
- [ ] Dark mode improvements
- [ ] Mobile app (React Native)

### Technical Debt
- [ ] Migrate fully to Supabase (remove MongoDB auth)
- [ ] Implement Redis for caching
- [ ] Add unit tests
- [ ] Improve error handling
- [ ] Add API rate limiting
- [ ] Implement search indexing (Elasticsearch/Algolia)

---

## Contact & Support

For questions or issues:
1. Check console logs
2. Review this documentation
3. Check GitHub issues
4. Contact development team

---

**Last Updated**: January 2024
**Version**: 1.0.0
