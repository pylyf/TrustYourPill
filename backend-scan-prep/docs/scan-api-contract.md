# Medication Scan API Contract

This document defines the expected request/response contract for:

- `POST /api/medications/scan`

Use this as the source of truth when wiring product frontend flows.

## Purpose

- accept an uploaded medication packaging image (bottle, box, blister pack, printed label)
- extract visible medication text fields via OpenAI vision
- map extracted medication text to RxNav search candidates
- return candidate data for explicit user confirmation before save

## Request

### Endpoint

- `POST /api/medications/scan`

### Headers

- `Content-Type: application/json`
- optional `x-trace-id: <uuid-like-string>`

### Body

At least one of `imageBase64DataUrl` or `imageUrl` is required.

```json
{
  "imageBase64DataUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
  "hint": "pharmacy bottle label"
}
```

Alternate shape:

```json
{
  "imageUrl": "https://example.com/medication-label.jpg"
}
```

### Input Rules

- `imageBase64DataUrl` must start with `data:image/` and max length is 16,000,000 chars
- `hint` is optional, trimmed, max 160 chars
- `image/svg+xml` is rejected
- backend normalizes base64 payloads (whitespace removal, URL-safe replacement, padding)

## Successful Response (`200`)

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

## Response Fields

### `extraction`

- `isMedicationPackaging`: `boolean`
- `packagingType`: `"bottle" | "box" | "blister_pack" | "printed_label" | "other" | "unknown"`
- `medicationName`: `string | null`
- `dosageText`: `string | null`
- `formText`: `string | null`
- `manufacturer`: `string | null`
- `visibleText`: `string[]`
- `confidence`: `"high" | "medium" | "low"`
- `requiresReview`: `boolean`

### `match`

- `status`: `"matched" | "ambiguous" | "no_match"`
- `reason`: `string`
- `query`: `string | null`
- `candidateCount`: `number`
- `bestCandidate`: `MedicationSearchCandidate | null`
- `candidates`: `MedicationSearchCandidate[]`

`MedicationSearchCandidate`:

- `rxcui: string`
- `rxaui: string | null`
- `displayName: string`
- `normalizedName: string`
- `confidenceScore: number`
- `rank: number`
- `source: string`

## Error Responses

All error responses include:

```json
{
  "error": "message",
  "requestId": "req-123",
  "traceId": "trace-123"
}
```

### `400 Bad Request`

- invalid request shape (`Invalid medication scan payload`)
- invalid data URL format
- invalid base64 payload
- unsupported SVG image

### `413 Payload Too Large`

- request body exceeds server body limit (`BODY_LIMIT_MB`)

### `503 Service Unavailable`

- missing `OPENAI_API_KEY`

### `502 Bad Gateway`

- upstream OpenAI error or other scan pipeline failure

## Frontend Wiring Sequence

1. User uploads packaging/label image.
2. Frontend sends `POST /api/medications/scan`.
3. Frontend renders extracted fields for transparency.
4. Frontend inspects `match.status`:
- `matched`: preselect `bestCandidate`, still show confirmation UI.
- `ambiguous`: require user candidate selection from `candidates`.
- `no_match`: ask user to retry image or manual search.
5. Only after confirmation, call `POST /api/users/:id/medications` with chosen candidate fields.

## Product Scope Reminder

- Supported: packaging, bottle, blister pack, printed label text.
- Not supported: unknown loose-pill identification by shape/color alone.
