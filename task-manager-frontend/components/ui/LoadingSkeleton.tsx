
"use client";

type LoadingSkeletonProps = {
  className?: string;
};

export function LoadingSkeleton({
  className = "",
}: LoadingSkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gray-200 ${className}`}
    />
  );
}

export function TaskCardSkeleton() {
  return (
    <div className="rounded-lg bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <LoadingSkeleton className="h-6 w-2/3" />

        <LoadingSkeleton className="h-6 w-20 rounded-full" />
      </div>

      {/* Description */}
      <div className="mt-4 space-y-2">
        <LoadingSkeleton className="h-4 w-full" />
        <LoadingSkeleton className="h-4 w-5/6" />
      </div>

      {/* Date */}
      <LoadingSkeleton className="mt-5 h-4 w-28" />

      {/* Buttons */}
      <div className="mt-5 flex gap-2">
        <LoadingSkeleton className="h-9 w-9" />
        <LoadingSkeleton className="h-9 w-9" />
      </div>
    </div>
  );
}

export function TaskListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <TaskCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <main className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-slate-200">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <LoadingSkeleton className="h-9 w-9" />
            <LoadingSkeleton className="h-6 w-36" />
          </div>

          <LoadingSkeleton className="h-10 w-24" />
        </div>
      </nav>

      {/* Content */}
      <div className="mx-auto max-w-7xl p-4 sm:p-6">
        {/* Welcome */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <LoadingSkeleton className="h-9 w-40" />
          <LoadingSkeleton className="mt-5 h-6 w-52" />
        </section>

        {/* Statistics */}
        <section className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <LoadingSkeleton className="h-5 w-24" />
            <LoadingSkeleton className="mt-4 h-10 w-16" />
            <LoadingSkeleton className="mt-3 h-4 w-32" />
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <LoadingSkeleton className="h-5 w-24" />
            <LoadingSkeleton className="mt-4 h-10 w-16" />
            <LoadingSkeleton className="mt-3 h-4 w-32" />
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <LoadingSkeleton className="h-5 w-24" />
            <LoadingSkeleton className="mt-4 h-10 w-16" />
            <LoadingSkeleton className="mt-3 h-4 w-32" />
          </div>
        </section>
      </div>
    </main>
  );
}