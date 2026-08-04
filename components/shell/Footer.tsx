export function Footer() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 text-xs text-fg-subtle sm:px-6">
        <p>
          Jobs Scanner Agents is a personal, local-first tool — job data and your saved/applied
          status stay in your browser and are never sent anywhere else. Listings are pulled
          directly from each company&apos;s own career site or public API. Not affiliated with,
          endorsed by, or sponsored by any company listed here.
        </p>
        <p className="mt-1">
          <a
            href="https://github.com/Natchaponsor/jobs-scanner-agents"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-strong hover:underline"
          >
            View source on GitHub
          </a>
        </p>
      </div>
    </footer>
  );
}
