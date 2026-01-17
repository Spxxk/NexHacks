export type EventSeverity = "informational" | "emergency";

export type Event = {
  id: string;
  severity: EventSeverity;
  title: string;
  description: string;
  reference_clip_url: string;
  location: {
    lat: number;
    lng: number;
  };
  camera_id: string;
  ambulance_id: string | null;
  is_resolved: boolean;
  timestamp?: string;
};

export type Camera = {
  id: string;
  events: Event[];
  location: {
    lat: number;
    lng: number;
  };
  url: string;
};

export type Ambulance = {
  id: string;
  location: {
    lat: number;
    lng: number;
  };
  event_id: string | null;
  is_resolved: boolean;
  eta_seconds: number;
};

export type DrawerSelection =
  | { type: "event"; id: string }
  | { type: "camera"; id: string }
  | { type: "ambulance"; id: string };

export const isEmergencySeverity = (severity: EventSeverity) =>
  severity === "emergency";
