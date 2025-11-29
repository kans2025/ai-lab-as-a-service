import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { getAllPlans } from "../../shared/planRepo";

const httpTrigger: AzureFunction = async (
  context: Context,
  req: HttpRequest
): Promise<void> => {
  try {
    const plans = await getAllPlans();
    context.res = { status: 200, jsonBody: plans };
  } catch (err: any) {
    context.log.error(err);
    context.res = {
      status: 500,
      body: err.message || "Error fetching plans"
    };
  }
};

export default httpTrigger;

