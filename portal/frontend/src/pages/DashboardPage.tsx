import React from "react";

export const DashboardPage: React.FC = () => {
  return (
    <div>
      <h2>Welcome to AI Lab as a Service (POC)</h2>
      <p>
        This portal lets you purchase prepaid AI lab plans and automatically
        provision Azure-based lab environments.
      </p>
      <ul>
        <li>Browse <strong>Tiers & Plans</strong> to see what’s available.</li>
        <li>Buy a plan to create a <strong>subscription</strong>.</li>
        <li>After payment (simulated here), a <strong>lab</strong> is created via Bicep.</li>
        <li>Check <strong>Subscriptions</strong> & <strong>Labs</strong> to view your resources.</li>
      </ul>
    </div>
  );
};
