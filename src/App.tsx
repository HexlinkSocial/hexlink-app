import React, { JSX } from "react";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  Navigate,
} from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import AdminApprovals from "./pages/AdminApprovals";
import ProtectedRoute from "./pages/ProtectedRoute";
import ErrorPage from "./pages/ErrorPage";
import Join from "./pages/Join";
import UserCommunitiesDashboard from "./pages/UserCommunitiesDashboard";

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" errorElement={<ErrorPage />}>
      <Route index element={<Home />} />
      <Route path="login" element={<Login />} />
      <Route path="join" element={<Join />} />
      <Route
        path="manage"
        element={
          <ProtectedRoute>
            <UserCommunitiesDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="admin"
        element={
          <ProtectedRoute>
            <AdminApprovals />
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
