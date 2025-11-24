# Setup Guide

## Prerequisites

- Node.js 18+ or Bun
- Supabase account (for backend)
- Git

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd <project-name>
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Environment Setup**
   
   Create a `.env` file (if not auto-generated):
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
   VITE_SUPABASE_PROJECT_ID=your_project_id
   ```

4. **Database Setup**
   
   Run Supabase migrations:
   ```bash
   npm run db:push
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:8080`

## Development Tools

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

### Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Project Structure

```
src/
├── api/              # API client layer
├── components/       # React components
├── config/           # Configuration & constants
├── hooks/            # Custom React hooks
├── integrations/     # Third-party integrations
├── pages/            # Page components
├── stores/           # State management (Zustand)
└── lib/              # Utility functions
```

## Common Issues

### Port Already in Use
If port 8080 is occupied:
```bash
PORT=3000 npm run dev
```

### Supabase Connection Issues
- Verify environment variables
- Check Supabase project status
- Ensure RLS policies are configured

### Type Errors
Run type generation:
```bash
npm run generate-types
```
