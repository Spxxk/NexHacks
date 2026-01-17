import { useEffect, useMemo, useRef, useState } from "react";
import Alert, { type AlertItem } from "./components/Alert";
import Button from "./components/Button";
import Drawer from "./components/Drawer";
import LifelineMap from "./components/LifelineMap";
import type {
  AmbulanceItem,
  CameraItem,
  DrawerSelection,
  EventItem,
} from "./types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

const seedEvents: EventItem[] = [
  {
    id: "evt-201",
    title: "Seismic tremor - Midtown",
    description:
      "AI detected structural stress and civilian clustering. Thermal bloom indicates possible collapse risk.",
    severity: 5,
    etaMinutes: 4,
    referenceFrameUrl:
      "https://placehold.co/600x400/png?text=AI+Reference+Frame",
    location: { lat: 40.7495, lng: -73.9874 },
    assignedAmbulanceId: "amb-3",
    cameraIds: ["cam-12", "cam-18"],
  },
  {
    id: "evt-204",
    title: "Transit collision - Harbor Line",
    description:
      "Anomalous braking event detected. Crowd density elevated; recommend rapid triage dispatch.",
    severity: 3,
    etaMinutes: 7,
    referenceFrameUrl:
      "https://placehold.co/600x400/png?text=AI+Reference+Frame",
    location: { lat: 40.7422, lng: -73.9721 },
    assignedAmbulanceId: "amb-1",
    cameraIds: ["cam-06"],
  },
];

const seedCameras: CameraItem[] = [
  {
    id: "cam-12",
    name: "Astra-12",
    status: "online",
    logs: [
      "Detected panicked movement; likely evacuation ongoing.",
      "Thermal variance exceeds baseline by 22%.",
    ],
    snapshotUrl: "https://placehold.co/600x400/png?text=AI+Snapshot",
    location: { lat: 40.7501, lng: -73.9866 },
  },
  {
    id: "cam-18",
    name: "Astra-18",
    status: "online",
    logs: ["Roadway obstruction detected.", "Crowd flow moving eastbound."],
    snapshotUrl: "https://placehold.co/600x400/png?text=AI+Snapshot",
    location: { lat: 40.7488, lng: -73.9848 },
  },
  {
    id: "cam-06",
    name: "Astra-06",
    status: "degraded",
    logs: ["Signal noise elevated.", "Switching to fallback visual feed."],
    snapshotUrl: "https://placehold.co/600x400/png?text=AI+Snapshot",
    location: { lat: 40.7439, lng: -73.9742 },
  },
];

const seedAmbulances: AmbulanceItem[] = [
  {
    id: "amb-1",
    name: "Ambulance Orion-1",
    etaMinutes: 6,
    location: { lat: 40.7414, lng: -73.969 },
    targetEventId: "evt-204",
  },
  {
    id: "amb-3",
    name: "Ambulance Orion-3",
    etaMinutes: 3,
    location: { lat: 40.7519, lng: -73.9881 },
    targetEventId: "evt-201",
  },
];

