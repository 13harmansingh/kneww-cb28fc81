# Testing Guide

## Overview

This project uses a pragmatic testing approach focusing on:
- Manual testing for critical user flows
- Type safety via TypeScript
- Runtime validation
- Console log monitoring during development

## Manual Testing Checklist

### Authentication Flow
- [ ] Sign up with email
- [ ] Sign in with existing account
- [ ] Sign out
- [ ] Auto-confirm email enabled
- [ ] Protected routes redirect to login
- [ ] Session persists across refreshes

### News Fetching
- [ ] News loads on homepage
- [ ] Language filter works
- [ ] Category filter works
- [ ] Geographic filter (country/state) works
- [ ] AI search returns results
- [ ] Loading states display correctly
- [ ] Error states show retry button
- [ ] Rate limit handling graceful

### Article Viewing
- [ ] Article modal opens
- [ ] AI analysis displays (bias, summary, ownership)
- [ ] Translation works
- [ ] Claims are visible
- [ ] Related news loads
- [ ] Bookmark functionality works

### Bookmarks
- [ ] Add bookmark saves article
- [ ] Remove bookmark deletes
- [ ] Bookmarks page shows saved articles
- [ ] Empty state displays when no bookmarks

### Admin Features
- [ ] Admin can access `/admin/users`
- [ ] Admin can change user roles
- [ ] Admin can ban/unban users
- [ ] Telemetry dashboard loads at `/admin/telemetry`
- [ ] Non-admins cannot access admin routes

### Performance
- [ ] Initial load under 3 seconds (4G)
- [ ] Navigation feels instant
- [ ] No layout shifts
- [ ] Smooth scrolling
- [ ] No janky animations

### Accessibility
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Screen reader compatibility
- [ ] ARIA labels present
- [ ] Color contrast sufficient

## Testing Network Conditions

### Slow Connection (3G)
1. Open Chrome DevTools
2. Network tab > Throttling > Slow 3G
3. Test all critical flows
4. Verify loading states
5. Confirm retry mechanisms work

### Offline Mode
1. Network tab > Offline
2. Verify offline banner appears
3. Check cached data displays
4. Test reconnection behavior

### Rate Limiting
1. Make rapid repeated requests
2. Verify 429 handling
3. Check fallback to cache
4. Confirm user-friendly error messages

## Type Checking

Run TypeScript compiler:
```bash
npm run type-check
```

Fix all errors before deploying.

## Linting

Run ESLint:
```bash
npm run lint
```

Auto-fix where possible:
```bash
npm run lint -- --fix
```

## Performance Testing

### Lighthouse Audit
```bash
npm run build
npx lighthouse http://localhost:8080 --view
```

Target scores:
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 90+

### Bundle Analysis
```bash
npm run build
npx vite-bundle-visualizer
```

Check for:
- Unused dependencies
- Duplicate packages
- Large chunks that should be lazy-loaded

## Security Testing

### Manual Security Review
- [ ] RLS policies enabled on all tables
- [ ] JWT auth on all Edge Functions
- [ ] No sensitive data in client code
- [ ] Input validation on all forms
- [ ] XSS protection via React escaping
- [ ] CSRF tokens where needed

### Run Security Scan
Check Supabase linter:
```bash
npm run db:lint
```

## Regression Testing

Before major releases, test:
1. All user flows end-to-end
2. Cross-browser (Chrome, Firefox, Safari)
3. Cross-device (Desktop, Mobile, Tablet)
4. Different network conditions
5. Edge cases (empty states, errors, rate limits)

## Debugging Tools

### Console Logs
During development, monitor console for:
- `[API]` - API call logs
- `[DEDUPE]` - Request deduplication
- `[CACHE]` - Cache hit/miss
- `[Telemetry]` - Telemetry events

### React DevTools
- Install React DevTools browser extension
- Inspect component tree
- Check props and state
- Profile re-renders

### Network Tab
- Monitor API calls
- Check request/response payloads
- Verify caching headers
- Identify slow requests

## Continuous Integration

Recommended CI checks:
```yaml
- npm run type-check
- npm run lint
- npm run build
```

## When to Add Tests

Consider adding automated tests for:
- Complex utility functions
- Critical business logic
- Frequently buggy areas
- Before major refactors

Suggested frameworks:
- **Unit**: Vitest
- **Integration**: Testing Library
- **E2E**: Playwright

## Pre-Deployment Testing

Final checklist before deploying:
1. Clean build with no errors
2. Manual smoke test of all features
3. Performance audit passes
4. Security scan clean
5. Console has no warnings
6. All TypeScript strict checks pass
