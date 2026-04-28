# Fix: "Sign-in is forbidden by browser"

## What's actually happening

The "Sign-in failed" toast you saw comes from the Google OAuth flow in `Navbar.tsx`. Two things commonly cause this in the Lovable preview iframe:

1. **Iframe/popup restrictions** — the preview runs your app inside an iframe at `id-preview--…lovable.app`. Browsers (especially Safari/Chrome with strict tracking protection) block third-party cookies and cross-origin redirects initiated from inside an iframe, which breaks the OAuth redirect handshake.
2. **Preview fetch proxy** — the preview environment intercepts some POST requests, which can break the auth token exchange even when the redirect itself succeeds.

Both are environment-level issues, not bugs in your code. Google sign-in will work normally on the **published** URL and on a real custom domain.

## Immediate workarounds (no code change)

- Open the preview in a new tab using the "Open in new tab" button in the preview toolbar, then sign in there. That escapes the iframe and usually fixes it.
- Or publish the project once and test sign-in on the published URL.

## Code change: add Email + Password sign-in as the primary path

Right now the only way into the app is Google OAuth via the OAuth broker, which is the most fragile path inside the iframe. We'll add native email/password auth (works fully inside the iframe, no redirects, no third-party cookies) and keep Google as a secondary option.

### Files to add

1. **`src/routes/auth.tsx`** — a dedicated `/auth` page with two tabs:
   - **Sign in**: email + password → `supabase.auth.signInWithPassword`
   - **Sign up**: email + password (+ optional username) → `supabase.auth.signUp` with `emailRedirectTo: window.location.origin`
   - A "Continue with Google" button that calls the existing `lovable.auth.signInWithOAuth("google", …)` flow
   - On success, navigate back to `/`
   - Friendly error handling for the common cases (invalid credentials, email already registered, email not confirmed)

### Files to edit

2. **`src/components/Navbar.tsx`**
   - Replace the inline Google "Sign in" button with a `<Link to="/auth">Sign in</Link>` button, so users land on the dedicated page instead of triggering OAuth from inside the iframe.
   - Keep the avatar + sign-out UI for authenticated users unchanged.

3. **`src/components/ShareMomentDialog.tsx`** (and any other place that gates an action behind auth)
   - When the user is not signed in, show a toast with a link to `/auth` instead of silently failing.

### Backend / Supabase changes

4. **Auth settings**: enable email/password sign-in and **disable "Confirm email"** for now so new users can sign in immediately after signup (we can re-enable this later when you set up a custom email domain). I'll do this via the auth-config tool.

   - We'll also enable HIBP leaked-password protection at the same time (recommended security default).

5. No schema changes needed — the existing `handle_new_user` trigger already creates a `profiles` row from the email's local-part when there's no Google `name` claim, so email signups will get a profile automatically.

## What this gives you

- A reliable sign-in path that works inside the Lovable preview iframe (no OAuth redirect, no popups, no third-party cookies).
- Google OAuth still available for users who want it, and it will work normally on your published URL.
- Clear `/auth` route you can link to from anywhere in the app.

## What I will NOT change

- The chess game, Share Moment dialog content, feed, likes, or comments logic.
- The existing Supabase tables, RLS policies, or triggers.
- The `lovable.auth` Google integration files (auto-generated).

Approve this and I'll implement it in one pass.