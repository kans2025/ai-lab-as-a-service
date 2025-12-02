"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSubscriptionCosmos = createSubscriptionCosmos;
exports.getSubscriptionsForUserCosmos = getSubscriptionsForUserCosmos;
exports.getSubscriptionByIdCosmos = getSubscriptionByIdCosmos;
exports.activateSubscriptionCosmos = activateSubscriptionCosmos;
exports.addLabToSubscriptionCosmos = addLabToSubscriptionCosmos;
const cosmosClient_1 = require("./cosmosClient");
const uuid_1 = require("uuid");
const containerName = process.env.COSMOS_SUBSCRIPTIONS_CONTAINER || "subscriptions";
async function createSubscriptionCosmos(args) {
    const { userId, plan } = args;
    const container = await (0, cosmosClient_1.getContainer)(containerName);
    const now = new Date().toISOString();
    const subscriptionId = (0, uuid_1.v4)();
    const subscription = {
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
    const doc = {
        id: subscriptionId,
        ...subscription
    };
    await container.items.create(doc);
    return subscription;
}
async function getSubscriptionsForUserCosmos(userId) {
    const container = await (0, cosmosClient_1.getContainer)(containerName);
    const query = {
        query: "SELECT * FROM c WHERE c.userId = @userId",
        parameters: [{ name: "@userId", value: userId }]
    };
    const { resources } = await container.items.query(query).fetchAll();
    return resources;
}
async function getSubscriptionByIdCosmos(userId, subscriptionId) {
    const container = await (0, cosmosClient_1.getContainer)(containerName);
    try {
        const { resource } = await container
            .item(subscriptionId, userId)
            .read();
        return resource || null;
    }
    catch {
        return null;
    }
}
async function activateSubscriptionCosmos(args) {
    const { userId, subscriptionId, plan } = args;
    const container = await (0, cosmosClient_1.getContainer)(containerName);
    const { resource: existing } = await container
        .item(subscriptionId, userId)
        .read();
    if (!existing)
        throw new Error("Subscription not found");
    const now = new Date();
    const expiry = new Date(now);
    expiry.setDate(expiry.getDate() + (plan.validityDays || 30));
    existing.status = "Active";
    existing.amountPaid = plan.priceAmount;
    existing.activatedAt = now.toISOString();
    existing.expiresAt = expiry.toISOString();
    const { resource: updated } = await container.items.upsert(existing);
    if (!updated)
        throw new Error("Failed to update subscription");
    return updated;
}
async function addLabToSubscriptionCosmos(args) {
    const { userId, subscriptionId, labId } = args;
    const container = await (0, cosmosClient_1.getContainer)(containerName);
    const { resource: existing } = await container
        .item(subscriptionId, userId)
        .read();
    if (!existing)
        throw new Error("Subscription not found");
    existing.labs = existing.labs || [];
    if (!existing.labs.includes(labId)) {
        existing.labs.push(labId);
    }
    await container.items.upsert(existing);
}
