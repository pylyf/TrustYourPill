# TrustYourPill

TrustYourPill is a hackathon project that helps users manage medications, check potential interaction risks, log symptoms, and explore supplement suggestions.

## Repository Layout

- `frontend/TrustYourPill/` - Main Expo React Native app (mobile + web)
- `backend/` - Fastify TypeScript API and medication analysis services

## Core Features

- Add and manage medications in a personal library
- Track daily doses (taken/not taken)
- Interaction and side-effect signal analysis
- Symptom check-in flow with possible medication-link insights
- Supplement recommendations with source lookups and caching

## Tech Stack

### Frontend

- Expo (React Native + TypeScript)
- Lucide React Native icons
- `expo-linear-gradient`, `expo-blur`
- Geist fonts (`@expo-google-fonts/geist`)

### Backend

- Fastify + TypeScript (ESM)
- Supabase (storage, cache, logs)
- OpenAI Responses API
- Integrations: RxNav, DailyMed, openFDA

## Prerequisites

- Node.js 18+
- npm 9+
- Supabase project and credentials
- OpenAI API key

## Quick Start

### 1) Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend/TrustYourPill
npm install
```

### 2) Configure environment variables

Create environment files as needed:

- Backend: `backend/.env`
- Frontend: `frontend/TrustYourPill/.env` (if required by your setup)

Typical backend values include:

- `OPENAI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` (or service role key for server-side ops where appropriate)
- `PORT` (default used by project is typically `3001`)

### 3) Run backend

```bash
cd backend
npm run dev
```

### 4) Run frontend

```bash
cd frontend/TrustYourPill
npm run start
# or
npm run web
```


## Useful Paths

- Backend entry: `backend/src/server.ts`
- Route registration: `backend/src/app/api/register-routes.ts`
- Frontend entry: `frontend/TrustYourPill/App.tsx`
- Symptoms screen: `frontend/TrustYourPill/screens/SymptomsScreen.tsx`
- Analysis screen: `frontend/TrustYourPill/screens/AnalysisScreen.tsx`

## Scripts (Common)

### Backend

```bash
npm run dev
npm run build
npm run start
```

### Frontend

```bash
npm run start
npm run web
npm run android
npm run ios
```

## Current Demo Medication Set (Example)

A practical showcase set often used in this project:

- Tylenol (acetaminophen)
- Ibuprofen
- Lexapro (escitalopram)
- Ozempic (semaglutide)

To demonstrate stronger interaction warnings, add:

- Warfarin (Coumadin/Jantoven)

## Design Direction (Frontend)

- Light mode only
- Soft, clean, healthcare-friendly UI
- Pastel gradient cards and rounded surfaces
- Geist typography

