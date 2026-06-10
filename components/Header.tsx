"use client";

import { useRouter } from "next/navigation";
import { BackIcon } from "./Icons";

export default function Header({
  title,
  subtitle,
  back = false,
  action,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  action?: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-zinc-100">
      <div className="flex items-center gap-2 px-4 h-14">
        {back && (
          <button
            onClick={() => router.back()}
            aria-label="بازگشت"
            className="-mr-2 w-9 h-9 flex items-center justify-center text-zinc-600 active:text-zinc-900"
          >
            <BackIcon className="w-6 h-6" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="font-bold text-zinc-900 truncate leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-zinc-400 truncate">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
    </header>
  );
}
