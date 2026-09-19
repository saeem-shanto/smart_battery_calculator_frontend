"use client";

import { useEffect, useRef } from "react";
import { Trash2, X } from "lucide-react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div className="modal-backdrop confirm-backdrop" onMouseDown={() => { if (!busy) onCancel(); }}>
      <div
        className="modal-card confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 id="confirm-dialog-title">{title}</h2>
            <p id="confirm-dialog-message">{message}</p>
          </div>
          <button className="icon-button" type="button" onClick={onCancel} disabled={busy} aria-label="Close confirmation">
            <X size={20}/>
          </button>
        </div>
        <div className="modal-actions confirm-actions">
          <button ref={cancelRef} className="btn" type="button" onClick={onCancel} disabled={busy}>{cancelLabel}</button>
          <button className="btn btn-danger danger-solid" type="button" onClick={onConfirm} disabled={busy}>
            <Trash2 size={17}/> {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
