import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import FarmsPage from "./pages/FarmsPage";
import FarmDetailPage from "./pages/FarmDetailPage";
import FieldDetailPage from "./pages/FieldDetailPage";
import CropSeasonDetailPage from "./pages/CropSeasonDetailPage";
import CropsPage from "./pages/CropsPage";

function App() {
  return (
    <BrowserRouter>
      <div style={{ padding: "2rem" }}>
        <nav style={{ marginBottom: "1.5rem" }}>
          <Link to="/farms" style={{ marginRight: "1rem" }}>Farms</Link>
          <Link to="/crops">Crops</Link>
        </nav>

        <Routes>
          <Route path="/" element={<FarmsPage />} />
          <Route path="/farms" element={<FarmsPage />} />
          <Route path="/farms/:id" element={<FarmDetailPage />} />
          <Route path="/fields/:id" element={<FieldDetailPage />} />
          <Route path="/cropseasons/:id" element={<CropSeasonDetailPage />} />
          <Route path="/crops" element={<CropsPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;