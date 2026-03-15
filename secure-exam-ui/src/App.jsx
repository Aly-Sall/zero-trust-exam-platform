import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import ExamRoom from "./pages/ExamRoom";
import ProfessorDashboard from "./pages/ProfessorDashboard";
import Calibration from "./pages/Calibration"; // <-- NOUVEAU
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/calibration" element={<Calibration />} />{" "}
        {/* <-- NOUVELLE ROUTE */}
        <Route path="/exam" element={<ExamRoom />} />
        <Route path="/dashboard" element={<ProfessorDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
