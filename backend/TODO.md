# Backend TODO

This file is the working implementation roadmap for the Trust Your Pill backend.

Rule:

- update this file whenever we complete a task, add a new backend feature, or change the implementation order
- keep it aligned with `backend instructions`, `README.md`, and `docs/api.md`

## How We Use This

- work from top to bottom unless a blocker forces a reorder
- keep tasks small enough to implement and test in one pass
- after each feature, update docs and verify with a live endpoint test

## Current Status

### Completed

- [x] Expand the backend product and architecture instructions
- [x] Scaffold the TypeScript backend project structure
- [x] Add Fastify server bootstrap
- [x] Add request IDs, trace IDs, and request lifecycle logging
- [x] Add `GET /health`
- [x] Implement `GET /api/medications/search?q=`
- [x] Test live RxNav medication search
- [x] Add living backend API docs in `docs/api.md`
- [x] Create Supabase `user_medications` table and migration
- [x] Implement `GET /api/users/:id/medications`
- [x] Implement `POST /api/users/:id/medications`
- [x] Implement `DELETE /api/users/:id/medications/:medId`
- [x] Test live user medication save, list, and delete flow
- [x] Implement `GET /api/medications/profile?name=`
- [x] Test live medication profile lookup with real medications
- [x] Implement `POST /api/medications/check`
- [x] Test live medication check with real medication combinations
- [x] Add grounded AI summary generation on top of medication check findings
- [x] Add deterministic fallback when OpenAI is unavailable
- [x] Update backend docs with the live `aiSummary` response shape
- [x] Validate the live OpenAI summary path with the configured API key
- [x] Add structured side-effect signal output to medication checks
- [x] Add AI-generated supportive care ideas to medication checks
- [x] Add repeatable smoke tests for the core endpoints

### Next Up

- [ ] Add normalization caching for RxNav lookups

## Phase 1: Core Medication Data

### 1. Medication profile endpoint

- [x] Add route validation for `GET /api/medications/profile?name=`
- [x] Build a normalization flow for profile lookups using RxNav
- [x] Build the first openFDA client call for label retrieval
- [x] Query openFDA by `openfda.rxcui` first
- [ ] Add fallback openFDA queries for:
  - [x] `openfda.generic_name`
  - [x] `openfda.substance_name`
  - [x] `openfda.brand_name`
- [ ] Extract these label sections when present:
  - [x] `boxed_warning`
  - [x] `contraindications`
  - [x] `drug_interactions`
  - [x] `drug_and_or_laboratory_test_interactions`
  - [x] `warnings`
  - [x] `ask_doctor_or_pharmacist`
  - [x] `adverse_reactions`
- [x] Return a grounded medication profile response
- [x] Document the endpoint in `docs/api.md`
- [x] Test the endpoint with at least 2 real medications

### 2. DailyMed fallback

- [x] Implement the DailyMed client
- [x] Support SPL lookup by `rxcui`
- [x] Normalize DailyMed payloads into the same internal evidence shape
- [x] Use DailyMed only when openFDA is missing or too thin
- [x] Log whenever a DailyMed fallback is used
- [x] Document fallback behavior
- [x] Test one case that uses the fallback path

### 3. Medication evidence cache

- [x] Create Supabase table for cached medication evidence
- [x] Store:
  - [x] lookup key
  - [x] `rxcui`
  - [x] source
  - [x] raw payload
  - [x] parsed evidence
  - [x] fetch timestamp
  - [x] expiry timestamp
- [x] Add repository methods for read and upsert
- [x] Cache openFDA and DailyMed evidence for 7 days
- [x] Log cache hits and misses
- [x] Document the cache contract

## Phase 2: Medication Check Engine

### 4. Normalization service

- [x] Implement a dedicated `MedicationNormalizationService`
- [x] Standardize one canonical normalized medication shape
- [ ] Preserve:
  - [x] original input
  - [x] normalized name
  - [x] `rxcui`
  - [x] `rxaui` if available
  - [x] source
  - [x] score
