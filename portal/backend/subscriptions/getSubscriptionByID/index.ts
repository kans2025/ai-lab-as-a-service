import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { getSubscriptionByIdCosmos } from "../../shared/subscriptionRepo";
import { getUserIdFromReq } from "../../shared/authUtils";

const httpTrigger: AzureFunction = async (
  context: Context,
  req: HttpRequest
): Promise<void> => {
  try {
    const subscriptionId = context.bindingData.subscriptionId as string;
    const userId = getUserIdFromReq(req);

    const sub = await getSubscriptionByIdCosmos(userId, subscriptionId);
    if (!sub) {
      context.res = { status: 404, body: "Subscription not found" };
      return;
    }

    context.res = { status: 200, jsonBody: sub };
  } catch (err: any) {
    context.log.error(err);
    context.res = {
      status: 500,
      body: err.message || "Error fetching subscription"
    };
  }
};

export default httpTrigger;

