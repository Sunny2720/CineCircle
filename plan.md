# CineCircle Implementation Plan

## Summary

Build CineCircle as a responsive social movie playlist application. The implementation should establish a replaceable movie-provider boundary, use TMDB initially for catalog metadata and images, use YouTube embeds for trailers, enforce authorization on the server, and keep user movie preferences private by default.

This plan assumes a new application will be scaffolded in this repository. The recommended baseline stack is recorded below and should be validated during Phase 1. No provider API key or user secret should be committed to the repository.

The planned MVP is explicitly non-commercial. Monetization, paid access, advertising, commercial licensing, and commercial deployment are outside this implementation scope.

## Recommended Technical Stack

- **Application:** Next.js with TypeScript, using the App Router for public pages, authenticated screens, server route handlers, and server actions.
- **Database:** PostgreSQL through Supabase, with SQL migrations and indexes owned by the repository.
- **Authentication:** Supabase Auth for sign-up, sign-in, sign-out, recovery, and session management.
- **Authorization:** PostgreSQL Row Level Security combined with server-side authorization checks for every playlist and preference operation.
- **File storage:** Supabase Storage for user-uploaded playlist cover images.
- **Validation:** Zod at API and server-action boundaries.
- **Styling:** Tailwind CSS with accessible component primitives.
- **Movie catalog:** TMDB accessed only from Next.js server routes through a provider adapter.
- **Trailers:** YouTube official embedded player using trailer IDs returned by TMDB.
- **Testing:** Vitest for domain and provider logic; Playwright for responsive browser workflows.
- **Deployment:** Vercel Hobby for the Next.js application and Supabase managed services for database, authentication, and storage.
- **CI:** GitHub Actions for linting, type checking, unit tests, migrations, and browser tests.

### Runtime Boundary

```text
Browser -> Next.js UI -> Next.js server routes/actions
							  |-> Supabase Auth
							  |-> PostgreSQL + Row Level Security
							  |-> Supabase Storage
							  |-> TMDB provider adapter
							  |-> YouTube embedded player
```

The recommendation engine should initially be a transparent TypeScript/PostgreSQL scoring system using genres, likes, viewed status, and half-star ratings. Do not introduce machine learning, vector search, Redis, microservices, or Kubernetes until measured usage justifies the additional operational complexity. TMDB content must not be used to train recommendation models.

## Guiding Constraints

- Server-side authorization is the security boundary for every playlist and preference operation.
- TMDB is an initial provider, not a permanent domain-model dependency.
- TMDB metadata and images require attribution and must remain within the provider's non-commercial usage terms for this MVP.
- YouTube trailers must use the official embedded player and remain subject to YouTube policies.
- User likes, viewed state, and ratings are private to the owning user unless a future social feature explicitly exposes them.
- Ratings are nullable, range from 0.5 to 5.0, and use 0.5 increments.
- Missing posters, backdrops, metadata, or trailers must not prevent a movie from being added.
- All list and search experiences must support pagination or lazy loading.
- Supabase Row Level Security is defense in depth; server-side authorization remains mandatory.
- API credentials remain in Vercel/Supabase environment secrets and are never bundled into browser code.

## Phase 1: Project and Architecture Setup

### 1.1 Finalize the technical stack

Adopt the recommended stack above unless a documented constraint requires a change. Create the Next.js TypeScript application, connect Supabase locally and in development, configure SQL migrations, and record any deviations in an architecture decision record.

Outputs:

- Architecture decision record
- Local development instructions
- Environment variable inventory
- Initial application scaffold

Requirements: FR-001, FR-010, NFR responsive/accessibility/security requirements.

### 1.2 Establish project foundations

Create the application structure, formatting and linting rules, environment configuration, error handling conventions, logging, health check, CI checks, and secret-management approach. Add a `.env.example` containing names only, never real credentials.

Requirements: FR-010 and all non-functional requirements.

### 1.3 Confirm non-commercial provider compliance

Create TMDB and YouTube developer accounts, obtain API credentials through the intended environment secret store, confirm that CineCircle remains non-commercial, and document the required attribution and data-retention treatment before production use.

Requirements: FR-004, FR-012, NFR provider compliance.

## Phase 2: Foundational Data and Authentication

### 2.1 Design and migrate the relational schema

Implement migrations for:

- `User`
- `Movie`
- `MovieProviderReference`
- `Playlist`
- `PlaylistMovie`
- `PlaylistContributor`
- `UserMoviePreference`
- Shareable playlist identifier or slug

Add unique constraints for provider plus provider movie ID, user plus movie preference, and movie plus playlist membership. Add indexes for public playlist discovery, playlist ordering, provider lookup, and preference queries.

Requirements: FR-002, FR-004, FR-005, FR-006, FR-011, FR-012.

### 2.2 Implement authentication and account lifecycle

Implement sign-up, sign-in, sign-out, account recovery, session handling, password or identity-provider security, and user identity loading in server requests. Add protected-route behavior and unauthorized states.

Requirements: FR-001, FR-010.

### 2.3 Implement authorization policies

