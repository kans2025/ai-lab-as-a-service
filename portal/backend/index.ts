import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext
} from "@azure/functions";
import { getAllPlans } from "./shared/planRepo";
import {
  createSubscriptionCosmos,
  getSubscriptionsForUserCosmos,
  getSubscriptionByIdCosmos,
  activateSubscriptionCosmos,
  addLabToSubscriptionCosmos
} from "./shared/subscriptionRepo";
import { createLabCosmos, getLabsForUserCosmos } from "./shared/labRepo";
import { getUserIdFromReq } from "./shared/authUtils";
import { Subscription } from "./shared/types";
import { DefaultAzureCredential } from "@azure/identity";
import { ResourceManagementClient } from "@azure/arm-resources";
import { v4 as uuid } from "uuid";

const azureSubId = process.env.SUBSCRIPTION_ID; // optional in emulator mode
const location = process.env.DEFAULT_LOCATION || "local-dev";
const enableInfra = process.env.ENABLE_INFRA === "true";

const templateUri =
  "https://raw.githubusercontent.com/<YOUR_ORG>/ai-lab-as-a-service/main/environment-provisioning/bicep/main-lab-deploy.json";

function json(status: number, body: any): HttpResponseInit {
  return {
    status,
    jsonBody: body
  };
}

/* ====== Tiers (static) ====== */

export async function getTiersHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
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

app.http("getTiers", {
  route: "tiers",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: getTiersHandler
});

/* ====== Plans (Cosmos) ====== */

export async function getPlansHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const plans = await getAllPlans();
    return json(200, plans);
  } catch (err: any) {
    context.error(err);
    return json(500, { message: err.message || "Error fetching plans" });
  }
}

app.http("getPlans", {
  route: "plans",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: getPlansHandler
});

/* ====== Subscriptions ====== */

export async function createSubscriptionHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const body = (await req.json()) as any;
    const { planCode } = body || {};

    if (!planCode) {
      return json(400, { message: "planCode is required" });
    }

    const userId = getUserIdFromReq(req);
    const plans = await getAllPlans();
    const plan = plans.find((p) => p.planCode === planCode);

    if (!plan) {
      return json(400, { message: "Plan not found" });
    }

    const subscription: Subscription = await createSubscriptionCosmos({
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
  } catch (err: any) {
    context.error(err);
    return json(500, { message: err.message || "Error creating subscription" });
  }
}

app.http("createSubscription", {
  route: "subscriptions",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: createSubscriptionHandler
});

export async function getSubscriptionsHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const userId = getUserIdFromReq(req);
    const subs = await getSubscriptionsForUserCosmos(userId);
    return json(200, subs);
  } catch (err: any) {
    context.error(err);
    return json(500, { message: err.message || "Error fetching subscriptions" });
  }
}

app.http("getSubscriptions", {
  route: "subscriptions",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: getSubscriptionsHandler
});

/* ====== Payment Webhook (simulated) ====== */

export async function paymentWebhookHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const body = (await req.json()) as any;
    const { subscriptionId, userId } = body || {};

    if (!subscriptionId || !userId) {
      return json(400, {
        message: "subscriptionId and userId are required"
      });
    }

    const subs = await getSubscriptionsForUserCosmos(userId);
    const sub = subs.find((s) => s.subscriptionId === subscriptionId);

    if (!sub) {
      return json(404, { message: "Subscription not found" });
    }

    const plans = await getAllPlans();
    const plan = plans.find((p) => p.planCode === sub.planCode);
    if (!plan) {
      return json(500, {
        message: "Plan not found for subscription"
      });
    }

    const updated = await activateSubscriptionCosmos({
      userId,
      subscriptionId,
      plan
    });

    return json(200, updated);
  } catch (err: any) {
    context.error(err);
    return json(500, { message: err.message || "Error processing payment" });
  }
}

app.http("paymentWebhook", {
  route: "payment/webhook",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: paymentWebhookHandler
});

/* ====== Labs ====== */

export async function createLabHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const body = (await req.json()) as any;
    const { subscriptionId: appSubId, displayName } = body || {};

    if (!appSubId) {
      return json(400, { message: "subscriptionId is required" });
    }

    const userId = getUserIdFromReq(req);
    const sub = await getSubscriptionByIdCosmos(userId, appSubId);

    if (!sub || sub.status !== "Active") {
      return json(400, { message: "Subscription not active" });
    }

    const labId = uuid().split("-")[0];
    const resourceGroupName = `ailab-lab-${sub.tierCode}-${labId}`;

    if (enableInfra) {
      if (!azureSubId) {
        return json(500, { message: "SUBSCRIPTION_ID not configured" });
      }

      const credential = new DefaultAzureCredential();
      const rmClient = new ResourceManagementClient(credential, azureSubId);

      const deploymentName = `lab-${labId}`;
      const parameters = {
        prefix: { value: "ailab" },
        labId: { value: labId },
        tier: { value: sub.tierCode },
        owner: { value: userId }
      };

      await rmClient.deployments.beginCreateOrUpdateAtSubscriptionScopeAndWait(
        deploymentName,
        {
          location,
          properties: {
            mode: "Incremental",
            templateLink: {
              uri: templateUri
            },
            parameters
          }
        }
      );
    } else {
      context.log(
        `ENABLE_INFRA=false → Skipping real Azure deployment for lab ${labId}`
      );
    }

    const labDoc = await createLabCosmos({
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

    await addLabToSubscriptionCosmos({
      userId,
      subscriptionId: appSubId,
      labId
    });

    return json(201, labDoc);
  } catch (err: any) {
    context.error(err);
    return json(500, { message: err.message || "Error creating lab" });
  }
}

app.http("createLab", {
  route: "labs",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: createLabHandler
});

export async function getLabsHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const userId = getUserIdFromReq(req);
    const labs = await getLabsForUserCosmos(userId);
    return json(200, labs);
  } catch (err: any) {
    context.error(err);
    return json(500, { message: err.message || "Error fetching labs" });
  }
}

app.http("getLabs", {
  route: "labs",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: getLabsHandler
});
