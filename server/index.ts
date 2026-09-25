import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config as loadEnv } from "dotenv";
import { ObjectId } from "mongodb";
import { getDb } from "./lib/db";
import { authCookieName, verifyAuthToken } from "./lib/authVerify";

loadEnv({ path: ".env.development" });
loadEnv();

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

// In production, restrict CORS to known frontend origins only.
// ALLOWED_ORIGINS is a comma-separated list set via Cloud Run env var.
// In dev, all origins are allowed for convenience.
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : null;

app.use(
  cors({
    origin: allowedOrigins
      ? (origin, callback) => {
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error(`CORS: origin ${origin} not allowed`));
          }
        }
      : true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "5mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, message: "Backend server is running" });
});

type AuthenticatedUser = {
  id: string;
  email: string;
};

// auth-service issues the token, but users live in this same MongoDB database (auth-service's
// mongo store creates the `users` collection itself — see database/README.md), so we check
// authVersion here for immediate revocation (e.g. right after a password change) instead of
// trusting the token until it expires.
async function getAuthenticatedUserFromCookie(req: express.Request): Promise<AuthenticatedUser | null> {
  const token = req.cookies?.[authCookieName] as string | undefined;
  if (!token) return null;

  try {
    const payload = verifyAuthToken(token);
    if (!ObjectId.isValid(payload.sub)) return null;

    const db = await getDb();
    const user = await db
      .collection<{ _id: ObjectId; email: string; authVersion: number }>("users")
      .findOne({ _id: new ObjectId(payload.sub) });

    if (!user || user.authVersion !== payload.tokenVersion) {
      return null;
    }

    return { id: String(user._id), email: user.email };
  } catch {
    return null;
  }
}

const VALID_FORMATS = new Set(["house", "standard", "commander", "limited"]);

type DeckCardDoc = {
  scryfallId: string;
  name: string;
  quantity: number;
  manaCost: string | null;
  cmc: number | null;
  typeLine: string | null;
  oracleText: string | null;
  colorIdentity: string[];
  imageUrl: string | null;
  isCommander: boolean;
};

type DeckDoc = {
  _id: ObjectId;
  userId: string;
  name: string;
  format: string;
  description: string | null;
  cards: DeckCardDoc[];
  createdAt: Date;
  updatedAt: Date;
};

function normalizeCards(input: unknown): DeckCardDoc[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((raw): DeckCardDoc | null => {
      const card = raw as Record<string, unknown>;
      const scryfallId = typeof card.scryfallId === "string" ? card.scryfallId : "";
      const name = typeof card.name === "string" ? card.name : "";
      if (!scryfallId || !name) return null;

      const quantity = Number(card.quantity);

      return {
        scryfallId,
        name,
        quantity: Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1,
        manaCost: typeof card.manaCost === "string" ? card.manaCost : null,
        cmc: typeof card.cmc === "number" ? card.cmc : null,
        typeLine: typeof card.typeLine === "string" ? card.typeLine : null,
        oracleText: typeof card.oracleText === "string" ? card.oracleText : null,
        colorIdentity: Array.isArray(card.colorIdentity)
          ? card.colorIdentity.filter((c): c is string => typeof c === "string")
          : [],
        imageUrl: typeof card.imageUrl === "string" ? card.imageUrl : null,
        isCommander: Boolean(card.isCommander),
      };
    })
    .filter((c): c is DeckCardDoc => c !== null);
}

function toDeckResponse(deck: DeckDoc) {
  return {
    id: String(deck._id),
    name: deck.name,
    format: deck.format,
    description: deck.description,
    created_at: deck.createdAt,
    updated_at: deck.updatedAt,
    cards: [...deck.cards].sort((a, b) => Number(b.isCommander) - Number(a.isCommander) || a.name.localeCompare(b.name)),
  };
}

// List the current user's decks (summary only — no card list, for a fast deck browser).
app.get("/api/decks", async (req, res) => {
  try {
    const user = await getAuthenticatedUserFromCookie(req);
    if (!user) {
      res.status(401).json({ ok: false, error: "Unauthorized" });
      return;
    }

    const db = await getDb();
    const decks = await db
      .collection<DeckDoc>("decks")
      .aggregate([
        { $match: { userId: user.id } },
        {
          $project: {
            name: 1,
            format: 1,
            description: 1,
            createdAt: 1,
            updatedAt: 1,
            card_count: { $size: "$cards" },
            total_cards: { $sum: "$cards.quantity" },
          },
        },
        { $sort: { updatedAt: -1 } },
      ])
      .toArray();

    res.json({
      ok: true,
      data: decks.map((deck) => ({
        id: String(deck._id),
        name: deck.name,
        format: deck.format,
        description: deck.description,
        created_at: deck.createdAt,
        updated_at: deck.updatedAt,
        card_count: deck.card_count,
        total_cards: deck.total_cards,
      })),
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ ok: false, error: error?.message ?? "Could not load decks" });
  }
});

