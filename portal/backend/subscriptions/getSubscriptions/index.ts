import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { getSubscriptionsForUserCosmos } from "../../shared/subscriptionRepo";
import { getUserIdFromReq } from "../../shared/authUtils";

const httpTrigger: AzureFunction = async (
  context: Context,
  req: HttpRequest
): Promise<void> => {
  try {
    const userId = getUserIdFromReq(req);
    const subs = await getSubscriptionsForUserCosmos(userId);
    context.res = { status: 200, jsonBody: subs };
  } catch (err: any) {
    context.log.error(err);
    context.res = {
      status: 500,
      body: err.message || "Error fetching subscriptions"
    };
  }
};

export default httpTrigger;
