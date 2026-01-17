/* @react-compiler disable */
import { useMemo } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type CellContext,
  type ColumnDef,
  type HeaderGroup,
  type Row,
} from "@tanstack/react-table";
import { useEvents } from "../hooks/api";
import type { Event } from "../types";

const formatTimestamp = (timestamp?: string) => {
  if (!timestamp) return "—";
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? timestamp : date.toLocaleString();
};

/**
 * Events page displaying historical emergencies in a table.
 */
type EventsPageProps = {
  onSelectEvent?: (eventId: string) => void;
};

export default function EventsPage({ onSelectEvent }: EventsPageProps) {
  const { data: events, isLoading, isError, error, refetch } = useEvents();

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    });
  }, [events]);

  const columns = useMemo<ColumnDef<Event>[]>(
    () => [
      {
        header: "Event ID",
        accessorKey: "id",
        cell: (info: CellContext<Event, unknown>) => (
          <span className="font-semibold text-slate-100">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        header: "Severity",
        accessorKey: "severity",
        cell: (info: CellContext<Event, unknown>) => {
          const value = info.getValue() as Event["severity"];
          return (
            <span
              className={`rounded-full px-2 py-1 text-xs ${
                value === "emergency"
                  ? "bg-red-500/20 text-red-200"
                  : "bg-amber-500/20 text-amber-200"
              }`}
            >
              {value}
            </span>
          );
        },
      },
      {
        header: "Description",
        accessorKey: "description",
        cell: (info: CellContext<Event, unknown>) => (
          <span className="text-slate-300">{info.getValue() as string}</span>
        ),
      },
      {
        header: "Camera ID",
        accessorKey: "camera_id",
        cell: (info: CellContext<Event, unknown>) => (
          <span className="text-slate-300">{info.getValue() as string}</span>
        ),
      },
      {
        header: "Ambulance Assigned",
        accessorKey: "ambulance_id",
        cell: (info: CellContext<Event, unknown>) => (
          <span className="text-slate-300">
            {(info.getValue() as string | null) ?? "—"}
          </span>
        ),
      },
      {
        header: "Timestamp",
        accessorKey: "created_at",
        cell: (info: CellContext<Event, unknown>) => (
          <span className="text-slate-400">
            {formatTimestamp(info.getValue() as string | undefined)}
          </span>
        ),
      },
      {
        header: "Resolved",
        accessorKey: "status",
        cell: (info: CellContext<Event, unknown>) => (
          <span className="text-slate-300">
            {(info.getValue() as Event["status"]) === "resolved" ? "Yes" : "No"}
          </span>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: sortedEvents,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Past Events</h2>
          <p className="text-xs text-slate-400">
            Automatically refreshed every few seconds
          </p>
        </div>
        <button
          type="button"
          className="rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-200 hover:border-cyan-400/60"
          onClick={() => refetch()}
        >
          Refresh
        </button>
      </div>

      {isLoading && (
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-300">
          Loading events...
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
          {(error as Error)?.message ?? "Failed to load events."}
        </div>
      )}

      {!isLoading && !isError && (
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead className="bg-slate-900/60 text-left text-xs uppercase tracking-wider text-slate-400">
              {table
                .getHeaderGroups()
                .map((headerGroup: HeaderGroup<Event>) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="px-4 py-3">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
            </thead>
            <tbody className="divide-y divide-white/5 bg-slate-950">
              {table.getRowModel().rows.map((row: Row<Event>) => (
                <tr
                  key={row.id}
                  className="cursor-pointer hover:bg-slate-900/40"
                  onClick={() => onSelectEvent?.(row.original.id)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
