import { createContext, useCallback, useContext, useMemo, useState } from "react";
import "./Toast.css";

const ToastContext = createContext(null);

let nextId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message, tone = "info", ttl = 4000) => {
      const id = ++nextId;
      setToasts((prev) => [...prev, { id, message, tone }]);
      window.setTimeout(() => dismiss(id), ttl);
      return id;
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      toast: push,
      success: (m) => push(m, "success"),
      error: (m) => push(m, "error", 6000),
      info: (m) => push(m, "info"),
      dismiss
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="sc-toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`sc-toast sc-toast--${t.tone}`}>
            <span className="sc-toast__icon" aria-hidden="true">
              {t.tone === "success" ? "✓" : t.tone === "error" ? "!" : "i"}
            </span>
            <p className="sc-toast__msg">{t.message}</p>
            <button
              className="sc-toast__close"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside a <ToastProvider>");
  }
  return ctx;
}
