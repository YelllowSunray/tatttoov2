# Quick GCP Setup Guide

Follow these steps to set up Google Cloud Platform (GCP) for Vertex AI image generation.

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top
3. Click **"New Project"**
4. Name it (e.g., "Tattoo Generator")
5. Click **"Create"**
6. **Copy your Project ID** (shown in the project dropdown after creation)

## Step 2: Enable Vertex AI API

1. In Google Cloud Console, go to **"APIs & Services"** > **"Library"**
2. Search for **"Vertex AI API"**
3. Click it and click **"Enable"**
4. Wait for it to enable (about 1 minute)

## Step 3: Create Service Account

1. Go to **"IAM & Admin"** > **"Service Accounts"**
2. Click **"Create Service Account"**
3. Fill in:
   - **Name**: `tattoo-generator` (or any name)
   - **Description**: "For tattoo image generation"
4. Click **"Create and Continue"**
5. Under **"Grant this service account access to project"**, add role:
   - Search for and select **"Vertex AI User"**
6. Click **"Continue"** then **"Done"**

## Step 4: Download Service Account Key

1. Click on the service account you just created
2. Go to **"Keys"** tab
3. Click **"Add Key"** > **"Create new key"**
4. Select **"JSON"**
5. Click **"Create"**
6. **Save the downloaded JSON file** somewhere safe (like your Downloads folder)

## Step 5: Convert JSON to .env.local Format

### Option A: Use the Helper Script (Easiest)

1. Copy your downloaded JSON file to your project folder (or note its path)
2. Run this command in your terminal:

```bash
node scripts/convert-gcp-credentials.js path/to/your-key.json
```

Replace `path/to/your-key.json` with the actual path to your downloaded JSON file.

Example:
```bash
node scripts/convert-gcp-credentials.js C:\Users\Me\Downloads\my-project-123456-abc123.json
```

3. The script will output the exact lines to copy into your `.env.local` file

### Option B: Manual Method

1. Open your downloaded JSON file in a text editor
2. Copy the entire contents
3. Go to an online JSON minifier like [jsonformatter.org/json-minify](https://jsonformatter.org/json-minify)
4. Paste your JSON and click "Minify"
5. Copy the minified (single-line) JSON
6. Find the `project_id` value in your JSON file

## Step 6: Update .env.local

Open your `.env.local` file and replace the placeholder lines with:

```env
GOOGLE_CLOUD_PROJECT_ID=your-actual-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_CLOUD_CREDENTIALS={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}
```

**Important:**
- Replace `your-actual-project-id` with your actual project ID from Step 1
- Replace the `GOOGLE_CLOUD_CREDENTIALS` value with your minified JSON (entire JSON on one line, no line breaks)
- Make sure there are **no spaces** around the `=` signs

## Step 7: Restart Your Server

1. Stop your development server (Ctrl+C)
2. Start it again:
   ```bash
   npm run dev
   ```

## Step 8: Test It!

Try generating a tattoo - Vertex AI should now work!

## Troubleshooting

### "Invalid credentials JSON format"
- Make sure the JSON is on a **single line** with no line breaks
- Use the helper script to convert it properly

### "Vertex AI authentication failed"
- Check that your service account has the **"Vertex AI User"** role
- Make sure Vertex AI API is enabled

### "Vertex AI model not found"
- Make sure Vertex AI API is enabled in your project
- Check that you're using the correct location (`us-central1`)

### Still having issues?
- Check the full guide: `VERTEX_AI_SETUP.md`
- Make sure you restarted your server after updating `.env.local`

