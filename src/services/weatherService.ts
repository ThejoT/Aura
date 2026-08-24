import Geolocation from '@react-native-community/geolocation';
import { PERMISSIONS, RESULTS, request } from 'react-native-permissions';
import { Platform } from 'react-native';

export interface WeatherReading {
  pressureHpa: number;
  temperatureC: number;
}

/**
 * Barometric pressure and temperature are a documented migraine trigger
 * that people cannot reliably self-report, so this is pulled automatically
 * rather than asked as a diary question. Uses Open-Meteo — free, no API
 * key, no account — so this stays a direct on-device call rather than a
 * dependency on an Aura backend (there isn't one). Only coordinates are
 * sent; no health data ever leaves the device.
 */
async function requestLocationPermission(): Promise<boolean> {
  const permission = Platform.select({
    ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
    android: PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION,
  });
  if (!permission) return false;
  const result = await request(permission);
  return result === RESULTS.GRANTED || result === RESULTS.LIMITED;
}

function getCurrentPosition(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      err => reject(err),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 10 * 60 * 1000 },
    );
  });
}

/** Fetches the current reading for "today". */
export async function fetchCurrentWeather(): Promise<WeatherReading | null> {
  const granted = await requestLocationPermission();
  if (!granted) return null;

  try {
    const { latitude, longitude } = await getCurrentPosition();
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=surface_pressure,temperature_2m`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    const pressureHpa = json?.current?.surface_pressure;
    const temperatureC = json?.current?.temperature_2m;
    if (typeof pressureHpa !== 'number' || typeof temperatureC !== 'number') return null;
    return { pressureHpa, temperatureC };
  } catch {
    return null;
  }
}

/** Backfills a past diary date using Open-Meteo's free historical archive endpoint. */
export async function fetchHistoricalWeather(dateKey: string): Promise<WeatherReading | null> {
  const granted = await requestLocationPermission();
  if (!granted) return null;

  try {
    const { latitude, longitude } = await getCurrentPosition();
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${dateKey}&end_date=${dateKey}&hourly=surface_pressure,temperature_2m`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    const pressures: number[] | undefined = json?.hourly?.surface_pressure;
    const temps: number[] | undefined = json?.hourly?.temperature_2m;
    if (!pressures?.length || !temps?.length) return null;
    // Midday reading is a reasonable single daily representative value.
    const idx = Math.min(12, pressures.length - 1);
    return { pressureHpa: pressures[idx], temperatureC: temps[idx] };
  } catch {
    return null;
  }
}
