import { Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import AuthLayout from "../layouts/AuthLayout";

import LandingPage from "../pages/LandingPage";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import AboutUs from "../pages/AboutUs";
import PrivacyPolicy from "../pages/PrivacyPolicy";

import GuidanceCounseling from "../pages/Services/GuidanceCounseling";
import Journal from "../pages/Services/Journal";
import Assessment from "../pages/Services/Assessment";
import Emergency from "../pages/Services/Emergency";

export default function AppRoutes() {
  return (
    <Routes>
      {/* AUTH PAGES */}
      <Route element={<MainLayout/>}>
        <Route path="/login" element={<Login />} />
        <Route path="/sign-up" element={<Signup />} />
      </Route>

      {/* PROTECTED PAGES */}
     
        <Route element={<MainLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />

          {/* Services Pages */}
          <Route path="/services/counseling" element={<GuidanceCounseling/>} />
          <Route path="/services/journal" element={<Journal/>} />
          <Route path="/services/assessment" element={<Assessment/>} />
          <Route path="/services/emergency" element={<Emergency/>} />
 
        </Route>
   
    </Routes>
  );
}
