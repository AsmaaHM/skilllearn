<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- The app shell (desktop sidebar + mobile bottom nav) wraps `<Outlet />` in `src/routes/__root.tsx`; screens render only their content. Why: one consistent layout across all screens.
- Skill screens read placeholder data from `src/lib/skills-data.ts` until storage exists. Why: one swap point when a backend is added.
- Theme (light/dark) is a `.dark` class on `<html>`, set by `src/lib/theme.tsx` plus a pre-hydration script. Why: avoids a light flash for dark-theme users.
- Profiles are created only by the `on_auth_user_created` trigger (no client INSERT grant); `skills.user_id` references `profiles.id`, not `auth.users`. Why: guarantees one profile per user and keeps app tables off the auth schema.
- Allowed skill categories are enforced by a CHECK constraint on `skills.category`; change the constraint and the UI list together. Why: the database is the source of truth for the fixed list.
