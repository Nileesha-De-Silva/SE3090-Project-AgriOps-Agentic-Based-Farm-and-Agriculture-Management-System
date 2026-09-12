import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getCropSeasons, getSoilRecords, getCrops, createCropSeason } from "../api/component1Api";

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
      setCropSeasons(seasonsData);
      setSoilRecords(soilData);
      setCrops(cropsData);
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

  if (loading) return <p>Loading field...</p>;

  return (
    <div>
      <Link to="/farms">← Back to Farms</Link>
      <h1>Field</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <h2>Crop Seasons</h2>
      <button onClick={() => setShowForm(!showForm)}>
        {showForm ? "Cancel" : "+ New Crop Season"}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginTop: "1rem" }}>
          <div>
            <label>Crop</label>
            <select
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
          <div>
            <label>Season Name</label>
            <input
              type="text"
              value={formData.seasonName}
              onChange={(e) => setFormData({ ...formData, seasonName: e.target.value })}
              placeholder="e.g. Summer Season 2026"
              required
            />
          </div>
          <div>
            <label>Start Date</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
          </div>
          <div>
            <label>Target End Date</label>
            <input
              type="date"
              value={formData.targetEndDate}
              onChange={(e) => setFormData({ ...formData, targetEndDate: e.target.value })}
              required
            />
          </div>
          <button type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create Season"}
          </button>
        </form>
      )}

      <ul style={{ marginTop: "1.5rem" }}>
        {cropSeasons.map((season) => (
          <li key={season.id}>
            <Link to={`/cropseasons/${season.id}`}>
              {season.seasonName} — {cropName(season.cropId)} — {season.status}
              {season.currentGrowthStage && ` — Stage: ${season.currentGrowthStage}`}
            </Link>
          </li>
        ))}
      </ul>
      {cropSeasons.length === 0 && <p>No crop seasons yet — add one above.</p>}

      <h2 style={{ marginTop: "2rem" }}>Soil Test History</h2>
      <ul>
        {soilRecords.map((record) => (
          <li key={record.id}>
            {new Date(record.testDate).toLocaleDateString()} — pH {record.phLevel}, N {record.nitrogenLevel}, P {record.phosphorusLevel}, K {record.potassiumLevel}
          </li>
        ))}
      </ul>
      {soilRecords.length === 0 && <p>No soil records yet.</p>}
    </div>
  );
}