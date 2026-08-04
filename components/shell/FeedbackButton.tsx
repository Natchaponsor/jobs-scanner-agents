"use client";

import { MessageCircle } from "lucide-react";

const ISSUES_URL = "https://github.com/Natchaponsor/jobs-scanner-agents/issues/new";

export function FeedbackButton() {
  return (
    <a
      href={ISSUES_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-accent-strong"
    >
      <MessageCircle className="h-4 w-4" />
      Feedback
    </a>
  );
}
