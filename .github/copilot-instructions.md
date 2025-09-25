# Copilot Instructions for Tuitora (Next.js)

## Project Overview
- **Framework:** Next.js (TypeScript)
- **UI:** React, Tailwind CSS
- **State Management:** React Contexts (see `src/contexts/`)
- **Backend:** Supabase (auth, database)
- **SMS/USSD:** Integrations via `src/lib/africastalking.ts` and API routes in `src/pages/api/sms/` and `src/pages/api/ussd/`

## Key Architectural Patterns
- **Pages:** All routes are in `src/pages/`. API endpoints live under `src/pages/api/`.
- **Components:** Shared UI in `src/components/` and `src/components/ui/`. Dashboard variants in `src/components/dashboards/`.
- **Hooks:** Custom hooks in `src/hooks/` (e.g., `useAuth`, `useStudents`).
- **Contexts:** App-wide state (auth, data, modals) in `src/contexts/`.
- **Types:** Centralized in `src/types/`.
- **Lib:** External service logic (Supabase, AfricasTalking) in `src/lib/`.

## Developer Workflows
- **Start Dev Server:** `npm run dev` (see README)
- **Build:** `npm run build`
- **Lint:** `npm run lint` (uses ESLint config)
- **Format:** `npm run format` (if configured)
- **Supabase:** DB migrations in `supabase/migrations/`. Use Supabase CLI for DB ops.

## Conventions & Patterns
- **TypeScript:** Use explicit types for props, context, and API responses.
- **Auth:** Use `useAuth` for authentication logic. User objects follow the `AppUser` type.
- **API Routes:** Use Next.js API routes for backend logic. Organize by domain (e.g., `sms/`, `ussd/`).
- **Modals:** Centralized modal management via `ModalManager` and `ModalContext`.
- **Dashboards:** Role-based dashboards in `src/components/dashboards/`.
- **Styling:** Tailwind CSS utility classes. Global styles in `src/styles/globals.css`.

## Integration Points
- **Supabase:** Auth/session in `useAuth.ts`, DB queries in hooks and API routes.
- **AfricasTalking:** SMS/USSD logic in `src/lib/africastalking.ts` and related API routes.

## Examples
- **User Auth:** See `src/hooks/useAuth.ts` for session, sign-in, sign-up, and profile linking.
- **Bulk SMS:** See `src/pages/api/sms/bulk.ts` and `SendBulkSMSModal.tsx`.
- **Attendance:** See `src/hooks/useAttendance.ts` and `MarkAttendanceModal.tsx`.

## Tips for AI Agents
- Always use existing hooks and contexts for state and data access.
- Follow the file structure for new features (e.g., new modals in `src/components/modals/`).
- Prefer API routes for backend logic, not direct DB calls from components.
- Use centralized types from `src/types/`.
- Reference the README for basic commands and Next.js conventions.

---
If any section is unclear or missing, please request clarification or provide feedback for improvement.