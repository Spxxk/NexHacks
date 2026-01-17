import { Marker } from "react-map-gl/maplibre";
import type { EventItem } from "../../types";

type EventMarkerProps = {
  event: EventItem;
  isSelected: boolean;
  isRelated: boolean;
  onSelect: () => void;
  onHover: (value: { label: string; lng: number; lat: number } | null) => void;
};

/**
 * Marker for emergency events with pulsing severity ring.
 */
export default function EventMarker({
  event,
  isSelected,
  isRelated,
  onSelect,
  onHover,
}: EventMarkerProps) {
  const severityGlow = event.severity >= 4 ? "bg-red-500" : "bg-red-400";
  const pulse = event.severity >= 4 ? "animate-ping" : "animate-pulse";

  return (
    <Marker longitude={event.location.lng} latitude={event.location.lat}>
      <button
        type="button"
        onClick={onSelect}
        onMouseEnter={() =>
          onHover({
            label: event.title,
            lng: event.location.lng,
            lat: event.location.lat,
          })
        }
        onMouseLeave={() => onHover(null)}
        className="relative flex h-10 w-10 items-center justify-center"
        aria-label={event.title}
      >
        <span
          className={`absolute inline-flex h-10 w-10 rounded-full opacity-30 ${severityGlow} ${pulse}`}
        />
        <span
          className={`relative flex h-8 w-8 items-center justify-center rounded-full border ${
            isSelected
              ? "border-white bg-red-500"
              : isRelated
                ? "border-red-300/70 bg-red-500/80"
                : "border-red-300/40 bg-red-500/70"
          }`}
        >
          <span className="text-white">!</span>
        </span>
      </button>
    </Marker>
  );
}
