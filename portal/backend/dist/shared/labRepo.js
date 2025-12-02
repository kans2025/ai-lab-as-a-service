"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLabCosmos = createLabCosmos;
exports.getLabsForUserCosmos = getLabsForUserCosmos;
const cosmosClient_1 = require("./cosmosClient");
const containerName = process.env.COSMOS_LABS_CONTAINER || "labs";
async function createLabCosmos(lab) {
    const container = await (0, cosmosClient_1.getContainer)(containerName);
    const doc = {
        id: lab.labId,
        ...lab
    };
    await container.items.create(doc);
    return lab;
}
async function getLabsForUserCosmos(userId) {
    const container = await (0, cosmosClient_1.getContainer)(containerName);
    const query = {
        query: "SELECT * FROM c WHERE c.userId = @userId",
        parameters: [{ name: "@userId", value: userId }]
    };
    const { resources } = await container.items.query(query).fetchAll();
    return resources;
}
