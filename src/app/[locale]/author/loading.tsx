/** Instant skeleton shown while an author page's data loads (perceived fluidity). */
export default function AuthorLoading() {
  return (
    <div className="space-y-6 p-1">
      <div className="space-y-2">
        <div className="h-7 w-56 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-72 animate-pulse rounded-md bg-muted/70" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="h-56 animate-pulse rounded-xl border border-border bg-muted/40 lg:col-span-2" />
        <div className="h-56 animate-pulse rounded-xl border border-border bg-muted/40" />
      </div>
      <div className="h-40 animate-pulse rounded-xl border border-border bg-muted/40" />
    </div>
  );
}
