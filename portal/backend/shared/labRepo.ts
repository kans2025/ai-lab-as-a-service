import { getContainer } from "./cosmosClient";
import { Lab } from "./types";

const containerName = process.env.COSMOS_LABS_CONTAINER || "labs";

type LabDoc = Lab & { id: string };

export async function createLabCosmos(lab: Lab): Promise<Lab> {
  const container = await getContainer(containerName);
  const doc: LabDoc = {
    id: lab.labId,
    ...lab
  };
  await container.items.create(doc);
  return lab;
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
