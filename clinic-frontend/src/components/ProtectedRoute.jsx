import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../state/auth.jsx";

export default function ProtectedRoute({ children, role }) {
  const { me, loading } = useAuth();

  if (loading) return <div className="container"><div className="card">Loading…</div></div>;
  if (!me) return <Navigate to="/login" replace />;

  if (role && me.role !== role) {
    return <Navigate to="/" replace />;
  }
  return children;
}
