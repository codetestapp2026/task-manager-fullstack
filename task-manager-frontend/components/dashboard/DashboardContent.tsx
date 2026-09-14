"use client";

import { useEffect, useState } from "react";
import type { User } from "@/types/user";
import type { Task } from "@/types/task";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { DashboardSkeleton } from "@/components/ui/LoadingSkeleton";
import LogoutButton from "@/components/auth/LogoutButton";

export default function DashboardContent() {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        // Get logged-in user
        const userData = await apiFetch("/users/me");

        // Get user's tasks
        const taskData = await apiFetch("/tasks");

        console.log("USER DATA:", userData);

        setUser(userData.data.user);

        setTasks(taskData.data?.tasks || taskData.tasks || []);
      } catch (err) {
        console.error(err);

        setError("Unable to load dashboard.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-100 p-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>

        <p className="mt-4 text-red-600">{error}</p>

        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-md bg-gray-800 px-4 py-2 text-white hover:bg-gray-900"
        >
          Try Again
        </button>
      </main>
    );
  }

  const totalTasks = tasks.length;

  const completedTasks = tasks.filter((task) => task.completed).length;

  const pendingTasks = totalTasks - completedTasks;

  return (
    <main className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-slate-200">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Left - Logo + Navigation */}
          <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:items-center sm:gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-900 text-lg font-bold text-white">
                T
              </div>

              <span className="text-xl font-bold tracking-tight text-gray-900">
                Task Manager
              </span>
            </Link>

            <Link
              href="/tasks"
              className="rounded-md bg-green-600 px-4 py-2 font-medium text-white shadow-sm transition hover:bg-green-700"
            >
              Tasks
            </Link>
          </div>

          {/* Right - Logout */}
          <LogoutButton className="w-full rounded-md bg-red-600 px-4 py-2 font-medium text-white shadow-sm transition hover:bg-red-700 sm:w-auto" />
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="mx-auto max-w-7xl p-6">
        {/* Welcome */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>

          {user && (
            <div className="mt-4">
              <h2 className="text-xl font-semibold text-black">
                Welcome, {user.name}!
              </h2>
            </div>
          )}
        </section>

        {/* Statistics */}
        <section className="mt-6 grid gap-6 md:grid-cols-3">
          {/* Total */}
          <div className="rounded-xl border border-blue-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-blue-600">Total Tasks</h3>

            <p className="mt-2 text-4xl font-bold text-gray-800">
              {totalTasks}
            </p>

            <p className="mt-2 text-sm text-gray-500">All your tasks</p>
          </div>

          {/* Completed */}
          <div className="rounded-xl border border-green-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-green-600">Completed</h3>

            <p className="mt-2 text-4xl font-bold text-gray-800">
              {completedTasks}
            </p>

            <p className="mt-2 text-sm text-gray-500">Tasks you completed</p>
          </div>

          {/* Pending */}
          <div className="rounded-xl border border-orange-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-orange-600">Pending</h3>

            <p className="mt-2 text-4xl font-bold text-gray-800">
              {pendingTasks}
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Tasks waiting to be completed
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
