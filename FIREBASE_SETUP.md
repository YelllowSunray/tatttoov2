# Environment Variables

Copy this file to `.env.local` and fill in your Firebase configuration values.

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Getting Your Firebase Config

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Click on the gear icon next to "Project Overview" and select "Project settings"
4. Scroll down to "Your apps" section
5. Click on the web icon (`</>`) to add a web app
6. Copy the config values from the `firebaseConfig` object

## Setting Up Firestore Database

1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Start in "test mode" for development (you can set up security rules later)
4. Create the following collections:

### Collections Structure:

**artists** (collection)
- Document ID: auto-generated or custom
- Fields:
  - `name` (string): Artist name
  - `location` (string): City/location in Netherlands
  - `bio` (string, optional): Artist biography
  - `instagram` (string, optional): Instagram handle/URL
  - `website` (string, optional): Website URL

**tattoos** (collection)
- Document ID: auto-generated or custom
- Fields:
  - `artistId` (string): Reference to artist document ID
  - `imageUrl` (string): URL to tattoo image (can be Firebase Storage URL or external URL)
  - `description` (string, optional): Description of the tattoo
  - `style` (string, optional): Tattoo style
  - `tags` (array, optional): Array of tags

**likes** (collection)
- Document ID: userId (auto-generated per user)
- Fields:
  - `likes` (array): Array of objects with `{ tattooId: string, timestamp: number }`
  - `updatedAt` (timestamp): Last update timestamp

## Firebase Storage (Optional)

If you want to upload images directly to Firebase Storage:
1. Go to "Storage" in Firebase Console
2. Click "Get started"
3. Start in "test mode" for development
4. Upload your tattoo images and copy the public URLs


