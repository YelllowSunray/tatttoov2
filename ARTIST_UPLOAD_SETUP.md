# Artist Upload System - Setup Guide

## What Was Added

### 1. **Enhanced Tattoo Data Model**
- **Price**: Tattoo pricing in euros
- **Location**: Where the tattoo was done (can differ from artist location)
- **Description**: Detailed description of the tattoo
- **Body Part**: Placement (Arm, Leg, Back, Chest, etc.)
- **Color**: Boolean for color vs black & white
- **Size**: Size category or dimensions
- **Style & Tags**: Categorization for discovery

### 2. **Artist Profile System**
- Artists can create/update their profile
- Profile includes: name, location, bio, Instagram, website, email, phone
- Profile is linked to Firebase Auth user ID for verification

### 3. **Upload System**
- **Image Upload**: Firebase Storage integration for tattoo images
- **Upload Form**: Comprehensive form with all tattoo details
- **Image Preview**: Preview before uploading
- **Validation**: File type and size validation (10MB limit)

### 4. **Artist Dashboard** ("My Studio" tab)
- View all uploaded tattoos
- Upload new tattoos
- Edit artist profile
- Delete tattoos
- Manage portfolio

### 5. **Security Rules**
- Artists can only create/update/delete their own tattoos
- Artist profiles are user-specific
- All operations require authentication

## How to Use

### For Artists:

1. **Sign up/Login** with email and password
2. **Go to "My Studio"** tab
3. **Set up Artist Profile** (first time only):
   - Enter your name, location, bio
   - Add Instagram, website, contact info
4. **Upload Tattoos**:
   - Click "Upload Tattoo" button
   - Select image (JPG, PNG, etc. - max 10MB)
   - Fill in details:
     - Description
     - Price (optional)
     - Location (where tattoo was done)
     - Style, tags, body part, size
     - Color or black & white
   - Click "Upload Tattoo"

### Additional Fields You Might Want:

The system includes common fields, but you might also consider:
- **Duration**: How long the tattoo took
- **Healing time**: Days to heal
- **Pain level**: 1-10 scale
- **Sessions**: Number of sessions required
- **Availability**: Whether artist is accepting new clients
- **Portfolio link**: External portfolio URL
- **Specializations**: Array of tattoo styles they specialize in

## Firebase Storage Setup

Make sure Firebase Storage is enabled:

1. Go to [Firebase Console - Storage](https://console.firebase.google.com/project/tatttoo-b78f3/storage)
2. Click "Get started"
3. Start in "test mode" for development
4. Set up security rules (see Storage Rules below)

## Storage Security Rules

Go to Firebase Console → Storage → Rules and add:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Tattoo images - artists can upload to their own folder
    match /tattoos/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Firestore Rules Update

The `firestore.rules` file has been updated to allow:
- Artists to create/update their own profiles
- Artists to create/update/delete their own tattoos
- Users to read all artists and tattoos

**Important**: Copy the updated rules from `firestore.rules` to Firebase Console!

## Troubleshooting

**"Please set up your artist profile first"**
- You need to create an artist profile before uploading tattoos
- Go to "My Studio" tab and fill out the profile form

**"Missing or insufficient permissions"**
- Make sure Firestore rules are updated in Firebase Console
- Make sure Storage rules are set up
- Wait a few seconds after publishing rules (they take time to propagate)

**Image upload fails**
- Check file size (must be under 10MB)
- Check file type (must be an image)
- Make sure Storage is enabled in Firebase Console


