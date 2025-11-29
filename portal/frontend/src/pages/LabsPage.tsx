import React, { useEffect, useState } from "react";
import { getLabs } from "../services/apiClient";

export const LabsPage: React.FC = () => {
  const [labs, setLabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getLabs();
        setLabs(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <p>Loading labs...</p>;

  return (
    <div>
      <h2>My Labs</h2>
      {labs.length === 0 && <p>No labs created yet.</p>}
      {labs.map((lab) => (
        <div key={lab.labId} className="lab-card">
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <strong>{lab.displayName}</strong>{" "}
              <span className="status-pill active">{lab.status}</span>
            </div>
            <div style={{ fontSize: "0.85rem" }}>Tier: {lab.tierCode}</div>
          </div>
          <div style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>
            Lab ID: <code>{lab.labId}</code>
          </div>
          {lab.resourceGroupName && (
            <div style={{ fontSize: "0.8rem" }}>
              RG: <code>{lab.resourceGroupName}</code>
            </div>
          )}
          {lab.location && (
            <div style={{ fontSize: "0.8rem" }}>
              Location: {lab.location.toUpperCase()}
            </div>
          )}
          <div style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>
            Created at:{" "}
            {lab.createdAt
              ? new Date(lab.createdAt).toLocaleString()
              : "N/A"}
          </div>
        </div>
      ))}
    </div>
  );
};
