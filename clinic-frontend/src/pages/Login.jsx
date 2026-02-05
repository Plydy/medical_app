import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../state/auth.jsx";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      await login(username, password);
      nav("/");
    } catch (e2) {
      const msg = e2?.response?.data?.detail || "Błąd logowania";
      setErr(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
  }

  return (
    <div className="card" style={{ maxWidth: 520 }}>
      <h2 style={{ marginTop: 0 }}>Logowanie</h2>
      {err && <div className="error" style={{ marginBottom: 12 }}>{err}</div>}
      <form onSubmit={onSubmit}>
        <label>Login</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" />
        <div style={{ height: 10 }} />
        <label>Hasło</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        <div style={{ height: 14 }} />
        <button>Zaloguj</button>
      </form>
      <p style={{ marginBottom: 0 }}>
        <small className="muted">Nie masz konta? <Link to="/register">Rejestracja</Link></small>
      </p>
    </div>
  );
}
