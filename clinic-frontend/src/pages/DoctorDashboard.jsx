import React, { useEffect, useState } from "react";
import { api } from "../api/client.js";

function fmt(dt) {
  try { return new Date(dt).toLocaleString(); } catch { return dt; }
}

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  async function load() {
    setErr(""); setOk("");
    try {
      const r = await api.get("appointments/");
      setAppointments(r.data);
    } catch (e) {
      setErr(e?.response?.data?.detail || "Błąd pobierania wizyt");
    }
  }

  useEffect(() => { load(); }, []);

  async function complete(id) {
    setErr(""); setOk("");
    try {
      await api.patch(`appointments/${id}/complete/`);
      setOk("Oznaczono jako zakończone.");
      await load();
    } catch (e2) {
      const data = e2?.response?.data;
      const msg = data?.detail || (data ? JSON.stringify(data) : "Błąd");
      setErr(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
  }

  async function cancel(id) {
    setErr(""); setOk("");
    try {
      await api.patch(`appointments/${id}/cancel/`);
      setOk("Anulowano.");
      await load();
    } catch (e2) {
      const data = e2?.response?.data;
      const msg = data?.detail || (data ? JSON.stringify(data) : "Błąd");
      setErr(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
  }

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Panel lekarza</h2>
      {err && <div className="error" style={{ marginBottom: 12 }}>{err}</div>}
      {ok && <div className="success" style={{ marginBottom: 12 }}>{ok}</div>}

      <table>
        <thead>
          <tr>
            <th>Termin</th>
            <th>Pacjent</th>
            <th>Powód</th>
            <th>Status</th>
            <th style={{ width: 260 }}>Akcje</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((a) => (
            <tr key={a.id}>
              <td>{fmt(a.scheduled_at)}</td>
              <td>{a.patient?.id ? `patient#${a.patient.id}` : String(a.patient)}</td>
              <td>{a.reason || <small className="muted">—</small>}</td>
              <td><span className="badge">{a.status}</span></td>
              <td>
                <div className="row" style={{ gap: 10 }}>
                  <div className="col" style={{ flex: "1 1 120px" }}>
                    <button
                      onClick={() => complete(a.id)}
                      disabled={a.status !== "scheduled"}
                      title={a.status !== "scheduled" ? "Tylko scheduled" : ""}
                    >
                      Zakończ
                    </button>
                  </div>
                  <div className="col" style={{ flex: "1 1 120px" }}>
                    <button
                      className="danger"
                      onClick={() => cancel(a.id)}
                      disabled={a.status !== "scheduled"}
                    >
                      Anuluj
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          ))}
          {appointments.length === 0 && (
            <tr><td colSpan="5"><small className="muted">Brak wizyt.</small></td></tr>
          )}
        </tbody>
      </table>

      <p style={{ marginBottom: 0, marginTop: 12 }}>
        <small className="muted">
          Uwaga: backend pokazuje wizyty lekarza tylko jeśli konto ma <code>is_staff=True</code>.
          “Potwierdzenie” w tym demo realizujemy przez zakończenie wizyty (endpoint <code>/complete/</code>).
        </small>
      </p>
    </div>
  );
}
