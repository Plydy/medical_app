import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/client.js";

function fmt(dt) {
  try { return new Date(dt).toLocaleString(); } catch { return dt; }
}

export default function PatientDashboard() {
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const [doctorId, setDoctorId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [reason, setReason] = useState("");

  async function load() {
    setErr(""); setOk("");
    try {
      const [d, a] = await Promise.all([
        api.get("doctors/"),
        api.get("appointments/"),
      ]);
      setDoctors(d.data);
      setAppointments(a.data);
      if (!doctorId && d.data?.[0]?.id) setDoctorId(String(d.data[0].id));
    } catch (e) {
      setErr(e?.response?.data?.detail || "Błąd pobierania danych");
    }
  }

  useEffect(() => { load(); }, []);

  const canSubmit = useMemo(() => doctorId && scheduledAt, [doctorId, scheduledAt]);

  async function createAppointment(e) {
    e.preventDefault();
    setErr(""); setOk("");
    try {
      // datetime-local gives local time without timezone -> backend expects ISO; sending with seconds + timezone
      const iso = new Date(scheduledAt).toISOString();
      const r = await api.post("appointments/", {
        doctor_id: Number(doctorId),
        scheduled_at: iso,
        reason
      });
      setOk("Wizyta utworzona.");
      setReason("");
      await load();
    } catch (e2) {
      const data = e2?.response?.data;
      const msg = data?.detail || (data ? JSON.stringify(data) : "Błąd tworzenia wizyty");
      setErr(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
  }

  async function cancelAppointment(id) {
    setErr(""); setOk("");
    try {
      await api.patch(`appointments/${id}/cancel/`);
      setOk("Anulowano.");
      await load();
    } catch (e2) {
      const data = e2?.response?.data;
      const msg = data?.detail || (data ? JSON.stringify(data) : "Błąd anulowania");
      setErr(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
  }

  return (
    <div className="row">
      <div className="col">
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Nowa rejestracja</h2>
          {err && <div className="error" style={{ marginBottom: 12 }}>{err}</div>}
          {ok && <div className="success" style={{ marginBottom: 12 }}>{ok}</div>}

          <form onSubmit={createAppointment}>
            <label>Lekarz</label>
            <select value={doctorId} onChange={(e)=>setDoctorId(e.target.value)}>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.first_name || d.last_name ? `${d.first_name} ${d.last_name}` : d.username} (id:{d.id})
                </option>
              ))}
            </select>

            <div style={{ height: 10 }} />
            <label>Data i godzina</label>
            <input type="datetime-local" value={scheduledAt} onChange={(e)=>setScheduledAt(e.target.value)} />

            <div style={{ height: 10 }} />
            <label>Powód (opcjonalnie)</label>
            <textarea value={reason} onChange={(e)=>setReason(e.target.value)} placeholder="np. ból brzucha, kontrola..." />

            <div style={{ height: 14 }} />
            <button disabled={!canSubmit} title={!canSubmit ? "Wybierz lekarza i datę" : ""}>
              Zapisz się
            </button>

            <p style={{ marginBottom: 0, marginTop: 10 }}>
              <small className="muted">
                Backend wymaga: termin w przyszłości oraz (w tym demo) slot obok istniejących zapisów ±1h, jeśli lekarz ma już wizyty tego dnia.
              </small>
            </p>
          </form>
        </div>
      </div>

      <div className="col">
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Moje wizyty</h2>
          <table>
            <thead>
              <tr>
                <th>Termin</th>
                <th>Lekarz</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a.id}>
                  <td>{fmt(a.scheduled_at)}</td>
                  <td>{a.doctor?.username || a.doctor}</td>
                  <td><span className="badge">{a.status}</span></td>
                  <td style={{ width: 160 }}>
                    {a.status === "scheduled" ? (
                      <button className="danger" onClick={() => cancelAppointment(a.id)}>Anuluj</button>
                    ) : (
                      <button className="secondary" disabled>—</button>
                    )}
                  </td>
                </tr>
              ))}
              {appointments.length === 0 && (
                <tr><td colSpan="4"><small className="muted">Brak wizyt.</small></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
