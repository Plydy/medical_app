# Clinic frontend (React + Vite)

Frontend pod backend Django z `back.zip`.

## Wymagania
- Node.js 18+ (najlepiej 20+)
- Backend uruchomiony na `http://localhost:8000`

## Start
1) Wejdź do folderu:
```bash
cd clinic-frontend
```

2) Skopiuj env:
```bash
cp .env.example .env
```

3) Zainstaluj paczki i uruchom:
```bash
npm install
npm run dev
```

Wejdź: `http://localhost:5173`

## API użyte w tym froncie
- POST `/api/auth/register/` — rejestracja pacjenta (zwraca access/refresh)
- POST `/api/auth/token/` — logowanie (access/refresh)
- POST `/api/auth/token/refresh/` — odświeżanie access
- GET `/api/me/` — aktualny użytkownik (w tym `role`)
- GET `/api/doctors/` — lista lekarzy
- GET/POST `/api/appointments/` — lista / tworzenie wizyt
- PATCH `/api/appointments/<id>/cancel/`
- PATCH `/api/appointments/<id>/complete/`

## Ważne o kontach lekarzy
Backend filtruje widok lekarza po `is_staff=True`.
Lekarza najlepiej tworzyć w Django Admin i ustawić:
- `is_staff = True`
- w `Profile` ustawić `role = DOCTOR`

