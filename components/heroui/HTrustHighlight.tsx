"use client";

import Link from "next/link";
import { Chip } from "@heroui/react";
import type { Endorsement, TrustHop } from "@/lib/types";
import { useStore } from "@/lib/store";
import {
  endorsementHighlightLine,
  trustHighlightMessage,
  viewerRelationPhrase,
  type TrustContentKind,
} from "@/lib/trust";
import { levelShort } from "@/lib/labels";
import { ShieldCheckIcon } from "@/components/Icons";
import HAvatar from "./HAvatar";

/** HeroUI variant of TrustHighlight — the trust signal shown on cards. */
export default function HTrustHighlight({
  posterId,
  trustPath,
  endorsements = [],
  posterRole = "فروشنده",
  contentKind = "listing",
  variant = "default",
}: {
  posterId: string;
  trustPath: TrustHop[];
  endorsements?: Endorsement[];
  posterRole?: string;
  contentKind?: TrustContentKind;
  variant?: "default" | "compact";
}) {
  const { getPerson } = useStore();
  const trust = trustHighlightMessage(posterId, trustPath, getPerson, posterRole, contentKind);
  if (!trust) return null;
  const poster = getPerson(posterId);
  if (!poster) return null;

  const endorsementLine = endorsementHighlightLine(endorsements, getPerson, contentKind);
  const isOwn = posterId === "me";
  const ownRelation: Record<TrustContentKind, string> = {
    listing: "آگهی شما",
    request: "درخواست شما",
    event: "رویداد شما",
  };

  if (variant === "compact") {
    const relation = trust.subline ?? (isOwn ? ownRelation[contentKind] : viewerRelationPhrase(poster));
    const identity = (
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <HAvatar name={poster.name} level={isOwn ? undefined : poster.level} size="sm" />
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{poster.name}</p>
          <p className={`text-[11px] truncate ${isOwn ? "text-default-500" : "text-primary"}`}>{relation}</p>
        </div>
      </div>
    );

    return (
      <div className="mb-2.5 pb-2 border-b border-divider">
        <div className="flex items-center gap-2 min-w-0">
          {isOwn ? identity : <Link href={`/person/${posterId}`} className="flex items-center gap-2 min-w-0 flex-1">{identity}</Link>}
          {!isOwn && poster.level && (
            <Chip size="sm" variant="flat" className="text-[10px] h-5">
              {levelShort[poster.level]}
            </Chip>
          )}
          <ShieldCheckIcon className="w-4 h-4 text-primary shrink-0" />
        </div>
        {endorsementLine && !isOwn && (
          <p className="text-[11px] font-medium text-success mt-1">✓ {endorsementLine}</p>
        )}
      </div>
    );
  }

  return (
    <div
      className={`rounded-medium border px-3 py-2.5 mb-2.5 ${
        isOwn ? "bg-content2 border-divider" : "bg-primary-50 border-primary-200"
      }`}
    >
      <div className="flex items-start gap-2.5">
        <ShieldCheckIcon className={`w-5 h-5 shrink-0 mt-0.5 ${isOwn ? "text-default-500" : "text-primary"}`} />
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-bold leading-snug ${isOwn ? "text-foreground" : "text-primary-700"}`}>
            {trust.headline}
          </p>
          {trust.subline && (
            <p className={`text-xs font-semibold mt-0.5 ${isOwn ? "text-default-500" : "text-primary"}`}>
              {trust.subline}
            </p>
          )}
          {endorsementLine && !isOwn && (
            <p className="text-[11px] font-medium text-success mt-1.5">✓ {endorsementLine}</p>
          )}
        </div>
      </div>
    </div>
  );
}