- [ ] Prefer active RxNorm concepts where possible
- [ ] Add a normalization cache strategy for 30 days
- [x] Document normalization rules clearly

### 5. Name and ingredient matching helpers

- [x] Implement medication name matching utilities
- [x] Support exact normalized name matching
- [x] Support case-insensitive term matching
- [x] Support ingredient and substance name matching
- [x] Add class-level heuristic matching for broad warnings
- [x] Keep matcher output explainable and logged
- [ ] Add unit-testable helper boundaries

### 6. Finding classifier

- [x] Implement `explicit_label_interaction`
- [x] Implement `general_contraindication`
- [x] Implement `general_warning`
- [x] Implement `adverse_effect_context`
- [x] Implement `no_direct_label_match`
- [ ] Ensure each finding includes:
  - [x] source system
  - [x] source section
  - [x] matched medication
  - [x] excerpt
  - [x] reason for classification
- [x] Add classifier logging
- [ ] Add representative fixture-based tests

### 7. Medication check service

- [x] Implement `POST /api/medications/check`
- [x] Validate request body
- [x] Normalize the candidate medication
- [x] Normalize or load all current medications
- [x] Retrieve evidence for the candidate medication
- [x] Retrieve evidence for current medications
- [x] Compare candidate medication against current meds
- [x] Build structured findings
- [x] Assign overall status:
  - [x] `avoid_until_reviewed`
  - [x] `review_before_use`
  - [x] `insufficient_evidence`
- [x] Never return `safe_to_take`
- [x] Return a disclaimer in every response
- [x] Document the endpoint and response shape
- [x] Test with at least:
  - [x] explicit interaction case
  - [x] general warning case
  - [ ] insufficient evidence case

### 8. Medication check agent

- [x] Implement the `MedicationCheckAgent` orchestration flow
- [x] Make the orchestration steps explicit in code
- [ ] Add step-by-step logging for:
  - [x] normalization
  - [x] evidence retrieval
  - [x] classification
  - [x] AI summarization
- [ ] Ensure failures can return partial but honest results
- [ ] Document the agent flow

## Phase 3: AI Summary Layer

### 9. OpenAI integration

- [x] Implement the OpenAI client
- [x] Keep the prompt grounded in structured evidence only
- [x] Forbid invented interactions in the prompt contract
- [ ] Require the answer to state:
  - [x] explicit interaction found
  - [x] general warning found
  - [x] no direct label match found
- [x] Include the required disclaimer line
- [x] Redact user identifiers from prompts
- [x] Log prompt provenance without logging secrets

### 10. AI summary service

- [x] Implement `AiSummaryService`
- [x] Return:
  - [x] `headline`
  - [x] `plain_language_summary`
  - [x] `what_triggered_this`
  - [x] `questions_for_clinician`
  - [x] `confidence_note`
- [x] Handle AI failure with a safe fallback summary
- [x] Document the AI contract
- [ ] Test with real OpenAI-backed and mocked evidence payloads

### 10.1 Live AI summary and support ideas

- [x] Validate real OpenAI-backed medication check summaries with the configured key
- [x] Extend the check response with structured `sideEffectSignals`
- [x] Extend the check response with structured `supportiveCareIdeas`
- [x] Allow AI to suggest supportive care ideas, including supplement candidates, with strong review flags
- [x] Keep deterministic fallback behavior when OpenAI is unavailable or fails
- [x] Document the expanded response contract

## Phase 4: Storage and History

### 11. Check results storage

- [x] Create Supabase table for `check_results`
- [x] Store:
  - [x] user id
  - [x] candidate `rxcui`
  - [x] current medication `rxcui` list
  - [x] findings
  - [x] summary
  - [x] timestamp
- [x] Add repository and service methods
- [ ] Decide whether to expose a history endpoint now or later
- [x] Document the table and any endpoint added

