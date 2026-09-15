import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getFarm, getFields, createField } from "../api/component1Api";
import Card from "../components/Card";
import Button from "../components/Button";
import Badge from "../components/Badge";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBanner from "../components/ErrorBanner";
import "./FarmDetailPage.css";

export default function FarmDetailPage() {
  const { id } = useParams(); // farmId from the URL

  const [farm, setFarm] = useState(null);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    fieldName: "",
    areaSize: "",
    soilType: "",
    boundaryCoordinates: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    try {
      setLoading(true);
      const [farmData, fieldsData] = await Promise.all([getFarm(id), getFields(id)]);
      setFarm(farmData);
      setFields(fieldsData);
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
      await createField({
        farmId: id,
        fieldName: formData.fieldName,
        areaSize: parseFloat(formData.areaSize),
        soilType: formData.soilType,
        boundaryCoordinates: formData.boundaryCoordinates || null,
      });
      setFormData({ fieldName: "", areaSize: "", soilType: "", boundaryCoordinates: "" });
      setShowForm(false);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="farm-detail-page">
        <LoadingSpinner label="Loading farm..." />
      </div>
    );
  }

  if (!farm) {
    return (
      <div className="farm-detail-page">
        <Link to="/farms" className="farm-detail-back-link">
          <span aria-hidden="true">←</span> Back to Farms
        </Link>
        <Card>
          <div className="farm-not-found">
            <p>Farm not found.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="farm-detail-page">
      <Link to="/farms" className="farm-detail-back-link">
        <span aria-hidden="true">←</span> Back to Farms
      </Link>

      <div className="farm-detail-header">
        <h1>{farm.name}</h1>
        <p>
          {farm.location} — {farm.totalArea} acres
        </p>
      </div>

      {error && (
        <div className="farm-detail-error">
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      <div className="farm-detail-section-header">
        <h2>Fields</h2>
        <Button variant={showForm ? "secondary" : "primary"} onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ New Field"}
        </Button>
      </div>

      {showForm && (
        <Card className="field-form-card">
          <h3>New Field</h3>
          <form onSubmit={handleSubmit} className="field-form">
            <div className="field-form-field">
              <label htmlFor="field-name">Field Name</label>
              <input
                id="field-name"
                type="text"
                value={formData.fieldName}
                onChange={(e) => setFormData({ ...formData, fieldName: e.target.value })}
                required
              />
            </div>
            <div className="field-form-field">
              <label htmlFor="field-area">Area Size (acres)</label>
              <input
                id="field-area"
                type="number"
                step="0.01"
                value={formData.areaSize}
                onChange={(e) => setFormData({ ...formData, areaSize: e.target.value })}
                required
              />
            </div>
            <div className="field-form-field">
              <label htmlFor="field-soil">Soil Type</label>
              <input
                id="field-soil"
                type="text"
                value={formData.soilType}
                onChange={(e) => setFormData({ ...formData, soilType: e.target.value })}
                required
              />
            </div>
            <div className="field-form-field">
              <label htmlFor="field-boundary">Boundary Coordinates (optional)</label>
              <input
                id="field-boundary"
                type="text"
                value={formData.boundaryCoordinates}
                onChange={(e) => setFormData({ ...formData, boundaryCoordinates: e.target.value })}
                placeholder="lat,lng"
              />
            </div>
            <div className="field-form-actions">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Create Field"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {fields.length === 0 ? (
        <Card>
          <div className="fields-empty-state">
            <span className="fields-empty-state-icon" aria-hidden="true">
              🌾
            </span>
            <h3>No fields yet</h3>
            <p>Add a field above to start mapping out this farm.</p>
          </div>
        </Card>
      ) : (
        <div className="fields-grid">
          {fields.map((field) => (
            <Link key={field.id} to={`/fields/${field.id}`} className="field-card-link">
              <Card>
                <h3 className="field-card-name">{field.fieldName}</h3>
                <p className="field-card-area">{field.areaSize} acres</p>
                <Badge variant="neutral">{field.soilType}</Badge>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}