# Replicate API Setup for Image Generation

Replicate is the **easiest** way to enable image generation - it only requires a simple API token!

## Step 1: Create a Replicate Account

1. Go to [Replicate](https://replicate.com/)
2. Click "Sign Up" (you can use GitHub, Google, or email)
3. Complete the signup process

## Step 2: Get Your API Token

1. Once logged in, click on your profile picture in the top right
2. Select **"API Tokens"** from the dropdown
3. Click **"Create token"**
4. Give it a name (e.g., "Tattoo Generator")
5. Copy the token immediately - it starts with `r8_...`

## Step 3: Add Token to Your Project

1. Open your `.env.local` file in the project root
2. Add the following line:

```
REPLICATE_API_TOKEN=r8_your_token_here
```

Replace `r8_your_token_here` with your actual token.

**Example `.env.local` file:**
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_key
# ... other Firebase config ...

# Replicate API for image generation (easiest option)
REPLICATE_API_TOKEN=r8_your_token_here
```

## Step 4: Restart Your Development Server

After adding the API token:

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

You should see a generated tattoo image!

## Pricing

Replicate has a **pay-as-you-go** pricing model:
- **Free tier**: $10 credit to start
- **Pay per image**: ~$0.002-0.01 per image (very affordable)
- **No monthly fees**: Only pay for what you use

## Troubleshooting

### "Replicate API token not configured"
- Make sure you added `REPLICATE_API_TOKEN` to your `.env.local` file
- Make sure there are no spaces around the `=` sign
- Make sure you restarted your development server after adding the key

### "Replicate prediction timed out"
- The model might be taking longer than expected
- Try again - sometimes models have queue times
- Check your Replicate account for any issues

### "Replicate API error: Insufficient credits"
- You've used up your free credits
- Add a payment method in your Replicate account
- Very affordable - images cost pennies

### Image generation still not working
- Check your browser console (F12) for error messages
- Check your server terminal for error messages
- Verify the token is correct by checking it in Replicate settings
- Make sure you have credits in your Replicate account

## Why Replicate?

✅ **Easiest setup** - Just one API token  
✅ **No complex configuration** - No GCP, no service accounts  
✅ **Reliable** - Uses proven Stable Diffusion models  
✅ **Affordable** - Pay only for what you use  
✅ **Fast** - Usually generates images in 5-15 seconds  
✅ **High quality** - Uses Stable Diffusion XL model  

## Alternative Services

If you prefer other options:

- **Vertex AI Imagen**: Requires Google Cloud setup (more complex)
- **Hugging Face**: Currently having API endpoint issues
- **OpenAI DALL-E**: Requires OpenAI API key (more expensive)

For most users, **Replicate is the best choice** - simple, reliable, and affordable!

