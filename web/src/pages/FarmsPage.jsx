import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getFarms, createFarm } from "../api/component1Api";

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

  if (loading) return <p>Loading farms...</p>;

  return (
    <div>
      <h1>Farms</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <button onClick={() => setShowForm(!showForm)}>
        {showForm ? "Cancel" : "+ New Farm"}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginTop: "1rem" }}>
          <div>
            <label>Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label>Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
            />
          </div>
          <div>
            <label>Total Area (acres)</label>
            <input
              type="number"
              step="0.01"
              value={formData.totalArea}
              onChange={(e) => setFormData({ ...formData, totalArea: e.target.value })}
              required
            />
          </div>
          <div>
            <label>Owner ID</label>
            <input
              type="text"
              value={formData.ownerId}
              onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
              placeholder="temporary until auth exists"
              required
            />
          </div>
          <button type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create Farm"}
          </button>
        </form>
      )}

      <ul style={{ marginTop: "1.5rem" }}>
        {farms.map((farm) => (
          <li key={farm.id}>
            <Link to={`/farms/${farm.id}`}>
              {farm.name} — {farm.location} ({farm.totalArea} acres)
            </Link>
          </li>
        ))}
      </ul>

      {farms.length === 0 && !loading && <p>No farms yet — create one above.</p>}
    </div>
  );
}