app.get("/api/decks/:id", async (req, res) => {
  try {
    const user = await getAuthenticatedUserFromCookie(req);
    if (!user) {
      res.status(401).json({ ok: false, error: "Unauthorized" });
      return;
    }

    if (!ObjectId.isValid(req.params.id)) {
      res.status(404).json({ ok: false, error: "Deck not found" });
      return;
    }

    const db = await getDb();
    const deck = await db
      .collection<DeckDoc>("decks")
      .findOne({ _id: new ObjectId(req.params.id), userId: user.id });

    if (!deck) {
      res.status(404).json({ ok: false, error: "Deck not found" });
      return;
    }

    res.json({ ok: true, data: toDeckResponse(deck) });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ ok: false, error: error?.message ?? "Could not load deck" });
  }
});

app.post("/api/decks", async (req, res) => {
  try {
    const user = await getAuthenticatedUserFromCookie(req);
    if (!user) {
      res.status(401).json({ ok: false, error: "Unauthorized" });
      return;
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const format = typeof body.format === "string" ? body.format : "house";
    const description = typeof body.description === "string" ? body.description : null;
    const cards = normalizeCards(body.cards);

    if (!name) {
      res.status(400).json({ ok: false, error: "Deck name is required" });
      return;
    }
    if (!VALID_FORMATS.has(format)) {
      res.status(400).json({ ok: false, error: "Invalid deck format" });
      return;
    }

    const db = await getDb();
    const now = new Date();
    const deck: Omit<DeckDoc, "_id"> = {
      userId: user.id,
      name,
      format,
      description,
      cards,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection<DeckDoc>("decks").insertOne(deck as DeckDoc);

    res.status(201).json({ ok: true, data: toDeckResponse({ ...deck, _id: result.insertedId }) });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ ok: false, error: error?.message ?? "Could not create deck" });
  }
});

app.put("/api/decks/:id", async (req, res) => {
  try {
    const user = await getAuthenticatedUserFromCookie(req);
    if (!user) {
      res.status(401).json({ ok: false, error: "Unauthorized" });
      return;
    }

    if (!ObjectId.isValid(req.params.id)) {
      res.status(404).json({ ok: false, error: "Deck not found" });
      return;
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const format = typeof body.format === "string" ? body.format : "house";
    const description = typeof body.description === "string" ? body.description : null;
    const cards = normalizeCards(body.cards);

    if (!name) {
      res.status(400).json({ ok: false, error: "Deck name is required" });
      return;
    }
    if (!VALID_FORMATS.has(format)) {
      res.status(400).json({ ok: false, error: "Invalid deck format" });
      return;
    }

    const db = await getDb();
    const deckId = new ObjectId(req.params.id);

    const result = await db.collection<DeckDoc>("decks").findOneAndUpdate(
      { _id: deckId, userId: user.id },
      { $set: { name, format, description, cards, updatedAt: new Date() } },
      { returnDocument: "after" }
    );

    if (!result) {
      res.status(404).json({ ok: false, error: "Deck not found" });
      return;
    }

    res.json({ ok: true, data: toDeckResponse(result) });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ ok: false, error: error?.message ?? "Could not update deck" });
  }
});

app.delete("/api/decks/:id", async (req, res) => {
  try {
    const user = await getAuthenticatedUserFromCookie(req);
    if (!user) {
      res.status(401).json({ ok: false, error: "Unauthorized" });
      return;
    }

    if (!ObjectId.isValid(req.params.id)) {
      res.status(404).json({ ok: false, error: "Deck not found" });
      return;
    }

    const db = await getDb();
    const result = await db
      .collection<DeckDoc>("decks")
      .deleteOne({ _id: new ObjectId(req.params.id), userId: user.id });

    if (result.deletedCount === 0) {
      res.status(404).json({ ok: false, error: "Deck not found" });
      return;
    }

    res.json({ ok: true });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ ok: false, error: error?.message ?? "Could not delete deck" });
  }
});

app.listen(PORT, () => {
  console.log(`mtg-builder API listening on port ${PORT}`);
});
