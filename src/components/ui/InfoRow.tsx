import { ReactNode } from "react";

interface InfoRowProps {
  label: string;
  value?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
}

export default function InfoRow({
  label,
  value,
  icon,
  action,
}: InfoRowProps) {
  if (!value && !action) return null;

  return (
    <div className="flex items-start gap-3">
      {icon && (
        <div className="mt-1 text-gray-400">
          {icon}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
          {label}
        </p>

        <div className="mt-1 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="break-words text-sm font-medium text-gray-900">
              {value}
            </p>
          </div>

          {action}
        </div>
      </div>
    </div>
  );
}