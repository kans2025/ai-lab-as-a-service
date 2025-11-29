import { AzureFunction, Context, HttpRequest } from "@azure/functions";

const httpTrigger: AzureFunction = async (
  context: Context,
  req: HttpRequest
): Promise<void> => {
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

  context.res = {
    status: 200,
    jsonBody: tiers
  };
};

export default httpTrigger;

