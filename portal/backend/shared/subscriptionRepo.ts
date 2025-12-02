import { getContainer } from "./cosmosClient";
import { Subscription } from "./types";
import { v4 as uuid } from "uuid";

const containerName =
  process.env.COSMOS_SUBSCRIPTIONS_CONTAINER || "subscriptions";

type SubscriptionDoc = Subscription & { id: string };

export async function createSubscriptionCosmos(args: {
  userId: string;
  plan: {
    planCode: string;
    tierCode: string;
    credits: number;
    priceCurrency: string;
    priceAmount: number;
    validityDays: number;
  };
}): Promise<Subscription> {
  const { userId, plan } = args;
  const container = await getContainer(containerName);
  const now = new Date().toISOString();
  const subscriptionId = uuid();

  const subscription: Subscription = {
    subscriptionId,
    userId,
    planCode: plan.planCode,
    tierCode: plan.tierCode,
    status: "PendingPayment",
    creditsPurchased: plan.credits,
    creditsRemaining: plan.credits,
    currency: plan.priceCurrency,
    amountPaid: 0,
    createdAt: now,
    labs: []
  };

  const doc: SubscriptionDoc = {
    id: subscriptionId,
    ...subscription
  };

  await container.items.create(doc);
  return subscription;
}

export async function getSubscriptionsForUserCosmos(
  userId: string
): Promise<Subscription[]> {
  const container = await getContainer(containerName);
  const query = {
    query: "SELECT * FROM c WHERE c.userId = @userId",
    parameters: [{ name: "@userId", value: userId }]
  };
  const { resources } =
    await container.items.query<Subscription>(query).fetchAll();
  return resources;
}

export async function getSubscriptionByIdCosmos(
  userId: string,
  subscriptionId: string
): Promise<Subscription | null> {
  const container = await getContainer(containerName);
  try {
    const { resource } = await container
      .item(subscriptionId, userId)
      .read<SubscriptionDoc>();
    return (resource as SubscriptionDoc) || null;
  } catch {
    return null;
  }
}

export async function activateSubscriptionCosmos(args: {
  userId: string;
  subscriptionId: string;
  plan: { priceAmount: number; validityDays: number };
}): Promise<Subscription> {
  const { userId, subscriptionId, plan } = args;
  const container = await getContainer(containerName);

  const { resource: existing } = await container
    .item(subscriptionId, userId)
    .read<SubscriptionDoc>();

  if (!existing) throw new Error("Subscription not found");

  const now = new Date();
  const expiry = new Date(now);
  expiry.setDate(expiry.getDate() + (plan.validityDays || 30));

  existing.status = "Active";
  existing.amountPaid = plan.priceAmount;
  (existing as any).activatedAt = now.toISOString();
  (existing as any).expiresAt = expiry.toISOString();

  const { resource: updated } = await container.items.upsert<SubscriptionDoc>(
    existing
  );

  if (!updated) throw new Error("Failed to update subscription");

  return updated as Subscription;
}

export async function addLabToSubscriptionCosmos(args: {
  userId: string;
  subscriptionId: string;
  labId: string;
}): Promise<void> {
  const { userId, subscriptionId, labId } = args;
  const container = await getContainer(containerName);

  const { resource: existing } = await container
    .item(subscriptionId, userId)
    .read<SubscriptionDoc>();

  if (!existing) throw new Error("Subscription not found");

  existing.labs = existing.labs || [];
  if (!existing.labs.includes(labId)) {
    existing.labs.push(labId);
  }

  await container.items.upsert(existing);
}
