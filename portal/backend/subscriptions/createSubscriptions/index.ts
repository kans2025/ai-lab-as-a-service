import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { getAllPlans } from "../../shared/planRepo";
import { createSubscriptionCosmos } from "../../shared/subscriptionRepo";
import { getUserIdFromReq } from "../../shared/authUtils";

const httpTrigger: AzureFunction = async (
  context: Context,
  req: HttpRequest
): Promise<void> => {
  try {
    const { planCode } = req.body || {};
    if (!planCode) {
      context.res = { status: 400, body: "planCode is required" };
      return;
    }

    const userId = getUserIdFromReq(req);
    const plans = await getAllPlans();
    const plan = plans.find((p) => p.planCode === planCode);

    if (!plan) {
      context.res = { status: 400, body: "Plan not found" };
      return;
    }

    const subscription = await createSubscriptionCosmos({ userId, plan });

    const payment = {
      provider: "dummy",
      checkoutUrl: `https://example.com/checkout?subId=${subscription.subscriptionId}`
    };

    context.res = {
      status: 201,
      jsonBody: {
        subscriptionId: subscription.subscriptionId,
        status: subscription.status,
        payment
      }
    };
  } catch (err: any) {
    context.log.error(err);
    context.res = {
      status: 500,
      body: err.message || "Error creating subscription"
    };
  }
};

export default httpTrigger;

