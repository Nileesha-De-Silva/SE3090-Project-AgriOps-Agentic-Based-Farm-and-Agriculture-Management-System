import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getCropSeason,
  getPlantings,
  getHarvests,
  createPlanting,
  createHarvest,
} from "../api/component1Api";
import Card from "../components/Card";
import Button from "../components/Button";
import Badge from "../components/Badge";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBanner from "../components/ErrorBanner";
import "./CropSeasonDetailPage.css";

const GROWTH_STAGE_VARIANTS = {
  Germination: "info",
  Vegetative: "info",
  Flowering: "success",
  Fruiting: "success",
  NotPlanted: "neutral",
};

const STATUS_VARIANTS = {
  Planned: "neutral",
  Active: "info",
  InProgress: "info",
  Completed: "success",
  Harvested: "success",
};

function growthStageVariant(stage) {
  return GROWTH_STAGE_VARIANTS[stage] || "neutral";
}

function statusVariant(status) {
  return STATUS_VARIANTS[status] || "neutral";
}

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

  if (loading) {
    return (
      <div className="crop-season-page">
        <LoadingSpinner label="Loading crop season..." />
      </div>
    );
  }

  if (!season) {
    return (
      <div className="crop-season-page">
        <Card>
          <div className="crop-season-not-found">
            <p>Crop season not found.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="crop-season-page">
      <Link to={`/fields/${season.fieldId}`} className="crop-season-back-link">
        <span aria-hidden="true">←</span> Back to Field
      </Link>

      <Card className="crop-season-header-card">
        <div className="crop-season-header-top">
          <h1>{season.seasonName}</h1>
          <div className="crop-season-header-badges">
            <Badge variant={statusVariant(season.status)}>{season.status}</Badge>
            {season.currentGrowthStage && (
              <Badge variant={growthStageVariant(season.currentGrowthStage)}>
                {season.currentGrowthStage}
              </Badge>
            )}
          </div>
        </div>
        <p className="crop-season-dates">
          {new Date(season.startDate).toLocaleDateString()} →{" "}
          {new Date(season.targetEndDate).toLocaleDateString()}
        </p>
      </Card>

      {error && (
        <div className="crop-season-error">
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      {/* Plantings */}
      <div className="crop-season-section">
        <div className="crop-season-section-header">
          <h2>Plantings</h2>
          <Button
            variant={showPlantingForm ? "secondary" : "primary"}
            onClick={() => setShowPlantingForm(!showPlantingForm)}
          >
            {showPlantingForm ? "Cancel" : "+ Log Planting"}
          </Button>
        </div>

        {showPlantingForm && (
          <Card className="log-form-card">
            <h3>Log Planting</h3>
            <form onSubmit={handlePlantingSubmit} className="log-form">
              <div className="log-form-field">
                <label htmlFor="planting-date">Planting Date</label>
                <input
                  id="planting-date"
                  type="date"
                  value={plantingData.plantingDate}
                  onChange={(e) =>
                    setPlantingData({ ...plantingData, plantingDate: e.target.value })
                  }
                  required
                />
              </div>
              <div className="log-form-field">
                <label htmlFor="planting-quantity">Initial Quantity</label>
                <input
                  id="planting-quantity"
                  type="number"
                  step="0.01"
                  value={plantingData.initialQuantity}
                  onChange={(e) =>
                    setPlantingData({ ...plantingData, initialQuantity: e.target.value })
                  }
                  required
                />
              </div>
              <div className="log-form-field">
                <label htmlFor="planting-method">Planting Method (optional)</label>
                <input
                  id="planting-method"
                  type="text"
                  value={plantingData.plantingMethod}
                  onChange={(e) =>
                    setPlantingData({ ...plantingData, plantingMethod: e.target.value })
                  }
                />
              </div>
              <div className="log-form-field">
                <label htmlFor="planting-notes">Notes (optional)</label>
                <input
                  id="planting-notes"
                  type="text"
                  value={plantingData.notes}
                  onChange={(e) => setPlantingData({ ...plantingData, notes: e.target.value })}
                />
              </div>
              <div className="log-form-actions">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : "Save Planting"}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {plantings.length === 0 ? (
          <Card>
            <div className="empty-state">
              <span className="empty-state-icon" aria-hidden="true">
                🌱
              </span>
              <h3>No plantings logged yet</h3>
              <p>Log a planting above to start tracking this season.</p>
            </div>
          </Card>
        ) : (
          <div className="entry-list">
            {plantings.map((p) => (
              <Card key={p.id}>
                <div className="entry-card-top">
                  <p className="entry-date">{new Date(p.plantingDate).toLocaleDateString()}</p>
                  <p className="entry-detail">
                    Qty: {p.initialQuantity}
                    {p.plantingMethod && ` — ${p.plantingMethod}`}
                  </p>
                </div>
                {p.notes && <p className="entry-notes">{p.notes}</p>}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Harvests */}
      <div className="crop-season-section">
        <div className="crop-season-section-header">
          <h2>Harvests</h2>
          <Button
            variant={showHarvestForm ? "secondary" : "primary"}
            onClick={() => setShowHarvestForm(!showHarvestForm)}
          >
            {showHarvestForm ? "Cancel" : "+ Log Harvest"}
          </Button>
        </div>

        {showHarvestForm && (
          <Card className="log-form-card">
            <h3>Log Harvest</h3>
            <form onSubmit={handleHarvestSubmit} className="log-form">
              <div className="log-form-field">
                <label htmlFor="harvest-date">Harvest Date</label>
                <input
                  id="harvest-date"
                  type="date"
                  value={harvestData.harvestDate}
                  onChange={(e) => setHarvestData({ ...harvestData, harvestDate: e.target.value })}
                  required
                />
              </div>
              <div className="log-form-field">
                <label htmlFor="harvest-yield">Yield Amount</label>
                <input
                  id="harvest-yield"
                  type="number"
                  step="0.01"
                  value={harvestData.yieldAmount}
                  onChange={(e) =>
                    setHarvestData({ ...harvestData, yieldAmount: e.target.value })
                  }
                  required
                />
              </div>
              <div className="log-form-field">
                <label htmlFor="harvest-grade">Quality Grade (optional)</label>
                <input
                  id="harvest-grade"
                  type="text"
                  value={harvestData.qualityGrade}
                  onChange={(e) =>
                    setHarvestData({ ...harvestData, qualityGrade: e.target.value })
                  }
                  placeholder="e.g. A, B, C"
                />
              </div>
              <div className="log-form-field">
                <label htmlFor="harvest-recorded-by">Recorded By (User ID)</label>
                <input
                  id="harvest-recorded-by"
                  type="text"
                  value={harvestData.recordedByUserId}
                  onChange={(e) =>
                    setHarvestData({ ...harvestData, recordedByUserId: e.target.value })
                  }
                  placeholder="temporary until auth exists"
                  required
                />
              </div>
              <div className="log-form-actions">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : "Save Harvest"}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {harvests.length === 0 ? (
          <Card>
            <div className="empty-state">
              <span className="empty-state-icon" aria-hidden="true">
                🧺
              </span>
              <h3>No harvests logged yet</h3>
              <p>Log a harvest above once this season is ready.</p>
            </div>
          </Card>
        ) : (
          <div className="entry-list">
            {harvests.map((h) => (
              <Card key={h.id}>
                <div className="entry-card-top">
                  <p className="entry-date">{new Date(h.harvestDate).toLocaleDateString()}</p>
                  <p className="entry-detail">
                    Yield: {h.yieldAmount}
                    {h.qualityGrade && ` — Grade: ${h.qualityGrade}`}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}