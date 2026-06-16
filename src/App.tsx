import React, { JSX } from "react";
import "./styles/App.css";
import "leaflet/dist/leaflet.css";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  Navigate,
} from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SampleAdminPage from "./pages/SampleAdminPage";
import ProtectedRoute from "./pages/ProtectedRoute";

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route>
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>,
  ),
);

export default function App(): JSX.Element {
  return <></>;
}
