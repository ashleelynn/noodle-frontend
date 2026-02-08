# Vercel Deployment Guide

## ✅ Build Status

The TypeScript error has been fixed! The app now builds successfully locally:

```bash
npm run build
# ✓ built in 736ms
```

## Vercel Configuration

I've created a `vercel.json` file with the correct settings:
- Build command: `npm run build`
- Output directory: `dist`
- Framework: Vite
- SPA rewrites configured

## Environment Variables Required

### Frontend (Vercel)

Your frontend needs this environment variable in Vercel dashboard:

1. Go to your Vercel project → Settings → Environment Variables
2. Add:
   ```
   VITE_API_URL=https://your-backend-url.com
   ```
   Replace `your-backend-url.com` with your actual backend URL (e.g., Railway, Render, or another backend host)

### Backend (wherever it's hosted)

Make sure your backend has these environment variables:
```
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_AGENT_ID=your_agent_id
GEMINI_API_KEY=your_gemini_api_key
SECRET_KEY=your_jwt_secret_key
```

## Common Vercel Deployment Issues

### 1. **"Build failed" error**

**Solution:** The local build now works, so try these:
- Clear Vercel build cache: Settings → General → Clear Build Cache
- Redeploy from Vercel dashboard
- Check Node version (should be 18.x or higher)

### 2. **"Page not found" on routes**

**Solution:** ✅ Already fixed with `vercel.json` rewrites
- The rewrites configuration ensures all routes go to index.html (SPA behavior)

### 3. **API calls fail (CORS or 404)**

**Solutions:**
- Set `VITE_API_URL` environment variable in Vercel
- Ensure backend CORS allows your Vercel domain:
  ```python
  # In backend main.py
  app.add_middleware(
      CORSMiddleware,
      allow_origins=[
          "http://localhost:3000",
          "http://localhost:5173",
          "https://your-vercel-domain.vercel.app",  # ← Add this
      ],
      allow_credentials=True,
      allow_methods=["*"],
      allow_headers=["*"],
  )
  ```

### 4. **Build succeeds but page is blank**

**Solutions:**
- Check browser console for errors (F12)
- Verify `VITE_API_URL` is set in Vercel
- Check if API backend is running and accessible

### 5. **TypeScript errors during build**

**Status:** ✅ Fixed! The build now passes with no TypeScript errors.

## Deployment Steps

### 1. Connect to Vercel

If not already connected:
```bash
# Install Vercel CLI
npm i -g vercel

# Login and deploy
cd "/Users/ashleechae/art buddy"
vercel
```

### 2. Configure Environment Variables

In Vercel dashboard:
1. Go to your project
2. Settings → Environment Variables
3. Add `VITE_API_URL` with your backend URL
4. Redeploy

### 3. Deploy

```bash
# Deploy to production
vercel --prod
```

Or push to your connected Git repository (GitHub, GitLab, Bitbucket) and Vercel will auto-deploy.

## Verify Deployment

After deploying, check:

1. ✅ **Build logs**: Should show "✓ built in XXXms"
2. ✅ **Homepage loads**: Visit your Vercel URL
3. ✅ **Console logs**: Open browser console (F12), should see no errors
4. ✅ **Backend connection**: Try logging in, should connect to your API

## Debugging Production Issues

### Check Browser Console

Visit your deployed site and open console (F12):
- Look for `[TTS]` and `[ElevenLabs Agent]` logs
- Check for CORS errors
- Check for API connection errors

### Check Network Tab

1. Open DevTools → Network tab
2. Try an action (login, draw, etc.)
3. Look for failed requests (red)
4. Check request URLs - should point to your backend

### Common Console Errors

**Error:** `Failed to fetch` or `Network error`
- **Fix:** Check `VITE_API_URL` is set correctly

**Error:** `CORS policy blocked`
- **Fix:** Add your Vercel domain to backend CORS whitelist

**Error:** `401 Unauthorized`
- **Fix:** Authentication working correctly, user needs to login

## Testing Locally with Production Build

Before deploying, test the production build locally:

```bash
# Build
npm run build

# Preview production build
npm run preview
```

Then visit http://localhost:4173 and verify everything works.

## Need Help?

1. Check Vercel deployment logs in dashboard
2. Check browser console for frontend errors
3. Check backend logs for API errors
4. Compare with local working version

The build is fixed and ready to deploy! 🚀
