# Trust Your Pill Backend

This backend is a TypeScript service scaffold for a medication awareness assistant.

## Current status

The project currently contains:

- a Fastify entrypoint
- a componentized folder layout
- implemented search, profile, health, and user medication endpoints
- an isolated packaging scan prototype endpoint that extracts label text with OpenAI and matches it with RxNav
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

## Next steps

1. Install dependencies with `npm install`.
2. Implement environment loading and server bootstrap checks.
3. Build RxNav search and normalization.
4. Add Supabase persistence.
5. Add openFDA retrieval and the medication check workflow.
6. Move the packaging scan endpoint back into the main backend once the parallel backend work is settled.

## Documentation rule

When backend behavior changes, update the docs in the same pass.

At minimum keep these current:

- `backend instructions`
- `README.md`
- `docs/api.md`

For the scan endpoint contract used by frontend wiring, see:

- `docs/scan-api-contract.md`

## Scan setup

For the packaging scan endpoint, create a `.env` file with at least:

```env
NODE_ENV=development
PORT=3001
BODY_LIMIT_MB=12
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_VISION_MODEL=gpt-5.4-mini
```

If a large image upload still fails, either use a smaller image or increase `BODY_LIMIT_MB`.
