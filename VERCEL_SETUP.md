# Vercel Deployment Setup

This guide will help you set up your tattoo app on Vercel with all the necessary environment variables.

## Step 1: Deploy to Vercel

1. Push your code to GitHub (if not already)
2. Go to [Vercel](https://vercel.com/)
3. Import your repository
4. Vercel will auto-detect Next.js and configure it

## Step 2: Add Environment Variables

After deploying, you need to add all your environment variables in Vercel:

1. Go to your project in Vercel Dashboard
2. Click on **Settings** → **Environment Variables**
3. Add each variable below:

### Firebase Configuration

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Image Generation APIs (Optional - add the ones you want to use)

**For Vertex AI (Google Cloud):**
```
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_CLOUD_CREDENTIALS={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}
```

**For Replicate:**
```
REPLICATE_API_TOKEN=r8_your_token_here
```

**For Hugging Face:**
```
HUGGINGFACE_API_KEY=hf_your_token_here
```

### Email Service (Optional)

**For Resend (inquiry emails):**
```
RESEND_API_KEY=re_your_api_key_here
```

## Step 3: Important Notes

### GOOGLE_CLOUD_CREDENTIALS Format

The `GOOGLE_CLOUD_CREDENTIALS` must be the **entire JSON file as a single line** (no line breaks).

**To convert your JSON key file:**
1. Open your downloaded JSON file
2. Copy all the content
3. Remove all line breaks and extra spaces
4. Paste it as the value in Vercel

**Or use this PowerShell command:**
```powershell
(Get-Content "path\to\your-key.json" -Raw) -replace "`r`n", "" -replace " ", ""
```

### Environment Variable Scope

When adding variables in Vercel, you can set them for:
- **Production** - Your live site
- **Preview** - Pull request previews
- **Development** - Local development (usually not needed)

Make sure to add them for **Production** at minimum.

## Step 4: Redeploy

After adding environment variables:

1. Go to **Deployments** tab
2. Click the **⋯** menu on your latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger a new deployment

**Important**: Environment variables are only loaded when the app builds, so you must redeploy after adding/changing them.

## Step 5: Verify Deployment

1. Check the deployment logs for any errors
2. Test your API routes:
   - `/api/generate-tattoo` - Should work if Vertex AI/Replicate/Hugging Face is configured
   - `/api/inquiry` - Should work if Resend is configured
3. Check the browser console for any errors

## Troubleshooting

### 404 NOT_FOUND Error

If you're getting 404 errors on Vercel:

1. **Check Build Logs**: Go to your deployment → **Build Logs** tab
   - Look for any build errors
   - Check if all dependencies installed correctly

2. **Check Environment Variables**: 
   - Make sure all required variables are set
   - Verify they're set for the correct environment (Production/Preview)

3. **Check API Routes**:
   - Make sure `app/api/` routes exist
   - Verify the route file exports the correct HTTP methods (GET, POST, etc.)

4. **Check Next.js Version**:
   - Make sure you're using a compatible Next.js version
   - Check `package.json` for the version

### Build Errors

If the build fails:

1. **Check Dependencies**: Make sure all packages in `package.json` are compatible
2. **Check TypeScript Errors**: Run `npm run build` locally to see errors
3. **Check Node Version**: Vercel should auto-detect, but you can set it in `package.json`:
   ```json
   "engines": {
     "node": "18.x"
   }
   ```

### API Route Not Found

If specific API routes return 404:

1. **Check File Structure**: Make sure routes are in `app/api/[route-name]/route.ts`
2. **Check Exports**: Make sure the route file exports the HTTP method (e.g., `export async function POST`)
3. **Check Vercel Logs**: Go to **Functions** tab to see if the route is being detected

### Environment Variables Not Working

1. **Redeploy**: Environment variables only load on build
2. **Check Variable Names**: Make sure they match exactly (case-sensitive)
3. **Check JSON Format**: For `GOOGLE_CLOUD_CREDENTIALS`, make sure it's valid JSON on one line
4. **Check Scope**: Make sure variables are set for the right environment

## Quick Checklist

- [ ] All Firebase environment variables added
- [ ] Image generation API keys added (at least one: Vertex AI, Replicate, or Hugging Face)
- [ ] `GOOGLE_CLOUD_CREDENTIALS` is valid JSON on a single line
- [ ] Environment variables set for Production
- [ ] Redeployed after adding variables
- [ ] Build completed successfully
- [ ] Tested API routes

## Need Help?

- Check Vercel deployment logs
- Check browser console for client-side errors
- Check Vercel function logs for API errors
- Verify all environment variables are set correctly


