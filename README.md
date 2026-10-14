# mtg-builder

A Magic: The Gathering deck builder. Sign in, search across every published Magic card,
assemble decks with real card images, and save them to your account for later editing.

## Demos
- demo coming soon!

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

## Scope

This app does not track your total card collection. It is designed to help you save,
edit, and delete deck lists, including the cards and quantities in each deck, so you can
experiment with deck combinations while keeping a record of the decks you have built.
You are responsible for building decks from the cards available to you.

Checking whether multiple decks can be played at the same time based on your collection
is a possible future feature, but it is not in scope right now. That would require
tracking which cards you own and their quantities, then checking whether those cards
are available in sufficient quantities across the decks you want to use together.

## Design
- no figma wireframes at this moment

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

The frontend and backend deploy separately. Profile support requires deploying the
updated backend to Cloud Run, not just rebuilding the Cloudflare Pages frontend.
The backend image includes both `server/` and `shared/` for the profile validator.
To check that the profile route is deployed, request `/api/profile` on the backend
without a session: it should return a JSON `401 Unauthorized`, not an HTML `404`.

## Project Structure

```
├── frontend/               # Frontend React application
│   ├── app/                # App root component and routes
│   ├── assets/             # NCC flag and favicon assets
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

### Branding Assets

The header flag is imported from [frontend/assets/flag.jpg](frontend/assets/flag.jpg).
The flag and footer NCC link both open https://ncc.lnks.rip in a new tab.
The home screen, My Decks screen, and deck builder pages hide the header flag, leaving only the Profile
link at the top right.
The profile page shows only the NCC flag in its header.

Vite serves [frontend/assets/favicon/](frontend/assets/favicon/) as its public directory
and copies its contents unchanged to the production build root. The HTML includes
SVG, ICO, and PNG browser icons, an Apple touch icon, and a web app manifest with
Android icons. Keep the manifest icon paths relative to the site root.

### Profile

The profile page has three sidebar sections: **Identity**, **Update Profile**, and
**About**. Identity shows the account email, app-specific username, and email
verification status. Update Profile saves the username in this app's MongoDB
`profiles` collection and provides password changes and sign-out controls.
Signing out redirects to the sign-in page. Home, My Decks, deck builder, and all
profile sections require a signed-in session; signed-out visits redirect to sign-in.
Sign-up and password-recovery routes remain public. About describes MTG Builder
and links to NCC.

Profile updates do not modify auth-service account data. No profile photo, birthday,
or display name is stored. Passwords and sessions remain managed by auth-service.

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
