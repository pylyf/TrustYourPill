# Backend API Docs

This file is the living contract for the backend.

Rule:

- update this file whenever an endpoint is added, removed, or its request/response shape changes
- each endpoint section must stay explicit about what it accepts and what it returns

## Status Summary

### Implemented

- `GET /health`
- `GET /api/medications/search?q=`
- `GET /api/medications/profile?name=`
- `POST /api/medications/check`
- `GET /api/users/:id/medications`
- `POST /api/users/:id/medications`
- `DELETE /api/users/:id/medications/:medId`

### Stubbed

- none

## `GET /health`

Purpose:

- basic liveness and runtime metadata

Response:

```json
{
  "status": "ok",
  "service": "trust-your-pill-backend",
  "environment": "development",
  "timestamp": "2026-04-18T08:52:39.197Z",
  "uptimeSeconds": 3,
  "requestId": "req-1",
  "traceId": "example-trace-id"
}
```

## `GET /api/medications/search?q=`

Purpose:

- search medications through RxNav approximate search

Query params:

- `q`: medication search text

Response:

```json
{
  "query": "ibuprofen",
  "candidateCount": 2,
  "candidates": [
    {
      "rxcui": "5640",
      "rxaui": "12254458",
      "displayName": "ibuprofen",
      "normalizedName": "ibuprofen",
      "confidenceScore": 11.226275444030762,
      "rank": 1,
      "source": "RXNORM"
    }
  ]
}
```

Notes:

- this endpoint currently uses RxNav `approximateTerm`
- the frontend should use the selected candidate from this response when saving a medication to a user list

## `GET /api/medications/profile?name=`

Purpose:

- normalize a medication input
- fetch grounded official label evidence from openFDA
- return the core label sections for display and future interaction logic

Query params:

- `name`: medication search text

Current lookup order:

1. normalize input with RxNav approximate search
2. search openFDA by `openfda.rxcui`
3. fallback to `openfda.generic_name`
4. fallback to `openfda.substance_name`
5. fallback to `openfda.brand_name`
6. if openFDA is missing or too thin, fallback to DailyMed by `rxcui`

Response:

```json
{
  "input": "warfarin",
  "normalizedMedication": {
    "input": "warfarin",
    "normalizedName": "warfarin",
    "rxcui": "11289",
    "rxaui": "12253984",
    "source": "RXNORM",
    "searchScore": 12.666421890258789
  },
  "evidenceSource": {
    "source": "openfda",
    "queryStrategy": "openfda.generic_name",
    "splId": "b8c33971-54b3-4971-bf7f-1bec66999a29",
    "splSetId": "0cbce382-9c88-4f58-ae0f-532a841e8f95",
    "brandNames": ["Warfarin Sodium"],
    "genericNames": ["WARFARIN SODIUM"],
    "substanceNames": ["WARFARIN SODIUM"],
    "manufacturerNames": ["Teva Pharmaceuticals USA, Inc."],
    "productTypes": ["HUMAN PRESCRIPTION DRUG"],
    "routes": ["ORAL"],
    "effectiveTime": "20250617"
  },
  "sectionCount": 4,
  "sections": [
    {
      "name": "boxed_warning",
      "title": "Boxed Warning",
      "excerpt": "WARNING: BLEEDING RISK Warfarin sodium can cause major or fatal bleeding...",
      "fullText": "WARNING: BLEEDING RISK Warfarin sodium can cause major or fatal bleeding..."
    }
  ]
}
```

Current extracted sections:

- `boxed_warning`
- `contraindications`
- `drug_interactions`
- `drug_and_or_laboratory_test_interactions`
- `warnings`
- `ask_doctor_or_pharmacist`
- `adverse_reactions`

Current behavior notes:

- openFDA `rxcui` lookups do not always return a usable record for ingredient-level queries, so name-based fallbacks are important
- the endpoint currently returns the first matching openFDA label record that yields extracted sections
- current “too thin” rule: if openFDA yields fewer than 2 extracted sections, the backend tries DailyMed
- DailyMed fallback currently resolves the most recent SPL from `/spls.json?rxcui=...` and fetches the XML label by `setid`
- DailyMed-backed responses use:
  - `evidenceSource.source = "dailymed"`
  - `evidenceSource.queryStrategy = "dailymed.rxcui"`
