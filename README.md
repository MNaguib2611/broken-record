# Broken Record Store API (NestJS + MongoDB)

Production-oriented implementation of the **Broken Record Store API Challenge** with a focus on:
- **Search performance** at ~100k records (indexes + server-side querying)
- **MusicBrainz enrichment** (XML) for tracklists on create/update
- **Atomic order creation** with inventory decrement (transactional)
- **Clean NestJS modular structure**, DTO-based contracts, and strong automated tests

## What was improved (high level)

- **Search performance**
  - Moved filtering/searching/pagination into Mongo queries (no in-memory filtering).
  - Added indexes (unique compound + supporting indexes + text search) to make common queries fast.
  - Uses `.lean()` and pagination (`skip/limit`) to reduce overhead and response times.

- **MusicBrainz integration (tracklist enrichment)**
  - When `mbid` is provided on record creation, the API calls MusicBrainz (XML) and stores `tracklist[]`.
  - When updating a record, it **only refetches** the tracklist when `mbid` is explicitly changed.
  - **Fail-open behavior**: if MusicBrainz is down or returns non-2xx, record writes still succeed (tracklist falls back to empty array).

- **Orders + inventory**
  - Added `POST /orders` with **atomic inventory decrement** + order creation (Mongo transaction).
  - Stores **price snapshot** at purchase time (`unitPrice`, `totalPrice`) to keep order history correct if record prices change later.
  - Improved error behavior to distinguish **record not found (404)** vs **insufficient inventory (400)**.

- **Code quality and structure**
  - Refactored controllers to be thin and delegate to services.
  - Introduced DTOs for request/response to keep API contracts explicit and stable.
  - Organized the code into feature modules under `src/api/<feature>/...` to scale cleanly in larger systems.

## Important implementation notes (decisions made intentionally)

- **1) MBID: “album id” vs “record/release id”**
  - MusicBrainz has multiple entity identifiers (artist, release-group, release, recording).
  - Tracklists are reliably derived from a **Release MBID** (edition-level).
  - This implementation treats `mbid` as a **Release MBID** when fetching tracklists (XML `inc=recordings`).
  - If a different MBID type is supplied, the API will **not block record writes**; it will simply not enrich tracklist.

- **2) Avoid unnecessary MusicBrainz calls**
  - On record update, the service checks whether the incoming `mbid` is **explicitly provided and different** from the stored value.
  - If it’s unchanged, the API **skips** the MusicBrainz call entirely (fewer network calls, faster updates, less risk).

- **3) DTOs + module refactor**
  - DTOs are split into `request/` and `response/` to make contracts clear and maintainable.
  - Controllers return Response DTOs (no leaking Mongoose internal fields).
  - Feature modules follow a scalable folder structure (`record/`, `order/`), aligned with typical `nest g module` output.


## API overview

### Records
- `GET /records` supports:
  - Free-text search: `q`
  - Filters: `artist`, `album`, `format`, `category`
  - Pagination: `page`, `limit`
- `POST /records`:
  - Creates a record.
  - If `mbid` is provided and MusicBrainz returns data, populates `tracklist`.
- `PUT /records/:id`:
  - Updates a record.
  - If `mbid` changes, refetches and updates `tracklist`.

### Orders
- `POST /orders`:
  - Creates an order with `recordId` and `quantity`
  - Atomically decrements inventory (`qty`)
  - Stores `unitPrice` and `totalPrice` snapshots
- `GET /orders`:
  - Lists orders with pagination (`page`, `limit`)

## Project layout (most important files)

```text
src/
  app.module.ts
  main.ts
  api/
    record/
      record.module.ts
      controllers/
        record.controller.ts
        record.controller.spec.ts
      services/
        record.service.ts
        record.service.spec.ts
        musicbrainz.service.ts
        musicbrainz.service.spec.ts
      dtos/
        request/
          create-record.request.dto.ts
          update-record.request.dto.ts
          get-records.query.dto.ts
        response/
          record.response.dto.ts
      schemas/
        record.schema.ts
        record.enum.ts
    order/
      order.module.ts
      controllers/
        order.controller.ts
        order.controller.spec.ts
      services/
        order.service.ts
        order.service.spec.ts
      dtos/
        request/
          create-order.request.dto.ts
          get-orders.query.dto.ts
        response/
          order.response.dto.ts
      schemas/
        order.schema.ts
test/
  record.e2e-spec.ts
  order.e2e-spec.ts
setup-db.ts
data.json
```

## Getting started

### Prerequisites
- Node.js (recommended: current LTS)
- MongoDB (local or Docker)

### Install

```bash
npm install
```

### Configure environment

Create a `.env` file:

```bash
MONGO_URL=mongodb://localhost:27017/records
```

### Start MongoDB (Docker)

```bash
npm run mongo:start
```

### Seed the database

```bash
npm run setup:db
```

### Run the app

```bash
npm run start:dev
```

Swagger (OpenAPI) is available once the app starts (see server output for the exact URL).

## Tests

### Unit tests

```bash
npm run test
```

### Coverage

```bash
npm run test:cov
```

Example output (will vary by environment):

```text
PASS  src/api/record/services/record.service.spec.ts
PASS  src/api/record/services/musicbrainz.service.spec.ts
PASS  src/api/order/controllers/order.controller.spec.ts

----------|---------|----------|---------|---------|-------------------
File      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------|---------|----------|---------|---------|-------------------
All files |   9x.xx |    9x.xx |   9x.xx |   9x.xx |
----------|---------|----------|---------|---------|-------------------
```

### End-to-end tests

E2E tests run with an in-memory Mongo **replica set** to support transactions (required by order creation flow).

```bash
npm run test:e2e
```

Example output (will vary by environment):

```text
PASS  test/record.e2e-spec.ts
PASS  test/order.e2e-spec.ts
Test Suites: 2 passed, 2 total
Tests:       xx passed, xx total
```

## Linting

```bash
npm run lint
```

## Operational notes

- **Logging**
  - Service-level warnings are emitted for external dependency failures (MusicBrainz) and failed order creation attempts.
  - This is intentional: production incidents are usually debugged from service logs, not controllers.

- **Indexes**
  - The record schema defines indexes to support unique identification (`artist + album + format`) and fast filtering/search.
  - Ensure indexes are built in the target environment (Mongo will build them based on the schema).

