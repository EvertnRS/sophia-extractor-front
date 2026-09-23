import type { ReactNode } from "react";

interface FullScreenMessageProps {
  children: ReactNode;
}

export default function FullScreenMessage({ children }: FullScreenMessageProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FCFBFA] text-[#4A3534]">
      {children}
    </div>
  );
}