- example successful fallback: `GET /api/medications/profile?name=aleve`
- some brand-style lookups can still end in `404` if neither openFDA nor the chosen DailyMed SPL yields usable mapped sections
- the endpoint now caches parsed profile evidence internally by normalized `rxcui` for 7 days
- cache is internal only; it does not change the request shape or response shape

## `GET /api/users/:id/medications`

Purpose:

- list one user's saved medications from Supabase

Path params:

- `id`: user identifier string

Response:

```json
{
  "userId": "demo-user",
  "count": 1,
  "medications": [
    {
      "id": "uuid",
      "userId": "demo-user",
      "inputName": "ibuprofen",
      "displayName": "ibuprofen",
      "normalizedName": "ibuprofen",
      "rxcui": "5640",
      "rxaui": "12254458",
      "source": "RXNORM",
      "searchScore": 11.226275444030762,
      "createdAt": "2026-04-18T09:00:00.000Z"
    }
  ]
}
```

## `POST /api/users/:id/medications`

Purpose:

- save a normalized medication selection for a user

Path params:

- `id`: user identifier string

Request body:

```json
{
  "inputName": "ibuprofen",
  "displayName": "ibuprofen",
  "normalizedName": "ibuprofen",
  "rxcui": "5640",
  "rxaui": "12254458",
  "source": "RXNORM",
  "searchScore": 11.226275444030762
}
```

Response:

```json
{
  "medication": {
    "id": "uuid",
    "userId": "demo-user",
    "inputName": "ibuprofen",
    "displayName": "ibuprofen",
    "normalizedName": "ibuprofen",
    "rxcui": "5640",
    "rxaui": "12254458",
    "source": "RXNORM",
    "searchScore": 11.226275444030762,
    "createdAt": "2026-04-18T09:00:00.000Z"
  }
}
```

Notes:

- this endpoint expects a medication already chosen from the search endpoint
- the database currently enforces one row per `userId + rxcui`

## `DELETE /api/users/:id/medications/:medId`

Purpose:

- remove one saved medication from a user's list

Path params:

- `id`: user identifier string
- `medId`: medication row id

Response:

```json
{
  "deleted": true,
  "medicationId": "uuid",
  "userId": "demo-user"
}
```

## `POST /api/medications/check`

Purpose:

- compare a candidate medication against the user's current medications
- use grounded label evidence already available through the medication profile pipeline
- return a conservative structured result plus a grounded user-facing summary layer

Accepts:

```json
{
  "candidateMedication": "ibuprofen",
  "currentMedications": ["warfarin", "aspirin"]
}
```

Returns:

```json
{
  "candidateMedication": {
    "input": "ibuprofen",
    "normalizedName": "ibuprofen",
    "rxcui": "5640"
  },
  "currentMedications": [
    {
      "input": "warfarin",
      "normalizedName": "warfarin",
      "rxcui": "11289"
    }
  ],
  "evidence": [
    {
      "type": "explicit_label_interaction",
      "source": "openfda",
      "section": "drug_interactions",
      "foundInMedication": "warfarin",
      "medication": "ibuprofen",
      "excerpt": "7 DRUG INTERACTIONS Concomitant use of drugs that increase bleeding risk...",
      "reason": "The drug_interactions section mentions ibuprofen."
    }
  ],
  "summary": {
    "status": "avoid_until_reviewed",
    "headline": "This combination should be avoided until reviewed.",
    "explanation": "The warfarin label explicitly references ibuprofen in drug interactions evidence for the ibuprofen combination."
  },
  "aiSummary": {
    "headline": "This combination should be avoided until reviewed.",
    "plainLanguageSummary": "Label excerpts show potential bleeding risk and reduced aspirin benefit when taking ibuprofen with warfarin and aspirin.",
    "whatTriggeredThis": "Warfarin drug_interactions evidence explicitly references ibuprofen and ibuprofen label sections mention aspirin-related caution.",
    "questionsForClinician": [
      "Is ibuprofen appropriate given warfarin and aspirin use?",
      "Should a different pain reliever be used instead?"
    ],
    "confidenceNote": "Summary is based only on the provided label excerpts. It does not replace clinician judgment or full label review.",
    "generatedBy": "openai"
  },
  "sideEffectSignals": [
    {
      "domain": "bleeding_risk",
      "severity": "high",
      "sourceSections": ["warfarin:drug_interactions", "warfarin:boxed_warning", "ibuprofen:warnings"],
      "explanation": "Warfarin labeling warns about bleeding risk and ibuprofen labeling includes stomach bleeding language."
    }
  ],
  "supportiveCareIdeas": [
    {
      "type": "avoidance",
      "label": "Prefer alternative analgesic (ask clinician)",
      "rationale": "A non-NSAID option may be safer when bleeding risk is elevated.",
      "candidateName": "acetaminophen (ask clinician)",
      "requiresReview": true,
      "shouldCheckInteractions": true
    }
  ],
  "disclaimer": "Prototype only. Not medical advice."
}
```

