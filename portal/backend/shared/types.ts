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
  audience?: "student" | "corporate" | "both";
};

export type SubscriptionStatus =
  | "PendingPayment"
  | "Active"
  | "Suspended"
  | "Expired"
  | "Cancelled";

export type Subscription = {
  subscriptionId: string;
  userId: string;
  planCode: string;
  tierCode: string;
  status: SubscriptionStatus;
  creditsPurchased: number;
  creditsRemaining: number;
  currency: string;
  amountPaid: number;
  createdAt: string;
  activatedAt?: string;
  expiresAt?: string;
  labs: string[];
};

export type Lab = {
  labId: string;
  subscriptionId: string;
  userId: string;
  tierCode: string;
  displayName: string;
  status: string;
  createdAt: string;
  resourceGroupName?: string;
  location?: string;
};

