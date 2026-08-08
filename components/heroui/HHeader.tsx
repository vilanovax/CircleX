"use client";

import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { BackIcon } from "@/components/Icons";

/** HeroUI variant of the shared page Header (sticky, optional back button). */
export default function HHeader({
  title,
  subtitle,
  back = false,
  fallbackHref = "/",
  action,
  children,
}: {
  title?: string;
  subtitle?: string;
  back?: boolean;
  fallbackHref?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const router = useRouter();

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }

  return (
    <header className="sticky top-0 z-20 bg-background/90 backdrop-blur border-b border-divider">
      <div className="flex items-center gap-2 px-4 h-14">
        {back && (
          <Button isIconOnly variant="light" size="sm" aria-label="بازگشت" onPress={handleBack} className="-ms-2">
            <BackIcon className="w-6 h-6" />
          </Button>
        )}
        <div className="min-w-0 flex-1">
          {children ?? (
            <>
              <h1 className="font-bold truncate leading-tight">{title}</h1>
              {subtitle && <p className="text-xs text-default-500 truncate">{subtitle}</p>}
            </>
          )}
        </div>
        {action}
      </div>
    </header>
  );
}
