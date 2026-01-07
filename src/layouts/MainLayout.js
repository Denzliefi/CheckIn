import Navbar from "../components/Navbar";
import { Outlet } from "react-router-dom";
import Footer from "../components/Footer";
export default function MainLayout() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="relative left-1/2 -translate-x-1/2">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}
