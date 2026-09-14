import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      {" "}
      <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        {/* 404 */}{" "}
        <p className="text-6xl font-bold tracking-tight text-gray-900">404 </p>
        {/* Title */}
        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          Page Not Found
        </h1>
        {/* Message */}
        <p className="mt-3 text-gray-600">
          Sorry, we couldn&apos;t find the page you&apos;re looking for.
        </p>
        {/* Buttons */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="rounded-lg bg-gray-900 px-5 py-2.5 font-medium text-white transition hover:bg-gray-800"
          >
            Go Home
          </Link>

          <Link
            href="/dashboard"
            className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 transition hover:bg-gray-100"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
