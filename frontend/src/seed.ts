import type { Ambulance, Camera, Event } from "./types";

const baseLat = 40.7484;
const baseLng = -73.9857;

const mockEvents: Event[] = [
  {
    id: "evt-1001",
    severity: "emergency",
    title: "High-rise fire alarm",
    description:
      "Thermal spike and smoke plume detected on floors 18–22. Evacuation in progress.",
    reference_clip_url: "http://localhost:3001/frames/evt-1001.jpg",
    location: { lat: baseLat + 0.0042, lng: baseLng - 0.0026 },
    camera_id: "cam-nyc-01",
    ambulance_id: "amb-01",
    is_resolved: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
  },
  {
    id: "evt-1002",
    severity: "informational",
    title: "Crowd surge near plaza",
    description:
      "Density threshold exceeded briefly; crowd flow returned to normal within 6 minutes.",
    reference_clip_url: "http://localhost:3001/frames/evt-1002.jpg",
    location: { lat: baseLat + 0.0021, lng: baseLng + 0.0031 },
    camera_id: "cam-nyc-02",
    ambulance_id: null,
    is_resolved: true,
    timestamp: new Date(Date.now() - 1000 * 60 * 46).toISOString(),
  },
  {
    id: "evt-1003",
    severity: "emergency",
    title: "Subway platform collision",
    description:
      "Impact detected on inbound platform; multiple civilians down. Medical response required.",
    reference_clip_url: "http://localhost:3001/frames/evt-1003.jpg",
    location: { lat: baseLat - 0.0033, lng: baseLng + 0.0014 },
    camera_id: "cam-nyc-03",
    ambulance_id: "amb-02",
    is_resolved: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 9).toISOString(),
  },
  {
    id: "evt-1004",
    severity: "informational",
    title: "Traffic anomaly cleared",
    description: "AI detected stalled vehicles; issue resolved after reroute.",
    reference_clip_url: "http://localhost:3001/frames/evt-1004.jpg",
    location: { lat: baseLat - 0.0015, lng: baseLng - 0.0039 },
    camera_id: "cam-nyc-04",
    ambulance_id: null,
    is_resolved: true,
    timestamp: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
  },
  {
    id: "evt-1005",
    severity: "emergency",
    title: "Bridge impact alert",
    description:
      "Vehicle collision reported on the west approach. Debris present on roadway.",
    reference_clip_url: "http://localhost:3001/frames/evt-1005.jpg",
    location: { lat: baseLat + 0.0061, lng: baseLng + 0.0044 },
    camera_id: "cam-nyc-05",
    ambulance_id: "amb-03",
    is_resolved: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
  },
];

const mockCameras: Camera[] = [
  {
    id: "cam-nyc-01",
    events: mockEvents.filter((event) => event.camera_id === "cam-nyc-01"),
    location: { lat: baseLat + 0.0036, lng: baseLng - 0.0021 },
    url: "http://localhost:3001/latest_frame?camera=cam-nyc-01",
  },
  {
    id: "cam-nyc-02",
    events: mockEvents.filter((event) => event.camera_id === "cam-nyc-02"),
    location: { lat: baseLat + 0.0017, lng: baseLng + 0.0024 },
    url: "http://localhost:3001/latest_frame?camera=cam-nyc-02",
  },
  {
    id: "cam-nyc-03",
    events: mockEvents.filter((event) => event.camera_id === "cam-nyc-03"),
    location: { lat: baseLat - 0.0029, lng: baseLng + 0.0009 },
    url: "http://localhost:3001/latest_frame?camera=cam-nyc-03",
  },
  {
    id: "cam-nyc-04",
    events: mockEvents.filter((event) => event.camera_id === "cam-nyc-04"),
    location: { lat: baseLat - 0.0011, lng: baseLng - 0.0032 },
    url: "http://localhost:3001/latest_frame?camera=cam-nyc-04",
  },
  {
    id: "cam-nyc-05",
    events: mockEvents.filter((event) => event.camera_id === "cam-nyc-05"),
    location: { lat: baseLat + 0.0054, lng: baseLng + 0.0036 },
    url: "http://localhost:3001/latest_frame?camera=cam-nyc-05",
  },
];

const mockAmbulances: Ambulance[] = [
  {
    id: "amb-01",
    location: { lat: baseLat + 0.0047, lng: baseLng - 0.0014 },
    event_id: "evt-1001",
    is_resolved: false,
    eta_seconds: 260,
  },
  {
    id: "amb-02",
    location: { lat: baseLat - 0.0042, lng: baseLng + 0.0022 },
    event_id: "evt-1003",
    is_resolved: false,
    eta_seconds: 420,
  },
  {
    id: "amb-03",
    location: { lat: baseLat + 0.0058, lng: baseLng + 0.0031 },
    event_id: "evt-1005",
    is_resolved: false,
    eta_seconds: 180,
  },
];

export { mockAmbulances, mockCameras, mockEvents };
