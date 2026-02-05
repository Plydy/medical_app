import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../state/auth.jsx";

function initials(u) {
  const s = `${u?.first_name || ""} ${u?.last_name || ""}`.trim() || u?.username || "?";
  return s
    .split(/\s+/)
    .slice(0, 2)
    .map((x) => x[0]?.toUpperCase())
    .join("");
}

export default function Profile() {
  const { me, refreshMe, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  // Local editable fields (backend currently exposes only GET /api/me/).
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (!me) return;
    setForm({
      first_name: me.first_name || "",
      last_name: me.last_name || "",
      email: me.email || "",
      phone: me.phone || "",
    });
  }, [me]);

  const roleLabel = useMemo(() => {
    if (!me?.role) return "—";
    if (me.role === "DOCTOR") return "Lekarz";
    if (me.role === "PATIENT") return "Pacjent";
    return me.role;
  }, [me]);

  async function reload() {
    setErr("");
    setOk("");
    setLoading(true);
    try {
      await refreshMe();
      setOk("Odświeżono dane.");
    } catch {
      setErr("Nie udało się odświeżyć profilu.");
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    // Optional: if you implement PATCH /api/me/ in backend, this will work.
    // If not implemented, we show a helpful message.
    setErr("");
    setOk("");
    setLoading(true);
    try {
      await api.patch("me/", form);
      await refreshMe();
      setOk("Zapisano zmiany.");
    } catch (e) {
      const status = e?.response?.status;
      if (status === 404 || status === 405) {
        setErr(
          "Backend nie obsługuje jeszcze edycji profilu (brak PATCH /api/me/). Strona profilu działa w trybie podglądu."
        );
      } else {
        const data = e?.response?.data;
        const msg = data?.detail || (data ? JSON.stringify(data) : "Błąd zapisu");
        setErr(typeof msg === "string" ? msg : JSON.stringify(msg));
      }
    } finally {
      setLoading(false);
    }
  }

  if (!me) {
    return (
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Profil</h2>
        <p><small className="muted">Musisz być zalogowany.</small></p>
      </div>
    );
  }

  return (
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Profil</h2>

        <div className="panel">
          <div className="panelTitle">Dane konta</div>

          <div className="row" style={{ justifyContent: "space-between" }}>
            <strong>Imię</strong>
            <span>{me.first_name || "—"}</span>
          </div>

          <div className="row" style={{ justifyContent: "space-between" }}>
            <strong>Nazwisko</strong>
            <span>{me.last_name || "—"}</span>
          </div>

          <div className="row" style={{ justifyContent: "space-between" }}>
            <strong>E-mail</strong>
            <span>{me.email || "—"}</span>
          </div>

          <div className="row" style={{ justifyContent: "space-between" }}>
            <strong>Telefon</strong>
            <span>{me.phone || "—"}</span>
          </div>
        </div>

        <div
            style={{
              marginTop: 16,
              padding: 12,
              background: "rgba(255,255,255,0.06)",
              borderLeft: "4px solid #4b8cff",
              color: "#e5e7eb",
            }}
        >
          <strong>Informacja</strong>
          <p style={{ marginTop: 6 }}>
            Zmiana danych użytkownika możliwa jest wyłącznie podczas wizyty osobistej
            w placówce.
          </p>
        </div>
      </div>
  );
}
