import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getCropSeason,
  getPlantings,
  getHarvests,
  createPlanting,
  createHarvest,
} from "../api/component1Api";

export default function CropSeasonDetailPage() {
  const { id } = useParams();

  const [season, setSeason] = useState(null);
  const [plantings, setPlantings] = useState([]);
  const [harvests, setHarvests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showPlantingForm, setShowPlantingForm] = useState(false);
  const [plantingData, setPlantingData] = useState({
    plantingDate: "",
    initialQuantity: "",
    plantingMethod: "",
    notes: "",
  });

  const [showHarvestForm, setShowHarvestForm] = useState(false);
  const [harvestData, setHarvestData] = useState({
    harvestDate: "",
    yieldAmount: "",
    qualityGrade: "",
    recordedByUserId: "",
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    try {
      setLoading(true);
      const [seasonData, plantingsData, harvestsData] = await Promise.all([
        getCropSeason(id),
        getPlantings(id),
        getHarvests(id),
      ]);
      setSeason(seasonData);
      setPlantings(plantingsData);
      setHarvests(harvestsData);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePlantingSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createPlanting(id, {
        plantingDate: new Date(plantingData.plantingDate).toISOString(),
        initialQuantity: parseFloat(plantingData.initialQuantity),
        plantingMethod: plantingData.plantingMethod || null,
        notes: plantingData.notes || null,
      });
      setPlantingData({ plantingDate: "", initialQuantity: "", plantingMethod: "", notes: "" });
      setShowPlantingForm(false);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleHarvestSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createHarvest(id, {
        harvestDate: new Date(harvestData.harvestDate).toISOString(),
        yieldAmount: parseFloat(harvestData.yieldAmount),
        qualityGrade: harvestData.qualityGrade || null,
        recordedByUserId: harvestData.recordedByUserId,
      });
      setHarvestData({ harvestDate: "", yieldAmount: "", qualityGrade: "", recordedByUserId: "" });
      setShowHarvestForm(false);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p>Loading crop season...</p>;
  if (!season) return <p>Crop season not found.</p>;

  return (
    <div>
      <Link to={`/fields/${season.fieldId}`}>← Back to Field</Link>
      <h1>{season.seasonName}</h1>
      <p>
        Status: {season.status} — Growth Stage: <strong>{season.currentGrowthStage}</strong>
      </p>
      <p>
        {new Date(season.startDate).toLocaleDateString()} → {new Date(season.targetEndDate).toLocaleDateString()}
      </p>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Plantings */}
      <h2 style={{ marginTop: "2rem" }}>Plantings</h2>
      <button onClick={() => setShowPlantingForm(!showPlantingForm)}>
        {showPlantingForm ? "Cancel" : "+ Log Planting"}
      </button>

      {showPlantingForm && (
        <form onSubmit={handlePlantingSubmit} style={{ marginTop: "1rem" }}>
          <div>
            <label>Planting Date</label>
            <input
              type="date"
              value={plantingData.plantingDate}
              onChange={(e) => setPlantingData({ ...plantingData, plantingDate: e.target.value })}
              required
            />
          </div>
          <div>
            <label>Initial Quantity</label>
            <input
              type="number"
              step="0.01"
              value={plantingData.initialQuantity}
              onChange={(e) => setPlantingData({ ...plantingData, initialQuantity: e.target.value })}
              required
            />
          </div>
          <div>
            <label>Planting Method (optional)</label>
            <input
              type="text"
              value={plantingData.plantingMethod}
              onChange={(e) => setPlantingData({ ...plantingData, plantingMethod: e.target.value })}
            />
          </div>
          <div>
            <label>Notes (optional)</label>
            <input
              type="text"
              value={plantingData.notes}
              onChange={(e) => setPlantingData({ ...plantingData, notes: e.target.value })}
            />
          </div>
          <button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Save Planting"}
          </button>
        </form>
      )}

      <ul style={{ marginTop: "1rem" }}>
        {plantings.map((p) => (
          <li key={p.id}>
            {new Date(p.plantingDate).toLocaleDateString()} — Qty: {p.initialQuantity}
            {p.plantingMethod && ` — ${p.plantingMethod}`}
          </li>
        ))}
      </ul>
      {plantings.length === 0 && <p>No plantings logged yet.</p>}

      {/* Harvests */}
      <h2 style={{ marginTop: "2rem" }}>Harvests</h2>
      <button onClick={() => setShowHarvestForm(!showHarvestForm)}>
        {showHarvestForm ? "Cancel" : "+ Log Harvest"}
      </button>

      {showHarvestForm && (
        <form onSubmit={handleHarvestSubmit} style={{ marginTop: "1rem" }}>
          <div>
            <label>Harvest Date</label>
            <input
              type="date"
              value={harvestData.harvestDate}
              onChange={(e) => setHarvestData({ ...harvestData, harvestDate: e.target.value })}
              required
            />
          </div>
          <div>
            <label>Yield Amount</label>
            <input
              type="number"
              step="0.01"
              value={harvestData.yieldAmount}
              onChange={(e) => setHarvestData({ ...harvestData, yieldAmount: e.target.value })}
              required
            />
          </div>
          <div>
            <label>Quality Grade (optional)</label>
            <input
              type="text"
              value={harvestData.qualityGrade}
              onChange={(e) => setHarvestData({ ...harvestData, qualityGrade: e.target.value })}
              placeholder="e.g. A, B, C"
            />
          </div>
          <div>
            <label>Recorded By (User ID)</label>
            <input
              type="text"
              value={harvestData.recordedByUserId}
              onChange={(e) => setHarvestData({ ...harvestData, recordedByUserId: e.target.value })}
              placeholder="temporary until auth exists"
              required
            />
          </div>
          <button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Save Harvest"}
          </button>
        </form>
      )}

      <ul style={{ marginTop: "1rem" }}>
        {harvests.map((h) => (
          <li key={h.id}>
            {new Date(h.harvestDate).toLocaleDateString()} — Yield: {h.yieldAmount}
            {h.qualityGrade && ` — Grade: ${h.qualityGrade}`}
          </li>
        ))}
      </ul>
      {harvests.length === 0 && <p>No harvests logged yet.</p>}
    </div>
  );
}