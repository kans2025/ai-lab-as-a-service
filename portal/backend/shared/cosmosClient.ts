import { CosmosClient, Database, Container } from "@azure/cosmos";

let client: CosmosClient | undefined;
let database: Database | undefined;

const databaseId = process.env.COSMOS_DB_NAME || "ai-lab-db";

function getClient(): CosmosClient {
  const endpoint = process.env.COSMOS_ENDPOINT;
  const key = process.env.COSMOS_KEY;

  if (!endpoint || !key) {
    throw new Error(
      "Cosmos not configured: COSMOS_ENDPOINT and COSMOS_KEY must be set in environment."
    );
  }

  if (!client) {
    client = new CosmosClient({ endpoint, key });
  }
  return client;
}

export async function getDatabase(): Promise<Database> {
  if (!database) {
    const c = getClient();
    const { database: db } = await c.databases.createIfNotExists({
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
