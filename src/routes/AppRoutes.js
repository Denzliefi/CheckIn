import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Login from "../pages/Login";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* If you want / to show Login too */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* This makes Login show on /login */}
        <Route path="/login" element={<Login />} />
      </Route>
    </Routes>
  );
}
