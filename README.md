Chessunity — Play Chess. Share with community.

## The Idea

Chess has millions of players worldwide, but no dedicated space to share the moments that make the game memorable. Reddit has chess discussion but no board integration. Chess.com has 200M users but no social feed.
**Chessunity is a chess platform built around community.** You play, and when something worth sharing happens like your best genius move or checkmate, you post it — with the actual board position, not just a screenshot. Other players can like it, comment on it, and relive the moment with you.

---

## Features

- **Full chess game** with legal move enforcement — castling, en passant, promotion, checkmate and stalemate detection
- **Pass & Play** mode for two players on one screen
- **Vs Computer** mode powered by Stockfish with Easy, Medium, and Hard difficulty
- **Move history** sidebar with numbered moves
- **Share Moment** — post any board position to the community feed with a caption
- **Community Feed** — browse moments posted by other players, like and comment on them
- **Google sign-in** via Supabase auth
- **Dark / light theme** with a warm parchment and ink design
- **Fully responsive** — works on mobile and desktop

---

## The Market Gap

| Platform | Play | Social Feed | Board Integration |
|---|---|---|---|
| Chess.com | ✅ | ❌ | ❌ |
| Lichess | ✅ | ❌ | ❌ |
| Reddit r/chess | ❌ | ✅ | ❌ |
| **Chessunity** | ✅ | ✅ | ✅ |

---

## How It Was Built

This project was built in under 24 hours for Nfactorial Incubator technical task, using AI-assisted development tools to move fast without sacrificing quality.

**Frontend**
- React 19 + Vite + TanStack Router
- Tailwind CSS v4 with custom design tokens
- shadcn/ui components
- chess.js for game logic and legal move validation
- react-chessboard for the board UI
- Stockfish (WASM) for the AI opponent, running fully in the browser with no server required

**Backend & Auth**
- Supabase for authentication (Google OAuth), database, and storage
- Two tables: `moments` (posts) and `comments`, with row-level security policies
- Real-time like and comment updates

**Development Tools**
- Lovable.dev for AI-assisted scaffolding and rapid UI generation
- VSCode with AI assistant for debugging and feature iteration

---

## Running Locally

```bash
git clone https://github.com/bdamko/chessunity
cd chessunity
npm install
```

Create a `.env` file in the root:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

```bash
npm run dev
```

---

## What's Next
Next plans for development are:
- Real-time multiplayer
- Video recordings of games to share in social platform
- AI coach or real person coach through voice chat for learning chess

---
