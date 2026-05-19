"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Toast = {
  id: string;
  title: string;
  description?: string;
};

type ModalState = {
  title: string;
  description?: string;
  content?: ReactNode;
} | null;

type FeedbackContextValue = {
  showToast: (toast: Omit<Toast, "id">) => void;
  openModal: (modal: NonNullable<ModalState>) => void;
  closeModal: () => void;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [modal, setModal] = useState<ModalState>(null);

  const showToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, ...toast }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 2800);
  }, []);

  const value = useMemo(
    () => ({
      showToast,
      openModal: (nextModal: NonNullable<ModalState>) => setModal(nextModal),
      closeModal: () => setModal(null),
    }),
    [showToast],
  );

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto rounded-2xl border border-border/70 bg-card/95 p-4 shadow-lg backdrop-blur"
          >
            <p className="font-medium">{toast.title}</p>
            {toast.description ? (
              <p className="mt-1 text-sm text-muted-foreground">{toast.description}</p>
            ) : null}
          </div>
        ))}
      </div>

      <div
        className={cn(
          "fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm transition",
          modal ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        {modal ? (
          <div className="w-full max-w-2xl rounded-[2rem] border border-border/70 bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-semibold">{modal.title}</h3>
                {modal.description ? (
                  <p className="mt-2 text-sm text-muted-foreground">{modal.description}</p>
                ) : null}
              </div>
              <Button variant="ghost" size="sm" onClick={() => setModal(null)}>
                <X className="size-4" />
              </Button>
            </div>
            <div className="mt-6">{modal.content}</div>
          </div>
        ) : null}
      </div>
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);

  if (!context) {
    throw new Error("useFeedback debe usarse dentro de FeedbackProvider.");
  }

  return context;
}
