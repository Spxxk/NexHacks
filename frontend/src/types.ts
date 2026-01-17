export type Severity = 1 | 2 | 3 | 4 | 5;

export type EventItem = {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  etaMinutes: number;
  referenceFrameUrl: string;
  location: {
    lat: number;
    lng: number;
  };
  assignedAmbulanceId?: string;
  cameraIds?: string[];
};

export type CameraItem = {
  id: string;
  name: string;
  status: "online" | "offline" | "degraded";
  logs: string[];
  snapshotUrl: string;
  location: {
    lat: number;
    lng: number;
  };
};

export type AmbulanceItem = {
  id: string;
  name: string;
  etaMinutes: number;
  location: {
    lat: number;
    lng: number;
  };
  targetEventId?: string;
};

export type DrawerSelection =
  | { type: "event"; id: string }
  | { type: "camera"; id: string }
  | { type: "ambulance"; id: string };
