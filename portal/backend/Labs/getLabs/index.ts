import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { getLabsForUserCosmos } from "../../shared/labRepo";
import { getUserIdFromReq } from "../../shared/authUtils";

const httpTrigger: AzureFunction = async (
  context: Context,
  req: HttpRequest
): Promise<void> => {
  try {
    const userId = getUserIdFromReq(req);
    const labs = await getLabsForUserCosmos(userId);
    context.res = { status: 200, jsonBody: labs };
  } catch (err: any) {
    context.log.error(err);
    context.res = {
      status: 500,
      body: err.message || "Error fetching labs"
    };
  }
};

export default httpTrigger;

