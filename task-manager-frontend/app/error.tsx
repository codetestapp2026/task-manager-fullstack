"use client";

import { useEffect } from "react";

type ErrorPageProps = {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      {" "}
      <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        {/* Error Icon */}{" "}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl">
          !{" "}
        </div>
        {/* Title */}
        <h1 className="mt-5 text-2xl font-bold text-gray-900">
          Something went wrong
        </h1>
        {/* Message */}
        <p className="mt-3 text-gray-600">
          We couldn&apos;t load this page correctly. Please try again.
        </p>
        {/* Try Again */}
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 rounded-lg bg-gray-900 px-5 py-2.5 font-medium text-white transition hover:bg-gray-800"
        >
          Try Again
        </button>
      </div>
    </main>
  );
}
