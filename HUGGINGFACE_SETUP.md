# Hugging Face Image Generation Setup

This guide will help you set up Hugging Face API for tattoo image generation.

## Step 1: Create a Hugging Face Account

1. Go to [Hugging Face](https://huggingface.co/)
2. Click "Sign Up" in the top right corner
3. Create an account (you can use email, Google, or GitHub)

## Step 2: Get Your API Token

1. Once logged in, click on your profile picture in the top right
2. Select **"Settings"** from the dropdown menu
3. In the left sidebar, click **"Access Tokens"**
4. Click **"New Token"** button
5. Fill in the form:
   - **Token name**: Give it a name like "Tattoo Generator" or "Image Generation"
   - **Type**: Select **"Read"** (this is enough for image generation)
   - **Expiration**: Choose your preference (or leave blank for no expiration)
6. Click **"Generate Token"**
7. **IMPORTANT**: Copy the token immediately - you won't be able to see it again!
   - It will look something like: `hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## Step 3: Add Token to Your Project

1. Open your project folder in your code editor
2. Create or open the `.env.local` file in the root directory
3. Add the following line:

```
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Replace `hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` with your actual token.

**Example `.env.local` file:**
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Hugging Face API for image generation
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Step 4: Restart Your Development Server

After adding the API key:

1. Stop your development server (press `Ctrl+C` in the terminal)
2. Start it again:
   ```bash
   npm run dev
   ```

**Important**: Environment variables are only loaded when the server starts, so you must restart after adding/changing them.

## Step 5: Test It Out

1. Go to your app and open your profile
2. Click on a saved filter set
3. Click **"Generate Tattoo"**
4. Enter a subject matter (e.g., "a woman dancing in the rain")
5. Click **"Generate Tattoo"**

If everything is set up correctly, you should see a generated tattoo image!

## Troubleshooting

### "Hugging Face API key not configured"
- Make sure you added `HUGGINGFACE_API_KEY` to your `.env.local` file
- Make sure there are no spaces around the `=` sign
- Make sure you restarted your development server after adding the key

### "Model is loading" error
- Some Hugging Face models need to "wake up" if they haven't been used recently
- Wait a minute and try again
- The model will stay active for a while after first use

### "Rate limit exceeded"
- Free Hugging Face accounts have rate limits
- Wait a few minutes and try again
- Consider upgrading to a paid plan for higher limits

### Image generation still not working
- Check your browser console (F12) for error messages
- Check your server terminal for error messages
- Make sure your API token has "Read" permissions
- Verify the token is correct by checking it in Hugging Face settings

## Which Models Are Used?

The app uses two Hugging Face models via the new router endpoint (`router.huggingface.co`):

1. **Primary**: `runwayml/stable-diffusion-v1-5` (requires API key)
   - High quality image generation
   - Better results for tattoo designs
   - Requires authentication
   - Uses the new router endpoint

2. **Fallback**: `stabilityai/stable-diffusion-2-1` (public, no key needed)
   - Used if primary fails
   - May have rate limits
   - Lower quality but still functional
   - Uses the new router endpoint

**Note**: Hugging Face has migrated from `api-inference.huggingface.co` to `router.huggingface.co`. The app uses the new endpoint automatically.

## Free Tier Limits

Hugging Face free tier includes:
- Limited requests per hour
- Some models may have queue times
- Generally sufficient for personal/testing use

For production use, consider upgrading to a paid plan for:
- Higher rate limits
- Priority access to models
- Better performance

## Security Notes

- **Never commit `.env.local` to Git** - it's already in `.gitignore`
- **Never share your API token** publicly
- If your token is compromised, revoke it in Hugging Face settings and create a new one

