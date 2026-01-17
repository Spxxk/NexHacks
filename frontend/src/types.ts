export type EventSeverity = "informational" | "emergency";
export type EventStatus = "open" | "enroute" | "resolved";
export type AmbulanceStatus = "idle" | "enroute" | "unavailable";

export type IdValue = string | number;

export type Event = {
  id: string;
  severity: EventSeverity;
  title: string;
  description: string;
  reference_clip_url: string;
  lat: number;
  lng: number;
  camera_id: string;
  ambulance_id: number | null;
  status: EventStatus;
  created_at: string;
  resolved_at?: string | null;
};

export type Camera = {
  id: string;
  lat: number;
  lng: number;
  latest_frame_url: string;
  name?: string | null;
};

export type Ambulance = {
  id: string;
  lat: number;
  lng: number;
  status: AmbulanceStatus;
  event_id: number | null;
  eta_seconds?: number | null;
  updated_at: string;
};

export type Hospital = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

export type DrawerSelection =
  | { type: "event"; id: string }
  | { type: "camera"; id: string }
  | { type: "ambulance"; id: string };

export const isEmergencySeverity = (severity: EventSeverity) =>
  severity === "emergency";
