import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";
import { ResourceManagementClient } from "@azure/arm-resources";
import { v4 as uuid } from "uuid";
import {
  getSubscriptionByIdCosmos,
  addLabToSubscriptionCosmos
} from "../../shared/subscriptionRepo";
import { createLabCosmos } from "../../shared/labRepo";
import { getUserIdFromReq } from "../../shared/authUtils";

const azureSubId = process.env.SUBSCRIPTION_ID!;
const location = process.env.DEFAULT_LOCATION || "eastus";

// TODO: Build Bicep to ARM and host JSON in GitHub/Storage, then update this URI
const templateUri =
  "https://raw.githubusercontent.com/<YOUR_GITHUB_ORG>/ai-lab-as-a-service/main/environment-provisioning/bicep/main-lab-deploy.json";

const httpTrigger: AzureFunction = async (
  context: Context,
  req: HttpRequest
): Promise<void> => {
  try {
    const { subscriptionId: appSubId, displayName } = req.body || {};
    if (!appSubId) {
      context.res = { status: 400, body: "subscriptionId is required" };
      return;
    }

    const userId = getUserIdFromReq(req);
    const sub = await getSubscriptionByIdCosmos(userId, appSubId);

    if (!sub || sub.status !== "Active") {
      context.res = { status: 400, body: "Subscription not active" };
      return;
    }

    const labId = uuid().split("-")[0];
    const resourceGroupName = `ailab-lab-${sub.tierCode}-${labId}`;

    const credential = new DefaultAzureCredential();
    const rmClient = new ResourceManagementClient(credential, azureSubId);

    const deploymentName = `lab-${labId}`;
    const parameters = {
      prefix: { value: "ailab" },
      labId: { value: labId },
      tier: { value: sub.tierCode },
      owner: { value: userId }
      // For Pro tier, you can also pass vnetResourceId, subnetName
    };

    await rmClient.deployments.beginCreateOrUpdateAtSubscriptionScopeAndWait(
      deploymentName,
      {
        location,
        templateLink: {
          uri: templateUri
        },
        parameters
      }
    );

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

    context.res = {
      status: 201,
      jsonBody: labDoc
    };
  } catch (err: any) {
    context.log.error(err);
    context.res = { status: 500, body: err.message || "Error creating lab" };
  }
};

export default httpTrigger;

