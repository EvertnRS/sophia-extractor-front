interface ProgressBarProps {
  progress: number;
  status: string;
  message?: string | null;
  error?: string | null;
}

export default function ProgressBar({
  progress,
  status,
  message,
  error,
}: ProgressBarProps) {
  const color =
    status === "completed"
      ? "bg-green-500"
      : status === "failed"
      ? "bg-red-500"
      : "bg-[#4A3534]";

  const label =
    status === "completed"
      ? "Concluída"
      : status === "failed"
      ? "Falhou"
      : status === "processing"
      ? "Em processamento"
      : status === "pending"
      ? "Na fila"
      : status;

  return (
    <div className="mt-8 rounded-2xl border border-[#E8C8C5] bg-[#FCFBFA] p-5">
      <div className="mb-3 flex items-center justify-between gap-4 text-sm text-gray-600">
        <span className="font-medium text-[#4A3534]">{label}</span>
        <span>{Math.min(100, Math.max(0, progress))}%</span>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-gray-200">
        <div
          className={`${color} h-full rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>

      {(message || error) && (
        <p
          className={`mt-4 text-sm ${
            error ? "text-red-600" : "text-gray-600"
          }`}
        >
          {error || message}
        </p>
      )}
    </div>
  );
}