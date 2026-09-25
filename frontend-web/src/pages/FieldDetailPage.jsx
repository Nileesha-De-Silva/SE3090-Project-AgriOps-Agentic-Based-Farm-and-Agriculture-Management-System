import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getCropSeasons, getSoilRecords, getCrops, createCropSeason } from "../services/farmApi";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ErrorBanner from "../components/common/ErrorBanner";
import "./FieldDetailPage.css";

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

export default function FieldDetailPage() {
  const { id } = useParams(); // fieldId from the URL

  const [cropSeasons, setCropSeasons] = useState([]);
  const [soilRecords, setSoilRecords] = useState([]);
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    cropId: "",
    seasonName: "",
    startDate: "",
    targetEndDate: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    try {
      setLoading(true);
      const [seasonsData, soilData, cropsData] = await Promise.all([
        getCropSeasons(id),
        getSoilRecords(id),
        getCrops(),
      ]);
      setCropSeasons(seasonsData || []);
      setSoilRecords(soilData || []);
      setCrops(cropsData || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createCropSeason({
        fieldId: id,
        cropId: formData.cropId,
        seasonName: formData.seasonName,
        startDate: new Date(formData.startDate).toISOString(),
        targetEndDate: new Date(formData.targetEndDate).toISOString(),
        status: "Planned",
      });
      setFormData({ cropId: "", seasonName: "", startDate: "", targetEndDate: "" });
      setShowForm(false);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function cropName(cropId) {
    return crops.find((c) => c.id === cropId)?.cropName || "Unknown crop";
  }

  if (loading) {
    return (
      <div className="field-detail-page">
        <LoadingSpinner label="Loading field..." />
      </div>
    );
  }

  const sortedSoilRecords = [...soilRecords].sort(
    (a, b) => new Date(b.testDate) - new Date(a.testDate)
  );

  return (
    <div className="field-detail-page">
      <Link to="/farms" className="field-detail-back-link">
        <span aria-hidden="true">←</span> Back to Farms
      </Link>
      <h1>Field</h1>

      {error && (
        <div className="field-detail-error">
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      <div className="field-detail-section">
        <div className="field-detail-section-header">
          <h2>Crop Seasons</h2>
          <Button variant={showForm ? "secondary" : "primary"} onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "+ New Crop Season"}
          </Button>
        </div>

        {showForm && (
          <Card className="season-form-card">
            <h3>New Crop Season</h3>
            <form onSubmit={handleSubmit} className="season-form">
              <div className="season-form-field">
                <label htmlFor="season-crop">Crop</label>
                <select
                  id="season-crop"
                  value={formData.cropId}
                  onChange={(e) => setFormData({ ...formData, cropId: e.target.value })}
                  required
                >
                  <option value="">Select a crop...</option>
                  {crops.map((crop) => (
                    <option key={crop.id} value={crop.id}>
                      {crop.cropName} ({crop.variety})
                    </option>
                  ))}
                </select>
              </div>
              <div className="season-form-field">
                <label htmlFor="season-name">Season Name</label>
                <input
                  id="season-name"
                  type="text"
                  value={formData.seasonName}
                  onChange={(e) => setFormData({ ...formData, seasonName: e.target.value })}
                  placeholder="e.g. Summer Season 2026"
                  required
                />
              </div>
              <div className="season-form-field">
                <label htmlFor="season-start">Start Date</label>
                <input
                  id="season-start"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="season-form-field">
                <label htmlFor="season-end">Target End Date</label>
                <input
                  id="season-end"
                  type="date"
                  value={formData.targetEndDate}
                  onChange={(e) => setFormData({ ...formData, targetEndDate: e.target.value })}
                  required
                />
              </div>
              <div className="season-form-actions">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Creating..." : "Create Season"}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {cropSeasons.length === 0 ? (
          <Card>
            <div className="empty-state">
              <span className="empty-state-icon" aria-hidden="true">
                🌱
              </span>
              <h3>No crop seasons yet</h3>
              <p>Add one above to start tracking this field's growth cycle.</p>
            </div>
          </Card>
        ) : (
          <div className="crop-seasons-list">
            {cropSeasons.map((season) => (
              <Link
                key={season.id}
                to={`/cropseasons/${season.id}`}
                className="crop-season-card-link"
              >
                <Card>
                  <div className="crop-season-card-top">
                    <div>
                      <h3 className="crop-season-name">{season.seasonName}</h3>
                      <p className="crop-season-crop">{cropName(season.cropId)}</p>
                    </div>
                    <div className="crop-season-badges">
                      <Badge variant={statusVariant(season.status)}>{season.status}</Badge>
                      {season.currentGrowthStage && (
                        <Badge variant={growthStageVariant(season.currentGrowthStage)}>
                          {season.currentGrowthStage}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="field-detail-section">
        <div className="field-detail-section-header">
          <h2>Soil Test History</h2>
        </div>

        {sortedSoilRecords.length === 0 ? (
          <Card>
            <div className="empty-state">
              <span className="empty-state-icon" aria-hidden="true">
                🧪
              </span>
              <h3>No soil records yet</h3>
              <p>Soil test results for this field will appear here.</p>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="soil-records-list">
              {sortedSoilRecords.map((record) => (
                <div key={record.id} className="soil-record-row">
                  <span className="soil-record-date">
                    {new Date(record.testDate).toLocaleDateString()}
                  </span>
                  <div className="soil-record-stats">
                    <div className="soil-stat">
                      <span className="soil-stat-label">pH</span>
                      <span className="soil-stat-value">{record.phLevel}</span>
                    </div>
                    <div className="soil-stat">
                      <span className="soil-stat-label">N</span>
                      <span className="soil-stat-value">{record.nitrogenLevel}</span>
                    </div>
                    <div className="soil-stat">
                      <span className="soil-stat-label">P</span>
                      <span className="soil-stat-value">{record.phosphorusLevel}</span>
                    </div>
                    <div className="soil-stat">
                      <span className="soil-stat-label">K</span>
                      <span className="soil-stat-value">{record.potassiumLevel}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
