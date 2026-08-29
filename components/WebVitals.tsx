"use client";

import { useReportWebVitals } from "next/web-vitals";
import { withBasePath } from "@/lib/avatar";

type Metric = {
  id: string;
  name: string;
  value: number;
  rating?: string;
  navigationType?: string;
};

function postVitals(metric: Metric) {
  const body = JSON.stringify({
    id: metric.id,
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    navigationType: metric.navigationType,
    path: typeof location !== "undefined" ? location.pathname : "",
    connection:
      typeof navigator !== "undefined"
        ? (navigator as Navigator & {
            connection?: { effectiveType?: string };
          }).connection?.effectiveType
        : undefined,
  });
  const url = withBasePath("/api/vitals");
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        url,
        new Blob([body], { type: "application/json" }),
      );
      return;
    }
  } catch {
    // fall through
  }
  void fetch(url, {
    method: "POST",
    body,
    headers: { "Content-Type": "application/json" },
    keepalive: true,
  }).catch(() => {});
}

export default function WebVitals() {
  useReportWebVitals((metric) => {
    postVitals({
      id: metric.id,
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      navigationType: metric.navigationType,
    });
  });
  return null;
}
