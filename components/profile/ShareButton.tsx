"use client";

import { useState } from "react";
import { CheckIcon, ShareIcon } from "../icons";

/** Native share sheet where available, otherwise copy the link. */
export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.href.split("?")[0];
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // Dismissing the share sheet isn't an error worth surfacing.
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm transition-colors hover:border-primary/50"
    >
      {copied ? <CheckIcon className="size-4 text-success" /> : <ShareIcon className="size-4" />}
      <span aria-live="polite">{copied ? "Link copied" : "Share"}</span>
    </button>
  );
}
