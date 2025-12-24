fetch("http://localhost:8000/latest")
  .then(r => r.json())
  .then(data => {
    const map = L.map('map').setView([data.lat, data.lng], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    L.marker([data.lat, data.lng])
      .addTo(map)
      .bindPopup(`PM2.5: ${data.pm25}<br>PM10: ${data.pm10}`);
  });