import { config as loadEnv } from "dotenv";
import { MongoClient, type Db } from "mongodb";
import { setServers } from "node:dns";

loadEnv({ path: ".env.development" });
loadEnv();

const dnsServers = process.env.MONGODB_DNS_SERVERS?.trim();
if (dnsServers) {
  setServers(dnsServers.split(",").map((server) => server.trim()));
}

const connectionString = process.env.MONGODB_URI;

if (!connectionString) {
  throw new Error("Missing MONGODB_URI. Set it to your MongoDB Atlas connection string.");
}

// Optional — only needed if the connection string doesn't already include a database name.
const dbName = process.env.MONGODB_DB_NAME?.trim() || undefined;

const client = new MongoClient(connectionString);

export async function getDb(): Promise<Db> {
  await client.connect();
  return client.db(dbName);
}

export async function closeDbConnection() {
  await client.close();
}
