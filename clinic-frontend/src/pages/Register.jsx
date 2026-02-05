import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../state/auth.jsx";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
  });
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  function setField(k, v) { setForm((p) => ({ ...p, [k]: v })); }

  async function onSubmit(e) {
    e.preventDefault();
    setErr(""); setOk("");
    try {
      await register(form);
      setOk("Konto utworzone. Zalogowano.");
      nav("/");
    } catch (e2) {
      const data = e2?.response?.data;
      const msg = data?.detail || (data ? JSON.stringify(data) : "Błąd rejestracji");
      setErr(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
  }

  return (
    <div className="card" style={{ maxWidth: 720 }}>
      <h2 style={{ marginTop: 0 }}>Rejestracja pacjenta</h2>
      {err && <div className="error" style={{ marginBottom: 12 }}>{err}</div>}
      {ok && <div className="success" style={{ marginBottom: 12 }}>{ok}</div>}
      <form onSubmit={onSubmit}>
        <div className="row">
          <div className="col">
            <label>Login*</label>
            <input value={form.username} onChange={(e)=>setField("username", e.target.value)} />
          </div>
          <div className="col">
            <label>Hasło* (min 6)</label>
            <input type="password" value={form.password} onChange={(e)=>setField("password", e.target.value)} />
          </div>
        </div>

        <div style={{ height: 10 }} />
        <div className="row">
          <div className="col">
            <label>Imię</label>
            <input value={form.first_name} onChange={(e)=>setField("first_name", e.target.value)} />
          </div>
          <div className="col">
            <label>Nazwisko</label>
            <input value={form.last_name} onChange={(e)=>setField("last_name", e.target.value)} />
          </div>
        </div>

        <div style={{ height: 10 }} />
        <div className="row">
          <div className="col">
            <label>E-mail</label>
            <input value={form.email} onChange={(e)=>setField("email", e.target.value)} />
          </div>
          <div className="col">
            <label>Telefon</label>
            <input value={form.phone} onChange={(e)=>setField("phone", e.target.value)} />
          </div>
        </div>

        <div style={{ height: 14 }} />
        <button>Zarejestruj</button>
      </form>

      <p style={{ marginBottom: 0 }}>
        <small className="muted">Masz konto? <Link to="/login">Logowanie</Link></small>
      </p>
    </div>
  );
}
