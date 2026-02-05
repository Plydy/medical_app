import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../state/auth.jsx";

function fmt(dt) {
  if (!dt) return "—";
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return dt;
  return d.toLocaleString();
}

const LS_KEY = "clinic.notifications.read";

function loadReadSet() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveReadSet(set) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify([...set]));
  } catch {
    // ignore
  }
}

export default function Notifications() {
  const { me } = useAuth();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [items, setItems] = useState([]);
  const [read, setRead] = useState(() => loadReadSet());

  async function load() {
    setErr("");
    setLoading(true);
    try {
      // Backend doesn't have a dedicated notifications app yet.
      // We derive "notifications" from appointments.
      const res = await api.get("appointments/");
      const appts = res.data || [];
      setItems(appts);
    } catch (e) {
      const data = e?.response?.data;
      setErr(data?.detail || (data ? JSON.stringify(data) : "Błąd ładowania"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!me) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.id]);

  const notifications = useMemo(() => {
    const out = [];
    for (const a of items) {
      const id = a.id;
      const when = a.datetime || a.date || a.start || a.time;

      // Heuristic status mapping
      const status = (a.status || "").toUpperCase();
      const isCancelled = status === "CANCELLED" || status === "CANCELED" || a.is_cancelled;
      const isDone = status === "COMPLETED" || status === "DONE" || a.is_completed;

      if (isCancelled) {
        out.push({
          key: `cancel-${id}`,
          kind: "danger",
          title: "Wizyta odwołana",
          text: `Wizyta #${id} została odwołana.`,
          time: when,
          refId: id,
        });
        continue;
      }
      if (isDone) {
        out.push({
          key: `done-${id}`,
          kind: "success",
          title: "Wizyta zakończona",
          text: `Wizyta #${id} została oznaczona jako zakończona.`,
          time: when,
          refId: id,
        });
        continue;
      }

      // pending / planned
      if (me?.role === "DOCTOR") {
        out.push({
          key: `pending-${id}`,
          kind: "info",
          title: "Nowa / oczekująca wizyta",
          text: `Wizyta #${id} oczekuje na decyzję (możesz ją ukończyć lub odwołać).`,
          time: when,
          refId: id,
        });
      } else {
        out.push({
          key: `upcoming-${id}`,
          kind: "info",
          title: "Nadchodząca wizyta",
          text: `Masz zaplanowaną wizytę #${id}.`,
          time: when,
          refId: id,
        });
      }
    }

    // newest first by datetime if possible
    out.sort((a, b) => {
      const da = new Date(a.time || 0).getTime();
      const db = new Date(b.time || 0).getTime();
      if (Number.isNaN(da) && Number.isNaN(db)) return 0;
      if (Number.isNaN(da)) return 1;
      if (Number.isNaN(db)) return -1;
      return db - da;
    });
    return out;
  }, [items, me?.role]);

  function markRead(key) {
    const next = new Set(read);
    next.add(key);
    setRead(next);
    saveReadSet(next);
  }

  function markAllRead() {
    const next = new Set(read);
    for (const n of notifications) next.add(n.key);
    setRead(next);
    saveReadSet(next);
  }

  if (!me) {
    return (
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Powiadomienia</h2>
        <p><small className="muted">Musisz być zalogowany.</small></p>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !read.has(n.key)).length;

  return (
    <div className="card">
      <div className="row" style={{ alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div>
          <h2 style={{ marginTop: 0, marginBottom: 4 }}>Powiadomienia</h2>
          <small className="muted">Zbudowane na podstawie wizyt (backend nie ma jeszcze osobnej tabeli powiadomień).</small>
        </div>
        <div className="row" style={{ gap: 10 }}>
          <button className="secondary" onClick={load} disabled={loading}>Odśwież</button>
          <button onClick={markAllRead} disabled={!notifications.length}>Oznacz wszystko jako przeczytane</button>
        </div>
      </div>

      <div style={{ marginTop: 10 }}>
        {err && <div className="error" style={{ marginBottom: 12 }}>{err}</div>}
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <small className="muted">Nieprzeczytane: <b>{unreadCount}</b></small>
          {loading && <small className="muted">Ładowanie…</small>}
        </div>
      </div>

      <div className="list" style={{ marginTop: 12 }}>
        {notifications.length === 0 ? (
          <div className="panel">
            <div className="panelTitle">Brak</div>
            <p style={{ margin: 0 }}><small className="muted">Nie masz jeszcze żadnych wizyt, więc nie ma powiadomień.</small></p>
          </div>
        ) : (
          notifications.map((n) => {
            const isRead = read.has(n.key);
            return (
              <div key={n.key} className={`notif ${isRead ? "read" : "unread"}`}>
                <div className="row" style={{ justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                  <div>
                    <div className="row" style={{ gap: 8, alignItems: "center" }}>
                      <span className={`badge ${n.kind}`}>{n.title}</span>
                      {!isRead && <span className="dot" title="Nieprzeczytane" />}
                    </div>
                    <div style={{ marginTop: 6 }}>{n.text}</div>
                    <div style={{ marginTop: 6 }}><small className="muted">Termin: {fmt(n.time)}</small></div>
                  </div>
                  <div className="row" style={{ gap: 8 }}>
                    {!isRead && (
                      <button className="secondary" onClick={() => markRead(n.key)}>OK</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
