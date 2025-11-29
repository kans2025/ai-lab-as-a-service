import { AzureFunction, Context, HttpRequest } from "@azure/functions";

const httpTrigger: AzureFunction = async (
  context: Context,
  req: HttpRequest
): Promise<void> => {
  const labId = context.bindingData.labId as string;

  // POC: static data – later: query Cost Mgmt + AOAI logs.
  context.res = {
    status: 200,
    jsonBody: {
      labId,
      currency: "USD",
      totalCost: 1.23,
      byService: [
        { service: "Azure OpenAI", cost: 0.7 },
        { service: "Azure ML", cost: 0.4 },
        { service: "Storage", cost: 0.13 }
      ],
      tokens: {
        inputTokens: 10000,
        outputTokens: 8000
      },
      creditsRemaining: 90
    }
  };
};

export default httpTrigger;

