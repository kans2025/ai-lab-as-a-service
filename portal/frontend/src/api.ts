const API_BASE = "http://localhost:7071/api";

export type Tier = {
  code: string;
  name: string;
  description: string;
};

export type Plan = {
  planCode: string;
  tierCode: string;
  name: string;
  credits: number;
  priceCurrency: string;
  priceAmount: number;
  validityDays: number;
};

export type Subscription = {
  subscriptionId: string;
  planCode: string;
  tierCode: string;
  status: string;
  creditsRemaining: number;
  creditsPurchased: number;
  currency: string;
  amountPaid: number;
  createdAt: string;
};

export type Lab = {
  labId: string;
  subscriptionId: string;
  tierCode: string;
  displayName: string;
  status: string;
  createdAt: string;
};

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  console.log("API request:", url, options);

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-demo-user-id": "user1",
      ...(options.headers || {})
    }
  });

  const contentType = res.headers.get("content-type") || "";
  console.log("API response:", url, res.status, contentType);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      text || `Request failed: ${res.status} for ${url}`
    );
  }

  if (!contentType.includes("application/json")) {
    const text = await res.text();
    throw new Error(
      `Expected JSON but got content-type "${contentType}" from ${url}. Response: ${text.slice(
        0,
        120
      )}`
    );
  }

  return (await res.json()) as T;
}


export const getTiers = () => api<Tier[]>("/tiers");
export const getPlans = () => api<Plan[]>("/plans");
// rest unchanged

export const createSubscription = (planCode: string) =>
  api<{ subscriptionId: string; status: string; payment: any }>(
    "/subscriptions",
    {
      method: "POST",
      body: JSON.stringify({ planCode })
    }
  );

export const simulatePaymentAndActivate = (
  subscriptionId: string,
  userId: string
) =>
  api("/payment/webhook", {
    method: "POST",
    body: JSON.stringify({ subscriptionId, userId })
  });

export const getSubscriptions = () => api<Subscription[]>("/subscriptions");

export const createLab = (subscriptionId: string, displayName?: string) =>
  api<Lab>("/labs", {
    method: "POST",
    body: JSON.stringify({ subscriptionId, displayName })
  });

export const getLabs = () => api<Lab[]>("/labs");
