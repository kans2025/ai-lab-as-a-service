const API_BASE = import.meta.env.VITE_API_BASE_URL;
const DEMO_USER_ID =
  import.meta.env.VITE_DEMO_USER_ID || "student1@demo";

const defaultHeaders: HeadersInit = {
  "Content-Type": "application/json",
  "x-demo-user-id": DEMO_USER_ID
};

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function getTiers() {
  const res = await fetch(`${API_BASE}/tiers`);
  return handle<any[]>(res);
}

export async function getPlans() {
  const res = await fetch(`${API_BASE}/plans`);
  return handle<any[]>(res);
}

export async function createSubscription(planCode: string) {
  const res = await fetch(`${API_BASE}/subscriptions`, {
    method: "POST",
    headers: defaultHeaders,
    body: JSON.stringify({ planCode })
  });
  return handle<{
    subscriptionId: string;
    status: string;
    payment: any;
  }>(res);
}

export async function getSubscriptions() {
  const res = await fetch(`${API_BASE}/subscriptions`, {
    headers: defaultHeaders
  });
  return handle<any[]>(res);
}

export async function simulatePayment(subscriptionId: string) {
  const res = await fetch(`${API_BASE}/payment/webhook`, {
    method: "POST",
    headers: defaultHeaders,
    body: JSON.stringify({
      subscriptionId,
      userId: DEMO_USER_ID
    })
  });
  return handle<any>(res);
}

export async function createLab(
  subscriptionId: string,
  displayName: string
) {
  const res = await fetch(`${API_BASE}/labs`, {
    method: "POST",
    headers: defaultHeaders,
    body: JSON.stringify({ subscriptionId, displayName })
  });
  return handle<any>(res);
}

export async function getLabs() {
  const res = await fetch(`${API_BASE}/labs`, {
    headers: defaultHeaders
  });
  return handle<any[]>(res);
}
