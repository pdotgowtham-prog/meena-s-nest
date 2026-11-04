# Pregnancy Journal

A calm, couple-focused pregnancy journey PWA. The application source is public; pregnancy records and uploaded files remain private behind Supabase Auth, workspace membership, Row Level Security and a private Storage bucket.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS 4
- Supabase Auth, PostgreSQL, RLS and private Storage
- Zod validation, Recharts and Vitest
- Self-hosted Fraunces and DM Sans fonts via Fontsource packages
- INR, DD-MM-YYYY date display and Asia/Kolkata date calculations

## Independent infrastructure

This repository is connected only to the dedicated Supabase project:

- Project: **meenas-nest**
- Project ref: **bhnqcxmusrxqmtkftxwp**
- Region: Mumbai (**ap-south-1**)
- Private bucket: **pregnancy-vault**

Do not connect this app to AVI or any other app's Supabase project. Never put a service-role key, secret key, VAPID private key or private pregnancy information in this public repository.

## Local setup

Requirements: Node.js 20.19+ and npm.

    git clone https://github.com/pdotgowtham-prog/meena-s-nest.git
    cd meena-s-nest
    npm install
    cp .env.example .env
    npm run dev

The current .env.example contains only this project's URL and a browser-safe publishable key. It is safe for the client bundle; never add a Supabase secret/service-role key to a VITE_ variable.

## Supabase Auth URL configuration

In the Supabase Dashboard for this project:

1. Open Authentication → URL Configuration.
2. Set the local Site URL to http://localhost:5173.
3. Add http://localhost:5173/** and your deployed HTTPS origin as redirect URLs.
4. Keep email confirmation enabled for real accounts. Configure SMTP before relying on production email delivery.
5. Never disable RLS to make a client query work.

## Database migrations

The migrations in supabase/migrations are the source-of-truth schema history. They create:

- Workspaces, workspace members and email-bound partner invitations.
- One pregnancy profile per workspace (editable baby's name, LMP and EDD).
- Expense records in INR.
- Document metadata and a private Storage bucket.
- Membership-based RLS policies and an invite-acceptance RPC.

When using the Supabase CLI, link only this project's ref and apply the migrations:

    npx supabase login
    npx supabase link --project-ref bhnqcxmusrxqmtkftxwp
    npx supabase db push

If applying SQL manually, use the ordered migration files. Do not run migrations against the AVI project.

## Couple workspace invitations

The workspace owner can create a seven-day invite link for the partner's email address. The raw token is generated in the browser, only its SHA-256 hash is stored in Postgres, and acceptance requires an authenticated account whose email exactly matches the invitation. The link is shared by the owner; automatic email delivery is not configured in this foundation.

The invitation token is an access credential. Share it only with the intended partner. It is not pregnancy/medical data, but treat it as confidential.

## Private document vault

The pregnancy-vault bucket is private. Files are stored under <workspace UUID>/<random file name>. RLS policies on storage.objects check active workspace membership for listing, upload, download, update and deletion. The client only creates short-lived signed URLs after an authorised metadata query.

Allowed formats: PDF, JPEG, PNG and WEBP. Maximum file size: 10 MB.

## Commands

    npm run dev       # local development
    npm run build     # TypeScript check and production build
    npm test          # date and schema validation tests
    npm run preview   # preview production build

## Privacy model

- Public repository, private application data.
- Authenticated membership is required for all workspace data.
- RLS is enabled on every public application table.
- Soft deletion is used for application records.
- No analytics, advertising pixels or third-party trackers.
- No medical information is written into URLs, logs or notification payloads.
- Private documents are not cached by the service worker.
- APP_NAME is defined once in src/constants/app.ts; baby's name is stored as editable profile data.

## Current foundation scope

Implemented: authentication UI, private workspace creation, partner invite links, editable LMP/EDD/baby-name profile, dashboard, INR expenses, private document vault, responsive navigation, original SVG nest illustrations and PWA shell.

Not yet part of this foundation: doctor directory, visits, vitals trends, calendar export, Web Push, cron reminders and appointment timeline. These are reserved for Phase 4 after foundation acceptance.

## Medical note

This app is an organisational record keeper, not a diagnostic tool or medical device. It does not interpret symptoms, test results or vital signs. Follow the advice of qualified healthcare professionals.
