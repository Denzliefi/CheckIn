import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute"; // adjust path

import GuidanceCounseling from "./pages/GuidanceCounseling";
import MoodTracker from "./pages/Journal";
import WellnessCheck from "./pages/Assessment";

export default function App() {
  return (
    <Routes>
      {/* public routes */}
      {/* <Route path="/" element={<Home />} /> */}
      {/* <Route path="/login" element={<Login />} /> */}
      {/* <Route path="/sign-up" element={<Signup />} /> */}

      {/* ✅ protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/guidancecounseling" element={<GuidanceCounseling />} />
        <Route path="/assessment" element={<MoodTracker />} />
        <Route path="/journal" element={<WellnessCheck />} />
      </Route>

      {/* fallback */}
      {/* <Route path="*" element={<NotFound />} /> */}
    </Routes>
  );
}
