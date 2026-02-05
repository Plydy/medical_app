import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../state/auth.jsx";

export default function NavBar() {
  const { me, logout } = useAuth();
  const nav = useNavigate();

  return (
    <nav>
      <div className="left">
        <Link to="/" style={{ textDecoration: "none" }}><b>Clinic</b></Link>
        {me?.role === "PATIENT" && <Link to="/patient">Panel pacjenta</Link>}
        {me?.role === "DOCTOR" && <Link to="/doctor">Panel lekarza</Link>}
        {me && <Link to="/notifications">Powiadomienia</Link>}
        {me && <Link to="/profile">Profil</Link>}
      </div>
      <div className="right">
        {me ? (
          <>
            <span className="badge">{me.username} · {me.role}</span>
            <button className="secondary" onClick={() => { logout(); nav("/login"); }}>Wyloguj</button>
          </>
        ) : (
          <>
            <Link to="/login">Logowanie</Link>
            <Link to="/register">Rejestracja</Link>
          </>
        )}
      </div>
    </nav>
  );
}
