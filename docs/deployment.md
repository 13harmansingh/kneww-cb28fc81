# Deployment Guide

## Pre-Deployment Checklist

- [ ] All tests pass
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No ESLint warnings (`npm run lint`)
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Edge functions deployed
- [ ] Performance audit completed
- [ ] Security scan passed

## Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

## Deployment Options

### Option 1: Lovable Hosting (Recommended)

1. Click "Publish" in the Lovable editor
2. Review changes
3. Click "Update" to deploy

**Note:** 
- Frontend changes require manual "Update" click
- Backend changes (Edge Functions, DB) deploy automatically

### Option 2: Vercel

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Set environment variables in Vercel dashboard

### Option 3: Netlify

1. Create `netlify.toml`:
   ```toml
   [build]
     command = "npm run build"
     publish = "dist"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

2. Deploy via Netlify CLI or Git integration

### Option 4: Custom Server

Build and serve:
```bash
npm run build
npm run preview
```

Or use a static file server:
```bash
npx serve -s dist -l 3000
```

## Environment Variables

Ensure all production environment variables are set:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

## Post-Deployment

1. **Smoke Test**: Verify critical user flows
2. **Monitor**: Check telemetry logs for errors
3. **Performance**: Run Lighthouse audit
4. **Security**: Verify RLS policies are active

## Rollback Procedure

If issues arise:

1. **Via Lovable**: Use History view to restore previous version
2. **Via Git**: 
   ```bash
   git revert <commit-hash>
   git push
   ```

## Custom Domain

To connect a custom domain:

1. Navigate to Project > Settings > Domains in Lovable
2. Follow DNS configuration instructions
3. Wait for SSL certificate provisioning (5-10 minutes)

**Requirements**: Paid Lovable plan for custom domains

## Monitoring

### Performance Monitoring
- Use built-in telemetry dashboard at `/admin/telemetry`
- Monitor Core Web Vitals via Lighthouse CI

### Error Tracking
- Check console logs in production
- Review Supabase logs for backend errors
- Monitor rate limit events in telemetry

## Scaling Considerations

- Edge Functions auto-scale with traffic
- Database may need instance upgrade for high traffic
- Consider CDN for static assets
- Implement caching strategies for API responses
