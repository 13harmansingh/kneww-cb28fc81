# KNEW Network - Architecture Documentation

## Overview

KNEW Network is a full-stack news aggregation and analysis platform built with React, TypeScript, Vite, and Supabase (Lovable Cloud). This document outlines the system architecture, patterns, and conventions used throughout the codebase.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS with custom design system
- **Backend**: Supabase Edge Functions (Deno)
- **Database**: PostgreSQL (via Supabase)
- **State Management**: React hooks, Zustand
- **API**: WorldNews API (external)
- **AI**: Lovable AI (for analysis, translation)

## Project Structure

```
knew-network/
├── src/
│   ├── api/                 # API client layer
│   │   ├── client.ts       # Unified edge function client
│   │   ├── news.ts         # News-related API calls
│   │   ├── analysis.ts     # AI analysis API calls
│   │   └── translation.ts  # Translation API calls
│   ├── components/         # React components
│   │   ├── ui/            # shadcn/ui components
│   │   ├── skeletons/     # Loading skeletons
│   │   └── GlobalAPIStatus.tsx  # Global error handling
│   ├── config/            # Configuration & constants
│   │   ├── constants.ts   # App-wide constants
│   │   └── types.ts       # Shared TypeScript types
│   ├── hooks/             # Custom React hooks
│   │   ├── useNews.ts     # News fetching & caching
│   │   ├── useRelatedNews.ts
│   │   ├── useTranslate.ts
│   │   ├── useRequestDedupe.ts  # Request deduplication
│   │   ├── useDebounce.ts      # Debouncing utility
│   │   └── useAuth.ts          # Authentication
│   ├── pages/             # Page components
│   ├── stores/            # Zustand stores
│   │   └── globalApiStatus.ts  # Global API state
│   └── integrations/      # Third-party integrations
│       └── supabase/      # Supabase client & types
├── supabase/
│   └── functions/         # Edge functions
│       ├── fetch-news/
│       ├── analyze-news/
│       ├── translate-article/
│       ├── ai-search-news/
│       └── _shared/       # Shared utilities
│           ├── auth.ts    # JWT validation
│           ├── rateLimit.ts  # Rate limiting
│           ├── cache.ts   # AI analysis caching
│           └── telemetry.ts  # Logging system
└── docs/
    └── architecture.md    # This file
```

## API Flow Diagram

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ 1. User Action (search, select location, etc.)
       │
       ▼
┌─────────────────────────────┐
│    React Component          │
│  (Index, Compare, etc.)     │
└──────────┬──────────────────┘
           │
           │ 2. Calls custom hook
           │
           ▼
┌─────────────────────────────┐
│   Custom Hook                │
│  (useNews, useTranslate)    │
│  - Debouncing (500ms)       │
│  - Request Deduplication    │
│  - AbortController          │
└──────────┬──────────────────┘
           │
           │ 3. Invokes API client
           │
           ▼
┌─────────────────────────────┐
│    API Client Layer         │
│  (src/api/client.ts)        │
│  - Unified error handling   │
│  - Telemetry logging        │
│  - Rate limit detection     │
└──────────┬──────────────────┘
           │
           │ 4. Calls Supabase Edge Function
           │
           ▼
┌─────────────────────────────┐
│   Supabase Edge Function    │
│  (Deno serverless)          │
│  - JWT Auth Validation      │
│  - Rate Limiting Check      │
│  - External API Call        │
│  - AI Processing            │
│  - Cache Check/Update       │
│  - Telemetry Logging        │
└──────────┬──────────────────┘
           │
           │ 5. External API / AI
           │
           ▼
┌─────────────────────────────┐
│  WorldNews API / Lovable AI │
└──────────┬──────────────────┘
           │
           │ 6. Response flows back
           │
           ▼
