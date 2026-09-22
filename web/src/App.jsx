import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import FarmsPage from "./pages/FarmsPage";
import FarmDetailPage from "./pages/FarmDetailPage";
import FieldDetailPage from "./pages/FieldDetailPage";
import CropSeasonDetailPage from "./pages/CropSeasonDetailPage";
import CropsPage from "./pages/CropsPage";
import AgentPlannerPage from "./pages/AgentPlannerPage";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Navbar />

        <div className="app-content">
          <Routes>
            <Route path="/" element={<FarmsPage />} />
            <Route path="/farms" element={<FarmsPage />} />
            <Route path="/farms/:id" element={<FarmDetailPage />} />
            <Route path="/fields/:id" element={<FieldDetailPage />} />
            <Route path="/cropseasons/:id" element={<CropSeasonDetailPage />} />
            <Route path="/crops" element={<CropsPage />} />
            <Route path="/agent-planner" element={<AgentPlannerPage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;