Centralize policies for playlist ownership, authorized collaborators, contributors, public access, and user-owned preferences. Apply policies in server handlers/services, not only in UI controls. Add tests for owner, contributor, signed-in non-member, visitor, and unauthorized private-playlist access.

Requirements: FR-003, FR-006, FR-007, FR-010, FR-011.

## Phase 3: Movie Provider Integration

### 3.1 Define the provider adapter contract

Create an internal interface for movie search, movie details, external IDs, images, and trailers. Return normalized domain data so playlist and recommendation code does not call TMDB directly.

Requirements: FR-004, FR-012.

### 3.2 Implement the TMDB adapter

Implement server-side TMDB authentication, search pagination, detail lookup, poster/backdrop URL construction, external IMDb ID lookup, video lookup, timeout handling, retry policy, rate-limit handling, and provider error mapping. Do not expose the TMDB token to the browser.

Requirements: FR-004, FR-012, NFR provider compliance.

### 3.3 Normalize and persist movie records

Upsert a `Movie` and its `MovieProviderReference` when a user selects a result. Refresh provider metadata through an explicit policy, preserve provider IDs, and tolerate missing images or trailers. Never duplicate a movie for the same provider identifier.

Requirements: FR-004, FR-012.

### 3.4 Build movie search and detail UI

Add debounced search, pagination or lazy loading, loading/error/empty states, accessible result cards, poster fallbacks, movie details, and a trailer action that opens an official YouTube embedded player when a valid trailer exists.

Requirements: FR-004, FR-012, MVP screens, responsive/accessibility requirements.

## Phase 4: Playlist MVP

### 4.1 Create and manage playlists

Implement create, edit, delete, title, description, cover image, visibility, and contribution settings. Validate user-controlled input on the server and enforce owner-only mutation.

Requirements: FR-002, FR-003, FR-010.

### 4.2 Add and organize movies

Implement adding a normalized movie to a playlist, duplicate prevention, removal, owner-controlled ordering, persisted ordering, and contributor/timestamp attribution. Use a transaction for membership changes and ordering updates.

Requirements: FR-004, FR-005, FR-006.

### 4.3 Implement playlist details and sharing

Build the public/private playlist details view, stable public slug or identifier, contributor display, contribution status, share action, and unauthorized/private states. Ensure private playlist data is excluded from search results, metadata, previews, and unauthenticated responses.

Requirements: FR-007, FR-009, FR-010.

### 4.4 Implement public discovery

Add public playlist browsing with search/filter support for playlist title, movie title, genre, and owner. Add server-side pagination and indexes for the selected query patterns.

Requirements: FR-008.

## Phase 5: Collaboration

### 5.1 Implement contributor access flows

Implement owner invitations or access requests according to the selected product flow, acceptance/rejection, contributor removal, and access revocation. Ensure disabling contributions does not delete existing playlist movies.

Requirements: FR-006, FR-010.

### 5.2 Implement contribution permissions

Allow authorized contributors to add movies only when the playlist permits contributions. Record the contributor and creation time. Allow contributors to remove their own contributions where permitted, while allowing owners to remove any movie.

Requirements: FR-006, FR-010.

## Phase 6: Personal Movie Preferences

### 6.1 Implement likes and viewing status

Add authenticated endpoints and UI controls for liked/not-liked and viewed/not-viewed state. Ensure updates are idempotent, scoped to the current user, and available from movie details and playlist movie entries.

Requirements: FR-011.

### 6.2 Implement half-star ratings

Add nullable personal ratings with server and database validation for 0.5 through 5.0 in 0.5 increments. Require viewed status before rating, or return a clear validation error. Support update and removal without affecting other users.

Requirements: FR-011.

### 6.3 Add private preference views

Add dashboard filters for liked, viewed, and unrated movies. Verify that preferences never appear in public playlist responses, search results, page metadata, or another user's account views.

Requirements: FR-011, FR-010.

## Phase 7: Recommendations and AI Movie Suggestions

### 7.1 Define recommendation inputs and privacy rules

Specify the first recommendation strategy using the current user's likes, viewed state, and half-star ratings. Define exclusion rules for already viewed or explicitly disliked movies, cold-start behavior, explanation text, and whether recommendations may use only TMDB metadata or require another licensed dataset.

Requirements: Future recommendation enhancement, FR-011, provider compliance.

### 7.2 Implement an initial deterministic recommender

Start with a transparent content-based approach using genres and other licensed metadata. Weight liked and highly rated movies positively, disliked movies negatively, and exclude already viewed movies where appropriate. Run it server-side and return paginated results with reasons.

Requirements: Future recommendation enhancement, NFR pagination and privacy requirements.

### 7.3 Add an optional AI movie-suggestion assistant

Add an opt-in assistant that can help users turn a natural-language request—such as a mood, theme, event, group preference, genre, runtime, or content constraint—into an editable playlist title, description, and a small set of suggested TMDB search queries. The assistant must not directly create playlists, add movies, or claim a movie is available; users review and confirm all resulting changes, and TMDB remains the source of truth for movie metadata and search results.

