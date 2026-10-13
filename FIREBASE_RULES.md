# Firebase rules setup

This project uses the Firebase project `c-motau-profile` and its named Firestore database `myprofilewebapp`. The home page can read published profile data and download uploaded files. Only one configured Firebase Authentication account can edit profile data or upload/delete files.

## Configure the admin account

1. In Firebase Console, enable **Email/Password** under **Authentication → Sign-in method**. Create an email/password user under **Authentication → Users**.
2. Copy that user's UID from **Authentication → Users**. The `/admin` page also shows the UID when another account signs in.
3. The UID is already set in both `firestore.rules` and `storage.rules`. If the admin account changes, update both files.
4. The local `.env.local` already sets `VITE_FIREBASE_ADMIN_UID`. Set the same variable in the production build environment. Restart the dev server or rebuild after changing it.
5. Sign in at `/admin` with the same account. There is no public sign-up flow.

The UID is an identifier, not a password. The rules verify the signed-in Firebase Authentication token; changing the browser's `VITE_FIREBASE_ADMIN_UID` value cannot grant access.

The `VITE_FIREBASE_API_KEY` value must come from the Web app config in this same Firebase project (`c-motau-profile`). The local `.env.local` has been corrected; set the same key in the production build environment. A key from another project can sign in an account with the same email but a different UID, which will not match these rules.

If email sign-in returns `auth/invalid-credential`, check that the email is listed under **Authentication → Users** with **Email/Password** as its provider and that its UID matches the configured admin UID. Use **Reset password** on `/admin` if the password is unknown. Firebase may return the same error for an unknown email or wrong password when email enumeration protection is enabled.

## Deploy

Review the rules, then deploy them to the intended project:

```powershell
npx -y firebase-tools@latest login
npx -y firebase-tools@latest deploy --project c-motau-profile --only firestore:rules,storage
```

The Firestore configuration in `firebase.json` targets `myprofilewebapp`. Storage rules cannot read Firestore documents from a named database, so both rule files use the same admin UID directly.

The Storage rules allow public downloads only from the six upload folders used by the app. They limit documents to 25 MiB, project media to 250 MiB, and profile pictures to 10 MiB with image MIME types. They deny listing the bucket. The Firestore rules allow public reads only from the profile documents and five published collections used by the home page. All other client access is denied.

Deploying these rules replaces the project's current rules for the named Firestore database and Storage. Verify that the configured UID matches the intended account before deploying.