### 12. Normalization cache storage

- [ ] Create optional normalization cache table
- [ ] Store lookup key, normalized output, score, and expiry
- [ ] Wire into the normalization service
- [ ] Log cache performance

## Phase 5: Reliability and Observability

### 13. Retry, timeout, and circuit breaker hardening

- [ ] Add provider-specific timeout settings
- [ ] Improve retry policy per upstream dependency
- [ ] Add lightweight circuit breaker behavior for:
  - [ ] RxNav
  - [ ] openFDA
  - [ ] DailyMed
  - [ ] OpenAI
- [ ] Ensure failure modes surface `insufficient_evidence` instead of fake confidence
- [ ] Document dependency behavior

### 14. Logging and tracing improvements

- [ ] Add provider-level latency logs
- [ ] Add cache hit/miss logs
- [ ] Add structured logs for finding classification decisions
- [ ] Add structured logs for AI summary success/failure
- [ ] Decide whether to add request-scoped child loggers
- [ ] Keep log fields stable and documented

### 15. Error model

- [ ] Standardize API error response shapes
- [ ] Differentiate validation, upstream, not-found, and internal errors
- [ ] Add meaningful 4xx vs 5xx behavior across routes
- [ ] Document the error model in `docs/api.md`

## Phase 6: Security and Auth

### 16. Hackathon auth posture

- [ ] Decide whether to keep simple path-param `userId` for the demo or move to Supabase Auth now
- [ ] If moving to auth:
  - [ ] add Supabase auth-aware client setup
  - [ ] bind medication rows to authenticated users
  - [ ] tighten RLS policies
- [ ] If staying demo-only:
  - [ ] document the temporary trust model clearly

### 17. Secrets and prompt safety

- [ ] Confirm no API keys are exposed in client code
- [ ] Confirm logs redact sensitive values
- [ ] Confirm prompts avoid unnecessary personal data

## Phase 7: Testing and QA

### 18. Endpoint smoke tests

- [x] Create a repeatable smoke-test flow for:
  - [x] health
  - [x] medication search
  - [x] medication profile
  - [x] user medication list
  - [x] medication check

### 19. Integration tests

- [ ] Add tests around RxNav integration
- [ ] Add tests around openFDA integration
- [ ] Add tests around Supabase repositories
- [ ] Add tests around end-to-end medication check logic

### 20. Sample demo scenarios

- [ ] Prepare at least 3 demo-ready medication combinations
- [ ] Capture expected findings and summaries
- [ ] Record known caveats for each demo scenario

## Phase 8: Optional Stretch Features

### 21. Pill or medication image scanning

- [ ] Implement image upload handling
- [ ] Add OpenAI vision candidate extraction
- [ ] Convert image results into RxNav search candidates
- [ ] Require user confirmation before saving a medication
- [ ] Document the flow and limitations

### 22. Chat-based medication check-in

- [ ] Define the check-in prompt flow
- [ ] Reuse normalization and evidence retrieval services
- [ ] Keep the chat layer separate from clinical logic
- [ ] Document the feature as experimental if added

### 23. Voice-based check-in

- [ ] Add speech-to-text input path
- [ ] Convert spoken medication input into structured search requests
- [ ] Reuse the same backend medication pipeline
- [ ] Document limitations and supported scope

## Acceptance Checklist

- [ ] User can search medications reliably
- [ ] User can save and remove medications reliably
- [ ] User can retrieve a grounded medication profile
- [ ] User can check a candidate medication against current medications
- [ ] Every check response includes source-backed rationale
- [ ] Explicit interaction evidence is surfaced clearly when present
- [ ] Incomplete evidence is called out explicitly
- [ ] No endpoint claims a medication is safe
- [ ] Logs are detailed enough to debug a live demo quickly
- [ ] Docs are current with the implemented behavior

## Immediate Next Task

- [ ] Add normalization caching for RxNav lookups
