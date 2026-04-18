# Backend API Docs

This file is the living contract for the backend.

Rule:

- update this file whenever an endpoint is added, removed, or its request/response shape changes

## Status Summary

### Implemented

- `GET /health`
- `GET /api/medications/search?q=`
- `GET /api/medications/profile?name=`
- `POST /api/medications/scan`
- `GET /api/users/:id/medications`
- `POST /api/users/:id/medications`
- `DELETE /api/users/:id/medications/:medId`

### Stubbed

- `POST /api/medications/check`

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
- DailyMed fallback is not implemented yet

## `POST /api/medications/scan`

Purpose:

- accept a medication bottle, box, blister pack, or printed label image
- extract visible medication text with OpenAI vision
- run the extracted medication name through the existing RxNav search flow
- return candidates for frontend confirmation before anything is saved

Request body:

```json
{
  "imageBase64DataUrl": "data:image/jpeg;base64,...",
  "hint": "pharmacy bottle label"
}
```

Alternate request shape:

```json
{
  "imageUrl": "https://example.com/medication-label.jpg"
}
```

Response:

```json
{
  "source": "openai_vision",
  "model": "gpt-5.4-mini",
  "extraction": {
    "isMedicationPackaging": true,
    "packagingType": "printed_label",
    "medicationName": "ibuprofen",
    "dosageText": "200 mg",
    "formText": "tablet",
    "manufacturer": null,
    "visibleText": ["ibuprofen", "200 mg", "tablets"],
    "confidence": "high",
    "requiresReview": false
  },
  "match": {
    "status": "matched",
    "reason": "A single medication candidate was found from the extracted packaging text.",
    "query": "ibuprofen",
    "candidateCount": 1,
    "bestCandidate": {
      "rxcui": "5640",
      "rxaui": "12254458",
      "displayName": "ibuprofen",
      "normalizedName": "ibuprofen",
      "confidenceScore": 11.226275444030762,
      "rank": 1,
      "source": "RXNORM"
    },
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
}
```

Notes:

- this endpoint is for packaging, bottle, blister pack, and printed label text only
- it is not designed to identify unknown loose pills by color or shape
- the frontend should always show the returned candidate selection to the user before saving
- if OpenAI cannot confidently extract a medication name, `match.status` returns `no_match`
- if multiple candidates are close, `match.status` returns `ambiguous`
- for the full request/response contract and status-code behavior, see `docs/scan-api-contract.md`

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
