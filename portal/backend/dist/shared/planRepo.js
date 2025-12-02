"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllPlans = getAllPlans;
const cosmosClient_1 = require("./cosmosClient");
const containerName = process.env.COSMOS_PLANS_CONTAINER || "plans";
async function getAllPlans() {
    const container = await (0, cosmosClient_1.getContainer)(containerName);
    const query = { query: "SELECT * FROM c" };
    const { resources } = await container.items.query(query).fetchAll();
    return resources;
}
