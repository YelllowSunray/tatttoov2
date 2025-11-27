# Firebase Storage Security Rules Setup

## Quick Fix: Copy these rules to Firebase Console

1. Go to [Firebase Console - Storage Rules](https://console.firebase.google.com/project/tatttoo-b78f3/storage/rules)

2. Replace the existing rules with the rules from `storage.rules` file:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Tattoo images - artists can upload to their own folder
    match /tattoos/{userId}/{allPaths=**} {
      // Anyone authenticated can read tattoo images
      allow read: if request.auth != null;
      // Users can only write (upload/delete) to their own folder
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Click "Publish"

## What these rules do:

- **Read access**: All authenticated users can view tattoo images
- **Write access**: Users can only upload/delete images in their own folder (`tattoos/{userId}/...`)
- **Security**: Prevents users from accessing or modifying other users' images

## Troubleshooting

If you still get permission errors after updating rules:

1. **Make sure Storage is enabled**:
   - Go to [Firebase Console - Storage](https://console.firebase.google.com/project/tatttoo-b78f3/storage)
   - If you see "Get started", click it and start in "test mode" initially

2. **Wait a few seconds** after publishing rules (they may take a moment to propagate)

3. **Hard refresh your browser** (Ctrl+Shift+R or Cmd+Shift+R)

4. **Check that you're signed in** - The rules require authentication

5. **Verify the path matches** - The error shows the path should match `tattoos/{userId}/...`

## Test Mode (Development Only)

If you want to allow all authenticated users to upload anywhere for testing:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

⚠️ **Warning**: Test mode rules are NOT secure for production!


