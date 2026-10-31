import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface ConfirmationOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

interface ConfirmationRequest extends ConfirmationOptions {
  id: number;
}

type ConfirmAction = (options: ConfirmationOptions) => Promise<boolean>;

const ConfirmationContext = createContext<ConfirmAction | null>(null);

export function ConfirmationProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<ConfirmationRequest[]>([]);
  const resolvers = useRef(new Map<number, (confirmed: boolean) => void>());
  const nextId = useRef(0);
  const activeRequest = requests[0];

  const confirm = useCallback<ConfirmAction>((options) => {
    const id = nextId.current++;
    return new Promise<boolean>((resolve) => {
      resolvers.current.set(id, resolve);
      setRequests((current) => [...current, { ...options, id }]);
    });
  }, []);

  const settle = useCallback((id: number, confirmed: boolean) => {
    const resolve = resolvers.current.get(id);
    if (!resolve) return;

    resolvers.current.delete(id);
    setRequests((current) => current.filter((request) => request.id !== id));
    resolve(confirmed);
  }, []);

  useEffect(() => {
    if (!activeRequest) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        settle(activeRequest.id, false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeRequest, settle]);

  return (
    <ConfirmationContext.Provider value={confirm}>
      {children}
      {activeRequest && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              settle(activeRequest.id, false);
            }
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirmation-title"
            aria-describedby="confirmation-message"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-black/5"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <svg
                aria-hidden="true"
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 9v4m0 4h.01M10.3 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.7 3.86a2 2 0 00-3.4 0z" />
              </svg>
            </div>
            <h2
              id="confirmation-title"
              className="mt-4 text-lg font-semibold text-slate-900"
            >
              {activeRequest.title}
            </h2>
            <p
              id="confirmation-message"
              className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600"
            >
              {activeRequest.message}
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                autoFocus
                onClick={() => settle(activeRequest.id, false)}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {activeRequest.cancelLabel ?? "Cancel"}
              </button>
              <button
                type="button"
                onClick={() => settle(activeRequest.id, true)}
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {activeRequest.confirmLabel ?? "Confirm"}
              </button>
            </div>
          </section>
        </div>
      )}
    </ConfirmationContext.Provider>
  );
}

export function useConfirmation() {
  const confirm = useContext(ConfirmationContext);
  if (!confirm) {
    throw new Error(
      "useConfirmation must be used within a ConfirmationProvider.",
    );
  }
  return confirm;
}
