# TripPlanner

TripPlanner is an Nx monorepo containing an Angular frontend and a NestJS API.

## Applications

- `front-end` — Angular 21 application with Angular Material, NgRx Signals, Leaflet, and Ukrainian/English localization. It communicates only with the Nest API.
- `api` — NestJS 11 API that owns all Supabase authentication and database access.

## Requirements

- Node.js 24 or a version supported by Angular 21
- npm
- Supabase project credentials for the API

## Install

Install all workspace dependencies from the repository root:

```bash
npm install
```

## Configure the API

Copy the example environment file:

```bash
cp apps/api/.env.example apps/api/.env
```

On PowerShell:

```powershell
Copy-Item apps/api/.env.example apps/api/.env
```

Then provide the server-side Supabase credentials in `apps/api/.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-publishable-key
FRONTEND_ORIGIN=http://localhost:4200
```

The service-role key must remain private. Local `.env` files are excluded from Git.

Apply `supabase/migrations/202607210001_initial_trip_planner.sql` to the Supabase project before running the frontend. This creates the application tables, indexes, triggers, realtime publication entries, and Row Level Security policies. Enable the Google auth provider and add the local and deployed frontend URLs to the Supabase redirect allow list if Google login is required.

## Run locally

Start the frontend at <http://localhost:4200>:

```bash
npm start
```

Start the API at <http://localhost:3000/api>:

```bash
npm run start:api
```

Run the localized frontend:

```bash
npm run serve:uk
npm run serve:en
```

## Build and test

```bash
# Angular production build
npm run build

# NestJS API build
npm run build:api

# API unit tests
npm run test:api

# Frontend lint
npm run lint
```

The frontend lint target is configured, but the existing frontend source currently has unresolved formatting and lint violations.

## Nx commands

The npm scripts wrap these Nx targets:

```bash
npx nx serve front-end
npx nx build front-end
npx nx serve api
npx nx build api
npx nx test api
npx nx graph
```

## Workspace structure

```text
apps/
  front-end/   Angular application
  api/         NestJS API
nx.json        Nx workspace configuration
package.json   Shared dependencies and commands
```

`SupabaseModule` exports a request-scoped `SupabaseClient` that API providers inject with the `SUPABASE_CLIENT` token. The frontend must not import the Supabase SDK or access Supabase directly. Authentication is proxied through `/api/auth/*`; authenticated entity CRUD is exposed through `/api/data/*`. The frontend stores the returned session locally and sends its access token to the API as a bearer token. Entity lists refresh through API polling.

## Current state

- Nx recognizes both `front-end` and `api`.
- Frontend development and production builds succeed.
- API build succeeds.
- API unit tests pass.
- Supabase API configuration is loaded from environment variables.
- Supabase SQL migrations, entities, authentication, and RLS policies are defined under `supabase/migrations`.
- All browser-side data and authentication requests go through the Nest API.
- Google Maps short-link resolution is provided by the Nest API.
- Frontend lint runs but reports existing source-formatting violations.
