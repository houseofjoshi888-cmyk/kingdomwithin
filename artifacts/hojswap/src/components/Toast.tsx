import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { explorerName, explorerTxUrl } from "@/lib/chains";

type ToastKind = "success" | "error" | "info";

type ToastItem = {
  id: string;
  kind: ToastKind;
  title: string;
  message?: string;
  txHash?: string;
  chainId?: number;
};

type ToastContextValue = {
  showToast: (toast: Omit<ToastItem, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((toast: Omit<ToastItem, "id">) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2"
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((t) => (
          <ToastView key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastView({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, toast.kind === "error" ? 8000 : 6000);
    return () => clearTimeout(timer);
  }, [onDismiss, toast.kind]);

  const border =
    toast.kind === "success"
      ? "border-emerald-500/35"
      : toast.kind === "error"
        ? "border-red-500/35"
        : "border-[rgba(212,175,55,0.35)]";

  const bg =
    toast.kind === "success"
      ? "bg-emerald-950/90"
      : toast.kind === "error"
        ? "bg-red-950/90"
        : "bg-[#121214]/95";

  return (
    <div
      className={`pointer-events-auto w-full max-w-md rounded-2xl border ${border} ${bg} px-4 py-3 shadow-2xl backdrop-blur-md`}
      role="status"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-white">{toast.title}</div>
          {toast.message ? (
            <div className="mt-0.5 text-xs text-white/70">{toast.message}</div>
          ) : null}
          {toast.txHash ? (
            <a
              href={explorerTxUrl(toast.chainId ?? 8453, toast.txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-xs font-medium text-[rgba(212,175,55,0.95)] underline-offset-2 hover:underline"
            >
              View on {explorerName(toast.chainId ?? 8453)} →
            </a>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-lg px-2 py-1 text-xs text-white/50 hover:bg-white/10 hover:text-white"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
