import { Marker } from "react-map-gl/maplibre";
import type { AmbulanceItem } from "../../types";

type AmbulanceMarkerProps = {
  ambulance: AmbulanceItem;
  isSelected: boolean;
  isRelated: boolean;
  onSelect: () => void;
  onHover: (value: { label: string; lng: number; lat: number } | null) => void;
};

/**
 * Marker for ambulances with subtle motion emphasis.
 */
export default function AmbulanceMarker({
  ambulance,
  isSelected,
  isRelated,
  onSelect,
  onHover,
}: AmbulanceMarkerProps) {
  return (
    <Marker
      longitude={ambulance.location.lng}
      latitude={ambulance.location.lat}
      className="transition-transform duration-700 ease-in-out"
    >
      <button
        type="button"
        onClick={onSelect}
        onMouseEnter={() =>
          onHover({
            label: ambulance.name,
            lng: ambulance.location.lng,
            lat: ambulance.location.lat,
          })
        }
        onMouseLeave={() => onHover(null)}
        className="relative flex h-9 w-9 items-center justify-center transition-transform duration-700"
        aria-label={ambulance.name}
      >
        <span
          className={`relative flex h-7 w-7 items-center justify-center rounded-full border ${
            isSelected
              ? "border-white bg-emerald-400"
              : isRelated
                ? "border-emerald-200/70 bg-emerald-400/80"
                : "border-emerald-200/40 bg-emerald-400/70"
          }`}
        >
          <span className="text-slate-950">🚑</span>
        </span>
      </button>
    </Marker>
  );
}
