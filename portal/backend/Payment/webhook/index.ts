import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { getAllPlans } from "../../shared/planRepo";
import {
  getSubscriptionsForUserCosmos,
  activateSubscriptionCosmos
} from "../../shared/subscriptionRepo";

const httpTrigger: AzureFunction = async (
  context: Context,
  req: HttpRequest
): Promise<void> => {
  try {
    const { subscriptionId, userId } = req.body || {};
    if (!subscriptionId || !userId) {
      context.res = {
        status: 400,
        body: "subscriptionId and userId are required"
      };
      return;
    }

    const subs = await getSubscriptionsForUserCosmos(userId);
    const sub = subs.find((s) => s.subscriptionId === subscriptionId);
    if (!sub) {
      context.res = { status: 404, body: "Subscription not found" };
      return;
    }

    const plans = await getAllPlans();
    const plan = plans.find((p) => p.planCode === sub.planCode);
    if (!plan) {
      context.res = {
        status: 500,
        body: "Plan not found for subscription"
      };
      return;
    }

    // In real life: validate payment provider signature & status here
    const updated = await activateSubscriptionCosmos({
      userId,
      subscriptionId,
      plan
    });

    context.res = { status: 200, jsonBody: updated };
  } catch (err: any) {
    context.log.error(err);
    context.res = {
      status: 500,
      body: err.message || "Error processing payment webhook"
    };
  }
};

export default httpTrigger;

