# Database

MongoDB (Atlas) for mtg-builder — no migrations, no fixed schema, and collections are
created automatically on first write. That's the "hands-off" NoSQL tradeoff: fewer moving
parts to set up, less rigid structure to maintain as the app evolves.

## Collections

### `users` (owned by the shared `auth-service`)

Created and written to by `auth-service`'s Mongo store, not by this app. This app's server
only *reads* it (see [server/index.ts](../server/index.ts)) to verify a session's
`authVersion` still matches the token, for immediate revocation on password change. See
`../../auth-service/src/store/mongo.ts` for the exact document shape.

### `decks` (owned by this app)

One document per deck. Cards are embedded directly in the deck document — no join/lookup
needed to render a full deck, which is the main advantage of modeling it this way in Mongo
rather than mirroring the old relational `decks` + `deck_cards` split.

```jsonc
{
  "_id": ObjectId,
  "userId": "<auth-service user id, as a string>",
  "name": "Boros Aggro",
  "format": "standard", // "house" | "standard" | "commander" | "limited"
  "description": "optional text",
  "cards": [
    {
      "scryfallId": "...",
      "name": "Lightning Bolt",
      "quantity": 4,
      "manaCost": "{R}",
      "cmc": 1,
      "typeLine": "Instant",
      "oracleText": "...",
      "colorIdentity": ["R"],
      "imageUrl": "https://...",
      "isCommander": false
    }
  ],
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

## Recommended indexes

Not required to run the app (Mongo works fine without them at small scale), but worth
adding once you have real usage:

```js
db.decks.createIndex({ userId: 1, updatedAt: -1 });
```

Connect with `mongosh "$MONGODB_URI"` and run the command above, or add it to a one-off
setup script if you prefer to automate it.
