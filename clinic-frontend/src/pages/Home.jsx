import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../state/auth.jsx";

export default function Home() {
  const { me } = useAuth();
  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>System rejestracji wizyt</h2>
      {!me ? (
        <>
          <p>Zaloguj się lub zarejestruj jako pacjent.</p>
          <div className="row">
            <div className="col"><Link to="/login"><button>Logowanie</button></Link></div>
            <div className="col"><Link to="/register"><button className="secondary">Rejestracja</button></Link></div>
          </div>
          <p><small className="muted">Lekarzy zakłada admin w Django (is_staff + profil DOCTOR).</small></p>
        </>
      ) : (
        <>
          <p>Jesteś zalogowany jako <b>{me.username}</b> ({me.role}).</p>

          <div className="row">
            {me.role === "PATIENT" && (
              <div className="col">
                <div className="panel">
                  <div className="panelTitle">Panel pacjenta</div>
                  <small className="muted">Umawiaj wizyty i sprawdzaj status.</small>
                  <div style={{ marginTop: 10 }}>
                    <Link to="/patient"><button>Otwórz</button></Link>
                  </div>
                </div>
              </div>
            )}
            {me.role === "DOCTOR" && (
              <div className="col">
                <div className="panel">
                  <div className="panelTitle">Panel lekarza</div>
                  <small className="muted">Zarządzaj wizytami i pacjentami.</small>
                  <div style={{ marginTop: 10 }}>
                    <Link to="/doctor"><button>Otwórz</button></Link>
                  </div>
                </div>
              </div>
            )}

            <div className="col">
              <div className="panel">
                <div className="panelTitle">Profil</div>
                <small className="muted">Twoje dane konta i rola.</small>
                <div style={{ marginTop: 10 }}>
                  <Link to="/profile"><button className="secondary">Zobacz</button></Link>
                </div>
              </div>
            </div>

            <div className="col">
              <div className="panel">
                <div className="panelTitle">Powiadomienia</div>
                <small className="muted">Szybki podgląd ważnych zdarzeń.</small>
                <div style={{ marginTop: 10 }}>
                  <Link to="/notifications"><button className="secondary">Otwórz</button></Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
