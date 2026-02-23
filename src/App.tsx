import React, { JSX } from "react";
import "./styles/App.css";
import "leaflet/dist/leaflet.css";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SampleAdminPage from "./pages/SampleAdminPage";
import ProtectedRoute from "./pages/ProtectedRoute";

export default function App(): JSX.Element {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/sampleAdminPage"
          element={
            <ProtectedRoute>
              <SampleAdminPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}
