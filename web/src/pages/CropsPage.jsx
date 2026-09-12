import { useState, useEffect } from "react";
import { getCrops, createCrop } from "../api/component1Api";

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
      setCrops(data);
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

  if (loading) return <p>Loading crops...</p>;

  return (
    <div>
      <h1>Crop Catalog</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <button onClick={() => setShowForm(!showForm)}>
        {showForm ? "Cancel" : "+ New Crop"}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginTop: "1rem" }}>
          <div>
            <label>Crop Name</label>
            <input
              type="text"
              value={formData.cropName}
              onChange={(e) => setFormData({ ...formData, cropName: e.target.value })}
              placeholder="e.g. Tomato"
              required
            />
          </div>
          <div>
            <label>Variety</label>
            <input
              type="text"
              value={formData.variety}
              onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
              placeholder="e.g. Roma"
              required
            />
          </div>
          <div>
            <label>Optimal Growth Duration (days)</label>
            <input
              type="number"
              value={formData.optimalGrowthDurationDays}
              onChange={(e) => setFormData({ ...formData, optimalGrowthDurationDays: e.target.value })}
              required
            />
          </div>
          <div>
            <label>Description (optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <button type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create Crop"}
          </button>
        </form>
      )}

      <ul style={{ marginTop: "1.5rem" }}>
        {crops.map((crop) => (
          <li key={crop.id}>
            <strong>{crop.cropName}</strong> ({crop.variety}) — {crop.optimalGrowthDurationDays} days
            {crop.description && <span> — {crop.description}</span>}
          </li>
        ))}
      </ul>
      {crops.length === 0 && <p>No crops yet — add one above.</p>}
    </div>
  );
}