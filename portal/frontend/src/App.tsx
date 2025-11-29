import React, { useState } from "react";
import { DashboardPage } from "./pages/DashboardPage";
import { TiersPage } from "./pages/TiersPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { SubscriptionsPage } from "./pages/SubscriptionsPage";
import { LabsPage } from "./pages/LabsPage";

type Page = "dashboard" | "tiers" | "checkout" | "subscriptions" | "labs";

function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [selectedPlanCode, setSelectedPlanCode] = useState<string | null>(null);

  const goToCheckout = (planCode: string) => {
    setSelectedPlanCode(planCode);
    setPage("checkout");
  };

  const goHome = () => setPage("dashboard");

  return (
    <div className="app">
      <header className="header">
        <h1>AI Lab as a Service (POC)</h1>
        <div className="nav-buttons">
          <button
            className={page === "dashboard" ? "active" : ""}
            onClick={() => setPage("dashboard")}
          >
            Dashboard
          </button>
          <button
            className={page === "tiers" ? "active" : ""}
            onClick={() => setPage("tiers")}
          >
            Tiers & Plans
          </button>
          <button
            className={page === "subscriptions" ? "active" : ""}
            onClick={() => setPage("subscriptions")}
          >
            Subscriptions
          </button>
          <button
            className={page === "labs" ? "active" : ""}
            onClick={() => setPage("labs")}
          >
            Labs
          </button>
        </div>
      </header>

      <main className="main">
        {page === "dashboard" && <DashboardPage />}
        {page === "tiers" && <TiersPage onBuyPlan={goToCheckout} />}
        {page === "checkout" && selectedPlanCode && (
          <CheckoutPage
            planCode={selectedPlanCode}
            onBack={() => setPage("tiers")}
            onDone={goHome}
          />
        )}
        {page === "subscriptions" && <SubscriptionsPage />}
        {page === "labs" && <LabsPage />}
      </main>
    </div>
  );
}

export default App;
