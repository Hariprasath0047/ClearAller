# ClearAller Vision Run Guide

This guide is for running and checking the full project locally.

## What is already verified

The following commands were checked successfully in this workspace:

- Root lint: `npm.cmd run lint`
- Root build: `npm.cmd run build`
- Root test: `npm.cmd run test`
- Backend lint/build: `npm.cmd run lint --workspace backend`, `npm.cmd run build --workspace backend`
- Frontend lint/build: `npm.cmd run lint --workspace frontend`, `npm.cmd run build --workspace frontend`
- Shared build: `npm.cmd run build --workspace shared`

Notes:

- There are currently no automated test files in `backend` or `frontend`, so the test commands exit cleanly with `No test files found, exiting with code 0`.
- The frontend was rebuilt into a mobile-first flow based on the provided Figma screens.

## Project structure

- `frontend/`: React + Vite mobile-style UI
- `backend/`: Fastify + Prisma API
- `shared/`: shared TypeScript types and utilities
- `ml/`: optional ML assets/scripts

## 1. Environment setup

### Backend

Copy:

- `backend/.env.example` -> `backend/.env`

Required values:

- `DATABASE_URL`
- `PORT`
- `SARVAM_API_KEY` if you want chat replies enabled

Optional:

- `SARVAM_CHAT_MODEL`
- `ML_PYTHON_PATH`

Important:

- The backend now expects `SARVAM_API_KEY`, not the older OpenAI key names.

### Frontend

Copy:

- `frontend/.env.example` -> `frontend/.env`

Default:

- `VITE_API_URL="http://localhost:4000"`

If you use the Vite proxy in dev, the default setup is already fine.

## 2. Database setup

This project uses PostgreSQL through Prisma.

Steps:

1. Create a PostgreSQL database.
2. Put the database connection string into `backend/.env` as `DATABASE_URL`.
3. Run:

```powershell
npm.cmd run prisma:generate --workspace backend
npm.cmd run prisma:migrate --workspace backend -- --name init
```

If you already have the schema applied, just run `prisma:generate`.

## 3. Install dependencies

From the project root:

```powershell
npm.cmd install
```

## 4. Run the app in development

From the project root:

```powershell
npm.cmd run dev
```

This starts:

- Backend on `http://localhost:4000`
- Frontend on `http://localhost:5173`

## 5. What to check in the app

### Auth flow

- Open the frontend.
- You should see the mobile-style welcome screen first.
- Tap `Start`.
- Login screen should open.
- Demo login works against `/api/account/demo`.
- Signup works against `/api/account`.

### Mobile screens

Bottom navigation should switch between:

- Home
- Upload & Detect
- Search
- Chat
- Profile

### Profile flow

- Create a profile
- Edit a profile
- Delete a profile
- Confirm profile changes show up in the profile list and dashboard stats

### Upload & Detect flow

- Upload an image or use camera capture
- OCR text should appear in the textarea
- Click `Analyze`
- Results screen should open

### Search flow

- Search products using selected profiles
- Switch between `Food` and `cosmetics`

### Chat flow

- Chat works only if `SARVAM_API_KEY` is set
- Without it, the UI should still load and the backend will return a clear configuration message

## 6. Verify commands manually

### Lint

```powershell
npm.cmd run lint
```

### Build

```powershell
npm.cmd run build
```

### Test

```powershell
npm.cmd run test
```

## 7. Production frontend build output

After build, the frontend production files are generated in:

- `frontend/dist/`

## 8. APK note

This repository is still a web app, not an Android project yet.

The UI is now mobile-first and suitable for wrapping as an APK later, but to generate an actual APK you still need a mobile packaging step such as:

- Capacitor
- Cordova
- Android WebView wrapper

If you want, the next step can be converting this frontend into a Capacitor Android app so you can build an APK.
