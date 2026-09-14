
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import TaskForm from "@/components/tasks/TaskForm";
import { apiFetch } from "@/lib/api";
import type { Task } from "@/types/task";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

function EditTaskContent() {
  const params = useParams();
  const router = useRouter();

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const taskId = params.id as string;

  useEffect(() => {
    async function loadTask() {
      try {
        setLoading(true);
        setError("");

        const data = await apiFetch(`/tasks/${taskId}`);

        console.log("TASK RESPONSE:", data);

        setTask(data.data.task);
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load task."
        );
      } finally {
        setLoading(false);
      }
    }

    if (taskId) {
      loadTask();
    }
  }, [taskId]);

if (loading) {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <LoadingSkeleton className="h-5 w-32" />

        <LoadingSkeleton className="mt-5 h-9 w-40" />

        <LoadingSkeleton className="mt-3 h-5 w-64" />

        <div className="mt-6 rounded-lg bg-white p-6 shadow">
          <LoadingSkeleton className="h-6 w-32" />

          <LoadingSkeleton className="mt-6 h-4 w-16" />
          <LoadingSkeleton className="mt-2 h-11 w-full" />

          <LoadingSkeleton className="mt-5 h-4 w-24" />
          <LoadingSkeleton className="mt-2 h-28 w-full" />

          <div className="mt-5 flex gap-3">
            <LoadingSkeleton className="h-11 w-28" />
            <LoadingSkeleton className="h-11 w-24" />
          </div>
        </div>
      </div>
    </main>
  );
}

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-2xl rounded-lg bg-white p-6 shadow">
          <h1 className="text-2xl font-bold text-black">
            Unable to load task
          </h1>

          <p className="mt-3 text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={() => router.push("/tasks")}
            className="mt-5 rounded-lg bg-gray-900 px-5 py-2 font-medium text-white hover:bg-gray-800"
          >
            Back to Tasks
          </button>
        </div>
      </main>
    );
  }

  if (!task) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => router.push("/tasks")}
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            ← Back to Tasks
          </button>

          <h1 className="mt-4 text-3xl font-bold text-black">
            Edit Task
          </h1>

          <p className="mt-2 text-gray-600">
            Update your task information.
          </p>
        </div>

        <TaskForm
          task={task}
          onSuccess={() => {
            router.push("/tasks");
          }}
          onCancel={() => {
            router.push("/tasks");
          }}
        />
      </div>
    </main>
  );
}

export default function EditTaskPage() {
  return (
    <ProtectedRoute>
      <EditTaskContent />
    </ProtectedRoute>
  );
}