Current finding types:

- `explicit_label_interaction`
- `general_contraindication`
- `general_warning`
- `adverse_effect_context`
- `no_direct_label_match`

Current summary statuses:

- `avoid_until_reviewed`
- `review_before_use`
- `insufficient_evidence`

Current behavior notes:

- the endpoint uses a deterministic classifier for findings and status selection
- the endpoint now also returns `aiSummary`, which is grounded in the structured evidence only
- the endpoint now also returns structured `sideEffectSignals` and `supportiveCareIdeas`
- `aiSummary.generatedBy` is currently one of:
  - `openai`
  - `deterministic_fallback`
- if `OPENAI_API_KEY` is not configured or the OpenAI call fails, the route still returns a safe deterministic fallback summary
- `supportiveCareIdeas` may include AI-suggested supplement or medication candidates for hackathon demo purposes
- any item with `type = "supplement"` is forced to return `requiresReview = true` and `shouldCheckInteractions = true`
- the endpoint reuses the medication profile pipeline, including evidence caching
- explicit mention matches in `drug_interactions` and `boxed_warning` currently drive `avoid_until_reviewed`
- class-level warnings currently include some heuristic handling for anticoagulants, NSAIDs, and serotonergic drugs
- the classifier now prefers high-signal explicit interaction findings and suppresses some noisier duplicates
- every completed check is now persisted internally in `public.check_results`
- this endpoint requires Supabase runtime configuration because it persists completed checks
- this endpoint is intentionally conservative and still needs refinement before demo-final polish

Current `sideEffectSignals.domain` values:

- `bleeding_risk`
- `stomach_irritation`
- `liver_caution`
- `kidney_caution`
- `sedation`

Current `supportiveCareIdeas.type` values:

- `food`
- `hydration`
- `timing_discussion`
- `monitoring`
- `supplement`
- `avoidance`
- `general_support`

Required runtime env for this route:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_PUBLISHABLE_KEY`
- optional: `OPENAI_API_KEY`
- optional: `OPENAI_MODEL`

Current smoke test:

- `npm run smoke`
- expects the backend server to already be running
- verifies `health`, medication search, medication profile, medication list save/list/delete, and medication check

## Current Storage

### `public.user_medications`

Fields:

- `id`
- `user_id`
- `input_name`
- `display_name`
- `normalized_name`
- `rxcui`
- `rxaui`
- `source`
- `search_score`
- `created_at`

Current constraint:

- unique on `user_id, rxcui`

Current hackathon security note:

- the table currently uses permissive anon policies to let the backend run with a publishable key during MVP testing
- tighten this before production

### `public.medication_evidence_cache`

Fields:

- `lookup_key`
- `rxcui`
- `source`
- `raw_payload`
- `parsed_evidence`
- `fetched_at`
- `expires_at`

Current usage:

- used internally by the medication profile endpoint
- cache key format currently uses `profile:<rxcui>`
- cached entries currently live for 7 days

Current hackathon security note:

- this table also uses permissive write policies for MVP speed
- tighten this before production

### `public.check_results`

Fields:

- `id`
- `user_id`
- `candidate_rxcui`
- `current_medication_rxcuis`
- `findings`
- `summary`
- `created_at`

Current usage:

- used internally to persist completed medication checks
- current endpoint does not accept a `userId`, so saved rows currently store `user_id = null`

Current hackathon security note:

- this table currently uses permissive anon insert/select policies for MVP speed
- tighten this before production
