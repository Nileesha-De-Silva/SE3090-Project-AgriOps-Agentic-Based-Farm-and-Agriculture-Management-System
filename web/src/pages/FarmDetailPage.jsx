import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getFarm, getFields, createField } from "../api/component1Api";

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

  if (loading) return <p>Loading farm...</p>;
  if (!farm) return <p>Farm not found.</p>;

  return (
    <div>
      <Link to="/farms">← Back to Farms</Link>
      <h1>{farm.name}</h1>
      <p>{farm.location} — {farm.totalArea} acres</p>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <h2>Fields</h2>
      <button onClick={() => setShowForm(!showForm)}>
        {showForm ? "Cancel" : "+ New Field"}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginTop: "1rem" }}>
          <div>
            <label>Field Name</label>
            <input
              type="text"
              value={formData.fieldName}
              onChange={(e) => setFormData({ ...formData, fieldName: e.target.value })}
              required
            />
          </div>
          <div>
            <label>Area Size (acres)</label>
            <input
              type="number"
              step="0.01"
              value={formData.areaSize}
              onChange={(e) => setFormData({ ...formData, areaSize: e.target.value })}
              required
            />
          </div>
          <div>
            <label>Soil Type</label>
            <input
              type="text"
              value={formData.soilType}
              onChange={(e) => setFormData({ ...formData, soilType: e.target.value })}
              required
            />
          </div>
          <div>
            <label>Boundary Coordinates (optional)</label>
            <input
              type="text"
              value={formData.boundaryCoordinates}
              onChange={(e) => setFormData({ ...formData, boundaryCoordinates: e.target.value })}
              placeholder="lat,lng"
            />
          </div>
          <button type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create Field"}
          </button>
        </form>
      )}

      <ul style={{ marginTop: "1.5rem" }}>
        {fields.map((field) => (
          <li key={field.id}>
            <Link to={`/fields/${field.id}`}>
              {field.fieldName} — {field.areaSize} acres ({field.soilType})
            </Link>
          </li>
        ))}
      </ul>

      {fields.length === 0 && <p>No fields yet — add one above.</p>}
    </div>
  );
}