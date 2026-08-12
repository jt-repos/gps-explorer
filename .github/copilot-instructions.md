# Copilot Instructions — GPS Explorer

## Project Overview
"Explorer" is a gamified GPS exploration app. Users move in real life, the app tracks
location, detects when they enter new/unvisited geographic "zones", awards points, and
ranks users on leaderboards. This is a learning project for advanced full-stack patterns:
geolocation, real-time systems, gamification, and serverless AWS architecture.

## Tech Stack
- **Frontend**: Vue 3 (Composition API, `<script setup>`), Vite, Pinia, Vue Router, TypeScript
- **Maps**: MapLibre GL JS (preferred over Mapbox to avoid vendor lock-in); style tiles
  come from AWS Location Service in production, `demotiles.maplibre.org` for local dev only
- **Auth**: AWS Cognito (via AWS Amplify Auth or direct SDK — do not mix both approaches)
- **Backend**: AWS serverless — API Gateway (HTTP API) + Lambda (Node.js/TypeScript)
- **Data**: DynamoDB, single-table design (see Data Model below)
- **Infra as Code**: **Terraform** (HCL) — no CDK, no Serverless Framework/SAM, no manual
  console changes
- **Async/eventing**: EventBridge, SQS, DynamoDB Streams for scoring and leaderboard updates
- **Hosting**: S3 + CloudFront for the built Vue SPA (PWA-enabled)

## Architecture Principles
- Keep frontend and infra in separate top-level directories: `frontend/` and `infra/`
  (Terraform root and modules), with Lambda source code under `infra/lambdas/<function-name>/`
  or a sibling `backend/` directory if handlers grow large — pick one convention and stick
  to it across the repo.
- Backend logic lives in Lambda handlers; keep handlers thin — delegate business logic
  (scoring rules, zone calculation, anti-cheat checks) to plain, unit-testable modules.
- Zones are identified by **geohash or H3 index**, not raw lat/lng — always compute a
  zone ID before checking "has this user visited this place."
- Prefer async/event-driven flows (EventBridge/SQS/Streams) over synchronous chained
  Lambda calls for anything non-critical-path (leaderboard aggregation, notifications).
- All infrastructure changes go through Terraform code — never suggest manual AWS console
  steps as the primary solution.

## Data Model (DynamoDB single-table)
| PK | SK | Purpose |
|---|---|---|
| `USER#<id>` | `PROFILE` | user profile, totalPoints, level |
| `USER#<id>` | `ZONE#<geohash>` | zones a user has visited |
| `ZONE#<geohash>` | `USER#<id>` | inverse index: who has visited this zone |
| `LEADERBOARD#<period>#<key>` | `USER#<id>` | leaderboard entries, queried via GSI sorted by points |

When adding new access patterns, model them explicitly here before writing Lambda code —
don't introduce ad-hoc scans.

## Coding Conventions

### Vue / Frontend
- Use `<script setup lang="ts">` for all new components.
- One component = one responsibility. Map rendering, geolocation watching, and UI overlays
  should be separate components/composables, not bundled into one file.
- Extract geolocation logic into a composable (e.g., `useGeolocation.ts`), not inline in
  components — it needs to be testable and reused (map view, check-in flow, background sync).
- State that's shared across routes (user session, current score, active zone) belongs in
  Pinia stores, not component-local `ref`s.
- Geolocation API requires HTTPS or localhost — never assume it works over plain HTTP.
- Always handle `watchPosition` errors and clean up with `clearWatch` in `onBeforeUnmount`.

### Backend / Lambda
- Use TypeScript for all Lambda functions.
- Validate all incoming request bodies (API Gateway payloads are untrusted input) —
  use a schema validator (e.g., Zod) rather than manual `if` checks.
- Anti-cheat: any endpoint receiving a location ping must check plausibility
  (distance/time since last known ping) before accepting it — never trust raw
  client-reported coordinates as ground truth for scoring.
- Keep Lambda handlers free of AWS SDK client instantiation inside the handler body when
  avoidable — instantiate clients at module scope for connection reuse.
- Use environment variables (injected via Terraform) for table names, region, and other
  config — never hardcode ARNs, table names, or account IDs.

### Terraform / Infra
- **Structure**: use a `infra/` root with reusable modules under `infra/modules/`
  (e.g., `modules/dynamodb-table`, `modules/lambda-function`, `modules/api-gateway`,
  `modules/frontend-hosting`) and environment-specific root configs under
  `infra/envs/dev/` and `infra/envs/prod/` — never define resources directly in an
  environment root when a reusable module makes sense.
- **State**: use a remote backend (S3 + DynamoDB lock table) from the start — never rely
  on local state, even for a solo learning project. Define this backend config explicitly
  per environment.
- **Naming**: prefix all resources with the project and environment, e.g.
  `explorer-dev-zones-table`, `explorer-prod-checkin-fn`, to keep environments and
  resources unambiguous in the AWS console and in `terraform plan` output.
- **Variables**: no hardcoded values in `.tf` files for anything environment-specific
  (region, account ID, domain names, table names) — use `variables.tf` +
  `terraform.tfvars` per environment.
- **IAM**: grant least-privilege permissions with explicit `aws_iam_policy_document` data
  sources scoped to specific resource ARNs — never use `Resource = "*"` or wildcard
  actions unless justified in a comment.
- **Lambda packaging**: use `archive_file` data source or a build step (e.g., esbuild)
  to package TypeScript Lambdas before referencing the zip in `aws_lambda_function` —
  don't commit built artifacts to the repo.
- **Formatting/validation**: assume `terraform fmt` and `terraform validate` must pass;
  write HCL accordingly (consistent indentation, no unused variables).
- **Tagging**: tag every resource (`Project = "explorer"`, `Environment = var.environment`)
  for cost tracking, since this is a learning project and cost visibility matters.
- **Versioning**: pin the Terraform version and AWS provider version explicitly in a
  `required_providers`/`required_version` block — don't leave these unconstrained.

## Security & Privacy Notes
- Location data is sensitive — never log raw lat/lng in plaintext logs beyond what's
  needed for debugging; consider truncating precision in logs.
- Auth on every API endpoint that reads/writes user data — no anonymous check-ins.
- Rate-limit check-in endpoints (API Gateway throttling or a Lambda-side check) to
  prevent spoofed rapid-fire zone claiming.

## What NOT to do
- Don't introduce Google Maps/Firebase — this project intentionally stays AWS-native.
- Don't add a traditional server (Express on EC2/ECS) unless explicitly discussed —
  the architecture is serverless-first for cost and learning purposes.
- Don't use raw lat/lng equality or tiny-radius circles for "new place" detection —
  always go through the geohash/H3 zone abstraction.
- Don't mix Options API and Composition API in the same component.
- Don't introduce CDK, SAM, or Serverless Framework alongside Terraform — Terraform is
  the single source of truth for infrastructure.

## Current Project Phase
Check the README or `/docs/roadmap.md` for the current phase (Phase 0: map + live
location prototype, Phase 1: auth + hosting, Phase 2: check-in/scoring, etc.) before
suggesting features from a later phase.