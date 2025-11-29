import React, { useEffect, useState } from "react";
import { getTiers, getPlans } from "../services/apiClient";

type TiersPageProps = {
  onBuyPlan: (planCode: string) => void;
};

export const TiersPage: React.FC<TiersPageProps> = ({ onBuyPlan }) => {
  const [tiers, setTiers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [t, p] = await Promise.all([getTiers(), getPlans()]);
        setTiers(t);
        setPlans(p);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const plansByTier = plans.reduce((acc: any, plan: any) => {
    acc[plan.tierCode] = acc[plan.tierCode] || [];
    acc[plan.tierCode].push(plan);
    return acc;
  }, {});

  if (loading) return <p>Loading tiers and plans...</p>;

  return (
    <div>
      <h2>Tiers & Plans</h2>
      {tiers.map((tier) => (
        <div key={tier.code} className="tier-card">
          <h3>{tier.name}</h3>
          <p>{tier.description}</p>
          <h4>Available Plans</h4>
          <div className="plans">
            {(plansByTier[tier.code] || []).map((plan: any) => (
              <div key={plan.planCode} className="plan-card">
                <h5>{plan.name}</h5>
                <p>Credits: {plan.credits}</p>
                <p>
                  Price: {plan.priceCurrency} {plan.priceAmount}
                </p>
                <p>Validity: {plan.validityDays} days</p>
                <button
                  className="primary"
                  onClick={() => onBuyPlan(plan.planCode)}
                >
                  Select plan
                </button>
              </div>
            ))}
            {(!plansByTier[tier.code] ||
              plansByTier[tier.code].length === 0) && (
              <p>No plans defined for this tier yet.</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