Implement the integration behind a server-side provider boundary using the OpenAI Responses API with the explicit `gpt-6-astra` model. Return a Zod-validated structured response, begin with `reasoning.effort: "low"`, and keep the OpenAI credential in a server-only environment variable. Send only the minimum user-authorized playlist context and preference data needed for a request. Do not expose another user's private preferences, send secrets, or use TMDB content to train a model.

Add a feature flag, rate limits, request-size limits, timeout/error fallbacks, and a manual playlist-creation path. Validate generated search queries and all selected TMDB results before displaying or persisting them. Create an evaluation set covering ambiguous prompts, group requests, privacy boundaries, schema validity, and factual-grounding failures; measure useful suggestions, structured-output validity, latency, token use, and cost per accepted suggestion.

Requirements: Future AI movie-suggestion enhancement, FR-004, FR-010, FR-011, FR-012, NFR provider compliance.

### 7.4 Add recommendation quality telemetry

Measure impressions, dismissals, saves/additions, and optional feedback without exposing private preference data. Add feature flags and a fallback to popular or curated public movies when a user has insufficient preference history.

Requirements: Future recommendation enhancement, FR-010, provider compliance.

## Phase 8: Quality, Accessibility, and Operations

### 8.1 Test the core workflows

Add unit tests for rating validation, provider normalization, duplicate prevention, ordering, authorization policies, and recommendation scoring. Add integration tests for account creation, playlist lifecycle, collaboration, privacy, TMDB failures, missing trailers, and provider rate limits.

Requirements: FR-001 through FR-012 and MVP success criteria.

### 8.2 Validate browser workflows

Run responsive browser tests for sign-up, playlist creation, movie search, add/remove/reorder, public sharing, private access denial, contribution access, preferences, ratings, and trailer playback. Verify keyboard navigation, labels, focus states, contrast, and mobile layouts.

Requirements: MVP screens, non-functional accessibility/responsive requirements, MVP success criteria.

### 8.3 Add production safeguards

Configure structured logs, error tracking, API timeout and retry budgets, rate-limit handling, database backups, migration rollback guidance, health checks, dependency scanning, secret rotation, and monitoring for provider failures.

Requirements: FR-010 and non-functional reliability/security requirements.

### 8.4 Complete non-commercial launch compliance review

Before launch, verify TMDB attribution and non-commercial usage, YouTube API and embedded-player compliance, privacy disclosures, data retention/deletion behavior, and that no private playlist or preference data is indexed or leaked.

Requirements: FR-003, FR-007, FR-010, FR-011, FR-012, provider compliance requirements.

## Suggested Delivery Milestones

1. **Foundation:** Phases 1 and 2 complete; app boots, users authenticate, and authorization tests pass.
2. **Movie and playlist MVP:** Phases 3 and 4 complete; a user can search TMDB, add a movie, create a playlist, and share a public playlist.
3. **Collaboration:** Phase 5 complete; contribution and revocation flows work securely.
4. **Personalization:** Phase 6 complete; private likes, viewed status, and half-star ratings work.
5. **Recommendations:** Phase 7 complete behind a feature flag.
6. **Launch readiness:** Phase 8 complete; compliance and end-to-end gates pass.

## Requirement Mapping

| Requirement | Plan coverage |
|---|---|
| FR-001 Account creation and authentication | 2.2, 8.1 |
| FR-002 Create a playlist | 2.1, 4.1, 8.1 |
| FR-003 Manage playlist visibility | 2.3, 4.1, 4.3, 8.1 |
| FR-004 Add movies | 2.1, 3.1-3.4, 4.2, 8.1 |
| FR-005 Organize playlist movies | 2.1, 4.2, 8.1 |
| FR-006 Collaborative contributions | 2.1, 2.3, 4.2, 5.1-5.2, 8.1 |
| FR-007 Share public playlists | 2.3, 4.3, 8.1-8.4 |
| FR-008 Browse and discover | 4.4, 8.1-8.2 |
| FR-009 Playlist details | 4.3, 3.4, 8.2 |
| FR-010 Ownership and access control | 1.2, 2.2-2.3, 4.1-4.4, 5.1-5.2, 6.3, 7.3, 8.1-8.4 |
| FR-011 User movie preferences and ratings | 2.1, 2.3, 6.1-6.3, 7.1, 8.1-8.2 |
| FR-012 Movie catalog and trailer integration | 1.3, 2.1, 3.1-3.4, 8.1-8.4 |
| Non-functional requirements | 1.1-1.3, 2.3, 3.2-3.4, 4.3-4.4, 6.3, 7.1-7.3, 8.1-8.4 |

## Open Decisions Before Implementation

- Frontend and backend framework
- Database and hosting target
- Authentication provider and account recovery mechanism
- User cover-image storage provider
- Confirmation that the MVP remains non-commercial and does not monetize access, content, or recommendations
- Whether trailer lookup comes only from TMDB video results or also uses YouTube Data API search
- Exact collaboration invitation/request workflow
- Recommendation cold-start and exclusion rules
- Whether public users can see aggregate movie ratings or only their own private ratings
