// Utilitats de geolocalització

export function obtePosicioActual({ altaPrecisio = true, timeout = 15000 } = {}) {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Aquest dispositiu/navegador no suporta geolocalització."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      (err) => reject(err),
      { enableHighAccuracy: altaPrecisio, timeout, maximumAge: 0 }
    );
  });
}

export function vigilaPosicio(onPosicio, onError) {
  if (!("geolocation" in navigator)) {
    onError(new Error("Aquest dispositiu/navegador no suporta geolocalització."));
    return null;
  }
  return navigator.geolocation.watchPosition(onPosicio, onError, {
    enableHighAccuracy: true,
    maximumAge: 5000,
    timeout: 20000,
  });
}

export function aturaVigilancia(watchId) {
  if (watchId != null) navigator.geolocation.clearWatch(watchId);
}

// Distància en metres entre dos punts (fórmula de Haversine)
export function distanciaMetres(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
