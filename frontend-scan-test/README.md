# Frontend Scan Test

This is a small Expo web app for manually testing medication packaging uploads against the scan backend.

## What it does

- lets you upload a downloaded image file
- converts the file into a base64 data URL in the browser
- posts it to `POST /api/medications/scan`
- shows extracted packaging fields and RxNav candidates

## Run it

1. Start the scan backend in [backend-scan-prep](C:\Users\pylyf\Documents\TrustYourPill\backend-scan-prep) with an `OPENAI_API_KEY` configured.
2. In this folder, optionally copy `.env.example` to `.env` and change `EXPO_PUBLIC_SCAN_API_URL` if needed.
3. Run `npm run web`.

## Default backend URL

The app defaults to `http://localhost:3001`, which matches the current backend prep server port.

You can also change the backend URL directly in the UI during testing.

## API contract

The backend scan contract (request, response, statuses, and wiring flow) is documented in:

- [scan-api-contract.md](C:\Users\pylyf\Documents\TrustYourPill\backend-scan-prep\docs\scan-api-contract.md)
