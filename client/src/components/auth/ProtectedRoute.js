// client/src/components/ProtectedRoute.js
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext"; // Fixed import path to match your structure

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth(); // Simplified to match your existing AuthContext
  const location = useLocation();

  console.log("🛡️ ProtectedRoute Check:", {
    currentPath: location.pathname,
    loading,
    user: user?.email,
    userRole: user?.role,
    adminOnly,
  });

  // Show loading while checking authentication
  if (loading) {
    console.log("⏳ ProtectedRoute: Still loading authentication...");
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "60vh" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="ms-3">Checking authentication...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    console.log("🔒 ProtectedRoute: Not authenticated, redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to home if admin access required but user is not admin
  if (adminOnly && user.role !== "admin") {
    console.log(
      "⛔ ProtectedRoute: Admin required but user is not admin, redirecting to home",
    );
    return <Navigate to="/" replace />;
  }

  console.log("✅ ProtectedRoute: Access granted, rendering children");
  return children;
};

export default ProtectedRoute;
