'use client';

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 border-4 border-[var(--accent)]/20 rounded-full" />
        <div className="absolute inset-0 border-4 border-transparent border-t-[var(--accent)] rounded-full animate-spin" />
      </div>
    </div>
  );
}

export function LoadingSkeleton({
  className = '',
}: {
  className?: string;
}) {
  return (
    <div
      className={`bg-gradient-to-r from-[var(--surface-secondary)] via-[var(--surface)] to-[var(--surface-secondary)] animate-pulse rounded-lg ${className}`}
    />
  );
}

export function LoadingCard() {
  return (
    <div className="p-6 border border-[var(--line)] rounded-lg space-y-4">
      <LoadingSkeleton className="h-4 w-24" />
      <LoadingSkeleton className="h-6 w-3/4" />
      <LoadingSkeleton className="h-4 w-full" />
      <LoadingSkeleton className="h-4 w-5/6" />
    </div>
  );
}

export function LoadingFormField() {
  return (
    <div className="space-y-2">
      <LoadingSkeleton className="h-4 w-24" />
      <LoadingSkeleton className="h-10 w-full" />
    </div>
  );
}

export function LoadingGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <LoadingCard key={i} />
      ))}
    </div>
  );
}

export function LoadingPageSkeleton() {
  return (
    <div className="space-y-12">
      <div className="space-y-4">
        <LoadingSkeleton className="h-6 w-32" />
        <LoadingSkeleton className="h-12 w-2/3" />
        <LoadingSkeleton className="h-4 w-full" />
        <LoadingSkeleton className="h-4 w-5/6" />
      </div>
      <LoadingGrid count={6} />
    </div>
  );
}

export function LoadingStatesDemo() {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Spinner</h3>
        <LoadingSpinner />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Card</h3>
        <LoadingCard />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Grid</h3>
        <LoadingGrid count={3} />
      </div>
    </div>
  );
}
