# mtg-builder

A Magic: The Gathering deck builder. Sign in, search across every published Magic card,
assemble decks with real card images, and save them to your account for later editing.

## Features

- **Secure Authentication**: Email-based sign-up and login via the shared `auth-service`
- **Every Magic Card**: Live search across the entire card catalog via the [Scryfall API](https://scryfall.com/docs/api)
- **Deck Building**: Add/remove cards, track quantities, and see full card art while building
- **Format Rules**: Each deck picks a rule set that is validated as you build:
  - **House** — no rules, anything goes
  - **Standard Constructed** — 60-card minimum, max 4 copies per card (basic lands excepted)
  - **Commander (EDH)** — exactly 100 cards, singleton, one legendary commander, color identity enforced
  - **Limited (Draft & Sealed)** — 40-card minimum
- **Saved Decks**: Browse, edit, and delete your saved decks

## Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for fast build and dev experience
- **React Router** for navigation
- **Custom auth client** for server-managed sessions via the shared `auth-service`
- **CSS Modules** for component-scoped styling
- **Scryfall API** for card search, images, and metadata

### Backend
- **Express.js** with TypeScript
- **Node.js** runtime
- **MongoDB Atlas** for deck storage with custom auth verification (schema-less — decks and their cards are stored as a single embedded document, no migrations needed)

## Getting Started

### Prerequisites
- Node.js 18+ and pnpm 10+
- A MongoDB Atlas connection string

### Installation

1. Clone the repository
2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
	- Create `.env.development` from `.env.development.example`
	- Set `MONGODB_URI` and `JWT_SECRET` for auth-service + Atlas

4. No migrations to run — MongoDB collections are created automatically on first write (see [database/README.md](database/README.md))

5. Start development:
```bash
pnpm dev
```

This runs both the client (port 5173) and server concurrently.

### Build for Production

```bash
pnpm build
```

## Project Structure

```
├── frontend/               # Frontend React application
│   ├── app/                # App root component and routes
│   ├── components/         # Reusable React components (ScreenShell, Header, CardTile, ...)
│   ├── screens/             # Full-page screens
│   │   ├── Auth/           # Authentication screens
│   │   ├── Home/           # Landing/dashboard screen
│   │   ├── Decks/          # Saved decks browser
│   │   ├── DeckBuilder/    # Create/edit a deck, search all cards
│   │   └── Profile/        # User profile screen
│   ├── lib/                # Utilities, auth client, Scryfall client, deck rules, API helpers
│   ├── primitives/         # Basic UI primitives (Button, Input)
│   ├── types/              # Shared TypeScript types
│   └── styles/             # Global stylesheets
├── server/                  # Express backend server (deck CRUD + auth verification)
├── database/                 # MongoDB collection notes (no schema/migrations)
├── package.json
└── vite.config.ts
```

## Development

### Available Scripts

```bash
# Start development (client + server)
pnpm dev

# Start only frontend
pnpm dev:client

# Start only backend
pnpm dev:server

# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Authentication Flow

Authentication is delegated to the standalone `auth-service`:
- Users sign up or log in with email
- OTP verification via email
- HttpOnly JWT session cookie
- User data stored in this app's MongoDB database via auth-service's `ATLAS_URI_MTGBUILDER` connection

See [frontend/screens/Auth/](frontend/screens/Auth/) for the authentication screens.

### Deck Format Rules

Rule validation lives in [frontend/lib/deckRules.ts](frontend/lib/deckRules.ts) and runs
live in the deck builder, surfacing errors without blocking saves (an in-progress deck
can still be saved with validation warnings shown).

### Card Data

Card search, images, and metadata come directly from the public
[Scryfall API](https://scryfall.com/docs/api), which is CORS-enabled for browser use —
see [frontend/lib/scryfall.ts](frontend/lib/scryfall.ts). Only the fields needed to
render a saved deck (name, image, mana cost, type line, oracle text, color identity) are
persisted with the deck in Postgres so a saved deck doesn't require re-fetching every
card from Scryfall on load.

## License

ISC