async function fetchEndpoint<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${API_BASE}${path}`);
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

/**
 * Top-level Lifeline application component.
 */
function App() {
  const [events, setEvents] = useState<EventItem[]>(seedEvents);
  const [cameras, setCameras] = useState<CameraItem[]>(seedCameras);
  const [ambulances, setAmbulances] = useState<AmbulanceItem[]>(seedAmbulances);
  const [selection, setSelection] = useState<DrawerSelection | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  const seenEventIds = useRef(new Set(seedEvents.map((event) => event.id)));

  // Poll backend for live updates.
  useEffect(() => {
    let mounted = true;

    const poll = async () => {
      const [eventsData, camerasData, ambulancesData] = await Promise.all([
        fetchEndpoint<EventItem[]>("/events"),
        fetchEndpoint<CameraItem[]>("/cameras"),
        fetchEndpoint<AmbulanceItem[]>("/ambulances"),
      ]);

      if (!mounted) return;
      if (eventsData) setEvents(eventsData);
      if (camerasData) setCameras(camerasData);
      if (ambulancesData) setAmbulances(ambulancesData);
    };

    poll();
    const interval = window.setInterval(poll, 5000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  // Notify on new high-severity events.
  useEffect(() => {
    const newAlerts: AlertItem[] = [];

    events.forEach((event) => {
      if (event.severity >= 4 && !seenEventIds.current.has(event.id)) {
        seenEventIds.current.add(event.id);
        newAlerts.push({
          id: `alert-${event.id}`,
          title: `High Severity: ${event.title}`,
          description: `Severity ${event.severity} • ETA ${event.etaMinutes} min`,
        });
      }
    });

    if (newAlerts.length) {
      setAlerts((prev) => [...newAlerts, ...prev].slice(0, 4));
    }
  }, [events]);

  const selectedEntity = useMemo(() => {
    if (!selection) return null;
    if (selection.type === "event") {
      return events.find((event) => event.id === selection.id) ?? null;
    }
    if (selection.type === "camera") {
      return cameras.find((camera) => camera.id === selection.id) ?? null;
    }
    return (
      ambulances.find((ambulance) => ambulance.id === selection.id) ?? null
    );
  }, [selection, events, cameras, ambulances]);

  return (
    <div className="h-screen bg-slate-950 text-slate-100">
      <div className="relative flex h-full flex-col">
        <nav className="flex items-center justify-between border-b border-white/10 bg-slate-950/80 px-6 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-lg font-semibold text-cyan-200">
              L
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-[0.2em] text-cyan-200">
                Lifeline
              </h1>
              <p className="text-xs text-slate-400">
                Turing City Emergency Grid
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right text-xs text-slate-300">
              <p className="text-sm font-semibold">Operator Ava K.</p>
              <p className="text-slate-500">Command Tier • On Duty</p>
            </div>
            <Button variant="outline">Sign Out</Button>
          </div>
        </nav>

        <div className="relative flex flex-1 overflow-hidden">
          <main className="flex-1">
            <LifelineMap
              events={events}
              cameras={cameras}
              ambulances={ambulances}
              selection={selection}
              onSelect={(next) => setSelection(next)}
            />
          </main>

          <Drawer
            title={
              selection?.type === "event"
                ? "Emergency Event"
                : selection?.type === "camera"
                  ? "Camera Feed"
                  : selection?.type === "ambulance"
                    ? "Ambulance Unit"
                    : "Select a marker"
            }
            subtitle={selection ? "Live Intelligence" : "Map only"}
            isOpen={Boolean(selection)}
            onClose={() => setSelection(null)}
          >
            {!selection && (
              <p className="text-sm text-slate-400">
                Select an event, camera, or ambulance marker to inspect detailed
                telemetry.
              </p>
            )}

            {selection?.type === "event" && selectedEntity && (
              <div className="space-y-4">
                <div>
                  <p className="text-base font-semibold">
                    {(selectedEntity as EventItem).title}
                  </p>
                  <p className="text-sm text-slate-400">
                    {(selectedEntity as EventItem).description}
                  </p>
                </div>
                <div className="grid gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Severity</span>
                    <span className="rounded-full bg-red-500/20 px-2 py-1 text-red-200">
                      {(selectedEntity as EventItem).severity}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Ambulance ETA</span>
                    <span className="text-cyan-200">
                      {(selectedEntity as EventItem).etaMinutes} min
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Reference frame and AI assessment embedded below.
                  </div>
                </div>
                <img
                  src={(selectedEntity as EventItem).referenceFrameUrl}
                  alt="AI reference frame"
                  className="w-full rounded-2xl border border-white/10"
                />
              </div>
            )}

            {selection?.type === "camera" && selectedEntity && (
              <div className="space-y-4">
                <div>
                  <p className="text-base font-semibold">
                    {(selectedEntity as CameraItem).name}
                  </p>
                  <p className="text-xs text-slate-400">
                    Status: {(selectedEntity as CameraItem).status}
                  </p>
                </div>
                <img
                  src={(selectedEntity as CameraItem).snapshotUrl}
                  alt="Camera snapshot"
                  className="w-full rounded-2xl border border-white/10"
                />
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Recent AI Logs
                  </p>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {(selectedEntity as CameraItem).logs.map((log) => (
                      <li
                        key={log}
                        className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2"
                      >
                        {log}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {selection?.type === "ambulance" && selectedEntity && (
              <div className="space-y-4">
                <div>
                  <p className="text-base font-semibold">
                    {(selectedEntity as AmbulanceItem).name}
                  </p>
                  <p className="text-xs text-slate-400">
                    ETA: {(selectedEntity as AmbulanceItem).etaMinutes} min
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-xs text-slate-300">
                  <p className="text-slate-400">Assigned Event</p>
                  <p>
                    {(selectedEntity as AmbulanceItem).targetEventId ??
                      "Awaiting dispatch"}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-xs text-slate-300">
                  <p className="text-slate-400">Location</p>
                  <p>
                    {(selectedEntity as AmbulanceItem).location.lat.toFixed(4)},
                    {(selectedEntity as AmbulanceItem).location.lng.toFixed(4)}
                  </p>
                </div>
              </div>
            )}
          </Drawer>

          <Alert
            items={alerts}
            onDismiss={(id) =>
              setAlerts((prev) => prev.filter((item) => item.id !== id))
            }
          />
        </div>
      </div>
    </div>
  );
}

export default App;
