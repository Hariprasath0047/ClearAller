# Free Deployment And Mobile Build Guide

This project is now prepared for a free-first deployment:

- Backend: Render free web service
- Database: Supabase free Postgres
- Android/iOS wrapper: Capacitor

## 1. Create The Free Database

1. Create a free Supabase project.
2. Copy the project Postgres connection string.
3. Keep it private. It will be used as `DATABASE_URL` on Render.

## 2. Deploy The Backend On Render

1. Push this `Project` folder to GitHub.
2. In Render, choose **New > Blueprint**.
3. Select the GitHub repo.
4. Render will read `render.yaml`.
5. Add these secret environment variables when Render asks:

```txt
DATABASE_URL=your_supabase_postgres_connection_string
SARVAM_API_KEY=your_sarvam_key_or_leave_blank_if_chat_is_not_needed
```

6. Deploy.
7. After deployment, test:

```txt
https://clearaller-vision-api.onrender.com/health
```

If Render gives the service a different URL, use that URL in the frontend production env file.

## 3. Connect The App To The Deployed Backend

Create `frontend/.env.production` from `frontend/.env.production.example` and set:

```txt
VITE_API_URL="https://your-render-backend-url.onrender.com"
```

Then build:

```powershell
npm.cmd run build --workspace frontend
```

## 4. Build An Android APK/AAB With Capacitor

Install the new mobile dependencies:

```powershell
npm.cmd install
```

Create the Android project once:

```powershell
npm.cmd run mobile:add:android --workspace frontend
```

Sync the latest web build into Android:

```powershell
npm.cmd run mobile:sync --workspace frontend
```

Open Android Studio:

```powershell
npm.cmd run mobile:open:android --workspace frontend
```

From Android Studio:

- For testing: build an APK.
- For Play Store: build a signed AAB.

## 5. iOS Build

iOS builds require macOS and Xcode.

```bash
npm run mobile:add:ios --workspace frontend
npm run mobile:sync --workspace frontend
npm run mobile:open:ios --workspace frontend
```

Apple App Store publishing requires a paid Apple Developer account.

## 6. Play Store Reality

Backend hosting and database can start free. Direct APK sharing can be free.

Google Play Store publishing is not fully free because Google requires a one-time Play Console registration fee.
