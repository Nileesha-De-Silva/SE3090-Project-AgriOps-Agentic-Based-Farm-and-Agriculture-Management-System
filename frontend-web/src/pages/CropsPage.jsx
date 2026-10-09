import { useState, useEffect } from "react";
import { getCrops, createCrop } from "../services/farmApi";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ErrorBanner from "../components/common/ErrorBanner";
import "./CropsPage.css";

export default function CropsPage() {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    cropName: "",
    variety: "",
    optimalGrowthDurationDays: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCrops();
  }, []);

  async function loadCrops() {
    try {
      setLoading(true);
      const data = await getCrops();
      setCrops(data || []);
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
      await createCrop({
        cropName: formData.cropName,
        variety: formData.variety,
        optimalGrowthDurationDays: parseInt(formData.optimalGrowthDurationDays, 10),
        description: formData.description || null,
      });
      setFormData({ cropName: "", variety: "", optimalGrowthDurationDays: "", description: "" });
      setShowForm(false);
      await loadCrops();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="crops-page">
        <LoadingSpinner label="Loading crops..." />
      </div>
    );
  }

  return (
    <div className="crops-page">
      <div className="crops-page-header">
        <h1>Crop Catalog</h1>
        <Button variant={showForm ? "secondary" : "primary"} onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ New Crop"}
        </Button>
      </div>

      {error && (
        <div className="crops-page-error">
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      {showForm && (
        <Card className="crop-form-card">
          <h2>New Crop</h2>
          <form onSubmit={handleSubmit} className="crop-form">
            <div className="crop-form-field">
              <label htmlFor="crop-name">Crop Name</label>
              <input
                id="crop-name"
                type="text"
                value={formData.cropName}
                onChange={(e) => setFormData({ ...formData, cropName: e.target.value })}
                placeholder="e.g. Tomato"
                required
              />
            </div>
            <div className="crop-form-field">
              <label htmlFor="crop-variety">Variety</label>
              <input
                id="crop-variety"
                type="text"
                value={formData.variety}
                onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                placeholder="e.g. Roma"
                required
              />
            </div>
            <div className="crop-form-field">
              <label htmlFor="crop-duration">Optimal Growth Duration (days)</label>
              <input
                id="crop-duration"
                type="number"
                value={formData.optimalGrowthDurationDays}
                onChange={(e) =>
                  setFormData({ ...formData, optimalGrowthDurationDays: e.target.value })
                }
                required
              />
            </div>
            <div className="crop-form-field">
              <label htmlFor="crop-description">Description (optional)</label>
              <textarea
                id="crop-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="crop-form-actions">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Create Crop"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {crops.length === 0 ? (
        <Card>
          <div className="crops-empty-state">
            <span className="crops-empty-state-icon" aria-hidden="true">
              🌾
            </span>
            <h3>No crops yet</h3>
            <p>Add one above to start building out your crop catalog.</p>
          </div>
        </Card>
      ) : (
        <div className="crops-grid">
          {crops.map((crop) => (
            <Card key={crop.id}>
              <h3 className="crop-card-name">{crop.cropName}</h3>
              <p className="crop-card-variety">{crop.variety}</p>
              <div className="crop-card-stat">
                <span className="crop-card-stat-label">Growth duration</span>
                <span className="crop-card-stat-value">
                  {crop.optimalGrowthDurationDays} days
                </span>
              </div>
              {crop.description && <p className="crop-card-description">{crop.description}</p>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
