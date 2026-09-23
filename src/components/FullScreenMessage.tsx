import type { ReactNode } from "react";

interface FullScreenMessageProps {
  children: ReactNode;
}

export default function FullScreenMessage({ children }: FullScreenMessageProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream text-ink">
      {children}
    </div>
  );
}