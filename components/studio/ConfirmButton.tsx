"use client";

import type { ReactNode } from "react";

/** A small form whose submit asks for confirmation first. */
export function ConfirmButton({ action, message, children }: { action: () => Promise<void>; message: string; children: ReactNode }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      <button className="btn btn-danger btn-sm">{children}</button>
    </form>
  );
}
