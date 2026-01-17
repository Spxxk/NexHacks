import { useEffect, useMemo, useRef, useState } from "react";
import {
  NotificationStack,
  type NotificationItem,
} from "./components/Notification";
import Drawer from "./components/Drawer";
import LifelineMap from "./components/LifelineMap";
import Navbar from "./components/Navbar";
import EventsPage from "./pages/Events";
import { useAmbulances, useCameras, useEvents } from "./hooks/api";
import type { Ambulance, Camera, DrawerSelection, Event } from "./types";
import { isEmergencySeverity } from "./types";
import EventDrawer from "./components/drawers/EventDrawer";
import CameraDrawer from "./components/drawers/CameraDrawer";
import AmbulanceDrawer from "./components/drawers/AmbulanceDrawer";

/**
 * Top-level Lifeline application component.
 */
function App() {
  const { data: events } = useEvents();
  const { data: cameras } = useCameras();
  const { data: ambulances } = useAmbulances();

  console.log("ambulances: ", ambulances);
  const [selection, setSelection] = useState<DrawerSelection | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeTab, setActiveTab] = useState<"map" | "events">("map");

  const seenEventIds = useRef(new Set<string>());

  // Notify on new high-severity events.
  useEffect(() => {
    const newAlerts: NotificationItem[] = [];

    events.forEach((event) => {
      if (
        isEmergencySeverity(event.severity) &&
        !seenEventIds.current.has(event.id)
      ) {
        seenEventIds.current.add(event.id);
        const assignedAmbulance = ambulances.find(
          (ambulance) => ambulance.id === event.ambulance_id,
        );
        const etaMinutes = assignedAmbulance
          ? Math.max(1, Math.round(assignedAmbulance.eta_seconds / 60))
          : null;
        newAlerts.push({
          id: `alert-${event.id}`,
          type: "alert",
          message: `Emergency: ${event.title} • Severity ${event.severity}${
            etaMinutes ? ` • ETA ${etaMinutes} min` : ""
          }`,
          duration: 6000,
        });
      }
    });

    if (newAlerts.length) {
      setNotifications((prev) => [...newAlerts, ...prev].slice(0, 4));
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
        <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="relative flex flex-1 overflow-hidden">
          {activeTab === "map" ? (
            <>
              <main className="flex-1">
                <LifelineMap
                  selection={selection}
                  onSelect={(next) => setSelection(next)}
                />
              </main>
            </>
          ) : (
            <main className="flex-1 overflow-y-auto">
              <EventsPage
                onSelectEvent={(eventId) =>
                  setSelection({ type: "event", id: eventId })
                }
              />
            </main>
          )}

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
              <EventDrawer
                event={selectedEntity as Event}
                ambulances={ambulances}
              />
            )}

            {selection?.type === "camera" && selectedEntity && (
              <CameraDrawer camera={selectedEntity as Camera} />
            )}

            {selection?.type === "ambulance" && selectedEntity && (
              <AmbulanceDrawer ambulance={selectedEntity as Ambulance} />
            )}
          </Drawer>

          <NotificationStack
            items={notifications}
            onDismiss={(id) =>
              setNotifications((prev) => prev.filter((item) => item.id !== id))
            }
          />
        </div>
      </div>
    </div>
  );
}

export default App;
