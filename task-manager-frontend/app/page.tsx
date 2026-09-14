"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import LogoutButton from "@/components/auth/LogoutButton";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    async function checkAuthentication() {
      try {
       await apiFetch("/users/me", {}, false);
        setIsLoggedIn(true);
      } catch {
        setIsLoggedIn(false);
      } finally {
        setCheckingAuth(false);
      }
    }

    checkAuthentication();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 text-gray-900">
      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-slate-200">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-900 text-lg font-bold text-white">
              T
            </div>

            <span className="text-xl font-bold tracking-tight text-gray-900">
              Task Manager
            </span>
          </Link>

          {/* Navigation */}
          {/* Navigation */}
          {checkingAuth ? (
            // Show skeleton while checking authentication
            <div className="flex items-center gap-3">
              <div className="h-10 w-16 animate-pulse rounded-lg bg-slate-300" />
              <div className="h-10 w-20 animate-pulse rounded-lg bg-slate-300" />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {/* Logged Out */}
              {!isLoggedIn && (
                <>
                  <Link
                    href="/login"
                    className="rounded-lg px-4 py-2 font-medium text-slate-700 transition hover:bg-white hover:text-gray-900"
                  >
                    Login
                  </Link>

                  <Link
                    href="/signup"
                    className="rounded-lg bg-gray-900 px-4 py-2 font-medium text-white shadow-sm transition hover:bg-gray-800"
                  >
                    Register
                  </Link>
                </>
              )}

              {/* Logged In */}
              {isLoggedIn && (
                <>
                  <Link
                    href="/dashboard"
                    className="rounded-lg px-4 py-2 font-medium text-slate-700 transition hover:bg-white hover:text-gray-900"
                  >
                    Dashboard
                  </Link>

                  <LogoutButton className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white shadow-sm transition hover:bg-red-700" />
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            {/* Small Label */}
            <div className="mb-6 inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
              Simple task management
            </div>

            {/* Heading */}
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Organize your tasks.
              <span className="block text-slate-500">Get things done.</span>
            </h1>

            {/* Description */}
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Task Manager helps you organize your daily tasks, track your
              progress, and stay focused on what matters.
            </p>

            {/* Get Started - Only Logged Out */}
            {!checkingAuth && !isLoggedIn && (
              <div className="mt-8">
                <Link
                  href="/signup"
                  className="inline-block rounded-lg bg-gray-900 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-gray-800"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-slate-200 bg-slate-100 px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900 text-white">
                ✓
              </div>

              <h2 className="text-lg font-semibold text-gray-900">
                Manage Tasks
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Create, edit, and delete tasks so everything stays organized in
                one place.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900 text-white">
                ✓
              </div>

              <h2 className="text-lg font-semibold text-gray-900">
                Track Progress
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Mark tasks as completed and easily see what still needs to be
                done.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900 text-white">
                ✓
              </div>

              <h2 className="text-lg font-semibold text-gray-900">
                Stay Organized
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Search, filter, and sort your tasks to quickly find exactly what
                you need.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 px-6 py-6">
        <div className="mx-auto max-w-7xl text-center">
          <p className="text-sm text-gray-400">
            © 2026 Task Manager. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
