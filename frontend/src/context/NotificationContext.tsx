import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type NotificationType = "success" | "error" | "warning" | "info";

interface Notification {
  id: number;
  message: string;
  type: NotificationType;
}

type NotificationListener = (notification: Notification) => void;

const listeners = new Set<NotificationListener>();
let nextNotificationId = 0;

export function notify(
  message: string,
  type: NotificationType = "info",
): void {
  const notification = { id: nextNotificationId++, message, type };
  listeners.forEach((listener) => listener(notification));
}

const NotificationContext = createContext<typeof notify>(notify);

const notificationStyles: Record<
  NotificationType,
  { title: string; icon: string; classes: string }
> = {
  success: {
    title: "Success",
    icon: "M5 13l4 4L19 7",
    classes: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  error: {
    title: "Something went wrong",
    icon: "M6 18L18 6M6 6l12 12",
    classes: "border-rose-200 bg-rose-50 text-rose-800",
  },
  warning: {
    title: "Attention",
    icon: "M12 9v4m0 4h.01M10.3 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.7 3.86a2 2 0 00-3.4 0z",
    classes: "border-amber-200 bg-amber-50 text-amber-900",
  },
  info: {
    title: "Information",
    icon: "M12 16v-4m0-4h.01M22 12a10 10 0 11-20 0 10 10 0 0120 0z",
    classes: "border-blue-200 bg-blue-50 text-blue-800",
  },
};

function NotificationCard({
  notification,
  onDismiss,
}: {
  notification: Notification;
  onDismiss: (id: number) => void;
}) {
  const style = notificationStyles[notification.type];

  useEffect(() => {
    const timeout = window.setTimeout(
      () => onDismiss(notification.id),
      notification.type === "error" ? 7000 : 5000,
    );
    return () => window.clearTimeout(timeout);
  }, [notification.id, notification.type, onDismiss]);

  return (
    <div
      role={notification.type === "error" ? "alert" : "status"}
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border p-4 shadow-lg ${style.classes}`}
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/80">
        <svg
          aria-hidden="true"
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={style.icon} />
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{style.title}</p>
        <p className="mt-1 break-words text-sm opacity-90">
          {notification.message}
        </p>
      </div>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(notification.id)}
        className="rounded-md p-1 opacity-70 transition hover:bg-black/5 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-current"
      >
        <svg
          aria-hidden="true"
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const listener: NotificationListener = (notification) => {
      setNotifications((current) => [...current, notification]);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const dismiss = (id: number) => {
    setNotifications((current) =>
      current.filter((notification) => notification.id !== id),
    );
  };

  return (
    <NotificationContext.Provider value={notify}>
      {children}
      <div
        aria-label="Notifications"
        className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-3 px-4 sm:inset-x-auto sm:right-4 sm:items-end sm:px-0"
      >
        {notifications.map((notification) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            onDismiss={dismiss}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
