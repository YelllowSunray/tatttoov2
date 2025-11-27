# Firestore Security Rules Setup

## Quick Fix: Copy these rules to Firebase Console

1. Go to [Firebase Console - Firestore Rules](https://console.firebase.google.com/project/tatttoo-b78f3/firestore/rules)

2. Replace the existing rules with the rules from `firestore.rules` file

3. Click "Publish"

## What these rules do:

- **Artists & Tattoos**: Authenticated users can read, but only admins can write (writes disabled for now)
- **Likes**: Users can only read and write their own likes (using their Firebase Auth UID)

## Alternative: Test Mode (Development Only)

If you want to allow all reads/writes for development:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

⚠️ **Warning**: Test mode rules are NOT secure for production. Only use for development!

## Production Rules Explained

The production rules ensure:
- ✅ Only authenticated users can access data
- ✅ Users can only modify their own likes
- ✅ Artists and tattoos are read-only for regular users
- ✅ Prevents unauthorized data access

## Troubleshooting

If you still get permission errors after updating rules:
1. Make sure you're logged in (check authentication status)
2. Wait a few seconds after publishing rules (they may take a moment to propagate)
3. Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
4. Check that Email/Password authentication is enabled in Firebase Console


