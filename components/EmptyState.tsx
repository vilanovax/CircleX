export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}) {
  return (
    <div className="card p-6 text-center">
      <div className="w-14 h-14 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3 text-2xl">
        {icon}
      </div>
      <p className="font-bold text-sm text-zinc-800 dark:text-zinc-100">{title}</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
        {description}
      </p>
      <div className="flex flex-col gap-2 mt-4">
        <button type="button" onClick={onAction} className="btn-primary text-sm">
          {actionLabel}
        </button>
        {secondaryActionLabel && onSecondaryAction && (
          <button type="button" onClick={onSecondaryAction} className="btn-ghost text-sm">
            {secondaryActionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
