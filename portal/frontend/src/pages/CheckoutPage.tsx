import React, { useState } from "react";
import {
  createSubscription,
  simulatePayment,
  createLab
} from "../services/apiClient";

type CheckoutPageProps = {
  planCode: string;
  onBack: () => void;
  onDone: () => void;
};

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  planCode,
  onBack,
  onDone
}) => {
  const [status, setStatus] =
    useState<"idle" | "processing" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [lab, setLab] = useState<any | null>(null);

  const handleCheckout = async () => {
    setStatus("processing");
    setError(null);
    try {
      // 1. Create subscription (PendingPayment)
      const sub = await createSubscription(planCode);
      setSubscriptionId(sub.subscriptionId);

      // 2. Simulate payment webhook (activates subscription)
      await simulatePayment(sub.subscriptionId);

      // 3. Create lab using this subscription
      const labResult = await createLab(sub.subscriptionId, "My First Lab");
      setLab(labResult);

      setStatus("done");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong");
      setStatus("error");
    }
  };

  return (
    <div>
      <h2>Checkout</h2>
      <p>
        Plan: <strong>{planCode}</strong>
      </p>
      <p>
        In this POC, payment is simulated. In a real deployment, this step
        would redirect you to a payment provider and then call a secure
        webhook.
      </p>

      {status === "idle" && (
        <button className="primary" onClick={handleCheckout}>
          Simulate Purchase & Create Lab
        </button>
      )}

      {status === "processing" && <p>Processing...</p>}

      {status === "error" && (
        <p style={{ color: "red" }}>
          Error: {error}{" "}
          <button onClick={handleCheckout}>Try again</button>
        </p>
      )}

      {status === "done" && (
        <div>
          <p>
            Subscription ID: <code>{subscriptionId}</code>
          </p>
          {lab && (
            <p>
              Lab created: <strong>{lab.displayName}</strong> (
              <code>{lab.labId}</code>)
            </p>
          )}
          <button onClick={onBack}>Back to Tiers</button>{" "}
          <button onClick={onDone}>Go to Dashboard</button>
        </div>
      )}
    </div>
  );
};
