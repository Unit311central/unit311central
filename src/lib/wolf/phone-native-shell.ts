/** Capacitor Android shell (Unit311 / WOLF APK) — native camera when the app is in front. */

export async function isWolfNativeShell(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const { Capacitor } = await import("@capacitor/core");
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export async function captureNativePhotoBlob(): Promise<Blob | null> {
  const { Camera, CameraResultType, CameraSource } = await import("@capacitor/camera");
  const photo = await Camera.getPhoto({
    quality: 90,
    allowEditing: false,
    resultType: CameraResultType.Uri,
    source: CameraSource.Camera,
  });
  const url = photo.webPath ?? photo.path;
  if (!url) return null;
  const response = await fetch(url);
  if (!response.ok) return null;
  return response.blob();
}

export async function readNativeGeolocation(): Promise<{
  latitude: number;
  longitude: number;
  altitudeM: number | null;
  speedMps: number | null;
  headingDeg: number | null;
} | null> {
  const { Geolocation } = await import("@capacitor/geolocation");
  const position = await Geolocation.getCurrentPosition({
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 1000,
  });
  const { latitude, longitude, altitude, speed, heading } = position.coords;
  return {
    latitude,
    longitude,
    altitudeM: Number.isFinite(altitude) ? altitude : null,
    speedMps: speed != null && speed >= 0 ? speed : null,
    headingDeg: heading != null && heading >= 0 ? heading : null,
  };
}
