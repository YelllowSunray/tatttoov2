# Vertex AI Image Generation Setup

This guide will help you set up Google Cloud Vertex AI for tattoo image generation using Imagen.

## What is Vertex AI?

Vertex AI is Google Cloud's AI platform that provides access to Google's Imagen model for high-quality image generation. It's a powerful alternative to Hugging Face and offers excellent image quality.

## Prerequisites

- A Google Cloud account (you can create one at [cloud.google.com](https://cloud.google.com))
- A Google Cloud project (or create a new one)
- Basic familiarity with Google Cloud Console

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click **"New Project"**
4. Enter a project name (e.g., "Tattoo Generator")
5. Click **"Create"**
6. Wait for the project to be created, then select it from the dropdown

## Step 2: Enable Vertex AI API

1. In the Google Cloud Console, go to **"APIs & Services"** > **"Library"**
2. Search for **"Vertex AI API"**
3. Click on it and click **"Enable"**
4. Wait for the API to be enabled (this may take a minute)

**Note**: You may also need to enable **"Imagen API"** if it's listed separately. Search for "Imagen" in the API library and enable it.

## Step 3: Create a Service Account

A service account is like a special user account that your app uses to access Google Cloud services.

1. In Google Cloud Console, go to **"IAM & Admin"** > **"Service Accounts"**
2. Click **"Create Service Account"**
3. Fill in the details:
   - **Service account name**: `tattoo-generator` (or any name you like)
   - **Service account ID**: Will auto-fill (you can change it if needed)
   - **Description**: "Service account for tattoo image generation"
4. Click **"Create and Continue"**
5. Under **"Grant this service account access to project"**, add the role:
   - **"Vertex AI User"** (search for it in the role dropdown)
6. Click **"Continue"** then **"Done"**

## Step 4: Create and Download Service Account Key

1. In the Service Accounts list, click on the service account you just created
2. Go to the **"Keys"** tab
3. Click **"Add Key"** > **"Create new key"**
4. Select **"JSON"** format
5. Click **"Create"**
6. A JSON file will download automatically - **save this file securely!** You'll need it in the next step.

**Important**: This JSON file contains sensitive credentials. Never commit it to Git or share it publicly.

## Step 5: Add Credentials to Your Project

1. Open your project folder in your code editor
2. Open or create the `.env.local` file in the root directory
3. Open the downloaded JSON file in a text editor
4. Copy the entire contents of the JSON file
5. In `.env.local`, add these lines:

```
GOOGLE_CLOUD_PROJECT_ID=your-project-id-here
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_CLOUD_CREDENTIALS={"type":"service_account","project_id":"your-project-id",...}
```

**Important Notes:**
- Replace `your-project-id-here` with your actual Google Cloud project ID (you can find it in the Google Cloud Console at the top)
- The `GOOGLE_CLOUD_CREDENTIALS` value should be the entire JSON file content as a single line (no line breaks)
- The location can be `us-central1`, `us-east1`, `europe-west1`, or `asia-northeast1` (use the one closest to you)

**Example `.env.local` file:**

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Vertex AI for image generation
GOOGLE_CLOUD_PROJECT_ID=tattoo-generator-123456
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_CLOUD_CREDENTIALS={"type":"service_account","project_id":"tattoo-generator-123456","private_key_id":"abc123...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"tattoo-generator@tattoo-generator-123456.iam.gserviceaccount.com","client_id":"123456789","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/tattoo-generator%40tattoo-generator-123456.iam.gserviceaccount.com"}
```

## Step 6: Convert JSON to Single Line (Important!)

The JSON credentials need to be on a single line in `.env.local`. Here's how:

**Option 1: Manual (Simple)**
- Copy the JSON file content
- Remove all line breaks and extra spaces
- Paste it as the value for `GOOGLE_CLOUD_CREDENTIALS`

**Option 2: Using a Tool**
- You can use an online JSON minifier to compress it to one line
- Or use this command in your terminal (if you have Node.js):
  ```bash
  node -e "console.log(JSON.stringify(require('./path-to-your-key.json')))"
  ```

## Step 7: Restart Your Development Server

After adding the credentials:

1. Stop your development server (press `Ctrl+C` in the terminal)
2. Start it again:
   ```bash
   npm run dev
   ```

**Important**: Environment variables are only loaded when the server starts, so you must restart after adding/changing them.

## Step 8: Test It Out

1. Go to your app and open your profile
2. Click on a saved filter set
3. Click **"Generate Tattoo"**
4. Enter a subject matter (e.g., "a dragon breathing fire")
5. Click **"Generate Tattoo"**

If everything is set up correctly, you should see a generated tattoo image from Vertex AI!

## Troubleshooting

### "Vertex AI project ID not configured"
- Make sure you added `GOOGLE_CLOUD_PROJECT_ID` to your `.env.local` file
- Make sure there are no spaces around the `=` sign
- Make sure you restarted your development server

### "Vertex AI credentials not configured"
- Make sure you added `GOOGLE_CLOUD_CREDENTIALS` to your `.env.local` file
- Make sure the JSON is on a single line (no line breaks)
- Make sure the JSON is valid (you can test it with an online JSON validator)

### "Invalid credentials JSON format"
- The JSON might have line breaks - it needs to be on a single line
- Check that you copied the entire JSON file content
- Make sure there are no extra quotes or characters

### "Vertex AI authentication failed"
- Check that your service account key file is correct
- Make sure the service account has the "Vertex AI User" role
- Verify that Vertex AI API is enabled in your project

### "Vertex AI model not found"
- Make sure Vertex AI API is enabled in your Google Cloud project
- Make sure Imagen API is enabled (if listed separately)
- Check that you're using the correct location (us-central1, etc.)

### "Vertex AI quota exceeded"
- Google Cloud has free tier limits
- Check your quotas in Google Cloud Console: **"IAM & Admin"** > **"Quotas"**
- You may need to request a quota increase for production use

### "Permission denied"
- Make sure your service account has the **"Vertex AI User"** role
- Go to **"IAM & Admin"** > **"Service Accounts"** and check the roles
- Add the role if it's missing

## Pricing

Vertex AI Imagen has a free tier, but charges apply after:
- **Free tier**: Usually includes some free requests per month
- **Paid tier**: Pay per image generated
- Check current pricing at [cloud.google.com/vertex-ai/pricing](https://cloud.google.com/vertex-ai/pricing)

**Tip**: Set up billing alerts in Google Cloud Console to avoid unexpected charges.

## Security Notes

- **Never commit `.env.local` to Git** - it's already in `.gitignore`
- **Never share your service account key JSON file** publicly
- **Never commit the service account key file** to your repository
- If your credentials are compromised:
  1. Go to Google Cloud Console > Service Accounts
  2. Delete the compromised key
  3. Create a new key
  4. Update your `.env.local` file

## Which Model is Used?

The app uses **Vertex AI Imagen** (`imagegeneration@006`):
- High-quality image generation
- Excellent results for tattoo designs
- Powered by Google's advanced AI models
- Requires Google Cloud project setup

## Comparison with Other Services

- **Vertex AI**: High quality, requires Google Cloud setup, pay-per-use
- **Hugging Face**: Free tier available, easier setup, may have rate limits
- **Gemini**: Text generation, not image generation

Vertex AI is a great choice if you want the highest quality images and don't mind the setup process!

