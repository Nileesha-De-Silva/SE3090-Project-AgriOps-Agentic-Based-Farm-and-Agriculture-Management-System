import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import FarmsPage from "./pages/FarmsPage";
import FarmDetailPage from "./pages/FarmDetailPage";
import FieldDetailPage from "./pages/FieldDetailPage";
import CropSeasonDetailPage from "./pages/CropSeasonDetailPage";
import CropsPage from "./pages/CropsPage";
import AgentPlannerPage from "./pages/AgentPlannerPage";
import LoginPage from "./pages/LoginPage";
import UsersAdminPage from "./pages/admin/UsersAdminPage";
import AuditLogsPage from "./pages/admin/AuditLogsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import "./App.css";

function App() {
  return (
    <AuthProvider>
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

              {/* Component 4: auth + user management */}
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute roles={["Administrator"]}>
                    <UsersAdminPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/audit-logs"
                element={
                  <ProtectedRoute roles={["Administrator"]}>
                    <AuditLogsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute roles={["Administrator", "FarmManager"]}>
                    <AnalyticsPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;