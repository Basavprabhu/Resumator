# Firestore Security Rules for Resumator

Add these rules to your Firebase Console -> Firestore Database -> Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users can read/write their own resumes (max 2 per user)
    match /resumes/{resumeId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
                      request.auth.uid == request.resource.data.userId &&
                      // Note: Firestore rules can't easily count existing docs, so we rely on client-side validation
                      // The actual limit enforcement is done in the application code
                      true;
    }
    
    // Anyone can submit feedback (anonymous feedback allowed)
    match /feedback/{feedbackId} {
      allow create: if true;
      allow read: if false; // Only admins can read feedback
    }
    
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Collections Structure:

### Resumes Collection (`/resumes/{resumeId}`)
- `userId`: string (required)
- `name`: string
- `title`: string
- `templateId`: string
- `resumeData`: object
- `createdAt`: timestamp
- `updatedAt`: timestamp

### Feedback Collection (`/feedback/{feedbackId}`)
- `rating`: number (1-5)
- `message`: string (required)
- `email`: string (optional)
- `timestamp`: timestamp (server timestamp)

## Setup Instructions:

1. Go to Firebase Console
2. Navigate to Firestore Database
3. Click on "Rules" tab
4. Replace existing rules with the above rules
5. Click "Publish" 