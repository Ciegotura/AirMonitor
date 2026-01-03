// Kolory dla PM2.5
function getPMColor(pm25) {
    if (!pm25) return '#888888';
    if (pm25 <= 12) return '#00aa00';      // Zielony
    if (pm25 <= 35.4) return '#ffff00';    // Żółty
    if (pm25 <= 55.4) return '#ff7700';    // Pomarańczowy
    if (pm25 <= 150.4) return '#ff0000';   // Czerwony
    return '#8f0000';                       // Ciemny czerwony
}

let allMeasurements = [];
let mapMarkers = [];

// Oblicz statystyki
function updateStatistics(data) {
    const validPM25 = data.filter(d => d.pm25 != null).map(d => d.pm25);
    const validPM10 = data.filter(d => d.pm10 != null).map(d => d.pm10);

    const avgPM25 = validPM25.length > 0 ? (validPM25.reduce((a, b) => a + b, 0) / validPM25.length).toFixed(1) : '--';
    const avgPM10 = validPM10.length > 0 ? (validPM10.reduce((a, b) => a + b, 0) / validPM10.length).toFixed(1) : '--';

    document.getElementById('avg-pm25').innerText = avgPM25;
    document.getElementById('avg-pm10').innerText = avgPM10;
    document.getElementById('measurement-count').innerText = data.length;

    const now = new Date();
    const time = now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('last-update').innerText = time;
}

// Wyświetl pomiary w tabeli
async function fetchAndShowMeasurements() {
  try {
    const res = await fetch('/measurements?limit=500');
    if (!res.ok) {
      document.getElementById('db-output').innerHTML = '<div class="empty-state">Błąd pobierania: ' + res.status + '</div>';
      return;
    }
    const data = await res.json();
    allMeasurements = data;
    
    if (!Array.isArray(data) || data.length === 0) {
      document.getElementById('db-output').innerHTML = '<div class="empty-state">Brak rekordów w bazie.</div>';
      updateStatistics([]);
      return;
    }

    updateStatistics(data);

    // Render table - pokazuj ostatnie 10 pomiarów
    let html = '<table class="measurements-table">' +
               '<thead><tr><th>PM2.5</th><th>PM10</th><th>Czas</th></tr></thead><tbody>';
    
    const recent = data.slice(0, 10);
    for (const row of recent) {
      const time = row.timestamp ? new Date(row.timestamp).toLocaleTimeString('pl-PL') : '--';
      html += `<tr>
                <td><strong>${row.pm25 ? row.pm25.toFixed(1) : '--'}</strong></td>
                <td>${row.pm10 ? row.pm10.toFixed(1) : '--'}</td>
                <td style="font-size: 11px; color: #999;">${time}</td>
              </tr>`;
    }
    html += '</tbody></table>';
    document.getElementById('db-output').innerHTML = html;
  } catch (err) {
    document.getElementById('db-output').innerHTML = '<div class="empty-state">Błąd: ' + err + '</div>';
  }
}

// Wczytaj i wyświetl mapę
async function loadMapData() {
  try {
    const res = await fetch('/measurements?limit=500');
    if (!res.ok) return;
    
    const data = await res.json();
    
    if (!Array.isArray(data)) {
      console.error('Unexpected data format:', data);
      return;
    }

    // Usuń stare markery
    mapMarkers.forEach(marker => map.removeLayer(marker));
    mapMarkers = [];

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
            <div style="font-size: 13px;">
                <strong>Punkt pomiarowy</strong><br>
                <hr style="margin: 5px 0;">
                PM2.5: <strong>${point.pm25 ? point.pm25.toFixed(1) : '--'}</strong> µg/m³<br>
                PM10: <strong>${point.pm10 ? point.pm10.toFixed(1) : '--'}</strong> µg/m³<br>
                <small style="color: #666;">Szer: ${point.lat.toFixed(4)}, Dł: ${point.lng.toFixed(4)}</small>
            </div>
        `;
        marker.bindPopup(popupText);
        mapMarkers.push(marker);
        added += 1;
    });

    console.log(`Dodano ${added} markerów`);
  } catch (e) {
    console.error('Błąd ładowania mapy:', e);
  }
}

// Obsługa przycisków
function wireButtons() {
  const showDbBtn = document.getElementById('show-db-btn');
  if (showDbBtn) {
    showDbBtn.addEventListener('click', () => {
      console.log('Klik: pokaz dane z bazy');
      fetchAndShowMeasurements();
    });
  }

  const refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      console.log('Klik: odswież');
      loadMapData();
      fetchAndShowMeasurements();
    });
  }

  const clearBtn = document.getElementById('clear-db-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      if (confirm('Czy na pewno chcesz usunąć wszystkie pomiary?')) {
        try {
          const res = await fetch('/measurements', { method: 'DELETE' });
          const data = await res.json().catch(() => ({}));
          if (res.ok) {
            alert(`Usunięto rekordów: ${data.deleted ?? 'nieznana liczba'}`);
            loadMapData();
            fetchAndShowMeasurements();
          } else {
            alert(`Błąd usuwania: ${res.status}`);
          }
        } catch (err) {
          alert('Błąd: ' + err);
        }
      }
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', wireButtons);
} else {
  wireButtons();
}

// Inicjalizacja mapy
const map = L.map('map').setView([50.06, 19.93], 11);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
}).addTo(map);

// Wczytaj dane przy starcie
window.addEventListener('load', () => {
  loadMapData();
  fetchAndShowMeasurements();
});

// Odśwież dane co 30 sekund
setInterval(() => {
  loadMapData();
  fetchAndShowMeasurements();
}, 30000);