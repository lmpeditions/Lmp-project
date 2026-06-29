/** Instant skeleton shown while an admin page's data loads (perceived fluidity). */
export default function AdminLoading() {
  return (
    <div className="space-y-6 p-1">
      <div className="space-y-2">
        <div className="h-7 w-64 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-80 animate-pulse rounded-md bg-muted/70" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl border border-border bg-muted/50" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl border border-border bg-muted/40" />
      <div className="h-48 animate-pulse rounded-xl border border-border bg-muted/40" />
    </div>
  );
}
