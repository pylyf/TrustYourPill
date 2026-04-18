# Trust Your Pill Backend

This backend is a TypeScript service scaffold for a medication awareness assistant.

## Current status

The project currently contains:

- a Fastify entrypoint
- a componentized folder layout
- implemented search, profile, health, user medication, medication check, medication support, and medication scan endpoints
- implemented a dedicated medication support endpoint
- openFDA medication profile retrieval with DailyMed fallback
- Supabase-backed medication evidence caching for profile lookups
- Supabase-backed check result persistence
- grounded medication check summaries with OpenAI support and deterministic fallback
- structured `sideEffectSignals` and `supportiveCareIdeas` in the medication check response
- a repeatable smoke test script for the main backend flow
- service, integration, repository, schema, and utility layers
- living backend API docs in `docs/api.md`

## Structure

The code is organized under `src/` by responsibility:

- `app/api`: route registration and request handlers
- `components/agents`: orchestration logic
- `components/services`: domain services
- `components/integrations`: external API clients
- `components/parsing`: evidence parsing and classification helpers
- `components/storage`: persistence repositories
- `components/schemas`: request and response validation
- `components/utils`: logging, tracing, retries, and helpers
- `components/config`: environment and constants

## Runtime env

The backend currently expects:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_PUBLISHABLE_KEY`
- optional: `OPENAI_API_KEY`
- optional: `OPENAI_MODEL`
- optional: `OPENAI_VISION_MODEL`
- optional: `OPENFDA_API_KEY`

Without an `OPENAI_API_KEY`, the medication check endpoint still works and returns a deterministic grounded `aiSummary`.

Blank env values are normalized to `undefined` internally so an empty secret does not override a usable fallback key.

## Next steps

1. Add normalization caching for RxNav lookups.
2. Harden reliability with stronger upstream timeout and circuit-breaker behavior.
3. Add deeper integration tests beyond the smoke flow.
4. Decide whether to expose check history and/or move to auth-aware user handling.

## Smoke test

Run the backend, then run:

```bash
npm run smoke
```

The smoke flow exercises:

- `GET /health`
- `GET /api/medications/search`
- `GET /api/medications/profile`
- `POST /api/users/:id/medications`
- `GET /api/users/:id/medications`
- `DELETE /api/users/:id/medications/:medId`
- `POST /api/medications/check`
- `POST /api/medications/support`

## Scan endpoint

The backend now also supports:

- `POST /api/medications/scan`

This endpoint accepts:

- `imageBase64DataUrl`
- or `imageUrl`

It uses OpenAI vision to extract visible medication packaging text, then maps that text to RxNav medication candidates for frontend confirmation.

## Documentation rule

When backend behavior changes, update the docs in the same pass.

At minimum keep these current:

- `backend instructions`
- `README.md`
- `docs/api.md`
- `TODO.md`
