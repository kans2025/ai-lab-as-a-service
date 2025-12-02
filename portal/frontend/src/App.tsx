import React, { useEffect, useState } from "react";
import {
  getTiers,
  getPlans,
  createSubscription,
  getSubscriptions,
  createLab,
  getLabs,
  simulatePaymentAndActivate,
  Tier,
  Plan,
  Subscription,
  Lab
} from "./api";

type Tab = "tiers" | "subscriptions" | "labs";

const App: React.FC = () => {
  const [tab, setTab] = useState<Tab>("tiers");
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedPlanCode, setSelectedPlanCode] = useState<string | null>(null);

  const userId = "user1"; // matches x-demo-user-id header

  useEffect(() => {
    if (tab === "tiers") {
      loadTiersAndPlans();
    } else if (tab === "subscriptions") {
      loadSubscriptions();
    } else if (tab === "labs") {
      loadLabs();
    }
  }, [tab]);

  async function loadTiersAndPlans() {
    setLoading(true);
    setMessage(null);
    try {
      const [t, p] = await Promise.all([getTiers(), getPlans()]);
      setTiers(t);
      setPlans(p);
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadSubscriptions() {
    setLoading(true);
    setMessage(null);
    try {
      const s = await getSubscriptions();
      setSubs(s);
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadLabs() {
    setLoading(true);
    setMessage(null);
    try {
      const l = await getLabs();
      setLabs(l);
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateSubscription(planCode: string) {
    setLoading(true);
    setMessage(null);
    try {
      const res = await createSubscription(planCode);
      setMessage(
        `Subscription created with ID ${res.subscriptionId}. Simulating payment...`
      );
      await simulatePaymentAndActivate(res.subscriptionId, userId);
      setMessage("Payment simulated and subscription activated.");
      setSelectedPlanCode(null);
      await loadSubscriptions();
      setTab("subscriptions");
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateLab(subscriptionId: string) {
    setLoading(true);
    setMessage(null);
    try {
      const lab = await createLab(subscriptionId, "My AI Lab");
      setMessage(`Lab ${lab.labId} created.`);
      await loadLabs();
      setTab("labs");
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ fontFamily: "system-ui", padding: "1.5rem" }}>
      <h1>AI Lab as a Service – POC</h1>
      <p style={{ color: "#555" }}>
        Cosmos Emulator backend · Azure Functions v4 · Tiered AI Lab control
        plane
      </p>

      <nav style={{ margin: "1rem 0" }}>
        <button
          onClick={() => setTab("tiers")}
          style={{
            marginRight: "0.5rem",
            padding: "0.5rem 1rem",
            background: tab === "tiers" ? "#2563eb" : "#e5e7eb",
            color: tab === "tiers" ? "#fff" : "#111",
            border: "none",
            borderRadius: "0.5rem",
            cursor: "pointer"
          }}
        >
          Tiers & Plans
        </button>
        <button
          onClick={() => setTab("subscriptions")}
          style={{
            marginRight: "0.5rem",
            padding: "0.5rem 1rem",
            background: tab === "subscriptions" ? "#2563eb" : "#e5e7eb",
            color: tab === "subscriptions" ? "#fff" : "#111",
            border: "none",
            borderRadius: "0.5rem",
            cursor: "pointer"
          }}
        >
          Subscriptions
        </button>
        <button
          onClick={() => setTab("labs")}
          style={{
            padding: "0.5rem 1rem",
            background: tab === "labs" ? "#2563eb" : "#e5e7eb",
            color: tab === "labs" ? "#fff" : "#111",
            border: "none",
            borderRadius: "0.5rem",
            cursor: "pointer"
          }}
        >
          Labs
        </button>
      </nav>

      {message && (
        <div
          style={{
            marginBottom: "1rem",
            padding: "0.75rem 1rem",
            background: "#fef9c3",
            borderRadius: "0.5rem",
            border: "1px solid #facc15"
          }}
        >
          {message}
        </div>
      )}

      {loading && <p>Loading...</p>}

      {!loading && tab === "tiers" && (
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          {tiers.map((tier) => (
            <div
              key={tier.code}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "0.75rem",
                padding: "1rem",
                width: "260px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
              }}
            >
              <h2>{tier.name}</h2>
              <p style={{ color: "#555", minHeight: "48px" }}>
                {tier.description}
              </p>
              <h3 style={{ marginTop: "0.5rem" }}>Plans</h3>
              <ul style={{ paddingLeft: "1rem" }}>
                {plans
                  .filter((p) => p.tierCode === tier.code)
                  .map((p) => (
                    <li key={p.planCode} style={{ marginBottom: "0.5rem" }}>
                      <strong>{p.name}</strong>
                      <br />
                      {p.credits} credits · {p.priceCurrency} {p.priceAmount} /{" "}
                      {p.validityDays} days
                      <br />
                      <button
                        onClick={() => handleCreateSubscription(p.planCode)}
                        style={{
                          marginTop: "0.25rem",
                          padding: "0.25rem 0.75rem",
                          borderRadius: "999px",
                          border: "none",
                          background: "#16a34a",
                          color: "#fff",
                          cursor: "pointer"
                        }}
                      >
                        Buy & Activate
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {!loading && tab === "subscriptions" && (
        <div>
          {subs.length === 0 && <p>No subscriptions yet.</p>}
          {subs.map((s) => (
            <div
              key={s.subscriptionId}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "0.75rem",
                padding: "0.75rem 1rem",
                marginBottom: "0.5rem"
              }}
            >
              <div>
                <strong>{s.planCode}</strong> · Tier: {s.tierCode}
              </div>
              <div>Status: {s.status}</div>
              <div>
                Credits: {s.creditsRemaining} / {s.creditsPurchased}
              </div>
              <div>Amount paid: {s.currency} {s.amountPaid}</div>
              {s.status === "Active" && (
                <button
                  onClick={() => handleCreateLab(s.subscriptionId)}
                  style={{
                    marginTop: "0.5rem",
                    padding: "0.25rem 0.75rem",
                    borderRadius: "999px",
                    border: "none",
                    background: "#2563eb",
                    color: "#fff",
                    cursor: "pointer"
                  }}
                >
                  Create Lab
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && tab === "labs" && (
        <div>
          {labs.length === 0 && <p>No labs yet.</p>}
          {labs.map((l) => (
            <div
              key={l.labId}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "0.75rem",
                padding: "0.75rem 1rem",
                marginBottom: "0.5rem"
              }}
            >
              <div>
                <strong>{l.displayName}</strong> ({l.labId})
              </div>
              <div>Tier: {l.tierCode}</div>
              <div>Status: {l.status}</div>
              <div>Subscription: {l.subscriptionId}</div>
              <div>Created: {new Date(l.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default App;
