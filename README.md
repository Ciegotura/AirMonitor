# AirMonitor
## Instalacja środowiska

### Wymagania
- Python 3.8+
- pip

### Kroki instalacji

1. **Przejdź do folderu backend:**
```powershell
cd backend
```

2. **Zainstaluj zależności:**
```powershell
python -m pip install -r requirements.txt
```

3. **Skonfiguruj plik .env:**
W folderze `backend/` powinien być plik `.env` z konfiguracją (jest już przygotowany).

## Uruchomienie aplikacji

Aby odpalić aplikację FastAPI, użyj poniższego polecenia w folderze `backend/`:

```powershell
uvicorn app.main:app --reload
```

Aplikacja będzie dostępna pod adresem: **http://localhost:8000**

### Dodatkowe adresy
- Dokumentacja Swagger: http://localhost:8000/docs
- Dokumentacja ReDoc: http://localhost:8000/redoc