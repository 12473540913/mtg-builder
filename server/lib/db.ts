import { config as loadEnv } from "dotenv";
import { MongoClient, type Db } from "mongodb";

loadEnv({ path: ".env.development" });
loadEnv();

const connectionString = process.env.MONGODB_URI;

if (!connectionString) {
  throw new Error("Missing MONGODB_URI. Set it to your MongoDB Atlas connection string.");
}

// Optional — only needed if the connection string doesn't already include a database name.
const dbName = process.env.MONGODB_DB_NAME?.trim() || undefined;

const client = new MongoClient(connectionString);
const ready = client.connect();

export async function getDb(): Promise<Db> {
  await ready;
  return client.db(dbName);
}

export async function closeDbConnection() {
  await client.close();
}
