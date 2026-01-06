import Navbar from "../components/Navbar";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="px-6 py-6">
        <Outlet />
      </div>
    </div>
  );
}
