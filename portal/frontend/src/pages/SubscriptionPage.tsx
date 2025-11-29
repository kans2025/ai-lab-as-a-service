import React, { useEffect, useState } from "react";
import { getSubscriptions } from "../services/apiClient";

export const SubscriptionsPage: React.FC = () => {
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getSubscriptions();
        setSubs(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <p>Loading subscriptions...</p>;

  return (
    <div>
      <h2>My Subscriptions</h2>
      {subs.length === 0 && <p>No subscriptions yet.</p>}
      {subs.map((s) => (
        <div key={s.subscriptionId} className="subscription-card">
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <strong>{s.planCode}</strong>{" "}
              <span
                className={
                  "status-pill " +
                  (s.status === "Active"
                    ? "active"
                    : s.status === "PendingPayment"
                    ? "pending"
                    : "")
                }
              >
                {s.status}
              </span>
            </div>
            <div>
              Credits: {s.creditsRemaining}/{s.creditsPurchased}
            </div>
          </div>
          <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
            Tier: {s.tierCode} | Currency: {s.currency}
          </div>
          {s.expiresAt && (
            <div style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>
              Expires at: {new Date(s.expiresAt).toLocaleString()}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
