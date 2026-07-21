export async function getCurrentPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Geolocation is not supported"));

    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 }
    );
  });
}
export type LatLng = { lat: number; lng: number };

export function googleMapsDirectionsUrl(dest: LatLng, origin?: LatLng): string {
  const destination = `${dest.lat},${dest.lng}`;
  const base = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;

  if (!origin) return base;

  const o = `${origin.lat},${origin.lng}`;
  return `${base}&origin=${encodeURIComponent(o)}`;
}

export function googleMapsCenterUrl({ lat, lng }: LatLng, zoom = 16): string {
  // @lat,lng,zoomz
  return `https://www.google.com/maps/@${lat},${lng},${zoom}z`;
}

export function toLocalDateTimeString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function googleMapsSearchUrl({ lat, lng }: LatLng, zoom = 16): string {
  const q = `${lat},${lng}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    q
  )}&zoom=${zoom}`;
}