import { useEffect, useMemo, useState } from "react";
import { getHarvestYields } from "../api/adminApi";

const numberFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 });

export default function AnalyticsPage() {
  const [rows, setRows] = useState([]);
  const [cropFilter, setCropFilter] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHarvestYields()
      .then(setRows)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const crops = useMemo(() => [...new Set(rows.map((r) => r.cropName))].sort(), [rows]);

  const filtered = useMemo(
    () => (cropFilter ? rows.filter((r) => r.cropName === cropFilter) : rows),
    [rows, cropFilter]
  );

  // Total yield per field, across all seasons in the current filter
  const byField = useMemo(() => {
    const totals = new Map();
    for (const r of filtered) {
      const existing = totals.get(r.fieldId) ?? { fieldName: r.fieldName, total: 0 };
      existing.total += r.totalYield;
      totals.set(r.fieldId, existing);
    }
    return [...totals.entries()]
      .map(([fieldId, v]) => ({ fieldId, ...v }))
      .sort((a, b) => b.total - a.total);
  }, [filtered]);

  const grandTotal = byField.reduce((sum, f) => sum + f.total, 0);
  const maxTotal = byField.length ? byField[0].total : 0;

  if (loading) return <p>Loading analytics...</p>;

  return (
    <div className="analytics-page">
      <h1>Historical Production Trends</h1>
      {error && <p className="error">{error}</p>}

      {!error && rows.length === 0 && (
        <p>No harvest data recorded yet. Once harvests are logged, yields will appear here.</p>
      )}

      {rows.length > 0 && (
        <>
          <div style={{ marginBottom: "1rem" }}>
            <label>
              Crop{" "}
              <select value={cropFilter} onChange={(e) => setCropFilter(e.target.value)}>
                <option value="">All crops</option>
                {crops.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ display: "flex", gap: "2rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
            <div>
              <div style={{ color: "var(--color-text-muted)" }}>Total yield</div>
              <strong style={{ fontSize: "1.5rem" }}>{numberFormat.format(grandTotal)}</strong>
            </div>
            <div>
              <div style={{ color: "var(--color-text-muted)" }}>Harvested seasons</div>
              <strong style={{ fontSize: "1.5rem" }}>{filtered.length}</strong>
            </div>
            <div>
              <div style={{ color: "var(--color-text-muted)" }}>Top field</div>
              <strong style={{ fontSize: "1.5rem" }}>{byField[0]?.fieldName ?? "-"}</strong>
            </div>
          </div>

          <h2>Total yield by field</h2>
          <div style={{ maxWidth: "40rem", marginBottom: "2rem" }}>
            {byField.map((f) => (
              <div key={f.fieldId} style={{ marginBottom: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>{f.fieldName}</span>
                  <span>{numberFormat.format(f.total)}</span>
                </div>
                <div
                  style={{
                    background: "var(--color-bg-alt)",
                    borderRadius: "4px",
                    height: "16px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: maxTotal > 0 ? `${(f.total / maxTotal) * 100}%` : "0%",
                      height: "100%",
                      background: "var(--color-primary)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <h2>Yield by season</h2>
          <table>
            <thead>
              <tr>
                <th>Season</th>
                <th>Field</th>
                <th>Crop</th>
                <th>Started</th>
                <th>Total yield</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.cropSeasonId}>
                  <td>{r.seasonName}</td>
                  <td>{r.fieldName}</td>
                  <td>{r.cropName}</td>
                  <td>{new Date(r.startDate).toLocaleDateString()}</td>
                  <td>{numberFormat.format(r.totalYield)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}