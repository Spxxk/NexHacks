import type { Camera } from "../../types";

type CameraDrawerProps = {
  camera: Camera;
};

/**
 * Drawer content for a city camera.
 */
export default function CameraDrawer({ camera }: CameraDrawerProps) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-base font-semibold">Camera {camera.id}</p>
        <p className="text-xs text-slate-400">
          {camera.events.length} recorded events
        </p>
      </div>
      <img
        src={camera.url}
        alt="Camera snapshot"
        className="w-full rounded-2xl border border-white/10"
      />
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
          Recent Events
        </p>
        <ul className="space-y-2 text-xs text-slate-300">
          {camera.events.slice(0, 5).map((event) => (
            <li
              key={event.id}
              className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2"
            >
              {event.title}
            </li>
          ))}
          {camera.events.length === 0 && (
            <li className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-slate-500">
              No recent events.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
