---
name: migrao-para-nuvem
description: Guia completo para migrar um projeto Lovable para infraestrutura própria em nuvem com backend, banco de dados e deploy independente.
---

# Lovable Cloud Migration

You are helping the user migrate their Lovable project to their own cloud infrastructure. This is a complete, production-ready migration.

## What This Skill Does
Guide the user through migrating from Lovable''s hosted environment to a self-hosted cloud setup with:
- Frontend: Vercel, Netlify, or Cloudflare Pages
- Backend: Supabase (keep existing) or migrate to Railway/Render
- Domain: Custom domain configuration
- CI/CD: GitHub Actions for automated deployments

## Migration Steps

### Step 1: Export from Lovable
1. In Lovable, go to Project Settings > Export
2. Download the full project as a ZIP or connect to GitHub
3. Verify the exported code includes: package.json, all source files, .env.example

### Step 2: Set Up GitHub Repository
1. Create a new private GitHub repository
2. Push the exported code: `git init && git add . && git commit -m "Initial export from Lovable" && git remote add origin <repo-url> && git push -u origin main`
3. Add .gitignore to exclude: .env, node_modules, .next, dist

### Step 3: Configure Environment Variables
1. Copy .env.example to .env
2. Fill in all required variables:
   - VITE_SUPABASE_URL (from Supabase dashboard)
   - VITE_SUPABASE_ANON_KEY (from Supabase dashboard)
   - Any API keys the project uses

### Step 4: Deploy Frontend
**Option A: Vercel (Recommended)**
1. Go to vercel.com, import GitHub repository
2. Set framework preset (Vite/React)
3. Add environment variables from Step 3
4. Deploy

**Option B: Netlify**
1. Go to netlify.com, connect GitHub repository
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add environment variables

### Step 5: Configure Custom Domain
1. Purchase domain (Namecheap, Cloudflare Registrar recommended)
2. In Vercel/Netlify: Add custom domain
3. Update DNS records at your registrar:
   - A record pointing to deployment IP
   - Or CNAME pointing to deployment URL
4. Wait 24-48h for DNS propagation

### Step 6: Update Supabase Settings
1. In Supabase > Authentication > URL Configuration:
   - Site URL: your new custom domain
   - Redirect URLs: add your new domain
2. In Supabase > API > CORS:
   - Add your new domain to allowed origins

### Step 7: Verify Deployment
- Test all authentication flows
- Test all database operations
- Test file uploads (if used)
- Check browser console for errors
- Test on mobile

## Common Issues
- **Auth not working**: Check Supabase allowed redirect URLs
- **API calls failing**: Check CORS settings in Supabase
- **Build failing**: Check environment variables are set correctly
- **Images not loading**: Check if using Supabase Storage URLs (update if needed)

Walk the user through each step and ask for confirmation before proceeding to the next.
