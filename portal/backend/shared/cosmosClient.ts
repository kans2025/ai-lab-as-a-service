import { CosmosClient, Database, Container } from "@azure/cosmos";

const endpoint = process.env.COSMOS_ENDPOINT!;
const key = process.env.COSMOS_KEY!;
const databaseId = process.env.COSMOS_DB_NAME || "ai-lab-db";

if (!endpoint || !key) {
  console.warn(
    "COSMOS_ENDPOINT or COSMOS_KEY not set. Cosmos operations will fail."
  );
}

const client = new CosmosClient({ endpoint, key });
let database: Database;

export async function getDatabase(): Promise<Database> {
  if (!database) {
    const { database: db } = await client.databases.createIfNotExists({
      id: databaseId
    });
    database = db;
  }
  return database;
}

export async function getContainer(containerId: string): Promise<Container> {
  const db = await getDatabase();
  const { container } = await db.containers.createIfNotExists({
    id: containerId
  });
  return container;
}

