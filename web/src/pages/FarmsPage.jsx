import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getFarms, createFarm } from "../api/component1Api";
import Card from "../components/Card";
import Button from "../components/Button";
import Badge from "../components/Badge";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBanner from "../components/ErrorBanner";
import "./FarmsPage.css";

export default function FarmsPage() {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", location: "", totalArea: "", ownerId: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadFarms();
  }, []);

  async function loadFarms() {
    try {
      setLoading(true);
      const data = await getFarms();
      setFarms(data);
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
      await createFarm({
        name: formData.name,
        location: formData.location,
        totalArea: parseFloat(formData.totalArea),
        ownerId: formData.ownerId,
      });
      setFormData({ name: "", location: "", totalArea: "", ownerId: "" });
      setShowForm(false);
      await loadFarms(); // refresh the list
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="farms-page">
        <LoadingSpinner label="Loading farms..." />
      </div>
    );
  }

  return (
    <div className="farms-page">
      <div className="farms-page-header">
        <h1>Farms</h1>
        <Button variant={showForm ? "secondary" : "primary"} onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ New Farm"}
        </Button>
      </div>

      {error && (
        <div className="farms-page-error">
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      {showForm && (
        <Card className="farm-form-card">
          <h2>New Farm</h2>
          <form onSubmit={handleSubmit} className="farm-form">
            <div className="farm-form-field">
              <label htmlFor="farm-name">Name</label>
              <input
                id="farm-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="farm-form-field">
              <label htmlFor="farm-location">Location</label>
              <input
                id="farm-location"
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </div>
            <div className="farm-form-field">
              <label htmlFor="farm-area">Total Area (acres)</label>
              <input
                id="farm-area"
                type="number"
                step="0.01"
                value={formData.totalArea}
                onChange={(e) => setFormData({ ...formData, totalArea: e.target.value })}
                required
              />
            </div>
            <div className="farm-form-field">
              <label htmlFor="farm-owner">Owner ID</label>
              <input
                id="farm-owner"
                type="text"
                value={formData.ownerId}
                onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
                placeholder="temporary until auth exists"
                required
              />
            </div>
            <div className="farm-form-actions">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Create Farm"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {farms.length === 0 ? (
        <Card>
          <div className="farms-empty-state">
            <span className="farms-empty-state-icon" aria-hidden="true">
              🌱
            </span>
            <h3>No farms yet</h3>
            <p>Create your first farm above to start tracking crops and fields.</p>
          </div>
        </Card>
      ) : (
        <div className="farms-grid">
          {farms.map((farm) => (
            <Link key={farm.id} to={`/farms/${farm.id}`} className="farm-card-link">
              <Card>
                <h3 className="farm-card-name">{farm.name}</h3>
                <p className="farm-card-location">{farm.location}</p>
                <Badge variant="info">{farm.totalArea} acres</Badge>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}