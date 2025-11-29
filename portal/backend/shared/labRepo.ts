import { getContainer } from "./cosmosClient";
import { Lab } from "./types";

const containerName = process.env.COSMOS_LABS_CONTAINER || "labs";

export async function createLabCosmos(lab: Lab): Promise<Lab> {
  const container = await getContainer(containerName);
  const doc = {
    id: lab.labId,
    ...lab
  };
  const { resource } = await container.items.create(doc, {
    partitionKey: lab.subscriptionId
  });
  return resource as Lab;
}

export async function getLabsForUserCosmos(
  userId: string
): Promise<Lab[]> {
  const container = await getContainer(containerName);
  const query = {
    query: "SELECT * FROM c WHERE c.userId = @userId",
    parameters: [{ name: "@userId", value: userId }]
  };
  const { resources } = await container.items.query<Lab>(query).fetchAll();
  return resources;
}

export async function getLabByIdCosmos(
  labId: string
): Promise<Lab | null> {
  const container = await getContainer(containerName);
  const query = {
    query: "SELECT * FROM c WHERE c.labId = @labId",
    parameters: [{ name: "@labId", value: labId }]
  };
  const { resources } = await container.items.query<Lab>(query).fetchAll();
  return resources[0] || null;
}

