"use client";

import { NavBar } from "./NavBar";
import { Footer } from "./Footer";
import { FeedbackButton } from "./FeedbackButton";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <NavBar />
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 pb-20 sm:px-6">{children}</main>
      <Footer />
      <FeedbackButton />
    </div>
  );
}
