// Kolory dla PM2.5
function getPMColor(pm25) {
    if (!pm25) return '#888888';
    if (pm25 <= 12) return '#00aa00';      // Zielony
    if (pm25 <= 35.4) return '#ffff00';    // Żółty
    if (pm25 <= 55.4) return '#ff7700';    // Pomarańczowy
    if (pm25 <= 150.4) return '#ff0000';   // Czerwony
    return '#8f0000';                       // Ciemny czerwony
}

async function fetchAndShowMeasurements() {
  try {
    const res = await fetch('/measurements');
    if (!res.ok) {
      document.getElementById('db-output').innerText = 'Błąd pobierania: ' + res.status;
      return;
    }
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      document.getElementById('db-output').innerText = 'Brak rekordów w bazie.';
      return;
    }
    // render table
    let html = '<table style="width:100%; border-collapse:collapse;">' +
               '<tr><th>ID</th><th>lat</th><th>lng</th><th>PM2.5</th><th>PM10</th><th>timestamp</th></tr>';
    for (const row of data) {
      html += `<tr style="border-top:1px solid #ddd"><td>${row.id}</td><td>${row.lat}</td><td>${row.lng}</td><td>${row.pm25 ?? ''}</td><td>${row.pm10 ?? ''}</td><td>${row.timestamp ?? ''}</td></tr>`;
    }
    html += '</table>';
    document.getElementById('db-output').innerHTML = html;
  } catch (err) {
    document.getElementById('db-output').innerText = 'Błąd: ' + err;
  }
}

function wireDbButton() {
  const btn = document.getElementById('show-db-btn');
  if (btn) {
    btn.addEventListener('click', () => {
      console.log('Klik: pokaz dane z bazy');
      fetchAndShowMeasurements();
    });
  } else {
    console.warn('Nie znaleziono #show-db-btn');
  }

  const clearBtn = document.getElementById('clear-db-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      console.log('Klik: wyczysc baze');
      try {
        const res = await fetch('/measurements', { method: 'DELETE' });
        const data = await res.json().catch(() => ({}));
        const msg = res.ok
          ? (`Usunięto rekordów: ${data.deleted ?? 'nieznana liczba'}`)
          : (`Błąd usuwania: ${res.status}`);
        const out = document.getElementById('db-output');
        if (out) out.innerText = msg;
      } catch (err) {
        const out = document.getElementById('db-output');
        if (out) out.innerText = 'Błąd: ' + err;
      }
    });
  } else {
    console.warn('Nie znaleziono #clear-db-btn');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', wireDbButton);
} else {
  wireDbButton();
}

// Inicjalizacja mapy
const map = L.map('map').setView([52.237, 21.017], 11);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
}).addTo(map);

// Pobierz pobliskie instalacje
fetch("http://localhost:8000/fetch-nearby?lat=52.237&lng=21.017&distance=5&max_results=30")
    .then(r => r.json())
        .then(data => {
            console.log('Pobliskie instalacje:', data);

            if (!Array.isArray(data)) {
                console.error('Unexpected data from /fetch-nearby:', data);
                return;
            }

            let added = 0;
            data.forEach(point => {
                if (!point || point.lat == null || point.lng == null) return;

                const marker = L.circleMarker(
                    [point.lat, point.lng],
                    {
                        radius: 8,
                        fillColor: getPMColor(point.pm25),
                        color: '#000',
                        weight: 2,
                        opacity: 0.8,
                        fillOpacity: 0.7
                    }
                ).addTo(map);

                const popupText = `
                    <strong>${point.address || 'Punkt pomiarowy'}</strong><br>
                    PM2.5: <strong>${point.pm25 ? point.pm25.toFixed(1) : '--'}</strong> µg/m³<br>
                    PM10: <strong>${point.pm10 ? point.pm10.toFixed(1) : '--'}</strong> µg/m³
                `;
                marker.bindPopup(popupText);
                added += 1;
            });

            console.log(`Dodano ${added} markerów`);
        })
    .catch(e => console.error('Błąd:', e));