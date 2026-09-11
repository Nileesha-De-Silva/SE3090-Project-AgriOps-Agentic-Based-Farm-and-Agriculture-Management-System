import { BrowserRouter, Routes, Route } from "react-router-dom";
import FarmsPage from "./pages/FarmsPage";

function App() {
  return (
    <BrowserRouter>
      <div style={{ padding: "2rem" }}>
        <Routes>
          <Route path="/" element={<FarmsPage />} />
          <Route path="/farms" element={<FarmsPage />} />
          {/* We'll add /farms/:id -> FarmDetailPage next */}
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;