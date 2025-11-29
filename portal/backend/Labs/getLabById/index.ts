import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { getLabByIdCosmos } from "../../shared/labRepo";
import { getUserIdFromReq } from "../../shared/authUtils";

const httpTrigger: AzureFunction = async (
  context: Context,
  req: HttpRequest
): Promise<void> => {
  try {
    const labId = context.bindingData.labId as string;
    const userId = getUserIdFromReq(req);

    const lab = await getLabByIdCosmos(labId);
    if (!lab || lab.userId !== userId) {
      context.res = { status: 404, body: "Lab not found" };
      return;
    }

    context.res = { status: 200, jsonBody: lab };
  } catch (err: any) {
    context.log.error(err);
    context.res = {
      status: 500,
      body: err.message || "Error fetching lab"
    };
  }
};

export default httpTrigger;

