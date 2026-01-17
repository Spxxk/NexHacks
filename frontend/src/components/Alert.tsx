import Button from "./Button";

type AlertItem = {
  id: string;
  title: string;
  description: string;
};

type AlertProps = {
  items: AlertItem[];
  onDismiss: (id: string) => void;
};

/**
 * Floating alert list for high-severity emergency notifications.
 */
export default function Alert({ items, onDismiss }: AlertProps) {
  if (!items.length) return null;

  return (
    <div className="pointer-events-none absolute right-6 top-20 z-20 flex w-[320px] flex-col gap-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="pointer-events-auto rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 shadow-lg backdrop-blur"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-red-100">{item.title}</p>
              <p className="text-xs text-red-200/80">{item.description}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-100 hover:text-white"
              onClick={() => onDismiss(item.id)}
            >
              Dismiss
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

export type { AlertItem };
