import type { Ambulance, Camera, Event } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

async function fetchJson<T>(path: string): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${path}`);
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }
    return (await response.json()) as T;
  } catch {
    throw new Error("Network error");
  }
}

/**
 * Fetch current emergency events from the backend.
 */
export function getEvents(): Promise<Event[]> {
  return fetchJson<Event[]>("/events");
}

/**
 * Fetch current camera telemetry from the backend.
 */
export function getCameras(): Promise<Camera[]> {
  return fetchJson<Camera[]>("/cameras");
}

/**
 * Fetch current ambulance locations from the backend.
 */
export function getAmbulances(): Promise<Ambulance[]> {
  return fetchJson<Ambulance[]>("/ambulances");
}
