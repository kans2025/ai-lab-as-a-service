"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabase = getDatabase;
exports.getContainer = getContainer;
const cosmos_1 = require("@azure/cosmos");
let client;
let database;
const databaseId = process.env.COSMOS_DB_NAME || "ai-lab-db";
function getClient() {
    const endpoint = process.env.COSMOS_ENDPOINT;
    const key = process.env.COSMOS_KEY;
    if (!endpoint || !key) {
        throw new Error("Cosmos not configured: COSMOS_ENDPOINT and COSMOS_KEY must be set in environment.");
    }
    if (!client) {
        client = new cosmos_1.CosmosClient({ endpoint, key });
    }
    return client;
}
async function getDatabase() {
    if (!database) {
        const c = getClient();
        const { database: db } = await c.databases.createIfNotExists({
            id: databaseId
        });
        database = db;
    }
    return database;
}
async function getContainer(containerId) {
    const db = await getDatabase();
    const { container } = await db.containers.createIfNotExists({
        id: containerId
    });
    return container;
}
