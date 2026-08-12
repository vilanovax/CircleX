import { NextResponse } from "next/server";
import { createPolishedListingDraft } from "@/lib/listing-polish";
import { suggestListingPrices } from "@/lib/price-suggest";
import type { ListingType } from "@/lib/types";

type Body = {
  text?: string;
  type?: ListingType;
  price?: number;
};

/**
 * Listing draft endpoint: always returns local polished draft + price hints.
 * If OPENAI_API_KEY is set, optionally rewrites title/description only (no new facts).
 */
export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "بدنه نامعتبر" }, { status: 400 });
  }

  const text = (body.text ?? "").trim();
  const type = body.type ?? "sale";
  if (text.length < 8) {
    return NextResponse.json(
      { error: "متن کوتاه است" },
      { status: 400 },
    );
  }

  let draft = createPolishedListingDraft({
    text,
    type,
    price: body.price,
  });
  let source: "local" | "openai" = "local";

  const key = process.env.OPENAI_API_KEY;
  if (key) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "You polish Persian marketplace listing copy for a trust-circle app. Return JSON {title, description, condition}. Do NOT invent dimensions, defects, washability, or specs not clearly in the user text. Keep description short (reason to sell / context). Title max 56 chars.",
            },
            {
              role: "user",
              content: JSON.stringify({
                text,
                type,
                current: {
                  title: draft.title,
                  description: draft.description,
                  condition: draft.condition,
                },
              }),
            },
          ],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const content = data?.choices?.[0]?.message?.content;
        const parsed = content ? JSON.parse(content) : null;
        if (parsed?.title && parsed?.description) {
          draft = {
            ...draft,
            title: String(parsed.title).slice(0, 80),
            description: String(parsed.description).slice(0, 500),
            condition: parsed.condition
              ? String(parsed.condition).slice(0, 40)
              : draft.condition,
          };
          source = "openai";
        }
      }
    } catch {
      // keep local
    }
  }

  const priceHints = suggestListingPrices({
    category: draft.category,
    type,
    text,
    condition: draft.condition,
  });

  return NextResponse.json({ draft, priceHints, source });
}
