"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTiersHandler = getTiersHandler;
exports.getPlansHandler = getPlansHandler;
exports.createSubscriptionHandler = createSubscriptionHandler;
exports.getSubscriptionsHandler = getSubscriptionsHandler;
exports.paymentWebhookHandler = paymentWebhookHandler;
exports.createLabHandler = createLabHandler;
exports.getLabsHandler = getLabsHandler;
const functions_1 = require("@azure/functions");
const planRepo_1 = require("./shared/planRepo");
const subscriptionRepo_1 = require("./shared/subscriptionRepo");
const labRepo_1 = require("./shared/labRepo");
const authUtils_1 = require("./shared/authUtils");
const identity_1 = require("@azure/identity");
const arm_resources_1 = require("@azure/arm-resources");
const uuid_1 = require("uuid");
const azureSubId = process.env.SUBSCRIPTION_ID; // optional in emulator mode
const location = process.env.DEFAULT_LOCATION || "local-dev";
const enableInfra = process.env.ENABLE_INFRA === "true";
const templateUri = "https://raw.githubusercontent.com/<YOUR_ORG>/ai-lab-as-a-service/main/environment-provisioning/bicep/main-lab-deploy.json";
function json(status, body) {
    return {
        status,
        jsonBody: body
    };
}
/* ====== Tiers (static) ====== */
async function getTiersHandler(req, context) {
    const tiers = [
        {
            code: "starter",
            name: "Starter (Student)",
            description: "CPU-only AML, limited AOAI tokens."
        },
        {
            code: "explorer",
            name: "Explorer",
            description: "CPU AML + AI Search, moderate limits."
        },
        {
            code: "pro",
            name: "Pro (Corporate POC)",
            description: "GPU AML, VNET, private endpoints."
        }
    ];
    return json(200, tiers);
}
functions_1.app.http("getTiers", {
    route: "tiers",
    methods: ["GET"],
    authLevel: "anonymous",
    handler: getTiersHandler
});
/* ====== Plans (Cosmos) ====== */
async function getPlansHandler(req, context) {
    try {
        const plans = await (0, planRepo_1.getAllPlans)();
        return json(200, plans);
    }
    catch (err) {
        context.error(err);
        return json(500, { message: err.message || "Error fetching plans" });
    }
}
functions_1.app.http("getPlans", {
    route: "plans",
    methods: ["GET"],
    authLevel: "anonymous",
    handler: getPlansHandler
});
/* ====== Subscriptions ====== */
async function createSubscriptionHandler(req, context) {
    try {
        const body = (await req.json());
        const { planCode } = body || {};
        if (!planCode) {
            return json(400, { message: "planCode is required" });
        }
        const userId = (0, authUtils_1.getUserIdFromReq)(req);
        const plans = await (0, planRepo_1.getAllPlans)();
        const plan = plans.find((p) => p.planCode === planCode);
        if (!plan) {
            return json(400, { message: "Plan not found" });
        }
        const subscription = await (0, subscriptionRepo_1.createSubscriptionCosmos)({
            userId,
            plan
        });
        const payment = {
            provider: "dummy",
            checkoutUrl: `https://example.com/checkout?subId=${subscription.subscriptionId}`
        };
        return json(201, {
            subscriptionId: subscription.subscriptionId,
            status: subscription.status,
            payment
        });
    }
    catch (err) {
        context.error(err);
        return json(500, { message: err.message || "Error creating subscription" });
    }
}
functions_1.app.http("createSubscription", {
    route: "subscriptions",
    methods: ["POST"],
    authLevel: "anonymous",
    handler: createSubscriptionHandler
});
async function getSubscriptionsHandler(req, context) {
    try {
        const userId = (0, authUtils_1.getUserIdFromReq)(req);
        const subs = await (0, subscriptionRepo_1.getSubscriptionsForUserCosmos)(userId);
        return json(200, subs);
    }
    catch (err) {
        context.error(err);
        return json(500, { message: err.message || "Error fetching subscriptions" });
    }
}
functions_1.app.http("getSubscriptions", {
    route: "subscriptions",
    methods: ["GET"],
    authLevel: "anonymous",
    handler: getSubscriptionsHandler
});
/* ====== Payment Webhook (simulated) ====== */
async function paymentWebhookHandler(req, context) {
    try {
        const body = (await req.json());
        const { subscriptionId, userId } = body || {};
        if (!subscriptionId || !userId) {
            return json(400, {
                message: "subscriptionId and userId are required"
            });
        }
        const subs = await (0, subscriptionRepo_1.getSubscriptionsForUserCosmos)(userId);
        const sub = subs.find((s) => s.subscriptionId === subscriptionId);
        if (!sub) {
            return json(404, { message: "Subscription not found" });
        }
        const plans = await (0, planRepo_1.getAllPlans)();
        const plan = plans.find((p) => p.planCode === sub.planCode);
        if (!plan) {
            return json(500, {
                message: "Plan not found for subscription"
            });
        }
        const updated = await (0, subscriptionRepo_1.activateSubscriptionCosmos)({
            userId,
            subscriptionId,
            plan
        });
        return json(200, updated);
    }
    catch (err) {
        context.error(err);
        return json(500, { message: err.message || "Error processing payment" });
    }
}
functions_1.app.http("paymentWebhook", {
    route: "payment/webhook",
    methods: ["POST"],
    authLevel: "anonymous",
    handler: paymentWebhookHandler
});
/* ====== Labs ====== */
async function createLabHandler(req, context) {
    try {
        const body = (await req.json());
        const { subscriptionId: appSubId, displayName } = body || {};
        if (!appSubId) {
            return json(400, { message: "subscriptionId is required" });
        }
        const userId = (0, authUtils_1.getUserIdFromReq)(req);
        const sub = await (0, subscriptionRepo_1.getSubscriptionByIdCosmos)(userId, appSubId);
        if (!sub || sub.status !== "Active") {
            return json(400, { message: "Subscription not active" });
        }
        const labId = (0, uuid_1.v4)().split("-")[0];
        const resourceGroupName = `ailab-lab-${sub.tierCode}-${labId}`;
        if (enableInfra) {
            if (!azureSubId) {
                return json(500, { message: "SUBSCRIPTION_ID not configured" });
            }
            const credential = new identity_1.DefaultAzureCredential();
            const rmClient = new arm_resources_1.ResourceManagementClient(credential, azureSubId);
            const deploymentName = `lab-${labId}`;
            const parameters = {
                prefix: { value: "ailab" },
                labId: { value: labId },
                tier: { value: sub.tierCode },
                owner: { value: userId }
            };
            await rmClient.deployments.beginCreateOrUpdateAtSubscriptionScopeAndWait(deploymentName, {
                location,
                properties: {
                    mode: "Incremental",
                    templateLink: {
                        uri: templateUri
                    },
                    parameters
                }
            });
        }
        else {
            context.log(`ENABLE_INFRA=false → Skipping real Azure deployment for lab ${labId}`);
        }
        const labDoc = await (0, labRepo_1.createLabCosmos)({
            labId,
            subscriptionId: appSubId,
            userId,
            tierCode: sub.tierCode,
            displayName: displayName || `Lab ${labId}`,
            status: "Active",
            createdAt: new Date().toISOString(),
            resourceGroupName,
            location
        });
        await (0, subscriptionRepo_1.addLabToSubscriptionCosmos)({
            userId,
            subscriptionId: appSubId,
            labId
        });
        return json(201, labDoc);
    }
    catch (err) {
        context.error(err);
        return json(500, { message: err.message || "Error creating lab" });
    }
}
functions_1.app.http("createLab", {
    route: "labs",
    methods: ["POST"],
    authLevel: "anonymous",
    handler: createLabHandler
});
async function getLabsHandler(req, context) {
    try {
        const userId = (0, authUtils_1.getUserIdFromReq)(req);
        const labs = await (0, labRepo_1.getLabsForUserCosmos)(userId);
        return json(200, labs);
    }
    catch (err) {
        context.error(err);
        return json(500, { message: err.message || "Error fetching labs" });
    }
}
functions_1.app.http("getLabs", {
    route: "labs",
    methods: ["GET"],
    authLevel: "anonymous",
    handler: getLabsHandler
});
