/**
 * First-session activation path — derived from real data, not click ticks.
 * Cold: profile → first live member → first listing.
 * Invitee: profile → place who added you → first listing.
 */

export const ACTIVATION_DISMISSED_KEY = "circle-activation-dismissed-v1";
export const ACTIVATION_LISTING_SKIP_KEY = "circle-activation-listing-skip-v1";

export type ActivationStepId = "profile" | "first_member" | "first_listing";

export type ActivationStepStatus =
  | "done"
  | "current"
  | "upcoming"
  | "waiting";

export type ActivationPathKind = "cold" | "invitee";

export type ActivationStep = {
  id: ActivationStepId;
  status: ActivationStepStatus;
  title: string;
  detail: string;
};

export type ActivationInput = {
  profileDone: boolean;
  circleCount: number;
  /** Active own listings (not inactive). */
  listingCount: number;
  hasPendingInvite: boolean;
  addedYouCount: number;
  /** User hid the path after finishing / soft-skip listing. */
  dismissed: boolean;
  listingSkipped: boolean;
};

export type ActivationState = {
  visible: boolean;
  complete: boolean;
  path: ActivationPathKind;
  steps: ActivationStep[];
  currentId: ActivationStepId | null;
  doneCount: number;
  total: number;
  /** Short line under the progress header. */
  headline: string;
};

const TOTAL = 3;

export function isActivationDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(ACTIVATION_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function markActivationDismissed(): void {
  try {
    localStorage.setItem(ACTIVATION_DISMISSED_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function isActivationListingSkipped(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(ACTIVATION_LISTING_SKIP_KEY) === "1";
  } catch {
    return false;
  }
}

export function markActivationListingSkipped(): void {
  try {
    localStorage.setItem(ACTIVATION_LISTING_SKIP_KEY, "1");
    localStorage.setItem(ACTIVATION_DISMISSED_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function clearActivationTips(): void {
  try {
    localStorage.removeItem(ACTIVATION_DISMISSED_KEY);
    localStorage.removeItem(ACTIVATION_LISTING_SKIP_KEY);
  } catch {
    /* ignore */
  }
}

export function getActivationState(input: ActivationInput): ActivationState {
  const path: ActivationPathKind =
    input.addedYouCount > 0 && input.circleCount === 0 ? "invitee" : "cold";

  const profileDone = input.profileDone;
  const memberDone = input.circleCount > 0;
  const listingDone = input.listingCount > 0 || input.listingSkipped;

  const dataComplete = profileDone && memberDone && input.listingCount > 0;
  const complete =
    input.dismissed ||
    dataComplete ||
    (profileDone && memberDone && input.listingSkipped);

  const steps: ActivationStep[] = [
    stepProfile(profileDone, memberDone, listingDone),
    stepMember(path, profileDone, memberDone, listingDone, input),
    stepListing(profileDone, memberDone, listingDone, input.listingSkipped),
  ];

  let currentId: ActivationStepId | null = null;
  for (const step of steps) {
    if (step.status === "current" || step.status === "waiting") {
      currentId = step.id;
      break;
    }
  }

  const doneCount = steps.filter((s) => s.status === "done").length;
  const visible = profileDone && !complete;

  return {
    visible,
    complete,
    path,
    steps,
    currentId,
    doneCount,
    total: TOTAL,
    headline: headlineFor(path, currentId, input),
  };
}

function stepProfile(
  profileDone: boolean,
  memberDone: boolean,
  listingDone: boolean,
): ActivationStep {
  if (profileDone) {
    return {
      id: "profile",
      status: "done",
      title: "معرفی خودت",
      detail: "نام و تصویر ثبت شد",
    };
  }
  return {
    id: "profile",
    status: !memberDone && !listingDone ? "current" : "upcoming",
    title: "معرفی خودت",
    detail: "اسمت را بگذار تا دعوت معتبر باشد",
  };
}

function stepMember(
  path: ActivationPathKind,
  profileDone: boolean,
  memberDone: boolean,
  listingDone: boolean,
  input: ActivationInput,
): ActivationStep {
  if (memberDone) {
    return {
      id: "first_member",
      status: "done",
      title: path === "invitee" ? "جا در حلقه" : "اولین نفر در حلقه",
      detail: "حلقه‌ات دیگر خالی نیست",
    };
  }

  if (!profileDone) {
    return {
      id: "first_member",
      status: "upcoming",
      title: path === "invitee" ? "جا در حلقه" : "اولین نفر در حلقه",
      detail:
        path === "invitee"
          ? "کسی که دعوتت کرد را در حلقه‌ات بگذار"
          : "یک نفر که می‌شناسی باید بپیوندد",
    };
  }

  if (path === "invitee") {
    return {
      id: "first_member",
      status: "current",
      title: "جا در حلقه",
      detail: "کسی که دعوتت کرد را در حلقه‌ات بگذار",
    };
  }

  if (input.hasPendingInvite) {
    return {
      id: "first_member",
      status: "waiting",
      title: "اولین نفر در حلقه",
      detail: "دعوت ارسال شد — منتظر پیوستن باش",
    };
  }

  return {
    id: "first_member",
    status: "current",
    title: "اولین نفر در حلقه",
    detail: "لینک را برای نزدیک‌ترین نفر بفرست",
  };
}

function stepListing(
  profileDone: boolean,
  memberDone: boolean,
  listingDone: boolean,
  listingSkipped: boolean,
): ActivationStep {
  if (listingDone) {
    return {
      id: "first_listing",
      status: "done",
      title: "اولین آگهی",
      detail: listingSkipped ? "بعداً می‌گذاری" : "آگهی‌ات آماده‌ست",
    };
  }

  if (!profileDone || !memberDone) {
    return {
      id: "first_listing",
      status: "upcoming",
      title: "اولین آگهی",
      detail: "چیزی بگذار که حلقه‌ات ببیند",
    };
  }

  return {
    id: "first_listing",
    status: "current",
    title: "اولین آگهی",
    detail: "الان حلقه‌ات می‌تواند آگهی‌ات را ببیند",
  };
}

function headlineFor(
  path: ActivationPathKind,
  currentId: ActivationStepId | null,
  input: ActivationInput,
): string {
  if (currentId === "first_member") {
    if (path === "invitee") {
      return "حلقه دوطرفه است — جایش را مشخص کن";
    }
    if (input.hasPendingInvite) {
      return "تا نپیوندد فید خالی می‌ماند — عادی است";
    }
    return "تا اولین نفر نپیوندد فید خالی است";
  }
  if (currentId === "first_listing") {
    return "یک آگهی بگذار تا حلقه فقط اسم نباشد";
  }
  return "چند قدم تا حلقه‌ات زنده شود";
}