┌─────────────────────────────┐
│   Component Updates State   │
│   UI Re-renders             │
└─────────────────────────────┘
```

## Rate Limiting System

### Backend (Edge Functions)

Rate limiting is applied at two levels:

1. **Per-IP Rate Limiting**: Prevents abuse from a single IP address
2. **Per-User Rate Limiting**: Prevents abuse from authenticated users

**Implementation**: `supabase/functions/_shared/rateLimit.ts`

**Endpoint Limits**:
- `fetch-news`: 5 requests/minute (per user), 20/min (per IP)
- `analyze-news`: 20 requests/minute
- `translate-article`: 20 requests/minute
- `ai-search-news`: 8 requests/minute

**Rate Limit Response**: Returns 429 status with retry-after header

### Frontend (Request Throttling)

**Implementation**: `src/hooks/useNews.ts`

- **Minimum Request Interval**: 1.5 seconds between requests
- **Debouncing**: 500ms delay for user input (search, language selection)
- **Request Deduplication**: Prevents duplicate simultaneous requests

**How it works**:
1. User types in search → debounced for 500ms
2. Request is checked against in-flight requests
3. If duplicate, reuse existing promise
4. If new, execute with minimum 1.5s interval from last request
5. AbortController cancels on component unmount

## Caching System

### AI Analysis Cache

**Purpose**: Avoid redundant AI analysis of the same article

**Implementation**: `supabase/functions/_shared/cache.ts`

**Database Table**: `ai_analysis_cache`

**Cache Strategy**: Stale-While-Revalidate
- Check cache first
- If valid (< 7 days old), return cached result
- If stale or missing, return pending status and async job starts
- Update cache when analysis completes

**Cache Key**: Hash of article URL + model version

### News Cache (Frontend)

**Purpose**: Avoid refetching news for same location/category/language

**Implementation**: `src/hooks/useNewsCache.ts`

**Cache Duration**: 10 minutes

**Cache Strategy**: In-memory Map
- Key: `${state}-${category}-${language}-${sourceCountry}`
- Stores full news response with available languages
- Cleared on unmount or manual invalidation

## AI Cost Telemetry

**Purpose**: Track AI API usage, costs, cache efficiency, and errors

**Implementation**: `supabase/functions/_shared/telemetry.ts`

**Database Table**: `telemetry_logs`

**Logged Events**:
- `api.call` - Every edge function invocation
- `cache.hit` - AI analysis served from cache
- `cache.miss` - AI analysis requires new API call
- `rate_limit.exceeded` - Rate limit triggered
- `auth.failure` - Authentication failed
- `external_api.error` - WorldNews API error
- `ai.analysis` - AI analysis completed (with token counts)
- `ai.search` - AI search performed
- `ai.translate` - Translation completed

**Metadata Tracked**:
```typescript
{
  userId: string;
  endpoint: string;
  duration: number;
  tokensIn?: number;
  tokensOut?: number;
  model?: string;
  cacheHit?: boolean;
  error?: string;
}
```

## Frontend Request Lifecycle

### Standard Hook Pattern

All data-fetching hooks follow this pattern:

```typescript
export function useCustomHook(params: Params) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { executeRequest, cancelAll } = useRequestDedupe<T>();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const key = generateCacheKey('function-name', params);
      
      const result = await executeRequest(key, async (signal) => {
        const response = await apiFunction(params, { signal });
        
        if (response.error) {
          throw new Error(response.error.message);
        }
        
        return response.data;
      });

      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [params, executeRequest]);

  useEffect(() => {
    load();
    return () => cancelAll();
  }, [load, cancelAll]);

  return { data, loading, error, reload: load, cancel: cancelAll };
}
```

**Key Features**:
- ✅ Request deduplication
- ✅ AbortController for cleanup
- ✅ Consistent return signature
- ✅ Error handling
- ✅ Reload capability

## Global Error Handling

**Component**: `src/components/GlobalAPIStatus.tsx`

**Zustand Store**: `src/stores/globalApiStatus.ts`

**Handles**:
1. **Rate Limit**: Shows toast, auto-resets after 5s
2. **Auth Error**: Shows toast, redirects to `/login`
3. **Server Error**: Shows toast with Retry button
4. **Loading**: Small spinner in top-right corner

**Usage**:
```tsx
// In App.tsx
import { GlobalAPIStatus } from '@/components/GlobalAPIStatus';

function App() {
  return (
    <>
      <GlobalAPIStatus />
      {/* rest of app */}
    </>
  );
}
```

## Authentication Flow

1. User signs up/logs in → Supabase Auth
2. JWT token stored in localStorage
3. JWT sent in `Authorization` header for all edge function calls
4. Edge function validates JWT → extracts `user.id`
5. Rate limiting and telemetry tied to `user.id`

## Database Schema

**Key Tables**:
- `profiles`: User profiles with display_name, avatar, language
- `bookmarks`: Saved articles per user
- `user_preferences`: User settings (language, categories, dark mode)
- `user_roles`: Role-based access control (admin, user, editor)
- `notifications`: Real-time notifications via Supabase Channels
- `telemetry_logs`: API usage tracking
- `ai_analysis_cache`: Cached AI analysis results
- `search_history`: User search history

## Performance Optimizations

1. **Code Splitting**: Route-based lazy loading (future)
2. **Request Deduplication**: Prevents duplicate API calls
3. **Debouncing**: 500ms delay for user input
4. **Throttling**: 1.5s minimum between requests
5. **Caching**: 10min news cache, 7-day AI cache
6. **Loading Skeletons**: Instant perceived performance
7. **Optimistic Updates**: UI updates before API confirmation

## Security Measures

1. **JWT Authentication**: All edge functions require valid JWT
2. **Rate Limiting**: IP-level and user-level protection
3. **RLS Policies**: Row-level security on all database tables
4. **Input Validation**: Zod schemas on all inputs
5. **CORS**: Configured for production domain only
6. **Secrets Management**: Environment variables via Supabase

## Deployment

**Frontend**: Vite build → Lovable hosting
- Automatic on git push
- Preview deployments for branches

**Backend**: Edge functions auto-deploy on push
- No manual deployment needed
- Instant global CDN distribution

## Monitoring & Observability

1. **Telemetry Dashboard**: `/admin/telemetry`
   - Request counts
   - Cache hit/miss rates
   - Rate limit events
   - AI cost tracking
   - Error logs

2. **Console Logs**: All edge functions log to Supabase logs

3. **Error Tracking**: Global error boundary + telemetry

## Development Guidelines

### Adding a New Feature

1. **Define Types**: Add to `src/config/types.ts`
2. **Create API Client**: Add function to `src/api/`
3. **Create Hook**: Follow standard pattern in `src/hooks/`
4. **Create Component**: Use existing UI components
5. **Add Tests**: (Future) Write unit tests
6. **Update Docs**: Document in this file

### Code Style

- **TypeScript**: Strict mode enabled
- **Linting**: ESLint + Prettier
- **Naming**: camelCase for functions/variables, PascalCase for components
- **Imports**: Use `@/` alias for absolute imports
- **Comments**: JSDoc for public APIs

### Git Workflow

1. Create feature branch: `feature/description`
2. Make changes with clear commit messages
3. Push to Lovable → auto-deploy preview
4. Merge to main → production deploy

## Future Improvements

- [ ] Implement route-based code splitting
- [ ] Add comprehensive unit tests
- [ ] Implement service worker for offline support
- [ ] Add GraphQL layer for complex queries
- [ ] Implement real-time collaboration features
- [ ] Add analytics dashboard for non-admin users
- [ ] Implement A/B testing framework

---

**Last Updated**: 2025-11-23
**Maintainer**: KNEW Network Team
