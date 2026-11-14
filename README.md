# SkillLearn

SkillLearn is a personal skill-tracking web app for self-learners. It gives you one place to list the skills you want to learn, like a programming language, a spoken language or a design tool, record how far along you are, and see your overall progress at a glance.

Each user has a private account. Their skills and profile are visible only to them.

## Features

- **Accounts**: registration with email verification, login, sign-out, and password reset by email.
- **Dashboard**: shows Total Skills, In Progress, Completed and Overall Progress, plus a Skills Overview of recently updated skills.
- **Skill management**: create, view, edit and delete skills. Deleting asks for confirmation first.
- **Skill fields**: name, category, an optional description, an optional target completion date, and progress.
- **Manual progress tracking**: progress is a whole number from 0 to 100 that you set yourself. Status comes from progress: 0 is Not Started, 1–99 is In Progress, and 100 is Completed.
- **Fixed categories**: Programming, Languages, Design, Productivity and Business.
- **Search and filters**: search the Skills list and filter it by status.
- **Profile**: change your display name in Settings. The sidebar and Dashboard greeting update right away.
- **Themes**: light and dark themes, saved in the browser.
- **Responsive layout**: a sidebar on desktop and a bottom navigation bar on mobile.

## Technology Stack

| Area | Technology |
| --- | --- |
| Framework | [TanStack Start](https://tanstack.com/start) v1 (React 19, file-based routing with TanStack Router) |
| Build tool | Vite, configured through `@lovable.dev/vite-tanstack-config` |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 with design tokens in `src/styles.css` |
| UI components | shadcn/ui-style components built on Radix UI primitives, plus `lucide-react` icons |
| Data fetching | TanStack Query |
| Forms and validation | React Hook Form and Zod |
| Notifications | Sonner |
| Backend | Lovable Cloud (Supabase): a PostgreSQL database and authentication |
| Database client | `@supabase/supabase-js`, used from the browser with Row Level Security |
| Testing | Vitest, Testing Library and jsdom |
| Linting and formatting | ESLint and Prettier |

## Project Structure

```text
.
├── drizzle/migrations/        SQL migrations for the database schema (managed by Lovable)
├── public/                    Static files (favicon, robots.txt)
├── supabase/config.toml       Backend project configuration (generated)
├── src/
│   ├── components/            App components (app shell, auth layout, skill dialogs, skill UI)
│   │   └── ui/                Reusable UI primitives (buttons, dialogs, inputs, ...)
│   ├── hooks/                 Shared React hooks
│   ├── integrations/supabase/ Generated backend client and database types. Do not edit by hand.
│   ├── lib/                   App logic: auth helpers, form validation, skill data access, theme
│   ├── routes/                File-based routes
│   │   ├── __root.tsx         Root layout (HTML shell, theme, toasts, app shell for signed-in screens)
│   │   ├── auth.tsx           Login (/auth)
│   │   ├── register.tsx       Registration
│   │   ├── forgot-password.tsx / reset-password.tsx
│   │   └── _authenticated/    Signed-in screens: Dashboard (/), Skills, skill details, Settings
│   ├── test/                  Vitest test files
│   ├── router.tsx             Router setup
│   ├── start.ts / server.ts   TanStack Start server entry and middleware
│   └── styles.css             Tailwind setup and theme tokens
├── vite.config.ts
└── vitest.config.ts
```

`src/routeTree.gen.ts` is generated from the files in `src/routes/` and should not be edited by hand.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20.19+ or 22.12+ (required by Vite) with npm, or [Bun](https://bun.sh/). The repository includes a `bun.lock` lockfile.
- Access to the project's Lovable Cloud backend. The app needs its URL and publishable key.

### Clone and install

```sh
git clone <this-repository-url>
cd <repository-name>
npm install        # or: bun install
```

### Run locally

```sh
npm run dev        # or: bun run dev
```

Vite prints the local address when the server starts.

### Environment variables

The app reads its backend connection from a `.env` file in the project root. Lovable Cloud provides this file:

| Variable | Used by |
| --- | --- |
| `VITE_SUPABASE_URL` | Browser: backend URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Browser: publishable (public) API key |
| `VITE_SUPABASE_PROJECT_ID` | Browser: backend project identifier |
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_PROJECT_ID` | Server-side rendering fallbacks |

These are publishable values that are safe in browser code. Never commit private keys, such as a service-role key, to the repository.

### Other scripts

| Command | Description |
| --- | --- |
| `npm run build` | Production build |
| `npm run build:dev` | Build in development mode |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm run format` | Format the code with Prettier |

## Database and Authentication

### Tables

- **`profiles`**: one row per user (`id`, `display_name`, timestamps). `id` references the authentication user. A database trigger (`on_auth_user_created`) creates the row at signup using the display name from registration. Clients can't insert profiles directly.
- **`skills`**: the user's skills (`name`, `category`, `description`, `target_completion_date`, `progress`, timestamps). `user_id` references `profiles.id`.

The database enforces these rules with CHECK constraints:

- Names can't be blank.
- `progress` must be between 0 and 100.
- `category` must be one of the five allowed values.

Status and Dashboard metrics are calculated from `progress` and aren't stored. A trigger keeps the `updated_at` timestamps current.

### Row Level Security

RLS is on for both tables, and only signed-in users have access:

- **`profiles`**: users can view and update only their own row.
- **`skills`**: users can view, create, update and delete only rows where `user_id` matches their own user ID.

Signed-out requests can't read or change any data.

### Authentication

- Sign-in uses Lovable Cloud email and password authentication.
- Email verification is required. The auth server doesn't create a session until the email address is confirmed.
- Signed-in screens are under `src/routes/_authenticated/`. A route guard checks the current user and sends signed-out visitors to `/auth`.
- Password reset links open `/reset-password`, where the user sets a new password and returns to Login.
- The app reads and writes data from the browser using the user's own session, so Row Level Security separates each user's data.

## Testing

Tests use **Vitest** with Testing Library and a jsdom environment (see `vitest.config.ts`). Test files are in `src/test/` and cover:

- auth form validation
- recovery link detection
- skill form validation and status rules
- Dashboard metric calculations
- display name rules
- route matching

```sh
npm test               # run all tests once (vitest run)
npm run test:watch     # run in watch mode
```

## Deployment

SkillLearn is built and hosted with [Lovable](https://lovable.dev). Publish the app from the Lovable editor with **Publish**. The production build uses TanStack Start with Nitro, and the default target is an edge runtime (Cloudflare Workers), as configured by `@lovable.dev/vite-tanstack-config`.

Database changes apply to the Lovable Cloud backend directly. App code changes go live only when the app is published.

For self-hosting, see Lovable's [self-hosting guide](https://docs.lovable.dev/tips-tricks/self-hosting).

## Future Improvements

These are ideas only and are not implemented:

- A "resend verification email" option on the login screen.
- Deleting a skill straight from the Skills list, without opening its details first.
- Sorting the Skills list by name, progress or target date.
- Reminders for target completion dates that are coming up.

## License

No license has been specified for this project.
