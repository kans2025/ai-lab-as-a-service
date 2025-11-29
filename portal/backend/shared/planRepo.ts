import { getContainer } from "./cosmosClient";
import { Plan } from "./types";

const containerName = process.env.COSMOS_PLANS_CONTAINER || "plans";

export async function getAllPlans(): Promise<Plan[]> {
  const container = await getContainer(containerName);
  const query = { query: "SELECT * FROM c" };
  const { resources } = await container.items.query<Plan>(query).fetchAll();
  return resources;
}

// Optional admin helper
export async function upsertPlan(plan: Plan): Promise<void> {
  const container = await getContainer(containerName);
  const doc = {
    id: plan.planCode,
    ...plan
  };
  await container.items.upsert(doc);
}

